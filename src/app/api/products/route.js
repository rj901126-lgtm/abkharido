import { NextResponse } from 'next/server';
import connectDB from '../../../lib/connectDB.js';
import { PRODUCTS as MOCK_PRODUCTS } from '../../../db/mockData.js';
import mongoose from 'mongoose';

// Reuse the exact Product model from server/models
const variantSchema = new mongoose.Schema({
  name: { type: String }, price: { type: Number }, originalPrice: { type: Number },
  discount: { type: Number }, stock: { type: Number, default: 0 }, sku: { type: String }
}, { _id: false });

const colorModelSchema = new mongoose.Schema({
  name: { type: String }, primaryImage: { type: String }, imagesInput: { type: String },
  images: [{ type: String }], variants: [variantSchema]
}, { _id: false });

const specSchema = new mongoose.Schema({
  key: { type: String }, value: { type: String }
}, { _id: false });

const productSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  originalPrice: { type: Number, required: true },
  inStock: { type: Boolean, default: true },
  stock: { type: Number, default: 0 },
  sku: { type: String },
  hsnCode: { type: String },
  flashSale: { isActive: { type: Boolean, default: false }, price: { type: Number }, endTime: { type: Date } },
  image: { type: String },
  images: [{ type: String }],
  rating: { type: Number, default: 4.5 },
  reviewsCount: { type: Number, default: 0 },
  seo: { metaTitle: { type: String }, metaDescription: { type: String }, keywords: { type: String } },
  userCommissionRate: { type: Number, default: 0.02 },
  sellerId: { type: String },
  highlights: [{ type: String }],
  features: [{ type: String }],
  specs: [specSchema],
  colorModels: [colorModelSchema]
}, { timestamps: true });

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '100');
  const category = searchParams.get('category');

  try {
    await connectDB();
    const query = category && category !== 'all' ? { category } : {};
    const dbProducts = await Product.find(query).limit(limit).lean();

    if (dbProducts && dbProducts.length > 0) {
      return NextResponse.json(dbProducts);
    }
    // Fallback to mock if DB is empty
    return NextResponse.json(MOCK_PRODUCTS.slice(0, limit));
  } catch (err) {
    console.error('DB products fetch failed, using mock data:', err.message);
    // Fallback to mock data if DB connection fails
    let results = MOCK_PRODUCTS;
    if (category && category !== 'all') results = results.filter(p => p.category === category);
    return NextResponse.json(results.slice(0, limit));
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const product = new Product(body);
    await product.save();
    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
