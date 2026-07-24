import Order from '../models/Order.js';
import Settlement from '../models/Settlement.js';
import User from '../models/User.js';
import PayoutAuditLog from '../models/PayoutAuditLog.js';

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

// @desc    Get all payouts/settlements
// @route   GET /api/finance/payouts
// @access  Private/Admin
export const getPayouts = async (req, res, next) => {
  try {
    const payouts = await Settlement.find().populate('vendorId', 'name username email').sort({ createdAt: -1 });
    res.json(payouts);
  } catch (error) {
    next(error);
  }
};

// @desc    Process/Settle a pending payout
// @route   POST /api/finance/settle
// @access  Private/Admin
export const settleVendor = async (req, res, next) => {
  try {
    const { settlementId, transactionId, notes } = req.body;

    const settlement = await Settlement.findById(settlementId);
    if (!settlement) {
      res.status(404);
      throw new Error('Settlement not found');
    }

    if (settlement.status !== 'Pending') {
      res.status(400);
      throw new Error('This settlement is already processed.');
    }

    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // Update Settlement to Paid
    settlement.transactionId = transactionId;
    settlement.notes = notes || settlement.notes;
    settlement.status = 'Paid';
    settlement.settledBy = req.user._id;

    const savedSettlement = await settlement.save();

    // Create Immutable Payout Audit Log
    const auditLog = new PayoutAuditLog({
      action: 'TRANSFERRED',
      userId: settlement.vendorId,
      amount: settlement.amount,
      settlementId: savedSettlement._id,
      performedBy: req.user._id,
      ipAddress,
      details: {
        transactionId,
        message: 'Admin processed bank transfer'
      }
    });
    await auditLog.save();

    res.status(200).json(savedSettlement);
  } catch (error) {
    next(error);
  }
};
