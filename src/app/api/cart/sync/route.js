import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/connectDB.js';
import User from '../../../../../server/models/User.js';
import { getAuthenticatedUser } from '../../../../lib/serverAuth.js';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const auth = await getAuthenticatedUser(req);
    const userId = auth?.user?.id || null;

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
