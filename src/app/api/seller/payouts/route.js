import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '../../../../lib/connectDB.js';
import User from '../../../../../server/models/User.js';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'abkharido_enterprise_secret_2026_super_secure';

function verifySeller(req) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export async function GET(req) {
  try {
    await connectDB();
    const seller = verifySeller(req);

    if (!seller || !seller.id) {
      return NextResponse.json({ error: 'Unauthorized merchant access' }, { status: 401 });
    }

    const user = await User.findById(seller.id).lean();
    const walletBalance = user?.walletCoins || user?.sellerWalletBalance || 0;

    return NextResponse.json({
      success: true,
      balance: {
        availableBalance: walletBalance,
        pendingSettlement: 0,
        lifetimeEarnings: walletBalance,
        nextPayoutDate: 'Weekly Auto-Transfer (T+2)'
      },
      history: []
    });

  } catch (error) {
    console.error('Seller Payouts GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch payout history' }, { status: 500 });
  }
}


export async function POST(req) {
  try {
    await connectDB();
    const seller = verifySeller(req);
    const body = await req.json().catch(() => ({}));
    const { amount, method = 'UPI', upiId, bankAccount } = body;

    const withdrawAmt = Number(amount);
    if (isNaN(withdrawAmt) || withdrawAmt < 500) {
      return NextResponse.json({ error: 'Minimum withdrawal amount is ₹500' }, { status: 400 });
    }

    const payoutTxn = {
      id: `PAY-${Math.floor(100000 + Math.random() * 900000)}`,
      amount: withdrawAmt,
      method: method === 'UPI' ? `UPI (${upiId || 'brand@upi'})` : `Bank Account (${bankAccount || 'Direct A/C'})`,
      utr: `REQ${Date.now().toString().slice(-8)}`,
      status: 'Processing',
      date: new Date().toISOString().split('T')[0]
    };

    return NextResponse.json({
      success: true,
      message: `Withdrawal request for ₹${withdrawAmt.toLocaleString('en-IN')} submitted successfully!`,
      payout: payoutTxn
    });

  } catch (error) {
    console.error('Seller Payouts POST error:', error);
    return NextResponse.json({ error: error.message || 'Failed to submit withdrawal request' }, { status: 500 });
  }
}
