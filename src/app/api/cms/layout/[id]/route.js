import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/connectDB.js';
import Layout from '../../../../../../server/models/Layout.js';
import { getAuthenticatedUser } from '../../../../../lib/serverAuth.js';

export const dynamic = 'force-dynamic';

const defaultComponents = [
  { id: '1', type: 'deals_row', title: 'Deals of the Day', order: 1 },
  { id: '2', type: 'category_row', title: 'Smart Mobiles & Accessories', order: 2, data: 'mobiles' },
  { id: '3', type: 'category_row', title: 'Best of Tech & Electronics', order: 3, data: 'electronics' }
];

async function getLayoutId(context) {
  const params = await context?.params;
  return typeof params?.id === 'string' && params.id.trim() ? params.id.trim() : 'home_page';
}

export async function GET(req, context) {
  try {
    const id = await getLayoutId(context);
    await connectDB();
    const saved = await Layout.findOne({ type: id, isActive: true }).lean();
    return NextResponse.json({
      success: true,
      layout: saved || { type: id, components: id === 'home_page' ? defaultComponents : [], seo: {} }
    });
  } catch (error) {
    console.error('GET /api/cms/layout failed:', error);
    return NextResponse.json({ error: 'Unable to load CMS layout' }, { status: 500 });
  }
}

export async function PUT(req, context) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    const id = await getLayoutId(context);
    const body = await req.json().catch(() => null);
    if (!body || !Array.isArray(body.components) || body.components.length > 100 ||
        body.components.some(component => !component || typeof component !== 'object' || Array.isArray(component))) {
      return NextResponse.json({ error: 'A layout with up to 100 components is required' }, { status: 400 });
    }

    const components = body.components.map((component, index) => ({
      id: typeof component.id === 'string' && component.id.trim() ? component.id.trim().slice(0, 100) : `component-${index + 1}`,
      type: typeof component.type === 'string' && component.type.trim() ? component.type.trim().slice(0, 80) : 'banner',
      ...(typeof component.title === 'string' ? { title: component.title.slice(0, 200) } : {}),
      order: Number.isFinite(Number(component.order)) ? Number(component.order) : index + 1,
      ...(Object.prototype.hasOwnProperty.call(component, 'data') ? { data: component.data } : {})
    }));
    const hasSeo = body.seo && typeof body.seo === 'object' && !Array.isArray(body.seo);
    const seo = hasSeo
      ? {
          title: String(body.seo.title || '').slice(0, 200),
          metaDesc: String(body.seo.metaDesc || '').slice(0, 500),
          ogImage: String(body.seo.ogImage || '').slice(0, 2000)
        }
      : {};

    await connectDB();
    const update = { $set: { type: id, components, isActive: true } };
    if (hasSeo) update.$set.seo = seo;

    const layout = await Layout.findOneAndUpdate(
      { type: id },
      update,
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).lean();

    return NextResponse.json({ success: true, message: 'CMS layout saved', layout });
  } catch (error) {
    console.error('PUT /api/cms/layout failed:', error);
    return NextResponse.json({ error: 'Unable to save CMS layout' }, { status: 500 });
  }
}
