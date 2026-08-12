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
  let deductedStockTracker = [];
  let appliedCouponRecord = null;
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

    // ── IDEMPOTENCY GUARD (Bug 1: Double-Click / Double-Submit) ──
    // If the frontend sends the same cfOrderId twice (double-click, network retry),
    // return the already-created order instead of creating a duplicate.
    if (cfOrderId) {
      const existingOrder = await Order.findOne({ cfOrderId });
      if (existingOrder) {
        console.warn(`[IDEMPOTENCY] Order already exists for cfOrderId: ${cfOrderId}. Returning existing.`);
        return res.status(200).json(existingOrder);
      }
    }

    // Map frontend cart array to backend orderItems schema and SECURELY fetch prices
    const orderItems = await Promise.all(validCart.map(async (item) => {
      const productObj = typeof item.product === 'object' ? item.product : {};
      
      let mongoId = (productObj._id || '').toString();
      let customId = (productObj.id || '').toString();
      
      let pId = (mongoId.length === 24 && /^[0-9a-fA-F]{24}$/.test(mongoId))
        ? mongoId
        : (customId.length === 24 && /^[0-9a-fA-F]{24}$/.test(customId) ? customId : 'custom');

      // Securely fetch the actual price from the database
      let query = pId !== 'custom' ? { _id: pId } : { id: customId };
      const dbProduct = await Product.findOne(query).lean();

      if (!dbProduct) {
        console.log(`Auto-creating missing mock product for checkout: ${productObj.name || customId}`);
        try {
          const newMockProduct = await Product.create({
            id: customId || `mock-${Date.now()}`,
            name: productObj.name || 'Demo Product',
            category: productObj.category || 'Electronics',
            description: 'This is an auto-generated demo product for testing purposes.',
            price: productObj.price || 999,
            originalPrice: productObj.originalPrice || (productObj.price ? productObj.price * 1.5 : 1499),
            inStock: true,
            stock: 100,
            image: productObj.image || 'https://via.placeholder.com/150'
          });
          dbProduct = newMockProduct.toObject();
        } catch (createErr) {
          throw new Error(`Failed to auto-create mock product: ${productObj.name || customId}. ${createErr.message}`);
        }
      }

      // Check for active flash sale
      const actualPrice = (dbProduct.flashSale && dbProduct.flashSale.isActive && dbProduct.flashSale.price > 0)
        ? dbProduct.flashSale.price
        : dbProduct.price;

      return {
        product: dbProduct._id,
        customId: customId,
        name: dbProduct.name,
        image: dbProduct.image || (dbProduct.images && dbProduct.images[0]) || 'https://via.placeholder.com/150',
        price: actualPrice,
        qty: Math.max(1, parseInt(item.quantity, 10) || 1)
      };
    }));

    const round2 = (num) => Math.round(num * 100) / 100;

    // Calculate Prices dynamically to MATCH FRONTEND (Checkout.jsx / CartPage.jsx)
    const itemsPrice = round2(orderItems.reduce((acc, item) => acc + item.price * item.qty, 0));
    const shippingPrice = itemsPrice > 500 ? 0 : 40; // Matched with frontend's 40
    const taxPrice = 0; // Frontend does not calculate or charge tax
    let totalPrice = round2(itemsPrice + shippingPrice + taxPrice);
    
    let coinsUsedAmount = 0;
    const currentUserForCoins = await User.findById(req.user._id).select('walletCoins');
    if (useCoinsDiscount && currentUserForCoins) {
       const userCoins = currentUserForCoins.walletCoins || 0;
       coinsUsedAmount = Math.min(userCoins, itemsPrice);
       totalPrice = round2(Math.max(0, totalPrice - coinsUsedAmount)); 
    }

    // ── ATOMIC COUPON CLAIM (TOCTOU Race Condition Fix) ──
    // The old pattern was: findOne (READ) → validate → later updateOne (WRITE).
    // This is a classic TOCTOU bug. If 3 tabs submit simultaneously, all 3 read
    // usedCount=0 at the same time, all 3 pass validation, and all 3 get the discount.
    //
    // The fix: combine the READ + all condition checks + the WRITE into ONE atomic
    // MongoDB operation. MongoDB processes findOneAndUpdate as a single document-level
    // lock. Only ONE of the 3 concurrent requests can win — the others get null.
    let discountAmount = 0;
    if (couponCode) {
      const now = new Date();
      const claimedCoupon = await Coupon.findOneAndUpdate(
        {
          // All validation conditions embedded directly in the query filter:
          code: couponCode.toUpperCase(),
          isActive: true,
          expiryDate: { $gt: now },                  // Not expired
          usedBy: { $not: { $elemMatch: { $eq: req.user._id } } }, // Not already used by THIS user
          $expr: { $lt: ['$usedCount', '$usageLimit'] } // Under global usage limit
        },
        {
          // Atomically claim it in the same operation — no separate updateOne needed later
          $push: { usedBy: req.user._id },
          $inc: { usedCount: 1 }
        },
        { new: true } // Return updated document to calculate discount from
      );

      if (!claimedCoupon) {
        // Could not claim — determine why for a helpful error message
        const couponCheck = await Coupon.findOne({ code: couponCode.toUpperCase() }).lean();
        if (!couponCheck) {
          res.status(404);
          throw new Error('Invalid coupon code');
        }
        if (!couponCheck.isActive) {
          res.status(400);
          throw new Error('This coupon is no longer active');
        }
        if (new Date() > new Date(couponCheck.expiryDate)) {
          res.status(400);
          throw new Error('This coupon has expired');
        }
        if (couponCheck.usedBy && couponCheck.usedBy.map(id => id.toString()).includes(req.user._id.toString())) {
          res.status(400);
          throw new Error('You have already used this coupon');
        }
        if (couponCheck.usedCount >= couponCheck.usageLimit) {
          res.status(400);
          throw new Error('This coupon usage limit has been reached. Try another code.');
        }
        res.status(400);
        throw new Error('Coupon could not be applied. Please try again.');
      }

      if (itemsPrice < claimedCoupon.minCartValue) {
        // Rollback the claim — cart value doesn't meet minimum
        await Coupon.updateOne(
          { _id: claimedCoupon._id },
          { $pull: { usedBy: req.user._id }, $inc: { usedCount: -1 } }
        );
        res.status(400);
        throw new Error(`Minimum cart value of ₹${claimedCoupon.minCartValue} required for this coupon`);
      }

      if (claimedCoupon.discountType === 'FLAT') {
        discountAmount = claimedCoupon.discountValue;
      } else if (claimedCoupon.discountType === 'PERCENTAGE') {
        discountAmount = round2((itemsPrice * claimedCoupon.discountValue) / 100);
        if (claimedCoupon.maxDiscount > 0 && discountAmount > claimedCoupon.maxDiscount) {
          discountAmount = claimedCoupon.maxDiscount;
        }
      }

      totalPrice = round2(Math.max(0, totalPrice - discountAmount));
      appliedCouponRecord = claimedCoupon;
    }
    
    let totalPlatformFee = 0;
      
      // Calculate Enterprise Finance splits & Deduct Stock
      const enrichedOrderItems = [];
      for (const item of orderItems) {
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
          enrichedOrderItems.push(item);
          continue;
        }
        
        if (!product.inStock) {
          res.status(400);
          throw new Error(`Item is currently out of stock: ${product.name}`);
        }

        // Atomic Inventory Deduction (Concurrency Safe)
        if (product.stock > 0) {
          const updatedProduct = await Product.findOneAndUpdate(
            { _id: product._id, stock: { $gte: item.qty } },
            { 
              $inc: { stock: -item.qty, soldCount: item.qty }
            },
            { new: true }
          );

          if (!updatedProduct) {
            res.status(400);
            throw new Error(`Item out of stock due to high demand: ${product.name}. Requested: ${item.qty}`);
          }
          
          // Track successfully deducted stock for potential rollback
          deductedStockTracker.push({ productId: product._id, qty: item.qty });
          
          if (updatedProduct.stock <= 0) {
             await Product.updateOne({ _id: updatedProduct._id }, { inStock: false });
          }
        } else {
          // If no strict stock tracking is enforced, just increment soldCount
          await Product.updateOne({ _id: product._id }, { $inc: { soldCount: item.qty } });
        }

        if (product.vendorId) {
          const itemTotal = round2(item.price * item.qty);
          const platformCut = round2(itemTotal * 0.10); // 10% Enterprise Platform Fee
          const vendorCut = round2(itemTotal - platformCut);
          
          totalPlatformFee = round2(totalPlatformFee + platformCut);
          
          enrichedOrderItems.push({
            ...item,
            vendorId: product.vendorId,
            vendorAmount: vendorCut,
            platformFee: platformCut
          });
          continue;
        }
        enrichedOrderItems.push(item);
      }

      // Map frontend shipping address to backend schema requirements
      const mappedShippingAddress = {
        fullName: shippingAddress.fullName || shippingAddress.name || 'Customer',
        address: shippingAddress.address || shippingAddress.streetAddress || 'Not Provided',
        city: shippingAddress.city || 'Not Provided',
        postalCode: shippingAddress.postalCode || shippingAddress.pincode || '000000',
        country: shippingAddress.country || 'India'
      };

      // Set payment expiry: 15 minutes for online payments, null for COD.
      // The releaseExpiredOrderStock cron uses this to find and release stale Pending orders.
      const PAYMENT_TTL_MS = 15 * 60 * 1000; // 15 minutes
      const isCOD = paymentMethod && paymentMethod.toLowerCase().includes('cod');
      const paymentExpiresAt = isCOD ? null : new Date(Date.now() + PAYMENT_TTL_MS);

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
        cfOrderId,
        paymentExpiresAt,
        trackingHistory: [{
          status: 'Placed',
          timestamp: Date.now(),
          comment: 'Order placed successfully'
        }]
      });

      // Handle Referral Rewards
      if (req.body.activeReferral && req.body.activeReferral.referrerId && typeof req.body.activeReferral.referrerId === 'string') {
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
      
      // NOTE: Coupon usage is already claimed atomically BEFORE order.save() via
      // findOneAndUpdate in the TOCTOU-safe flow above. No second update needed here.
      
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
        // Bug Fix: Prevent E11000 dup key errors on sparse encrypted fields
        // 1. Manually clean the database to bypass mongoose-field-encryption re-encryption bugs
        let unsetQuery = {};
        if (user.email === '') {
          unsetQuery.email = "";
          unsetQuery.__enc_email = "";
          user.email = undefined;
          profileUpdated = true;
        }
        if (user.phone === '') {
          unsetQuery.phone = "";
          unsetQuery.__enc_phone = "";
          user.phone = undefined;
          profileUpdated = true;
        }
        
        if (Object.keys(unsetQuery).length > 0) {
          await mongoose.connection.db.collection('users').updateOne(
            { _id: user._id },
            { $unset: unsetQuery }
          );
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

      // ── ATOMIC CART CLEAR & COIN DEDUCTION ──
      // Clear the server-side cart ONLY after the order is fully confirmed in the DB.
      // Also deduct any coins that were used in this order.
      await User.updateOne(
        { _id: req.user._id },
        { 
          $set: { cart: [], cartUpdatedAt: new Date() },
          $inc: { walletCoins: -coinsUsedAmount }
        }
      );

      res.status(201).json(createdOrder);
  } catch (error) {
    // ── TWO-PHASE COMMIT ROLLBACK ──
    // If order fails (e.g. out of stock halfway through), restore any previously deducted stock
    if (deductedStockTracker.length > 0) {
      try {
        for (const item of deductedStockTracker) {
          const restored = await Product.findOneAndUpdate(
            { _id: item.productId },
            { $inc: { stock: item.qty, soldCount: -item.qty } },
            { new: true }
          );
          if (restored && restored.stock > 0 && !restored.inStock) {
             await Product.updateOne({ _id: restored._id }, { inStock: true });
          }
        }
      } catch (rollbackError) {
        console.error('CRITICAL: Failed to rollback stock during checkout failure!', rollbackError);
      }
    }

    // ── COUPON ROLLBACK ──
    // If the coupon was atomically claimed but order creation subsequently failed
    // (e.g. stock ran out after coupon claim), release the coupon claim so the
    // user is not permanently locked out of their own coupon.
    if (appliedCouponRecord && appliedCouponRecord._id) {
      try {
        await Coupon.updateOne(
          { _id: appliedCouponRecord._id },
          { $pull: { usedBy: req.user._id }, $inc: { usedCount: -1 } }
        );
      } catch (couponRollbackError) {
        console.error('CRITICAL: Failed to rollback coupon claim during checkout failure!', couponRollbackError);
      }
    }

    if (!res.headersSent) {
      res.status(400).json({ error: error.message || 'Checkout failed due to an internal error' });
    }
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
      // Ensure the user owns the order, unless they are a privileged admin role
      if (order.user._id.toString() !== req.user._id.toString() && !['admin', 'super_admin', 'support_agent'].includes(req.user.role)) {
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

    const orders = await Order.find({ _id: { $in: orderIds } }).populate('user', 'username email').lean();
    
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
    
    if (req.body.status && req.body.status !== order.status) {
      const newStatus = req.body.status;

      // ── ORDER STATE MACHINE ──
      // Define which transitions are legally allowed
      const allowedTransitions = {
        'Pending':          ['Processing', 'Cancelled'],
        'Processing':       ['Packed', 'Cancelled'],
        'Packed':           ['Shipped', 'Cancelled'],
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
    if (req.body.isPaid !== undefined) order.isPaid = req.body.isPaid;

    if (order.status === 'Delivered' && !order.isDelivered) {
      order.deliveredAt = Date.now();
      order.isDelivered = true;
    }

    // Secure Referral System: Credit coins ONLY when order is successfully delivered
    if (order.status === 'Delivered' && order.referralApplied && order.referralApplied.referrerId && !order.referralApplied.isCredited) {
      const referrerUser = await User.findOne({ username: order.referralApplied.referrerId });
      
      if (referrerUser) {
        // Prevent Self-Referral: The buyer cannot be the referrer
        const isSelfReferral = referrerUser._id.toString() === order.user.toString();
        
        // Prevent Infinite Farming: Limit to 10 successful referrals per user
        const currentReferrals = referrerUser.referralCount || 0;
        const hasReachedLimit = currentReferrals >= 10;

        if (!isSelfReferral && !hasReachedLimit) {
          referrerUser.walletCoins = (referrerUser.walletCoins || 0) + order.referralApplied.rewardAmount;
          referrerUser.referralCount = currentReferrals + 1;
          await referrerUser.save();
          order.referralApplied.isCredited = true;
        } else {
          // Mark as credited anyway so we don't keep retrying on every save
          order.referralApplied.isCredited = true; 
        }
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
    const order = await Order.findOneAndUpdate(
      { 
        _id: req.params.id, 
        status: { $nin: ['Cancelled', 'Shipped', 'Delivered', 'In Transit'] } 
      },
      { status: 'Cancelled' },
      { new: true } // Returns the document AFTER update
    );

    if (!order) {
      // If we didn't find the order, it means it either doesn't exist OR it was already in a terminal/shipped state.
      // Let's do a fallback check just to give a good error message.
      const fallbackCheck = await Order.findById(req.params.id);
      if (!fallbackCheck) {
        res.status(404);
        throw new Error('Order not found');
      }
      res.status(400);
      throw new Error(`Order cannot be cancelled because its current status is '${fallbackCheck.status}'`);
    }
    
    // Status is now securely 'Cancelled' in the database (atomically). We can proceed with refunds.

    // 1. Restore Stock Atomically
    for (const item of order.orderItems) {
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: item.product },
        { 
          $inc: { stock: item.qty, soldCount: -item.qty } 
        },
        { new: true }
      );
      if (updatedProduct && updatedProduct.stock > 0 && !updatedProduct.inStock) {
        await Product.updateOne({ _id: updatedProduct._id }, { inStock: true });
      }
    }

    // 2. Restore Coupon Atomically
    if (order.appliedCoupon) {
      await Coupon.updateOne(
        { code: order.appliedCoupon },
        { 
          $pull: { usedBy: order.user },
          $inc: { usedCount: -1 }
        }
      );
    }

    // 3. Refund Coins and Cash Atomically
    let coinsRefund = 0;
    let cashRefund = 0;
    
    if (order.coinsUsed && order.coinsUsed > 0) {
      coinsRefund = order.coinsUsed;
    }
    
    if (order.isPaid) {
      const amountPaid = order.totalPrice;
      let bankRefundSuccess = false;
      if (order.cfOrderId) {
        bankRefundSuccess = await processCashfreeRefund(order.cfOrderId, amountPaid);
      }
      if (!bankRefundSuccess) {
        cashRefund = amountPaid;
      }
    }
    
    if (coinsRefund > 0 || cashRefund > 0) {
       const incObj = {};
       if (coinsRefund > 0) incObj.walletCoins = coinsRefund;
       if (cashRefund > 0) incObj.walletCash = cashRefund;
       await User.updateOne({ _id: order.user }, { $inc: incObj });
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
    // Atomically cancel order ONLY if it belongs to the user and isn't already shipped/cancelled
    const order = await Order.findOneAndUpdate(
      { 
        _id: req.params.id, 
        user: req.user._id,
        status: { $nin: ['Cancelled', 'Shipped', 'Delivered', 'In Transit', 'Out for Delivery'] } 
      },
      { status: 'Cancelled' },
      { new: true }
    );

    if (!order) {
      // Provide a good fallback error message
      const fallbackCheck = await Order.findById(req.params.id);
      if (!fallbackCheck) {
        res.status(404);
        throw new Error('Order not found');
      }
      if (fallbackCheck.user.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to cancel this order');
      }
      res.status(400);
      throw new Error(`Order cannot be cancelled (current status: '${fallbackCheck.status}')`);
    }
    
    // Status is securely 'Cancelled'. Proceed with refunds.

    // 1. Restore Stock Atomically
    for (const item of order.orderItems) {
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: item.product },
        { 
          $inc: { stock: item.qty, soldCount: -item.qty } 
        },
        { new: true }
      );
      if (updatedProduct && updatedProduct.stock > 0 && !updatedProduct.inStock) {
        await Product.updateOne({ _id: updatedProduct._id }, { inStock: true });
      }
    }

    // 2. Restore Coupon Atomically
    if (order.appliedCoupon) {
      await Coupon.updateOne(
        { code: order.appliedCoupon },
        { 
          $pull: { usedBy: order.user },
          $inc: { usedCount: -1 }
        }
      );
    }

    // 3. Refund Coins and Cash Atomically
    let coinsRefund = 0;
    let cashRefund = 0;
    
    if (order.coinsUsed && order.coinsUsed > 0) {
      coinsRefund = order.coinsUsed;
    }
    
    if (order.isPaid) {
      const amountPaid = order.totalPrice;
      let bankRefundSuccess = false;
      if (order.cfOrderId) {
        bankRefundSuccess = await processCashfreeRefund(order.cfOrderId, amountPaid);
      }
      if (!bankRefundSuccess) {
        cashRefund = amountPaid;
      }
    }
    
    if (coinsRefund > 0 || cashRefund > 0) {
       const incObj = {};
       if (coinsRefund > 0) incObj.walletCoins = coinsRefund;
       if (cashRefund > 0) incObj.walletCash = cashRefund;
       await User.updateOne({ _id: order.user }, { $inc: incObj });
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
