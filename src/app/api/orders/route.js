import { checkoutOrder } from './financialSecurity.js';
import { NextResponse } from 'next/server';
import connectDB from '../../../lib/connectDB.js';
import Order from '../../../../server/models/Order.js';
import Product from '../../../../server/models/Product.js';
import User from '../../../../server/models/User.js';
import Coupon from '../../../../server/models/Coupon.js';
import { getAuthenticatedUser } from '../../../lib/serverAuth.js';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth || !auth.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized: Please log in to view orders' }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const limit = Math.min(250, Math.max(1, parseInt(searchParams.get('limit')) || 200));
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';

    let query = {};
    if (!auth.isAdmin) {
      query.user = auth.user.id || auth.user._id;
    }

    if (status && status !== 'all' && status !== 'ALL') {
      if (status === 'LIVE') {
        query.status = { $nin: ['Cancelled', 'CANCELLED', 'Returned'] };
      } else {
        query.status = status;
      }
    }

    // Do NOT use .lean() here so mongoose-field-encryption post('init') hook decrypts shippingAddress & paymentResult
    const docs = await Order.find(query)
      .populate('user', 'fullName username email phone')
      .sort({ createdAt: -1 })
      .limit(limit);

    // Convert decrypted documents to plain objects and strip internal encryption metadata (__enc_*)
    let cleanOrders = (docs || []).map(doc => {
      const clean = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
      Object.keys(clean).forEach(k => {
        if (k.startsWith('__enc_')) {
          delete clean[k];
        }
      });
      return clean;
    });

    if (search && search.trim() && auth.isAdmin) {
      const q = search.trim().toLowerCase();
      cleanOrders = cleanOrders.filter(ord => {
        const idMatch = String(ord._id || '').toLowerCase().includes(q) || String(ord.cfOrderId || '').toLowerCase().includes(q);
        const itemMatch = (ord.orderItems || []).some(i => String(i.name || '').toLowerCase().includes(q));
        const nameMatch = String(ord.shippingAddress?.fullName || ord.user?.fullName || '').toLowerCase().includes(q);
        const phoneMatch = String(ord.shippingAddress?.phone || ord.user?.phone || '').toLowerCase().includes(q);
        const rmaMatch = String(ord.returnDetails?.rmaNumber || '').toLowerCase().includes(q);
        const pinMatch = String(ord.deliveryPin || '').toLowerCase().includes(q);
        return idMatch || itemMatch || nameMatch || phoneMatch || rmaMatch || pinMatch;
      });
    }

    return NextResponse.json(cleanOrders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth?.isAuthenticated || auth.isAdmin && !/^[a-f\d]{24}$/i.test(String(auth.user?.id || auth.user?._id))) return NextResponse.json({ error: 'Please sign in to checkout' }, { status: 401 });
    await connectDB();
    const result = await checkoutOrder(await req.json(), auth.user.id || auth.user._id);
    return NextResponse.json(result.order, { status: 201 });
  } catch (err) { return NextResponse.json({ error: err.message || 'Order could not be reserved. Check payment configuration, balance and inventory.' }, { status: 400 }); }
}
