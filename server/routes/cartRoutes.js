import express from 'express';
import { getCart, syncCart } from '../controllers/cartController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getCart);

router.route('/sync')
  .post(protect, syncCart);

export default router;
