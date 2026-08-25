import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/connectDB.js';
import Order from '../../../../../../server/models/Order.js';

export const dynamic = 'force-dynamic';

export async function POST(req, { params }) {
  try {
    await connectDB();
    const { id } = params;
    const body = await req.json();
    const { cancellationReason = 'Admin Request / Customer Cancellation' } = body;

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    order.status = 'Cancelled';
    order.cancellationReason = cancellationReason;
    order.trackingHistory.push({
      status: 'Cancelled',
      timestamp: new Date(),
      location: 'Order Desk',
      comment: cancellationReason
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
