import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '../../../../../lib/connectDB.js';
import Order from '../../../../../../server/models/Order.js';
import { getAuthenticatedUser } from '../../../../../lib/serverAuth.js';
import { findOrder, ownsOrder, settleVerifiedPayment } from '../../../orders/financialSecurity.js';

export const dynamic = 'force-dynamic';

function genericPendingResponse() {
  return NextResponse.json(
    { success: false, status: 'PENDING', message: 'Payment verification pending.' },
    { status: 200, headers: { 'Cache-Control': 'private, no-store' } }
  );
}

export async function POST(req) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth?.isAuthenticated) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    await connectDB();
    const body = await req.json();
    const order = await findOrder(body.orderId || body.order_id);
    if (!order || (!auth.isAdmin && !ownsOrder(auth, order))) {
      return genericPendingResponse();
    }

    if (order.isPaid) {
      return NextResponse.json({
        success: true,
        status: 'PAID',
        orderId: order.cfOrderId || String(order._id),
        order: {
          _id: order._id,
          cfOrderId: order.cfOrderId,
          totalPrice: order.totalPrice,
          status: order.status,
          isPaid: true,
          deliveryPin: order.deliveryPin,
          paymentRewardsAmount: order.paymentRewardsAmount || 0,
          shippingAddress: order.shippingAddress
        }
      });
    }

    // Production simulation strictly prohibited
    const isSimulationAllowed = process.env.CASHFREE_PROD !== 'true' && process.env.ALLOW_PAYMENT_SIMULATION === 'true';

    // Atomic state transition prevents concurrent double-verification
    const lockedOrder = await Order.findOneAndUpdate(
      { _id: order._id, isPaid: false },
      { $set: { updatedAt: new Date() } },
      { new: true }
    );
    if (!lockedOrder) {
      return genericPendingResponse();
    }

    const settled = await settleVerifiedPayment(String(order._id));
    return NextResponse.json({
      success: true,
      status: 'PAID',
      orderId: settled.cfOrderId || String(settled._id),
      order: {
        _id: settled._id,
        cfOrderId: settled.cfOrderId,
        totalPrice: settled.totalPrice,
        status: settled.status,
        isPaid: Boolean(settled.isPaid),
        deliveryPin: settled.deliveryPin,
        paymentRewardsAmount: settled.paymentRewardsAmount || 0,
        shippingAddress: settled.shippingAddress
      }
    });
  } catch {
    return genericPendingResponse();
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('order_id') || searchParams.get('orderId');

    if (!orderId) {
      return genericPendingResponse();
    }

    await connectDB();
    const isObjId = mongoose.Types.ObjectId.isValid(orderId) && /^[0-9a-fA-F]{24}$/.test(orderId);
    let order = await Order.findOne({
      $or: [{ cfOrderId: orderId }, ...(isObjId ? [{ _id: orderId }] : [])]
    }).select('user status isPaid totalPrice cfOrderId deliveryPin paymentRewardsAmount shippingAddress createdAt');

    if (!order) {
      return genericPendingResponse();
    }

    const auth = await getAuthenticatedUser(req).catch(() => null);
    const isAuthorizedOwner = Boolean(auth?.isAuthenticated && (auth.isAdmin || ownsOrder(auth, order)));

    if (!isAuthorizedOwner) {
      return genericPendingResponse();
    }

    // If not yet marked paid in DB and requester is the authenticated owner, attempt live Cashfree verification
    if (!order.isPaid) {
      try {
        order = await settleVerifiedPayment(String(order._id));
      } catch {
        // Keep current order state if payment is still pending at gateway
      }
    }

    return NextResponse.json(
      {
        success: Boolean(order.isPaid),
        status: order.isPaid ? 'PAID' : 'PENDING',
        orderId: order.cfOrderId || String(order._id),
        order: {
          _id: order._id,
          cfOrderId: order.cfOrderId,
          totalPrice: order.totalPrice,
          status: order.status,
          isPaid: Boolean(order.isPaid),
          paymentRewardsAmount: order.paymentRewardsAmount || 0,
          deliveryPin: order.deliveryPin,
          shippingAddress: order.shippingAddress
        }
      },
      { status: 200, headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch {
    return genericPendingResponse();
  }
}
