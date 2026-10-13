import User from '../models/User.js';
import Order from '../models/Order.js';
import mongoose from 'mongoose';
const safeProfile = (user, privateView = true) => {
  const value = user?.toObject ? user.toObject() : user;
  const keys = privateView ? ['_id','username','fullName','firstName','lastName','avatar','role','email','phone','isEmailVerified','status','sellerStatus','shopName','walletCoins','walletCash','payoutDetails','addresses','address','houseNo','streetArea','city','pincode','state','addressType','referralCode','referralStats','cart','wishlist','createdAt','updatedAt'] : ['_id','username','fullName','avatar','role'];
  return Object.fromEntries(keys.filter(k => value?.[k] !== undefined).map(k => [k, value[k]]));
};

// @desc    Get user profile by username or id
// @route   GET /api/users/:username
// @access  Public
export const getUserByUsername = async (req, res, next) => {
  try {
    const username = req.params.username;
    // Support lookup by _id if parameter is an ObjectId
    const query = (username && username.length === 24) 
      ? { $or: [{ username }, { _id: username }] }
      : { username };
      
    const user = await User.findOne(query);
    if (user) {
      const userObj = user.toObject();

      // ── IDOR & PII REDACTION GUARD ──
      // Check if the requester is the owner of the profile or an admin
      const isOwner = req.user && String(req.user._id || req.user.id || '') === String(user._id);
      const isAdmin = req.user && ['admin', 'super_admin'].includes(req.user.role);
      const isAuthorized = isOwner || isAdmin;

      if (!isAuthorized) {
        // Redact all sensitive PII for public viewing
        delete userObj.email;
        delete userObj.phone;
        delete userObj.address;
        delete userObj.houseNo;
        delete userObj.streetArea;
        delete userObj.city;
        delete userObj.pincode;
        delete userObj.state;
        delete userObj.addressType;
        delete userObj.addresses;
        delete userObj.payoutDetails;
        delete userObj.walletCoins;
        delete userObj.isEmailVerified;
        delete userObj.cart;
        delete userObj.wishlist;
        
        return res.json(safeProfile(userObj, false));
      }

      // If authorized (owner or admin), calculate wallet stats and return full profile
      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
      const lockedOrders = await Order.find({
        'referralApplied.referrerId': user.username,
        'referralApplied.isCredited': true,
        deliveredAt: { $gte: eightDaysAgo }
      }).lean();
      
      const lockedCoins = lockedOrders.reduce((sum, o) => sum + (o.referralApplied?.rewardAmount || 0), 0);
      const withdrawableCoins = Math.max(0, (user.walletCoins || 0) - lockedCoins);

      res.json({ ...safeProfile(userObj), withdrawableCoins, lockedCoins });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   POST /api/users/:username/update
// @access  Private
export const updateUserProfile = async (req, res, next) => {
  try {
    const target = req.params.username;
    const clauses = [{ username: target }, { email: target }, { phone: target }];
    if (mongoose.isValidObjectId(target)) clauses.push({ _id: target });
    const user = target === 'me' ? await User.findById(req.user._id) : await User.findOne({ $or: clauses });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!['admin','super_admin'].includes(req.user.role) && String(user._id) !== String(req.user._id)) return res.status(403).json({ error: 'Not authorized' });
    const body = req.body;
    if (body.phone !== undefined && String(body.phone).replace(/\D/g, '').slice(-10) !== String(user.phone || '').replace(/\D/g, '').slice(-10)) return res.status(400).json({ error: 'Phone changes require verified authentication' });
    const set = {};
    const unset = {};
    if (body.email !== undefined) {
      if (typeof body.email !== 'string') return res.status(400).json({ error: 'Invalid email' });
      const email = body.email.trim().toLowerCase();
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Invalid email' });
      if (email !== (user.email || '')) {
        if (email && await User.exists({ email, _id: { $ne: user._id } })) return res.status(409).json({ error: 'Email is already registered' });
        if (email) set.email = email; else unset.email = 1;
        set.isEmailVerified = false;
      }
    }
    for (const key of ['firstName','lastName','fullName','address','houseNo','streetArea','city','pincode','state','addressType']) {
      if (body[key] !== undefined) {
        if (typeof body[key] !== 'string' || body[key].length > 1000) return res.status(400).json({ error: 'Invalid profile field' });
        set[key] = body[key].trim();
      }
    }
    if (set.firstName !== undefined && set.lastName !== undefined) set.fullName = `${set.firstName} ${set.lastName}`.trim();
    if (body.addresses !== undefined) {
      if (!Array.isArray(body.addresses) || body.addresses.length > 20) return res.status(400).json({ error: 'Invalid address book' });
      const keys = ['id','name','phone','houseNo','streetArea','streetAddress','address','city','pincode','state','addressType'];
      set.addresses = body.addresses.map(a => Object.fromEntries([...keys.filter(k => typeof a?.[k] === 'string').map(k => [k, a[k].slice(0,1000)]), ['isDefault', a?.isDefault === true]]));
    }
    const operations = { $set: set };
    if (Object.keys(unset).length) operations.$unset = unset;
    const updated = await User.findByIdAndUpdate(user._id, operations, { new: true, runValidators: true }).select('-password');
    return res.json(safeProfile(updated));
  } catch (error) { if (error.code === 11000) return res.status(409).json({ error: 'Email is already registered' }); next(error); }
};
// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const users = await User.find({}).skip(skip).limit(limit).lean();
    const total = await User.countDocuments({});

    res.json({ users: users.map(u => safeProfile(u)), total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

// @desc    Suspend or unsuspend a user
// @route   POST /api/users/:id/suspend
// @access  Private/Admin
export const suspendUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
    user.status = req.body.status || 'Suspended';
    await User.updateOne({ _id: user._id }, { $set: { status: user.status } });
    res.json(safeProfile(user));
  } catch (error) {
    next(error);
  }
};

// @desc    Add wallet balance (Refund/Cashback)
// @route   POST /api/users/:id/wallet
// @access  Private/Admin
export const addWalletBalance = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
    user.walletCoins = (user.walletCoins || 0) + Number(amount);
    await User.updateOne({ _id: user._id }, { $set: { walletCoins: user.walletCoins } });
    res.json(safeProfile(user));
  } catch (error) {
    next(error);
  }
};

// @desc    Update Seller Status (VMS Workflow)
// @route   POST /api/users/:id/seller-status
// @access  Private/Admin
export const updateSellerStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
    user.sellerStatus = status;
    // If approved, give them the seller role so they can access seller panel
    if (status === 'Approved') {
      user.role = 'seller';
    } else if (status === 'Rejected' || status === 'Suspended') {
      user.role = 'user'; // Demote
    }
    await User.updateOne({ _id: user._id }, { $set: { sellerStatus: user.sellerStatus, role: user.role } });
    res.json(safeProfile(user));
  } catch (error) {
    next(error);
  }
};
