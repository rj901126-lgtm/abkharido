import { validateProductData } from '../../../../lib/productValidator.js';
import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/connectDB.js';
import Product from '../../../../../server/models/Product.js';
import { getAuthenticatedUser } from '../../../../lib/serverAuth.js';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth || (!auth.isAdmin && !auth.isSeller)) {
      return NextResponse.json({ error: 'Unauthorized: Admin or Vendor credentials required for bulk product import' }, { status: 401 });
    }

    await connectDB();
    const user = auth.user;
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
        stock: Number(p.stock ?? p.countInStock ?? 0),
        status: auth.isAdmin && ['published','active'].includes(p.status) ? p.status : 'draft',
        inStock: Number(p.countInStock || 50) > 0,
        rating: 0,
        reviewsCount: 0,
        vendorId: user && /^[0-9a-fA-F]{24}$/.test(String(user.id)) ? user.id : undefined,
        sellerId: user && /^[0-9a-fA-F]{24}$/.test(String(user.id)) ? String(user.id) : undefined,
        sellerShopName: user ? (user.shopName || user.fullName || 'Verified Merchant') : (p.sellerShopName || 'AbKharido Official Store'),
        specs: p.specs || [
          { key: 'Brand', value: p.brand || 'AbKharido' },
          { key: 'Condition', value: 'Brand New (Sealed)' },
          { key: 'Warranty', value: '1 Year Warranty' }
        ]
      };
    });

    for (const p of preparedProducts) {
      const candidate = { ...p }; delete candidate.vendorId; delete candidate.sellerId; delete candidate.sellerShopName;
      const result = validateProductData(candidate, user, false);
      if (!result.isValid) return NextResponse.json({ error: 'Invalid product batch', errors: result.errors }, { status: 400 });
      Object.assign(p, result.sanitizedProduct);
    }
    const inserted = await Product.insertMany(preparedProducts, { ordered: true });

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
