import { NextResponse } from 'next/server';
import connectDB from '../../../lib/connectDB.js';
import User from '../../../../server/models/User.js';
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
      return NextResponse.json([]);
    }

    await connectDB();
    const user = await User.findById(userId).populate('cart.product');
    if (!user || !user.cart) {
      return NextResponse.json([]);
    }

    const formattedCart = user.cart
      .filter(item => item && item.product)
      .map(item => ({
        product: typeof item.product.toObject === 'function' ? item.product.toObject() : item.product,
        quantity: item.quantity || 1
      }));

    return NextResponse.json(formattedCart);
  } catch (error) {
    console.error('GET /api/cart error:', error);
    return NextResponse.json([]);
  }
}

export async function POST(req) {
  try {
    const userId = getUserIdFromReq(req);
    const body = await req.json().catch(() => ({}));
    const cartItems = Array.isArray(body.cart) ? body.cart : [];

    if (userId) {
      await connectDB();
      const user = await User.findById(userId);
      if (user) {
        user.cart = cartItems
          .map(item => {
            const pId = item.product?.id || item.product?._id || item.product;
            return pId ? { product: pId, quantity: item.quantity || 1 } : null;
          })
          .filter(Boolean);
        user.cartUpdatedAt = new Date();
        await user.save();
      }
    }

    return NextResponse.json({ success: true, cart: cartItems });
  } catch (error) {
    console.error('POST /api/cart error:', error);
    return NextResponse.json({ success: true, cart: [] });
  }
}
