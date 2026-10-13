import crypto from 'crypto';
import connectDB from './connectDB.js';
import User from '../../server/models/User.js';
import Otp from '../../server/models/Otp.js';

import { isValidEmail } from '../utils/constants.js';
import { signUserToken, isActiveUser, isGeneratedPassword } from '../../server/utils/authSecurity.js';
import { verifiedFirebasePhone } from '../../server/utils/firebaseIdentity.js';

const generateToken = (id) => {
  return signUserToken(id);
};

// Normalize any phone format (+919172600587, 919172600587, 9172600587) to 10 pure digits
export function normalizePhone(phone) {
  if (!phone) return '';
  const digits = phone.toString().replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

// Find existing user across all potential identifiers to prevent duplicate account creation
export async function findExistingUser({ phone, email, username } = {}) {
  const orConditions = [];
  
  if (phone) {
    const cleanPhone = normalizePhone(phone);
    if (cleanPhone) {
      orConditions.push(
        { phone: cleanPhone },
        { phone: '+91' + cleanPhone },
        { phone: '91' + cleanPhone },
        { username: cleanPhone },
        { username: new RegExp('^' + cleanPhone + '(_|$)') }
      );
    }
  }

  if (email && isValidEmail(email)) {
    const cleanEmail = email.trim().toLowerCase();
    orConditions.push({ email: cleanEmail });
  }

  if (username) {
    orConditions.push({ username: username.trim() });
  }

  if (orConditions.length === 0) return null;

  return await User.findOne({ $or: orConditions });
}

export async function verifyFirebaseDirect({ idToken, fullName }) {
  const normalizedPhone = await verifiedFirebasePhone(idToken);
  await connectDB();
  let user = await User.findOne({ phone: { $in: [normalizedPhone, '+91' + normalizedPhone, '91' + normalizedPhone] } });
  if (!user) {
    try {
      user = await User.create({
        username: normalizedPhone,
        phone: normalizedPhone,
        fullName: typeof fullName === 'string' ? fullName.slice(0, 120) : 'Customer',
        password: crypto.randomBytes(32).toString('hex')
      });
    } catch (error) {
      if (error.code !== 11000) throw error;
      user = await User.findOne({ phone: { $in: [normalizedPhone, '+91' + normalizedPhone, '91' + normalizedPhone] } });
      if (!user) user = await User.create({
        username: normalizedPhone + '_' + crypto.randomBytes(6).toString('hex'),
        phone: normalizedPhone, fullName: 'Customer', password: crypto.randomBytes(32).toString('hex')
      });
    }
  }
  if (!isActiveUser(user)) throw new Error('Account is not active.');
  return { success: true, user: {
    _id: String(user._id), username: user.username, email: isValidEmail(user.email) ? user.email : null,
    isEmailVerified: Boolean(user.isEmailVerified), phone: normalizedPhone, isPhoneVerified: true,
    fullName: user.fullName || 'Customer', role: user.role, token: generateToken(user._id)
  } };
}
export async function verifyOtpDirect(params = {}) {
  await connectDB();
  const rawRecipient = params.phone || params.recipient || params.mobile || params.email || '';
  const otp = (params.otp || '').toString().trim();
  const fullName = params.fullName || '';

  if (!rawRecipient) {
    throw new Error('Phone number is required for OTP verification.');
  }
  if (!otp) {
    throw new Error('OTP is required.');
  }

  const isEmail = rawRecipient.includes('@');
  const normalizedRecipient = isEmail ? rawRecipient.trim().toLowerCase() : normalizePhone(rawRecipient);

  // Find OTP stored under any phone format
  let storedOtpDoc = await Otp.findOne({ phone: normalizedRecipient }).sort({ createdAt: -1 });
  if (!storedOtpDoc) {
    storedOtpDoc = await Otp.findOne({ phone: '+91' + normalizedRecipient }).sort({ createdAt: -1 });
  }

  if (!storedOtpDoc) {
    throw new Error('Verification code expired or not found. Please request a new OTP.');
  }

  const isMatch = await storedOtpDoc.matchOtp(otp);
  if (!isMatch) {
    throw new Error('Incorrect OTP code. Please check the digits received via SMS and try again.');
  }

  // OTP verified — immediately delete to enforce single-use
  await Otp.deleteMany({ $or: [{ phone: normalizedRecipient }, { phone: '+91' + normalizedRecipient }] });

  // Search for existing user to avoid creating duplicate IDs
  let user = await findExistingUser({
    phone: !isEmail ? normalizedRecipient : undefined,
    email: isEmail ? normalizedRecipient : undefined
  });

  if (!user) {
    if (isEmail) {
      throw new Error('Mobile number is mandatory. Please sign in with your mobile phone number and OTP.');
    }
    let username = normalizedRecipient;
    const defaultName = fullName || `Customer (+91 ${normalizedRecipient})`;
    try {
      user = await User.create({
        username,
        phone: normalizedRecipient,
        email: undefined,
        fullName: defaultName,
        password: crypto.randomBytes(32).toString('hex')
      });
    } catch (err) {
      if (err.code === 11000) {
        user = await findExistingUser({ phone: normalizedRecipient });
        if (!user) {
          user = await User.create({
            username: `${username}_${Date.now().toString().slice(-4)}`,
            phone: normalizedRecipient,
            email: undefined,
            fullName: defaultName,
            password: crypto.randomBytes(32).toString('hex')
          });
        }
      } else {
        throw err;
      }
    }
  } else {
    let shouldSave = false;
    if (!isEmail && (!user.phone || user.phone !== normalizedRecipient)) {
      user.phone = normalizedRecipient;
      shouldSave = true;
    }
    if (fullName && (!user.fullName || user.fullName === 'VIP Member' || user.fullName === 'New User')) {
      user.fullName = fullName;
      shouldSave = true;
    }
    // Auto-heal invalid or ciphertext email from legacy database saves
    if (user.email && !isValidEmail(user.email)) {
      user.email = undefined;
      shouldSave = true;
    }
    if (shouldSave) await user.save();
  }

  if (!isActiveUser(user)) throw new Error('Account is not active.');
  const cleanRecipientPhone = (user.phone && !user.phone.includes(':')) ? user.phone : normalizedRecipient;
  const cleanEmail = isValidEmail(user.email) ? user.email : null;
  return {
    success: true,
    user: {
      _id: user._id.toString(),
      username: user.username,
      email: cleanEmail,
      isEmailVerified: Boolean(user.isEmailVerified),
      phone: cleanRecipientPhone,
      isPhoneVerified: true,
      fullName: user.fullName || 'VIP Member',
      role: user.role,
      token: generateToken(user._id),
    }
  };
}

export async function loginPasswordDirect({ username, password }) {
  await connectDB();
  const user = await User.findOne({ username });
  if (isActiveUser(user) && !isGeneratedPassword(password) && (await user.matchPassword(password))) {
    const cleanEmail = isValidEmail(user.email) ? user.email : null;
    return {
      success: true,
      user: {
        _id: user._id.toString(),
        username: user.username,
        email: cleanEmail,
        isEmailVerified: Boolean(user.isEmailVerified),
        phone: user.phone,
        isPhoneVerified: true,
        fullName: user.fullName || 'VIP Member',
        role: user.role,
        token: generateToken(user._id),
      }
    };
  }
  throw new Error('Invalid username or password');
}

export async function sendOtpDirect(params = {}) {
  await connectDB();
  const rawRecipient = params.phone || params.recipient || params.mobile || params.email || '';
  if (!rawRecipient) {
    throw new Error('Phone number is required to send OTP.');
  }
  const isEmail = rawRecipient.includes('@');
  const normalizedRecipient = isEmail ? rawRecipient.trim().toLowerCase() : normalizePhone(rawRecipient);

  if (!isEmail && !/^[6-9]\d{9}$/.test(normalizedRecipient)) {
    throw new Error('Please enter a valid 10-digit Indian mobile number starting with 6-9.');
  }

  // Cryptographically secure 6-digit random OTP
  const generatedOtp = crypto.randomInt(100000, 1000000).toString();

  // Delete any existing OTP records for this recipient to ensure strictly one active OTP
  await Otp.deleteMany({ $or: [{ phone: normalizedRecipient }, { phone: '+91' + normalizedRecipient }] });
  await Otp.create({ phone: normalizedRecipient, otp: generatedOtp });
  
  console.log(`[Direct OTP] Generated OTP for ${normalizedRecipient.substring(0, 3)}****${normalizedRecipient.substring(normalizedRecipient.length - 3)}`);
  return { success: true, message: 'OTP sent successfully. Please check your SMS code.', _otp: generatedOtp, phone: normalizedRecipient };
}
