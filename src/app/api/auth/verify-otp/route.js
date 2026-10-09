import { NextResponse } from 'next/server';
import { verifyOtpDirect } from '../../../../lib/directAuth.js';

async function fetchBackend(path, body) {
  const hosts = [
    process.env.BACKEND_API_URL,
    'http://127.0.0.1:5000',
    'http://localhost:5000'
  ].filter(Boolean);

  const uniqueHosts = [...new Set(hosts.map(h => h.replace(/\/$/, '')))];
  for (const host of uniqueHosts) {
    try {
      const url = `${host}${path}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (res && res.status < 500) return res;
    } catch (err) {
      // Continue to next host or direct DB fallback
    }
  }
  return null;
}

export async function POST(req) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const { checkRouteRateLimit } = await import('../../../../lib/rateLimiter.js');
    const limit = checkRouteRateLimit('verify-otp', ip, 15, 15 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'Too many verification attempts. Please try again after 15 minutes.' },
        { status: 429, headers: { 'Cache-Control': 'private, no-store' } }
      );
    }

    const body = await req.json();
    const rawTarget = body.phone || body.recipient || body.mobile || body.email || '';
    if (!rawTarget) {
      return NextResponse.json({ error: 'Phone number is required.' }, { status: 400, headers: { 'Cache-Control': 'private, no-store' } });
    }
    body.phone = rawTarget;
    body.recipient = rawTarget;

    const res = await fetchBackend('/api/auth/verify-otp', body);

    if (res) {
      const data = await res.json().catch(() => ({ error: 'Failed to parse verification response' }));
      if (!res.ok) {
        return NextResponse.json({ error: data.error || data.message || 'OTP verification failed' }, { status: res.status });
      }
      return NextResponse.json(data);
    }

    // ── Direct Native MongoDB Fallback when port 5000 is offline ──
    const directResult = await verifyOtpDirect(body);
    return NextResponse.json(directResult);
  } catch (error) {
    console.error('Error in verify-otp API proxy/direct:', error);
    return NextResponse.json({ error: error.message || 'Incorrect OTP or verification failed.' }, { status: 400 });
  }
}
