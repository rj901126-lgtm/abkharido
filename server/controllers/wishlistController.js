import User from '../models/User.js';
import Product from '../models/Product.js';

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
    const { wishlist, merge, action, productId } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // Helper: Resolve a product slug/id to a MongoDB ObjectId string
    const resolveObjectId = async (idStr) => {
      if (!idStr) return null;
      idStr = idStr.toString();
      if (idStr.length === 24) return idStr;
      const productDoc = await Product.findOne({ id: idStr }).select('_id').lean();
      return productDoc ? productDoc._id.toString() : null;
    };

    // ── DELTA SYNC ARCHITECTURE ──
    if (action) {
      if (action === 'clear') {
        user.wishlist = [];
      } else if (action === 'toggle' && productId) {
        const resolvedId = await resolveObjectId(productId);
        if (resolvedId) {
          const existsIndex = user.wishlist.findIndex(id => id.toString() === resolvedId);
          if (existsIndex >= 0) {
            user.wishlist.splice(existsIndex, 1); // Remove
          } else {
            user.wishlist.push(resolvedId); // Add
          }
        }
      }
    } 
    // ── LEGACY FULL-SYNC & GUEST MERGE ──
    else if (Array.isArray(wishlist)) {
      const formattedWishlist = [];
      for (const item of wishlist) {
        if (!item) continue;
        const resolvedId = await resolveObjectId(item);
        if (resolvedId) formattedWishlist.push(resolvedId);
      }
      
      if (req.body.merge && user.wishlist && user.wishlist.length > 0) {
        const existingSet = new Set(user.wishlist.map(id => id.toString()));
        for (const item of formattedWishlist) {
          if (!existingSet.has(item)) {
            user.wishlist.push(item);
          }
        }
      } else {
        user.wishlist = formattedWishlist;
      }
    } else {
      res.status(400);
      throw new Error('Invalid wishlist data format or missing action');
    }
    
    await user.save();

    // Return the latest DB state (just an array of string ObjectIds/Slugs)
    // Wait, the frontend `wishlist` array is just an array of IDs!
    // But it's an array of slugs if added locally, and ObjectIds if from backend?
    // The frontend `getWishlist` endpoint currently returns what? Let's check getWishlist.
    // getWishlist populates and maps to just the `id`. 
    // Actually getWishlist does: res.json(user.wishlist.map(item => item._id));
    // Let's just return the user.wishlist as is, so the frontend receives the populated IDs.

    await user.populate('wishlist');
    const returnedWishlist = user.wishlist.map(item => item.id || item._id);

    res.json({ success: true, wishlist: returnedWishlist });
  } catch (error) {
    next(error);
  }
};
