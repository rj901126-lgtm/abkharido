import User from '../models/User.js';
import redisClient, { isRedisReady } from '../config/redis.js';
import { verifyAppToken, isSystemAdmin, isActiveUser } from '../utils/authSecurity.js';

async function resolveIdentity(req) {
  const bearer = /^Bearer\s+(\S+)$/i.exec(req.headers.authorization || '')?.[1];
  const token = bearer || req.headers['x-admin-token'] ||
    req.cookies?.abkharido_admin_token || req.cookies?.abkharido_seller_token;
  if (!token) return null;
  const secure = process.env.ADMIN_SECURE_TOKEN;
  if (secure && secure.length >= 32 && token === secure) return { role: 'super_admin', _id: 'admin-root' };
  if (isRedisReady() && await redisClient.get(`blacklist:${token}`).catch(() => null)) return null;
  const decoded = verifyAppToken(token);
  if (isSystemAdmin(decoded)) return { role: 'super_admin', _id: 'admin-root', username: 'admin' };
  if (typeof decoded.id !== 'string' || !/^[a-f\d]{24}$/i.test(decoded.id)) return null;
  const user = await User.findById(decoded.id).select('-password');
  return isActiveUser(user) ? user : null;
}

export const protect = async (req, res, next) => {
  try {
    req.user = await resolveIdentity(req);
    if (!req.user) return res.status(401).json({ error: 'Not authorized, valid active account required' });
    return next();
  } catch { return res.status(401).json({ error: 'Not authorized, invalid token' }); }
};
export const softProtect = async (req, res, next) => {
  try { req.user = await resolveIdentity(req); } catch { req.user = null; }
  return next();
};
export const admin = (req, res, next) => {
  if (req.user && ['admin', 'super_admin'].includes(req.user.role)) return next();
  return res.status(403).json({ error: 'Not authorized as an admin' });
};
export const authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Not logged in' });
  if (req.user.role === 'super_admin' || roles.includes(req.user.role)) return next();
  return res.status(403).json({ error: 'Access denied: insufficient permissions' });
};
export const seller = (req, res, next) => {
  if (req.user && ['admin', 'super_admin'].includes(req.user.role)) return next();
  if (req.user?.role === 'seller' && req.user.sellerStatus === 'Approved') return next();
  return res.status(403).json({ error: 'Approved seller access required' });
};
