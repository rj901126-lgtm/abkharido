import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function POST(req) {
  try {
    const body = await req.json();
    const { password } = body;
    const validPin = process.env.ADMIN_SECURE_PIN;
    
    // SECURITY: No hardcoded fallback PINs. Require env var to be set.
    if (!validPin) {
      return NextResponse.json({ error: 'Admin panel not configured. Set ADMIN_SECURE_PIN env var.' }, { status: 503 });
    }
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return NextResponse.json({ error: 'Server misconfiguration: JWT_SECRET is not set.' }, { status: 500 });
    }
    
    if (password && password === validPin) {
      const cryptoToken = jwt.sign(
        { role: 'super_admin', issuer: 'AbKharido Security Engine' }, 
        jwtSecret, 
        { expiresIn: '24h' }
      );
      return NextResponse.json({ success: true, token: cryptoToken });
    } else {
      return NextResponse.json({ error: 'Invalid PIN or Security Credential' }, { status: 401 });
    }
  } catch (error) {
    console.error('[Admin Verify Native Route Error]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
