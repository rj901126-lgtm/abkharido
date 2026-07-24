import express from 'express';
import { getCoupons, createCoupon, validateCoupon, deleteCoupon } from '../controllers/couponController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, admin, getCoupons)
  .post(protect, admin, createCoupon);

router.post('/validate', protect, validateCoupon);

router.delete('/:id', protect, admin, deleteCoupon);

export default router;
