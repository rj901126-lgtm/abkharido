import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/connectDB.js';
import Product from '../../../../../../server/models/Product.js';
import productsData from '../../../../../../server/data/productsData.js';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export async function GET(req, { params }) {
  try {
    const resolvedParams = await params;
    const rawId = resolvedParams?.id || '';

    if (!rawId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    let product = null;
    let recommendations = [];

    try {
      await connectDB();
      product = await Product.findOne({ $or: [{ id: rawId }, { slug: rawId }, { _id: rawId.length === 24 ? rawId : undefined }].filter(Boolean) }).lean();
      
      if (product) {
        // Recommendations from the same or complementary category
        recommendations = await Product.find({
          category: product.category,
          _id: { $ne: product._id }
        }).limit(4).lean();

        if (recommendations.length < 4) {
          const extraProducts = await Product.find({
            _id: { $ne: product._id, $nin: recommendations.map(r => r._id) }
          }).limit(4 - recommendations.length).lean();
          recommendations = [...recommendations, ...extraProducts];
        }
      }
    } catch {
      // Fallback to static catalog if DB is connecting
    }

    // Static fallback if DB was empty or offline
    if (!product || recommendations.length === 0) {
      const allProducts = Array.isArray(productsData) ? productsData : [];
      product = allProducts.find(p => p.id === rawId || p.slug === rawId);
      
      const currentCat = product?.category || 'mobiles';
      const sameCat = allProducts.filter(p => p.id !== rawId && p.category === currentCat);
      const otherCat = allProducts.filter(p => p.id !== rawId && p.category !== currentCat);
      
      recommendations = [...sameCat, ...otherCat].slice(0, 4);
    }

    return NextResponse.json(recommendations);
  } catch (error) {
    console.error('[Product Recommendations API Error]:', error);
    return NextResponse.json({ error: 'Failed to retrieve recommendations' }, { status: 500 });
  }
}
