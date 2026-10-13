import { ownsProduct, validateProductData } from '../../../../../lib/productValidator.js';
import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../../lib/serverAuth.js';
import connectDB from '../../../../../lib/connectDB.js';
import Product from '../../../../../../server/models/Product.js';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

async function verifySeller(req) {
  const auth = await getAuthenticatedUser(req);
  if (!auth?.isAuthenticated || !auth.isSeller || (!auth.isAdmin && (auth.user.role !== 'seller' || auth.user.sellerStatus !== 'Approved' || auth.user.status !== 'Active'))) return null;
  return auth.user;
}

export async function PUT(req, { params }) {
  try {
    const seller = await verifySeller(req);
    if (!seller || !seller.id) {
      return NextResponse.json({ error: 'Unauthorized merchant access' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { price, originalPrice, countInStock, name } = body;

    let product = null;
    if (id && mongoose.Types.ObjectId.isValid(id)) {
      product = await Product.findById(id);
    }
    if (!product && id) {
      product = await Product.findOne({ id: id });
    }

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const isOwner = ownsProduct(product, seller) || ['admin','super_admin'].includes(seller.role);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to modify this product' }, { status: 403 });
    }

    const validation = validateProductData({ ...body, ...(countInStock !== undefined ? { stock: Number(countInStock) } : {}) }, seller, true);
    if (!validation.isValid) return NextResponse.json({ error: 'Invalid product update', errors: validation.errors }, { status: 400 });
    if (price !== undefined) product.price = Number(price);
    if (originalPrice !== undefined) product.originalPrice = Number(originalPrice);
    if (countInStock !== undefined) {
      product.stock = Number(countInStock);
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
