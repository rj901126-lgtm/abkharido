import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/connectDB.js';
import { getAuthenticatedUser } from '../../../../../lib/serverAuth.js';
import { findOrder, recordCashCollection } from '../../financialSecurity.js';
export const dynamic = 'force-dynamic';
export async function POST(req, context) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth?.isAuthenticated || !auth.isAdmin) return NextResponse.json({ error: 'Admin required' }, { status: 403 });
    await connectDB();
    const order = await findOrder((await context.params).id);
    const body = await req.json();
    if (!order || body.cashCollected !== true) return NextResponse.json({ error: 'Explicit collection confirmation required' }, { status: 400 });
    return NextResponse.json({ success: true, order: await recordCashCollection(order._id, body.collectedAmount) });
  } catch { return NextResponse.json({ error: 'Unable to record cash collection' }, { status: 400 }); }
}
