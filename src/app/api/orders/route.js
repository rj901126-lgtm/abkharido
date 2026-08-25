import { NextResponse } from 'next/server';
import connectDB from '../../../lib/connectDB.js';
import Order from '../../../../server/models/Order.js';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit')) || 200;
    const status = searchParams.get('status') || '';

    let query = {};
    if (status && status !== 'all' && status !== 'ALL') {
      if (status === 'LIVE') {
        query.status = { $nin: ['Cancelled', 'CANCELLED', 'Returned'] };
      } else {
        query.status = status;
      }
    }

    const orders = await Order.find(query).populate('user', 'fullName username email phone').sort({ createdAt: -1 }).limit(limit).lean();

    return NextResponse.json(orders || []);
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    return NextResponse.json([]);
  }
}
