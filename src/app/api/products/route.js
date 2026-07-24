import { NextResponse } from 'next/server';
import { PRODUCTS as MOCK_PRODUCTS } from '../../../db/mockData.js';

const BACKEND = process.env.BACKEND_API_URL;

async function tryBackend(path, options = {}) {
  if (!BACKEND) return null;
  try {
    const res = await fetch(`${BACKEND}${path}`, {
      ...options,
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) return res;
    return null;
  } catch {
    return null;
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.toString();

  // 1. Try AWS Backend first
  const backendRes = await tryBackend(`/api/products${query ? '?' + query : ''}`);
  if (backendRes) {
    const data = await backendRes.json();
    return NextResponse.json(data);
  }

  // 2. Fallback: Direct MongoDB
  try {
    const connectDB = (await import('../../../lib/connectDB.js')).default;
    const mongoose = (await import('mongoose')).default;
    await connectDB();

    const Product = mongoose.models.Product;
    if (Product) {
      const limit = parseInt(searchParams.get('limit') || '100');
      const category = searchParams.get('category');
      const query = category && category !== 'all' ? { category } : {};
      const products = await Product.find(query).limit(limit).lean();
      if (products.length > 0) return NextResponse.json(products);
    }
  } catch (err) {
    console.error('MongoDB fallback failed:', err.message);
  }

  // 3. Last resort: mockData
  const limit = parseInt(searchParams.get('limit') || '100');
  const category = searchParams.get('category');
  let results = MOCK_PRODUCTS;
  if (category && category !== 'all') results = results.filter(p => p.category === category);
  return NextResponse.json(results.slice(0, limit));
}

export async function POST(request) {
  const body = await request.json();

  // Try AWS Backend first
  const backendRes = await tryBackend('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...Object.fromEntries(request.headers) },
    body: JSON.stringify(body),
  });
  if (backendRes) {
    const data = await backendRes.json();
    return NextResponse.json(data, { status: 201 });
  }

  // Fallback: MongoDB direct
  try {
    const connectDB = (await import('../../../lib/connectDB.js')).default;
    const mongoose = (await import('mongoose')).default;
    await connectDB();
    const Product = mongoose.models.Product;
    if (Product) {
      const product = new Product(body);
      await product.save();
      return NextResponse.json(product, { status: 201 });
    }
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  return NextResponse.json({ error: 'Backend unavailable' }, { status: 503 });
}
