import express from 'express';
import { generatePaymentSession, verifyPayment, fetchSavedCards } from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/session', protect, generatePaymentSession);
router.post('/verify', protect, verifyPayment);
router.get('/saved-cards', protect, fetchSavedCards);

export default router;
