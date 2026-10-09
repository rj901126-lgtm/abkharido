import connectDB from './connectDB.js';
import Coupon from '../../server/models/Coupon.js';

/**
 * Validates a coupon code server-side against MongoDB and standard active fallback coupons.
 * Guarantees that discountAmount is always strictly clamped within [0, serverSubtotal].
 * Negative discounts or discounts exceeding the subtotal are strictly impossible.
 * 
 * @param {string} rawCode - Coupon code supplied by client
 * @param {number} serverSubtotal - Authoritative server-computed subtotal
 * @returns {Promise<{ valid: boolean, couponCode: string, discountAmount: number, discountType?: string, discountValue?: number, message: string }>}
 */
export async function validateCoupon(rawCodeOrOpts, maybeServerSubtotal) {
  let rawCode = rawCodeOrOpts;
  let serverSubtotal = maybeServerSubtotal;
  if (typeof rawCodeOrOpts === 'object' && rawCodeOrOpts !== null) {
    rawCode = rawCodeOrOpts.couponCode || rawCodeOrOpts.code;
    serverSubtotal = rawCodeOrOpts.serverSubtotal !== undefined ? rawCodeOrOpts.serverSubtotal : rawCodeOrOpts.subtotal;
  }

  const code = String(rawCode || '').trim().toUpperCase();
  const subtotal = Number(serverSubtotal);

  if (!code) {
    return { valid: false, couponCode: '', discount: 0, discountAmount: 0, message: 'Coupon code is required.' };
  }

  if (!Number.isFinite(subtotal) || subtotal <= 0) {
    return { valid: false, couponCode: code, discount: 0, discountAmount: 0, message: 'Invalid cart subtotal for coupon application.' };
  }

  // 1. Check MongoDB Coupon collection
  try {
    await connectDB();
    const dbCoupon = await Coupon.findOne({ code, isActive: true }).lean();

    if (dbCoupon) {
      if (dbCoupon.expiryDate && new Date(dbCoupon.expiryDate) < new Date()) {
        return { valid: false, couponCode: code, discountAmount: 0, message: `Coupon '${code}' has expired.` };
      }

      if (dbCoupon.usageLimit > 0 && (dbCoupon.usedCount || 0) >= dbCoupon.usageLimit) {
        return { valid: false, couponCode: code, discountAmount: 0, message: `Coupon '${code}' usage limit has been reached.` };
      }

      const minCart = Number(dbCoupon.minCartValue || 0);
      if (minCart > 0 && subtotal < minCart) {
        return { 
          valid: false, 
          couponCode: code, 
          discountAmount: 0, 
          message: `Minimum cart value of ₹${minCart} required for ${code}. Add ₹${minCart - subtotal} more to unlock.` 
        };
      }

      const isPercentage = ['PERCENTAGE', 'percentage'].includes(String(dbCoupon.discountType));
      const discVal = Number(dbCoupon.discountValue || 0);

      let discount = isPercentage
        ? Math.round((subtotal * discVal) / 100)
        : discVal;

      const maxDisc = Number(dbCoupon.maxDiscount || 0);
      if (maxDisc > 0 && discount > maxDisc) {
        discount = maxDisc;
      }

      // Strictly clamp between 0 and server subtotal
      const finalDiscount = Math.max(0, Math.min(subtotal, Math.round(discount)));

      return {
        valid: true,
        couponCode: code,
        discountType: isPercentage ? 'percentage' : 'fixed',
        discountValue: discVal,
        discount: finalDiscount,
        discountAmount: finalDiscount,
        message: `🎉 ${code} applied! Saved ₹${finalDiscount}.`
      };
    }
  } catch (err) {
    console.warn('[validateCoupon] DB lookup warning:', err.message);
  }

  // 2. Built-in Active Store Fallbacks
  if (code === 'FESTIVE20' || code === 'HURRY20') {
    if (subtotal < 499) {
      return { valid: false, couponCode: code, discount: 0, discountAmount: 0, message: `Minimum cart value of ₹499 required for ${code}.` };
    }
    const discount = Math.max(0, Math.min(subtotal, Math.min(2000, Math.round(subtotal * 0.20))));
    return {
      valid: true,
      couponCode: code,
      discountType: 'percentage',
      discountValue: 20,
      discount: discount,
      discountAmount: discount,
      message: `🎉 ${code} applied! 20% discount added.`
    };
  }

  if (code === 'SAVE10') {
    if (subtotal < 499) {
      return { valid: false, couponCode: code, discount: 0, discountAmount: 0, message: 'Minimum cart value of ₹499 required for SAVE10.' };
    }
    const discount = Math.max(0, Math.min(subtotal, Math.min(1000, Math.round(subtotal * 0.10))));
    return {
      valid: true,
      couponCode: 'SAVE10',
      discountType: 'percentage',
      discountValue: 10,
      discount: discount,
      discountAmount: discount,
      message: '🎉 SAVE10 applied! 10% discount added.'
    };
  }

  if (code === 'WELCOME100') {
    const discount = Math.max(0, Math.min(subtotal, 100));
    return {
      valid: true,
      couponCode: 'WELCOME100',
      discountType: 'fixed',
      discountValue: 100,
      discount: discount,
      discountAmount: discount,
      message: '🎉 WELCOME100 applied! Flat ₹100 saved.'
    };
  }

  if (code === 'DIWALI50') {
    if (subtotal < 1000) {
      return { valid: false, couponCode: code, discount: 0, discountAmount: 0, message: 'Minimum cart value of ₹1000 required for DIWALI50.' };
    }
    const discount = Math.max(0, Math.min(subtotal, Math.min(3000, Math.round(subtotal * 0.50))));
    return {
      valid: true,
      couponCode: 'DIWALI50',
      discountType: 'percentage',
      discountValue: 50,
      discount: discount,
      discountAmount: discount,
      message: '🪔 DIWALI50 Mega Discount applied! 50% discount added.'
    };
  }

  return {
    valid: false,
    couponCode: code,
    discount: 0,
    discountAmount: 0,
    message: `Coupon code '${code}' is invalid or expired.`
  };
}
