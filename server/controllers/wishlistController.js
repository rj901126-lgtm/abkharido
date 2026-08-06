import User from '../models/User.js';

// @desc    Get logged in user's wishlist
// @route   GET /api/wishlist
// @access  Private
export const getWishlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // The frontend expects an array of product ID strings
    const formattedWishlist = user.wishlist
      .filter(item => item != null)
      .map(item => item.toString());

    res.json(formattedWishlist);
  } catch (error) {
    next(error);
  }
};

// @desc    Sync wishlist from frontend to backend
// @route   POST /api/wishlist/sync
// @access  Private
export const syncWishlist = async (req, res, next) => {
  try {
    const { wishlist } = req.body;
    
    if (!Array.isArray(wishlist)) {
      res.status(400);
      throw new Error('Invalid wishlist data format');
    }

    // Convert string array to ObjectIds if valid
    const formattedWishlist = [];
    for (const item of wishlist) {
      if (item && item.toString().length === 24) {
        formattedWishlist.push(item);
      }
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
    
    if (req.body.merge && user.wishlist && user.wishlist.length > 0) {
      // ── SMART GUEST WISHLIST MERGE ──
      const existingSet = new Set(user.wishlist.map(id => id.toString()));
      for (const item of formattedWishlist) {
        if (!existingSet.has(item.toString())) {
          user.wishlist.push(item);
        }
      }
    } else {
      user.wishlist = formattedWishlist;
    }
    
    await user.save();

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
