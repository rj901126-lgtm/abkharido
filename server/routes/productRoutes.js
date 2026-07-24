import express from 'express';
import { 
  getProducts, 
  getProductById, 
  createProduct, 
  updateProduct, 
  deleteProduct,
  updateProductStock,
  getProductRecommendations
} from '../controllers/productController.js';
import { protect, seller, admin } from '../middleware/authMiddleware.js';
import { cache } from '../middleware/cacheMiddleware.js';
import { logAdminAction } from '../middleware/auditMiddleware.js';

const router = express.Router();

router.route('/')
  .get(cache(300), getProducts)
  .post(protect, seller, logAdminAction('CREATE_PRODUCT', 'Product'), createProduct);

router.route('/paginated')
  .get(protect, admin, getProducts); // Admin specific paginated view

router.route('/:id')
  .get(cache(300), getProductById)
  .put(protect, seller, logAdminAction('UPDATE_PRODUCT', 'Product'), updateProduct)
  .delete(protect, seller, logAdminAction('DELETE_PRODUCT', 'Product'), deleteProduct);

router.route('/:id/stock')
  .post(protect, seller, logAdminAction('QUICK_UPDATE_STOCK', 'Product'), updateProductStock);

router.route('/:id/recommendations')
  .get(cache(300), getProductRecommendations);

export default router;
