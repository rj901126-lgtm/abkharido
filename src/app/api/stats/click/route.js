import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/connectDB.js';
import { checkRouteRateLimit } from '../../../../lib/rateLimiter.js';
import User from '../../../../../server/models/User.js';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const limit = checkRouteRateLimit('referral-clicks', ip, 30, 5 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json({ error: 'Too many referral visits. Please try again later.' }, { status: 429 });
    }

    const body = await req.json().catch(() => null);
    const referralCode = typeof body?.referralCode === 'string' ? body.referralCode.trim().toUpperCase() : '';
    if (!/^[A-Z0-9_-]{3,32}$/.test(referralCode)) {
      return NextResponse.json({ error: 'A valid referral code is required.' }, { status: 400 });
    }

    await connectDB();
    await User.updateOne(
      { referralCode },
      { $inc: { 'referralStats.clicks': 1 } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/stats/click failed:', error);
    return NextResponse.json({ error: 'Unable to record referral visit' }, { status: 500 });
  }
}
