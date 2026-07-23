import User from '../models/User.js';
import jwt from 'jsonwebtoken';

// In-memory OTP store (recipient -> { otp, expiry })
// For production, replace with Redis
const otpStore = new Map();

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
    
    // Store OTP with 5 minute expiry
    otpStore.set(recipient, {
      otp: generatedOtp,
      expiry: Date.now() + 5 * 60 * 1000
    });
    
    console.log(`[OTP] Generated OTP ${generatedOtp} for ${recipient}`);
    
    // In production with SMS gateway, do not send the OTP in response
    res.json({ success: true, message: 'OTP sent to mobile successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOtp = async (req, res, next) => {
  try {
    // eslint-disable-next-line
    const { recipient, otp, fullName, isSignup } = req.body;

    // Validate OTP from store
    const stored = otpStore.get(recipient);
    if (!stored) {
      return res.status(400).json({ error: 'OTP expired or not found. Please request a new OTP.' });
    }
    if (Date.now() > stored.expiry) {
      otpStore.delete(recipient);
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }
    if (stored.otp !== otp) {
      return res.status(400).json({ error: 'Incorrect OTP. Please try again.' });
    }
    // OTP is valid — create or find user
    let user = await User.findOne({ $or: [{ email: recipient }, { phone: recipient }] });
    if (!user) {
      const baseUsername = recipient.includes('@') 
        ? recipient.split('@')[0] 
        : recipient;
      const username = baseUsername + Math.floor(Math.random() * 1000);
      user = await User.create({ 
        username, 
        email: recipient.includes('@') ? recipient : (fullName ? undefined : undefined),
        phone: !recipient.includes('@') ? recipient : undefined, 
        fullName: fullName || 'AbKharido User',
        password: 'abkharido_otp_user_' + Date.now()
      });
    }
    // Update fullName/email if provided during signup
    if (fullName && !user.fullName) {
      user.fullName = fullName;
      await user.save();
    }
    res.json({ 
      success: true, 
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        fullName: user.fullName,
        role: user.role,
        walletCash: user.walletCash || 0,
        walletCoins: user.walletCoins || 0,
        token: generateToken(user._id),
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Firebase Token (Mocked for now without Service Account)
// @route   POST /api/auth/verify-firebase
// @access  Public
export const verifyFirebase = async (req, res, next) => {
  try {
    const { phone, isSignup, fullName, email } = req.body;
    
    if (!phone) {
      res.status(400);
      throw new Error('Phone number is required from Firebase payload');
    }

    let user = await User.findOne({ phone });
    
    if (!user) {
      if (!isSignup) {
        // If not signup, maybe they just haven't set up a profile, let's auto-create
      }
      const username = phone.replace('+', '') + Math.floor(Math.random() * 1000);
      user = await User.create({ 
        username, 
        phone, 
        email: email || undefined, 
        fullName: fullName || 'New User',
        password: 'FirebaseVerifiedUser123!' 
      });
    }

    res.json({ 
      success: true, 
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
        token: generateToken(user._id),
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check User
// @route   POST /api/auth/check-user
// @access  Public
export const checkUser = async (req, res, next) => {
  try {
    // Frontend sends 'recipient' (phone number) not 'username'
    const { username, recipient } = req.body;
    const lookup = recipient || username;
    const user = await User.findOne({ $or: [{ username: lookup }, { email: lookup }, { phone: lookup }] });
    if (user) {
      res.json({ exists: true, message: 'User found', role: user.role });
    } else {
      res.json({ exists: false, message: 'User not found' });
    }
  } catch (error) {
    next(error);
  }
};
