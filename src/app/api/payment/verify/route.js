import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/connectDB.js';
import Order from '../../../../../server/models/Order.js';
import User from '../../../../../server/models/User.js';

export async function POST(request) {
  try {
    await connectDB();
    const { orderId } = await request.json();

    const mongoose = require('mongoose');
    const query = { cfOrderId: orderId };
    if (mongoose.Types.ObjectId.isValid(orderId)) {
      query.$or = [{ _id: orderId }, { cfOrderId: orderId }];
    }

    const order = await Order.findOne(query);
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    order.isPaid = true;
    order.paidAt = new Date();
    order.status = 'Processing';
    await order.save();

    const user = await User.findById(order.user);
    if (user) {
      // Add 5% cashback coins
      const cashback = Math.floor(order.totalPrice * 0.05);
      user.coins = (user.coins || 0) + cashback;
      await user.save();
      
      return NextResponse.json({ 
        success: true, 
        user: { 
          id: user._id,
          username: user.username,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          coins: user.coins,
          token: request.headers.get('Authorization')?.split(' ')[1] // Keep existing token
        } 
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Payment verify error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
