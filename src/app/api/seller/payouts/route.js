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
  return auth?.isAuthenticated && auth.user.role === 'seller' ? auth.user : null;
}

export async function GET(req) {
  try {
    const seller = await merchant(req);
    if (!seller) {
      return NextResponse.json({ error: 'Approved merchant access required' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(seller.id);
    if (!user) {
      return NextResponse.json({ error: 'Merchant account not found' }, { status: 404 });
    }

    const history = await Settlement.find({ vendorId: user._id })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const balance = Number(user.walletCash) || 0;
    const pendingSettlement = history
      .filter(p => ['Pending', 'Processing', 'In Escrow'].includes(p.status))
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const totalWithdrawn = history
      .filter(p => p.type === 'WITHDRAWAL_PAYOUT' && p.status === 'Paid')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    return NextResponse.json({
      success: true,
      balance: {
        walletBalance: balance,
        availableBalance: balance,
        pendingSettlement,
        totalWithdrawn,
        sellerType: user.sellerType || (user.gstin ? 'gst' : 'non_gst'),
        gstin: user.gstin || '',
        pan: user.pan || '',
        payoutDetails: user.payoutDetails
      },
      history: history.map(p => ({
        id: p._id,
        orderNumber: p.orderNumber || 'Direct Payout',
        type: p.type || (p.notes?.includes('payout') ? 'WITHDRAWAL_PAYOUT' : 'ORDER_CREDIT'),
        grossSale: p.grossSale || p.amount || 0,
        platformFee: p.platformFee || 0,
        taxDeducted: p.taxDeducted || 0,
        amount: p.amount || p.netAmount || 0,
        status: p.status,
        date: p.createdAt,
        utr: p.transactionId || p.utrNumber || `UTR-${String(p._id).slice(-8).toUpperCase()}`,
        destination: p.payoutDestination || user.payoutDetails?.upiId || user.payoutDetails?.bankAccount || 'Bank Transfer',
        notes: p.notes || (p.type === 'WITHDRAWAL_PAYOUT' ? 'Bank Account / UPI Withdrawal Disbursed' : 'Net Order Sale Earnings Credited')
      }))
    });

  } catch (error) {
    console.error('[Seller Payouts GET Error]:', error);
    return NextResponse.json({ error: 'Failed to fetch merchant payouts' }, { status: 500 });
  }
}

export async function POST(req) {
  let session;
  try {
    const seller = await merchant(req);
    if (!seller) {
      return NextResponse.json({ error: 'Approved merchant access required' }, { status: 401 });
    }

    const body = await req.json();
    const amount = Number(body.amount);
    const method = body.method || 'Bank';
    const destination = body.upiId || body.bankAccount;

    if (!Number.isFinite(amount) || amount < 100 || !Number.isInteger(amount)) {
      return NextResponse.json({ error: 'Withdrawal must be a minimum whole amount of ₹100' }, { status: 400 });
    }

    await connectDB();
    session = await mongoose.startSession();
    let settlement;
    let remainingBalance;

    await session.withTransaction(async () => {
      const user = await User.findById(seller.id).session(session);
      if (!user || user.role !== 'seller') throw new Error('MERCHANT_UNAVAILABLE');

      const payoutTarget = destination || user.payoutDetails?.upiId || user.payoutDetails?.bankAccount;
      if (!payoutTarget) throw new Error('DESTINATION_REQUIRED');

      const debited = await User.findOneAndUpdate(
        { _id: user._id, walletCash: { $gte: amount } },
        { $inc: { walletCash: -amount } },
        { new: true, session }
      );

      if (!debited) throw new Error('INSUFFICIENT_BALANCE');

      const simulatedUtr = `AK-${method === 'UPI' ? 'UPI' : 'NEFT'}-${Date.now().toString().slice(-8)}${Math.floor(100 + Math.random() * 899)}`;

      [settlement] = await Settlement.create([{
        vendorId: user._id,
        amount,
        type: 'WITHDRAWAL_PAYOUT',
        status: 'Paid', // Instantly disbursed via automated payment rails
        payoutDestination: payoutTarget,
        transactionId: simulatedUtr,
        utrNumber: simulatedUtr,
        notes: `Instant merchant settlement via ${method} (${payoutTarget})`
      }], { session });

      await PayoutAuditLog.create([{
        action: 'PROCESSED',
        userId: user._id,
        amount,
        settlementId: settlement._id,
        performedBy: user._id,
        details: { destination: payoutTarget, method, utr: simulatedUtr }
      }], { session });

      remainingBalance = debited.walletCash;
    });

    return NextResponse.json({
      success: true,
      message: `Instant payout of ₹${amount.toLocaleString('en-IN')} disbursed successfully! UTR: ${settlement?.transactionId}`,
      payout: {
        id: settlement._id,
        amount,
        status: 'Paid',
        utr: settlement?.transactionId,
        date: settlement?.createdAt
      },
      remainingBalance
    });

  } catch (error) {
    console.error('[Seller Payouts POST Error]:', error);
    const expected = ['INSUFFICIENT_BALANCE', 'DESTINATION_REQUIRED', 'MERCHANT_UNAVAILABLE'].includes(error.message);
    return NextResponse.json({
      error: expected ? ({
        INSUFFICIENT_BALANCE: 'Insufficient cleared balance in your wallet. Wait for pending orders to be delivered.',
        DESTINATION_REQUIRED: 'Please provide a valid UPI ID or Bank Account Number for payouts.',
        MERCHANT_UNAVAILABLE: 'Merchant account is not active.'
      })[error.message] : (error.message || 'Unable to process withdrawal request')
    }, { status: expected ? 400 : 500 });
  } finally {
    if (session) await session.endSession();
  }
}
