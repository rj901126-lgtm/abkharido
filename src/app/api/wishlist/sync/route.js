import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    return NextResponse.json({ success: true, wishlist: body.wishlist || [] });
  } catch (error) {
    return NextResponse.json({ success: true, wishlist: [] });
  }
}
