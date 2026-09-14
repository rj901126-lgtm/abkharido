import { NextResponse } from 'next/server';
import connectDB from '../../../lib/connectDB.js';
import User from '../../../../server/models/User.js';
import { getAuthenticatedUser } from '../../../lib/serverAuth.js';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth || !auth.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }

    await connectDB();
    const sellers = await User.find({ role: 'seller' })
      .select('-password')
      .lean();

    return NextResponse.json(sellers);
  } catch (error) {
    console.error('Admin Sellers GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch sellers' }, { status: 500 });
  }
}
