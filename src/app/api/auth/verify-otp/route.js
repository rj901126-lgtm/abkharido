import { NextResponse } from 'next/server';

async function fetchBackend(path, body) {
  const hosts = [
    process.env.BACKEND_API_URL,
    'http://127.0.0.1:5000',
    'http://localhost:5000',
    'http://16.16.195.180:5000'
  ].filter(Boolean);

  const uniqueHosts = [...new Set(hosts.map(h => h.replace(/\/$/, '')))];
  for (const host of uniqueHosts) {
    try {
      const url = `${host}${path}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (res) return res;
    } catch (err) {
      console.warn(`[Verify Proxy] Failed connecting to ${host}:`, err.message || err);
    }
  }
  return null;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const res = await fetchBackend('/api/auth/verify-otp', body);

    if (!res) {
      return NextResponse.json({ error: 'Unable to reach backend verification server on port 5000 (tested loopback and external IP).' }, { status: 502 });
    }

    const data = await res.json().catch(() => ({ error: 'Failed to parse response from backend verification service' }));
    if (!res.ok) {
      return NextResponse.json({ error: data.error || data.message || 'OTP verification failed' }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in Next.js verify-otp API proxy:', error);
    return NextResponse.json({ error: 'Internal system error during OTP verification proxy.' }, { status: 500 });
  }
}
