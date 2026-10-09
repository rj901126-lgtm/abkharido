import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/connectDB.js';
import Product from '../../../../../server/models/Product.js';
import { PRODUCTS } from '../../../../db/mockData.js';
import { getAuthenticatedUser } from '../../../../lib/serverAuth.js';
import { toPublicProductDTO, validateProductData } from '../../../../lib/productValidator.js';

async function fetchBackend(url) {
  const hosts = [
    process.env.BACKEND_API_URL,
    'http://127.0.0.1:5000',
    'http://localhost:5000'
  ].filter(Boolean);

  const uniqueHosts = [...new Set(hosts.map(h => h.replace(/\/$/, '')))];
  for (const host of uniqueHosts) {
    try {
      const targetUrl = `${host}${url}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1500);
      const res = await fetch(targetUrl, { signal: controller.signal });
      clearTimeout(timeout);
      if (res && res.status < 500) return res;
    } catch (err) {
      // Fallback
    }
  }
  return null;
}

export async function GET(req, context) {
  try {
    const params = await context.params;
    const id = params?.id;
    if (!id || typeof id !== 'string') return NextResponse.json({ error: 'Product ID required' }, { status: 400 });

    const cleanId = id.trim().substring(0, 100);

    const lookupId = cleanId === 'sigboom-21' ? 'signature-wireless-earphone' : cleanId;

    // Try external port 5000 Express server first
    const backendRes = await fetchBackend(`/api/products/${lookupId}`);
    if (backendRes) {
      const data = await backendRes.json().catch(() => null);
      if (data && !data.error && data.status !== 'archived' && !data.isArchived) {
        return NextResponse.json(toPublicProductDTO(data));
      }
    }

    // ── Native Mongoose / MongoDB Fallback ──
    try {
      await connectDB();
      const product = await Product.findOne({ 
        $or: [
          { id: lookupId },
          { id: cleanId },
          { slug: lookupId },
          { slug: cleanId },
          { _id: cleanId.length === 24 ? cleanId : undefined }
        ].filter(Boolean) 
      }).lean();

      if (product) {
        if (product.status === 'archived' || product.isArchived) {
          return NextResponse.json(
            { error: 'Product not found' },
            { status: 404, headers: { 'X-Robots-Tag': 'noindex, nofollow' } }
          );
        }
        const isLive = product.status === 'published' || product.status === 'active';
        if (!isLive) {
          const auth = await getAuthenticatedUser(req);
          const isPrivileged = auth && (auth.isAdmin || (auth.user?.role === 'seller' && (product.sellerId === auth.user._id || product.sellerId === auth.user.id)));
          if (!isPrivileged) {
            return NextResponse.json(
              { error: 'Product not found' },
              { status: 404, headers: { 'X-Robots-Tag': 'noindex, nofollow' } }
            );
          }
        }
        return NextResponse.json(toPublicProductDTO(product));
      }
    } catch (dbErr) {
      console.warn('[Product Detail DB Fallback Warning]:', dbErr.message);
    }

    // Fallback to local catalog if not found in database
    const localProd = PRODUCTS.find(p => 
      (p.id === cleanId || p.id === lookupId || p.slug === cleanId || p._id === cleanId) &&
      (p.status === 'published' || p.status === 'active') && !p.isArchived
    );
    if (localProd) return NextResponse.json(toPublicProductDTO(localProd));

    return NextResponse.json(
      { error: 'Product not found' },
      { status: 404, headers: { 'X-Robots-Tag': 'noindex, nofollow' } }
    );
  } catch (error) {
    console.error('[Product Detail Route Error]:', error);
    return NextResponse.json({ error: 'Failed to retrieve product detail' }, { status: 500 });
  }
}

export async function PUT(req, context) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth || (!auth.isAdmin && auth.user?.role !== 'seller')) {
      return NextResponse.json({ error: 'Unauthorized: Admin or Seller access required' }, { status: 401 });
    }

    await connectDB();
    const params = await context.params;
    const id = params?.id;
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const cleanId = id.trim();
    const isObjectId = cleanId.length === 24;

    const product = await Product.findOne({
      $or: [
        { id: cleanId },
        { slug: cleanId },
        { _id: isObjectId ? cleanId : undefined }
      ].filter(Boolean)
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // If seller, check ownership
    if (!auth.isAdmin && auth.user?.role === 'seller') {
      if (product.sellerId && String(product.sellerId) !== String(auth.user._id || auth.user.id)) {
        return NextResponse.json({ error: 'Forbidden: You cannot edit another seller\'s product' }, { status: 403 });
      }
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid update payload' }, { status: 400 });
    }

    const validation = validateProductData(body, auth.user, true);
    if (!validation.isValid) {
      return NextResponse.json({ error: 'Validation failed', errors: validation.errors }, { status: 400 });
    }

    const { sanitizedProduct } = validation;

    // Record audit trail
    if (!product.auditLogs) product.auditLogs = [];
    product.auditLogs.push({
      action: 'UPDATE',
      user: auth.user.email || auth.user.id || 'admin',
      timestamp: new Date(),
      details: { changedStatus: sanitizedProduct.status, changes: Object.keys(sanitizedProduct) }
    });
    product.updatedBy = auth.user.email || auth.user.id || 'admin';

    Object.assign(product, sanitizedProduct);
    await product.save();

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      product: toPublicProductDTO(product)
    });
  } catch (error) {
    console.error('[Product PUT Route Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(req, context) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth || (!auth.isAdmin && !auth.isSeller)) {
      return NextResponse.json({ error: 'Unauthorized: Admin or Vendor access required' }, { status: 401 });
    }

    await connectDB();
    const params = await context.params;
    const id = params?.id;
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const cleanId = id.trim();
    const isObjectId = cleanId.length === 24;

    // If seller, check vendor ownership
    if (!auth.isAdmin && auth.isSeller) {
      const existingProduct = await Product.findOne({
        $or: [
          { id: cleanId },
          { slug: cleanId },
          { _id: isObjectId ? cleanId : undefined }
        ].filter(Boolean)
      });
      if (existingProduct && existingProduct.vendorId && String(existingProduct.vendorId) !== String(auth.user?.id)) {
        return NextResponse.json({ error: 'Forbidden: You cannot delete a product belonging to another seller' }, { status: 403 });
      }
    }

    const res = await Product.deleteOne({
      $or: [
        { id: cleanId },
        { slug: cleanId },
        { _id: isObjectId ? cleanId : undefined }
      ].filter(Boolean)
    });

    return NextResponse.json({
      success: true,
      message: `Product ${cleanId} removed from database`,
      deletedCount: res.deletedCount || 0
    });
  } catch (error) {
    console.error('[Product DELETE Route Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete product' }, { status: 500 });
  }
}

