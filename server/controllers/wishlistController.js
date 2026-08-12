import User from '../models/User.js';
import Product from '../models/Product.js';

// @desc    Get logged in user's wishlist
// @route   GET /api/wishlist
// @access  Private
export const getWishlist = async (req, res, next) => {
  try {
    console.log(`[WISHLIST GET INIT] User: ${req.user._id}`);
    const user = await User.findById(req.user._id).populate('wishlist', 'id _id');
    
    // Set headers to explicitly prevent Vercel Edge caching
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // Return product slugs (the `id` field) so frontend can match with product.id
    // If product was deleted or slug not found, fall back to ObjectId string
    const formattedWishlist = user.wishlist
      .filter(item => item != null)
      .map(item => item.id || item._id?.toString() || item.toString());

    console.log(`[WISHLIST GET SUCCESS] User: ${req.user._id} | Fetched ${formattedWishlist.length} items`);
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
    console.log(`[WISHLIST SYNC INIT] User: ${req.user._id} | Action: ${action} | Merge: ${merge}`);
    console.log(`[WISHLIST SYNC PAYLOAD]`, JSON.stringify(req.body, null, 2));

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
          console.log(`[WISHLIST SYNC ACTION] toggle | Resolved ProductId: ${resolvedId}`);
          const existsIndex = user.wishlist.findIndex(id => id.toString() === resolvedId);
          if (existsIndex >= 0) {
            user.wishlist.splice(existsIndex, 1); // Remove
            console.log(`[WISHLIST SYNC ACTION] Removed item from wishlist`);
          } else {
            user.wishlist.push(resolvedId); // Add
            console.log(`[WISHLIST SYNC ACTION] Added item to wishlist`);
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
        console.log(`[WISHLIST SYNC MERGE] Starting guest merge. Incoming Guest Items: ${formattedWishlist.length}, Current DB Items: ${user.wishlist.length}`);
        const existingSet = new Set(user.wishlist.map(id => id.toString()));
        for (const item of formattedWishlist) {
          if (!existingSet.has(item)) {
            console.log(`[WISHLIST SYNC MERGE] Adding guest item: ${item}`);
            user.wishlist.push(item);
          } else {
            console.log(`[WISHLIST SYNC MERGE] Item already in DB, skipping: ${item}`);
          }
        }
        console.log(`[WISHLIST SYNC MERGE] Merge completed. Final Wishlist Size: ${user.wishlist.length}`);
      } else {
        console.log(`[WISHLIST SYNC FULL] Replacing user wishlist with incoming array of ${formattedWishlist.length} items`);
        user.wishlist = formattedWishlist;
      }
    } else {
      res.status(400);
      throw new Error('Invalid wishlist data format or missing action');
    }
    
    await User.updateOne(
      { _id: user._id },
      { $set: { wishlist: user.wishlist } }
    );

    // Populate and return product slugs so frontend can match with product.id (slug)
    await user.populate('wishlist', 'id _id');
    const returnedWishlist = user.wishlist
      .filter(item => item != null)
      .map(item => item.id || item._id?.toString() || item.toString());

    console.log(`[WISHLIST SYNC SUCCESS] Returned ${returnedWishlist.length} items to frontend.`);
    res.json({ success: true, wishlist: returnedWishlist });
  } catch (error) {
    next(error);
  }
};
