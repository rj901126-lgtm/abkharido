import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/connectDB.js';
import { getAuthenticatedUser } from '../../../../../lib/serverAuth.js';
import { checkoutOrder } from '../../../orders/financialSecurity.js';
export const dynamic = 'force-dynamic';
export async function POST(req) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth?.isAuthenticated) return NextResponse.json({ error: 'Please sign in to checkout' }, { status: 401 });
    await connectDB();
    const result = await checkoutOrder(await req.json(), auth.user.id || auth.user._id, true);
    return NextResponse.json(result);
  } catch { return NextResponse.json({ error: 'Unable to reserve order or create payment session' }, { status: 400 }); }
}
