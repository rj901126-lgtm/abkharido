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
          const rawItems = body.cart
            .map(item => {
              const prod = item.product || item;
              const pId = prod.id || prod._id || prod;
              return pId ? { product: prod, quantity: Math.max(1, Number(item.quantity || 1)) } : null;
            })
            .filter(Boolean);

          const deduplicated = [];
          for (const item of rawItems) {
            const itemPId = String(item.product?.id || item.product?._id || item.product || '');
            const itemVar = String(item.product?.selectedVariant || item.product?.variant || '').toLowerCase().trim();
            const itemCol = String(item.product?.selectedColor || item.product?.color || '').toLowerCase().trim();

            const existing = deduplicated.find(d => {
              const dPId = String(d.product?.id || d.product?._id || d.product || '');
              const dVar = String(d.product?.selectedVariant || d.product?.variant || '').toLowerCase().trim();
              const dCol = String(d.product?.selectedColor || d.product?.color || '').toLowerCase().trim();
              return (itemPId && dPId && itemPId === dPId) && (itemVar === dVar) && (itemCol === dCol);
            });

            if (existing) {
              existing.quantity = Math.max(existing.quantity, item.quantity);
            } else {
              deduplicated.push(item);
            }
          }

          user.cart = deduplicated;
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
