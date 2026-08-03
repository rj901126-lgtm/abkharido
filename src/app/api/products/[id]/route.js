import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/connectDB.js';
import Product from '../../../../../server/models/Product.js';
import { PRODUCTS } from '../../../../db/mockData.js';

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
      // Continue to next host or native DB fallback
    }
  }
  return null;
}

export async function GET(req, { params }) {
  try {
    const id = params?.id;
    if (!id) return NextResponse.json({ error: 'Product ID required' }, { status: 400 });

    // Try external port 5000 Express server first
    const backendRes = await fetchBackend(`/api/products/${id}`);
    if (backendRes) {
      const data = await backendRes.json().catch(() => null);
      if (data && !data.error) return NextResponse.json(data);
    }

    // ── Native Mongoose / MongoDB Fallback when port 5000 is offline ──
    try {
      await connectDB();
      const product = await Product.findOne({ $or: [{ id }, { _id: id.length === 24 ? id : undefined }].filter(Boolean) });
      if (product) return NextResponse.json(product);
    } catch (dbErr) {
      console.warn('[Product Detail DB Fallback Warning]:', dbErr.message);
    }

    // Fallback to local catalog if not found in database
    const localProd = PRODUCTS.find(p => p.id === id || p._id === id);
    if (localProd) return NextResponse.json(localProd);

    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  } catch (error) {
    console.error('[Product Detail Route Error]:', error);
    return NextResponse.json({ error: 'Failed to retrieve product detail' }, { status: 500 });
  }
}
