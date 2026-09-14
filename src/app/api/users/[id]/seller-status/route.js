import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/connectDB.js';
import User from '../../../../../../server/models/User.js';
import { getAuthenticatedUser } from '../../../../../lib/serverAuth.js';

export const dynamic = 'force-dynamic';

export async function PUT(req, { params }) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth || !auth.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { sellerStatus } = body;

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: 'User/Seller not found' }, { status: 404 });
    }

    if (sellerStatus) {
      user.sellerStatus = sellerStatus;
    }
    if (sellerStatus === 'Approved') {
      user.role = 'seller';
    }
    await user.save();

    return NextResponse.json({
      success: true,
      message: `Seller status updated to ${sellerStatus}`,
      user: {
        id: user._id,
        shopName: user.shopName,
        sellerStatus: user.sellerStatus
      }
    });

  } catch (error) {
    console.error('Update Seller Status error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update seller status' }, { status: 500 });
  }
}
