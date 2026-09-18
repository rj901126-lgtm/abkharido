import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/connectDB.js';
import Order from '../../../../../../server/models/Order.js';
import { getAuthenticatedUser } from '../../../../../lib/serverAuth.js';

export const dynamic = 'force-dynamic';

export async function POST(req, context) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth?.isAuthenticated) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    await connectDB();
    const params = await (context?.params || {});
    const id = params?.id;

    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const { reason, refundDestination, status: returnStatus } = body;

    let order = null;
    if (/^[0-9a-fA-F]{24}$/.test(String(id))) {
      order = await Order.findById(id);
    }
    if (!order) {
      order = await Order.findOne({ $or: [{ cfOrderId: id }, { id }] });
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const isOwner = auth.user?._id && order.user && (String(auth.user._id) === String(order.user));
    if (!isOwner && !auth.isAdmin && !auth.isSeller) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to modify this order' }, { status: 403 });
    }

    // Admin updating return status
    if (returnStatus && (auth.isAdmin || auth.isSeller)) {
      order.status = returnStatus === 'Approved' ? 'Return Approved' : returnStatus;
      if (!order.trackingHistory) order.trackingHistory = [];
      order.trackingHistory.push({
        status: order.status,
        timestamp: new Date(),
        location: 'Returns Desk',
        comment: `Return status updated to ${order.status}`
      });
      await order.save();
      return NextResponse.json({ success: true, message: `Return status set to ${order.status}`, order });
    }

    // Customer requesting return
    if ((order.status || '').toLowerCase() !== 'delivered') {
      return NextResponse.json({ error: 'Returns can only be requested for delivered orders' }, { status: 400 });
    }

    order.status = 'Return Requested';
    order.returnReason = reason || 'Defective/Not as described';
    order.refundDestination = refundDestination || { type: 'Wallet' };

    if (!order.trackingHistory) order.trackingHistory = [];
    order.trackingHistory.push({
      status: 'Return Requested',
      timestamp: new Date(),
      location: order.shippingAddress?.city || 'Returns Desk',
      comment: `Return requested: ${order.returnReason}. Refund target: ${refundDestination?.type || 'Wallet'}`
    });

    await order.save();

    return NextResponse.json({
      success: true,
      message: 'Return request submitted successfully. Our courier will pick up within 2-3 business days.',
      order
    });
  } catch (error) {
    console.error('Error handling return request:', error);
    return NextResponse.json({ error: error.message || 'Failed to submit return request' }, { status: 500 });
  }
}
