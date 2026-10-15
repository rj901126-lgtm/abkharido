import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/serverAuth.js';
import connectDB from '../../../../lib/connectDB.js';
import Order from '../../../../../server/models/Order.js';
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
    const isGstSeller = sellerUser?.sellerType === 'gst' || Boolean(sellerUser?.gstin);

    // Fetch real orders for this authenticated seller
    const orders = await Order.find({
      $or: [
        { 'orderItems.vendorId': seller.id },
        { 'items.vendorId': seller.id },
        { vendorId: seller.id }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const formattedOrders = orders.map(o => {
      const allItems = o.orderItems || o.items || [];
      const sellerItems = allItems.filter(i => String(i.vendorId) === String(seller.id) || o.vendorId === seller.id);

      const itemsSubtotal = sellerItems.reduce((acc, i) => acc + (Number(i.price) || 0) * (Number(i.qty || i.quantity) || 1), 0);
      const commissionRate = sellerUser?.commissionRate || 0.08;
      const platformFee = Math.round(itemsSubtotal * commissionRate);
      const gstOnPlatformFee = Math.round(platformFee * 0.18);
      const gatewayFee = o.paymentMethod !== 'Cash on Delivery' ? Math.round(itemsSubtotal * 0.02) : 0;
      const tdsAmount = Math.round(itemsSubtotal * 0.01);
      const tcsAmount = isGstSeller ? Math.round(itemsSubtotal * 0.01) : 0; // 0% TCS for Non-GST composition sellers
      const netPayable = Math.max(0, itemsSubtotal - platformFee - gstOnPlatformFee - gatewayFee - tdsAmount - tcsAmount);

      return {
        _id: o._id,
        orderId: o.cfOrderId || String(o._id),
        cfOrderId: o.cfOrderId,
        createdAt: o.createdAt,
        status: o.status,
        shippingAddress: o.shippingAddress,
        paymentMethod: o.paymentMethod,
        isPaid: o.isPaid,
        isDelivered: o.isDelivered,
        deliveredAt: o.deliveredAt,
        awbNumber: o.awbNumber || '',
        courierPartner: o.courierPartner || 'Delhivery Express',
        trackingHistory: o.trackingHistory || [],
        orderItems: sellerItems.map(i => ({
          name: i.name,
          qty: i.qty || i.quantity || 1,
          price: i.price,
          image: i.image,
          product: i.product,
          hsnCode: i.hsnCode || '8517',
          gstRate: isGstSeller ? (i.gstRate || 18) : 0,
          isBillOfSupply: !isGstSeller
        })),
        financialLedger: {
          grossSale: itemsSubtotal,
          platformCommission: platformFee,
          gstOnCommission: gstOnPlatformFee,
          gatewayFee,
          tdsDeducted: tdsAmount,
          tcsDeducted: tcsAmount,
          netPayable,
          settlementStatus: o.status === 'Delivered' ? 'Settled (Credited to Wallet)' : (['Cancelled', 'Returned'].includes(o.status) ? 'Cancelled / Void' : 'In Escrow (Pending Delivery)')
        },
        invoiceType: isGstSeller ? 'TAX INVOICE' : 'BILL OF SUPPLY'
      };
    });

    return NextResponse.json({
      success: true,
      count: formattedOrders.length,
      orders: formattedOrders
    });

  } catch (error) {
    console.error('[Seller Orders GET error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch seller orders' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const seller = await verifySeller(req);
    if (!seller || !seller.id) {
      return NextResponse.json({ error: 'Unauthorized merchant access' }, { status: 401 });
    }

    await connectDB();
    const body = await req.json().catch(() => ({}));
    const { orderId, status = 'Shipped', courier = 'Delhivery Express' } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const order = await Order.findOne({ $or: [{ _id: orderId }, { cfOrderId: orderId }] });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const sellerUser = await User.findById(seller.id);
    const isGstSeller = sellerUser?.sellerType === 'gst' || Boolean(sellerUser?.gstin);

    // Update logistics tracking & AWB
    if (status === 'Packed') {
      order.status = 'Packed';
      if (!order.trackingHistory) order.trackingHistory = [];
      order.trackingHistory.push({
        status: 'Packed',
        timestamp: new Date(),
        location: sellerUser?.pickupAddress?.city || 'Seller Warehouse',
        comment: `Order packed by merchant (${sellerUser?.shopName || 'Merchant'}). Ready for courier pickup.`
      });
    } else if (['Shipped', 'Dispatched'].includes(status)) {
      order.status = 'Shipped';
      if (!order.awbNumber) {
        order.awbNumber = `DEL-IN-${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 899)}`;
      }
      order.courierPartner = courier;
      if (!order.trackingHistory) order.trackingHistory = [];
      order.trackingHistory.push({
        status: 'Shipped',
        timestamp: new Date(),
        location: sellerUser?.pickupAddress?.city || 'Pickup Hub',
        comment: `Package picked up by ${courier} from ${sellerUser?.pickupAddress?.city || 'Seller Hub'}. AWB: ${order.awbNumber}`
      });
    } else if (status === 'Delivered') {
      order.status = 'Delivered';
      order.isDelivered = true;
      order.deliveredAt = new Date();
      if (!order.isPaid && /cod|cash on delivery/i.test(order.paymentMethod)) {
        order.isPaid = true;
        order.paidAt = new Date();
      }

      // ─── INSTANT SETTLEMENT LEDGER CREDIT UPON DELIVERY ────────────
      const allItems = order.orderItems || order.items || [];
      const sellerItems = allItems.filter(i => String(i.vendorId) === String(seller.id) || order.vendorId === seller.id);
      const itemsSubtotal = sellerItems.reduce((acc, i) => acc + (Number(i.price) || 0) * (Number(i.qty || i.quantity) || 1), 0);

      const commissionRate = sellerUser?.commissionRate || 0.08;
      const platformFee = Math.round(itemsSubtotal * commissionRate);
      const gstOnPlatformFee = Math.round(platformFee * 0.18);
      const gatewayFee = order.paymentMethod !== 'Cash on Delivery' ? Math.round(itemsSubtotal * 0.02) : 0;
      const tdsAmount = Math.round(itemsSubtotal * 0.01);
      const tcsAmount = isGstSeller ? Math.round(itemsSubtotal * 0.01) : 0;
      const netPayable = Math.max(0, itemsSubtotal - platformFee - gstOnPlatformFee - gatewayFee - tdsAmount - tcsAmount);

      // Check if already settled
      if (!order.sellerSettlement?.isSettled && netPayable > 0) {
        order.sellerSettlement = {
          isSettled: true,
          grossAmount: itemsSubtotal,
          platformCommission: platformFee,
          gstOnCommission: gstOnPlatformFee,
          shippingDeduction: 0,
          gatewayFee,
          tdsAmount,
          tcsAmount,
          netPayable,
          settledAt: new Date(),
          utrNumber: `AK-PAY-${Date.now().toString().slice(-8)}`
        };

        // Credit to Seller's Wallet
        await User.findByIdAndUpdate(seller.id, {
          $inc: { walletCash: netPayable }
        });

        // Record in Settlement Collection
        await Settlement.create({
          vendorId: seller.id,
          orderId: order._id,
          orderNumber: order.cfOrderId || String(order._id),
          type: 'ORDER_CREDIT',
          grossSale: itemsSubtotal,
          platformFee: platformFee + gstOnPlatformFee,
          taxDeducted: tdsAmount + tcsAmount,
          shippingFee: 0,
          netAmount: netPayable,
          amount: netPayable,
          status: 'Paid',
          notes: `Order ${order.cfOrderId || order._id} delivered - Net seller earnings credited`,
          transactionId: order.sellerSettlement.utrNumber
        });
      }

      if (!order.trackingHistory) order.trackingHistory = [];
      order.trackingHistory.push({
        status: 'Delivered',
        timestamp: new Date(),
        location: order.shippingAddress?.city || 'Customer Doorstep',
        comment: `Delivered to customer. Seller wallet credited with net settlement ₹${netPayable}.`
      });
    }

    await order.save();

    return NextResponse.json({
      success: true,
      message: `Order status updated to ${status}. Courier: ${order.courierPartner} | AWB: ${order.awbNumber || 'Assigned'}`,
      order: {
        _id: order._id,
        status: order.status,
        awbNumber: order.awbNumber,
        courierPartner: order.courierPartner
      }
    });

  } catch (error) {
    console.error('[Seller Orders PUT error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to update order' }, { status: 500 });
  }
}
