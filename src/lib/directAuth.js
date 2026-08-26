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
export function normalizePhone(phone) {
  if (!phone) return phone;
  let p = phone.toString().replace(/\s/g, '').replace(/-/g, '');
  // Remove +91 or 91 prefix if present (Indian numbers)
  if (p.startsWith('+91')) p = p.slice(3);
  else if (p.startsWith('91') && p.length === 12) p = p.slice(2);
  return p;
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

  if (email) {
    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail && !cleanEmail.includes(':') && !cleanEmail.endsWith('@abkharido.com')) {
      orConditions.push({ email: cleanEmail });
    }
  }

  if (username) {
    orConditions.push({ username: username.trim() });
  }

  if (orConditions.length === 0) return null;

  return await User.findOne({ $or: orConditions });
}

export async function verifyFirebaseDirect({ idToken, phone, fullName, email }) {
  await connectDB();
  if (!phone) throw new Error('Phone number is required from Firebase SMS verification');

  const normalizedPhone = normalizePhone(phone);
  let user = await findExistingUser({ phone: normalizedPhone, email });

  if (!user) {
    const defaultName = fullName || `Customer (+91 ${normalizedPhone})`;
    try {
      user = await User.create({
        username: normalizedPhone,
        phone: normalizedPhone,
        email: (email && !email.includes(':') && !email.endsWith('@abkharido.com')) ? email : undefined,
        fullName: defaultName,
        password: 'FirebaseVerifiedUser123!'
      });
    } catch (err) {
      if (err.code === 11000) {
        user = await findExistingUser({ phone: normalizedPhone, email });
        if (!user) {
          user = await User.create({
            username: `${normalizedPhone}_${Date.now().toString().slice(-4)}`,
            phone: normalizedPhone,
            email: (email && !email.includes(':') && !email.endsWith('@abkharido.com')) ? email : undefined,
            fullName: defaultName,
            password: 'FirebaseVerifiedUser123!'
          });
        }
      } else {
        throw err;
      }
    }
  } else {
    let shouldSave = false;
    if (!user.phone || user.phone !== normalizedPhone) {
      user.phone = normalizedPhone;
      shouldSave = true;
    }
    if (fullName && (!user.fullName || user.fullName === 'VIP Member' || user.fullName === 'New User')) {
      user.fullName = fullName;
      shouldSave = true;
    }
    if (email && !user.email && !email.includes(':') && !email.endsWith('@abkharido.com')) {
      user.email = email;
      shouldSave = true;
    }
    if (shouldSave) await user.save();
  }

  const cleanPhone = (user.phone && !user.phone.includes(':')) ? user.phone : normalizedPhone;
  const cleanEmail = (user.email && !user.email.includes(':') && !user.email.endsWith('@abkharido.com')) ? user.email : null;
  return {
    success: true,
    user: {
      _id: user._id.toString(),
      username: user.username,
      email: cleanEmail,
      phone: cleanPhone,
      fullName: user.fullName || 'VIP Member',
      role: user.role,
      token: generateToken(user._id),
    }
  };
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
    throw new Error('OTP expired or not found. Please request a new verification code.');
  }

  const isMatch = await storedOtpDoc.matchOtp(otp);
  if (!isMatch) {
    throw new Error('Incorrect OTP code. Please check the digits received via SMS and try again.');
  }

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
        password: 'abkharido_otp_user_' + Date.now()
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
            password: 'abkharido_otp_user_' + Date.now()
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
    if (shouldSave) await user.save();
  }

  const cleanRecipientPhone = (user.phone && !user.phone.includes(':')) ? user.phone : normalizedRecipient;
  const cleanEmail = (user.email && !user.email.includes(':') && !user.email.endsWith('@abkharido.com')) ? user.email : null;
  return {
    success: true,
    user: {
      _id: user._id.toString(),
      username: user.username,
      email: cleanEmail,
      phone: cleanRecipientPhone,
      fullName: user.fullName || 'VIP Member',
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
        phone: user.phone,
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

  const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
  // Delete any old OTPs for this number first
  await Otp.deleteMany({ $or: [{ phone: normalizedRecipient }, { phone: '+91' + normalizedRecipient }] });
  await Otp.create({ phone: normalizedRecipient, otp: generatedOtp });
  console.log(`[Direct OTP] Generated DB OTP ****** for ${normalizedRecipient.substring(0, 3)}****${normalizedRecipient.substring(normalizedRecipient.length - 3)}`);
  return { success: true, message: 'OTP sent successfully. Please check your SMS code.', _otp: generatedOtp, phone: normalizedRecipient };
}
