import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redisClient from './config/redis.js';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
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
dotenv.config();

const app = express();

// Ensure DB is connected before processing any requests in Vercel Serverless Environment
app.use(async (req, res, next) => {
  if (mongoose.connection.readyState !== 1 && mongoose.connection.readyState !== 2) {
    try {
      await connectDB();
    } catch (err) {
      console.error('DB Connection Failed', err);
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
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate Limiting (Basic protection)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  store: redisClient ? new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }) : undefined, // Fallback to memory if Redis is down
});
app.use('/api', apiLimiter);

// --- NEW MVC ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sellers', sellerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
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

export default app;
