import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/connectDB.js';
import Order from '../../../../../../server/models/Order.js';

export const dynamic = 'force-dynamic';

export async function POST(req, context) {
  try {
    await connectDB();
    const params = await (context?.params || {});
    const id = params?.id;
    const body = await req.json().catch(() => ({}));
    const { courierPartner = 'Delhivery Express', awbNumber = `ABK-${Date.now().toString().slice(-8)}` } = body;

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

    order.status = 'Shipped';
    order.courierPartner = courierPartner;
    order.awbNumber = awbNumber;
    if (!order.trackingHistory) order.trackingHistory = [];
    order.trackingHistory.push({
      status: 'Shipped',
      timestamp: new Date(),
      location: 'National Logistics Hub',
      comment: `Dispatched via ${courierPartner} (AWB: ${awbNumber})`
    });

    await order.save();

    return NextResponse.json({
      success: true,
      message: 'Order shipped successfully',
      courier: courierPartner,
      awb: awbNumber,
      order
    });
  } catch (error) {
    console.error('Error shipping order:', error);
    return NextResponse.json({ error: error.message || 'Failed to dispatch order' }, { status: 500 });
  }
}
