import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import shippingRoutes from './routes/shippingRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import cmsRoutes from './routes/cmsRoutes.js';

dotenv.config();

// Connect to MongoDB
connectDB().catch(err => console.error('DB Connection Failed', err));

const app = express();

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
  max: 1000, // Limit each IP to 100 requests per `window`
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

// --- NEW MVC ROUTES ---
app.use('/api/v2/auth', authRoutes);
app.use('/api/v2/products', productRoutes);
app.use('/api/v2/orders', orderRoutes);
app.use('/api/v2/payment', paymentRoutes);
app.use('/api/v2/shipping', shippingRoutes);
app.use('/api/v2/analytics', analyticsRoutes);
app.use('/api/v2/cms', cmsRoutes);

// --- LEGACY ROUTES WILL BE MOUNTED HERE BY api/index.js ---

export default app;
