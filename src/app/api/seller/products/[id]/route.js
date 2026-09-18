import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '../../../../../lib/connectDB.js';
import Product from '../../../../../../server/models/Product.js';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'abkharido_enterprise_secret_2026_super_secure';

function verifySeller(req) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export async function PUT(req, { params }) {
  try {
    const seller = verifySeller(req);
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

    const isOwner = product.vendorId === seller.id || product.sellerId === seller.id || seller.role === 'admin' || seller.role === 'super_admin';
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to modify this product' }, { status: 403 });
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
