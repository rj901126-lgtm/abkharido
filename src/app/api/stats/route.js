import { NextResponse } from 'next/server';

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

export async function GET() {
  // Try AWS Backend first
  const backendRes = await tryBackend('/api/stats');
  if (backendRes) {
    const data = await backendRes.json();
    return NextResponse.json(data);
  }

  // Fallback: return basic stats from MongoDB
  try {
    const connectDB = (await import('../../../lib/connectDB.js')).default;
    const mongoose = (await import('mongoose')).default;
    await connectDB();
    const Product = mongoose.models.Product;
    const totalProducts = Product ? await Product.countDocuments() : 0;
    return NextResponse.json({ totalProducts, totalOrders: 0, totalUsers: 0, totalRevenue: 0 });
  } catch {
    return NextResponse.json({ totalProducts: 0, totalOrders: 0, totalUsers: 0, totalRevenue: 0 });
  }
}

export async function POST(request) {
  const body = await request.json();
  const backendRes = await tryBackend('/api/stats', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (backendRes) return NextResponse.json(await backendRes.json());
  return NextResponse.json({ success: true });
}
