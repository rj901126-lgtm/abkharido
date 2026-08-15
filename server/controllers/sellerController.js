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
      $or: [{ email: email.toLowerCase().trim() }, { username: cleanUsername }]
    }).lean();

    if (existing) {
      return res.status(400).json({ error: 'An account with this email or username already exists.' });
    }

    // Create seller in 'Pending' status — NO token issued on public signup!
    const seller = await User.create({
      username: cleanUsername,
      password,
      email: email.toLowerCase().trim(),
      phone: cleanPhone,
      fullName: (fullName || cleanShopName).trim().substring(0, 100),
      shopName: cleanShopName,
      address: typeof sellerAddress === 'string' ? sellerAddress.trim().substring(0, 250) : '',
      role: 'seller',
      sellerStatus: 'Pending',
      status: 'Active',
      payoutDetails: payoutDetails && typeof payoutDetails === 'object' ? {
        upiId: payoutDetails.upiId ? String(payoutDetails.upiId).trim().substring(0, 60) : undefined,
        bankAccount: payoutDetails.bankAccount ? String(payoutDetails.bankAccount).trim().substring(0, 30) : undefined,
        ifsc: payoutDetails.ifsc ? String(payoutDetails.ifsc).trim().toUpperCase().substring(0, 15) : undefined,
      } : undefined
    });

    res.status(201).json({
      success: true,
      message: 'Seller application registered successfully. Your account is pending admin verification.',
      seller: {
        _id: seller._id,
        username: seller.username,
        shopName: seller.shopName,
        sellerStatus: 'Pending'
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
      $or: [{ email: identifier }, { username: identifier }],
      role: 'seller'
    });

    if (!seller || !(await seller.matchPassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials or seller account not found.' });
    }

    // Enforce Admin Approval Requirement
    if (seller.sellerStatus === 'Pending' || seller.sellerStatus === 'None') {
      return res.status(403).json({ 
        error: 'Your seller account is currently pending admin approval. You will receive an email once verified.',
        sellerStatus: 'Pending'
      });
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
