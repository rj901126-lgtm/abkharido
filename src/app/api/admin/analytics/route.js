import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/connectDB.js';
import Order from '../../../../../server/models/Order.js';
import User from '../../../../../server/models/User.js';
import Product from '../../../../../server/models/Product.js';
import { getAuthenticatedUser } from '../../../../lib/serverAuth.js';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth || !auth.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }

    await connectDB();
    const orders = await Order.find({}).lean();
    const userCount = await User.countDocuments({});
    const productCount = await Product.countDocuments({});

    const paidOrders = orders.filter(o => o.isPaid || o.status === 'Placed' || o.status === 'Delivered');
    const gmv = paidOrders.reduce((acc, o) => acc + (o.totalPrice || 0), 0);
    const liveOrders = orders.filter(order => !['delivered', 'cancelled', 'canceled', 'refunded', 'returned', 'failed'].includes(String(order.status || '').toLowerCase())).length;
    const revenueByBuyer = new Map();
    for (const order of paidOrders) {
      const buyerId = String(order.user || '');
      if (buyerId) revenueByBuyer.set(buyerId, (revenueByBuyer.get(buyerId) || 0) + 1);
    }
    const buyerCount = revenueByBuyer.size;
    const repeatBuyers = [...revenueByBuyer.values()].filter(orderCount => orderCount > 1).length;

    return NextResponse.json({
      success: true,
      kpis: {
        totalUsers: userCount,
        totalProducts: productCount,
        totalOrders: orders.length,
        liveOrders,
        totalRevenue: gmv,
        clv: buyerCount ? Math.round(gmv / buyerCount) : 0,
        retentionRate: buyerCount ? Math.round((repeatBuyers / buyerCount) * 100) : 0
      },
      gmv,
      totalOrders: orders.length,
      liveOrders,
      paidOrdersCount: paidOrders.length,
      totalUsers: userCount,
      totalProducts: productCount,
      averageOrderValue: paidOrders.length > 0 ? Math.round(gmv / paidOrders.length) : 0
    });
  } catch (error) {
    console.error('[Admin Analytics API Error]:', error);
    return NextResponse.json({ error: 'Unable to load analytics' }, { status: 500 });
  }
}
