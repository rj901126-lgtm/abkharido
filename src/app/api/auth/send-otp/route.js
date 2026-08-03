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
      console.warn(`[SMS Proxy] Failed connecting to ${host}:`, err.message || err);
    }
  }
  return null;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const res = await fetchBackend('/api/auth/send-otp', body);

    if (!res) {
      return NextResponse.json({ error: 'Unable to reach backend authentic SMS service on port 5000 (tested loopback and external IP).' }, { status: 502 });
    }

    const data = await res.json().catch(() => ({ error: 'Failed to parse response from backend SMS Gateway' }));
    if (!res.ok) {
      return NextResponse.json({ error: data.error || data.message || 'SMS Gateway Error' }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in Next.js send-otp API proxy:', error);
    return NextResponse.json({ error: 'Internal system error in SMS OTP proxy.' }, { status: 500 });
  }
}
