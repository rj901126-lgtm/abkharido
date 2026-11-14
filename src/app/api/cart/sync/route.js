import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/connectDB.js';
import User from '../../../../../server/models/User.js';
import { getAuthenticatedUser } from '../../../../lib/serverAuth.js';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body) || (body.action !== 'clear' && !Array.isArray(body.cart))) {
      return NextResponse.json({ error: 'Invalid cart data' }, { status: 400 });
    }
    let syncedCart = body.cart || [];
    const auth = await getAuthenticatedUser(req);
    const userId = auth?.user?.id || null;
    if (!userId) return NextResponse.json({ error: 'Login required' }, { status: 401 });

    await connectDB();
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (user) {
        if (body.action === 'clear') {
          user.cart = [];
        } else if (Array.isArray(body.cart)) {
          const sourceItems = body.merge === true
            ? [...(Array.isArray(user.cart) ? user.cart : []), ...body.cart]
            : body.cart;
          const rawItems = sourceItems
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
        syncedCart = user.cart;
    }

    return NextResponse.json({ success: true, cart: syncedCart });
  } catch (error) {
    console.error('POST /api/cart/sync error:', error);
    return NextResponse.json({ error: 'Unable to sync cart' }, { status: 500 });
  }
}
