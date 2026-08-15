import express from 'express';
import { 
  registerSeller, 
  authSeller, 
  getSellers, 
  getSellerProducts, 
  getSellerOrders,
  updateSellerStatus 
} from '../controllers/sellerController.js';
import { protect, seller, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public auth routes (rate limited by app.js)
router.post('/signup', registerSeller);
router.post('/login', authSeller);

// Seller dashboard routes (strictly bound to authenticated seller token)
router.get('/products', protect, seller, getSellerProducts);
router.get('/orders', protect, seller, getSellerOrders);

// Admin-only seller governance routes
router.get('/', protect, admin, getSellers);
router.patch('/:id/status', protect, admin, updateSellerStatus);

export default router;
