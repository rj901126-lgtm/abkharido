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
    const sellerDocs = await User.find({ role: 'seller' })
      .select('-password')
      .sort({ createdAt: -1 });

    const sellers = (sellerDocs || []).map(doc => {
      const s = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
      Object.keys(s).forEach(k => {
        if (k.startsWith('__enc_')) delete s[k];
      });
      return {
        ...s,
        sellerGstin: s.gstin || s.sellerGstin || '',
        sellerState: s.pickupAddress?.state || s.state || s.sellerState || 'Maharashtra'
      };
    });

    return NextResponse.json(sellers);
  } catch (error) {
    console.error('Admin Sellers GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch sellers' }, { status: 500 });
  }
}
