import { NextResponse } from 'next/server';
import connectDB from '../../../lib/connectDB.js';
import { getAuthenticatedUser } from '../../../lib/serverAuth.js';
import { readWishlist } from '../../../../server/utils/wishlistStore.js';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth?.user?.id) return NextResponse.json({ error: 'Login required' }, { status: 401 });
    await connectDB();
    return NextResponse.json(await readWishlist(auth.user.id));
  } catch (error) {
    console.error('GET /api/wishlist failed:', error);
    return NextResponse.json({ error: 'Unable to load wishlist' }, { status: error.status || 500 });
  }
}
