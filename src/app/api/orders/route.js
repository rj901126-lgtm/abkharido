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

    if (search && search.trim() && auth.isAdmin) {
      const s = search.trim();
      const escaped = s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { cfOrderId: { $regex: escaped, $options: 'i' } },
        { 'orderItems.name': { $regex: escaped, $options: 'i' } },
        { 'shippingAddress.fullName': { $regex: escaped, $options: 'i' } },
        { 'shippingAddress.phone': { $regex: escaped, $options: 'i' } },
        { 'returnDetails.rmaNumber': { $regex: escaped, $options: 'i' } },
        { deliveryPin: { $regex: escaped, $options: 'i' } }
      ];
    }

    const orders = await Order.find(query)
      .populate('user', 'fullName username email phone')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Strip internal encryption fields (__enc_*) from serialized JSON
    const cleanOrders = (orders || []).map(ord => {
      const clean = { ...ord };
      Object.keys(clean).forEach(k => {
        if (k.startsWith('__enc_')) {
          delete clean[k];
        }
      });
      return clean;
    });

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
