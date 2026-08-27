import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/connectDB.js';
import Order from '../../../../../../server/models/Order.js';
import Product from '../../../../../../server/models/Product.js';
import User from '../../../../../../server/models/User.js';
import { verifyCashfreeWebhookSignature } from '../../../../../lib/cashfree.js';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const rawBody = await req.text();
    const timestamp = req.headers.get('x-webhook-timestamp');
    const signature = req.headers.get('x-webhook-signature');

    // 1. Verify Webhook Signature (reject tampering & replay attacks)
    const isValid = verifyCashfreeWebhookSignature({ rawBody, timestamp, signature });
    if (!isValid) {
      console.warn('[SECURITY] Cashfree Webhook signature validation failed. Rejecting request.');
      return NextResponse.json({ error: 'Invalid webhook signature or timestamp skew' }, { status: 401 });
    }

    let payload = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const eventType = payload.type || payload.event || '';
    const orderData = payload.data?.order || payload.data || {};
    const paymentData = payload.data?.payment || {};
    const orderId = orderData.order_id || payload.order_id;

    if (!orderId) {
      return NextResponse.json({ status: 'IGNORED', message: 'No order_id present' }, { status: 200 });
    }

    await connectDB();
    const order = await Order.findOne({ $or: [{ cfOrderId: orderId }, { _id: orderId.length === 24 ? orderId : undefined }].filter(Boolean) });

    if (!order) {
      console.warn(`[Cashfree Webhook] Order ${orderId} not found in DB`);
      return NextResponse.json({ status: 'NOT_FOUND' }, { status: 200 });
    }

    // 2. Handle PAYMENT SUCCESS
    if (eventType.includes('SUCCESS') || eventType.includes('PAID') || orderData.order_status === 'PAID') {
      // Idempotency check
      if (order.isPaid) {
        return NextResponse.json({ status: 'ALREADY_PROCESSED' }, { status: 200 });
      }

      order.isPaid = true;
      order.paidAt = new Date();
      order.status = 'Placed';
      order.paymentResult = {
        id: String(paymentData.cf_payment_id || orderData.cf_order_id || Date.now()),
        status: 'SUCCESS',
        update_time: new Date().toISOString()
      };
      order.trackingHistory.push({
        status: 'Paid (Cashfree Webhook Verified)',
        timestamp: new Date(),
        comment: 'Webhook verified payment success.'
      });

      await order.save();

      // Decrement stock
      if (Array.isArray(order.orderItems)) {
        for (const item of order.orderItems) {
          try {
            if (item.product) {
              await Product.updateOne(
                { _id: item.product, stock: { $gte: item.qty } },
                { $inc: { stock: -item.qty, soldCount: item.qty } }
              );
            }
          } catch (e) {}
        }
      }

      // Deduct coins used
      if (order.coinsUsed > 0 && order.user) {
        await User.updateOne({ _id: order.user }, { $inc: { walletCoins: -order.coinsUsed } });
      }

      // Award cashback coins (0.5% base reward)
      const cashbackCoins = Math.floor(order.totalPrice * 0.005);
      if (cashbackCoins > 0 && order.user) {
        await User.updateOne({ _id: order.user }, { $inc: { walletCoins: cashbackCoins } });
      }

      // Credit referral rewards if applied
      if (order.referralApplied && order.referralApplied.referrerId && !order.referralApplied.isCredited) {
        try {
          await User.updateOne(
            { username: order.referralApplied.referrerId },
            { $inc: { walletCoins: order.referralApplied.rewardAmount || 50 } }
          );
          order.referralApplied.isCredited = true;
          await order.save();
        } catch (e) {}
      }

      // Clear user cart in DB
      if (order.user) {
        try {
          await User.updateOne({ _id: order.user }, { $set: { cart: [] } });
        } catch (cartErr) {
          console.error('[Webhook Cart Clear Error]:', cartErr);
        }
      }

      return NextResponse.json({ status: 'PROCESSED_SUCCESS' }, { status: 200 });
    }


    // 3. Handle PAYMENT FAILED
    if (eventType.includes('FAILED')) {
      order.trackingHistory.push({
        status: 'Payment Failed',
        timestamp: new Date(),
        comment: 'Cashfree reported payment failure.'
      });
      await order.save();
      return NextResponse.json({ status: 'PROCESSED_FAILED' }, { status: 200 });
    }

    return NextResponse.json({ status: 'EVENT_ACKNOWLEDGED' }, { status: 200 });

  } catch (error) {
    console.error('[Cashfree Webhook Processing Error]:', error);
    return NextResponse.json({ error: 'Webhook processing error' }, { status: 500 });
  }
}
