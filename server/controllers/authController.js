import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'abkharido_jwt_secret_dev', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res, next) => {
  try {
    const { username, password, email, phone, fullName } = req.body;

    const userExists = await User.findOne({ $or: [{ username }, { email }] });

    if (userExists) {
      res.status(400);
      throw new Error('User already exists');
    }

    const user = await User.create({
      username,
      password,
      email,
      phone,
      fullName
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400);
      throw new Error('Invalid user data');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const authUser = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401);
      throw new Error('Invalid username or password');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        walletCash: user.walletCash,
        walletCoins: user.walletCoins,
        isInfluencer: user.isInfluencer,
        shopName: user.shopName
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Send OTP
// @route   POST /api/auth/send-otp
// @access  Public
export const sendOtp = async (req, res, next) => {
  try {
    const { recipient } = req.body;
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`[OTP] Sent OTP ${generatedOtp} to ${recipient}`);
    res.json({ success: true, otp: generatedOtp });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOtp = async (req, res, next) => {
  try {
    const { recipient, otp } = req.body;
    // Stub implementation: accept any 6 digit OTP for now
    if (otp && otp.length >= 4) {
      let user = await User.findOne({ $or: [{ email: recipient }, { phone: recipient }] });
      if (!user) {
        // Create an anonymous/placeholder user if it doesn't exist
        const username = recipient.split('@')[0] + Math.floor(Math.random() * 1000);
        user = await User.create({ username, email: recipient.includes('@') ? recipient : undefined, phone: !recipient.includes('@') ? recipient : undefined, password: 'password123' });
      }
      res.json({ success: true, token: generateToken(user._id), username: user.username });
    } else {
      res.status(400);
      throw new Error('Invalid OTP');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Check User
// @route   POST /api/auth/check-user
// @access  Public
export const checkUser = async (req, res, next) => {
  try {
    const { username } = req.body;
    const user = await User.findOne({ $or: [{ username }, { email: username }, { phone: username }] });
    if (user) {
      res.json({ exists: true, message: 'User found', role: user.role });
    } else {
      res.json({ exists: false, message: 'User not found' });
    }
  } catch (error) {
    next(error);
  }
};
