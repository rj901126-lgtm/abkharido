import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/connectDB.js';
import Product from '../../../../../../server/models/Product.js';

export const dynamic = 'force-dynamic';

export async function PUT(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { price, originalPrice, countInStock, name } = body;

    const product = await Product.findOne({ $or: [{ _id: id }, { id }] });
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (price !== undefined) product.price = Number(price);
    if (originalPrice !== undefined) product.originalPrice = Number(originalPrice);
    if (countInStock !== undefined) {
      product.countInStock = Number(countInStock);
      product.inStock = Number(countInStock) > 0;
    }
    if (name) product.name = name.trim();

    await product.save();

    return NextResponse.json({
      success: true,
      message: 'Product stock & pricing updated successfully!',
      product
    });

  } catch (error) {
    console.error('Seller Product Update Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update product' }, { status: 500 });
  }
}
