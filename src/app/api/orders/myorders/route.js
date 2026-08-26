import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/connectDB.js';
import Order from '../../../../../server/models/Order.js';
import User from '../../../../../server/models/User.js';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username') || '';
    const email = searchParams.get('email') || '';
    const phone = searchParams.get('phone') || '';
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';

    // 1. Resolve user ID
    let user = null;
    const authHeader = req.headers.get('authorization') || '';
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      try {
        const jwt = (await import('jsonwebtoken')).default;
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'abkharido_enterprise_secret_2026');
        if (decoded && decoded.id) {
          user = await User.findById(decoded.id).lean();
        }
      } catch (_) {}
    }

    if (!user && (username || email || phone)) {
      user = await User.findOne({
        $or: [
          { username: username || undefined },
          { email: email || undefined },
          { phone: phone || username || undefined },
          { phone: `+91${phone || username}` }
        ].filter(Boolean)
      }).lean();
    }

    let userIds = [];
    if (user) {
      userIds.push(user._id);
    }

    const cleanPhone = (phone || (user?.phone) || (username && /^\d{10}$/.test(username) ? username : '') || '').replace(/\D/g, '').slice(-10);
    if (cleanPhone && cleanPhone.length === 10) {
      const allMatchedUsers = await User.find({
        $or: [{ phone: cleanPhone }, { username: cleanPhone }, { phone: `+91${cleanPhone}` }, { phone: `91${cleanPhone}` }]
      }).select('_id').lean();
      allMatchedUsers.forEach(u => {
        if (!userIds.some(id => String(id) === String(u._id))) {
          userIds.push(u._id);
        }
      });
    }

    // 🔒 STRICT PRIVACY LOCK: Never return orders if no user or 10-digit phone is identified
    if (userIds.length === 0 && (!cleanPhone || cleanPhone.length !== 10)) {
      return NextResponse.json({
        success: true,
        orders: [],
        total: 0,
        page: 1,
        pages: 0
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

