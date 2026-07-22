import Order from '../models/Order.js';
import User from '../models/User.js';
import { sendInvoiceEmail } from '../utils/emailService.js';
import { addOrderToQueue } from '../utils/queue.js';

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
export const addOrderItems = async (req, res, next) => {
  try {
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    } = req.body;

    if (orderItems && orderItems.length === 0) {
      res.status(400);
      throw new Error('No order items');
    } else {
      const order = new Order({
        orderItems,
        user: req.user._id,
        shippingAddress,
        paymentMethod,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
      });

      const createdOrder = await order.save();
      
      // Fetch user to check email verification
      const user = await User.findById(req.user._id);
      if (user && user.isEmailVerified && user.email) {
        // Send email asynchronously without blocking the response
        sendInvoiceEmail(createdOrder, user).catch(err => console.error("Failed to send invoice:", err));
      }

      // Add to enterprise background queue (Phase 2)
      await addOrderToQueue(createdOrder._id);

      res.status(201).json(createdOrder);
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      'user',
      'username email'
    );

    if (order) {
      // Ensure the user owns the order, unless admin
      if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
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
    const orders = await Order.find({ user: req.user._id });
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
export const getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({}).populate('user', 'id username email isEmailVerified fullName');
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

// @desc    Manually send invoice email
// @route   POST /api/orders/:id/email-invoice
// @access  Private/Admin
export const sendOrderInvoiceEmail = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'username email isEmailVerified fullName');
    
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    if (!order.user.email) {
      res.status(400);
      throw new Error('Customer does not have an email address');
    }

    // Force send it even if not verified if admin is doing it? 
    // The user requirement says "mail tabhi hoga agar customer ne mail verified kiya hai"
    // So we should enforce it even here.
    if (!order.user.isEmailVerified) {
      res.status(400);
      throw new Error('Customer email is not verified. Cannot send invoice.');
    }

    const sent = await sendInvoiceEmail(order, order.user);
    if (sent) {
      res.json({ message: 'Invoice email sent successfully' });
    } else {
      res.status(500);
      throw new Error('Failed to send invoice email');
    }
  } catch (error) {
    next(error);
  }
};
