import Product from '../models/Product.js';
import User from '../models/User.js';
import Order from '../models/Order.js';

// @desc    Global Search across Products, Users, Orders
// @route   GET /api/admin/search?q=query
// @access  Private/Admin
export const globalSearch = async (req, res, next) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ products: [], users: [], orders: [] });
    }

    const regex = new RegExp(q, 'i');

    // Search Products (Name, SKU)
    const products = await Product.find({
      $or: [
        { name: regex },
        { sku: regex }
      ]
    }).limit(5).select('_id name sku price category');

    // Search Users (Name, Email, Username)
    const users = await User.find({
      $or: [
        { fullName: regex },
        { email: regex },
        { username: regex }
      ]
    }).limit(5).select('_id fullName email username role');

    // Search Orders (Order ID)
    let orders = [];
    if (q.length === 24) {
      // If it looks like a Mongo Object ID
      const order = await Order.findById(q).populate('user', 'name email');
      if (order) orders.push(order);
    }

    res.json({
      products,
      users,
      orders
    });
  } catch (error) {
    next(error);
  }
};
