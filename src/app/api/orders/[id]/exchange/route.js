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
    const { requestedSize, reason, notes } = body;

    if (!requestedSize) {
      return NextResponse.json({ error: 'Replacement size or variant is required' }, { status: 400 });
    }

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

    if ((order.status || '').toLowerCase() !== 'delivered') {
      return NextResponse.json({ error: 'Exchange requests can only be placed for delivered orders' }, { status: 400 });
    }

    order.status = 'Exchange Requested';
    order.exchangeDetails = {
      requestedSize,
      reason: reason || 'Size/Fit issue',
      notes: notes || '',
      requestedAt: new Date()
    };

    if (!order.trackingHistory) order.trackingHistory = [];
    order.trackingHistory.push({
      status: 'Exchange Requested',
      timestamp: new Date(),
      location: order.shippingAddress?.city || 'Returns Hub',
      comment: `Exchange requested: ${reason || 'Size issue'} (Replacement Size: ${requestedSize}). Pickup scheduled.`
    });

    await order.save();

    return NextResponse.json({
      success: true,
      message: 'Exchange request submitted successfully. Free doorstep pickup scheduled.',
      order
    });
  } catch (error) {
    console.error('Error creating exchange request:', error);
    return NextResponse.json({ error: error.message || 'Failed to submit exchange request' }, { status: 500 });
  }
}
