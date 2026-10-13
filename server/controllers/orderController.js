import { csvRows } from '../../src/utils/csvExport.js';
import { checkoutOrder, findOrder, startConversion, cancelAndRefund, requireFulfillable, recordCashCollection, creditDeliveredReferral } from '../../src/app/api/orders/financialSecurity.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Coupon from '../models/Coupon.js';
import { sendInvoiceEmail } from '../utils/emailService.js';
import { addOrderToQueue } from '../utils/queue.js';
import logger from '../config/logger.js';
import { generateShipmentAWB } from '../services/shiprocketService.js';
import { processCashfreeRefund } from './paymentController.js';
import redisClient from '../config/redis.js';

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
export const addOrderItems = async (req, res, next) => {
 try { const result = await checkoutOrder(req.body, req.user._id || req.user.id); return res.status(201).json(result.order); }
 catch (error) { res.status(400); next(error); }
};

export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      'user',
      'username email'
    );

    if (order) {
      // SECURITY: Null guard — order.user may be null if user was deleted
      if (!order.user || (order.user._id.toString() !== req.user._id.toString() && !['admin', 'super_admin'].includes(req.user.role))) {
        res.status(403);
        throw new Error('Not authorized to view this order');
      }
      res.json(order);
    } else {
      res.status(404);
      throw new Error('Order not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20; // Increased to 20 to prevent truncation
    const skip = (page - 1) * limit;
    
    const { search, status, time } = req.query;
    let query = { user: req.user._id };

    // Status Filter
    if (status && status !== 'all') {
      if (status === 'processing') query.status = { $in: ['Processing', 'Shipped', 'In Transit'] };
      else if (status === 'delivered') query.status = 'Delivered';
      else if (status === 'cancelled') query.status = { $regex: /^cancelled$/i }; // Case-insensitive to catch 'Cancelled' or 'CANCELLED'
      else if (status === 'returned') query.returnStatus = { $in: ['Requested', 'Approved', 'Refunded', 'Rejected'] };
    }

    // Time Filter
    if (time && time !== 'all') {
      const now = new Date();
      if (time === '30days') {
        query.createdAt = { $gte: new Date(now.setDate(now.getDate() - 30)) };
      } else if (time === '6months') {
        query.createdAt = { $gte: new Date(now.setMonth(now.getMonth() - 6)) };
      } else if (time === '2024') {
        query.createdAt = { $gte: new Date('2024-01-01'), $lte: new Date('2024-12-31') };
      } else if (time === '2023') {
        query.createdAt = { $gte: new Date('2023-01-01'), $lte: new Date('2023-12-31') };
      }
    }

    // Search Filter (by Order ID, CF Order ID, or Product Name)
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      const orConditions = [{ 'orderItems.name': searchRegex }];
      
      // If valid MongoDB ObjectId
      if (/^[0-9a-fA-F]{24}$/.test(search.trim())) {
        orConditions.push({ _id: search.trim() });
      } else {
        // Fallback for Cashfree or Custom IDs
        orConditions.push({ cfOrderId: searchRegex });
      }
      
      query.$or = orConditions;
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit).lean();

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
export const getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({}).populate('user', 'id username email isEmailVerified fullName').lean();
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

// @desc    Manually send invoice email
// @route   POST /api/orders/:id/email-invoice
// @access  Private
export const sendOrderInvoiceEmail = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'username email isEmailVerified fullName');
    
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to access this invoice');
    }

    const recipientEmail = order.user?.email || req.user?.email;
    if (!recipientEmail) {
      res.status(400);
      throw new Error('Customer does not have an email address on file');
    }

    const sent = await sendInvoiceEmail(order, { ...order.user?.toObject?.() || order.user, email: recipientEmail });
    if (sent) {
      res.json({ message: `Tax invoice sent successfully to ${recipientEmail}` });
    } else {
      res.status(500);
      throw new Error('Failed to send invoice email');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk Export Orders to CSV (Delhivery / BlueDart format)
// @route   POST /api/orders/bulk-export
// @access  Private/Admin
export const exportOrdersBulk = async (req, res, next) => {
 try {
  if (!req.user?.isAdmin && req.user?.role !== 'admin') { res.status(403); throw new Error('Admin required'); }
  const ids = req.body.orderIds;
  if (!Array.isArray(ids) || !ids.length || ids.length > 250 || ids.some(id => typeof id !== 'string' || !/^[a-f\d]{24}$/i.test(id))) { res.status(400); throw new Error('Provide up to 250 valid order IDs'); }
  const orders = await Order.find({ _id: { $in: ids } }).limit(250).populate('user', 'username email');
  const rows = [['Order ID','Customer','Email','Address','City','Postal Code','Total','Payment','Status'], ...orders.map(o => [String(o._id), o.shippingAddress?.fullName, o.user?.email, o.shippingAddress?.address, o.shippingAddress?.city, o.shippingAddress?.postalCode, o.totalPrice, o.paymentMethod, o.status])];
  res.header('Content-Type','text/csv'); res.attachment('orders.csv'); return res.send(csvRows(rows));
 } catch (error) { next(error); }
};
export const updateOrderStatus = async (req, res, next) => {
  if (req.body.cashCollected === true) { try { if (!req.user.isAdmin && req.user.role !== 'admin') { res.status(403); throw new Error('Admin required'); } return res.json(await recordCashCollection(req.params.id, req.body.collectedAmount)); } catch (error) { return next(error); } }
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }
    
    if (req.body.status && req.body.status !== order.status) {
      const newStatus = req.body.status;

      // ── ORDER STATE MACHINE ──
      // Define which transitions are legally allowed
      const allowedTransitions = {
        'Pending':          [],
        'Placed': ['Processing', 'Packed', 'Shipped'],
        'Processing':       ['Packed'],
        'Packed':           ['Shipped'],
        'Shipped':          ['In Transit'],
        'In Transit':       ['Out for Delivery'],
        'Out for Delivery': ['Delivered'],
        'Delivered':        [], // Terminal state — no further transitions
        'Cancelled':        [], // Terminal state — no further transitions
      };

      const allowed = allowedTransitions[order.status];
      if (!allowed || !allowed.includes(newStatus)) {
        res.status(400);
        throw new Error(
          `Invalid status transition: '${order.status}' → '${newStatus}'. Allowed next states: [${(allowed || []).join(', ') || 'none'}]`
        );
      }

      requireFulfillable(order);
      order.status = newStatus;
      
      // Update visual tracking history
      if (!order.trackingHistory) order.trackingHistory = [];
      order.trackingHistory.push({
        status: newStatus,
        timestamp: Date.now(),
        location: req.body.location || '',
        comment: req.body.comment || `Status updated to ${newStatus}`
      });
    }
    if (req.body.courierPartner !== undefined) order.courierPartner = req.body.courierPartner;
    if (req.body.awbNumber !== undefined) order.awbNumber = req.body.awbNumber;
    if (req.body.trackingUrl !== undefined) order.trackingUrl = req.body.trackingUrl;
    if (req.body.paymentStatus !== undefined) order.paymentStatus = req.body.paymentStatus;
    if (req.body.isPaid !== undefined) throw new Error('Use payment verification or explicit COD cash collection to change payment state');

    if (order.status === 'Delivered' && !order.isDelivered) {
      order.deliveredAt = Date.now();
      order.isDelivered = true;
    }

    await order.save();
    if (order.status === 'Delivered') await creditDeliveredReferral(order._id);
    res.json(order);
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel order
// @route   POST /api/orders/:id/cancel
// @access  Private/Admin
export const cancelOrder = async (req, res, next) => {
 try { const order = await findOrder(req.params.id); if (!order) { res.status(404); throw new Error('Order unavailable'); } const result = await cancelAndRefund(order._id, { userId: req.user._id || req.user.id, admin: req.user.isAdmin === true || req.user.role === 'admin', reason: String(req.body.reason || req.body.cancellationReason || 'Cancelled').slice(0, 1000) }); return res.json({ success: true, order: result }); }
 catch (error) { next(error); }
};

export const userCancelOrder = async (req, res, next) => {
 try { const order = await findOrder(req.params.id); if (!order) { res.status(404); throw new Error('Order unavailable'); } const result = await cancelAndRefund(order._id, { userId: req.user._id || req.user.id, admin: req.user.isAdmin === true || req.user.role === 'admin', reason: String(req.body.reason || req.body.cancellationReason || 'Cancelled').slice(0, 1000) }); return res.json({ success: true, order: result }); }
 catch (error) { next(error); }
};

export const updateOrderShippingAddress = async (req, res, next) => {
  try {
    const { fullName, address, city, postalCode, country, phone } = req.body;
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to update this order');
    }

    const nonEditableStatuses = ['Shipped', 'In Transit', 'Out for Delivery', 'Delivered', 'Cancelled'];
    if (nonEditableStatuses.includes(order.status)) {
      res.status(400);
      throw new Error(`Shipping address cannot be changed because the order is already '${order.status}'`);
    }

    if (postalCode && !/^[1-9][0-9]{5}$/.test(String(postalCode).trim())) {
      res.status(400);
      throw new Error('Please enter a valid 6-digit Indian postal PIN code');
    }

    order.shippingAddress = {
      fullName: fullName || order.shippingAddress.fullName,
      address: address || order.shippingAddress.address,
      city: city || order.shippingAddress.city,
      postalCode: postalCode || order.shippingAddress.postalCode,
      country: country || order.shippingAddress.country || 'India',
      ...(phone ? { phone } : {})
    };

    if (!order.trackingHistory) order.trackingHistory = [];
    order.trackingHistory.push({
      status: order.status,
      timestamp: Date.now(),
      comment: `Delivery Address updated to PIN ${order.shippingAddress.postalCode}, ${order.shippingAddress.city}`
    });

    await order.save();
    res.json({ message: 'Shipping address updated successfully', order });
  } catch (error) {
    next(error);
  }
};

