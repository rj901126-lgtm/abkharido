import { NextResponse } from 'next/server';
import { sendOtpDirect } from '../../../../lib/directAuth.js';

// In-memory rate limiting stores
const phoneRateLimitMap = new Map(); // phone -> Array of timestamps
const ipRateLimitMap = new Map();    // ip -> Array of timestamps

const PHONE_LIMIT = 3;
const PHONE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const IP_LIMIT = 10;
const IP_WINDOW_MS = 60 * 60 * 1000;    // 1 hour

function checkRateLimits(phone, ip) {
  const now = Date.now();

  // 1. Check Phone Limit (max 3 sends / 15 min)
  if (phone) {
    const phoneHistory = (phoneRateLimitMap.get(phone) || []).filter(ts => now - ts < PHONE_WINDOW_MS);
    if (phoneHistory.length >= PHONE_LIMIT) {
      const waitMins = Math.ceil((PHONE_WINDOW_MS - (now - phoneHistory[0])) / 60000);
      return { allowed: false, message: `Too many OTP requests for this number. Please try again in ${waitMins} minute(s).` };
    }
    phoneHistory.push(now);
    phoneRateLimitMap.set(phone, phoneHistory);
  }

  // 2. Check IP Limit (max 10 sends / 1 hour)
  if (ip) {
    const ipHistory = (ipRateLimitMap.get(ip) || []).filter(ts => now - ts < IP_WINDOW_MS);
    if (ipHistory.length >= IP_LIMIT) {
      const waitMins = Math.ceil((IP_WINDOW_MS - (now - ipHistory[0])) / 60000);
      return { allowed: false, message: `Too many OTP requests from this network. Please try again in ${waitMins} minute(s).` };
    }
    ipHistory.push(now);
    ipRateLimitMap.set(ip, ipHistory);
  }

  return { allowed: true };
}

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

// Normalize phone: strip +91 / 91 prefix → 10 digits
function normalizePhone(phone) {
  if (!phone) return phone;
  let p = phone.toString().replace(/\s/g, '').replace(/-/g, '');
  if (p.startsWith('+91')) p = p.slice(3);
  else if (p.startsWith('91') && p.length === 12) p = p.slice(2);
  return p;
}

// Send SMS via Fast2SMS if API key is configured
async function sendViaSmsGateway(phone, otp) {
  const apiKey = process.env.FAST2SMS_API_KEY || process.env.MSG91_API_KEY;
  if (!apiKey) return false;

  try {
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
        return true;
      }
    }
  } catch (err) {
    console.warn('[SMS Gateway] Delivery attempt failed:', err.message);
  }
  return false;
}

export async function POST(req) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const body = await req.json().catch(() => ({}));
    const rawTarget = body.phone || body.recipient || body.mobile || body.email || '';
    if (!rawTarget) {
      return NextResponse.json({ error: 'Phone number is required.' }, { status: 400 });
    }

    const isEmail = rawTarget.includes('@');
    const normalized = isEmail ? rawTarget.trim().toLowerCase() : normalizePhone(rawTarget);
    
    if (!isEmail && !/^[6-9]\d{9}$/.test(normalized)) {
      return NextResponse.json({ error: 'Please enter a valid 10-digit Indian mobile number starting with 6-9.' }, { status: 400 });
    }

    // Rate limiting: 3 sends / phone / 15 min and 10 sends / IP / hour
    const rateCheck = checkRateLimits(normalized, ip);
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: rateCheck.message }, { status: 429 });
    }

    // Try external Express port 5000 first if available
    try {
      const res = await fetchBackend('/api/auth/send-otp', { ...body, recipient: normalized });
      if (res && res.ok) {
        const data = await res.json().catch(() => null);
        if (data && data.success) {
          return NextResponse.json({
            success: true,
            message: 'OTP sent successfully to your mobile number. Please check your SMS code.',
            phone: normalized
          });
        }
      }
    } catch (_backendErr) {
      // Fall through to Direct MongoDB Auth
    }

    // ── Direct Native MongoDB OTP storage ──
    const directResult = await sendOtpDirect({ recipient: normalized });

    // Try external SMS gateway if configured
    await sendViaSmsGateway(normalized, directResult._otp || '');

    // Return sanitized response with no sensitive internals
    return NextResponse.json({ 
      success: true, 
      message: 'OTP sent successfully to your mobile number. Please check your SMS code.', 
      phone: normalized
    });
  } catch (error) {
    console.error('[send-otp Error]:', error.message || error);
    return NextResponse.json({ error: 'Failed to dispatch verification SMS. Please try again.' }, { status: 500 });
  }
}
