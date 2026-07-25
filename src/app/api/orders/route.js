import { NextResponse } from 'next/server';
import connectDB from '../../../lib/connectDB.js';
import Order from '../../../../server/models/Order.js';
import User from '../../../../server/models/User.js';

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { cart, username, shippingAddress, paymentMethod, useCoinsDiscount, activeReferral, cfOrderId, couponCode } = body;

    const user = await User.findOne({ username });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const orderItems = cart.map(item => ({
      product: item.product._id || item.product.id,
      name: item.product.name,
      qty: item.quantity,
      image: item.product.images[0] || item.product.image || '',
      price: item.price,
      color: item.selectedColor,
      variant: item.selectedVariant
    }));

    const itemsPrice = orderItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
    const shippingPrice = itemsPrice >= 500 ? 0 : 50;
    
    let coinsUsed = 0;
    if (useCoinsDiscount && user.coins > 0) {
      coinsUsed = Math.min(itemsPrice, user.coins);
      user.coins -= coinsUsed;
      await user.save();
    }

    let couponDiscount = 0; // Simulate coupon check
    if (couponCode === 'FIRSTBUY') couponDiscount = itemsPrice * 0.10;

    const totalPrice = itemsPrice + shippingPrice - coinsUsed - couponDiscount;

    const order = new Order({
      user: user._id,
      orderItems,
      shippingAddress: {
        fullName: shippingAddress.name || 'User',
        address: shippingAddress.address,
        city: shippingAddress.city || 'City',
        postalCode: shippingAddress.pincode,
        country: 'India'
      },
      paymentMethod,
      itemsPrice,
      shippingPrice,
      totalPrice,
      coinsUsed,
      appliedCoupon: couponCode,
      status: 'Pending',
      cfOrderId,
      referralApplied: activeReferral ? { referrerId: activeReferral, rewardAmount: Math.floor(totalPrice * 0.05) } : undefined
    });

    const createdOrder = await order.save();

    return NextResponse.json(createdOrder, { status: 201 });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
