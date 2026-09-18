import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/connectDB.js';
import Coupon from '../../../../../server/models/Coupon.js';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { code, cartValue = 0, itemsPrice = 0 } = body;
    const value = Number(cartValue || itemsPrice || 0);

    const upperCode = (code || '').trim().toUpperCase();
    if (!upperCode) {
      return NextResponse.json({ success: false, message: 'Coupon code is required.' }, { status: 400 });
    }

    // 1. Check MongoDB Coupon database
    try {
      await connectDB();
      const dbCoupon = await Coupon.findOne({ code: upperCode, isActive: true });

      if (dbCoupon) {
        if (dbCoupon.expiryDate && new Date(dbCoupon.expiryDate) < new Date()) {
          return NextResponse.json({ success: false, message: `Coupon '${upperCode}' has expired.` }, { status: 400 });
        }

        if (dbCoupon.usageLimit > 0 && (dbCoupon.usedCount || 0) >= dbCoupon.usageLimit) {
          return NextResponse.json({ success: false, message: `Coupon '${upperCode}' usage limit has been reached.` }, { status: 400 });
        }

        const minCart = Number(dbCoupon.minCartValue || 0);
        if (minCart > 0 && value < minCart) {
          return NextResponse.json({ 
            success: false, 
            message: `Minimum cart value of ₹${minCart} required for ${upperCode}. Add ₹${minCart - value} more to unlock.` 
          }, { status: 400 });
        }

        const isPercentage = String(dbCoupon.discountType).toLowerCase() === 'percentage';
        let discount = isPercentage
          ? Math.round((value * Number(dbCoupon.discountValue)) / 100)
          : Number(dbCoupon.discountValue);

        const maxDisc = Number(dbCoupon.maxDiscount || 0);
        if (maxDisc > 0 && discount > maxDisc) {
          discount = maxDisc;
        }
        discount = Math.min(value, Math.max(0, discount));

        return NextResponse.json({
          success: true,
          couponCode: upperCode,
          discountType: isPercentage ? 'percentage' : 'fixed',
          discountValue: dbCoupon.discountValue,
          discountAmount: discount,
          message: `🎉 ${upperCode} applied! Saved ₹${discount}.`
        });
      }
    } catch (dbErr) {
      console.warn('[Coupon DB lookup warning]:', dbErr.message);
    }

    // 2. Built-in Native Fallback for standard store coupons
    if (upperCode === 'FESTIVE20' || upperCode === 'HURRY20') {
      if (value < 499) {
        return NextResponse.json({ success: false, message: `Minimum cart value of ₹499 required for ${upperCode}` }, { status: 400 });
      }
      const discount = Math.min(2000, Math.round(value * 0.20));
      return NextResponse.json({
        success: true,
        couponCode: upperCode,
        discountType: 'percentage',
        discountValue: 20,
        discountAmount: discount,
        message: `🎉 ${upperCode} applied! 20% discount added to your cart.`
      });
    }

    if (upperCode === 'SAVE10') {
      const discount = Math.min(1000, Math.round(value * 0.10));
      return NextResponse.json({
        success: true,
        couponCode: 'SAVE10',
        discountType: 'percentage',
        discountValue: 10,
        discountAmount: discount,
        message: '🎉 SAVE10 applied! 10% discount added.'
      });
    }

    if (upperCode === 'WELCOME100') {
      const discount = Math.min(value, 100);
      return NextResponse.json({
        success: true,
        couponCode: 'WELCOME100',
        discountType: 'fixed',
        discountValue: 100,
        discountAmount: discount,
        message: '🎉 WELCOME100 applied! Flat ₹100 saved.'
      });
    }

    if (upperCode === 'DIWALI50') {
      if (value < 1000) {
        return NextResponse.json({ success: false, message: 'Minimum cart value of ₹1000 required for DIWALI50' }, { status: 400 });
      }
      const discount = Math.min(3000, Math.round(value * 0.50));
      return NextResponse.json({
        success: true,
        couponCode: 'DIWALI50',
        discountType: 'percentage',
        discountValue: 50,
        discountAmount: discount,
        message: '🪔 DIWALI50 Mega Discount applied! 50% discount added.'
      });
    }

    return NextResponse.json({ success: false, message: `Coupon code '${code}' is invalid or expired.` }, { status: 400 });
  } catch (error) {
    console.error('Error in validate coupon:', error);
    return NextResponse.json({ success: false, message: 'Internal server error validating coupon' }, { status: 500 });
  }
}
