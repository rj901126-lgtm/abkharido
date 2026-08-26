import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import Otp from '../models/Otp.js';
import redisClient from '../config/redis.js';

const generateToken = (id) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('Server misconfiguration: JWT_SECRET is not set');
  }
  return jwt.sign({ id }, secret, {
    algorithm: 'HS256',
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res, next) => {
  try {
    const { username, password, email, phone, fullName } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const userExists = await User.findOne({ $or: [{ username }, { email }] });

    if (userExists) {
      return res.status(400).json({ error: 'An account with these credentials already exists.' });
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
      res.status(400).json({ error: 'Invalid user data provided' });
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

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

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
      res.status(401).json({ error: 'Invalid credentials' });
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
        avatar: user.avatar,
        walletCoins: user.walletCoins,
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
    const rawRecipient = req.body.phone || req.body.recipient || req.body.mobile || req.body.email || '';
    if (!rawRecipient) {
      return res.status(400).json({ error: 'Phone number is required.' });
    }
    const isEmail = rawRecipient.includes('@');
    let normalizedRecipient = isEmail ? rawRecipient.trim().toLowerCase() : rawRecipient.replace(/\D/g, '');
    if (!isEmail) {
      if (normalizedRecipient.startsWith('91') && normalizedRecipient.length === 12) {
        normalizedRecipient = normalizedRecipient.slice(2);
      }
      if (!/^[6-9]\d{9}$/.test(normalizedRecipient)) {
        return res.status(400).json({ error: 'Please enter a valid 10-digit Indian mobile number starting with 6-9.' });
      }
    }

    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP in database (will be hashed automatically by pre-save hook and auto-deleted after 5 mins)
    await Otp.deleteMany({ $or: [{ phone: normalizedRecipient }, { phone: '+91' + normalizedRecipient }, { phone: rawRecipient }] });
    await Otp.create({ phone: normalizedRecipient, otp: generatedOtp });
    
    console.log(`[OTP] Generated OTP ****** for ${normalizedRecipient.substring(0, 3)}****${normalizedRecipient.substring(normalizedRecipient.length - 3)}`);
    
    res.json({ success: true, message: 'OTP sent to mobile successfully', phone: normalizedRecipient });
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
    const { otp, fullName } = req.body;
    const rawRecipient = req.body.phone || req.body.recipient || req.body.mobile || req.body.email || '';

    if (!rawRecipient) {
      return res.status(400).json({ error: 'Phone number is required.' });
    }
    if (!otp) {
      return res.status(400).json({ error: 'OTP is required.' });
    }

    // Normalize phone to catch all formats
    const isEmail = rawRecipient.includes('@');
    let normalizedRecipient = isEmail ? rawRecipient.trim().toLowerCase() : rawRecipient.replace(/\D/g, '');
    if (!isEmail && normalizedRecipient.startsWith('91') && normalizedRecipient.length === 12) {
      normalizedRecipient = normalizedRecipient.slice(2);
    }

    // Validate OTP from database
    let storedOtpDoc = await Otp.findOne({ phone: normalizedRecipient }).sort({ createdAt: -1 }); // Get latest OTP
    if (!storedOtpDoc) {
      storedOtpDoc = await Otp.findOne({ phone: '+91' + normalizedRecipient }).sort({ createdAt: -1 });
    }
    if (!storedOtpDoc) {
      storedOtpDoc = await Otp.findOne({ phone: rawRecipient }).sort({ createdAt: -1 });
    }
    
    // Test OTP is authorized for developer test account (mobile 9172600587) or with ENABLE_TEST_OTP flag
    const isTestNumber = normalizedRecipient === '9172600587' || rawRecipient === '9172600587' || rawRecipient.includes('9172600587') || process.env.ENABLE_TEST_OTP === 'true';
    const isTestOtp = isTestNumber && otp === '123456';

    if (!storedOtpDoc && !isTestOtp) {
      return res.status(400).json({ error: 'OTP expired or not found. Please request a new OTP.' });
    }
    
    if (storedOtpDoc) {
      const isMatch = await storedOtpDoc.matchOtp(otp);
      if (!isMatch && !isTestOtp) {
        return res.status(400).json({ error: 'Incorrect OTP. Please try again.' });
      }
    }
    
    // OTP is valid — delete it to prevent reuse
    await Otp.deleteMany({ $or: [{ phone: normalizedRecipient }, { phone: '+91' + normalizedRecipient }, { phone: rawRecipient }] });
    
    // SECURITY: Escape user input before using in RegExp to prevent ReDoS
    const escapedRecipient = normalizedRecipient.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // create or find user
    let user = await User.findOne({ $or: [
      isEmail ? { email: normalizedRecipient } : null,
      !isEmail ? { phone: normalizedRecipient } : null,
      !isEmail ? { phone: '+91' + normalizedRecipient } : null,
      !isEmail ? { phone: '91' + normalizedRecipient } : null,
      !isEmail ? { username: normalizedRecipient } : null,
      !isEmail ? { username: new RegExp('^' + escapedRecipient + '(_|$)') } : null,
      !isEmail ? { username: new RegExp('^\\+91' + escapedRecipient + '(_|$)') } : null
    ].filter(Boolean) });
    
    if (!user) {
      if (isEmail) {
        res.status(400);
        throw new Error('Mobile number is mandatory. Please register and log in with your mobile phone number and OTP.');
      }
      let username = normalizedRecipient;
      const defaultName = fullName || `Customer (+91 ${normalizedRecipient})`;
      try {
        user = await User.create({ 
          username, 
          phone: normalizedRecipient, 
          fullName: defaultName,
          password: 'abkharido_otp_user_' + Date.now()
        });
      } catch (err) {
        if (err.code === 11000) {
          user = await User.findOne({ $or: [
            !isEmail ? { phone: normalizedRecipient } : null,
            !isEmail ? { username: normalizedRecipient } : null,
            { username }
          ].filter(Boolean) });

          if (!user) {
             const fallbackUsername = `${username}_${Date.now().toString().slice(-4)}`;
             user = await User.create({ 
               username: fallbackUsername, 
               phone: normalizedRecipient, 
               fullName: defaultName,
               password: 'abkharido_otp_user_' + Date.now()
             });
          }
        } else {
          throw err;
        }
      }
    } else {
      let shouldUpdate = false;
      if (!isEmail && (!user.phone || user.phone !== normalizedRecipient)) {
        user.phone = normalizedRecipient;
        shouldUpdate = true;
      }
      if (fullName && (!user.fullName || user.fullName === 'AbKharido User' || user.fullName === 'VIP Member')) {
        user.fullName = fullName;
        shouldUpdate = true;
      }
      if (shouldUpdate) {
        await user.save();
      }
    }
    // Update fullName/email if provided during signup
    if (fullName && !user.fullName) {
      user.fullName = fullName;
      await User.updateOne({ _id: user._id }, { $set: { fullName: user.fullName } });
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
        walletCoins: user.walletCoins || 0,
        shopName: user.shopName,
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

    let cleanPhone = phone.toString().replace(/\s/g, '').replace(/-/g, '');
    if (cleanPhone.startsWith('+91')) cleanPhone = cleanPhone.slice(3);
    else if (cleanPhone.startsWith('91') && cleanPhone.length === 12) cleanPhone = cleanPhone.slice(2);

    let user = await User.findOne({ $or: [
      { phone: cleanPhone },
      { phone: '+91' + cleanPhone },
      { phone: '91' + cleanPhone },
      { username: cleanPhone },
      { username: new RegExp('^' + cleanPhone + '(_|$)') },
      (email && !email.includes(':') && !email.endsWith('@abkharido.com')) ? { email: email.trim().toLowerCase() } : null
    ].filter(Boolean) });
    
    if (!user) {
      let username = cleanPhone;
      try {
        user = await User.create({ 
          username, 
          phone: cleanPhone, 
          email: (email && !email.includes(':') && !email.endsWith('@abkharido.com')) ? email.trim().toLowerCase() : undefined, 
          fullName: fullName || 'New User',
          password: 'FirebaseVerifiedUser123!' 
        });
      } catch (err) {
        if (err.code === 11000) {
          user = await User.findOne({ $or: [{ phone: cleanPhone }, { username: cleanPhone }] });
          if (!user) {
            user = await User.create({
              username: `${cleanPhone}_${Date.now().toString().slice(-4)}`,
              phone: cleanPhone,
              email: (email && !email.includes(':') && !email.endsWith('@abkharido.com')) ? email.trim().toLowerCase() : undefined,
              fullName: fullName || 'New User',
              password: 'FirebaseVerifiedUser123!'
            });
          }
        } else {
          throw err;
        }
      }
    } else {
      let shouldUpdate = false;
      if (!user.phone || user.phone !== cleanPhone) {
        user.phone = cleanPhone;
        shouldUpdate = true;
      }
      if (fullName && (!user.fullName || user.fullName === 'New User' || user.fullName === 'VIP Member')) {
        user.fullName = fullName;
        shouldUpdate = true;
      }
      if (email && !user.email && !email.includes(':') && !email.endsWith('@abkharido.com')) {
        user.email = email.trim().toLowerCase();
        shouldUpdate = true;
      }
      if (shouldUpdate) await user.save();
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

// @desc    Logout user / Revoke token
// @route   POST /api/auth/logout
// @access  Private
export const logoutUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token && redisClient) {
      // 30 days in seconds = 30 * 24 * 60 * 60 = 2592000
      await redisClient.set(`blacklist:${token}`, 'true', 'EX', 2592000);
    }
    res.json({ success: true, message: 'Logged out successfully. Token revoked.' });
  } catch (error) {
    next(error);
  }
};
