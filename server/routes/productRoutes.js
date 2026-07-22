import express from 'express';
import { 
  getProducts, 
  getProductById, 
  createProduct, 
  updateProduct, 
  deleteProduct 
} from '../controllers/productController.js';
import { protect, seller, admin } from '../middleware/authMiddleware.js';
import { cache } from '../middleware/cacheMiddleware.js';

const router = express.Router();

router.route('/')
  .get(cache(300), getProducts)
  .post(protect, seller, createProduct);

router.route('/paginated')
  .get(protect, admin, getProducts); // Admin specific paginated view

router.route('/:id')
  .get(cache(300), getProductById)
  .put(protect, seller, updateProduct)
  .delete(protect, seller, deleteProduct);

export default router;
