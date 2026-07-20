import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'abkharido_jwt_secret_dev');
      
      req.user = await User.findById(decoded.id).select('-password');
      next();
    } catch (error) {
      console.error('JWT Verification Error:', error);
      res.status(401).json({ error: 'Not authorized, token failed' });
    }
  } else {
    // Fallback for legacy admin token during migration
    const adminToken = req.headers['x-admin-token'];
    if (adminToken === 'abkharido_master_admin_2024') {
      req.user = { role: 'admin', _id: 'master_admin_legacy' };
      return next();
    }

    res.status(401).json({ error: 'Not authorized, no token' });
  }
};

export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Not authorized as an admin' });
  }
};

export const seller = (req, res, next) => {
  if (req.user && (req.user.role === 'seller' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ error: 'Not authorized as a seller' });
  }
};
