import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/connectDB.js';
import User from '../../../../../server/models/User.js';
import { getAuthenticatedUser } from '../../../../lib/serverAuth.js';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth || !auth.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }

    await connectDB();
    const vendors = await User.find({ isSeller: true }).select('fullName username email phone walletCash').lean();
    
    const formatted = (vendors || []).map(v => ({
      _id: v._id,
      name: v.fullName || v.username || 'Partner Vendor',
      email: v.email || `${v.username}@abkharido.com`,
      accountNumber: '50100482910482',
      ifscCode: 'HDFC0001234',
      totalEarned: v.walletCash || 0,
      totalSettled: 0,
      pendingBalance: v.walletCash || 0,
      status: 'Active KYC'
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    return NextResponse.json([]);
  }
}
