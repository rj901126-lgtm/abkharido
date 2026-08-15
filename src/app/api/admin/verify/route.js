import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// In-memory rate limiting map for admin verify attempts
const failedAttemptsMap = new Map();

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = failedAttemptsMap.get(ip);
  if (!entry) return { allowed: true };

  if (now > entry.resetTime) {
    failedAttemptsMap.delete(ip);
    return { allowed: true };
  }

  if (entry.count >= MAX_FAILED_ATTEMPTS) {
    const remainingSeconds = Math.ceil((entry.resetTime - now) / 1000);
    return { allowed: false, remainingSeconds };
  }

  return { allowed: true };
}

function recordFailedAttempt(ip) {
  const now = Date.now();
  const entry = failedAttemptsMap.get(ip);
  if (!entry || now > entry.resetTime) {
    failedAttemptsMap.set(ip, { count: 1, resetTime: now + LOCKOUT_WINDOW_MS });
  } else {
    entry.count += 1;
  }
}

function clearFailedAttempts(ip) {
  failedAttemptsMap.delete(ip);
}

export async function POST(req) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    
    // Rate limit check
    const rateCheck = checkRateLimit(ip);
    if (!rateCheck.allowed) {
      console.warn(`[SECURITY ALERT] Admin PIN brute force lockout active for IP ${ip}`);
      return NextResponse.json(
        { error: `Too many failed attempts. Account locked for ${rateCheck.remainingSeconds} seconds.` },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { password } = body;
    const validPin = process.env.ADMIN_SECURE_PIN;
    const jwtSecret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;

    // Fail closed if missing environment variables without leaking specifics to client
    if (!validPin || !jwtSecret) {
      console.error('[SECURITY CONFIG ERROR] ADMIN_SECURE_PIN or JWT_SECRET is not configured in environment!');
      return NextResponse.json({ error: 'Authentication service unavailable' }, { status: 401 });
    }

    // Verify PIN with constant-time equality check if possible or safe string compare
    const isMatch = Boolean(password && typeof password === 'string' && password === validPin);

    if (isMatch) {
      clearFailedAttempts(ip);
      const cryptoToken = jwt.sign(
        { role: 'super_admin', issuer: 'AbKharido Security Engine' }, 
        jwtSecret, 
        { algorithm: 'HS256', expiresIn: '24h' }
      );

      const response = NextResponse.json({ success: true, token: cryptoToken });
      
      // Set secure httpOnly cookie
      response.cookies.set('abkharido_admin_token', cryptoToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60,
        path: '/'
      });

      return response;
    } else {
      recordFailedAttempt(ip);
      console.warn(`[ADMIN AUTH] Invalid admin PIN attempt from IP ${ip}`);
      return NextResponse.json({ error: 'Invalid PIN or Security Credential' }, { status: 401 });
    }
  } catch (error) {
    console.error('[Admin Verify Native Route Error]:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
