import User from '../models/User.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import logger from '../config/logger.js';
import { sendEmail } from './emailService.js';

// ─────────────────────────────────────────────────────────────────────────────
// CRON JOB 1: Abandoned Cart Recovery (Marketing Email)
// Runs every hour — finds users with stale carts and sends a recovery email.
// ─────────────────────────────────────────────────────────────────────────────
export const processAbandonedCarts = async () => {
  logger.info('[CRON] Starting Abandoned Cart Recovery job...');
  try {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Find users with items in cart, updated between 2 and 24 hours ago, and hasn't been emailed recently
    const users = await User.find({
      'cart.0': { $exists: true },
      cartUpdatedAt: { $lt: twoHoursAgo, $gt: twentyFourHoursAgo },
      // Optional: Add a flag to prevent spamming 'abandonedCartEmailSent: false'
    }).populate('cart.product');

    logger.info(`[CRON] Found ${users.length} abandoned carts to process.`);

    for (const user of users) {
      if (!user.email) continue;
      
      const emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #ff5722;">You left something behind, ${user.firstName}!</h2>
          <p>We noticed you left some amazing items in your AbKharido cart.</p>
          <p>Complete your purchase now and get an extra <strong>5% OFF</strong> using code: <strong>COMEBACK5</strong></p>
          <div style="margin: 30px 0;">
            <a href="https://abkharido.com/#cart" style="background: #ff5722; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Checkout Now</a>
          </div>
        </div>
      `;

      try {
        await sendEmail(user.email, 'Your AbKharido Cart is Waiting! 🛒', emailBody);
        logger.info(`[CRON] Sent abandoned cart email to ${user.email}`);
        
        // Mark as sent so we don't spam them tomorrow (requires schema update for abandonedCartEmailSentAt)
        user.cartUpdatedAt = new Date(Date.now() - 25 * 60 * 60 * 1000); // Push it out of the window
        await user.save();
      } catch (err) {
        logger.error(`[CRON] Failed to send email to ${user.email}: ${err.message}`);
      }
    }
    
    logger.info('[CRON] Abandoned Cart Recovery job completed.');
  } catch (error) {
    logger.error(`[CRON] Abandoned cart job failed: ${error.message}`);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CRON JOB 2: Expired Pending Order Stock Release (Inventory TTL Engine)
//
// Problem: Stock is deducted at checkout (POST /api/orders). If a user abandons
// the payment page, the Order sits as status='Pending', isPaid=false, and the
// stock remains permanently deducted — inventory is "ghost-locked."
//
// Fix: Every 5 minutes, find all Pending+Unpaid orders whose paymentExpiresAt
// has passed. For each, atomically:
//   1. Cancel the order (status → 'Cancelled')
//   2. Restore stock for every item in the order
//   3. Release the applied coupon (roll back usedBy + usedCount)
//   4. Refund wallet coins if any were used
//
// This is idempotent: the findOneAndUpdate condition guarantees that even if
// two cron instances fire simultaneously (e.g. on Vercel serverless), only one
// can successfully transition any given order from Pending → Cancelled.
// ─────────────────────────────────────────────────────────────────────────────
export const releaseExpiredOrderStock = async () => {
  logger.info('[CRON] Starting Expired Order Stock Release job...');
  let releasedCount = 0;
  let errorCount = 0;

  try {
    const now = new Date();

    // Find all orders that:
    //   • are still Pending (payment never completed)
    //   • have not been paid
    //   • have a paymentExpiresAt that is in the past
    const expiredOrders = await Order.find({
      status: 'Pending',
      isPaid: false,
      paymentExpiresAt: { $lt: now, $exists: true, $ne: null }
    }).lean();

    logger.info(`[CRON] Found ${expiredOrders.length} expired Pending orders to release.`);

    for (const order of expiredOrders) {
      try {
        // ── STEP 1: Atomically cancel the order ──
        // The conditional update prevents double-processing if two cron instances
        // fire at the same millisecond (idempotent guard).
        const cancelled = await Order.findOneAndUpdate(
          { _id: order._id, status: 'Pending', isPaid: false },
          {
            $set: { status: 'Cancelled' },
            $push: {
              trackingHistory: {
                status: 'Cancelled',
                timestamp: new Date(),
                comment: 'Order automatically cancelled: payment not received within 15 minutes.'
              }
            }
          },
          { new: true }
        );

        if (!cancelled) {
          // Another cron instance already processed this order — skip safely
          logger.warn(`[CRON] Order ${order._id} was already processed by another instance. Skipping.`);
          continue;
        }

        // ── STEP 2: Restore stock for all items atomically ──
        for (const item of order.orderItems) {
          try {
            const restored = await Product.findOneAndUpdate(
              { _id: item.product },
              { $inc: { stock: item.qty, soldCount: -item.qty } },
              { new: true }
            );
            if (restored && restored.stock > 0 && !restored.inStock) {
              await Product.updateOne({ _id: restored._id }, { $set: { inStock: true } });
            }
          } catch (stockErr) {
            logger.error(`[CRON] Failed to restore stock for product ${item.product} on order ${order._id}: ${stockErr.message}`);
          }
        }

        // ── STEP 3: Release coupon if one was applied ──
        if (order.appliedCoupon) {
          try {
            await Coupon.updateOne(
              { code: order.appliedCoupon },
              {
                $pull: { usedBy: order.user },
                $inc: { usedCount: -1 }
              }
            );
          } catch (couponErr) {
            logger.error(`[CRON] Failed to release coupon ${order.appliedCoupon} for order ${order._id}: ${couponErr.message}`);
          }
        }

        // ── STEP 4: Refund wallet coins if any were used ──
        // This handles the case where a user spent coins on checkout but didn't pay.
        if (order.coinsUsed && order.coinsUsed > 0) {
          try {
            await User.updateOne(
              { _id: order.user },
              { $inc: { walletCoins: order.coinsUsed } }
            );
          } catch (coinsErr) {
            logger.error(`[CRON] Failed to refund ${order.coinsUsed} coins for order ${order._id}: ${coinsErr.message}`);
          }
        }

        releasedCount++;
        logger.info(`[CRON] Released order ${order._id} — restored ${order.orderItems.length} item(s) back to stock.`);
      } catch (orderErr) {
        errorCount++;
        logger.error(`[CRON] Failed to process expired order ${order._id}: ${orderErr.message}`);
      }
    }

    logger.info(`[CRON] Expired Order Stock Release complete. Released: ${releasedCount}, Errors: ${errorCount}.`);
  } catch (error) {
    logger.error(`[CRON] releaseExpiredOrderStock job failed entirely: ${error.message}`);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CRON SCHEDULER
//
// Architecture note for Vercel Serverless:
// setInterval is unreliable on serverless because functions are stateless and
// can be cold-started at any time. The jobs below run on every cold start
// (which is fine for a recovery job — they check timestamps before doing work).
//
// For production, consider:
//   - Vercel Cron Jobs (vercel.json "crons" config) — call a /api/cron/release endpoint
//   - An external scheduler like Upstash QStash or GitHub Actions
//
// The releaseExpiredOrderStock job is safe to run repeatedly — it is idempotent.
// ─────────────────────────────────────────────────────────────────────────────
export const initCronJobs = () => {
  // Abandoned cart emails: run every hour
  if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_LOCAL_CRON === 'true') {
    setInterval(processAbandonedCarts, 60 * 60 * 1000);
    logger.info('[CRON] Local interval scheduled for Abandoned Carts (every 1 hour).');
  }

  // Stock release: run every 5 minutes, always — even in production.
  // This is critical for inventory accuracy and must not be gated by ENABLE_LOCAL_CRON.
  // On Vercel serverless, it runs once per cold start, which is acceptable.
  // For guaranteed scheduling, use Vercel Cron (see vercel.json).
  setInterval(releaseExpiredOrderStock, 5 * 60 * 1000);
  logger.info('[CRON] Interval scheduled for Expired Order Stock Release (every 5 minutes).');

  // Run immediately on startup to catch any orders that expired during downtime
  releaseExpiredOrderStock().catch(err =>
    logger.error(`[CRON] Initial stock release run failed: ${err.message}`)
  );
};
