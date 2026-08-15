import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const authHeader = req.headers.get('authorization') || '';
    
    const hosts = [
      process.env.BACKEND_API_URL,
      'http://127.0.0.1:5000',
      'http://localhost:5000'
    ].filter(Boolean);

    const uniqueHosts = [...new Set(hosts.map(h => h.replace(/\/$/, '')))];
    
    for (const host of uniqueHosts) {
      try {
        const url = `${host}/api/coupons/validate`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000);
        
        const headers = { 'Content-Type': 'application/json' };
        if (authHeader) headers['authorization'] = authHeader;

        const res = await fetch(url, {
          method: 'POST',
          body: JSON.stringify(body),
          headers,
          signal: controller.signal
        });
        clearTimeout(timeout);
        
        if (res && res.status < 500) {
          const data = await res.json();
          return NextResponse.json(data, { status: res.status });
        }
      } catch (err) {
        // Continue to next host
      }
    }
    return NextResponse.json({ success: false, message: "Backend unreachable" }, { status: 502 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
