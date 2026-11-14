import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/connectDB.js';
import PromotionConfig from '../../../../../../server/models/PromotionConfig.js';
import { getAuthenticatedUser } from '../../../../../lib/serverAuth.js';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    const saved = await PromotionConfig.findOne({ key: 'storefront' }).lean();
    if (!saved) return NextResponse.json({ success: true, promotions: null });

    const { key, _id, createdAt, updatedAt, __v, ...promotions } = saved;
    return NextResponse.json({ success: true, promotions });
  } catch (error) {
    console.error('GET /api/admin/promotions/save failed:', error);
    return NextResponse.json({ error: 'Unable to load promotions' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth?.isAdmin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body) ||
        !body.announcement || typeof body.announcement !== 'object' || Array.isArray(body.announcement) ||
        !body.flashDeals || typeof body.flashDeals !== 'object' || Array.isArray(body.flashDeals) ||
        !Array.isArray(body.heroBanners) || body.heroBanners.length > 100 ||
        !body.categoryBanners || typeof body.categoryBanners !== 'object' || Array.isArray(body.categoryBanners) ||
        !Array.isArray(body.vipCategories) || body.vipCategories.length > 100) {
      return NextResponse.json({ error: 'Invalid promotions configuration' }, { status: 400 });
    }

    await connectDB();
    const promotions = {
      announcement: body.announcement,
      flashDeals: body.flashDeals,
      heroBanners: body.heroBanners,
      categoryBanners: body.categoryBanners,
      vipCategories: body.vipCategories
    };
    const saved = await PromotionConfig.findOneAndUpdate(
      { key: 'storefront' },
      { $set: promotions, $setOnInsert: { key: 'storefront' } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).lean();
    const { key, _id, createdAt, updatedAt, __v, ...savedPromotions } = saved;

    return NextResponse.json({ success: true, message: 'Promotions saved', promotions: savedPromotions });
  } catch (error) {
    console.error('POST /api/admin/promotions/save failed:', error);
    return NextResponse.json({ error: 'Unable to save promotions' }, { status: 500 });
  }
}
