import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

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
          let url, body;
          
          if (credentials.firebaseIdToken) {
             url = `${process.env.BACKEND_API_URL || 'http://16.16.195.180:5000'}/api/auth/verify-firebase`;
             body = JSON.stringify({ idToken: credentials.firebaseIdToken, phone: credentials.phone });
          } else if (credentials.otp && credentials.phone) {
             url = `${process.env.BACKEND_API_URL || 'http://16.16.195.180:5000'}/api/auth/verify-otp`;
             body = JSON.stringify({ recipient: credentials.phone, otp: credentials.otp });
          } else if (credentials.username && credentials.password) {
             url = `${process.env.BACKEND_API_URL || 'http://16.16.195.180:5000'}/api/auth/login`;
             body = JSON.stringify({ username: credentials.username, password: credentials.password });
          } else {
             throw new Error('Invalid login credentials provided');
          }

          const res = await fetch(url, {
            method: 'POST',
            body,
            headers: { 'Content-Type': 'application/json' }
          });
          
          const data = await res.json();
          
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
          
          throw new Error(data?.message || data?.error || 'Authentication failed');
        } catch (error) {
          throw new Error(error.message || 'Authentication failed');
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      // If user object is present (on sign in), save it to token
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.accessToken = user.accessToken;
      }
      return token;
    },
    async session({ session, token }) {
      // Expose properties to client session
      session.user.id = token.id;
      session.user.role = token.role;
      session.accessToken = token.accessToken;
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
