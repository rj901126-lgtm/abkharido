import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/connectDB.js';
import Order from '../../../../../../server/models/Order.js';
import Product from '../../../../../../server/models/Product.js';
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

    const body = await req.json().catch(() => ({}));
    const cancellationReason = body.cancellationReason || body.reason || 'Customer Cancellation';

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
      return NextResponse.json({ error: 'Forbidden: You do not have permission to cancel this order' }, { status: 403 });
    }

    if (order.status === 'Cancelled') {
      return NextResponse.json({ error: 'Order is already cancelled' }, { status: 400 });
    }
    if (order.status === 'Delivered') {
      return NextResponse.json({ error: 'Delivered orders cannot be cancelled. Please submit a Return request.' }, { status: 400 });
    }

    // 1. Restore product inventory
    if (Array.isArray(order.orderItems)) {
      for (const item of order.orderItems) {
        if (item.product) {
          try {
            await Product.updateOne(
              { _id: item.product },
              { $inc: { stock: item.qty, soldCount: -item.qty } }
            );
          } catch (invErr) {
            console.error('[Inventory Restoration Error]:', invErr);
          }
        }
      }
    }

    // 2. Refund coins if used
    if (order.coinsUsed > 0 && order.user) {
      try {
        await User.updateOne(
          { _id: order.user },
          { $inc: { walletCoins: order.coinsUsed } }
        );
      } catch (coinErr) {
        console.error('[Coin Refund Error]:', coinErr);
      }
    }

    // 3. Refund prepaid amount to walletCash
    const isPrepaid = order.isPaid && !['cash on delivery', 'cod'].includes((order.paymentMethod || '').toLowerCase());
    if (isPrepaid && order.user && order.totalPrice > 0) {
      try {
        await User.updateOne(
          { _id: order.user },
          { $inc: { walletCash: order.totalPrice } }
        );
      } catch (walletErr) {
        console.error('[Wallet Refund Error]:', walletErr);
      }
    }

    order.status = 'Cancelled';
    order.cancellationReason = cancellationReason;
    if (!order.trackingHistory) order.trackingHistory = [];
    order.trackingHistory.push({
      status: 'Cancelled',
      timestamp: new Date(),
      location: 'Order Desk',
      comment: cancellationReason + (isPrepaid ? ` (Refund of ₹${order.totalPrice} processed to AbKharido Wallet)` : '')
    });

    await order.save();

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    return NextResponse.json({ error: error.message || 'Failed to cancel order' }, { status: 500 });
  }
}
