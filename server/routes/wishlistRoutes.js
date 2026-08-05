import express from 'express';
import { getWishlist, syncWishlist } from '../controllers/wishlistController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getWishlist);

router.route('/sync')
  .post(protect, syncWishlist);

export default router;
