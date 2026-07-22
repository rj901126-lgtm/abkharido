import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import productsData from '../data/productsData.js';

const router = express.Router();

// Mock endpoints to satisfy frontend calls while using new architecture

router.get('/promotions', (req, res) => {
  res.json({
    dealsTimer: '2026-12-31T23:59:59',
    budgetThreshold: 15000,
    dealOfTheDayProducts: [],
    banners: [],
    categoryBanners: { all: { slides: [], show: false } }
  });
});

router.post('/promotions', protect, admin, (req, res) => {
  res.json({ success: true });
});

router.get('/stats', (req, res) => {
  res.json({ sales: 0, orders: 0, users: 0, clicks: 0 });
});

router.post('/stats/click', (req, res) => {
  res.json({ success: true });
});

router.post('/payouts', protect, (req, res) => {
  res.json({ success: true, message: 'Payout requested successfully' });
});

router.post('/reset', protect, admin, (req, res) => {
  res.json({ success: true, message: 'Database reset successfully' });
});

// Legacy auth routes used by frontend
router.post('/auth/send-otp', (req, res) => {
  res.json({ success: true, otp: '123456' });
});
router.post('/auth/verify-otp', (req, res) => {
  res.json({ success: true, token: 'mock_token', username: 'mock_user' });
});
router.post('/auth/check-user', (req, res) => {
  res.json({ exists: true, role: 'user' });
});
router.post('/auth/verify-firebase', (req, res) => {
  res.json({ success: true, token: 'mock_token', username: 'mock_user' });
});
router.post('/seller/signup', (req, res) => {
  res.json({ success: true, token: 'mock_token', username: 'mock_seller' });
});
router.post('/seller/login', (req, res) => {
  res.json({ success: true, token: 'mock_token', username: 'mock_seller' });
});
router.get('/seller/products', (req, res) => {
  res.json([]);
});

// TEMPORARY ROUTE TO MIGRATE DATA ON VERCEL
router.get('/migrate-data', async (req, res) => {
  try {
    const mongooseModule = await import('mongoose');
    const mongoose = mongooseModule.default;
    
    // Force connect if disconnected
    if (mongoose.connection.readyState === 0) {
        console.log("Mongoose disconnected, attempting to connect within route...");
        await mongoose.connect(process.env.MONGODB_URI, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
    }

    if (mongoose.connection.readyState !== 1) {
       const uri = process.env.MONGODB_URI || 'UNDEFINED';
       const pwdMatch = uri.match(/:([^:@]+)@/);
       const pwd = pwdMatch ? pwdMatch[1] : '';
       const pwdHint = pwd.length > 2 ? `${pwd[0]}...${pwd[pwd.length - 1]} (Length: ${pwd.length})` : 'none';
       const maskedUri = uri.replace(/:([^:@]+)@/, ':***@');
       return res.status(500).json({ 
           error: 'Database is not connected after forced attempt!', 
           readyState: mongoose.connection.readyState,
           maskedUri: maskedUri,
           pwdHint: pwdHint,
           hint: 'Your Username/Password/IP is definitely wrong or blocked.'
       });
    }

    const { default: Product } = await import('../models/Product.js');
    const { default: User } = await import('../models/User.js');
    const { default: productsData } = await import('../data/productsData.js');

    await Product.deleteMany({});
    
    const docs = productsData.map(p => ({
       ...p,
       originalPrice: p.originalPrice || p.price + 500,
       inStock: p.inStock !== undefined ? p.inStock : true,
       soldCount: p.soldCount || 0
    }));
    
    await Product.insertMany(docs);
    
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
        await User.create({
            username: 'admin',
            email: 'admin@abkharido.com',
            password: 'admin',
            role: 'admin',
            fullName: 'System Administrator'
        });
    }
    
    res.json({ success: true, message: `Migrated ${docs.length} products to MongoDB successfully.` });
  } catch (error) {
    res.status(500).json({ error: 'Migration failed: ' + error.message });
  }
});

router.get('/seller/orders', (req, res) => {
  res.json([]);
});

router.get('/admin/analytics', protect, admin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    
    // Calculate total revenue
    const revenueAgg = await Order.aggregate([
      { $match: { isPaid: true } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;

    // Dummy sales data for graph
    const salesData = [
      { date: '2026-07-15', revenue: 12000, orders: 4 },
      { date: '2026-07-16', revenue: 15000, orders: 5 },
      { date: '2026-07-17', revenue: 9000, orders: 3 },
      { date: '2026-07-18', revenue: 22000, orders: 8 },
      { date: '2026-07-19', revenue: 18000, orders: 6 },
      { date: '2026-07-20', revenue: 25000, orders: 10 }
    ];

    res.json({
      kpis: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue
      },
      salesData
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

router.post('/shipping/serviceability', (req, res) => {
  res.json({ success: true, status: 'Deliverable', estimatedDays: 3 });
});
router.post('/admin/verify', (req, res) => {
  res.json({ success: true });
});
router.post('/payment/session', (req, res) => {
  res.json({ success: true, sessionId: 'mock_session_id', id: 'mock_session_id' });
});
router.post('/payment/verify', (req, res) => {
  res.json({ success: true, message: 'Payment verified' });
});

export default router;
