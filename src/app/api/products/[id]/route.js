import { PRODUCTS } from '../../../../db/mockData.js';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const { id } = await params;
  const product = PRODUCTS.find(p => p.id === id || p._id === id);
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }
  return NextResponse.json(product);
}

export async function PUT(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  return NextResponse.json({ ...body, id, message: 'Product updated (mock)' });
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  return NextResponse.json({ message: `Product ${id} deleted (mock)` });
}