// @desc    Convert COD order to Prepaid with ₹50 discount / AB Coins cashback
// @route   POST /api/orders/:id/convert-to-prepaid
// @access  Private
export const convertCodToPrepaid = async (req, res, next) => {
 try { const order = await findOrder(req.params.id); if (!order || String(order.user) !== String(req.user._id || req.user.id) && !req.user.isAdmin && req.user.role !== 'admin') { res.status(403); throw new Error('Order unavailable'); } return res.json(await startConversion(order)); }
 catch (error) { next(error); }
};

export const processExchangeRequest = async (req, res, next) => {
  try {
    const { requestedSize, reason } = req.body;
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized');
    }

    if (order.status !== 'Delivered') {
      res.status(400);
      throw new Error('Exchange requests can only be placed for delivered orders');
    }

    if (!requestedSize) {
      res.status(400);
      throw new Error('Please specify the requested replacement size/variant');
    }

    order.exchangeStatus = 'Requested';
    order.exchangeSize = requestedSize;
    order.exchangeReason = reason || 'Size mismatch';
    
    if (!order.trackingHistory) order.trackingHistory = [];
    order.trackingHistory.push({
      status: 'Exchange Requested',
      timestamp: Date.now(),
      comment: `Replacement size '${requestedSize}' requested. Pickup will be scheduled within 24-48 hrs.`
    });

    await order.save();
    res.json({ message: `Exchange request for size ${requestedSize} submitted successfully!`, order });
  } catch (error) {
    next(error);
  }
};

