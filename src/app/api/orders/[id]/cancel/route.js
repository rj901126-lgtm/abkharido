import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/connectDB.js';
import { getAuthenticatedUser } from '../../../../../lib/serverAuth.js';
import { findOrder, ownsOrder, cancelAndRefund, ownerId } from '../../financialSecurity.js';
export const dynamic = 'force-dynamic';
export async function POST(req, context) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth?.isAuthenticated) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    await connectDB();
    const order = await findOrder((await context.params).id);
    if (!order || !auth.isAdmin && !ownsOrder(auth, order)) return NextResponse.json({ error: 'Order unavailable' }, { status: 403 });
    const body = await req.json().catch(() => ({}));
    const cancelledOrder = await cancelAndRefund(order._id, {
      userId: ownerId(auth),
      admin: auth.isAdmin,
      reason: String(body.reason || body.cancellationReason || (auth.isAdmin ? 'Cancelled by Store Administrator' : 'Cancelled by customer')).slice(0, 1000)
    });
    return NextResponse.json({
      success: true,
      message: cancelledOrder.financialRefundClaimed
        ? `Order cancelled & ₹${cancelledOrder.totalPrice} refunded (${cancelledOrder.refundDetails?.refundArn})`
        : 'Order cancelled & stock restored',
      order: cancelledOrder
    });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Unable to cancel this order' }, { status: 400 });
  }
}
