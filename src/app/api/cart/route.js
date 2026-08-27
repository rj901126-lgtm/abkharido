import { NextResponse } from 'next/server';
import connectDB from '../../../lib/connectDB.js';
import User from '../../../../server/models/User.js';
import Product from '../../../../server/models/Product.js';
import productsData from '../../../../server/data/productsData.js';
import { PRODUCTS } from '../../../db/mockData.js';
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

async function resolveProduct(pRef) {
  if (!pRef) return null;
  if (typeof pRef === 'object' && (pRef.name || pRef.title) && pRef.price) {
    return pRef;
  }
  const pId = typeof pRef === 'object' ? (pRef.id || pRef._id || pRef) : pRef;

  // 1. Try Mongo Product DB
  try {
    const dbProd = await Product.findOne({
      $or: [
        { id: pId },
        { slug: pId },
        { _id: pId && pId.length === 24 ? pId : undefined }
      ].filter(Boolean)
    }).lean();
    if (dbProd) return dbProd;
  } catch (e) {}

  // 2. Try productsData
  const inProductsData = (productsData || []).find(p => p.id === pId || p.slug === pId);
  if (inProductsData) return inProductsData;

  // 3. Try mockData
  const inMock = (PRODUCTS || []).find(p => p.id === pId || p.slug === pId);
  if (inMock) return inMock;

  return typeof pRef === 'object' ? pRef : { id: pId, name: 'Product Item', price: 999 };
}

export async function GET(req) {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      return NextResponse.json([]);
    }

    await connectDB();
    const user = await User.findById(userId).lean();
    if (!user || !Array.isArray(user.cart)) {
      return NextResponse.json([]);
    }

    const formattedCart = [];
    for (const item of user.cart) {
      if (!item || !item.product) continue;
      const resolved = await resolveProduct(item.product);
      if (resolved) {
        formattedCart.push({
          product: resolved,
          quantity: Math.max(1, Number(item.quantity || 1))
        });
      }
    }

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
        const rawItems = cartItems
          .map(item => {
            const prod = item.product || item;
            const pId = prod.id || prod._id || prod;
            return pId ? { product: prod, quantity: Math.max(1, Number(item.quantity || 1)) } : null;
          })
          .filter(Boolean);

        // Server-side deduplication
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
