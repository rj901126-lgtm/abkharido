import express from 'express';
import { getLayout, updateLayout, getCategories, createCategory } from '../controllers/cmsController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { cache } from '../middleware/cacheMiddleware.js';

const router = express.Router();

router.route('/layout/:type')
  .get(cache(86400), getLayout)
  .put(protect, admin, updateLayout);

router.route('/categories')
  .get(cache(86400), getCategories)
  .post(protect, admin, createCategory);

export default router;
