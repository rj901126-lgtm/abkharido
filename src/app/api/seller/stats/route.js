import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '../../../../lib/connectDB.js';
import Order from '../../../../../server/models/Order.js';
import Product from '../../../../../server/models/Product.js';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'abkharido_enterprise_secret_2026_super_secure';

function verifySeller(req) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export async function GET(req) {
  try {
    await connectDB();
    const seller = verifySeller(req);

    if (!seller || !seller.id) {
      return NextResponse.json({ error: 'Unauthorized merchant access' }, { status: 401 });
    }

    // Compute real metrics for this authenticated seller
    const totalProducts = await Product.countDocuments({
      $or: [{ vendorId: seller.id }, { sellerId: seller.id }]
    });

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

    sellerOrders.forEach(ord => {
      const items = ord.orderItems || ord.items || [];
      items.forEach(it => {
        if (String(it.vendorId) === String(seller.id) || ord.vendorId === seller.id) {
          totalRevenue += (Number(it.price) || 0) * (Number(it.qty || it.quantity) || 1);
          unitsSold += (Number(it.qty || it.quantity) || 1);
        }
      });
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalRevenue,
        totalOrders,
        totalProducts,
        unitsSold,
        walletBalance: 0,
        pendingPayout: 0,
        shopName: seller.shopName || 'Verified Merchant Store'
      }
    });

  } catch (error) {
    console.error('Seller Stats Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch seller stats' }, { status: 500 });
  }
}

