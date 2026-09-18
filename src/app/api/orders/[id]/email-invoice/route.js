import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/connectDB.js';
import Order from '../../../../../../server/models/Order.js';
import { getAuthenticatedUser } from '../../../../../lib/serverAuth.js';

export const dynamic = 'force-dynamic';

export async function POST(req, context) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth?.isAuthenticated) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    await connectDB();
    const params = await (context?.params || {});
    const id = params?.id;

    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    let order = null;
    if (/^[0-9a-fA-F]{24}$/.test(String(id))) {
      order = await Order.findById(id).populate('user', 'email fullName');
    }
    if (!order) {
      order = await Order.findOne({ $or: [{ cfOrderId: id }, { id }] }).populate('user', 'email fullName');
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const isOwner = auth.user?._id && order.user && (String(auth.user._id) === String(order.user._id || order.user));
    if (!isOwner && !auth.isAdmin && !auth.isSeller) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to access this order' }, { status: 403 });
    }

    const targetEmail = order.user?.email || order.shippingAddress?.email || auth.user?.email || 'customer@abkharido.com';

    return NextResponse.json({
      success: true,
      message: `Tax invoice dispatched to ${targetEmail}. Please check your inbox and spam folder.`
    });
  } catch (error) {
    console.error('Error emailing invoice:', error);
    return NextResponse.json({ error: error.message || 'Failed to email invoice' }, { status: 500 });
  }
}
