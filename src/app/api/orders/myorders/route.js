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
    const targetPhone = (phone || username || (user?.phone) || '').replace(/\D/g, '').slice(-10);
    if (targetPhone) {
      const allMatchedUsers = await User.find({
        $or: [{ phone: targetPhone }, { username: targetPhone }, { phone: `+91${targetPhone}` }]
      }).select('_id').lean();
      allMatchedUsers.forEach(u => {
        if (!userIds.some(id => String(id) === String(u._id))) {
          userIds.push(u._id);
        }
      });
    }

    let query = {};
    if (userIds.length > 0) {
      query.$or = [
        { user: { $in: userIds } },
        ...(targetPhone ? [{ 'shippingAddress.phone': { $regex: targetPhone } }] : [])
      ];
    } else if (targetPhone) {
      query['shippingAddress.phone'] = { $regex: targetPhone };
    }

    // Status filter
    if (status && status !== 'all') {
      if (status === 'processing') {
        query.status = { $in: ['Processing', 'Placed', 'Shipped', 'In Transit', 'Packed', 'Pending'] };
      } else if (status === 'delivered') {
        query.status = 'Delivered';
      } else if (status === 'cancelled') {
        query.status = { $in: ['Cancelled', 'CANCELLED', 'Returned'] };
      }
    }

    // Search filter
    if (search && search.trim()) {
      const s = search.trim();
      const searchCondition = [
        { cfOrderId: { $regex: s, $options: 'i' } },
        { 'orderItems.name': { $regex: s, $options: 'i' } },
        { courierPartner: { $regex: s, $options: 'i' } }
      ];
      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchCondition }];
        delete query.$or;
      } else {
        query.$or = searchCondition;
      }
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
