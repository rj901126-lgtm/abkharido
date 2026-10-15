import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/serverAuth.js';
import connectDB from '../../../../lib/connectDB.js';
import Order from '../../../../../server/models/Order.js';
import Product from '../../../../../server/models/Product.js';
import User from '../../../../../server/models/User.js';
import Settlement from '../../../../../server/models/Settlement.js';

export const dynamic = 'force-dynamic';

async function verifySeller(req) {
  const auth = await getAuthenticatedUser(req);
  if (!auth?.isAuthenticated || !auth.isSeller) return null;
  return auth.user;
}

export async function GET(req) {
  try {
    await connectDB();
    const seller = await verifySeller(req);

    if (!seller || !seller.id) {
      return NextResponse.json({ error: 'Unauthorized merchant access' }, { status: 401 });
    }

    const sellerUser = await User.findById(seller.id).lean();
    if (!sellerUser) {
      return NextResponse.json({ error: 'Seller account not found' }, { status: 404 });
    }

    // 1. Total Products Count
    const totalProducts = await Product.countDocuments({
      $or: [{ vendorId: seller.id }, { sellerId: seller.id }]
    });

    // 2. Fetch Orders containing items from this seller
    const sellerOrders = await Order.find({
      $or: [
        { 'orderItems.vendorId': seller.id },
        { 'items.vendorId': seller.id },
        { vendorId: seller.id }
      ]
    }).lean();

    const totalOrders = sellerOrders.length;
    let totalRevenue = 0;
    let unitsSold = 0;
    let pendingDeliverySales = 0;
    let deliveredGrossSales = 0;

    sellerOrders.forEach(ord => {
      const items = ord.orderItems || ord.items || [];
      items.forEach(it => {
        if (String(it.vendorId) === String(seller.id) || ord.vendorId === seller.id) {
          const itemTotal = (Number(it.price) || 0) * (Number(it.qty || it.quantity) || 1);
          totalRevenue += itemTotal;
          unitsSold += (Number(it.qty || it.quantity) || 1);

          if (['Delivered'].includes(ord.status)) {
            deliveredGrossSales += itemTotal;
          } else if (!['Cancelled', 'Returned'].includes(ord.status)) {
            pendingDeliverySales += itemTotal;
          }
        }
      });
    });

    // Calculate Platform Commission & Net Earnings
    const commissionRate = sellerUser.commissionRate || 0.08;
    const estimatedPlatformFee = Math.round(deliveredGrossSales * commissionRate * 1.18); // 8% fee + 18% GST on fee
    const netEarnings = Math.max(0, deliveredGrossSales - estimatedPlatformFee);

    // Live Wallet Cash (Cleared funds available for immediate withdrawal)
    const walletBalance = Number(sellerUser.walletCash) || 0;

    // Fetch Pending Settlements from Settlement Ledger
    const pendingSettlementRecords = await Settlement.find({
      vendorId: seller.id,
      status: { $in: ['Pending', 'Processing', 'In Escrow'] }
    }).lean();

    const pendingPayoutTotal = pendingSettlementRecords.reduce((sum, s) => sum + (s.amount || 0), 0) + pendingDeliverySales;

    return NextResponse.json({
      success: true,
      stats: {
        totalRevenue,
        deliveredGrossSales,
        netEarnings,
        totalOrders,
        totalProducts,
        unitsSold,
        walletBalance,
        availableBalance: walletBalance,
        pendingPayout: pendingPayoutTotal,
        pendingDeliverySales,
        shopName: sellerUser.shopName || 'Verified Merchant Store',
        legalBusinessName: sellerUser.legalBusinessName || sellerUser.shopName,
        sellerType: sellerUser.sellerType || (sellerUser.gstin ? 'gst' : 'non_gst'),
        gstin: sellerUser.gstin || '',
        pan: sellerUser.pan || '',
        enrolmentId: sellerUser.enrolmentId || '',
        pickupAddress: sellerUser.pickupAddress,
        payoutDetails: sellerUser.payoutDetails
      }
    });

  } catch (error) {
    console.error('[Seller Stats API Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch seller stats' }, { status: 500 });
  }
}
