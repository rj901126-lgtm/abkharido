import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/connectDB.js';
import User from '../../../../../server/models/User.js';
import Order from '../../../../../server/models/Order.js';
import Product from '../../../../../server/models/Product.js';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'secret123';

function getUserIdFromReq(req) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    if (!authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.split(' ')[1];
    if (!token) return null;
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.id || decoded._id || decoded.userId || null;
  } catch (err) {
    return null;
  }
}

export async function GET(req) {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      return NextResponse.json({ success: false, items: [], message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(userId).lean();
    if (!user) {
      return NextResponse.json({ success: false, items: [], message: 'User not found' }, { status: 404 });
    }

    // Fetch user's orders (excluding cancelled/returned)
    const orders = await Order.find({
      user: user._id,
      status: { $nin: ['Cancelled', 'Returned'] }
    }).sort({ createdAt: -1 }).lean();

    const now = new Date();
    const expiringItems = [];
    const seenProductKeys = new Set();

    for (const order of orders) {
      if (!Array.isArray(order.orderItems)) continue;

      for (const item of order.orderItems) {
        if (!item || !item.name) continue;

        let expiryDate = item.expiryDate ? new Date(item.expiryDate) : null;
        let isReplenishable = Boolean(item.isReplenishable);

        // Fallback: If order item didn't store expiryDate directly, check linked Product
        if (!expiryDate && item.product) {
          try {
            const dbProduct = await Product.findById(item.product).lean();
            if (dbProduct) {
              const shelfLife = Number(dbProduct.shelfLifeDays || 0);
              const repCycle = Number(dbProduct.replenishCycleDays || 0);
              const orderDate = new Date(order.createdAt || now);

              if (dbProduct.expiryDate) {
                expiryDate = new Date(dbProduct.expiryDate);
                isReplenishable = true;
              } else if (shelfLife > 0) {
                expiryDate = new Date(orderDate.getTime() + shelfLife * 24 * 60 * 60 * 1000);
                isReplenishable = true;
              } else if (repCycle > 0) {
                expiryDate = new Date(orderDate.getTime() + repCycle * 24 * 60 * 60 * 1000);
                isReplenishable = true;
              }
            }
          } catch (_) {}
        }

        if (!expiryDate) continue;

        const diffMs = expiryDate.getTime() - now.getTime();
        const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        // Remind if expiring within 7 days (or overdue within last 30 days)
        if (daysLeft <= 7 && daysLeft >= -30) {
          const dedupeKey = `${String(item.product || item.name)}_${item.variant || ''}_${item.color || ''}`;
          if (seenProductKeys.has(dedupeKey)) continue;
          seenProductKeys.add(dedupeKey);

          let urgency = 'warning';
          let statusText = `Expiring in ${daysLeft} days`;
          if (daysLeft <= 0) {
            urgency = 'overdue';
            statusText = daysLeft === 0 ? 'Expiring Today' : `Expired ${Math.abs(daysLeft)} days ago`;
          } else if (daysLeft <= 3) {
            urgency = 'critical';
            statusText = daysLeft === 1 ? 'Expires Tomorrow!' : `Expiring in ${daysLeft} days!`;
          }

          expiringItems.push({
            orderId: order._id,
            productRef: item.product,
            name: item.name,
            image: item.image,
            price: item.price,
            color: item.color || '',
            variant: item.variant || '',
            qty: item.qty || 1,
            expiryDate: expiryDate.toISOString(),
            daysLeft,
            urgency,
            statusText,
            orderDate: order.createdAt,
            reorderCoinBonus: 25 // 25 bonus AB coins on replenishment
          });
        }
      }
    }

    // Sort by most urgent first
    expiringItems.sort((a, b) => a.daysLeft - b.daysLeft);

    return NextResponse.json({
      success: true,
      count: expiringItems.length,
      items: expiringItems
    });
  } catch (error) {
    console.error('GET /api/user/expiring-products error:', error);
    return NextResponse.json({ success: false, items: [], message: error.message }, { status: 500 });
  }
}
