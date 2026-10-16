import { NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    csrfToken: crypto.randomBytes(32).toString('hex')
  });
}
