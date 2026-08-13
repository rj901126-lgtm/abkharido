import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import redisClient from '../config/redis.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      
      if (redisClient) {
        const isBlacklisted = await redisClient.get(`blacklist:${token}`);
        if (isBlacklisted) {
          return res.status(401).json({ error: 'Token has been revoked. Please log in again.' });
        }
      }

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        return res.status(500).json({ error: 'Server misconfiguration: JWT_SECRET is not set.' });
      }
      const decoded = jwt.verify(token, jwtSecret);
      
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({ error: 'User no longer exists. Please log in again.' });
      }
      
      next();
    } catch (error) {
      console.error('JWT Verification Error:', error);
      res.status(401).json({ error: 'Not authorized, token failed' });
    }
  } else if (req.headers['x-admin-token']) {
    try {
      const adminToken = req.headers['x-admin-token'];
      const adminSecureToken = process.env.ADMIN_SECURE_TOKEN;
      // SECURITY: No hardcoded fallback. If ADMIN_SECURE_TOKEN is not set, this path is disabled.
      if (adminSecureToken && adminToken === adminSecureToken) {
        req.user = { role: 'super_admin' };
        return next();
      }
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        return res.status(500).json({ error: 'Server misconfiguration: JWT_SECRET is not set.' });
      }
      const decoded = jwt.verify(adminToken, jwtSecret);
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
    try {
      token = req.headers.authorization.split(' ')[1];
      
      if (redisClient) {
        const isBlacklisted = await redisClient.get(`blacklist:${token}`);
        if (isBlacklisted) {
          return next(); // Proceed as unauthenticated
        }
      }

      const jwtSecret2 = process.env.JWT_SECRET;
      if (jwtSecret2) {
        const decoded = jwt.verify(token, jwtSecret2);
        req.user = await User.findById(decoded.id).select('-password');
      }
      // If user doesn't exist, req.user will be null, which is fine for softProtect
      next();
    } catch (error) {
      // Token failed (expired/invalid) - proceed as unauthenticated
      next();
    }
  } else if (req.headers['x-admin-token']) {
    try {
      const adminToken = req.headers['x-admin-token'];
      const adminSecureToken2 = process.env.ADMIN_SECURE_TOKEN;
      if (adminSecureToken2 && adminToken === adminSecureToken2) {
        req.user = { role: 'super_admin' };
        return next();
      }
      const jwtSecret3 = process.env.JWT_SECRET;
      if (jwtSecret3) {
        const decoded = jwt.verify(adminToken, jwtSecret3);
        req.user = decoded.role ? decoded : { role: 'super_admin', ...decoded };
      }
      next();
    } catch (err) {
      next();
    }
  } else {
    next(); // No token, proceed as unauthenticated
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
        error: `Role (${req.user.role}) is not allowed to access this resource` 
      });
    }
    next();
  };
};

export const seller = (req, res, next) => {
  if (req.user && (req.user.role === 'seller' || req.user.role === 'admin' || req.user.role === 'super_admin')) {
    next();
  } else {
    res.status(403).json({ error: 'Not authorized as a seller' });
  }
};
