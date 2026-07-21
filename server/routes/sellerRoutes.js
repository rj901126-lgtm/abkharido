import express from 'express';
import { registerSeller, authSeller, getSellers } from '../controllers/sellerController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/signup', registerSeller);
router.post('/login', authSeller);
router.get('/', protect, admin, getSellers);

export default router;
