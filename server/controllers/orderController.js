import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { sendInvoiceEmail } from '../utils/emailService.js';
import { addOrderToQueue } from '../utils/queue.js';

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
export const addOrderItems = async (req, res, next) => {
  try {
    const {
      cart,
      shippingAddress,
      paymentMethod,
      useCoinsDiscount,
      cfOrderId
    } = req.body;

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      res.status(400);
      throw new Error('No valid order items found');
    }

    const validCart = cart.filter(item => {
      if (!item || !item.product) return false;
      const productId = typeof item.product === 'object' ? (item.product.id || item.product._id) : item.product;
      // Validate ObjectId length
      return productId && productId.toString().length === 24;
    });

    if (validCart.length === 0) {
      res.status(400);
      throw new Error('No valid order items found after filtering');
    }

    // Map frontend cart array to backend orderItems schema
    const orderItems = validCart.map(item => ({
      product: typeof item.product === 'object' ? (item.product.id || item.product._id) : item.product,
      name: item.product.name || 'Unknown Product',
      image: item.product.image || (item.product.images && item.product.images[0]) || '',
      price: item.product.price || 0,
      qty: item.quantity || 1
    }));

    // Calculate Prices dynamically
    const itemsPrice = orderItems.reduce((acc, item) => acc + item.price * item.qty, 0);
    const shippingPrice = itemsPrice > 500 ? 0 : 50; 
    const taxPrice = Number((0.18 * itemsPrice).toFixed(2));
    let totalPrice = itemsPrice + shippingPrice + taxPrice;
    
    if (useCoinsDiscount) {
       totalPrice = Math.max(0, totalPrice - 50); 
    }
    
    let totalPlatformFee = 0;
      
      // Calculate Enterprise Finance splits
      const enrichedOrderItems = await Promise.all(orderItems.map(async (item) => {
        const product = await Product.findById(item.product);
        if (product && product.vendorId) {
          const itemTotal = item.price * item.qty;
          const platformCut = itemTotal * 0.10; // 10% Enterprise Platform Fee
          const vendorCut = itemTotal - platformCut;
          
          totalPlatformFee += platformCut;
          
          return {
            ...item,
            vendorId: product.vendorId,
            vendorAmount: vendorCut,
            platformFee: platformCut
          };
        }
        return item;
      }));

      const order = new Order({
        orderItems: enrichedOrderItems,
        user: req.user._id,
        shippingAddress,
        paymentMethod,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        totalPlatformFee
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

// @desc    Bulk Export Orders to CSV (Delhivery / BlueDart format)
// @route   POST /api/orders/bulk-export
// @access  Private/Admin
export const exportOrdersBulk = async (req, res, next) => {
  try {
    const { orderIds } = req.body;
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      res.status(400);
      throw new Error('Please provide an array of orderIds');
    }

    const orders = await Order.find({ _id: { $in: orderIds } }).populate('user', 'username email');
    
    // Create CSV Header
    let csvStr = "Order_ID,Customer_Name,Customer_Email,Address,City,PostalCode,Country,Total_Price,Payment_Method,Status\n";

    orders.forEach(o => {
      const addr = `${o.shippingAddress.address}`.replace(/,/g, ' '); // Remove commas for CSV safety
      const city = `${o.shippingAddress.city}`.replace(/,/g, '');
      const zip = `${o.shippingAddress.postalCode}`;
      const country = `${o.shippingAddress.country}`.replace(/,/g, '');
      const name = o.user ? o.user.username : 'Guest';
      const email = o.user ? o.user.email : 'N/A';
      
      csvStr += `${o._id},${name},${email},${addr},${city},${zip},${country},${o.totalPrice},${o.paymentMethod},${o.isPaid ? 'Paid' : 'Pending'}\n`;
    });

    res.header('Content-Type', 'text/csv');
    res.attachment('bulk_shipping_manifest.csv');
    return res.send(csvStr);
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status
// @route   POST /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }
    
    order.status = req.body.status;
    await order.save();
    res.json(order);
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel order
// @route   POST /api/orders/:id/cancel
// @access  Private/Admin
export const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }
    
    order.status = 'Cancelled';
    await order.save();
    res.json(order);
  } catch (error) {
    next(error);
  }
};
