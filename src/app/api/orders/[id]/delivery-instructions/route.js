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
    const { slot, instructions, leaveAtDoor, callBeforeDelivery } = body;

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

    order.deliveryPreferences = {
      slot: slot || 'Anytime (9 AM - 8 PM)',
      instructions: instructions || '',
      leaveAtDoor: Boolean(leaveAtDoor),
      callBeforeDelivery: callBeforeDelivery !== false
    };

    if (!order.trackingHistory) order.trackingHistory = [];
    order.trackingHistory.push({
      status: order.status,
      timestamp: new Date(),
      location: order.shippingAddress?.city || 'In Transit',
      comment: `Delivery instructions updated: Slot "${order.deliveryPreferences.slot}". ${instructions ? `Note: ${instructions}` : ''}`
    });

    await order.save();

    return NextResponse.json({
      success: true,
      message: 'Delivery preferences updated successfully',
      order
    });
  } catch (error) {
    console.error('Error updating delivery preferences:', error);
    return NextResponse.json({ error: error.message || 'Failed to update preferences' }, { status: 500 });
  }
}
