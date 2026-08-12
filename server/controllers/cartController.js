import User from '../models/User.js';
import Product from '../models/Product.js';

// @desc    Get logged in user's cart
// @route   GET /api/cart
// @access  Private
export const getCart = async (req, res, next) => {
  try {
    console.log(`[CART GET INIT] User: ${req.user._id}`);
    const user = await User.findById(req.user._id).populate('cart.product');
    
    // Set headers to explicitly prevent Vercel Edge caching
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Format cart for frontend, mapping 'product' to the actual product doc
    // Only return items where the product still exists in DB
    const formattedCart = user.cart
      .filter(item => item.product != null)
      .map(item => ({
        product: {
          id: item.product.id || item.product._id, // Prefer slug for frontend consistency
          name: item.product.name,
          price: item.product.price,
          originalPrice: item.product.originalPrice || item.product.price,
          image: item.product.images?.[0] || item.product.image || '',
          brand: item.product.brand,
          stock: item.product.stock,
          isVIP: item.product.isVIP || false,
          discount: item.product.discount || 0
        },
        quantity: item.quantity
      }));

    console.log(`[CART GET SUCCESS] User: ${req.user._id} | Fetched ${formattedCart.length} items`);
    res.json(formattedCart);
  } catch (error) {
    next(error);
  }
};

// @desc    Sync cart from frontend to backend
// @route   POST /api/cart/sync
// @access  Private
export const syncCart = async (req, res, next) => {
  try {
    const { cart, merge, action, item, productId } = req.body; 
    console.log(`[CART SYNC INIT] User: ${req.user._id} | Action: ${action} | Merge: ${merge}`);
    console.log(`[CART SYNC PAYLOAD]`, JSON.stringify(req.body, null, 2));

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

    // ── DELTA SYNC ARCHITECTURE (MULTI-DEVICE SAFE) ──
    if (action) {
      if (action === 'clear') {
        user.cart = [];
      } else if (action === 'remove' && productId) {
        const resolvedId = await resolveObjectId(productId);
        if (resolvedId) {
          console.log(`[CART SYNC ACTION] remove | Resolved ProductId: ${resolvedId}`);
          user.cart = user.cart.filter(cItem => cItem.product.toString() !== resolvedId);
        }
      } else if ((action === 'add' || action === 'update') && item) {
        const pIdStr = typeof item.product === 'object' ? (item.product.id || item.product._id) : item.product;
        const resolvedId = await resolveObjectId(pIdStr);
        
        if (resolvedId) {
          console.log(`[CART SYNC ACTION] ${action} | Resolved ProductId: ${resolvedId} | Qty: ${item.quantity}`);
          const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
          const existingIndex = user.cart.findIndex(cItem => cItem.product.toString() === resolvedId);
          
          if (existingIndex >= 0) {
            user.cart[existingIndex].quantity = action === 'add' 
              ? user.cart[existingIndex].quantity + qty 
              : qty;
            console.log(`[CART SYNC ACTION] Updated existing item qty to: ${user.cart[existingIndex].quantity}`);
          } else {
            user.cart.push({ product: resolvedId, quantity: qty });
            console.log(`[CART SYNC ACTION] Added new item to cart`);
          }
        }
      }
    } 
    // ── LEGACY FULL-SYNC & GUEST MERGE ──
    else if (Array.isArray(cart)) {
      const incomingCart = [];
      for (const cItem of cart) {
        if (!cItem || !cItem.product) continue;
        const pIdStr = typeof cItem.product === 'object' ? (cItem.product.id || cItem.product._id) : cItem.product;
        const resolvedId = await resolveObjectId(pIdStr);
        if (resolvedId) {
          incomingCart.push({
            product: resolvedId,
            quantity: Math.max(1, parseInt(cItem.quantity, 10) || 1)
          });
        }
      }

      if (merge && user.cart && user.cart.length > 0) {
        console.log(`[CART SYNC MERGE] Starting guest merge. Incoming Guest Items: ${incomingCart.length}, Current DB Items: ${user.cart.length}`);
        const dbCartMap = new Map(user.cart.map(i => [i.product.toString(), i]));
        for (const guestItem of incomingCart) {
          if (!dbCartMap.has(guestItem.product)) {
            console.log(`[CART SYNC MERGE] Adding guest item: ${guestItem.product}`);
            dbCartMap.set(guestItem.product, { product: guestItem.product, quantity: guestItem.quantity });
          } else {
            console.log(`[CART SYNC MERGE] Item already in DB, skipping: ${guestItem.product}`);
          }
        }
        user.cart = Array.from(dbCartMap.values());
        console.log(`[CART SYNC MERGE] Merge completed. Final Cart Size: ${user.cart.length}`);
      } else {
        console.log(`[CART SYNC FULL] Replacing user cart with incoming array of ${incomingCart.length} items`);
        user.cart = incomingCart.map(i => ({ product: i.product, quantity: i.quantity }));
      }
    } else {
      res.status(400);
      throw new Error('Invalid cart data format or missing action');
    }

    user.cartUpdatedAt = new Date();
    await User.updateOne(
      { _id: user._id },
      { $set: { cart: user.cart, cartUpdatedAt: user.cartUpdatedAt } }
    );

    // Populate and return the absolute latest cart to sync the frontend
    await user.populate('cart.product');
    const formattedCart = user.cart
      .filter(cItem => cItem.product != null)
      .map(cItem => ({
        product: {
          id: cItem.product.id || cItem.product._id,
          name: cItem.product.name,
          price: cItem.product.price,
          originalPrice: cItem.product.originalPrice || cItem.product.price,
          image: cItem.product.images?.[0] || cItem.product.image || '',
          brand: cItem.product.brand,
          stock: cItem.product.stock,
          isVIP: cItem.product.isVIP || false,
          discount: cItem.product.discount || 0
        },
        quantity: cItem.quantity
      }));

    console.log(`[CART SYNC SUCCESS] Returned ${formattedCart.length} items to frontend.`);
    res.json({ success: true, cart: formattedCart });
  } catch (error) {
    next(error);
  }
};
