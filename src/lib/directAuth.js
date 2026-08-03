import connectDB from './connectDB.js';
import User from '../../server/models/User.js';
import Otp from '../../server/models/Otp.js';
import jwt from 'jsonwebtoken';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'abkharido_jwt_secret_dev', {
    expiresIn: '30d',
  });
};

export async function verifyFirebaseDirect({ idToken, phone, fullName, email }) {
  await connectDB();
  if (!phone) throw new Error('Phone number is required from Firebase SMS verification');

  let user = await User.findOne({ phone });
  if (!user) {
    const cleanPhone = phone.replace('+', '').trim();
    const username = cleanPhone + '_' + Math.floor(100 + Math.random() * 900);
    user = await User.create({
      username,
      phone,
      email: email || undefined,
      fullName: fullName || 'VIP Member',
      password: 'FirebaseVerifiedUser123!'
    });
  }

  return {
    success: true,
    user: {
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
      token: generateToken(user._id),
    }
  };
}

export async function verifyOtpDirect({ recipient, otp, fullName }) {
  await connectDB();
  const storedOtpDoc = await Otp.findOne({ phone: recipient }).sort({ createdAt: -1 });
  if (!storedOtpDoc) {
    throw new Error('OTP expired or not found in secure escrow. Please request a new OTP.');
  }

  const isMatch = await storedOtpDoc.matchOtp(otp);
  if (!isMatch) {
    throw new Error('Incorrect OTP code. Please check the digits and try again.');
  }

  await Otp.deleteMany({ phone: recipient });

  let user = await User.findOne({ $or: [{ email: recipient }, { phone: recipient }] });
  if (!user) {
    const isEmail = recipient.includes('@');
    let username = isEmail ? recipient.split('@')[0] : recipient.replace(/\D/g, '');
    const existing = await User.findOne({ username });
    if (existing && isEmail) {
      username = username + Math.floor(Math.random() * 1000);
    }
    user = await User.create({
      username,
      email: isEmail ? recipient : undefined,
      phone: !isEmail ? recipient : undefined,
      fullName: fullName || 'VIP Member',
      password: 'abkharido_otp_user_' + Date.now()
    });
  }

  return {
    success: true,
    user: {
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
      token: generateToken(user._id),
    }
  };
}

export async function loginPasswordDirect({ username, password }) {
  await connectDB();
  const user = await User.findOne({ username });
  if (user && (await user.matchPassword(password))) {
    return {
      success: true,
      user: {
        _id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      }
    };
  }
  throw new Error('Invalid username or password');
}

export async function sendOtpDirect({ recipient }) {
  await connectDB();
  const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
  await Otp.create({ phone: recipient, otp: generatedOtp });
  console.log(`[Direct OTP] Generated DB OTP ${generatedOtp} for ${recipient}`);
  return { success: true, message: 'OTP stored securely in database' };
}
