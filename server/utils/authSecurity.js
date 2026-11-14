import jwt from 'jsonwebtoken';
import { randomBytes, timingSafeEqual } from 'node:crypto';

// Reject PIN sessions issued before the default-PIN bypass was removed.
const ADMIN_AUTH_VERSION = 2;

export function verifyAdminPin(password) {
  const input = typeof password === 'string' ? password.trim() : '';
  const configuredPin = (process.env.ADMIN_SECURE_PIN || '').trim();
  if (!input) {
    return { configured: Boolean(configuredPin), matches: false };
  }
  if (!configuredPin) return { configured: false, matches: false };
  const inputBuffer = Buffer.from(input);
  const configuredBuffer = Buffer.from(configuredPin);
  const isMatch = inputBuffer.length === configuredBuffer.length &&
    timingSafeEqual(inputBuffer, configuredBuffer);
  return { configured: true, matches: isMatch };
}

export function signAdminToken() {
  return jwt.sign(
    { role: 'super_admin', id: 'admin-root', purpose: 'admin', adminAuthVersion: ADMIN_AUTH_VERSION,
      email: 'admin@abkharido.com', username: 'admin', issuer: 'AbKharido Security Engine' },
    getJwtSecret(),
    { algorithm: 'HS256', expiresIn: '7d', audience: 'abkharido-admin', issuer: 'abkharido' }
  );
}

const DEVELOPMENT_JWT_SECRET = randomBytes(32).toString('hex');

export function getJwtSecret(name = 'JWT_SECRET') {
  const value = process.env[name] || process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
  if (typeof value === 'string' && value.length >= 32) {
    return value;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`A strong ${name} or JWT_SECRET/NEXTAUTH_SECRET must be configured in production.`);
  }
  return DEVELOPMENT_JWT_SECRET;
}
export function signUserToken(id) {
  return jwt.sign({ id: String(id), purpose: 'user' }, getJwtSecret(), { algorithm: 'HS256', expiresIn: '30d' });
}
export function verifyAppToken(token) {
  return jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] });
}
export function isSystemAdmin(payload) {
  return payload?.id === 'admin-root' && payload?.purpose === 'admin' && payload?.aud === 'abkharido-admin' && payload?.iss === 'abkharido' && payload?.adminAuthVersion === ADMIN_AUTH_VERSION;
}
export function isActiveUser(user) {
  return Boolean(user) && !['suspended', 'disabled', 'banned', 'deleted', 'inactive'].includes(String(user.status || '').toLowerCase()) && !user.isSuspended && !user.isBlocked;
}
export function isGeneratedPassword(password) {
  return typeof password !== 'string' || password === 'FirebaseVerifiedUser123!' || /^(?:abkharido_otp_user_|abkharido_user_)/.test(password);
}
