import connectDB from './connectDB.js';
import User from '../../server/models/User.js';
import Otp from '../../server/models/Otp.js';
import jwt from 'jsonwebtoken';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'abkharido_jwt_secret_dev', {
    expiresIn: '30d',
  });
};

// Normalize any phone format (+919172600587, 919172600587, 9172600587) to 10 digits
function normalizePhone(phone) {
  if (!phone) return phone;
  let p = phone.toString().replace(/\s/g, '').replace(/-/g, '');
  // Remove +91 or 91 prefix if present (Indian numbers)
  if (p.startsWith('+91')) p = p.slice(3);
  else if (p.startsWith('91') && p.length === 12) p = p.slice(2);
  return p;
}

export async function verifyFirebaseDirect({ idToken, phone, fullName, email }) {
  await connectDB();
  if (!phone) throw new Error('Phone number is required from Firebase SMS verification');

  const normalizedPhone = normalizePhone(phone);

  // Search by normalized 10-digit phone OR with +91 prefix (to find any existing account)
  let user = await User.findOne({ $or: [
    { phone: normalizedPhone },
    { phone: '+91' + normalizedPhone },
    { phone: '91' + normalizedPhone },
  ] });

  if (!user) {
    const username = normalizedPhone + '_' + Math.floor(100 + Math.random() * 900);
    user = await User.create({
      username,
      phone: normalizedPhone,
      email: email || undefined,
      fullName: fullName || 'VIP Member',
      password: 'FirebaseVerifiedUser123!'
    });
  } else if (user.phone !== normalizedPhone) {
    user.phone = normalizedPhone;
    await user.save();
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
  const normalizedRecipient = recipient.includes('@') ? recipient : normalizePhone(recipient);

  // Find OTP stored under any phone format
  let storedOtpDoc = await Otp.findOne({ phone: normalizedRecipient }).sort({ createdAt: -1 });
  if (!storedOtpDoc) {
    // Try with +91 prefix as fallback
    storedOtpDoc = await Otp.findOne({ phone: '+91' + normalizedRecipient }).sort({ createdAt: -1 });
  }
  if (!storedOtpDoc) {
    throw new Error('OTP expired or not found in secure escrow. Please request a new OTP.');
  }

  const isMatch = await storedOtpDoc.matchOtp(otp);
  if (!isMatch) {
    throw new Error('Incorrect OTP code. Please check the digits and try again.');
  }

  await Otp.deleteMany({ $or: [{ phone: normalizedRecipient }, { phone: '+91' + normalizedRecipient }] });

  const isEmail = normalizedRecipient.includes('@');
  // Search for existing user by ALL possible phone formats
  let user;
  if (isEmail) {
    user = await User.findOne({ email: normalizedRecipient });
  } else {
    user = await User.findOne({ $or: [
      { phone: normalizedRecipient },
      { phone: '+91' + normalizedRecipient },
      { phone: '91' + normalizedRecipient },
    ] });
  }

  if (!user) {
    let username = isEmail ? normalizedRecipient.split('@')[0] : normalizedRecipient;
    const existing = await User.findOne({ username });
    if (existing) username = username + '_' + Math.floor(100 + Math.random() * 900);
    user = await User.create({
      username,
      email: isEmail ? normalizedRecipient : undefined,
      phone: !isEmail ? normalizedRecipient : undefined,
      fullName: fullName || 'VIP Member',
      password: 'abkharido_otp_user_' + Date.now()
    });
  } else if (!isEmail && user.phone !== normalizedRecipient) {
    // Fix stored phone number format
    user.phone = normalizedRecipient;
    await user.save();
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
  const normalizedRecipient = recipient.includes('@') ? recipient : normalizePhone(recipient);
  const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
  // Delete any old OTPs for this number first
  await Otp.deleteMany({ $or: [{ phone: normalizedRecipient }, { phone: '+91' + normalizedRecipient }] });
  await Otp.create({ phone: normalizedRecipient, otp: generatedOtp });
  console.log(`[Direct OTP] Generated DB OTP ${generatedOtp} for ${normalizedRecipient}`);
  return { success: true, message: 'OTP stored securely in database' };
}
