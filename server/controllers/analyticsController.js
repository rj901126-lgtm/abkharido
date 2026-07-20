import Order from '../models/Order.js';
import User from '../models/User.js';
import Product from '../models/Product.js';

// @desc    Get Sales Analytics Data
// @route   GET /api/v2/analytics/sales
// @access  Private/Admin
export const getSalesAnalytics = async (req, res, next) => {
  try {
    // For simplicity, aggregate sales by day over the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const salesData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
          isPaid: true
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$totalPrice" },
          ordersCount: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 } // Sort by date ascending
      }
    ]);

    // Format for Recharts
    const formattedData = salesData.map(item => ({
      date: item._id,
      revenue: item.revenue,
      orders: item.ordersCount
    }));

    res.json(formattedData);
  } catch (error) {
    next(error);
  }
};

// @desc    Get Top KPI Numbers
// @route   GET /api/v2/analytics/kpi
// @access  Private/Admin
export const getKPIs = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments({});
    const totalProducts = await Product.countDocuments({});
    const totalOrders = await Order.countDocuments({});
    
    const revenueResult = await Order.aggregate([
      { $match: { isPaid: true } },
      { $group: { _id: null, totalRevenue: { $sum: "$totalPrice" } } }
    ]);
    
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    res.json({
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue
    });
  } catch (error) {
    next(error);
  }
};
