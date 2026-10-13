import NextAuthImport from 'next-auth';
import CredentialsProviderImport from 'next-auth/providers/credentials';
import { verifyFirebaseDirect, verifyOtpDirect, loginPasswordDirect } from '../../../../lib/directAuth.js';
import { isValidEmail } from '../../../../utils/constants.js';
import { getJwtSecret } from '../../../../../server/utils/authSecurity.js';
import { NextResponse } from 'next/server';

// NextAuth v4 is CommonJS; externalized server bundles can expose a default wrapper.
const NextAuth = typeof NextAuthImport === 'function' ? NextAuthImport : NextAuthImport.default;
const CredentialsProvider = typeof CredentialsProviderImport === 'function' ? CredentialsProviderImport : CredentialsProviderImport.default;

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
      const timeout = setTimeout(() => controller.abort(), 2000); // 2s quick failover
      
      const res = await fetch(url, {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timeout);
      
      if (res && res.status < 500) return res;
    } catch (err) {
      // Continue to next host or native DB fallback
    }
  }
  return null;
}

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
        phone: { label: "Phone", type: "text" },
        otp: { label: "OTP", type: "text" },
        firebaseIdToken: { label: "Firebase ID Token", type: "text" }
      },
      async authorize(credentials, req) {
        try {
          let path, bodyObj;

          // Normalize phone to 10 digits before all operations
          const rawPhone = credentials.phone || '';
          const normalizedPhone = rawPhone.startsWith('+91') ? rawPhone.slice(3)
            : (rawPhone.startsWith('91') && rawPhone.length === 12) ? rawPhone.slice(2)
            : rawPhone;
          

          if (credentials.firebaseIdToken) {
             path = `/api/auth/verify-firebase`;
             bodyObj = { idToken: credentials.firebaseIdToken, phone: normalizedPhone };
          } else if (credentials.otp && normalizedPhone) {
             path = `/api/auth/verify-otp`;
             bodyObj = { recipient: normalizedPhone, otp: credentials.otp };
          } else if (credentials.username && credentials.password) {
             path = `/api/auth/login`;
             bodyObj = { username: credentials.username, password: credentials.password };
          } else {
             throw new Error('Invalid login credentials provided');
          }

          let data = null;
          const res = await fetchBackend(path, JSON.stringify(bodyObj));
          
          if (res) {
            data = await res.json().catch(() => null);
            if (!res.ok) throw new Error('Authentication failed on verification service');
          } else {
            // ── Native Direct MongoDB Authentication Fallback ──
            if (credentials.firebaseIdToken) {
               data = await verifyFirebaseDirect(bodyObj);
            } else if (credentials.otp && normalizedPhone) {
               data = await verifyOtpDirect(bodyObj);
            } else if (credentials.username && credentials.password) {
               data = await loginPasswordDirect(bodyObj);
            }
          }
          
          const userObj = data?.user || data;
          
          if (userObj && (userObj.token || data?.token || userObj._id)) {
            const cleanPhone = (userObj.phone && !userObj.phone.includes(':')) ? userObj.phone : normalizedPhone;
            const digits = String(cleanPhone || '').replace(/\D/g, '').slice(-10);
            const cleanEmail = isValidEmail(userObj.email) ? userObj.email.trim().toLowerCase() : null;
            const finalRole = userObj.role || 'user';

            return {
              id: userObj._id?.toString() || userObj.id,
              name: userObj.username || userObj.name || cleanPhone,
              email: cleanEmail,
              phone: cleanPhone,
              role: finalRole,
              accessToken: userObj.token || data?.token,
            };
          }
          
          throw new Error(data?.message || data?.error || 'Authentication verification failed');
        } catch (error) {
          console.error('[NextAuth] Authorize Error:', error.message || error);
          throw new Error(error.message || 'Authentication system error');
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.accessToken = user.accessToken;
        token.phone = user.phone;   // persist phone in JWT
        token.email = isValidEmail(user.email) ? user.email : null;   // persist actual email (null for phone users)
      }
      return token;
    },
    async session({ session, token }) {
      if (session && session.user) {
        session.user.id = token.id;
        session.user.role = token.role || 'user';
        session.user.phone = token.phone;   // expose phone to client
        session.user.email = isValidEmail(token.email) ? token.email : null;  // clean null if not legitimate email
        session.accessToken = token.accessToken;
      }
      return session;
    }
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: (process.env.NODE_ENV === 'production' && typeof window === 'undefined' && process.env.NEXTAUTH_URL?.includes('abkharido.com')) ? '.abkharido.com' : undefined,
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

async function guardedHandler(...args) {
  try { getJwtSecret('NEXTAUTH_SECRET'); }
  catch { return NextResponse.json({ error: 'Authentication server is not configured' }, { status: 503 }); }
  return handler(...args);
}
export { guardedHandler as GET, guardedHandler as POST };
