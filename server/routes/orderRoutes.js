import express from 'express';
import {
  addOrderItems,
  getOrderById,
  getMyOrders,
  getOrders,
  sendOrderInvoiceEmail,
  exportOrdersBulk,
  updateOrderStatus,
  cancelOrder,
  userCancelOrder
} from '../controllers/orderController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { logAdminAction } from '../middleware/auditMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, addOrderItems)
  .get(protect, admin, getOrders);

router.route('/myorders').get(protect, getMyOrders);

router.route('/bulk-export').post(protect, admin, exportOrdersBulk);

router.route('/:id').get(protect, getOrderById);

router.route('/:id/email-invoice').post(protect, admin, logAdminAction('SEND_INVOICE', 'Order'), sendOrderInvoiceEmail);

router.route('/:id/status').post(protect, admin, logAdminAction('UPDATE_ORDER_STATUS', 'Order'), updateOrderStatus);
router.route('/:id/user-cancel').post(protect, userCancelOrder);
router.route('/:id/cancel').post(protect, admin, logAdminAction('CANCEL_ORDER', 'Order'), cancelOrder);

export default router;
