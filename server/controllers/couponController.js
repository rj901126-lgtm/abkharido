import Coupon from '../models/Coupon.js';

// @desc    Get all coupons
// @route   GET /api/v2/coupons
// @access  Private/Admin
export const getCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find({});
    res.json(coupons);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a coupon
// @route   POST /api/v2/coupons
// @access  Private/Admin
export const createCoupon = async (req, res, next) => {
  try {
    const { code, discountType, discountValue, minCartValue, maxDiscount, expiryDate, usageLimit } = req.body;
    
    const couponExists = await Coupon.findOne({ code: code.toUpperCase() });
    if (couponExists) {
      res.status(400);
      throw new Error('Coupon code already exists');
    }

    const coupon = await Coupon.create({
      code,
      discountType,
      discountValue,
      minCartValue,
      maxDiscount,
      expiryDate,
      usageLimit
    });

    res.status(201).json(coupon);
  } catch (error) {
    next(error);
  }
};

// @desc    Validate a coupon during checkout
// @route   POST /api/v2/coupons/validate
// @access  Public
export const validateCoupon = async (req, res, next) => {
  try {
    const { code, cartValue } = req.body;
    
    if (!code) {
      res.status(400);
      throw new Error('Please provide a coupon code');
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    
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

    if (cartValue < coupon.minCartValue) {
      res.status(400);
      throw new Error(`Minimum cart value of ₹${coupon.minCartValue} required for this coupon`);
    }

    let discountAmount = 0;
    if (coupon.discountType === 'FLAT') {
      discountAmount = coupon.discountValue;
    } else if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = (cartValue * coupon.discountValue) / 100;
      if (coupon.maxDiscount > 0 && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    }

    res.json({
      success: true,
      couponCode: coupon.code,
      discountAmount: Math.floor(discountAmount)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a coupon
// @route   DELETE /api/v2/coupons/:id
// @access  Private/Admin
export const deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (coupon) {
      await Coupon.deleteOne({ _id: req.params.id });
      res.json({ message: 'Coupon removed' });
    } else {
      res.status(404);
      throw new Error('Coupon not found');
    }
  } catch (error) {
    next(error);
  }
};