// @desc    Update delivery slot & doorstep preferences
// @route   POST /api/orders/:id/delivery-instructions
// @access  Private
export const updateDeliveryInstructions = async (req, res, next) => {
  try {
    const { slot, instructions } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to modify this order');
    }

    if (order.status === 'Delivered' || order.status === 'Cancelled' || order.status === 'CANCELLED') {
      res.status(400);
      throw new Error('Delivery preferences can only be updated for active in-progress shipments');
    }

    order.deliverySlot = {
      slot: slot || 'Anytime (9 AM - 9 PM)',
      instructions: instructions || ''
    };

    if (!order.trackingHistory) order.trackingHistory = [];
    order.trackingHistory.push({
      status: order.status,
      timestamp: Date.now(),
      comment: `Delivery preferences updated: ${slot || 'Anytime'}. Instructions: ${instructions || 'None'}`
    });

    await order.save();
    res.json({ message: 'Delivery instructions updated successfully!', order });
  } catch (error) {
    next(error);
  }
};

// @desc    Process a Return/RMA request
// @route   POST /api/orders/:id/return
// @access  Private
export const processReturnRequest = async (req, res, next) => {
  try {
    const { reason, refundDestination } = req.body;
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized');
    }

    if (order.status !== 'Delivered') {
      res.status(400);
      throw new Error('Returns are only available for delivered orders');
    }

    order.returnStatus = 'Requested';
    order.returnReason = reason || 'No reason provided';
    
    if (refundDestination) {
      order.refundDestination = {
        type: refundDestination.type || 'Wallet',
        upiId: refundDestination.upiId || '',
        bankAccount: refundDestination.bankAccount || ''
      };
    }
    
    if (!order.trackingHistory) order.trackingHistory = [];
    order.trackingHistory.push({
      status: 'Return Requested',
      timestamp: Date.now(),
      comment: `Return requested. Reason: ${reason || 'No reason provided'}. Refund mode: ${refundDestination?.type || 'Bank/Wallet'}. Doorstep pickup initiated.`
    });

    await order.save();
    res.json({ message: 'Return request submitted successfully. Doorstep pickup scheduled.', returnStatus: order.returnStatus, order });
  } catch (error) {
    next(error);
  }
};

// @desc    Ship order (Admin only)
// @route   POST /api/orders/:id/ship
// @access  Private/Admin
export const shipOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    if (order.status === 'Shipped' || order.status === 'Delivered') {
      res.status(400);
      throw new Error('Order is already shipped or delivered');
    }

    if (order.status === 'Cancelled') {
      res.status(400);
      throw new Error('Cannot ship a cancelled order');
    }

    requireFulfillable(order);
    // Call Shiprocket Service only after payment and lifecycle validation.
    const shipmentResult = await generateShipmentAWB(order);
    
    if (shipmentResult.success) {
      order.status = 'Shipped';
      order.awbNumber = shipmentResult.awb_code;
      order.courierPartner = shipmentResult.courier_name;
      // You can add a tracking url based on courier
      order.trackingUrl = `https://track.shiprocket.com/${shipmentResult.awb_code}`;
      
      await order.save();
      
      res.json({
        message: 'Order shipped successfully',
        awb: order.awbNumber,
        courier: order.courierPartner,
        trackingUrl: order.trackingUrl
      });
    } else {
      res.status(500);
      throw new Error('Failed to generate AWB with shipping provider');
    }
  } catch (error) {
    next(error);
  }
};
