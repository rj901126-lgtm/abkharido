import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '../../../../../lib/connectDB.js';
import Order from '../../../../../../server/models/Order.js';
import { getAuthenticatedUser } from '../../../../../lib/serverAuth.js';
import { findOrder, ownsOrder, settleVerifiedPayment } from '../../../orders/financialSecurity.js';
export const dynamic = 'force-dynamic';
export async function POST(req) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth?.isAuthenticated) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    await connectDB();
    const body = await req.json();
    const order = await findOrder(body.orderId);
    if (!order || !auth.isAdmin && !ownsOrder(auth, order)) return NextResponse.json({ error: 'Order unavailable' }, { status: 403 });
    await settleVerifiedPayment(String(order._id));
    return NextResponse.json({ success: true, status: 'PAID' });
  } catch { return NextResponse.json({ success: false, status: 'PENDING', message: 'Payment has not been verified' }, { status: 400 }); }
}
// Browser return/redirect GET handler: READ-ONLY, NEVER marks paid
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('order_id') || searchParams.get('orderId');
    
    if (!orderId) {
      return NextResponse.json(
        { success: false, status: 'PENDING', message: 'Order ID is required.' },
        { status: 400, headers: { 'Cache-Control': 'private, no-store' } }
      );
    }

    await connectDB();
    const isObjId = mongoose.Types.ObjectId.isValid(orderId) && /^[0-9a-fA-F]{24}$/.test(orderId);
    const order = await Order.findOne({
      $or: [
        { cfOrderId: orderId },
        ...(isObjId ? [{ _id: orderId }] : [])
      ]
    }).select('status isPaid totalPrice cfOrderId createdAt').lean();

    if (!order) {
      return NextResponse.json(
        { success: false, status: 'PENDING', message: 'Payment verification pending.' },
        { status: 200, headers: { 'Cache-Control': 'private, no-store' } }
      );
    }

    return NextResponse.json(
      {
        success: Boolean(order.isPaid),
        status: order.isPaid ? 'PAID' : 'PENDING',
        orderId: order.cfOrderId || order._id
      },
      { status: 200, headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, status: 'PENDING', message: 'Payment check temporarily unavailable.' },
      { status: 500, headers: { 'Cache-Control': 'private, no-store' } }
    );
  }
}
