import { NextResponse } from 'next/server';

export async function POST(req, context) {
  try {
    const params = await context.params;
    const id = params?.id;
    if (!id) return NextResponse.json({ error: 'Product ID required' }, { status: 400 });

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
    }

    const body = await req.json();

    const ports = [5000, 5001, 5002];
    let lastError = null;

    for (const port of ports) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const res = await fetch(`http://localhost:${port}/api/products/${id}/reviews`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader
          },
          body: JSON.stringify(body),
          signal: controller.signal
        });
        
        clearTimeout(timeout);
        if (res && res.status < 500) {
          const data = await res.json().catch(() => ({}));
          return NextResponse.json(data, { status: res.status });
        }
      } catch (err) {
        lastError = err;
        console.warn(`[Review API Proxy] Failed on port ${port}, trying next...`);
      }
    }

    console.error('All backend ports failed for review submission:', lastError);
    return NextResponse.json({ error: 'Backend API is completely offline' }, { status: 503 });
  } catch (error) {
    console.error('[Review API Route Error]:', error);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}
