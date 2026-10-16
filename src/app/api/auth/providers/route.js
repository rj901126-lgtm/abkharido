import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    credentials: {
      id: 'credentials',
      name: 'Credentials',
      type: 'credentials',
      signinUrl: 'https://www.abkharido.com/login',
      callbackUrl: 'https://www.abkharido.com/api/auth/callback/credentials'
    }
  });
}
