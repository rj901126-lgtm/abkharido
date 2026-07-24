import { PRODUCTS } from '../../../db/mockData.js';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '100');
  const category = searchParams.get('category');

  let results = PRODUCTS;
  if (category && category !== 'all') {
    results = results.filter(p => p.category === category);
  }
  results = results.slice(0, limit);

  return NextResponse.json(results);
}

export async function POST(request) {
  // Mock product creation - just echo back with an ID
  const body = await request.json();
  return NextResponse.json({ ...body, _id: Date.now().toString(), message: 'Product added (mock)' }, { status: 201 });
}
