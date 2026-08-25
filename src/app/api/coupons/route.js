import { NextResponse } from 'next/server';
import connectDB from '../../../lib/connectDB.js';
import Coupon from '../../../../server/models/Coupon.js';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    await connectDB();
    const coupons = await Coupon.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json(coupons || []);
  } catch (error) {
    console.error('[Coupons API Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const { code, discountType, discountAmount, minOrderAmount, expiryDate, usageLimit, description } = body;

    if (!code || !discountAmount) {
      return NextResponse.json({ error: 'Code and Discount Amount are required' }, { status: 400 });
    }

    const newCoupon = await Coupon.create({
      code: code.toUpperCase().trim(),
      discountType: discountType || 'fixed',
      discountAmount: Number(discountAmount),
      minOrderAmount: Number(minOrderAmount || 0),
      expiryDate: expiryDate ? new Date(expiryDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      usageLimit: Number(usageLimit || 1000),
      description: description || 'Festive Savings Coupon',
      isActive: true
    });

    return NextResponse.json({ success: true, coupon: newCoupon });
  } catch (error) {
    console.error('[Coupon Create Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
