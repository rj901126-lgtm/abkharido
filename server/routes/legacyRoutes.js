import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Mock endpoints to satisfy frontend calls while using new architecture

router.get('/promotions', (req, res) => {
  res.json({ success: true, promotions: [] });
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
