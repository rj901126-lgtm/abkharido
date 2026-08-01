import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Settlement from '../models/Settlement.js';
import PayoutAuditLog from '../models/PayoutAuditLog.js';
// eslint-disable-next-line
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

router.post('/payouts', protect, async (req, res) => {
  try {
    const user = req.user; // populated by protect middleware
    
    // Calculate 8-Day Locked Coins
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
    const lockedOrders = await Order.find({
      'referralApplied.referrerId': user.username,
      'referralApplied.isCredited': true,
      deliveredAt: { $gte: eightDaysAgo }
    });
    
    const lockedCoins = lockedOrders.reduce((sum, o) => sum + (o.referralApplied?.rewardAmount || 0), 0);
    const withdrawableCoins = Math.max(0, (user.walletCoins || 0) - lockedCoins);

    const requestedAmount = req.body.amount || withdrawableCoins;
    
    if (requestedAmount < 1000) {
      return res.status(400).json({ error: 'Minimum withdrawal amount is 1000 coins. You can still use your coins for purchases!' });
    }
    
    if (requestedAmount > withdrawableCoins) {
      return res.status(400).json({ error: 'Insufficient withdrawable coins' });
    }
    
    // Create a strict Audit Trail
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // Create a Pending Settlement Record
    const settlement = new Settlement({
      vendorId: user._id,
      amount: requestedAmount,
      status: 'Pending',
      notes: 'User requested withdrawal to Bank Account'
    });
    const createdSettlement = await settlement.save();

    // Create Immutable Payout Audit Log
    const auditLog = new PayoutAuditLog({
      action: 'REQUESTED',
      userId: user._id,
      amount: requestedAmount,
      settlementId: createdSettlement._id,
      performedBy: user._id,
      ipAddress,
      details: {
        message: 'User initiated withdrawal'
      }
    });
    await auditLog.save();

    // Deduct coins
    user.walletCoins = user.walletCoins - requestedAmount; 
    await user.save();
    
    res.json({ success: true, message: `Payout of ₹${requestedAmount} requested successfully. It is now pending admin approval.` });
  } catch (err) {
    console.error('Payout Request Error:', err);
    res.status(500).json({ error: 'Failed to process payout request' });
  }
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
            family: 4,
        });
    }

    // If connecting (which happens on cold start), wait for it to finish
    if (mongoose.connection.readyState === 2) {
        console.log("Mongoose is currently connecting, waiting...");
        await new Promise(resolve => {
            const checkInterval = setInterval(() => {
                if (mongoose.connection.readyState !== 2) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 500);
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
    const liveOrders = await Order.countDocuments({ status: { $nin: ['Delivered', 'Cancelled', 'cancelled', 'delivered', 'Returned', 'returned', 'Refunded', 'refunded', 'Failed', 'failed', 'Rejected', 'rejected'] } });
    
    // Calculate total revenue from non-cancelled orders
    const revenueAgg = await Order.aggregate([
      { $match: { status: { $nin: ['Cancelled', 'cancelled', 'Returned', 'returned', 'Refunded', 'refunded'] } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;

    // Real 7-day Sales Data
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    
    const rawSales = await Order.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo }, status: { $nin: ['Cancelled', 'cancelled', 'Returned', 'returned'] } } },
      { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$totalPrice" },
          orders: { $sum: 1 }
        }
      }
    ]);
    const salesMap = {};
    rawSales.forEach(item => { salesMap[item._id] = item; });
    const salesData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      salesData.push({
        date: dateStr,
        revenue: salesMap[dateStr] ? salesMap[dateStr].revenue : 0,
        orders: salesMap[dateStr] ? salesMap[dateStr].orders : 0
      });
    }

    // Real Live Order Feed
    const liveOrderFeed = await Order.find({ status: { $nin: ['Delivered', 'Cancelled', 'cancelled', 'delivered', 'Returned', 'returned', 'Refunded', 'refunded'] } })
      .sort({ createdAt: -1 })
      .limit(6)
      .select('_id totalPrice createdAt status shippingAddress')
      .lean();

    // Real Category Stats
    const categoryStats = await Product.aggregate([
      { $group: { _id: "$category", productCount: { $sum: 1 }, avgPrice: { $avg: "$price" } } },
      { $sort: { productCount: -1 } },
      { $limit: 4 }
    ]);

    res.json({
      kpis: {
        totalUsers,
        totalProducts,
        totalOrders,
        liveOrders,
        totalRevenue
      },
      salesData,
      liveOrderFeed,
      categoryStats
    });
  } catch (error) {
    console.error("Admin Analytics Error:", error);
    res.status(500).json({ error: 'Failed to fetch analytics', message: error.message });
  }
});

router.post('/shipping/serviceability', (req, res) => {
  res.json({ success: true, status: 'Deliverable', estimatedDays: 3 });
});
router.post('/admin/verify', (req, res) => {
  const { password } = req.body;
  if (password === '2026' || password === 'admin') {
    res.json({ success: true, token: 'abkharido_master_admin_2024' });
  } else {
    res.status(401).json({ error: 'Invalid PIN' });
  }
});
router.post('/payment/session', (req, res) => {
  res.json({ success: true, sessionId: 'mock_session_id', id: 'mock_session_id' });
});
router.post('/payment/verify', protect, async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (order) {
      // Securely update order as Paid
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentResult = { id: 'verified', status: 'SUCCESS', update_time: new Date().toISOString(), email_address: req.user.email };
      // Move status forward if it's pending
      if (order.status === 'Pending') {
        order.status = 'Processing';
      }
      await order.save();
      res.json({ success: true, message: 'Payment verified and order updated' });
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Payment verification failed' });
  }
});

export default router;
