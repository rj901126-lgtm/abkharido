import Order from '../models/Order.js';
import Settlement from '../models/Settlement.js';
import User from '../models/User.js';

// @desc    Get total platform finance stats
// @route   GET /api/finance/stats
// @access  Private/Admin
export const getFinanceStats = async (req, res, next) => {
  try {
    // Platform Revenue (Total of all platform fees from paid orders)
    const paidOrders = await Order.find({ isPaid: true });
    
    let totalPlatformRevenue = 0;
    let totalSales = 0;
    
    paidOrders.forEach(order => {
      totalSales += order.totalPrice;
      totalPlatformRevenue += order.totalPlatformFee || 0;
    });

    // Total Settled (Total of all 'Paid' settlements)
    const settledPayouts = await Settlement.find({ status: 'Paid' });
    let totalSettled = 0;
    settledPayouts.forEach(s => totalSettled += s.amount);

    res.json({
      totalSales,
      totalPlatformRevenue,
      totalSettled
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all vendors and their pending balances
// @route   GET /api/finance/vendors-balance
// @access  Private/Admin
export const getVendorsBalance = async (req, res, next) => {
  try {
    const sellers = await User.find({ role: 'seller', sellerStatus: 'Approved' }).select('name email walletBalance');
    
    const vendorBalances = [];

    for (const seller of sellers) {
      // Calculate total earned by vendor from paid orders
      const orders = await Order.find({ 
        isPaid: true, 
        'orderItems.vendorId': seller._id 
      });

      let totalEarned = 0;
      orders.forEach(order => {
        order.orderItems.forEach(item => {
          if (item.vendorId && item.vendorId.toString() === seller._id.toString()) {
            totalEarned += item.vendorAmount || 0;
          }
        });
      });

      // Calculate total settled for this vendor
      const settlements = await Settlement.find({ 
        vendorId: seller._id, 
        status: 'Paid' 
      });
      let totalSettled = 0;
      settlements.forEach(s => totalSettled += s.amount);

      const pendingBalance = totalEarned - totalSettled;

      vendorBalances.push({
        _id: seller._id,
        name: seller.name,
        email: seller.email,
        totalEarned,
        totalSettled,
        pendingBalance
      });
    }

    res.json(vendorBalances);
  } catch (error) {
    next(error);
  }
};

// @desc    Settle a vendor payout
// @route   POST /api/finance/settle
// @access  Private/Admin
export const settleVendor = async (req, res, next) => {
  try {
    const { vendorId, amount, transactionId, notes } = req.body;

    const vendor = await User.findById(vendorId);
    if (!vendor || vendor.role !== 'seller') {
      res.status(404);
      throw new Error('Vendor not found');
    }

    const settlement = new Settlement({
      vendorId,
      amount: Number(amount),
      transactionId,
      notes,
      settledBy: req.user._id,
      status: 'Paid'
    });

    const savedSettlement = await settlement.save();

    res.status(201).json(savedSettlement);
  } catch (error) {
    next(error);
  }
};
