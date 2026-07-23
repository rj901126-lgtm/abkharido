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
    const { cart } = req.body;
    
    if (!Array.isArray(cart)) {
      res.status(400);
      throw new Error('Invalid cart data format');
    }

    // Convert frontend cart format to backend schema
    const formattedCart = cart.map(item => {
      // Handle both cases: product is an object vs product is just an ID
      const productId = typeof item.product === 'object' ? item.product.id || item.product._id : item.product;
      return {
        product: productId,
        quantity: item.quantity
      };
    });

    const user = await User.findById(req.user._id);
    user.cart = formattedCart;
    await user.save();

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
