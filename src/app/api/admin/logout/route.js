import { NextResponse } from 'next/server';

export async function POST(req) {
  const origin = req.headers.get('origin');
  if (origin && origin !== new URL(req.url).origin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const response = NextResponse.json({ success: true });
  for (const name of ['abkharido_admin_token', 'abkharido_seller_token']) {
    response.cookies.set(name, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', maxAge: 0, path: '/' });
  }
  return response;
}
