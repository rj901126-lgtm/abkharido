import express from 'express';
import { getFinanceStats, getVendorsBalance, settleVendor, getPayouts } from '../controllers/financeController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { logAdminAction } from '../middleware/auditMiddleware.js';

const router = express.Router();

router.route('/stats')
  .get(protect, admin, getFinanceStats);

router.route('/vendors-balance')
  .get(protect, admin, getVendorsBalance);

router.route('/settle')
  .post(protect, admin, logAdminAction('SETTLE_VENDOR_PAYOUT', 'Settlement'), settleVendor);

router.route('/payouts')
  .get(protect, admin, getPayouts);

export default router;
