import { ownsProduct, validateProductData } from '../../../../lib/productValidator.js';
import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/serverAuth.js';
import connectDB from '../../../../lib/connectDB.js';
import Product from '../../../../../server/models/Product.js';

export const dynamic = 'force-dynamic';

async function verifySeller(req) {
  const auth = await getAuthenticatedUser(req);
  if (!auth?.isAuthenticated || !auth.isSeller || (!auth.isAdmin && (auth.user.role !== 'seller' || auth.user.sellerStatus !== 'Approved' || auth.user.status !== 'Active'))) return null;
  return auth.user;
}

export async function GET(req) {
  try {
    await connectDB();
    const seller = await verifySeller(req);
    
    if (!seller || !seller.id) {
      return NextResponse.json({ error: 'Unauthorized merchant access' }, { status: 401 });
    }

    const products = await Product.find({
      $or: [{ vendorId: seller.id }, { sellerId: seller.id }]
    }).sort({ createdAt: -1 }).limit(100).lean();

    return NextResponse.json({
      success: true,
      count: products.length,
      products: products.filter(p => ownsProduct(p, seller))
    });

  } catch (error) {
    console.error('Seller Products GET Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch products' }, { status: 500 });
  }
}


export async function POST(req) {
  try {
    const seller = await verifySeller(req);
    if (!seller || !seller.id) {
      return NextResponse.json({ error: 'Unauthorized merchant access' }, { status: 401 });
    }

    await connectDB();
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
      status: 'draft',
      stock: Number(countInStock),
      inStock: Number(countInStock) > 0,
      countInStock: Number(countInStock),
      rating: 0,
      reviewsCount: 0,
      vendorId: seller ? seller.id : null,
      sellerShopName: seller ? (seller.shopName || 'Verified Merchant') : 'Verified Merchant'
    });

    const validation = validateProductData({ id: slug, name, category: category || 'electronics', price: Number(price), originalPrice: Number(originalPrice || price), stock: Number(countInStock), image, description, specs, status: 'draft' }, seller, false);
    if (!validation.isValid) return NextResponse.json({ error: 'Invalid product', errors: validation.errors }, { status: 400 });
    Object.assign(newProduct, validation.sanitizedProduct);
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
