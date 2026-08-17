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
  userCancelOrder,
  updateOrderShippingAddress,
  updateDeliveryInstructions,
  convertCodToPrepaid,
  processExchangeRequest,
  processReturnRequest,
  shipOrder
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

router.route('/:id/email-invoice').post(protect, sendOrderInvoiceEmail);

router.route('/:id/status').post(protect, admin, logAdminAction('UPDATE_ORDER_STATUS', 'Order'), updateOrderStatus);
router.route('/:id/ship').post(protect, admin, logAdminAction('SHIP_ORDER', 'Order'), shipOrder);
router.route('/:id/user-cancel').post(protect, userCancelOrder);
router.route('/:id/update-address').post(protect, updateOrderShippingAddress);
router.route('/:id/delivery-instructions').post(protect, updateDeliveryInstructions);
router.route('/:id/convert-to-prepaid').post(protect, convertCodToPrepaid);
router.route('/:id/exchange').post(protect, processExchangeRequest);
router.route('/:id/cancel').post(protect, admin, logAdminAction('CANCEL_ORDER', 'Order'), cancelOrder);
router.route('/:id/return').post(protect, processReturnRequest);

export default router;
