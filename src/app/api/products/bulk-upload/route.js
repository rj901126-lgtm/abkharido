import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '../../../../lib/connectDB.js';
import Product from '../../../../../server/models/Product.js';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'abkharido_enterprise_secret_2026_super_secure';

function getAuthenticatedUser(req) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const user = getAuthenticatedUser(req);
    const body = await req.json().catch(() => ({}));
    const { products } = body;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: 'Please provide an array of products to import' }, { status: 400 });
    }

    if (products.length > 250) {
      return NextResponse.json({ error: 'Maximum 250 products allowed per batch import' }, { status: 400 });
    }

    const preparedProducts = products.map((p, idx) => {
      const slug = (p.id || p.name || 'product')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') + `-${Date.now().toString().slice(-4)}-${idx}`;

      return {
        id: slug,
        name: String(p.name).trim(),
        category: p.category || 'electronics',
        price: Number(p.price),
        originalPrice: Number(p.originalPrice || p.price),
        image: p.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
        description: p.description || `Premium ${p.name} with express delivery.`,
        brand: p.brand || 'AbKharido Verified',
        countInStock: Number(p.countInStock || 50),
        inStock: Number(p.countInStock || 50) > 0,
        rating: 4.8,
        reviewsCount: 1,
        vendorId: user ? user.id : null,
        sellerShopName: user ? (user.shopName || user.fullName || 'Verified Merchant') : (p.sellerShopName || 'AbKharido Official Store'),
        specs: p.specs || [
          { key: 'Brand', value: p.brand || 'AbKharido' },
          { key: 'Condition', value: 'Brand New (Sealed)' },
          { key: 'Warranty', value: '1 Year Warranty' }
        ]
      };
    });

    const inserted = await Product.insertMany(preparedProducts, { ordered: false });

    return NextResponse.json({
      success: true,
      message: `Successfully imported and published ${inserted.length} products to the catalog!`,
      count: inserted.length,
      products: inserted
    });

  } catch (error) {
    console.error('Bulk Upload Products Error:', error);
    // If partial insert succeeded in MongoDB insertMany
    if (error.insertedDocs && error.insertedDocs.length > 0) {
      return NextResponse.json({
        success: true,
        message: `Partially imported ${error.insertedDocs.length} products (some duplicates skipped).`,
        count: error.insertedDocs.length,
        products: error.insertedDocs
      });
    }
    return NextResponse.json({ error: error.message || 'Failed to bulk import products' }, { status: 500 });
  }
}
