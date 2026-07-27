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
  try {
    const {
      cart,
      shippingAddress,
      paymentMethod,
      useCoinsDiscount,
      cfOrderId,
      couponCode
    } = req.body;

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      res.status(400);
      throw new Error('No valid order items found');
    }

    // We allow all items, but we need to sanitize the product ID for Mongoose
    const validCart = cart.filter(item => {
      if (!item || !item.product) return false;
      return true; // Accept all items, even mock ones like "p1"
    });

    if (validCart.length === 0) {
      res.status(400);
      throw new Error('No valid order items found after filtering');
    }

    // Map frontend cart array to backend orderItems schema
    // Store both MongoDB _id (if valid) and custom string id for lookup
    const orderItems = validCart.map(item => {
      const productObj = typeof item.product === 'object' ? item.product : {};
      // MongoDB ObjectId is in _id, custom slug id is in id field
      let mongoId = (productObj._id || '').toString();
      let customId = (productObj.id || '').toString();
      // Use mongoId if valid ObjectId, else use customId for lookup later
      let pId = (mongoId.length === 24 && /^[0-9a-fA-F]{24}$/.test(mongoId))
        ? mongoId
        : (customId.length === 24 && /^[0-9a-fA-F]{24}$/.test(customId) ? customId : 'custom');
      return {
        product: pId,
        customId: customId, // keep slug for fallback lookup
        name: productObj.name || 'Unknown Product',
        image: productObj.image || (productObj.images && productObj.images[0]) || 'https://via.placeholder.com/150',
        price: productObj.price || 0,
        qty: item.quantity || 1
      };
    });

    // Calculate Prices dynamically
    const itemsPrice = orderItems.reduce((acc, item) => acc + item.price * item.qty, 0);
    const shippingPrice = itemsPrice > 500 ? 0 : 50; 
    const taxPrice = Number((0.18 * itemsPrice).toFixed(2));
    let totalPrice = itemsPrice + shippingPrice + taxPrice;
    
    let coinsUsedAmount = 0;
    if (useCoinsDiscount) {
       coinsUsedAmount = 50;
       totalPrice = Math.max(0, totalPrice - coinsUsedAmount); 
    }

    // Secure Coupon Application
    let appliedCouponRecord = null;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (!coupon) {
        res.status(404);
        throw new Error('Invalid or inactive coupon code');
      }
      if (coupon.usedBy && coupon.usedBy.includes(req.user._id)) {
        res.status(400);
        throw new Error('You have already used this coupon');
      }
      if (new Date() > new Date(coupon.expiryDate)) {
        res.status(400);
        throw new Error('This coupon has expired');
      }
      if (coupon.usedCount >= coupon.usageLimit) {
        res.status(400);
        throw new Error('This coupon usage limit has been reached');
      }
      if (itemsPrice < coupon.minCartValue) {
        res.status(400);
        throw new Error(`Minimum cart value of ₹${coupon.minCartValue} required for this coupon`);
      }

      let discountAmount = 0;
      if (coupon.discountType === 'FLAT') {
        discountAmount = coupon.discountValue;
      } else if (coupon.discountType === 'PERCENTAGE') {
        discountAmount = (itemsPrice * coupon.discountValue) / 100;
        if (coupon.maxDiscount > 0 && discountAmount > coupon.maxDiscount) {
          discountAmount = coupon.maxDiscount;
        }
      }
      
      totalPrice = Math.max(0, totalPrice - discountAmount);
      appliedCouponRecord = coupon;
    }
    
    let totalPlatformFee = 0;
      
      // Calculate Enterprise Finance splits & Deduct Stock
      const enrichedOrderItems = await Promise.all(orderItems.map(async (item) => {
        // Try by MongoDB _id first, then fallback to custom slug id field
        let product = null;
        if (item.product !== 'custom' && /^[0-9a-fA-F]{24}$/.test(item.product)) {
          product = await Product.findById(item.product).catch(() => null);
        }
        if (!product && item.customId) {
          product = await Product.findOne({ id: item.customId }).catch(() => null);
        }
        
        if (!product) {
          // Truly unknown / mock product — skip stock deduction, treat as plain item
          return item;
        }
        
        // Stock Verification
        // If stock tracking is configured (stock > 0), verify availability
        if (product.stock > 0 && product.stock < item.qty) {
          res.status(400);
          throw new Error(`Item out of stock: ${product.name}. Available: ${product.stock}, Requested: ${item.qty}`);
        }
        if (!product.inStock) {
          res.status(400);
          throw new Error(`Item is currently out of stock: ${product.name}`);
        }

        let lockKey = null;
        let lockAcquired = false;
        
        // Distributed Lock (Phase 5 - Concurrency)
        if (redisClient && product.stock > 0) {
           lockKey = `lock:product:${product._id}`;
           const lock = await redisClient.set(lockKey, 'locked', 'NX', 'PX', 5000); // 5 seconds lock
           if (!lock) {
              res.status(429);
              throw new Error(`High traffic for ${product.name}. Item is currently being purchased by someone else. Please try again in a few seconds.`);
           }
           lockAcquired = true;
        }
        
        try {
          // Re-fetch product inside the lock to ensure we have the absolute latest stock from DB
          // if we are under heavy concurrency
          if (lockAcquired) {
             const latestProduct = await Product.findById(product._id);
             if (latestProduct.stock < item.qty) {
                res.status(400);
                throw new Error(`Item out of stock: ${product.name}.`);
             }
             product.stock = latestProduct.stock; // Sync
          }

          // Deduct Stock only if stock tracking is configured
          if (product.stock > 0) {
            product.stock -= item.qty;
            if (product.stock <= 0) {
              product.inStock = false;
            }
          }
          product.soldCount = (product.soldCount || 0) + item.qty;
          await product.save();
        } finally {
          if (lockAcquired && lockKey) {
             await redisClient.del(lockKey);
          }
        }

        if (product.vendorId) {
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

      // Map frontend shipping address to backend schema requirements
      const mappedShippingAddress = {
        fullName: shippingAddress.fullName || shippingAddress.name || 'Customer',
        address: shippingAddress.address || shippingAddress.streetAddress || 'Not Provided',
        city: shippingAddress.city || 'Not Provided',
        postalCode: shippingAddress.postalCode || shippingAddress.pincode || '000000',
        country: shippingAddress.country || 'India'
      };

      const order = new Order({
        orderItems: enrichedOrderItems,
        user: req.user._id,
        shippingAddress: mappedShippingAddress,
        paymentMethod,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        totalPlatformFee,
        appliedCoupon: appliedCouponRecord ? appliedCouponRecord.code : undefined,
        coinsUsed: coinsUsedAmount,
        cfOrderId
      });

      // Handle Referral Rewards
      if (req.body.activeReferral && req.body.activeReferral.referrerId) {
        const referrerUser = await User.findOne({ username: req.body.activeReferral.referrerId });
        if (referrerUser && referrerUser._id.toString() !== req.user._id.toString()) {
          // Calculate reward: aggregate userCommissionRate of each product (fallback to 2%)
          let rewardCoins = 0;
          for (let item of enrichedOrderItems) {
            const prodData = await Product.findById(item.product);
            const rate = prodData?.userCommissionRate || 0.02;
            rewardCoins += Math.round(item.price * item.qty * rate);
          }
          
          if (rewardCoins > 0) {
            order.referralApplied = {
              referrerId: referrerUser.username,
              rewardAmount: rewardCoins,
              isCredited: false
            };
          }
        }
      }

      const createdOrder = await order.save();
      
      // Track coupon usage
      if (appliedCouponRecord) {
        appliedCouponRecord.usedBy.push(req.user._id);
        appliedCouponRecord.usedCount += 1;
        await appliedCouponRecord.save();
      }
      
      // Fetch user to check email verification and auto-save profile details
      const user = await User.findById(req.user._id);
      if (user) {
        let profileUpdated = false;
        if (mappedShippingAddress.fullName && user.fullName !== mappedShippingAddress.fullName) {
          user.fullName = mappedShippingAddress.fullName;
          profileUpdated = true;
        }
        if (mappedShippingAddress.address) {
          user.address = mappedShippingAddress.address;
          user.city = mappedShippingAddress.city;
          user.pincode = mappedShippingAddress.postalCode;
          user.state = mappedShippingAddress.state || '';
          profileUpdated = true;
        }
        if (profileUpdated) {
          await user.save();
        }

        if (user.isEmailVerified && user.email) {
          // Send email asynchronously without blocking the response
          sendInvoiceEmail(createdOrder, user).catch(err => console.error("Failed to send invoice:", err));
        }
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const { search, status, time } = req.query;
    let query = { user: req.user._id };

    // Status Filter
    if (status && status !== 'all') {
      if (status === 'processing') query.status = { $in: ['Processing', 'Shipped', 'In Transit'] };
      else if (status === 'delivered') query.status = 'Delivered';
      else if (status === 'cancelled') query.status = 'Cancelled';
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
      .limit(limit);

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

    if (order.status === 'Delivered') {
      order.deliveredAt = Date.now();
      order.isDelivered = true;
    }

    // Secure Referral System: Credit coins ONLY when order is successfully delivered
    if (order.status === 'Delivered' && order.referralApplied && order.referralApplied.referrerId && !order.referralApplied.isCredited) {
      const referrerUser = await User.findOne({ username: order.referralApplied.referrerId });
      if (referrerUser) {
        referrerUser.walletCoins = (referrerUser.walletCoins || 0) + order.referralApplied.rewardAmount;
        await referrerUser.save();
        order.referralApplied.isCredited = true;
      }
    }

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
    
    if (order.status === 'Cancelled') {
      res.status(400);
      throw new Error('Order is already cancelled');
    }

    order.status = 'Cancelled';
    
    // 1. Restore Stock
    for (const item of order.orderItems) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock += item.qty;
        product.inStock = product.stock > 0;
        product.soldCount = Math.max(0, (product.soldCount || 0) - item.qty);
        await product.save();
      }
    }

    // 2. Restore Coupon
    if (order.appliedCoupon) {
      const coupon = await Coupon.findOne({ code: order.appliedCoupon });
      if (coupon) {
        coupon.usedBy = coupon.usedBy.filter(userId => userId.toString() !== order.user.toString());
        coupon.usedCount = Math.max(0, coupon.usedCount - 1);
        await coupon.save();
      }
    }

    // 3. Refund Coins and Cash
    const user = await User.findById(order.user);
    if (user) {
      if (order.coinsUsed && order.coinsUsed > 0) {
        user.walletCoins = (user.walletCoins || 0) + order.coinsUsed;
      }
      
      // If paid via gateway, attempt bank refund
      if (order.isPaid) {
        const amountPaid = order.totalPrice;
        let bankRefundSuccess = false;
        
        if (order.cfOrderId) {
          bankRefundSuccess = await processCashfreeRefund(order.cfOrderId, amountPaid);
        }
        
        if (!bankRefundSuccess) {
          // Fallback to store credit if bank refund fails or missing cfOrderId
          user.walletCash = (user.walletCash || 0) + amountPaid;
        }
      }
      
      await user.save();
    }

    await order.save();
    res.json(order);
  } catch (error) {
    next(error);
  }
};

// @desc    User Cancel their own order
// @route   POST /api/orders/:id/user-cancel
// @access  Private
export const userCancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }
    if (order.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to cancel this order');
    }
    if (order.status === 'In Transit' || order.status === 'Delivered' || order.status === 'Shipped') {
      res.status(400);
      throw new Error('Cannot cancel an order that is already shipped');
    }
    if (order.status === 'Cancelled') {
      res.status(400);
      throw new Error('Order is already cancelled');
    }
    
    order.status = 'Cancelled';
    
    // 1. Restore Stock
    for (const item of order.orderItems) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock += item.qty;
        product.inStock = product.stock > 0;
        product.soldCount = Math.max(0, (product.soldCount || 0) - item.qty);
        await product.save();
      }
    }

    // 2. Restore Coupon
    if (order.appliedCoupon) {
      const coupon = await Coupon.findOne({ code: order.appliedCoupon });
      if (coupon) {
        coupon.usedBy = coupon.usedBy.filter(userId => userId.toString() !== order.user.toString());
        coupon.usedCount = Math.max(0, coupon.usedCount - 1);
        await coupon.save();
      }
    }

    // 3. Refund Coins and Cash
    const user = await User.findById(order.user);
    if (user) {
      if (order.coinsUsed && order.coinsUsed > 0) {
        user.walletCoins = (user.walletCoins || 0) + order.coinsUsed;
      }
      
      // If paid via gateway, attempt bank refund
      if (order.isPaid) {
        const amountPaid = order.totalPrice;
        let bankRefundSuccess = false;
        
        if (order.cfOrderId) {
          bankRefundSuccess = await processCashfreeRefund(order.cfOrderId, amountPaid);
        }
        
        if (!bankRefundSuccess) {
          // Fallback to store credit if bank refund fails or missing cfOrderId
          user.walletCash = (user.walletCash || 0) + amountPaid;
        }
      }
      
      await user.save();
    }

    await order.save();
    res.json(order);
  } catch (error) {
    next(error);
  }
};

// @desc    Process a Return/RMA request
// @route   POST /api/orders/:id/return
// @access  Private
export const processReturnRequest = async (req, res, next) => {
  try {
    const { reason } = req.body;
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
    
    await order.save();
    res.json({ message: 'Return request submitted successfully', returnStatus: order.returnStatus });
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

    // Call Shiprocket Service
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
