import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/connectDB.js';
import Product from '../../../../../server/models/Product.js';
import { validateCoupon } from '../../../../lib/couponValidator.js';

import { checkRouteRateLimit } from '../../../../lib/rateLimiter.js';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const limit = checkRouteRateLimit('coupons', ip, 30, 5 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        { success: false, message: 'Too many coupon check attempts. Please slow down.' },
        { status: 429, headers: { 'Cache-Control': 'private, no-store' } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { code, cartValue, itemsPrice, items, cart } = body;

    const rawCode = (code || '').trim().toUpperCase();
    if (!rawCode) {
      return NextResponse.json(
        { success: false, message: 'Coupon code is required.' }, 
        { status: 400, headers: { 'Cache-Control': 'private, no-store' } }
      );
    }

    let serverSubtotal = 0;
    const itemList = Array.isArray(items) ? items : (Array.isArray(cart) ? cart : null);

    if (itemList && itemList.length > 0) {
      // Recompute authoritative subtotal from MongoDB products
      await connectDB();
      for (const item of itemList) {
        const prod = item.product || item;
        const pId = prod?._id || prod?.id || item?._id || item?.id;
        let dbProd = null;

        if (pId && /^[0-9a-fA-F]{24}$/.test(String(pId))) {
          dbProd = await Product.findById(pId).lean();
        }
        if (!dbProd && pId) {
          dbProd = await Product.findOne({ id: String(pId) }).lean();
        }

        const qty = Math.max(1, parseInt(item.quantity || item.qty, 10) || 1);
        if (dbProd) {
          const isFlash = dbProd.flashSale?.isActive === true && dbProd.flashSale?.endTime && new Date(dbProd.flashSale.endTime) > new Date();
          const unitPrice = isFlash ? Number(dbProd.flashSale.price) : Number(dbProd.price);
          serverSubtotal += unitPrice * qty;
        } else {
          // If product not found, fall back to safe numeric unit price (never negative)
          const fallbackPrice = Math.max(0, Number(prod?.price || item?.price || 0));
          serverSubtotal += fallbackPrice * qty;
        }
      }
    } else {
      // Fallback to client-provided subtotal value, strictly clamped to non-negative numeric
      const numericVal = Number(cartValue !== undefined ? cartValue : itemsPrice);
      if (!Number.isFinite(numericVal) || numericVal <= 0) {
        return NextResponse.json(
          { success: false, message: 'Cart subtotal must be a positive number.' },
          { status: 400, headers: { 'Cache-Control': 'private, no-store' } }
        );
      }
      serverSubtotal = Math.max(0, numericVal);
    }

    serverSubtotal = Math.round(serverSubtotal);

    const validationResult = await validateCoupon(rawCode, serverSubtotal);

    if (!validationResult.valid) {
      return NextResponse.json(
        { success: false, message: validationResult.message },
        { status: 400, headers: { 'Cache-Control': 'private, no-store' } }
      );
    }

    return NextResponse.json(
      {
        success: true,
        couponCode: validationResult.couponCode,
        discountType: validationResult.discountType,
        discountValue: validationResult.discountValue,
        discountAmount: validationResult.discountAmount,
        serverSubtotal,
        message: validationResult.message
      },
      { status: 200, headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch (error) {
    console.error('Error in validate coupon:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error validating coupon.' },
      { status: 500, headers: { 'Cache-Control': 'private, no-store' } }
    );
  }
}
