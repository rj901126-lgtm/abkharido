import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/connectDB.js';
import Product from '../../../../../server/models/Product.js';
import { PRODUCTS } from '../../../../db/mockData.js';

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

export async function GET(req, context) {
  try {
    const params = await context.params;
    const id = params?.id;
    if (!id || typeof id !== 'string') return NextResponse.json({ error: 'Product ID required' }, { status: 400 });

    const cleanId = id.trim().substring(0, 100);

    // Try external port 5000 Express server first
    const backendRes = await fetchBackend(`/api/products/${cleanId}`);
    if (backendRes) {
      const data = await backendRes.json().catch(() => null);
      if (data && !data.error) return NextResponse.json(data);
    }

    // ── Native Mongoose / MongoDB Fallback ──
    try {
      await connectDB();
      const product = await Product.findOne({ 
        $or: [
          { id: cleanId }, 
          { slug: cleanId }, 
          { _id: cleanId.length === 24 ? cleanId : undefined }
        ].filter(Boolean) 
      }).lean();
      if (product) return NextResponse.json(toPublicProductDTO(product));
    } catch (dbErr) {
      console.warn('[Product Detail DB Fallback Warning]:', dbErr.message);
    }

    // Fallback to local catalog if not found in database
    const localProd = PRODUCTS.find(p => p.id === cleanId || p.slug === cleanId || p._id === cleanId)
      || PRODUCTS.find(p => (p.name && p.name.toLowerCase().replace(/[^a-z0-9]/g, '-').includes(cleanId.toLowerCase())));
    if (localProd) return NextResponse.json(toPublicProductDTO(localProd));

    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  } catch (error) {
    console.error('[Product Detail Route Error]:', error);
    return NextResponse.json({ error: 'Failed to retrieve product detail' }, { status: 500 });
  }
}
