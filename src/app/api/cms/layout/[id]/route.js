import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  const id = params?.id || 'home_page';
  return NextResponse.json({
    success: true,
    layoutId: id,
    sections: [
      { id: 'hero_carousel', type: 'carousel', title: 'Hero Festive Deals', enabled: true },
      { id: 'category_pills', type: 'categories', title: 'Shop By Category', enabled: true },
      { id: 'deal_of_day', type: 'rail', title: 'Deal of the Day', enabled: true },
      { id: 'best_sellers', type: 'rail', title: 'Best Sellers', enabled: true },
      { id: 'new_arrivals', type: 'rail', title: 'New Arrivals', enabled: true }
    ]
  });
}

export async function POST(req, { params }) {
  const body = await req.json().catch(() => ({}));
  return NextResponse.json({
    success: true,
    message: 'CMS layout updated successfully',
    layout: body
  });
}
