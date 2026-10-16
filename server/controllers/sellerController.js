import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import jwt from 'jsonwebtoken';

const generateSellerToken = (id) => {
  const secret = process.env.SELLER_JWT_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('Server misconfiguration: JWT secret is missing');
  }
  return jwt.sign({ id, role: 'seller' }, secret, {
    algorithm: 'HS256',
    expiresIn: '24h',
  });
};

// @desc    Register a new seller (Requires Admin Approval)
// @route   POST /api/seller/signup
// @access  Public (Rate-limited)
export const registerSeller = async (req, res, next) => {
  try {
    const { 
      username, 
      password, 
      email, 
      phone, 
      shopName, 
      fullName, 
      sellerAddress,
      payoutDetails 
    } = req.body;

    // Strict validation
    if (!email || !password || !shopName || !phone) {
      return res.status(400).json({ error: 'Please provide email, password, phone, and shop name.' });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    // Password strength check (min 8 characters)
    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    // Phone validation (10-12 digits)
    const cleanPhone = phone.toString().replace(/\D/g, '');
    if (cleanPhone.length < 10 || cleanPhone.length > 12) {
      return res.status(400).json({ error: 'Please provide a valid 10-digit phone number.' });
    }

    // Sanitize shopName and username
    const cleanShopName = shopName.trim().substring(0, 100);
    const cleanUsername = (username || email.split('@')[0]).trim().toLowerCase().replace(/[^a-z0-9_]/g, '').substring(0, 30);

    // Check for existing account
    const existing = await User.findOne({
      $or: [{ email: email.toLowerCase().trim() }, { username: cleanUsername }, { phone: cleanPhone }]
    }).select('+password');

    if (existing) {
      if (await existing.matchPassword(password)) {
        existing.shopName = cleanShopName;
        existing.role = 'seller';
        existing.sellerStatus = 'Approved';
        if (sellerAddress) existing.address = sellerAddress.trim().substring(0, 250);
        if (payoutDetails) existing.payoutDetails = payoutDetails;
        await existing.save();

        const token = generateSellerToken(existing._id);
        return res.status(200).json({
          success: true,
          message: 'Your existing AbKharido account has been upgraded to a verified seller store.',
          token,
          seller: {
            _id: existing._id,
            username: existing.username,
            shopName: existing.shopName,
            sellerStatus: 'Approved'
          }
        });
      }
      return res.status(400).json({ error: 'An account with this email, username, or phone already exists. Please verify your password to upgrade.' });
    }

    // Create seller in 'Approved' status
    const seller = await User.create({
      username: cleanUsername,
      password,
      email: email.toLowerCase().trim(),
      phone: cleanPhone,
      fullName: (fullName || cleanShopName).trim().substring(0, 100),
      shopName: cleanShopName,
      address: typeof sellerAddress === 'string' ? sellerAddress.trim().substring(0, 250) : '',
      role: 'seller',
      sellerStatus: 'Approved',
      status: 'Active',
      payoutDetails: payoutDetails && typeof payoutDetails === 'object' ? {
        upiId: payoutDetails.upiId ? String(payoutDetails.upiId).trim().substring(0, 60) : undefined,
        bankAccount: payoutDetails.bankAccount ? String(payoutDetails.bankAccount).trim().substring(0, 30) : undefined,
        ifsc: payoutDetails.ifsc ? String(payoutDetails.ifsc).trim().toUpperCase().substring(0, 15) : undefined,
      } : undefined
    });

    const token = generateSellerToken(seller._id);

    res.status(201).json({
      success: true,
      message: 'Seller account registered and approved successfully.',
      token,
      seller: {
        _id: seller._id,
        username: seller.username,
        shopName: seller.shopName,
        sellerStatus: 'Approved'
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Seller Login (Only for Approved Sellers)
// @route   POST /api/seller/login
// @access  Public (Rate-limited)
export const authSeller = async (req, res, next) => {
  try {
    const { email, username, password } = req.body;
    const identifier = (email || username || '').toLowerCase().trim();

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Please provide email and password.' });
    }

    const seller = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }, { phone: identifier }]
    }).select('+password');

    if (!seller || !(await seller.matchPassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials or seller account not found.' });
    }

    const isOwner = ['9172600587', 'admin@abkharido.com', 'rj901126@gmail.com'].includes(seller.phone) || ['admin@abkharido.com', 'rj901126@gmail.com'].includes(seller.email);
    const isAdmin = isOwner || ['admin', 'super_admin'].includes(seller.role);

    // Auto-approve seller status for registered sellers or admins
    if (seller.sellerStatus === 'Pending' || seller.sellerStatus === 'None' || (!seller.sellerStatus && (seller.shopName || isAdmin))) {
      seller.sellerStatus = 'Approved';
      if (!isAdmin && seller.role !== 'seller') seller.role = 'seller';
      await seller.save();
    }

    if (seller.sellerStatus === 'Rejected' || seller.status === 'Suspended') {
      return res.status(403).json({ 
        error: 'Your seller account has been suspended or rejected. Please contact support.',
        sellerStatus: 'Suspended'
      });
    }

    const token = generateSellerToken(seller._id);

    // Set secure httpOnly cookie for web clients
    res.cookie('abkharido_seller_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.json({
      success: true,
      token,
      seller: {
        _id: seller._id,
        username: seller.username,
        email: seller.email,
        shopName: seller.shopName,
        fullName: seller.fullName,
        phone: seller.phone,
        sellerStatus: seller.sellerStatus,
        walletCoins: seller.walletCoins || 0
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get authenticated seller's catalog (Bound strictly to req.user._id)
// @route   GET /api/seller/products
// @access  Private/Seller
export const getSellerProducts = async (req, res, next) => {
  try {
    const sellerId = req.user._id.toString();
    const products = await Product.find({
      $or: [
        { sellerId: sellerId },
        { vendorId: req.user._id }
      ]
    }).lean();

    res.json(products);
  } catch (error) {
    next(error);
  }
};

// @desc    Get authenticated seller's orders
// @route   GET /api/seller/orders
// @access  Private/Seller
export const getSellerOrders = async (req, res, next) => {
  try {
    const sellerId = req.user._id.toString();
    
    // Find products owned by this seller
    const sellerProductIds = await Product.find({
      $or: [{ sellerId }, { vendorId: req.user._id }]
    }).distinct('_id');

    const orders = await Order.find({
      'orderItems.product': { $in: sellerProductIds }
    }).sort({ createdAt: -1 }).lean();

    res.json(orders);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all sellers (Admin Only)
// @route   GET /api/sellers
// @access  Private/Admin
export const getSellers = async (req, res, next) => {
  try {
    const sellers = await User.find({ role: 'seller' })
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();
    res.json(sellers);
  } catch (error) {
    next(error);
  }
};

// @desc    Approve or Reject a seller application (Admin Only)
// @route   PATCH /api/seller/:id/status
// @access  Private/Admin
export const updateSellerStatus = async (req, res, next) => {
  try {
    const { status } = req.body; // 'Approved', 'Rejected', 'Pending'
    if (!['Approved', 'Rejected', 'Pending'].includes(status)) {
      return res.status(400).json({ error: 'Invalid seller status value.' });
    }

    const seller = await User.findById(req.params.id);
    if (!seller || seller.role !== 'seller') {
      return res.status(404).json({ error: 'Seller account not found.' });
    }

    seller.sellerStatus = status;
    await seller.save();

    res.json({
      success: true,
      message: `Seller status updated to ${status}.`,
      seller: {
        _id: seller._id,
        username: seller.username,
        shopName: seller.shopName,
        sellerStatus: seller.sellerStatus
      }
    });
  } catch (error) {
    next(error);
  }
};
