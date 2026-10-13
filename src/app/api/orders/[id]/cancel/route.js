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
    return NextResponse.json({ success: true, order: await cancelAndRefund(order._id, { userId: ownerId(auth), admin: auth.isAdmin, reason: String(body.reason || body.cancellationReason || 'Cancelled by customer').slice(0, 1000) }) });
  } catch { return NextResponse.json({ error: 'Unable to cancel this order' }, { status: 400 }); }
}
