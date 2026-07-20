import express from 'express';
import { getSalesAnalytics, getKPIs } from '../controllers/analyticsController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/sales', protect, admin, getSalesAnalytics);
router.get('/kpi', protect, admin, getKPIs);

export default router;
