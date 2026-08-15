import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import redisClient, { isRedisReady } from '../config/redis.js';

export const protect = async (req, res, next) => {
  let token;

  // Check Bearer authorization header or cookies
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && (req.cookies.abkharido_seller_token || req.cookies.abkharido_admin_token)) {
    token = req.cookies.abkharido_seller_token || req.cookies.abkharido_admin_token;
  }

  if (token) {
    try {
      if (isRedisReady()) {
        const isBlacklisted = await redisClient.get(`blacklist:${token}`).catch(() => null);
        if (isBlacklisted) {
          return res.status(401).json({ error: 'Token has been revoked. Please log in again.' });
        }
      }

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        return res.status(500).json({ error: 'Server misconfiguration: JWT_SECRET is not set.' });
      }
      
      const decoded = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
      
      // If token payload represents a system super_admin session
      if (decoded.role === 'super_admin' && !decoded.id) {
        req.user = { role: 'super_admin', username: 'admin' };
        return next();
      }

      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({ error: 'User account not found. Please log in again.' });
      }
      
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Not authorized, invalid token' });
    }
  } else if (req.headers['x-admin-token']) {
    try {
      const adminToken = req.headers['x-admin-token'];
      const adminSecureToken = process.env.ADMIN_SECURE_TOKEN;
      if (adminSecureToken && adminToken === adminSecureToken) {
        req.user = { role: 'super_admin' };
        return next();
      }
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        return res.status(500).json({ error: 'Server misconfiguration: JWT_SECRET is not set.' });
      }
      const decoded = jwt.verify(adminToken, jwtSecret, { algorithms: ['HS256'] });
      req.user = decoded.role ? decoded : { role: 'super_admin', ...decoded };
      next();
    } catch (err) {
      res.status(401).json({ error: 'Not authorized, invalid security token' });
    }
  } else {
    res.status(401).json({ error: 'Not authorized, no security token provided' });
  }
};

export const softProtect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const jwtSecret = process.env.JWT_SECRET;
      if (jwtSecret) {
        const decoded = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
        if (decoded.id) {
          req.user = await User.findById(decoded.id).select('-password');
        } else if (decoded.role === 'super_admin') {
          req.user = { role: 'super_admin' };
        }
      }
      next();
    } catch (error) {
      next();
    }
  } else if (req.headers['x-admin-token']) {
    try {
      const adminToken = req.headers['x-admin-token'];
      const jwtSecret = process.env.JWT_SECRET;
      if (jwtSecret) {
        const decoded = jwt.verify(adminToken, jwtSecret, { algorithms: ['HS256'] });
        req.user = decoded.role ? decoded : { role: 'super_admin', ...decoded };
      }
      next();
    } catch (err) {
      next();
    }
  } else {
    next();
  }
};

export const admin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'super_admin')) {
    next();
  } else {
    res.status(403).json({ error: 'Not authorized as an admin' });
  }
};

// Authorize specific roles
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not logged in' });
    }
    if (req.user.role === 'super_admin') {
      return next(); // Super admin has access to everything
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Access denied: insufficient permissions' 
      });
    }
    next();
  };
};

export const seller = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'super_admin')) {
    return next();
  }
  if (req.user && req.user.role === 'seller') {
    if (req.user.sellerStatus === 'Approved') {
      return next();
    }
    return res.status(403).json({ error: 'Seller account is pending admin approval' });
  }
  res.status(403).json({ error: 'Not authorized as a seller' });
};
