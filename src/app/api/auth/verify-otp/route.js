import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const backendUrl = `${process.env.BACKEND_API_URL || 'http://16.16.195.180:5000'}/api/auth/verify-otp`;

    const res = await fetch(backendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({ error: 'Failed to parse response from backend verification service' }));

    if (!res.ok) {
      return NextResponse.json({ error: data.error || data.message || 'OTP verification failed' }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in Next.js verify-otp API proxy:', error);
    return NextResponse.json({ error: 'Unable to verify authentic OTP right now. Please check connection.' }, { status: 502 });
  }
}
