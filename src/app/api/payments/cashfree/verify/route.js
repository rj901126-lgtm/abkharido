import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '../../../../../lib/connectDB.js';
import Order from '../../../../../../server/models/Order.js';
import Product from '../../../../../../server/models/Product.js';
import User from '../../../../../../server/models/User.js';
import { getCashfreeOrderStatus } from '../../../../../lib/cashfree.js';
import { getAuthenticatedUser } from '../../../../../lib/serverAuth.js';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const { checkRouteRateLimit } = await import('../../../../../lib/rateLimiter.js');
    const limit = checkRouteRateLimit('payment-verify', ip, 20, 5 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        { success: false, status: 'RATE_LIMITED', message: 'Too many verification attempts. Please wait.' },
        { status: 429, headers: { 'Cache-Control': 'private, no-store' } }
      );
    }

    await connectDB();
    const body = await req.json().catch(() => ({}));
    const { orderId } = body;

    // Generic response for unknown, unauthorized, or unpaid states to prevent ID enumeration
    const genericPendingResponse = () => NextResponse.json(
      { success: false, status: 'PENDING', message: 'Payment verification pending.' },
      { status: 200, headers: { 'Cache-Control': 'private, no-store' } }
    );

    if (!orderId || typeof orderId !== 'string') {
      return genericPendingResponse();
    }

    // 1. Require authentication for server-to-server verify calls
    const auth = await getAuthenticatedUser(req);
    if (!auth?.isAuthenticated) {
      return genericPendingResponse();
    }

    // 2. Fetch order safely without arbitrary ObjectId casting
    const isObjId = mongoose.Types.ObjectId.isValid(orderId) && /^[0-9a-fA-F]{24}$/.test(orderId);
    const orderQuery = {
      $or: [
        { cfOrderId: orderId },
        ...(isObjId ? [{ _id: orderId }] : [])
      ]
    };

    const order = await Order.findOne(orderQuery);
    if (!order) {
      return genericPendingResponse();
    }

    // 3. Ownership check: caller must own order or be admin
    const requesterId = String(auth.user?.id || auth.user?._id || '');
    const orderUserId = String(order.user || '');
    const isOwner = (requesterId && orderUserId && requesterId === orderUserId) || 
                    (auth.user?.phone && order.shippingAddress?.phone && auth.user.phone === order.shippingAddress.phone);
    if (!isOwner && !auth.isAdmin) {
      return genericPendingResponse();
    }

    // 4. Idempotency: if already paid, return success without duplicate side-effects
    if (order.isPaid) {
      return NextResponse.json(
        { success: true, status: 'PAID', message: 'Order is already marked as paid' },
        { status: 200, headers: { 'Cache-Control': 'private, no-store' } }
      );
    }

    // 5. Query Cashfree PG server
    const cfData = await getCashfreeOrderStatus(order.cfOrderId || orderId);
    if (!cfData) {
      return genericPendingResponse();
    }

    // Production simulation path strictly disabled; simulation only allowed in test mode
    const isSandboxAllowed = process.env.CASHFREE_PROD !== 'true' && process.env.ALLOW_PAYMENT_SIMULATION === 'true';
    const isPaid = cfData.order_status === 'PAID' || (isSandboxAllowed && cfData.simulated === true);

    if (!isPaid) {
      return genericPendingResponse();
    }

    // 6. Compare amount and currency to stored order to prevent tampering
    const cfAmount = Number(cfData.order_amount);
    const expectedAmount = Number(order.totalPrice);
    if (Number.isFinite(cfAmount) && Math.abs(cfAmount - expectedAmount) > 0.01) {
      console.warn(`[Payment Verify Mismatch] Order ${order._id}: expected ₹${expectedAmount}, got ₹${cfAmount}`);
      return genericPendingResponse();
    }

    // 7. Atomic update: only mark paid if currently unpaid (eliminates race conditions)
    const updatedOrder = await Order.findOneAndUpdate(
      { _id: order._id, isPaid: false },
      {
        $set: {
          isPaid: true,
          paidAt: new Date(),
          status: 'Placed',
          paymentResult: {
            id: String(cfData.cf_payment_id || cfData.order_id || Date.now()),
            status: 'SUCCESS',
            update_time: new Date().toISOString()
          }
        },
        $push: {
          trackingHistory: {
            status: 'Payment Verified (PAID)',
            timestamp: new Date(),
            comment: 'Cashfree verified settlement.'
          }
        }
      },
      { new: true }
    );

    // If order was already flipped concurrently by webhook, return success without re-fulfilling
    if (!updatedOrder) {
      return NextResponse.json(
        { success: true, status: 'PAID', message: 'Order payment already verified.' },
        { status: 200, headers: { 'Cache-Control': 'private, no-store' } }
      );
    }

    // 8. Decrement stock safely under concurrency
    if (Array.isArray(order.orderItems)) {
      for (const item of order.orderItems) {
        if (item.product) {
          try {
            await Product.updateOne(
              { _id: item.product, stock: { $gte: item.qty } },
              { $inc: { stock: -item.qty, soldCount: item.qty } }
            );
          } catch (stockErr) {
            console.error('[Stock Decrement Error]:', stockErr.message);
          }
        }
      }
    }

    // 9. Clear user's cart in DB upon successful payment
    if (order.user) {
      try {
        await User.updateOne({ _id: order.user }, { $set: { cart: [] } });
      } catch (cartErr) {
        console.error('[Cart Clear Error]:', cartErr.message);
      }
    }

    return NextResponse.json(
      {
        success: true,
        status: 'PAID',
        message: 'Payment verified and order confirmed.'
      },
      { status: 200, headers: { 'Cache-Control': 'private, no-store' } }
    );

  } catch (error) {
    console.error('[Cashfree Verify API Error]:', error);
    // Generic error to avoid exposing Mongoose or system internals
    return NextResponse.json(
      { error: 'Payment verification service temporarily unavailable.' },
      { status: 500, headers: { 'Cache-Control': 'private, no-store' } }
    );
  }
}

// Browser return/redirect GET handler: READ-ONLY, NEVER marks paid
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('order_id') || searchParams.get('orderId');
    
    if (!orderId) {
      return NextResponse.json(
        { success: false, status: 'PENDING', message: 'Order ID is required.' },
        { status: 400, headers: { 'Cache-Control': 'private, no-store' } }
      );
    }

    await connectDB();
    const isObjId = mongoose.Types.ObjectId.isValid(orderId) && /^[0-9a-fA-F]{24}$/.test(orderId);
    const order = await Order.findOne({
      $or: [
        { cfOrderId: orderId },
        ...(isObjId ? [{ _id: orderId }] : [])
      ]
    }).select('status isPaid totalPrice cfOrderId createdAt').lean();

    if (!order) {
      return NextResponse.json(
        { success: false, status: 'PENDING', message: 'Payment verification pending.' },
        { status: 200, headers: { 'Cache-Control': 'private, no-store' } }
      );
    }

    return NextResponse.json(
      {
        success: Boolean(order.isPaid),
        status: order.isPaid ? 'PAID' : 'PENDING',
        orderId: order.cfOrderId || order._id
      },
      { status: 200, headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, status: 'PENDING', message: 'Payment check temporarily unavailable.' },
      { status: 500, headers: { 'Cache-Control': 'private, no-store' } }
    );
  }
}
