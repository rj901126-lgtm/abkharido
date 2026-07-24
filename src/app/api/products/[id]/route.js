import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/connectDB.js';
import mongoose from 'mongoose';

const Product = mongoose.models.Product || mongoose.model('Product', new mongoose.Schema({
  id: String, name: String, category: String, description: String,
  price: Number, originalPrice: Number, inStock: Boolean, stock: Number,
  image: String, images: [String], rating: Number, reviewsCount: Number,
  highlights: [String], features: [String],
  specs: [{ key: String, value: String }],
  colorModels: mongoose.Schema.Types.Mixed,
  flashSale: mongoose.Schema.Types.Mixed,
  sellerId: String, userCommissionRate: Number
}, { timestamps: true }));

export async function GET(request, { params }) {
  const { id } = await params;
  try {
    await connectDB();
    // Try by custom id field first, then by _id
    const product = await Product.findOne({ $or: [{ id }, { _id: mongoose.isValidObjectId(id) ? id : null }] }).lean();
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    return NextResponse.json(product);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const { id } = await params;
  try {
    await connectDB();
    const body = await request.json();
    const product = await Product.findOneAndUpdate(
      { $or: [{ id }, { _id: mongoose.isValidObjectId(id) ? id : null }] },
      body,
      { new: true }
    );
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    return NextResponse.json(product);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  try {
    await connectDB();
    await Product.findOneAndDelete({ $or: [{ id }, { _id: mongoose.isValidObjectId(id) ? id : null }] });
    return NextResponse.json({ message: 'Product deleted' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
