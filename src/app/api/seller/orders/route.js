import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '../../../../lib/connectDB.js';
import Order from '../../../../../server/models/Order.js';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'abkharido_enterprise_secret_2026_super_secure';

function verifySeller(req) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export async function GET(req) {
  try {
    await connectDB();
    const seller = verifySeller(req);

    if (!seller || !seller.id) {
      return NextResponse.json({ error: 'Unauthorized merchant access' }, { status: 401 });
    }

    // Fetch real orders for this authenticated seller
    const orders = await Order.find({
      $or: [
        { 'orderItems.vendorId': seller.id },
        { 'items.vendorId': seller.id },
        { vendorId: seller.id }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({
      success: true,
      count: orders.length,
      orders
    });

  } catch (error) {
    console.error('Seller Orders GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch seller orders' }, { status: 500 });
  }
}


export async function PUT(req) {
  try {
    await connectDB();
    const body = await req.json().catch(() => ({}));
    const { orderId, status = 'Dispatched', courier = 'BlueDart Express Air' } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const order = await Order.findOne({ $or: [{ _id: orderId }, { orderId: orderId }] });
    if (order) {
      order.status = status;
      if (status === 'Dispatched' || status === 'Shipped') {
        order.courier = courier;
        order.courierPartner = courier;
        if (!order.awb) order.awb = `NMB-${Math.floor(10000000 + Math.random() * 90000000)}`;
        if (!order.awbNumber) order.awbNumber = order.awb;
      }
      await order.save();
    }



    return NextResponse.json({
      success: true,
      message: `Order marked as ${status} with automated AWB tracking`,
      order
    });

  } catch (error) {
    console.error('Seller Orders PUT error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update order' }, { status: 500 });
  }
}
