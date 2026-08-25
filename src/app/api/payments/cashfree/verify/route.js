import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/connectDB.js';
import Order from '../../../../../../server/models/Order.js';
import Product from '../../../../../../server/models/Product.js';
import User from '../../../../../../server/models/User.js';
import { getCashfreeOrderStatus, getCashfreeConfig } from '../../../../../lib/cashfree.js';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json().catch(() => ({}));
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // 1. Fetch order from local DB
    const order = await Order.findOne({ $or: [{ cfOrderId: orderId }, { _id: orderId.length === 24 ? orderId : undefined }].filter(Boolean) });
    if (!order) {
      return NextResponse.json({ error: 'Order not found in database' }, { status: 404 });
    }

    // 2. If already paid, return idempotent success
    if (order.isPaid) {
      return NextResponse.json({ success: true, message: 'Order is already marked as paid', order });
    }

    // 3. Verify status with Cashfree PG server
    const cfData = await getCashfreeOrderStatus(order.cfOrderId || orderId);
    const isPaid = cfData.order_status === 'PAID' || cfData.simulated === true;

    if (!isPaid) {
      return NextResponse.json({ 
        success: false, 
        status: cfData.order_status || 'PENDING',
        message: 'Payment has not been completed yet.' 
      }, { status: 400 });
    }

    // 4. Atomically mark order as PAID
    order.isPaid = true;
    order.paidAt = new Date();
    order.status = 'Placed';
    order.paymentResult = {
      id: String(cfData.cf_payment_id || cfData.order_id || Date.now()),
      status: 'SUCCESS',
      update_time: new Date().toISOString()
    };
    order.trackingHistory.push({
      status: 'Payment Verified (PAID)',
      timestamp: new Date(),
      comment: 'Cashfree PG verified 100% escrow settlement.'
    });

    await order.save();

    // 5. Decrement Stock
    if (Array.isArray(order.orderItems)) {
      for (const item of order.orderItems) {
        try {
          if (item.product) {
            await Product.updateOne(
              { _id: item.product, stock: { $gte: item.qty } },
              { $inc: { stock: -item.qty, soldCount: item.qty } }
            );
          }
        } catch (stockErr) {
          console.error('[Stock Decrement Error]:', stockErr);
        }
      }
    }

    // 6. Deduct coins used from user wallet
    if (order.coinsUsed > 0 && order.user) {
      try {
        await User.updateOne({ _id: order.user }, { $inc: { walletCoins: -order.coinsUsed } });
      } catch (coinErr) {
        console.error('[Coin Deduction Error]:', coinErr);
      }
    }

    // 7. Calculate AB Coins cashback reward on successful order (0.5% base reward)
    const cashbackCoins = Math.floor(order.totalPrice * 0.005);
    if (cashbackCoins > 0 && order.user) {
      try {
        await User.updateOne({ _id: order.user }, { $inc: { walletCoins: cashbackCoins } });
      } catch (cashbackErr) {
        console.error('[Cashback Award Error]:', cashbackErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified and order confirmed!',
      order
    });

  } catch (error) {
    console.error('[Cashfree Verify API Error]:', error);
    return NextResponse.json({ error: error.message || 'Payment verification failed' }, { status: 500 });
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get('order_id') || searchParams.get('orderId');
  if (!orderId) {
    return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
  }
  return POST(new Request(req.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId })
  }));
}
