import User from '../models/User.js';
import Product from '../models/Product.js';

// @desc    Get logged in user's cart
// @route   GET /api/cart
// @access  Private
export const getCart = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('cart.product');
    
    // Format cart for frontend, mapping 'product' to the actual product doc
    // Only return items where the product still exists in DB
    const formattedCart = user.cart
      .filter(item => item.product != null)
      .map(item => ({
        product: {
          id: item.product._id,
          name: item.product.name,
          price: item.product.price,
          image: item.product.images?.[0] || item.product.image || '',
          brand: item.product.brand,
          stock: item.product.stock
        },
        quantity: item.quantity
      }));

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
          user.cart = user.cart.filter(cItem => cItem.product.toString() !== resolvedId);
        }
      } else if ((action === 'add' || action === 'update') && item) {
        const pIdStr = typeof item.product === 'object' ? (item.product.id || item.product._id) : item.product;
        const resolvedId = await resolveObjectId(pIdStr);
        
        if (resolvedId) {
          const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
          const existingIndex = user.cart.findIndex(cItem => cItem.product.toString() === resolvedId);
          
          if (existingIndex >= 0) {
            user.cart[existingIndex].quantity = action === 'add' 
              ? user.cart[existingIndex].quantity + qty 
              : qty;
          } else {
            user.cart.push({ product: resolvedId, quantity: qty });
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
        const dbCartMap = new Map(user.cart.map(i => [i.product.toString(), i]));
        for (const guestItem of incomingCart) {
          if (!dbCartMap.has(guestItem.product)) {
            dbCartMap.set(guestItem.product, { product: guestItem.product, quantity: guestItem.quantity });
          }
        }
        user.cart = Array.from(dbCartMap.values());
      } else {
        user.cart = incomingCart.map(i => ({ product: i.product, quantity: i.quantity }));
      }
    } else {
      res.status(400);
      throw new Error('Invalid cart data format or missing action');
    }

    user.cartUpdatedAt = new Date();
    await user.save();

    // Populate and return the absolute latest cart to sync the frontend
    await user.populate('cart.product');
    const formattedCart = user.cart
      .filter(cItem => cItem.product != null)
      .map(cItem => ({
        product: {
          id: cItem.product._id,
          name: cItem.product.name,
          price: cItem.product.price,
          image: cItem.product.images?.[0] || cItem.product.image || '',
          brand: cItem.product.brand,
          stock: cItem.product.stock
        },
        quantity: cItem.quantity
      }));

    res.json({ success: true, cart: formattedCart });
  } catch (error) {
    next(error);
  }
};
