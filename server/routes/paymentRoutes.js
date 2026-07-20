import express from 'express';
import { generatePaymentSession, verifyPayment } from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/session', protect, generatePaymentSession);
router.post('/verify', protect, verifyPayment);

export default router;
