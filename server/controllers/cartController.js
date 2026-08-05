import User from '../models/User.js';

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
    const { cart, merge } = req.body; // merge=true means guest cart login merge
    
    if (!Array.isArray(cart)) {
      res.status(400);
      throw new Error('Invalid cart data format');
    }

    // Convert frontend cart format to backend schema
    const incomingCart = [];
    for (const item of cart) {
      if (item && item.product) {
        const productId = typeof item.product === 'object' ? (item.product.id || item.product._id) : item.product;
        // Validate ObjectId to prevent Mongoose CastError which causes 500s
        if (productId && productId.toString().length === 24) {
          incomingCart.push({
            product: productId.toString(),
            quantity: item.quantity || 1
          });
        }
      }
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (merge && user.cart && user.cart.length > 0) {
      // ── SMART GUEST CART MERGE ──
      // DB cart takes priority. Only add guest items that aren't already in DB cart.
      const dbCartMap = new Map(
        user.cart.map(item => [item.product.toString(), item])
      );

      for (const guestItem of incomingCart) {
        if (!dbCartMap.has(guestItem.product)) {
          // Item exists in guest cart but not in DB — add it
          dbCartMap.set(guestItem.product, {
            product: guestItem.product,
            quantity: guestItem.quantity
          });
        }
        // If item already in DB cart, keep the DB quantity (do not override)
      }

      user.cart = Array.from(dbCartMap.values());
    } else {
      // Normal sync: overwrite DB cart with frontend cart
      user.cart = incomingCart.map(item => ({
        product: item.product,
        quantity: item.quantity
      }));
    }

    user.cartUpdatedAt = new Date();
    await user.save();

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
