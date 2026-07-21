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
      user.fullName = req.body.fullName || user.fullName;
      user.email = req.body.email || user.email;
      user.phone = req.body.phone || user.phone;
      user.address = req.body.address || user.address;
      
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
