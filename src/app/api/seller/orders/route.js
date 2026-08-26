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

    // Fetch recent orders
    let orders = await Order.find({})
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    // If no orders yet, return structured sample orders for demo merchant
    if (orders.length === 0) {
      orders = [
        {
          _id: 'AK-ORD-88219',
          orderId: 'AK-2026-88219',
          customerName: 'Rahul Sharma',
          shippingAddress: {
            fullName: 'Rahul Sharma',
            phone: '9876543210',
            address: 'Flat 402, Green Valley Apartments',
            city: 'Mumbai',
            postalCode: '400001'
          },
          orderItems: [
            { name: 'AbKharido Leather Biker Jacket', price: 4999, quantity: 1, image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300' }
          ],
          totalPrice: 4999,
          paymentMethod: 'Cash on Delivery',
          isPaid: false,
          isDelivered: false,
          status: 'Processing',
          deliveryPin: '4829',
          courier: 'BlueDart Express Air',
          awb: 'NMB-88219401',
          createdAt: new Date().toISOString()
        },
        {
          _id: 'AK-ORD-77102',
          orderId: 'AK-2026-77102',
          customerName: 'Priya Patel',
          shippingAddress: {
            fullName: 'Priya Patel',
            phone: '9811223344',
            address: 'Plot 12, Sector 18',
            city: 'Delhi',
            postalCode: '110001'
          },
          orderItems: [
            { name: 'boAt Rockerz 450 Bluetooth Headphones', price: 1499, quantity: 2, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300' }
          ],
          totalPrice: 2998,
          paymentMethod: 'Online UPI (Cashfree)',
          isPaid: true,
          isDelivered: true,
          status: 'Delivered',
          deliveryPin: '7102',
          courier: 'Delhivery Surface',
          awb: 'NMB-77102559',
          createdAt: new Date(Date.now() - 86400000).toISOString()
        }
      ];
    }

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
      if (status === 'Dispatched') {
        order.courier = courier;
        if (!order.awb) order.awb = `NMB-${Math.floor(10000000 + Math.random() * 90000000)}`;
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
