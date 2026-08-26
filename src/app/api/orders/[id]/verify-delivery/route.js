import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/connectDB.js';
import Order from '../../../../../../server/models/Order.js';

export const dynamic = 'force-dynamic';

/**
 * Secure Doorstep Delivery PIN Verification Engine
 * Verifies the 4-digit PIN provided by the customer to complete delivery safely.
 */
export async function POST(req, context) {
  try {
    await connectDB();
    const params = await (context?.params || {});
    const id = params?.id;
    const body = await req.json().catch(() => ({}));
    const { pin } = body;

    if (!pin) {
      return NextResponse.json({ error: 'Delivery PIN is required' }, { status: 400 });
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

    // Check PIN match (or fallback if PIN was not initialized)
    const expectedPin = String(order.deliveryPin || '1234');
    const enteredPin = String(pin).trim();

    if (enteredPin !== expectedPin) {
      return NextResponse.json({ 
        error: 'Invalid Delivery PIN. Please ask the customer for the correct 4-digit PIN.',
        matched: false 
      }, { status: 400 });
    }

    // Success — mark delivered
    order.status = 'Delivered';
    order.isDelivered = true;
    order.deliveredAt = new Date();

    if (!order.trackingHistory) order.trackingHistory = [];
    order.trackingHistory.push({
      status: 'Delivered',
      timestamp: new Date(),
      location: order.shippingAddress?.city || 'Customer Address',
      comment: `Delivered successfully to customer. Verified with Secure Doorstep PIN.`
    });

    await order.save();

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
