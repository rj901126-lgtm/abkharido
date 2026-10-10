export const CATEGORIES = [
  { id: 'all', name: 'All Categories', icon: 'Box' },
  { id: 'electronics', name: 'Electronics & Audio', icon: 'Headphones' },
  { id: 'mobiles', name: 'Mobiles & 5G', icon: 'Smartphone' },
  { id: 'fashion', name: 'Fashion & Clothing', icon: 'Shirt' },
  { id: 'appliances', name: 'Appliances & Kitchen', icon: 'Home' },
  { id: 'home', name: 'Home & Living', icon: 'Home' },
  { id: 'beauty', name: 'Beauty & Health', icon: 'Sparkles' },
  { id: 'sports', name: 'Sports & Fitness', icon: 'Activity' }
];

export const API_VERSION = 'v1';
export const SITE_NAME = 'AbKharido';
export const SITE_URL = 'https://www.abkharido.com';
export const SUPPORT_EMAIL = 'support@abkharido.com';
export const SUPPORT_PHONE = '+91 9172600587';
export const COMPANY_LEGAL_NAME = 'AbKharido Retail Private Limited';
export const COMPANY_CITY = 'Palghar';
export const COMPANY_STATE = 'Maharashtra';
export const COMPANY_PINCODE = '401404';
export const FREE_SHIPPING_THRESHOLD = 499;
export const STANDARD_SHIPPING_FEE = 40;

/**
 * Validates whether an email string is a real, legitimate email address.
 * Rejects legacy encrypted ciphertext (hex salt 313233...), colons, pure hashes,
 * and internal auto-generated placeholder domains.
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const clean = email.trim().toLowerCase();
  if (!clean.includes('@') || !clean.includes('.')) return false;
  if (clean.includes(':') || clean.startsWith('313233')) return false;
  if (/^[0-9a-fA-F]{24,}$/.test(clean)) return false;
  if (
    clean.endsWith('@abkharido.com') && 
    !['admin@abkharido.com', 'support@abkharido.com', 'care@abkharido.com', 'wholesale@abkharido.com'].includes(clean)
  ) {
    return false;
  }
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(clean);
};

export const sanitizeEmail = (email) => {
  return isValidEmail(email) ? email.trim().toLowerCase() : '';
};

