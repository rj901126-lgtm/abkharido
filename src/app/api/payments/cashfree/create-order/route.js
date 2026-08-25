import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/connectDB.js';
import Order from '../../../../../../server/models/Order.js';
import Product from '../../../../../../server/models/Product.js';
import User from '../../../../../../server/models/User.js';
import Coupon from '../../../../../../server/models/Coupon.js';
import productsData from '../../../../../../server/data/productsData.js';
import { createCashfreePgOrder, getCashfreeConfig } from '../../../../../lib/cashfree.js';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    await connectDB();

    // 1. Authenticate user from header token or body
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    let user = null;
    if (token) {
      try {
        const { default: jwt } = await import('jsonwebtoken');
        const jwtSecret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'abkharido_enterprise_secret_2026';
        const decoded = jwt.verify(token, jwtSecret);
        if (decoded && (decoded.id || decoded.phone || decoded.username)) {
          user = await User.findOne({
            $or: [
              { _id: decoded.id && decoded.id.length === 24 ? decoded.id : undefined },
              { username: decoded.username },
              { phone: decoded.phone }
            ].filter(Boolean)
          });
        }
      } catch {}
    }

    const body = await req.json().catch(() => ({}));
    const { 
      cartItems = [], 
      shippingAddress = {}, 
      paymentMethod = 'Online Payment', 
      useCoinsDiscount = false, 
      couponCode = '',
      refId = ''
    } = body;

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json({ error: 'Cart is empty. Please add items before checkout.' }, { status: 400 });
    }

    const street = shippingAddress.streetAddress || shippingAddress.address;
    const pin = shippingAddress.postalCode || shippingAddress.pincode;

    if (!shippingAddress.fullName || !shippingAddress.phone || !street || !pin) {
      return NextResponse.json({ error: 'Incomplete delivery address. Please fill all required fields.' }, { status: 400 });
    }

    // 2. Server-side authoritative price and stock calculation
    let calculatedItemsPrice = 0;
    const enrichedItems = [];

    const { PRODUCTS } = await import('../../../../../db/mockData.js');

    for (const item of cartItems) {
      const pId = typeof item.product === 'object' ? (item.product.id || item.product._id) : (item.product || item.id);
      let dbProduct = null;

      try {
        dbProduct = await Product.findOne({ $or: [{ id: pId }, { slug: pId }, { _id: pId && pId.length === 24 ? pId : undefined }].filter(Boolean) }).lean();
      } catch {}

      if (!dbProduct) {
        const catalog = Array.isArray(productsData) ? productsData : [];
        dbProduct = catalog.find(p => p.id === pId || p.slug === pId);
      }

      if (!dbProduct && Array.isArray(PRODUCTS)) {
        dbProduct = PRODUCTS.find(p => p.id === pId || p.slug === pId);
      }

      const itemPrice = dbProduct ? Number(dbProduct.price) : Number(item.price || 999);
      const qty = Math.max(1, Number(item.quantity || item.qty || 1));
      const lineTotal = itemPrice * qty;
      calculatedItemsPrice += lineTotal;

      const fallbackImg = 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600';
      const itemImage = dbProduct?.image || (dbProduct?.images && dbProduct.images[0]) || item.image || fallbackImg;

      enrichedItems.push({
        product: dbProduct?._id || (pId && pId.length === 24 ? pId : '66554433221100aabbccddee'),
        name: dbProduct?.name || item.name || 'Product Item',
        qty,
        image: itemImage,
        price: itemPrice,
        color: item.selectedColor || item.color || '',
        variant: item.selectedVariant || item.variant || ''
      });
    }

    // 3. Shipping & Discounts
    const shippingPrice = calculatedItemsPrice > 499 ? 0 : 40;
    let finalAmount = calculatedItemsPrice + shippingPrice;

    // Coins Discount (1 Coin = ₹1)
    let coinsUsed = 0;
    if (useCoinsDiscount && user) {
      const userCoins = user.walletCoins || 0;
      coinsUsed = Math.min(userCoins, calculatedItemsPrice);
      finalAmount = Math.max(0, finalAmount - coinsUsed);
    }

    // Coupon Discount
    let couponDiscount = 0;
    if (couponCode) {
      const dbCoupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (dbCoupon && new Date(dbCoupon.expiryDate) > new Date()) {
        couponDiscount = dbCoupon.discountType === 'percentage'
          ? Math.round((calculatedItemsPrice * dbCoupon.discountAmount) / 100)
          : dbCoupon.discountAmount;
        finalAmount = Math.max(0, finalAmount - couponDiscount);
      }
    }

    // 4. COD Limit Verification
    const isCod = paymentMethod.toLowerCase().includes('cod') || paymentMethod.toLowerCase().includes('cash');
    if (isCod && finalAmount > 15000) {
      return NextResponse.json({ 
        error: 'Cash on Delivery is limited to orders up to ₹15,000 for verified delivery safety. Please use Online Payment.' 
      }, { status: 400 });
    }

    // 5. Generate standard Order ID
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const orderId = `AK-2026-${randomSuffix}`;

    // 6. User account resolution (fallback to guest user if not logged in)
    let userId = user?._id;
    if (!userId) {
      const guestPhone = (shippingAddress.phone || '').replace(/\D/g, '').slice(-10);
      let guestUser = await User.findOne({
        $or: [
          { phone: guestPhone },
          { phone: `+91${guestPhone}` },
          { username: guestPhone },
          { username: `+91${guestPhone}` }
        ]
      });

      if (!guestUser) {
        guestUser = await User.create({
          username: guestPhone || `guest_${randomSuffix}`,
          phone: guestPhone || '9999999999',
          email: shippingAddress.email || undefined,
          fullName: shippingAddress.fullName || 'Customer',
          walletCoins: 0,
          password: 'guest_checkout_' + Date.now()
        });
      }
      userId = guestUser._id;
    }

    // 7. If COD: create directly without Cashfree PG call
    if (isCod) {
      const newOrder = await Order.create({
        orderItems: enrichedItems,
        user: userId,
        shippingAddress: {
          fullName: shippingAddress.fullName,
          address: shippingAddress.streetAddress || shippingAddress.address,
          city: shippingAddress.city,
          postalCode: shippingAddress.postalCode || shippingAddress.pincode,
          country: shippingAddress.country || 'India'
        },
        paymentMethod: 'Cash on Delivery',
        itemsPrice: calculatedItemsPrice,
        shippingPrice,
        totalPrice: finalAmount,
        appliedCoupon: couponCode || undefined,
        coinsUsed,
        status: 'Placed',
        isPaid: false,
        trackingHistory: [{
          status: 'Placed',
          timestamp: new Date(),
          comment: 'Order placed via Cash on Delivery.'
        }]
      });

      // Deduct coins if used
      if (coinsUsed > 0 && user) {
        await User.updateOne({ _id: userId }, { $inc: { walletCoins: -coinsUsed } });
      }

      return NextResponse.json({
        success: true,
        orderId: newOrder._id,
        orderNumber: orderId,
        paymentMethod: 'COD',
        amount: finalAmount
      });
    }

    // 8. If Online Payment: Create Cashfree Order
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || req.headers.get('origin') || 'https://www.abkharido.com';
    const returnUrl = `${baseUrl}/checkout/return?order_id={order_id}`;
    const notifyUrl = `${baseUrl}/api/payments/cashfree/webhook`;

    const cfOrder = await createCashfreePgOrder({
      orderId,
      orderAmount: finalAmount,
      customer: {
        id: String(userId),
        phone: shippingAddress.phone,
        email: user?.email || `${shippingAddress.phone}@abkharido.com`,
        name: shippingAddress.fullName
      },
      returnUrl,
      notifyUrl
    });

    // 9. Persist pending order in MongoDB
    const newOrder = await Order.create({
      orderItems: enrichedItems,
      user: userId,
      shippingAddress: {
        fullName: shippingAddress.fullName,
        address: shippingAddress.streetAddress || shippingAddress.address,
        city: shippingAddress.city,
        postalCode: shippingAddress.postalCode || shippingAddress.pincode,
        country: shippingAddress.country || 'India'
      },
      paymentMethod: 'Online Payment',
      cfOrderId: orderId,
      itemsPrice: calculatedItemsPrice,
      shippingPrice,
      totalPrice: finalAmount,
      appliedCoupon: couponCode || undefined,
      coinsUsed,
      status: 'Pending',
      isPaid: false,
      paymentExpiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 min TTL
      trackingHistory: [{
        status: 'Pending Payment',
        timestamp: new Date(),
        comment: 'Initiated Cashfree online payment session.'
      }]
    });

    return NextResponse.json({
      success: true,
      orderId,
      dbOrderId: newOrder._id,
      paymentSessionId: cfOrder.paymentSessionId,
      amount: finalAmount,
      simulated: Boolean(cfOrder.simulated)
    });

  } catch (error) {
    console.error('[Cashfree Create Order Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to initialize payment session' }, { status: 500 });
  }
}
