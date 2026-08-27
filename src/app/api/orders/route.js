import { NextResponse } from 'next/server';
import connectDB from '../../../lib/connectDB.js';
import Order from '../../../../server/models/Order.js';
import Product from '../../../../server/models/Product.js';
import User from '../../../../server/models/User.js';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit')) || 200;
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';

    let query = {};
    if (status && status !== 'all' && status !== 'ALL') {
      if (status === 'LIVE') {
        query.status = { $nin: ['Cancelled', 'CANCELLED', 'Returned'] };
      } else {
        query.status = status;
      }
    }

    if (search && search.trim()) {
      const s = search.trim();
      query.$or = [
        { cfOrderId: { $regex: s, $options: 'i' } },
        { 'orderItems.name': { $regex: s, $options: 'i' } },
        { 'shippingAddress.fullName': { $regex: s, $options: 'i' } },
        { 'shippingAddress.phone': { $regex: s, $options: 'i' } }
      ];
    }

    const orders = await Order.find(query)
      .populate('user', 'fullName username email phone')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json(orders || []);
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    return NextResponse.json([]);
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const {
      cart,
      username,
      shippingAddress,
      paymentMethod = 'Cash on Delivery',
      useCoinsDiscount = false,
      cfOrderId,
      couponCode
    } = body;

    const rawCart = Array.isArray(cart) ? cart : [];
    if (rawCart.length === 0) {
      return NextResponse.json({ error: 'Cart is empty. Please add items.' }, { status: 400 });
    }

    const recipientName = shippingAddress?.fullName || shippingAddress?.name || (username || 'Valued Customer');
    const recipientPhone = shippingAddress?.phone || shippingAddress?.phoneNumber || (username || '');

    if (!shippingAddress || !recipientPhone) {
      return NextResponse.json({ error: 'Shipping address with recipient name and phone is required.' }, { status: 400 });
    }

    // 1. Resolve or Create User
    const phoneDigits = (recipientPhone || '').replace(/\D/g, '').slice(-10);
    let user = null;

    // Check token from headers
    const authHeader = req.headers.get('authorization') || '';
    if (authHeader.startsWith('Bearer ')) {
      try {
        const jwt = (await import('jsonwebtoken')).default;
        const decoded = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET || 'abkharido_enterprise_secret_2026');
        if (decoded && decoded.id) {
          user = await User.findById(decoded.id);
        }
      } catch (_) {}
    }

    if (!user && (username || phoneDigits || shippingAddress?.email)) {
      const emailToMatch = shippingAddress?.email ? shippingAddress.email.trim().toLowerCase() : undefined;
      const conditions = [
        username ? { username } : null,
        phoneDigits ? { phone: phoneDigits } : null,
        phoneDigits ? { phone: `+91${phoneDigits}` } : null,
        phoneDigits ? { phone: `91${phoneDigits}` } : null,
        phoneDigits ? { username: phoneDigits } : null,
        phoneDigits ? { username: new RegExp(`^${phoneDigits}(_|$)`) } : null,
        (emailToMatch && !emailToMatch.includes(':') && !emailToMatch.endsWith('@abkharido.com')) ? { email: emailToMatch } : null
      ].filter(Boolean);

      if (conditions.length > 0) {
        user = await User.findOne({ $or: conditions });
      }
    }

    if (!user) {
      // Create single canonical buyer profile with clean phone username
      const newUsername = phoneDigits ? phoneDigits : `guest_${Date.now()}`;
      try {
        user = await User.create({
          username: newUsername,
          phone: phoneDigits || undefined,
          email: (shippingAddress?.email && !shippingAddress.email.includes(':') && !shippingAddress.email.endsWith('@abkharido.com')) ? shippingAddress.email : undefined,
          fullName: shippingAddress.fullName || shippingAddress.name || 'Valued Customer',
          password: 'GuestUserOrderPass2026!',
          role: 'user'
        });
      } catch (upsertErr) {
        user = await User.findOne({ $or: [
          phoneDigits ? { phone: phoneDigits } : null,
          phoneDigits ? { username: phoneDigits } : null,
          { username: newUsername }
        ].filter(Boolean) });
      }
    }

    // 2. Map items & resolve Product references
    const orderItems = await Promise.all(rawCart.map(async (item) => {
      const prod = item.product || item;
      const prodId = prod._id || prod.id;
      let dbProduct = null;

      if (prodId && /^[0-9a-fA-F]{24}$/.test(String(prodId))) {
        dbProduct = await Product.findById(prodId).lean();
      }
      if (!dbProduct && prod.id) {
        dbProduct = await Product.findOne({ id: prod.id }).lean();
      }

      const qty = Math.max(1, parseInt(item.quantity || item.qty, 10) || 1);
      const price = Number(item.price || prod.price || (dbProduct ? dbProduct.price : 999));
      const name = item.name || prod.name || (dbProduct ? dbProduct.name : 'AbKharido Verified Product');
      const image = item.image || prod.image || (dbProduct ? (dbProduct.image || dbProduct.images?.[0]) : 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600');

      return {
        product: dbProduct ? dbProduct._id : user._id, // fallback to user ObjectId if mock
        name,
        qty,
        price,
        image,
        color: item.selectedColor || item.color || '',
        variant: item.selectedVariant || item.variant || ''
      };
    }));

    const itemsPrice = Math.round(orderItems.reduce((acc, item) => acc + (item.price * item.qty), 0));
    const shippingPrice = itemsPrice > 500 ? 0 : 40;
    const taxPrice = 0;
    
    // Coins Discount calculation (1 Coin = ₹1)
    let coinsUsed = 0;
    if (useCoinsDiscount && user) {
      const userCoins = user.walletCoins || 0;
      coinsUsed = Math.min(userCoins, itemsPrice);
    }

    let couponDiscount = 0;
    if (couponCode) {
      const Coupon = (await import('../../../../../server/models/Coupon.js')).default;
      const dbCoupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (dbCoupon && new Date(dbCoupon.expiryDate) > new Date()) {
        couponDiscount = dbCoupon.discountType === 'percentage'
          ? Math.round((itemsPrice * dbCoupon.discountAmount) / 100)
          : dbCoupon.discountAmount;
      }
    }

    let totalPrice = Math.max(0, itemsPrice - coinsUsed - couponDiscount + shippingPrice + taxPrice);

    // Deduct coins used from user wallet
    if (coinsUsed > 0 && user && user._id) {
      try {
        await User.updateOne({ _id: user._id }, { $inc: { walletCoins: -coinsUsed } });
      } catch (coinErr) {
        console.error('[Order Coin Deduction Error]:', coinErr);
      }
    }

    // Delivery PIN (4 digits)
    const deliveryPin = String(Math.floor(1000 + Math.random() * 9000));
    const generatedCfOrderId = cfOrderId || `ORD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const isPaid = paymentMethod.toLowerCase().includes('online') || paymentMethod.toLowerCase().includes('upi') || paymentMethod.toLowerCase().includes('card');

    const newOrder = await Order.create({
      user: user._id,
      orderItems,
      shippingAddress: {
        fullName: recipientName,
        phone: recipientPhone,
        address: shippingAddress.streetAddress || shippingAddress.address || 'Street address',
        city: shippingAddress.city || 'Palghar',
        postalCode: shippingAddress.pincode || shippingAddress.postalCode || '401404',
        country: 'India'
      },
      paymentMethod,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
      coinsUsed,
      isPaid,
      paidAt: isPaid ? new Date() : undefined,
      status: 'Processing',
      deliveryPin,
      cfOrderId: generatedCfOrderId,
      appliedCoupon: couponCode || undefined,

      trackingHistory: [{
        status: 'Processing',
        timestamp: new Date(),
        location: shippingAddress.city || 'Warehouse Direct',
        comment: 'Order placed & scheduled for express air-dispatch'
      }]
    });

    // Clear user cart in DB upon order placement

    if (user && user._id) {
      try {
        await User.updateOne({ _id: user._id }, { $set: { cart: [] } });
      } catch (cartErr) {
        console.error('[Order Cart Clear Error]:', cartErr);
      }
    }

    return NextResponse.json(newOrder, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/orders:', error);
    return NextResponse.json({ error: error.message || 'Failed to place order.' }, { status: 500 });
  }
}
