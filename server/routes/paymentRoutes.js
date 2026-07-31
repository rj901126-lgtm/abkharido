import express from 'express';
import { generatePaymentSession, verifyPayment, fetchSavedCards, deleteSavedCard } from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/session', protect, generatePaymentSession);
router.post('/verify', protect, verifyPayment);
router.get('/saved-cards', protect, fetchSavedCards);
router.delete('/saved-cards/:instrumentId', protect, deleteSavedCard);

export default router;
