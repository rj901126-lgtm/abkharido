import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/connectDB.js';
import Order from '../../../../../server/models/Order.js';
import User from '../../../../../server/models/User.js';
import { getAuthenticatedUser } from '../../../../lib/serverAuth.js';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const orderIdParam = searchParams.get('orderId') || searchParams.get('orderNumber') || '';
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';

    // 1. Check Authenticated Session
    const auth = await getAuthenticatedUser(req);

    let userIds = [];
    let cleanPhone = '';

    if (auth && auth.isAuthenticated) {
      if (auth.user?.id) userIds.push(auth.user.id);
      if (auth.user?.phone) {
        cleanPhone = auth.user.phone.replace(/\D/g, '').slice(-10);
      }
    } else if (orderIdParam) {
      // 🔒 GUEST ORDER TRACKING: Only allow single order lookup when BOTH Order ID and Phone are provided
      const guestPhone = (searchParams.get('phone') || '').replace(/\D/g, '').slice(-10);
      if (!guestPhone || guestPhone.length !== 10) {
        return NextResponse.json({
          success: false,
          error: 'Phone number is required alongside Order ID for guest order verification.',
          orders: []
        }, { status: 400 });
      }

      const singleOrder = await Order.findOne({
        $and: [
          { $or: [{ cfOrderId: orderIdParam }, { _id: orderIdParam.length === 24 ? orderIdParam : undefined }].filter(Boolean) },
          { $or: [{ 'shippingAddress.phone': guestPhone }, { 'shippingAddress.phone': `+91${guestPhone}` }, { 'shippingAddress.phone': `91${guestPhone}` }] }
        ]
      }).lean();

      return NextResponse.json({
        success: true,
        orders: singleOrder ? [singleOrder] : [],
        total: singleOrder ? 1 : 0
      });
    } else {
      // Unauthenticated request without Order ID -> reject enumeration to protect customer PII
      return NextResponse.json({
        success: true,
        orders: [],
        total: 0,
        message: 'Authentication required to list order history.'
      });
    }

    let userConditions = [];
    if (userIds.length > 0) {
      userConditions.push({ user: { $in: userIds } });
    }
    if (cleanPhone && cleanPhone.length === 10) {
      userConditions.push({ 'shippingAddress.phone': cleanPhone });
      userConditions.push({ 'shippingAddress.phone': `+91${cleanPhone}` });
      userConditions.push({ 'shippingAddress.phone': `91${cleanPhone}` });
    }

    if (userConditions.length === 0) {
      return NextResponse.json({ success: true, orders: [], total: 0, page: 1, pages: 0 });
    }

    let query = { $or: userConditions };

    // Status filter
    if (status && status !== 'all') {
      let statusCondition = null;
      if (status === 'processing') {
        statusCondition = { status: { $in: ['Processing', 'Placed', 'Shipped', 'In Transit', 'Packed', 'Pending'] } };
      } else if (status === 'delivered') {
        statusCondition = { status: 'Delivered' };
      } else if (status === 'cancelled') {
        statusCondition = { status: { $in: ['Cancelled', 'CANCELLED', 'Returned'] } };
      }
      if (statusCondition) {
        query = { $and: [query, statusCondition] };
      }
    }

    // Search filter
    if (search && search.trim()) {
      const s = search.trim();
      const searchCondition = {
        $or: [
          { cfOrderId: { $regex: s, $options: 'i' } },
          { 'orderItems.name': { $regex: s, $options: 'i' } },
          { courierPartner: { $regex: s, $options: 'i' } }
        ]
      };
      query = { $and: [query, searchCondition] };
    }

    const orders = await Order.find(query).sort({ createdAt: -1 }).limit(100).lean();

    return NextResponse.json({
      success: true,
      orders: orders || [],
      total: (orders || []).length,
      page: 1,
      pages: 1
    });
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    return NextResponse.json({ success: true, orders: [], total: 0 }, { status: 200 });
  }
}

