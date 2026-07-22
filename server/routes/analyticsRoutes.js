import express from 'express';
import { getSalesAnalytics, getKPIs, getInventoryPrediction } from '../controllers/analyticsController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/sales', protect, admin, getSalesAnalytics);
router.route('/kpi')
  .get(protect, admin, getKPIs);

router.route('/inventory-predict')
  .get(protect, admin, getInventoryPrediction);

export default router;
