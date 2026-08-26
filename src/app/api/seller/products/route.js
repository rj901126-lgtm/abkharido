import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '../../../../../lib/connectDB.js';
import Product from '../../../../../../server/models/Product.js';

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

export async function GET(req) {
  try {
    await connectDB();
    const seller = verifySeller(req);
    
    // Find products for seller or demo products if unauthenticated/demo
    let query = {};
    if (seller && seller.id && seller.id !== 'demo_seller_101') {
      query = { $or: [{ vendorId: seller.id }, { sellerId: seller.id }] };
    }

    let products = await Product.find(query).limit(50).lean();
    
    // Fallback sample catalog if seller has no products yet
    if (products.length === 0) {
      products = await Product.find({}).limit(8).lean();
    }

    return NextResponse.json({
      success: true,
      count: products.length,
      products
    });

  } catch (error) {
    console.error('Seller Products GET Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const seller = verifySeller(req);
    const body = await req.json().catch(() => ({}));
    const { name, category, price, originalPrice, image, description, specs, inStock = true, countInStock = 50 } = body;

    if (!name || !price) {
      return NextResponse.json({ error: 'Product name and price are required' }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + `-${Date.now().toString().slice(-4)}`;

    const newProduct = new Product({
      id: slug,
      name: name.trim(),
      category: category || 'electronics',
      price: Number(price),
      originalPrice: Number(originalPrice || price),
      image: image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
      description: description || `Premium ${name} offered with manufacturer warranty and fast dispatch.`,
      specs: specs || [],
      inStock: Boolean(inStock),
      countInStock: Number(countInStock),
      rating: 4.8,
      reviewsCount: 1,
      vendorId: seller ? seller.id : null,
      sellerShopName: seller ? (seller.shopName || 'Verified Merchant') : 'Verified Merchant'
    });

    await newProduct.save();

    return NextResponse.json({
      success: true,
      message: 'Product listed successfully on AbKharido marketplace!',
      product: newProduct
    });

  } catch (error) {
    console.error('Seller Product POST Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create product' }, { status: 500 });
  }
}
