import { NextResponse } from 'next/server';
import connectDB from '../../../lib/connectDB.js';
import Product from '../../../../server/models/Product.js';
import { PRODUCTS } from '../../../db/mockData.js';

// Public Product DTO Serializer
function toPublicProductDTO(product) {
  if (!product) return null;
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    description: product.description,
    price: product.price,
    originalPrice: product.originalPrice,
    inStock: Boolean(product.inStock !== false && (product.stock === undefined || product.stock > 0)),
    image: product.image,
    images: product.images && product.images.length > 0 ? product.images : (product.image ? [product.image] : []),
    rating: product.rating || 4.5,
    reviewsCount: product.reviewsCount || 0,
    highlights: product.highlights || [],
    features: product.features || [],
    specs: product.specs || [],
    specifications: product.specifications || product.specs || [],
    colorModels: (product.colorModels || []).map(cm => ({
      name: cm.name,
      primaryImage: cm.primaryImage,
      images: cm.images || [],
      variants: (cm.variants || []).map(v => ({
        name: v.name,
        price: v.price,
        originalPrice: v.originalPrice,
        discount: v.discount
      }))
    })),
    hasProCare: Boolean(product.hasProCare),
    sellerShopName: product.sellerShopName || product.sellerName || 'AbKharido Official Store',
    sellerId: product.sellerId || product.seller || '',
    flashSale: product.flashSale?.isActive ? {
      isActive: true,
      price: product.flashSale.price,
      endTime: product.flashSale.endTime
    } : undefined
  };
}

async function fetchBackend(url) {
  const hosts = [
    process.env.BACKEND_API_URL,
    'http://127.0.0.1:5000',
    'http://localhost:5000',
    'http://16.16.195.180:5000'
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
    const search = (searchParams.get('search') || '').trim();
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
        return NextResponse.json(data);
      }
    }

    // ── Native Mongoose / MongoDB Fallback ──
    try {
      await connectDB();
      let filter = {};
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
        let fallback = [...PRODUCTS];
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
      let fallback = [...PRODUCTS];
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
