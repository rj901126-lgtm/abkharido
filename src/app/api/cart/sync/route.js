import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/connectDB.js';
import User from '../../../../../server/models/User.js';
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

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const userId = getUserIdFromReq(req);

    if (userId) {
      await connectDB();
      const user = await User.findById(userId);
      if (user) {
        if (body.action === 'clear') {
          user.cart = [];
        } else if (Array.isArray(body.cart)) {
          user.cart = body.cart
            .map(item => {
              const prod = item.product || item;
              const pId = prod.id || prod._id || prod;
              return pId ? { product: prod, quantity: Math.max(1, Number(item.quantity || 1)) } : null;
            })
            .filter(Boolean);
        }
        user.cartUpdatedAt = new Date();
        await user.save();
      }
    }

    return NextResponse.json({ success: true, cart: body.cart || [] });
  } catch (error) {
    console.error('POST /api/cart/sync error:', error);
    return NextResponse.json({ success: true, cart: [] });
  }
}
