import { NextResponse } from 'next/server';
import connectDB from '../../../lib/connectDB.js';
import User from '../../../../server/models/User.js';
import Order from '../../../../server/models/Order.js';
import Settlement from '../../../../server/models/Settlement.js';
import PayoutAuditLog from '../../../../server/models/PayoutAuditLog.js';
import { getAuthenticatedUser } from '../../../lib/serverAuth.js';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth?.isAuthenticated) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required to request a payout' },
        { status: 401, headers: { 'Cache-Control': 'private, no-store' } }
      );
    }

    await connectDB();
    const user = await User.findById(auth.user.id);
    if (!user) {
      return NextResponse.json(
        { error: 'User account not found' },
        { status: 404, headers: { 'Cache-Control': 'private, no-store' } }
      );
    }

    if (user.status === 'Suspended') {
      return NextResponse.json(
        { error: 'Account is suspended. Payouts are currently disabled.' },
        { status: 403, headers: { 'Cache-Control': 'private, no-store' } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const rawAmount = Number(body.amount);

    // Verify destination details exist
    const hasUpi = Boolean(user.payoutDetails?.upiId && String(user.payoutDetails.upiId).trim().length > 3);
    const hasBank = Boolean(user.payoutDetails?.bankAccount && String(user.payoutDetails.bankAccount).trim().length > 5);
    if (!hasUpi && !hasBank && !body.destination) {
      return NextResponse.json(
        { error: 'Please configure your UPI ID or Bank Account in your profile before requesting a payout.' },
        { status: 400, headers: { 'Cache-Control': 'private, no-store' } }
      );
    }

    // Server-enforced 8-day lock on newly earned coins [MIRROR OF CURRENT UI/CODE — OWNER TO CONFIRM]
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
    const lockedOrders = await Order.find({
      'referralApplied.referrerId': user.username,
      'referralApplied.isCredited': true,
      deliveredAt: { $gte: eightDaysAgo }
    }).lean();

    const lockedCoins = lockedOrders.reduce((sum, o) => sum + (o.referralApplied?.rewardAmount || 0), 0);
    const availableCoins = Math.max(0, (user.walletCoins || 0) - lockedCoins);

    const requestedAmount = !isNaN(rawAmount) && rawAmount > 0 ? Math.floor(rawAmount) : availableCoins;

    // Minimum payout threshold: 1,000 coins [MIRROR OF CURRENT UI/CODE — OWNER TO CONFIRM]
    if (requestedAmount < 1000) {
      return NextResponse.json(
        { error: 'Minimum withdrawal amount is 1,000 coins. You can still use your coins for store purchases!' },
        { status: 400, headers: { 'Cache-Control': 'private, no-store' } }
      );
    }

    if (requestedAmount > availableCoins) {
      return NextResponse.json(
        { error: `Requested amount (₹${requestedAmount}) exceeds withdrawable balance of ₹${availableCoins}.` },
        { status: 400, headers: { 'Cache-Control': 'private, no-store' } }
      );
    }

    // Atomic coin balance deduction (strictly debit token user only, never client-supplied username)
    const updatedUser = await User.findOneAndUpdate(
      { _id: user._id, walletCoins: { $gte: requestedAmount } },
      { $inc: { walletCoins: -requestedAmount } },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Insufficient withdrawable coins for this transaction.' },
        { status: 400, headers: { 'Cache-Control': 'private, no-store' } }
      );
    }

    // Create Settlement Record
    const settlement = await Settlement.create({
      vendorId: user._id,
      amount: requestedAmount,
      status: 'Pending',
      notes: `User withdrawal via ${body.method || (hasUpi ? 'UPI' : 'Bank Transfer')}`
    });

    // Create Audit Log
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    await PayoutAuditLog.create({
      action: 'REQUESTED',
      userId: user._id,
      amount: requestedAmount,
      settlementId: settlement._id,
      performedBy: user._id,
      ipAddress: String(ip).substring(0, 50),
      details: {
        method: body.method || 'Default',
        destination: hasUpi ? user.payoutDetails?.upiId : user.payoutDetails?.bankAccount,
        message: 'User initiated withdrawal'
      }
    });

    return NextResponse.json(
      {
        success: true,
        message: `Payout request of ₹${requestedAmount.toLocaleString('en-IN')} submitted successfully.`,
        remainingCoins: updatedUser.walletCoins
      },
      { status: 200, headers: { 'Cache-Control': 'private, no-store' } }
    );

  } catch (error) {
    console.error('Payout request error:', error);
    return NextResponse.json(
      { error: 'Failed to process payout request.' },
      { status: 500, headers: { 'Cache-Control': 'private, no-store' } }
    );
  }
}
