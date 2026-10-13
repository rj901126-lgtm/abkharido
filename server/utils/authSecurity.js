import jwt from 'jsonwebtoken';

const publishedSecrets = new Set(['abkharido_enterprise_secret_2026', 'abkharido_enterprise_secret_2026_super_secure', 'fallback_secret_for_dev_abkharido']);
export function getJwtSecret(name = 'JWT_SECRET') {
  const value = process.env[name];
  if (typeof value !== 'string' || value.length < 32 || publishedSecrets.has(value)) {
    throw new Error(`Server configuration requires a private ${name} of at least 32 characters.`);
  }
  return value;
}
export function signUserToken(id) {
  return jwt.sign({ id: String(id), purpose: 'user' }, getJwtSecret(), { algorithm: 'HS256', expiresIn: '30d' });
}
export function verifyAppToken(token) {
  return jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] });
}
export function isSystemAdmin(payload) {
  return payload?.id === 'admin-root' && payload?.purpose === 'admin' && payload?.aud === 'abkharido-admin' && payload?.iss === 'abkharido';
}
export function isActiveUser(user) {
  return Boolean(user) && !['suspended', 'disabled', 'banned', 'deleted', 'inactive'].includes(String(user.status || '').toLowerCase()) && !user.isSuspended && !user.isBlocked;
}
export function isGeneratedPassword(password) {
  return typeof password !== 'string' || password === 'FirebaseVerifiedUser123!' || /^(?:abkharido_otp_user_|abkharido_user_)/.test(password);
}
