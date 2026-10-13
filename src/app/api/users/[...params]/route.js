import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '../../../../lib/connectDB.js';
import User from '../../../../../server/models/User.js';
import { getAuthenticatedUser } from '../../../../lib/serverAuth.js';
import { isValidEmail } from '../../../../utils/constants.js';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
const privateHeaders = { 'Cache-Control': 'private, no-store' };
function profile(user, privateView = false) {
  const source = user?.toObject ? user.toObject() : user;
  const fields = privateView ? ['_id','username','fullName','firstName','lastName','avatar','role','email','phone','isEmailVerified','status','sellerStatus','shopName','walletCoins','walletCash','payoutDetails','addresses','address','houseNo','streetArea','city','pincode','state','addressType','referralCode','referralStats','cart','wishlist'] : ['_id','username','fullName','avatar','role'];
  return Object.fromEntries(fields.filter(k => source?.[k] !== undefined).map(k => [k, source[k]]));
}
async function resolveUser(target, auth) {
  if (target === 'me') return User.findById(auth.user.id).select('-password');
  const matches = [{ username: target }, { phone: target }, { email: target }];
  if (mongoose.isValidObjectId(target)) matches.push({ _id: target });
  return User.findOne({ $or: matches }).select('-password');
}
export async function GET(req, { params }) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth?.isAuthenticated) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const { params: route = [] } = await params;
    await connectDB();
    if (!route.length) {
      if (!auth.isAdmin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      const users = await User.find({}).limit(50).select('-password');
      return NextResponse.json(users.map(u => profile(u, true)), { headers: privateHeaders });
    }
    const user = await resolveUser(route[0], auth);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json(profile(user, auth.isAdmin || String(user._id) === String(auth.user.id)), { headers: privateHeaders });
  } catch { return NextResponse.json({ error: 'Failed to retrieve profile' }, { status: 500 }); }
}
export async function POST(req, { params }) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth?.isAuthenticated) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const { params: route = [] } = await params;
    if (route.length !== 2 || !['update','suspend','wallet','seller-status'].includes(route[1])) return NextResponse.json({ error: 'Unsupported profile action' }, { status: 404 });
    await connectDB();
    const user = await resolveUser(route[0], auth);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (!auth.isAdmin && String(user._id) !== String(auth.user.id)) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    const body = await req.json();
    if (route[1] !== 'update') {
      if (!auth.isAdmin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      let operations;
      if (route[1] === 'suspend') {
        if (!['Active','Suspended'].includes(body.status)) return NextResponse.json({ error: 'Invalid account status' }, { status: 400 });
        operations = { $set: { status: body.status } };
      } else if (route[1] === 'seller-status') {
        const sellerStatus = body.sellerStatus || body.status;
        if (!['None','Pending','Approved','Rejected'].includes(sellerStatus)) return NextResponse.json({ error: 'Invalid seller status' }, { status: 400 });
        operations = { $set: { sellerStatus, ...(sellerStatus === 'Approved' ? { role: 'seller' } : user.role === 'seller' && sellerStatus === 'Rejected' ? { role: 'user' } : {}) } };
      } else {
        const amount = Number(body.amount);
        if (!Number.isFinite(amount) || !Number.isInteger(amount) || amount <= 0) return NextResponse.json({ error: 'Invalid wallet credit' }, { status: 400 });
        operations = { $inc: { walletCoins: amount } };
      }
      const updated = await User.findByIdAndUpdate(user._id, operations, { new: true, runValidators: true }).select('-password');
      return NextResponse.json(profile(updated, true), { headers: privateHeaders });
    }
    if (body.phone !== undefined && String(body.phone).replace(/\D/g, '').slice(-10) !== String(user.phone || '').replace(/\D/g, '').slice(-10)) return NextResponse.json({ error: 'Phone changes require verified authentication' }, { status: 400 });
    const set = {};
    const unset = {};
    if (body.email !== undefined) {
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
      if (email && !isValidEmail(email)) return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
      if (email !== (user.email || '')) {
        if (email && await User.exists({ email, _id: { $ne: user._id } })) return NextResponse.json({ error: 'Email is already registered' }, { status: 409 });
        if (email) set.email = email; else unset.email = 1;
        set.isEmailVerified = false;
      }
    }
    for (const key of ['firstName','lastName','fullName','address','houseNo','streetArea','city','pincode','state','addressType']) {
      if (body[key] !== undefined) {
        if (typeof body[key] !== 'string' || body[key].length > 1000) return NextResponse.json({ error: 'Invalid profile field' }, { status: 400 });
        set[key] = body[key].trim();
      }
    }
    if (set.firstName !== undefined && set.lastName !== undefined) set.fullName = `${set.firstName} ${set.lastName}`.trim();
    if (body.addresses !== undefined) {
      if (!Array.isArray(body.addresses) || body.addresses.length > 20) return NextResponse.json({ error: 'Invalid address book' }, { status: 400 });
      const keys = ['id','name','phone','houseNo','streetArea','streetAddress','address','city','pincode','state','addressType'];
      set.addresses = body.addresses.map(a => {
        const safe = {};
        for (const key of keys) if (typeof a?.[key] === 'string') safe[key] = a[key].slice(0, 1000);
        safe.isDefault = a?.isDefault === true;
        return safe;
      });
    }
    const operations = { $set: set };
    if (Object.keys(unset).length) operations.$unset = unset;
    const updated = await User.findByIdAndUpdate(user._id, operations, { new: true, runValidators: true }).select('-password');
    return NextResponse.json(profile(updated, true), { headers: privateHeaders });
  } catch (error) { return NextResponse.json({ error: error.code === 11000 ? 'Email is already registered' : 'Failed to update profile' }, { status: error.code === 11000 ? 409 : 500 }); }
}
