import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/connectDB.js';
import { getAuthenticatedUser } from '../../../../../lib/serverAuth.js';
import { findOrder, ownsOrder, startConversion } from '../../financialSecurity.js';
export const dynamic = 'force-dynamic';
export async function POST(req, context) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth?.isAuthenticated) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    await connectDB();
    const order = await findOrder((await context.params).id);
    if (!order || !auth.isAdmin && !ownsOrder(auth, order)) return NextResponse.json({ error: 'Order unavailable' }, { status: 403 });
    return NextResponse.json(await startConversion(order));
  } catch { return NextResponse.json({ error: 'Unable to create verified payment session' }, { status: 400 }); }
}
