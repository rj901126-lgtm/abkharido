import { NextResponse } from 'next/server';
import connectDB from '../../../lib/connectDB.js';
import Product from '../../../../server/models/Product.js';
import { PRODUCTS } from '../../../db/mockData.js';

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
      // Continue to next host or Mongoose fallback
    }
  }
  return null;
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || '';
    const search = searchParams.get('search') || '';
    const limit = Number(searchParams.get('limit') || 100);
    const page = Number(searchParams.get('page') || 1);

    // Try external port 5000 Express service first
    const queryString = searchParams.toString();
    const path = `/api/products${queryString ? '?' + queryString : ''}`;
    const backendRes = await fetchBackend(path);
    
    if (backendRes) {
      const data = await backendRes.json().catch(() => null);
      if (data && data.products) {
        return NextResponse.json(data);
      }
    }

    // ── Native Mongoose / MongoDB Fallback when port 5000 is offline ──
    try {
      await connectDB();
      let filter = {};
      if (category && category !== 'all') {
        filter.category = { $regex: new RegExp(`^${category}$`, 'i') };
      }
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } }
        ];
      }

      let total = await Product.countDocuments(filter);
      let query = Product.find(filter);
      if (limit > 0) {
        query = query.skip((page - 1) * limit).limit(limit);
      }
      let products = await query;

      // If database returns empty or wasn't seeded yet, fall back to filtered mock data
      if (!products || products.length === 0 && total === 0) {
        let fallback = [...PRODUCTS];
        if (category && category !== 'all') {
          fallback = fallback.filter(p => p.category && p.category.toLowerCase() === category.toLowerCase());
        }
        if (search) {
          const s = search.toLowerCase();
          fallback = fallback.filter(p => p.name?.toLowerCase().includes(s) || p.description?.toLowerCase().includes(s));
        }
        return NextResponse.json({
          products: fallback.slice(0, limit),
          total: fallback.length,
          page,
          limit,
          totalPages: Math.ceil(fallback.length / (limit || 1))
        });
      }

      return NextResponse.json({
        products,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / (limit || 1))
      });
    } catch (dbError) {
      console.warn('[Products Native API] DB query error, using local filtered catalog:', dbError.message);
      let fallback = [...PRODUCTS];
      if (category && category !== 'all') {
        fallback = fallback.filter(p => p.category && p.category.toLowerCase() === category.toLowerCase());
      }
      return NextResponse.json({
        products: fallback.slice(0, limit),
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
