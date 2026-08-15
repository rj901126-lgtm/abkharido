import { NextResponse } from 'next/server';
import { sendOtpDirect } from '../../../../lib/directAuth.js';

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

// Normalize phone: strip +91 / 91 prefix → 10 digits
function normalizePhone(phone) {
  if (!phone) return phone;
  let p = phone.toString().replace(/\s/g, '').replace(/-/g, '');
  if (p.startsWith('+91')) p = p.slice(3);
  else if (p.startsWith('91') && p.length === 12) p = p.slice(2);
  return p;
}

// Optional: Send SMS via Fast2SMS if API key is configured
async function sendViaSmsGateway(phone, otp) {
  const apiKey = process.env.FAST2SMS_API_KEY || process.env.MSG91_API_KEY;
  if (!apiKey) return false;

  try {
    // Fast2SMS DLT route
    if (process.env.FAST2SMS_API_KEY) {
      const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': process.env.FAST2SMS_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          route: 'otp',
          variables_values: otp,
          numbers: phone,
          flash: 0
        })
      });
      const data = await res.json();
      if (data.return === true) {
        console.log(`[Fast2SMS] OTP ${otp} sent to ${phone}`);
        return true;
      }
    }
  } catch (err) {
    console.warn('[SMS Gateway] Failed to send via external gateway:', err.message);
  }
  return false;
}

export async function POST(req) {
  try {
    const body = await req.json();

    // Normalize phone before processing
    if (body.recipient && !body.recipient.includes('@')) {
      body.recipient = normalizePhone(body.recipient);
    }

    // Try external Express port 5000 first
    const res = await fetchBackend('/api/auth/send-otp', body);
    if (res) {
      const data = await res.json().catch(() => ({ error: 'Failed to parse SMS gateway response' }));
      if (!res.ok) {
        return NextResponse.json({ error: data.error || data.message || 'SMS Gateway Error' }, { status: res.status });
      }
      return NextResponse.json(data);
    }

    // ── Direct Native MongoDB OTP storage (no port 5000 needed) ──
    const directResult = await sendOtpDirect(body);

    // Try external SMS gateway if configured
    const smsSent = await sendViaSmsGateway(body.recipient, directResult._otp || '');

    console.log(`[OTP Server] OTP stored for +91${body.recipient}. External SMS: ${smsSent ? 'SENT' : 'No gateway configured - Firebase handles delivery'}`);

    return NextResponse.json({ success: true, message: 'OTP sent successfully. Please check your SMS code.' });
  } catch (error) {
    console.error('Error in send-otp API:', error);
    return NextResponse.json({ error: error.message || 'Internal error in OTP processing.' }, { status: 500 });
  }
}
