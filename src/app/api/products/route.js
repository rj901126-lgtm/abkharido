import { NextResponse } from 'next/server';
import connectDB from '../../../lib/connectDB.js';
import Product from '../../../../server/models/Product.js';
import { PRODUCTS } from '../../../db/mockData.js';
import { getAuthenticatedUser } from '../../../lib/serverAuth.js';
import { toPublicProductDTO, validateProductData } from '../../../lib/productValidator.js';

async function fetchBackend(url) {
  const hosts = [
    process.env.BACKEND_API_URL,
    'http://127.0.0.1:5000',
    'http://localhost:5000'
  ].filter(Boolean);

  const uniqueHosts = [...new Set(hosts.map(h => h.replace(/\/$/, '')))];
  for (const host of uniqueHosts) {
    try {
      const targetUrl = `${host}${url}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1500);
      const res = await fetch(targetUrl, { signal: controller.signal });
      clearTimeout(timeout);
      if (res && res.status < 500) return res;
    } catch (err) {
      // Fallback
    }
  }
  return null;
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const category = (searchParams.get('category') || '').trim();
    const search = (searchParams.get('search') || searchParams.get('q') || '').trim();
    const seller = (searchParams.get('seller') || '').trim();
    const rawLimit = parseInt(searchParams.get('limit') || '20', 10);
    const rawPage = parseInt(searchParams.get('page') || '1', 10);

    const limit = !isNaN(rawLimit) && rawLimit >= 1 && rawLimit <= 50 ? rawLimit : 20;
    const page = !isNaN(rawPage) && rawPage >= 1 ? rawPage : 1;

    // Try external Express backend first
    const queryString = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...(category ? { category } : {}),
      ...(search ? { search } : {}),
      ...(seller ? { seller } : {})
    }).toString();

    const path = `/api/products?${queryString}`;
    const backendRes = await fetchBackend(path);
    
    if (backendRes) {
      const data = await backendRes.json().catch(() => null);
      if (data && data.products) {
        return NextResponse.json({
          ...data,
          products: (data.products || []).map(toPublicProductDTO)
        });
      }
    }

    // ── Native Mongoose / MongoDB Fallback ──
    try {
      await connectDB();
      let filter = {
        status: { $in: ['published', 'active'], $ne: 'archived' },
        isArchived: { $ne: true }
      };
      if (category && category !== 'all') {
        const escapedCat = category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        filter.category = { $regex: new RegExp(`^${escapedCat}$`, 'i') };
      }
      if (search) {
        const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        filter.$or = [
          { name: { $regex: escapedSearch, $options: 'i' } },
          { description: { $regex: escapedSearch, $options: 'i' } },
          { category: { $regex: escapedSearch, $options: 'i' } }
        ];
      }
      if (seller) {
        const escapedSeller = seller.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/-/g, '[ -]');
        filter.sellerShopName = { $regex: new RegExp(escapedSeller, 'i') };
      }

      let total = await Product.countDocuments(filter);
      let query = Product.find(filter).lean();
      if (limit > 0) {
        query = query.skip((page - 1) * limit).limit(limit);
      }
      let products = await query;

      if (!products || (products.length === 0 && total === 0)) {
        let fallback = PRODUCTS.filter(p => p.status !== 'archived' && !p.isArchived && (p.status === 'published' || p.status === 'active'));
        if (category && category !== 'all') {
          fallback = fallback.filter(p => p.category && p.category.toLowerCase() === category.toLowerCase());
        }
        if (search) {
          const s = search.toLowerCase();
          fallback = fallback.filter(p => p.name?.toLowerCase().includes(s) || p.description?.toLowerCase().includes(s));
        }
        if (seller) {
          const sClean = seller.toLowerCase().replace(/[^a-z0-9]/g, '');
          fallback = fallback.filter(p => {
            const pS = (p.sellerShopName || p.sellerName || 'abkharido-official-store').toLowerCase().replace(/[^a-z0-9]/g, '');
            return pS === sClean || pS.includes(sClean);
          });
        }
        return NextResponse.json({
          products: fallback.slice(0, limit).map(toPublicProductDTO),
          total: fallback.length,
          page,
          limit,
          totalPages: Math.ceil(fallback.length / limit) || 1
        });
      }


      return NextResponse.json({
        products: products.map(toPublicProductDTO),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1
      });
    } catch (dbError) {
      console.warn('[Products Native API] DB fallback, using mock catalog:', dbError.message);
      let fallback = PRODUCTS.filter(p => p.status !== 'archived' && !p.isArchived && (p.status === 'published' || p.status === 'active'));
      if (category && category !== 'all') {
        fallback = fallback.filter(p => p.category && p.category.toLowerCase() === category.toLowerCase());
      }
      return NextResponse.json({
        products: fallback.slice(0, limit).map(toPublicProductDTO),
        total: fallback.length,
        page,
        limit,
        totalPages: 1
      });
    }
  } catch (error) {
    console.error('[Products API Route Error]:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth || (!auth.isAdmin && !auth.isSeller)) {
      return NextResponse.json({ error: 'Unauthorized: Admin or Seller access required' }, { status: 401 });
    }

    await connectDB();
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid product payload' }, { status: 400 });
    }

    const validation = validateProductData(body, auth.user, false);
    if (!validation.isValid) {
      return NextResponse.json({ error: 'Validation failed', errors: validation.errors }, { status: 400 });
    }

    const { sanitizedProduct } = validation;

    // Check if ID already exists
    const existing = await Product.findOne({ id: sanitizedProduct.id }).lean();
    if (existing) {
      return NextResponse.json({ error: `Product with ID "${sanitizedProduct.id}" already exists.` }, { status: 409 });
    }

    // Set owner / seller linkage
    if (!auth.isAdmin && auth.user?.role === 'seller') {
      sanitizedProduct.sellerId = auth.user._id || auth.user.id;
      sanitizedProduct.sellerShopName = auth.user.shopName || 'Verified Partner Store';
      sanitizedProduct.channel = '3P';
    } else if (auth.isAdmin) {
      sanitizedProduct.channel = sanitizedProduct.channel || '1P';
      sanitizedProduct.isOfficialStore = sanitizedProduct.channel === '1P';
      if (sanitizedProduct.channel === '1P') {
        sanitizedProduct.sellerShopName = 'AbKharido Direct';
      }
    }

    // Audit trail
    sanitizedProduct.updatedBy = auth.user.email || auth.user.id || 'admin';
    sanitizedProduct.auditLogs = [{
      action: 'CREATE',
      user: auth.user.email || auth.user.id || 'admin',
      timestamp: new Date(),
      details: { status: sanitizedProduct.status, name: sanitizedProduct.name, price: sanitizedProduct.price }
    }];

    const created = await Product.create(sanitizedProduct);
    return NextResponse.json({
      success: true,
      message: 'Product created successfully',
      product: toPublicProductDTO(created)
    }, { status: 201 });
  } catch (error) {
    console.error('[Products API POST Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to create product' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth || !auth.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required to delete products' }, { status: 401 });
    }

    await connectDB();
    const body = await req.json().catch(() => ({}));
    const { ids, id, deleteAll } = body;

    let deletedCount = 0;

    if (deleteAll) {
      const res = await Product.deleteMany({});
      deletedCount = res.deletedCount || 0;
    } else if (Array.isArray(ids) && ids.length > 0) {
      const validObjectIds = ids.filter(i => typeof i === 'string' && i.length === 24);
      const res = await Product.deleteMany({
        $or: [
          { id: { $in: ids } },
          { slug: { $in: ids } },
          { _id: { $in: validObjectIds } }
        ]
      });
      deletedCount = res.deletedCount || 0;
    } else if (id) {
      const isObjectId = typeof id === 'string' && id.length === 24;
      const res = await Product.deleteOne({
        $or: [
          { id },
          { slug: id },
          { _id: isObjectId ? id : undefined }
        ].filter(Boolean)
      });
      deletedCount = res.deletedCount || 0;
    } else {
      return NextResponse.json({ error: 'Please provide product IDs to delete' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${deletedCount} product(s)`,
      deletedCount
    });
  } catch (error) {
    console.error('[Products API DELETE Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete products' }, { status: 500 });
  }
}
