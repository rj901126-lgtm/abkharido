import express from 'express';
import jwt from 'jsonwebtoken';
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

// [SEC-PATCH]: Removed mock legacy auth and seller endpoints so all auth is handled strictly by authentic controllers.

router.get('/admin/analytics', protect, admin, async (req, res) => {
  try {
    const nonLiveStatuses = ['Delivered', 'Cancelled', 'cancelled', 'CANCELLED', 'delivered', 'DELIVERED', 'Returned', 'returned', 'RETURNED', 'Refunded', 'refunded', 'REFUNDED', 'Failed', 'failed', 'FAILED', 'Rejected', 'rejected', 'REJECTED'];
    const nonRevenueStatuses = ['Cancelled', 'cancelled', 'CANCELLED', 'Returned', 'returned', 'RETURNED', 'Refunded', 'refunded', 'REFUNDED', 'Failed', 'failed', 'FAILED', 'Rejected', 'rejected', 'REJECTED'];

    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const liveOrders = await Order.countDocuments({ status: { $nin: nonLiveStatuses } });
    
    // Calculate total revenue from non-cancelled orders
    const revenueAgg = await Order.aggregate([
      { $match: { status: { $nin: nonRevenueStatuses } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;

    // Real 7-day Sales Data
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    
    const rawSales = await Order.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo }, status: { $nin: nonRevenueStatuses } } },
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
    const liveOrderFeed = await Order.find({ status: { $nin: nonLiveStatuses } })
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
// [SEC-PATCH]: Removed backdoor /admin/verify endpoint that allowed instant role elevation to super_admin
router.post('/payment/session', (req, res) => {
  res.json({ success: true, sessionId: 'mock_session_id', id: 'mock_session_id' });
});
// [SEC-PATCH]: Removed fake /payment/verify endpoint that bypassed Cashfree API and allowed free checkout marking

export default router;
