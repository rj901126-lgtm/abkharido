import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../lib/serverAuth.js';
import connectDB from '../../../lib/connectDB.js';
import User from '../../../../server/models/User.js';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth || !auth.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(auth.user.id).select('walletCoins role partnerStats').lean();

    // Stats scoped strictly to the authenticated user/partner
    const partnerStats = user?.partnerStats || {};

    return NextResponse.json({
      success: true,
      clicks: partnerStats.clicks || 0,
      conversions: partnerStats.conversions || 0,
      walletCoins: user?.walletCoins || 0,
      history: partnerStats.history || [],
      payouts: partnerStats.payouts || []
    });
  } catch (error) {
    console.error('[Stats API Error]:', error.message || error);
    return NextResponse.json({ error: 'Failed to fetch partner statistics' }, { status: 500 });
  }
}
