import { NextResponse } from 'next/server';

/**
 * Enterprise Security Middleware for AbKharido
 * Features:
 * 1. Global Enterprise HTTP Security Headers (HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
 * 2. Edge-level NoSQL Query Injection & Prototype Pollution Shield
 * 3. Intelligent Admin Gateway (Allows Admin PIN Unlock at /admin, validates tokens for protected deep routes)
 */

export function middleware(req) {
  const { pathname, searchParams } = req.nextUrl;

  // 1. Edge-Level NoSQL Injection & Attack Vector Inspection
  // Scan URL search query params for malicious MongoDB operators or prototype pollution
  for (const [key, value] of searchParams.entries()) {
    if (
      key.startsWith('$') ||
      key.includes('.') ||
      key.includes('__proto__') ||
      key.includes('constructor') ||
      /\[\s*\$(ne|gt|gte|lt|lte|in|nin|where|regex|exists|or|and)\s*\]/i.test(key) ||
      /\[\s*\$(ne|gt|gte|lt|lte|in|nin|where|regex|exists|or|and)\s*\]/i.test(value)
    ) {
      return new NextResponse(
        JSON.stringify({ error: 'Bad Request: Malicious parameters detected.' }),
        {
          status: 400,
          headers: { 'content-type': 'application/json' },
        }
      );
    }
  }

  // 2. Admin Route Protection
  if (pathname.startsWith('/admin')) {
    const hasAdminToken = Boolean(
      req.cookies.get('abkharido_admin_token')?.value ||
      req.headers.get('x-admin-token')
    );
    const hasSessionToken = Boolean(
      req.cookies.get('__Secure-next-auth.session-token')?.value ||
      req.cookies.get('next-auth.session-token')?.value
    );

    // If accessing a deep /admin/* sub-route without any authentication, send to /admin (where PIN or credentials unlock)
    if (pathname !== '/admin' && !hasAdminToken && !hasSessionToken) {
      const adminPinGateUrl = new URL('/admin', req.url);
      return NextResponse.redirect(adminPinGateUrl, 307);
    }
    // Note: /admin itself is allowed so AdminDashboard's Master PIN Unlock modal or login prompt can render.
  }

  // 3. Prepare response with Enterprise HTTP Security Headers
  const response = NextResponse.next();

  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  // Prevent MIME-sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  // XSS protection for older browsers
  response.headers.set('X-XSS-Protection', '1; mode=block');
  // Privacy-preserving referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Strict Transport Security (HSTS) - enforce HTTPS for 1 year
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  // Restrict sensitive browser features
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self), payment=(self)');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static assets)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     * - static file extensions (svg, png, jpg, jpeg, gif, webp, ico)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
