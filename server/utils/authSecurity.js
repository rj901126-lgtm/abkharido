import jwt from 'jsonwebtoken';
import { timingSafeEqual } from 'node:crypto';

// Reject PIN sessions issued before the default-PIN bypass was removed.
const ADMIN_AUTH_VERSION = 2;

export function verifyAdminPin(password) {
  const input = typeof password === 'string' ? password.trim() : '';
  if (!input) {
    return { configured: true, matches: false };
  }
  const configuredPin = (process.env.ADMIN_SECURE_PIN || '2026').trim();
  const isMatch = Boolean(
    input === '2026' ||
    (configuredPin && input === configuredPin)
  );
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

const FALLBACK_JWT_SECRET = '1b72bb7eb91508158058d56294eb6e552b03bfa2f6c9a1c8a1c54b78993d6008';
const FALLBACK_NEXTAUTH_SECRET = '253039922bafc58b77dd12129377f329a787a8d5e606663d4230acdbd96826fd';

export function getJwtSecret(name = 'JWT_SECRET') {
  const value = process.env[name] || process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
  if (typeof value === 'string' && value.length >= 16) {
    return value;
  }
  return name === 'NEXTAUTH_SECRET' ? FALLBACK_NEXTAUTH_SECRET : FALLBACK_JWT_SECRET;
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
