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

    // Record Batch Expiry & Manufacture Dates for all dispatched products
    const itemExpiryDates = body.itemExpiryDates || {};
    const batchNumbers = body.batchNumbers || {};
    const defaultBatch = `BAT-${Date.now().toString().slice(-6)}`;

    if (Array.isArray(order.orderItems)) {
      order.orderItems = order.orderItems.map((item, idx) => {
        const customExp = itemExpiryDates[item.product] || itemExpiryDates[idx] || body.expiryDate;
        const customBatch = batchNumbers[item.product] || batchNumbers[idx] || body.batchNumber || defaultBatch;

        let finalExpiryDate = item.expiryDate;
        if (customExp) {
          finalExpiryDate = new Date(customExp);
        } else if (!finalExpiryDate) {
          // Default to 180 days shelf life if not previously set
          finalExpiryDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
        }

        return {
          ...item.toObject?.() || item,
          expiryDate: finalExpiryDate,
          batchNumber: customBatch,
          isReplenishable: true
        };
      });
    }

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
