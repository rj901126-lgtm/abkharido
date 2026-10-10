import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { verifyFirebaseDirect, verifyOtpDirect, loginPasswordDirect } from '../../../../lib/directAuth.js';
import { isValidEmail } from '../../../../utils/constants.js';

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
            if (!res.ok) {
              // If external backend returns error, attempt Native Direct MongoDB Auth fallback
              if (credentials.firebaseIdToken) {
                 data = await verifyFirebaseDirect(bodyObj).catch(() => null);
              } else if (credentials.otp && normalizedPhone) {
                 data = await verifyOtpDirect(bodyObj).catch(() => null);
              } else if (credentials.username && credentials.password) {
                 data = await loginPasswordDirect(bodyObj).catch(() => null);
              }
              if (!data) {
                throw new Error('Authentication failed on verification service');
              }
            }
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
            const isOwner = digits === '9172600587' || cleanEmail === 'rj901126@gmail.com' || cleanEmail === 'admin@abkharido.com';
            const finalRole = isOwner ? 'super_admin' : (userObj.role || 'user');

            if (isOwner && userObj._id) {
              try {
                const connectDB = (await import('../../../../lib/connectDB.js')).default;
                const User = (await import('../../../../../server/models/User.js')).default;
                await connectDB();
                await User.findByIdAndUpdate(userObj._id, { role: 'super_admin' });
              } catch (e) {}
            }

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
      const rawPhone = token.phone || token.name || '';
      const digits = String(rawPhone).replace(/\D/g, '').slice(-10);
      const cleanEmail = String(token.email || '').trim().toLowerCase();
      if (digits === '9172600587' || cleanEmail === 'rj901126@gmail.com' || cleanEmail === 'admin@abkharido.com') {
        token.role = 'super_admin';
      }
      return token;
    },
    async session({ session, token }) {
      if (session && session.user) {
        const rawPhone = token.phone || token.name || session.user.phone || '';
        const digits = String(rawPhone).replace(/\D/g, '').slice(-10);
        const cleanEmail = String(token.email || session.user.email || '').trim().toLowerCase();
        const isOwner = digits === '9172600587' || cleanEmail === 'rj901126@gmail.com' || cleanEmail === 'admin@abkharido.com';

        session.user.id = token.id;
        session.user.role = isOwner ? 'super_admin' : (token.role || 'user');
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
  secret: process.env.NEXTAUTH_SECRET || 'fallback_secret_for_dev_abkharido',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
