import { PRODUCTS } from '../../../db/mockData.js';
import { NextResponse } from 'next/server';

export async function GET() {
  const totalProducts = PRODUCTS.length;
  const totalOrders = 0;
  const totalUsers = 1;

  return NextResponse.json({
    totalProducts,
    totalOrders,
    totalUsers,
    totalRevenue: 0,
    topCategories: ['mobiles', 'electronics', 'fashion'],
    recentActivity: [],
    message: 'Mock stats — connect backend for live data'
  });
}

export async function POST() {
  // Click tracking - mock
  return NextResponse.json({ success: true });
}
