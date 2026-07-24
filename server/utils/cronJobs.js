import User from '../models/User.js';
import logger from '../config/logger.js';
import { sendEmail } from './emailService.js'; // Assuming you have an email service

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

// Start local interval if not serverless
export const initCronJobs = () => {
  if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_LOCAL_CRON === 'true') {
    // Run every hour
    setInterval(processAbandonedCarts, 60 * 60 * 1000);
    logger.info('[CRON] Local interval scheduled for Abandoned Carts (every 1 hour).');
  }
};
