import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../lib/serverAuth.js';
import connectDB from '../../../lib/connectDB.js';
import User from '../../../../server/models/User.js';
import Order from '../../../../server/models/Order.js';
import Settlement from '../../../../server/models/Settlement.js';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth?.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(auth.user.id).select('walletCoins role referralStats').lean();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const [referralOrders, payoutRecords, conversions] = await Promise.all([
      Order.find({ 'referralApplied.recipientId': user._id })
        .select('orderItems totalPrice createdAt referralApplied')
        .sort({ createdAt: -1 })
        .limit(100)
        .lean(),
      Settlement.find({
        vendorId: user._id,
        $or: [
          { type: 'WITHDRAWAL_PAYOUT' },
          { notes: { $regex: '^User withdrawal via' } }
        ]
      })
        .select('amount status notes createdAt payoutDestination')
        .sort({ createdAt: -1 })
        .limit(100)
        .lean(),
      Order.countDocuments({
        'referralApplied.recipientId': user._id,
        'referralApplied.isCredited': true,
        'referralApplied.isReversed': { $ne: true }
      })
    ]);

    const history = referralOrders.map(order => {
      const reward = order.referralApplied || {};
      const items = Array.isArray(order.orderItems) ? order.orderItems : [];
      return {
        id: String(order._id),
        date: order.createdAt ? new Date(order.createdAt).toISOString() : '',
        productName: items.map(item => item.name || item.productName || item.title).filter(Boolean).join(', ') || 'Referred order',
        amount: Number(order.totalPrice) || 0,
        earnings: Number(reward.rewardAmount) || 0,
        status: reward.isReversed ? 'Reversed' : reward.isCredited ? 'Approved' : 'Pending'
      };
    });

    const payouts = payoutRecords.map(payout => ({
      date: payout.createdAt ? new Date(payout.createdAt).toISOString() : '',
      amount: Number(payout.amount) || 0,
      method: payout.payoutDestination || payout.notes?.match(/via\s+(.+)$/i)?.[1] || 'Payout',
      status: payout.status || 'Pending'
    }));

    return NextResponse.json({
      success: true,
      clicks: Number(user.referralStats?.clicks) || 0,
      conversions,
      walletCoins: Number(user.walletCoins) || 0,
      history,
      payouts
    });
  } catch (error) {
    console.error('[Stats API Error]:', error?.message || error);
    return NextResponse.json({ error: 'Unable to load partner statistics' }, { status: 500 });
  }
}
