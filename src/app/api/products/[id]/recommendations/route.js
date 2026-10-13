import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '../../../../../lib/connectDB.js';
import Product from '../../../../../../server/models/Product.js';
import { toPublicProductDTO } from '../../../../../lib/productValidator.js';
export const dynamic = 'force-dynamic';
export async function GET(req, { params }) {
  try {
    const { id } = await params;
    if (typeof id !== 'string' || !id) return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    await connectDB();
    const live = { status: { $in: ['published','active'] }, isArchived: { $ne: true }, stock: { $gt: 0 } };
    const lookup = [{ id }];
    if (mongoose.isValidObjectId(id)) lookup.push({ _id: id });
    const product = await Product.findOne({ ...live, $or: lookup }).lean();
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    let recommendations = await Product.find({ ...live, category: product.category, _id: { $ne: product._id } }).limit(4).lean();
    if (recommendations.length < 4) recommendations = [...recommendations, ...await Product.find({ ...live, _id: { $nin: [product._id, ...recommendations.map(p => p._id)] } }).limit(4-recommendations.length).lean()];
    return NextResponse.json(recommendations.map(toPublicProductDTO));
  } catch { return NextResponse.json({ error: 'Failed to retrieve recommendations' }, { status: 500 }); }
}
