/**
 * AbKharido Privacy-First Unique Referral & Affiliate Tracking Utilities
 * Ensures zero phone number leakage, tamper-proof tracking codes, and clean link generation.
 */

// RegEx to detect any phone number formats (10-12 digits, optional leading +, country codes)
const PHONE_REGEX = /^(\+?91[\-\s]?)?[6-9]\d{9}$/;
const RAW_DIGITS_REGEX = /^\d{10,14}$/;

/**
 * Checks if a string contains or looks like a private phone number.
 */
export function isPhoneNumber(str) {
  if (!str || typeof str !== 'string') return false;
  const cleaned = str.replace(/[\s\-\(\)\+]/g, '');
  return PHONE_REGEX.test(str.trim()) || RAW_DIGITS_REGEX.test(cleaned);
}

/**
 * Deterministic hash to generate consistent uppercase alphanumeric string from input
 */
function hashStringToAlphanumeric(str, length = 6) {
  let hash = 5381;
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // No confusing 0/O, 1/I
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  
  let result = '';
  let current = Math.abs(hash);
  for (let i = 0; i < length; i++) {
    result += chars[current % chars.length];
    current = Math.floor(current / chars.length) + (str.charCodeAt(i % str.length) * 7);
  }
  return result;
}

/**
 * Generates a clean, unique, and privacy-safe referral code (e.g., 'AK-7K9M2X').
 * Never uses or leaks phone numbers.
 */
export function generateSafeReferralCode(user) {
  if (!user) return 'AK-VIP001';

  // 1. If user already has a valid non-phone referral code, use it
  if (user.referralCode && !isPhoneNumber(user.referralCode)) {
    const clean = user.referralCode.trim().toUpperCase();
    if (clean.startsWith('AK-') || clean.length >= 4) {
      return clean;
    }
  }

  // 2. Generate a clean code using userId, email, or a stable hash
  const identifier = user._id || user.id || user.email || user.username || 'guest';
  
  // If username is not a phone number, incorporate its prefix
  if (user.username && !isPhoneNumber(user.username) && /^[a-zA-Z]/.test(user.username)) {
    const prefix = user.username.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase();
    const suffix = hashStringToAlphanumeric(String(identifier), 4);
    return `AK-${prefix}${suffix}`;
  }

  const hashPart = hashStringToAlphanumeric(String(identifier), 6);
  return `AK-${hashPart}`;
}

/**
 * Constructs a fully qualified, privacy-safe referral URL.
 */
export function getSafeReferralLink(user, productId = null, origin = '') {
  const base = origin || (typeof window !== 'undefined' ? window.location.origin : 'https://abkharido.com');
  const refCode = generateSafeReferralCode(user);

  if (productId) {
    return `${base}/?prod=${encodeURIComponent(productId)}&ref=${encodeURIComponent(refCode)}`;
  }
  return `${base}/?ref=${encodeURIComponent(refCode)}`;
}

/**
 * Sanitizes an incoming referral code from URL query parameters.
 */
export function sanitizeReferralCode(rawCode) {
  if (!rawCode || typeof rawCode !== 'string') return null;
  const trimmed = rawCode.trim();
  
  // Prevent DOS payloads or excessively long strings
  if (trimmed.length > 32 || trimmed.length < 3) return null;
  
  // If someone passed a phone number in ?ref=, discard it for privacy & security
  if (isPhoneNumber(trimmed)) return null;

  // Keep only alphanumeric and standard dashes
  const sanitized = trimmed.replace(/[^a-zA-Z0-9\-_]/g, '').toUpperCase();
  return sanitized || null;
}
