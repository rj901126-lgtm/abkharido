import User from '../models/User.js';
import Order from '../models/Order.js';

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
      const isOwner = req.user && req.user._id.toString() === user._id.toString();
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
        
        return res.json(userObj);
      }

      // If authorized (owner or admin), calculate wallet stats and return full profile
      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
      const lockedOrders = await Order.find({
        'referralApplied.referrerId': user.username,
        'referralApplied.isCredited': true,
        deliveredAt: { $gte: eightDaysAgo }
      });
      
      const lockedCoins = lockedOrders.reduce((sum, o) => sum + (o.referralApplied?.rewardAmount || 0), 0);
      const withdrawableCoins = Math.max(0, (user.walletCoins || 0) - lockedCoins);

      res.json({ ...userObj, withdrawableCoins, lockedCoins });
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
    const usernameParam = req.params.username;
    
    // Check authorization: User can only update their own profile unless they are a super_admin
    // (allow if the param matches their username or their _id)
    if (req.user.username !== usernameParam && req.user._id.toString() !== usernameParam && req.user.role !== 'super_admin' && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to update this profile');
    }

    const query = (usernameParam && usernameParam.length === 24) 
      ? { $or: [{ username: usernameParam }, { _id: usernameParam }] }
      : { username: usernameParam };
      
    const user = await User.findOne(query);
    if (user) {
      // Handle both firstName+lastName and combined fullName
      if (req.body.firstName && req.body.lastName) {
        user.firstName = req.body.firstName;
        user.lastName = req.body.lastName;
        user.fullName = `${req.body.firstName} ${req.body.lastName}`;
      } else if (req.body.fullName) {
        user.fullName = req.body.fullName;
      }
      if (req.body.email) user.email = req.body.email;
      if (req.body.phone) user.phone = req.body.phone;
      if (req.body.address) user.address = req.body.address;
      if (req.body.houseNo) user.houseNo = req.body.houseNo;
      if (req.body.streetArea) user.streetArea = req.body.streetArea;
      if (req.body.addressType) user.addressType = req.body.addressType;
      if (req.body.pincode) user.pincode = req.body.pincode;
      if (req.body.city) user.city = req.body.city;
      if (req.body.state) user.state = req.body.state;
      if (req.body.isEmailVerified !== undefined) user.isEmailVerified = req.body.isEmailVerified;
      
      const updatedUser = await user.save();
      res.json(updatedUser);
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({});
    res.json(users);
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
    await user.save();
    res.json(user);
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
    await user.save();
    res.json(user);
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
    await user.save();
    res.json(user);
  } catch (error) {
    next(error);
  }
};
