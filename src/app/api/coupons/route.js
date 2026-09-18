import { NextResponse } from 'next/server';
import connectDB from '../../../lib/connectDB.js';
import Coupon from '../../../../server/models/Coupon.js';
import { getAuthenticatedUser } from '../../../lib/serverAuth.js';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    await connectDB();
    const auth = await getAuthenticatedUser(req);
    
    // Admins see all coupons; non-admins see only active, non-expired coupons
    const query = auth?.isAdmin ? {} : { isActive: true, expiryDate: { $gte: new Date() } };
    const coupons = await Coupon.find(query).sort({ createdAt: -1 }).lean();
    return NextResponse.json(coupons || []);
  } catch (error) {
    console.error('[Coupons API Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth || !auth.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required to create coupons' }, { status: 401 });
    }

    await connectDB();
    const body = await req.json().catch(() => ({}));
    const { 
      code, 
      discountType = 'FLAT', 
      discountValue, 
      discountAmount, 
      minCartValue, 
      minOrderAmount, 
      maxDiscount, 
      expiryDate, 
      usageLimit, 
      description 
    } = body;

    const value = Number(discountValue || discountAmount);
    if (!code || isNaN(value) || value <= 0) {
      return NextResponse.json({ error: 'Valid Code and Discount Value are required' }, { status: 400 });
    }

    const typeStr = String(discountType).toUpperCase();
    const finalDiscountType = typeStr === 'PERCENTAGE' ? 'PERCENTAGE' : 'FLAT';

    const newCoupon = await Coupon.create({
      code: code.toUpperCase().trim(),
      discountType: finalDiscountType,
      discountValue: value,
      minCartValue: Number(minCartValue || minOrderAmount || 0),
      maxDiscount: Number(maxDiscount || 0),
      expiryDate: expiryDate ? new Date(expiryDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      usageLimit: Number(usageLimit || 1000),
      description: description || 'Festive Savings Coupon',
      isActive: true
    });

    return NextResponse.json({ success: true, coupon: newCoupon }, { status: 201 });
  } catch (error) {
    console.error('[Coupon Create Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to create coupon' }, { status: 500 });
  }
}
