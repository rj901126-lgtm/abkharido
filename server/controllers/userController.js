import User from '../models/User.js';

// @desc    Get user profile by username
// @route   GET /api/users/:username
// @access  Public
export const getUserByUsername = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (user) {
      res.json(user);
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
    const user = await User.findOne({ username: req.params.username });
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
      if (req.body.pincode) user.pincode = req.body.pincode;
      
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

// @desc    Register a creator
// @route   POST /api/users/register-creator
// @access  Public
export const registerCreator = async (req, res, next) => {
  try {
    const { username, fullName, email, phone, shopName, password } = req.body;
    const userExists = await User.findOne({ $or: [{ username }, { email }] });
    if (userExists) {
      res.status(400);
      throw new Error('Creator already exists');
    }
    const user = await User.create({
      username,
      fullName,
      email,
      phone,
      shopName,
      password,
      role: 'user',
      isInfluencer: true
    });
    res.status(201).json({ success: true, message: 'Creator registered successfully', user });
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
    user.walletCash = (user.walletCash || 0) + Number(amount);
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
