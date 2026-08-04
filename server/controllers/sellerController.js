import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'abkharido_jwt_secret_dev', {
    expiresIn: '30d',
  });
};

// @desc    Register a seller
// @route   POST /api/sellers/signup
// @access  Public
export const registerSeller = async (req, res, next) => {
  try {
    const { username, password, email, shopName, phone, fullName } = req.body;
    
    const sellerExists = await User.findOne({ $or: [{ username }, { email }] }).lean();
    if (sellerExists) {
      res.status(400);
      throw new Error('Seller already exists');
    }

    const seller = await User.create({
      username,
      password,
      email,
      shopName,
      phone,
      fullName,
      role: 'seller'
    });

    res.status(201).json({
      success: true,
      _id: seller._id,
      username: seller.username,
      role: seller.role,
      token: generateToken(seller._id),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Seller login
// @route   POST /api/sellers/login
// @access  Public
export const authSeller = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const seller = await User.findOne({ username, role: 'seller' });

    if (seller && (await seller.matchPassword(password))) {
      res.json({
        success: true,
        _id: seller._id,
        username: seller.username,
        role: seller.role,
        token: generateToken(seller._id),
      });
    } else {
      res.status(401);
      throw new Error('Invalid credentials or not a seller');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get all sellers (admin only)
// @route   GET /api/sellers
// @access  Private/Admin
export const getSellers = async (req, res, next) => {
  try {
    const sellers = await User.find({ role: 'seller' }).lean();
    res.json(sellers);
  } catch (error) {
    next(error);
  }
};
