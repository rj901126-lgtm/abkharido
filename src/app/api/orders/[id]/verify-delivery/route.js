import { findOrder, ownsOrder, sellerOwnsOrder, requireFulfillable, creditDeliveredReferral } from '../../financialSecurity.js';
import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/connectDB.js';
import Order from '../../../../../../server/models/Order.js';
import { getAuthenticatedUser } from '../../../../../lib/serverAuth.js';

export const dynamic = 'force-dynamic';

/**
 * Secure Doorstep Delivery PIN Verification Engine
 * Verifies the 4-digit PIN provided by the customer to complete delivery safely.
 */
export async function POST(req, context) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth?.isAuthenticated) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    await connectDB();
    const params = await (context?.params || {});
    const id = params?.id;
    const body = await req.json().catch(() => ({}));
    const { pin } = body;

    if (!pin) {
      return NextResponse.json({ error: 'Delivery PIN is required' }, { status: 400 });
    }

    let order = await findOrder(id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (!auth.isAdmin && !sellerOwnsOrder(auth, order)) return NextResponse.json({ error: 'Administrator or Seller delivery verification required' }, { status: 403 });
    requireFulfillable(order);
    const { checkRouteRateLimit } = await import('../../../../../lib/rateLimiter.js');
    const attempts = checkRouteRateLimit('delivery-pin', String(auth.user?.id || auth.user?._id) + ':' + String(order._id), 5, 15 * 60000);
    if (!attempts.allowed) return NextResponse.json({ error: 'Too many PIN attempts' }, { status: 429 });
    if (!order.deliveryPin) {
      return NextResponse.json({ 
        error: 'No Doorstep PIN configured for this order. Please use standard delivery verification.',
        matched: false 
      }, { status: 400 });
    }

    const expectedPin = String(order.deliveryPin).trim();
    const enteredPin = String(pin).trim();

    if (enteredPin !== expectedPin && enteredPin !== expectedPin.slice(-4)) {
      return NextResponse.json({ 
        error: 'Invalid Delivery PIN. Please ask the customer for the correct Doorstep PIN.',
        matched: false 
      }, { status: 400 });
    }

    // Success — mark delivered & attest COD collection if COD
    order.status = 'Delivered';
    order.isDelivered = true;
    order.deliveredAt = new Date();
    if (/cod|cash on delivery/i.test(order.paymentMethod)) {
      order.isPaid = true;
      order.paidAt = order.paidAt || new Date();
      order.cashCollectionVerified = true;
      order.paymentResult = {
        id: `cash_${order._id}`,
        status: 'CASH_COLLECTION_ATTESTED',
        update_time: new Date().toISOString()
      };
    }

    if (!order.trackingHistory) order.trackingHistory = [];
    order.trackingHistory.push({
      status: 'Delivered',
      timestamp: new Date(),
      location: order.shippingAddress?.city || 'Customer Address',
      comment: `Delivered successfully to customer. Verified with Secure Doorstep PIN.`
    });

    await order.save();
    if (order.status === 'Delivered') await creditDeliveredReferral(order._id);

    return NextResponse.json({
      success: true,
      message: 'Delivery verified successfully with Secure PIN',
      orderStatus: 'Delivered',
      deliveredAt: order.deliveredAt
    });

  } catch (error) {
    console.error('Error verifying delivery PIN:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to verify delivery PIN' 
    }, { status: 500 });
  }
}
