import { releaseExpiredOrderStock } from '../server/utils/cronJobs.js';
import connectDB from '../server/config/db.js';
import mongoose from 'mongoose';

/**
 * Vercel Cron Job Handler — /api/cron/release-stock
 *
 * This endpoint is called by Vercel's built-in cron scheduler every 5 minutes
 * (configured in vercel.json). It triggers the stock-release job that finds
 * expired Pending orders and atomically cancels them + restores their inventory.
 *
 * Security: Protected by CRON_SECRET environment variable. Vercel automatically
 * sends Authorization: Bearer <CRON_SECRET> with every cron invocation.
 * Set CRON_SECRET in your Vercel environment variables dashboard.
 */
export default async function handler(req, res) {
  // Only allow GET (Vercel Cron uses GET)
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate cron secret to prevent unauthorized triggers
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Ensure DB is connected (Vercel serverless functions are stateless)
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    await releaseExpiredOrderStock();

    return res.status(200).json({ success: true, message: 'Stock release job completed.' });
  } catch (error) {
    console.error('[CRON ENDPOINT] releaseExpiredOrderStock failed:', error);
    return res.status(500).json({ error: 'Cron job failed', message: error.message });
  }
}
