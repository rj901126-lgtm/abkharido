import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redisClient, { isRedisReady } from './config/redis.js';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import logger from './config/logger.js';
import { initCronJobs } from './utils/cronJobs.js';

// eslint-disable-next-line
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import shippingRoutes from './routes/shippingRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import cmsRoutes from './routes/cmsRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import userRoutes from './routes/userRoutes.js';
import sellerRoutes from './routes/sellerRoutes.js';
import legacyRoutes from './routes/legacyRoutes.js';
import financeRoutes from './routes/financeRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import staffRoutes from './routes/staffRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
dotenv.config();

const app = express();

// Ensure DB is connected before processing any requests in Vercel Serverless Environment
app.use(async (req, res, next) => {
  if (mongoose.connection.readyState !== 1 && mongoose.connection.readyState !== 2) {
    try {
      await connectDB();
    } catch (err) {
      logger.error(`DB Connection Failed: ${err.message}`, { stack: err.stack });
    }
  } else if (mongoose.connection.readyState === 2) {
    // If it's currently connecting, wait for it
    await new Promise(resolve => {
      const checkInterval = setInterval(() => {
        if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 0) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  }
  next();
});

// Trust proxy for rate limiting behind Vercel/Load Balancers
app.set('trust proxy', 1);

// Security Middleware
// Initialize background automated jobs (e.g. Abandoned Carts)
initCronJobs();

// Security & Compression Middleware
app.use(helmet());
const allowedOrigins = [
  'https://www.abkharido.com',
  'https://abkharido.com',
  'http://localhost:3000',
  'http://localhost:5000',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5000'
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, curl, Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(compression()); // Compress all API responses to drastically reduce size
app.use(express.json({ 
  limit: '50mb',
  verify: (req, res, buf) => {
    if (req.originalUrl === '/api/payment/webhook') {
      req.rawBody = buf.toString('utf8');
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Custom Data Sanitization against NoSQL query injection (Express 5 safe)
const sanitizeObject = (obj) => {
  if (obj && typeof obj === 'object') {
    Object.keys(obj).forEach((key) => {
      if (key.includes('$') || key.includes('.')) {
        // Strip prohibited characters from keys
        const cleanKey = key.replace(/\$|\./g, '');
        obj[cleanKey] = obj[key];
        delete obj[key];
        sanitizeObject(obj[cleanKey]);
      } else {
        sanitizeObject(obj[key]);
      }
    });
  }
};
app.use((req, res, next) => {
  if (req.body) sanitizeObject(req.body);
  if (req.params) sanitizeObject(req.params);
  // Mutate req.query in place, do not reassign
  if (req.query) {
    const queryObj = req.query; 
    sanitizeObject(queryObj);
  }
  next();
});
// Logging
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Rate Limiting (Basic protection)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  passOnStoreError: true,
  message: { error: 'Too many requests, please try again later.' },
  store: isRedisReady() ? new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }) : undefined,
});

// Strict Rate Limiting for Auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 auth requests per window
  standardHeaders: true,
  legacyHeaders: false,
  passOnStoreError: true,
  message: { error: 'Too many authentication attempts, please try again later.' },
  store: isRedisReady() ? new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }) : undefined,
});

// Ultra-strict Rate Limiting for OTP / SMS Routes (Cost protection)
const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 5, // Limit each IP to 5 OTP requests per hour to prevent SMS cost drain
  standardHeaders: true,
  legacyHeaders: false,
  passOnStoreError: true,
  message: { error: 'Too many OTP requests. Please try again after an hour.' },
  store: isRedisReady() ? new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }) : undefined,
});

// Seller Auth Rate Limiting
const sellerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  passOnStoreError: true,
  message: { error: 'Too many seller authentication attempts, please try again later.' },
  store: isRedisReady() ? new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }) : undefined,
});

app.use('/api', apiLimiter);
app.use('/api/auth/send-otp', otpLimiter);
app.use('/api/auth/verify-otp', authLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/seller/login', sellerLimiter);
app.use('/api/seller/signup', sellerLimiter);

// Health check endpoints
app.get('/api', (req, res) => {
  res.json({ status: 'healthy', version: '2.0.0', service: 'AbKharido Enterprise API' });
});
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- NEW MVC ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sellers', sellerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/admin/analytics', analyticsRoutes);
app.use('/api/cms', cmsRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/admin/search', searchRoutes);

// --- LEGACY ROUTES WILL BE MOUNTED HERE BY api/index.js ---
app.use('/api', legacyRoutes);

// Mount Enterprise Error Handlers
app.use(notFound);
app.use(errorHandler);

export default app;
