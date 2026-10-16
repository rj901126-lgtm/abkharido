import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getJwtSecret } from '../../../../../server/utils/authSecurity.js';
import { isValidEmail } from '../../../../utils/constants.js';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const secret = getJwtSecret('NEXTAUTH_SECRET');
    
    // Check production secure cookie first, then non-secure fallback
    let token = await getToken({ req, secret, secureCookie: true }).catch(() => null);
    if (!token) {
      token = await getToken({ req, secret, secureCookie: false }).catch(() => null);
    }

    if (!token) {
      return NextResponse.json({}, {
        status: 200,
        headers: {
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
          'Content-Type': 'application/json'
        }
      });
    }

    const rawPhone = token.phone || token.name || '';
    const digits = String(rawPhone).replace(/\D/g, '').slice(-10);
    const cleanEmail = String(token.email || '').trim().toLowerCase();
    const isOwner = digits === '9172600587' || cleanEmail === 'rj901126@gmail.com' || cleanEmail === 'admin@abkharido.com';

    const session = {
      user: {
        id: token.id || token.sub,
        name: token.name || token.username || (digits ? `Customer (+91 ${digits})` : 'User'),
        email: isValidEmail(token.email) ? token.email : null,
        phone: token.phone || (digits ? digits : null),
        role: isOwner ? 'super_admin' : (token.role || 'user'),
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };

    return NextResponse.json(session, {
      status: 200,
      headers: {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('[Session API Catch]:', error?.message || error);
    // Never return 500 HTML to NextAuth client — always return 200 {}
    return NextResponse.json({}, {
      status: 200,
      headers: {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    });
  }
}
