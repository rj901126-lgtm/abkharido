import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/connectDB.js';
import Order from '../../../../../server/models/Order.js';
import { getAuthenticatedUser } from '../../../../lib/serverAuth.js';
export const dynamic = 'force-dynamic';
export async function GET(req) {
 try { const auth = await getAuthenticatedUser(req); if (!auth?.isAuthenticated) return NextResponse.json({ error: 'Authentication required', orders: [] }, { status: 401 }); await connectDB(); const orders = await Order.find({ user: auth.user.id || auth.user._id }).sort({ createdAt: -1 }).limit(100); return NextResponse.json({ success: true, orders, total: orders.length, page: 1, pages: 1 }); }
 catch { return NextResponse.json({ error: 'Unable to load orders' }, { status: 500 }); }
}
