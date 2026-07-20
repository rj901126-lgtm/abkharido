import express from 'express';
import { getLayout, updateLayout, getCategories, createCategory } from '../controllers/cmsController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/layout/:type')
  .get(getLayout)
  .put(protect, admin, updateLayout);

router.route('/categories')
  .get(getCategories)
  .post(protect, admin, createCategory);

export default router;
