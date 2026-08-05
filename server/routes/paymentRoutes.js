import express from 'express';
import { generatePaymentSession, verifyPayment, fetchSavedCards, deleteSavedCard, cashfreeWebhook } from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/session', protect, generatePaymentSession);
router.post('/verify', protect, verifyPayment);
router.post('/webhook', cashfreeWebhook); // Public webhook route (Cashfree calls this)
router.get('/saved-cards', protect, fetchSavedCards);
router.delete('/saved-cards/:instrumentId', protect, deleteSavedCard);

export default router;
