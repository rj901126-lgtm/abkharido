import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/connectDB.js';
import Order from '../../../../../../server/models/Order.js';
import User from '../../../../../../server/models/User.js';
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
    if (!isOwner && !auth.isAdmin) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to modify this order' }, { status: 403 });
    }

    if (order.isPaid) {
      return NextResponse.json({ error: 'Order is already prepaid' }, { status: 400 });
    }

    if (['cancelled', 'delivered'].includes((order.status || '').toLowerCase())) {
      return NextResponse.json({ error: `Cannot convert payment for ${order.status} order` }, { status: 400 });
    }

    order.paymentMethod = 'Online Payment (Prepaid)';
    order.isPaid = true;
    order.paidAt = new Date();

    if (!order.trackingHistory) order.trackingHistory = [];
    order.trackingHistory.push({
      status: order.status,
      timestamp: new Date(),
      location: order.shippingAddress?.city || 'Billing Hub',
      comment: 'Converted to Prepaid online payment. Contactless delivery activated.'
    });

    await order.save();

    // Credit 50 bonus AB Coins to user
    if (order.user) {
      try {
        await User.updateOne({ _id: order.user }, { $inc: { walletCoins: 50 } });
      } catch (err) {
        console.error('[Coin bonus error]:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Order converted to Prepaid successfully! 50 AB Coins credited to your wallet.',
      order
    });
  } catch (error) {
    console.error('Error converting order to prepaid:', error);
    return NextResponse.json({ error: error.message || 'Failed to convert payment mode' }, { status: 500 });
  }
}
