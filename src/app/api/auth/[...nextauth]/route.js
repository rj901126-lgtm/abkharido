import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

// Resilient helper to connect to Express backend across local loopback and external IPs
async function fetchBackend(path, body) {
  const hosts = [
    process.env.BACKEND_API_URL,
    'http://127.0.0.1:5000',
    'http://localhost:5000',
    'http://16.16.195.180:5000'
  ].filter(Boolean);

  const uniqueHosts = [...new Set(hosts.map(h => h.replace(/\/$/, '')))];
  
  let lastErr = null;
  for (const host of uniqueHosts) {
    try {
      const url = `${host}${path}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      
      const res = await fetch(url, {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timeout);
      
      if (res) return res;
    } catch (err) {
      console.warn(`[NextAuth] Backend connection attempt failed for ${host}${path}:`, err.message || err);
      lastErr = err;
    }
  }

  throw new Error(`Backend Authentication Server Unreachable: Tested ${uniqueHosts.join(', ')}. Please check if port 5000 server is running.`);
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
          let path, body;
          
          if (credentials.firebaseIdToken) {
             path = `/api/auth/verify-firebase`;
             body = JSON.stringify({ idToken: credentials.firebaseIdToken, phone: credentials.phone });
          } else if (credentials.otp && credentials.phone) {
             path = `/api/auth/verify-otp`;
             body = JSON.stringify({ recipient: credentials.phone, otp: credentials.otp });
          } else if (credentials.username && credentials.password) {
             path = `/api/auth/login`;
             body = JSON.stringify({ username: credentials.username, password: credentials.password });
          } else {
             throw new Error('Invalid login credentials provided');
          }

          const res = await fetchBackend(path, body);
          const data = await res.json().catch(() => ({ error: 'Invalid JSON from auth service' }));
          
          // OTP responses sometimes wrap user inside `data.user` rather than top-level
          const userObj = data.user || data;
          
          if (res.ok && userObj && (userObj.token || data.token)) {
            return {
              id: userObj._id,
              name: userObj.username,
              email: userObj.email,
              role: userObj.role,
              accessToken: userObj.token || data.token,
            };
          }
          
          throw new Error(data?.message || data?.error || 'Authentication failed on verification server');
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
      }
      return token;
    },
    async session({ session, token }) {
      if (session && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
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
  secret: process.env.NEXTAUTH_SECRET || 'fallback_secret_for_dev_abkharido',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
