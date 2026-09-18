import { getToken } from 'next-auth/jwt';
import jwt from 'jsonwebtoken';
import connectDB from './connectDB.js';
import User from '../../server/models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'abkharido_enterprise_secret_2026_super_secure';
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'fallback_secret_for_dev_abkharido';

/**
 * Validates session from NextAuth cookies or Bearer Authorization header.
 * Returns { user, isAuthenticated: true, isAdmin: boolean, isSeller: boolean } or null.
 */
export async function getAuthenticatedUser(req) {
  try {
    let tokenPayload = null;
    let requestObj = req;

    if (!requestObj) {
      try {
        const { cookies, headers } = await import('next/headers');
        const cookieStore = await cookies();
        const headerStore = await headers();
        const cookieMap = {};
        if (typeof cookieStore.getAll === 'function') {
          cookieStore.getAll().forEach(c => { cookieMap[c.name] = c.value; });
        }
        requestObj = {
          cookies: cookieMap,
          headers: headerStore
        };
      } catch {
        // Not in Server Component context
      }
    }

    // 0. Check x-admin-token header or abkharido_admin_token cookie
    const adminHeader = requestObj?.headers?.get 
      ? requestObj.headers.get('x-admin-token') 
      : (requestObj?.headers?.['x-admin-token'] || '');

    let adminCookie = '';
    if (requestObj?.cookies) {
      if (typeof requestObj.cookies.get === 'function') {
        adminCookie = requestObj.cookies.get('abkharido_admin_token')?.value || '';
      } else if (typeof requestObj.cookies === 'object') {
        adminCookie = requestObj.cookies['abkharido_admin_token'] || '';
      }
    }

    const adminCandidate = adminHeader || adminCookie;
    if (adminCandidate) {
      const adminSecureToken = process.env.ADMIN_SECURE_TOKEN;
      if (adminSecureToken && adminCandidate === adminSecureToken) {
        return {
          user: {
            _id: 'admin-root',
            id: 'admin-root',
            username: 'admin',
            fullName: 'Master Administrator',
            email: 'admin@abkharido.com',
            role: 'super_admin',
            walletCoins: 999999
          },
          isAuthenticated: true,
          isAdmin: true,
          isStaff: true,
          isSeller: true
        };
      }

      try {
        tokenPayload = jwt.verify(adminCandidate, JWT_SECRET, { algorithms: ['HS256'] });
      } catch {
        try {
          tokenPayload = jwt.verify(adminCandidate, NEXTAUTH_SECRET, { algorithms: ['HS256'] });
        } catch {
          // Fallback dev secret
          try {
            tokenPayload = jwt.verify(adminCandidate, 'abkharido_enterprise_secret_2026', { algorithms: ['HS256'] });
          } catch {}
        }
      }
    }

    // 1. Check Bearer Authorization Header
    if (!tokenPayload) {
      const authHeader = requestObj?.headers?.get 
        ? requestObj.headers.get('authorization') 
        : (requestObj?.headers?.authorization || '');
      if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
        const bearerToken = authHeader.slice(7).trim();
        if (bearerToken) {
          const adminSecureToken = process.env.ADMIN_SECURE_TOKEN;
          if (adminSecureToken && bearerToken === adminSecureToken) {
            return {
              user: {
                _id: 'admin-root',
                id: 'admin-root',
                username: 'admin',
                fullName: 'Master Administrator',
                email: 'admin@abkharido.com',
                role: 'super_admin',
                walletCoins: 999999
              },
              isAuthenticated: true,
              isAdmin: true,
              isStaff: true,
              isSeller: true
            };
          }
          try {
            tokenPayload = jwt.verify(bearerToken, JWT_SECRET);
          } catch {
            try {
              tokenPayload = jwt.verify(bearerToken, NEXTAUTH_SECRET);
            } catch {
              try {
                tokenPayload = jwt.verify(bearerToken, 'abkharido_enterprise_secret_2026');
              } catch {}
            }
          }
        }
      }
    }

    // 2. Check NextAuth Session Token (Cookie)
    if (!tokenPayload && requestObj) {
      try {
        const nextAuthToken = await getToken({ 
          req: requestObj, 
          secret: NEXTAUTH_SECRET,
          secureCookie: process.env.NODE_ENV === 'production'
        });
        if (nextAuthToken) {
          tokenPayload = nextAuthToken;
        }
      } catch {
        // NextAuth token extraction failed
      }
    }

    if (!tokenPayload) {
      return null;
    }

    // Direct root / super_admin bypass
    if (tokenPayload.id === 'admin-root' || tokenPayload.role === 'super_admin') {
      return {
        user: {
          _id: 'admin-root',
          id: 'admin-root',
          username: tokenPayload.username || 'admin',
          fullName: tokenPayload.name || 'Master Administrator',
          email: tokenPayload.email || 'admin@abkharido.com',
          role: 'super_admin',
          walletCoins: 999999
        },
        isAuthenticated: true,
        isAdmin: true,
        isStaff: true,
        isSeller: true
      };
    }

    const userId = tokenPayload.id || tokenPayload.sub || tokenPayload._id || tokenPayload.userId;
    const phone = tokenPayload.phone;
    const role = tokenPayload.role || 'user';

    if (!userId && !phone) {
      return null;
    }

    // Connect to DB to ensure user is active and fetch up-to-date role
    await connectDB();
    let dbUser = null;
    if (userId && typeof userId === 'string' && userId.length === 24) {
      dbUser = await User.findById(userId).select('-password').lean();
    } else if (userId) {
      dbUser = await User.findOne({ $or: [{ _id: userId }, { username: userId }, { phone: userId }] }).select('-password').lean();
    } else if (phone) {
      dbUser = await User.findOne({ phone }).select('-password').lean();
    }

    const userObj = dbUser || {
      _id: userId,
      id: userId,
      phone,
      role,
      fullName: tokenPayload.name || 'User'
    };

    const userRole = userObj.role || role;
    const isAdmin = ['admin', 'super_admin', 'master_admin_legacy'].includes(userRole);
    const isStaff = ['admin', 'super_admin', 'support_agent', 'catalog_manager', 'master_admin_legacy'].includes(userRole);
    const isSeller = ['seller', 'vendor'].includes(userRole) || isAdmin;

    return {
      user: {
        _id: userObj._id?.toString() || userId,
        id: userObj._id?.toString() || userId,
        username: userObj.username,
        fullName: userObj.fullName,
        email: userObj.email,
        phone: userObj.phone,
        role: userRole,
        walletCoins: userObj.walletCoins || 0
      },
      isAuthenticated: true,
      isAdmin,
      isStaff,
      isSeller
    };
  } catch (error) {
    console.error('[serverAuth Error]:', error.message || error);
    return null;
  }
}
