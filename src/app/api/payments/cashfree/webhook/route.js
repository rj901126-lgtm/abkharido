import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/connectDB.js';
import { verifyCashfreeWebhookSignature } from '../../../../../lib/cashfree.js';
import { settleVerifiedPayment } from '../../../orders/financialSecurity.js';
export const dynamic = 'force-dynamic';
export async function POST(req) {
  try {
    const rawBody = await req.text();
    if (!verifyCashfreeWebhookSignature({ rawBody, timestamp: req.headers.get('x-webhook-timestamp'), signature: req.headers.get('x-webhook-signature') })) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    const payload = JSON.parse(rawBody);
    const id = payload.data?.order?.order_id || payload.order_id;
    if (typeof id !== 'string' || id.length > 128) return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    if (payload.type !== 'PAYMENT_SUCCESS_WEBHOOK' && payload.data?.payment?.payment_status !== 'SUCCESS') return NextResponse.json({ status: 'IGNORED' });
    await connectDB(); await settleVerifiedPayment(id);
    return NextResponse.json({ status: 'PROCESSED_SUCCESS' });
  } catch { return NextResponse.json({ error: 'Payment settlement unavailable' }, { status: 503 }); }
}
