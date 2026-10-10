import { NextResponse } from 'next/server';
import connectDB from '../../../lib/connectDB.js';
import Product from '../../../../server/models/Product.js';
import { toPublicProductDTO } from '../../../lib/productValidator.js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get('q') || searchParams.get('search') || '').trim();
    const category = (searchParams.get('category') || '').trim();
    const rawLimit = parseInt(searchParams.get('limit') || '20', 10);
    const rawPage = parseInt(searchParams.get('page') || '1', 10);

    const limit = !isNaN(rawLimit) && rawLimit >= 1 && rawLimit <= 50 ? rawLimit : 20;
    const page = !isNaN(rawPage) && rawPage >= 1 ? rawPage : 1;

    await connectDB();
    const filter = {
      status: { $in: ['published', 'active'], $ne: 'archived' },
      isArchived: { $ne: true }
    };

    if (category && category !== 'all') {
      const escapedCat = category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.category = { $regex: new RegExp(`^${escapedCat}$`, 'i') };
    }

    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: { $regex: escapedSearch, $options: 'i' } },
        { description: { $regex: escapedSearch, $options: 'i' } },
        { category: { $regex: escapedSearch, $options: 'i' } }
      ];
    }

    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      products: (products || []).map(toPublicProductDTO),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1
    });
  } catch (error) {
    console.error('[API Search Error]:', error);
    return NextResponse.json({ error: 'Failed to search products' }, { status: 500 });
  }
}
