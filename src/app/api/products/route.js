import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.toString();

  try {
    const connectDB = (await import('../../../lib/connectDB.js')).default;
    const mongoose = (await import('mongoose')).default;
    await connectDB();

    const Product = (await import('../../../../server/models/Product.js')).default;
    
    if (Product) {
      const limit = parseInt(searchParams.get('limit') || '100');
      const category = searchParams.get('category');
      const dbQuery = category && category !== 'all' ? { category } : {};
      
      const products = await Product.find(dbQuery).limit(limit).lean();
      return NextResponse.json(products);
    }
  } catch (err) {
    console.error('Database connection failed:', err.message);
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const connectDB = (await import('../../../lib/connectDB.js')).default;
    await connectDB();
    
    const Product = (await import('../../../../server/models/Product.js')).default;
    
    if (Product) {
      const product = new Product(body);
      await product.save();
      return NextResponse.json(product, { status: 201 });
    }
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
}
