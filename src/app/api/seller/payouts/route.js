import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '../../../../lib/connectDB.js';
import { getAuthenticatedUser } from '../../../../lib/serverAuth.js';
import User from '../../../../../server/models/User.js';
import Settlement from '../../../../../server/models/Settlement.js';
import PayoutAuditLog from '../../../../../server/models/PayoutAuditLog.js';
export const dynamic = 'force-dynamic';
async function merchant(req) {
  const auth = await getAuthenticatedUser(req);
  return auth?.isAuthenticated && auth.user.role === 'seller' && auth.user.sellerStatus === 'Approved' && auth.user.status === 'Active' ? auth.user : null;
}
export async function GET(req) {
  try {
    const seller = await merchant(req);
    if (!seller) return NextResponse.json({ error: 'Approved merchant access required' }, { status: 401 });
    await connectDB();
    const user = await User.findById(seller.id);
    const history = await Settlement.find({ vendorId: user._id }).sort({ createdAt: -1 }).limit(100).lean();
    const balance = Number(user.walletCash) || 0;
    return NextResponse.json({ success: true, balance: { walletBalance: balance, availableBalance: balance, pendingSettlement: history.filter(p => ['Pending','Processing'].includes(p.status)).reduce((sum,p) => sum + p.amount,0) }, history: history.map(p => ({ id: p._id, amount: p.amount, status: p.status, date: p.createdAt, utr: p.transactionId || '', method: p.notes || '' })) });
  } catch { return NextResponse.json({ error: 'Failed to fetch merchant payouts' }, { status: 500 }); }
}
export async function POST(req) {
  let session;
  try {
    const seller = await merchant(req);
    if (!seller) return NextResponse.json({ error: 'Approved merchant access required' }, { status: 401 });
    const body = await req.json();
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount < 500 || !Number.isInteger(amount)) return NextResponse.json({ error: 'Withdrawal must be a whole amount of at least ₹500' }, { status: 400 });
    await connectDB();
    session = await mongoose.startSession();
    let settlement;
    let remainingBalance;
    await session.withTransaction(async () => {
      const user = await User.findById(seller.id).session(session);
      if (!user || user.role !== 'seller' || user.status !== 'Active' || user.sellerStatus !== 'Approved') throw new Error('MERCHANT_UNAVAILABLE');
      const destination = user.payoutDetails?.upiId || user.payoutDetails?.bankAccount;
      if (!destination) throw new Error('DESTINATION_REQUIRED');
      const debited = await User.findOneAndUpdate({ _id: user._id, status: 'Active', sellerStatus: 'Approved', walletCash: { $gte: amount } }, { $inc: { walletCash: -amount } }, { new: true, session });
      if (!debited) throw new Error('INSUFFICIENT_BALANCE');
      [settlement] = await Settlement.create([{ vendorId: user._id, amount, status: 'Pending', notes: `Merchant payout requested via ${user.payoutDetails?.upiId ? 'UPI' : 'Bank'}` }], { session });
      await PayoutAuditLog.create([{ action: 'REQUESTED', userId: user._id, amount, settlementId: settlement._id, performedBy: user._id, details: { destination, method: user.payoutDetails?.upiId ? 'UPI' : 'Bank' } }], { session });
      remainingBalance = debited.walletCash;
    });
    return NextResponse.json({ success: true, message: 'Withdrawal request submitted for approval', payout: { id: settlement._id, amount, status: 'Pending' }, remainingBalance });
  } catch (error) {
    const expected = ['INSUFFICIENT_BALANCE','DESTINATION_REQUIRED','MERCHANT_UNAVAILABLE'].includes(error.message);
    return NextResponse.json({ error: expected ? ({ INSUFFICIENT_BALANCE: 'Insufficient available merchant balance', DESTINATION_REQUIRED: 'Configure a payout destination in your profile', MERCHANT_UNAVAILABLE: 'Merchant access unavailable' })[error.message] : 'Unable to submit withdrawal request' }, { status: expected ? 400 : 500 });
  } finally { if (session) await session.endSession(); }
}
