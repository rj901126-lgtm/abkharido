import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/connectDB.js';
import User from '../../../../../server/models/User.js';
import { signUserToken } from '../../../../../server/utils/authSecurity.js';
import { isValidEmail } from '../../../../utils/constants.js';
export const dynamic = 'force-dynamic';
export async function POST(req) {
  try {
    const body = await req.json();
    const { action = 'login', email, password, shopName, phone, address, upi, bankAccount, bankIfsc } = body;
    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    await connectDB();
    const identifier = email.trim().toLowerCase();
    if (action === 'signup') {
      if (!isValidEmail(identifier)) return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
      if (typeof shopName !== 'string' || !shopName.trim() || password.length < 8) return NextResponse.json({ error: 'Shop name and password of at least 8 characters are required' }, { status: 400 });
      const clauses = [{ email: identifier }, { username: identifier }];
      if (typeof phone === 'string' && phone.trim()) clauses.push({ phone: phone.trim().replace(/\D/g, '').slice(-10) });
      if (await User.exists({ $or: clauses })) return NextResponse.json({ error: 'An account with these credentials already exists' }, { status: 409 });
      const seller = await User.create({ username: identifier, email: identifier, password, role: 'seller', sellerStatus: 'Pending', shopName: shopName.trim(), phone: typeof phone === 'string' && phone.trim() ? phone.trim().replace(/\D/g, '').slice(-10) : undefined, address: typeof address === 'string' ? address : '', payoutDetails: { upiId: typeof upi === 'string' ? upi : '', bankAccount: typeof bankAccount === 'string' ? bankAccount : '', ifsc: typeof bankIfsc === 'string' ? bankIfsc : '' }, walletCoins: 0, walletCash: 0 });
      return NextResponse.json({ success: true, message: 'Seller application submitted for verification', seller: { id: seller._id, email: seller.email, shopName: seller.shopName, sellerStatus: 'Pending', walletCoins: 0 } }, { status: 201 });
    }
    if (action !== 'login') return NextResponse.json({ error: 'Invalid authentication action' }, { status: 400 });
    const seller = await User.findOne({ $or: [{ email: identifier }, { username: identifier }, { phone: identifier }] }).select('+password');
    if (!seller || seller.role !== 'seller' || seller.status !== 'Active' || !await seller.matchPassword(password)) return NextResponse.json({ error: 'Invalid merchant credentials' }, { status: 401 });
    if (seller.sellerStatus !== 'Approved') return NextResponse.json({ error: 'Seller account is awaiting approval' }, { status: 403 });
    const token = signUserToken(seller._id);
    return NextResponse.json({ success: true, seller: { id: seller._id, email: seller.email, shopName: seller.shopName, sellerStatus: seller.sellerStatus, walletCoins: seller.walletCoins || 0, token } });
  } catch (error) { return NextResponse.json({ error: error.code === 11000 ? 'Account already exists' : 'Authentication failed' }, { status: error.code === 11000 ? 409 : 500 }); }
}
