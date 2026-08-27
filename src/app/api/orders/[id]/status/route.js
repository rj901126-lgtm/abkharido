import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/connectDB.js';
import Order from '../../../../../../server/models/Order.js';

export const dynamic = 'force-dynamic';

async function handleUpdateStatus(req, context) {
  try {
    await connectDB();
    const params = await (context?.params || {});
    const id = params?.id;

    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const body = await req.json();
    const { status, note, location, cancellationReason, courierPartner, awbNumber, trackingUrl } = body;

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

    if (courierPartner) order.courierPartner = courierPartner;
    if (awbNumber) order.awbNumber = awbNumber;
    if (trackingUrl) order.trackingUrl = trackingUrl;

    if (status) {
      order.status = status;
      if (status === 'Shipped') {
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
      }

      if (status === 'Delivered') {
        order.isDelivered = true;
        order.deliveredAt = new Date();
      }
      if (status === 'Cancelled' && cancellationReason) {
        order.cancellationReason = cancellationReason;
      }
      if (!order.trackingHistory) order.trackingHistory = [];
      order.trackingHistory.push({
        status,
        timestamp: new Date(),
        location: location || order.shippingAddress?.city || (courierPartner ? `${courierPartner} Hub` : 'In Transit'),
        comment: note || (awbNumber ? `Dispatched via ${courierPartner || 'Express Air'} (AWB: ${awbNumber})` : `Order updated to ${status}`)
      });
    }

    await order.save();


    return NextResponse.json({
      success: true,
      message: `Order status updated to ${order.status}`,
      order
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json({ error: error.message || 'Failed to update order status' }, { status: 500 });
  }
}

export async function POST(req, context) {
  return handleUpdateStatus(req, context);
}

export async function PUT(req, context) {
  return handleUpdateStatus(req, context);
}

export async function PATCH(req, context) {
  return handleUpdateStatus(req, context);
}
