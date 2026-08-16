import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const { code, cartValue = 0, itemsPrice = 0 } = body;
    const value = Number(cartValue || itemsPrice || 0);
    const authHeader = req.headers.get('authorization') || '';
    
    const hosts = [
      process.env.BACKEND_API_URL,
      'http://127.0.0.1:5000',
      'http://localhost:5000'
    ].filter(Boolean);

    const uniqueHosts = [...new Set(hosts.map(h => h.replace(/\/$/, '')))];
    
    for (const host of uniqueHosts) {
      try {
        const url = `${host}/api/coupons/validate`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1500);
        
        const headers = { 'Content-Type': 'application/json' };
        if (authHeader) headers['authorization'] = authHeader;

        const res = await fetch(url, {
          method: 'POST',
          body: JSON.stringify(body),
          headers,
          signal: controller.signal
        });
        clearTimeout(timeout);
        
        if (res && res.status < 500) {
          const data = await res.json();
          return NextResponse.json(data, { status: res.status });
        }
      } catch (_err) {
        // Continue to next host or fallback
      }
    }

    // Built-in Native Fallback for standard store coupons (m1 fix)
    const upperCode = (code || '').trim().toUpperCase();
    if (upperCode === 'FESTIVE20') {
      if (value < 499) {
        return NextResponse.json({ success: false, message: 'Minimum cart value of ₹499 required for FESTIVE20' }, { status: 400 });
      }
      const discount = Math.min(2000, Math.round(value * 0.20));
      return NextResponse.json({
        success: true,
        couponCode: 'FESTIVE20',
        discountType: 'percentage',
        discountValue: 20,
        discountAmount: discount,
        message: '🎉 FESTIVE20 applied! 20% discount added to your cart.'
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
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

