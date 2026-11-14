import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/connectDB.js';
import { getAuthenticatedUser } from '../../../../lib/serverAuth.js';
import { syncWishlist } from '../../../../../server/utils/wishlistStore.js';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth?.user?.id) return NextResponse.json({ error: 'Login required' }, { status: 401 });
    const body = await req.json().catch(() => null);
    await connectDB();
    const wishlist = await syncWishlist(auth.user.id, body);
    return NextResponse.json({ success: true, wishlist });
  } catch (error) {
    console.error('POST /api/wishlist/sync failed:', error);
    return NextResponse.json({ error: 'Unable to save wishlist' }, { status: error.status || 500 });
  }
}
