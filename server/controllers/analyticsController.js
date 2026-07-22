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

    // Advanced Business Intelligence (Phase 2)
    // 1. Retention Rate: Users with > 1 order
    const repeatUsersResult = await Order.aggregate([
      { $match: { isPaid: true } },
      { $group: { _id: "$user", orderCount: { $sum: 1 } } },
      { $match: { orderCount: { $gt: 1 } } },
      { $count: "repeatUsers" }
    ]);
    const repeatUsers = repeatUsersResult.length > 0 ? repeatUsersResult[0].repeatUsers : 0;
    const retentionRate = totalUsers > 0 ? ((repeatUsers / totalUsers) * 100).toFixed(1) : 0;

    // 2. Customer Lifetime Value (CLV) = (Total Revenue / Total Unique Customers)
    const uniqueCustomersResult = await Order.distinct("user", { isPaid: true });
    const uniqueCustomers = uniqueCustomersResult.length || 1; // Avoid division by zero
    const clv = (totalRevenue / uniqueCustomers).toFixed(2);

    res.json({
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      clv: parseFloat(clv),
      retentionRate: parseFloat(retentionRate)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Predictive Inventory (Days until OOS)
// @route   GET /api/v2/analytics/inventory-predict
// @access  Private/Admin
export const getInventoryPrediction = async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 1. Calculate Sales Velocity per Product (Units sold last 30 days)
    const velocityData = await Order.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo }, isPaid: true } },
      { $unwind: "$orderItems" },
      {
        $group: {
          _id: "$orderItems.product", // Assuming this holds Product ID
          unitsSold30Days: { $sum: "$orderItems.qty" }
        }
      }
    ]);

    const velocityMap = {};
    velocityData.forEach(item => {
      velocityMap[item._id] = item.unitsSold30Days / 30; // Daily Velocity
    });

    // 2. Get Current Stock Levels
    const products = await Product.find({ inStock: true }, 'id name colorModels');
    
    let predictions = [];
    products.forEach(p => {
      // Approximate stock from colorModels variants
      let totalStock = 0;
      if (p.colorModels && p.colorModels.length > 0) {
         p.colorModels.forEach(cm => {
           if (cm.variants) cm.variants.forEach(v => totalStock += (v.stock || 0));
         });
      } else {
         totalStock = 50; // Fallback estimate
      }

      const dailyVelocity = velocityMap[p._id] || 0.1; // Default to slow movement if no data
      const daysUntilOos = Math.round(totalStock / dailyVelocity);

      if (daysUntilOos < 14) { // Only return high-risk items (OOS < 14 days)
        predictions.push({
          productId: p.id,
          name: p.name,
          currentStock: totalStock,
          velocity: dailyVelocity.toFixed(2),
          daysUntilOos
        });
      }
    });

    predictions.sort((a, b) => a.daysUntilOos - b.daysUntilOos);

    res.json(predictions);
  } catch (error) {
    next(error);
  }
};
