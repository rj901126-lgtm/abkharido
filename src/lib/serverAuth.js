import { getToken } from 'next-auth/jwt';
import connectDB from './connectDB.js';
import User from '../../server/models/User.js';
import { getJwtSecret, verifyAppToken, isSystemAdmin, isActiveUser } from '../../server/utils/authSecurity.js';

function rootAuth() {
  return { user: { _id: 'admin-root', id: 'admin-root', username: 'admin', role: 'super_admin' },
    isAuthenticated: true, isAdmin: true, isStaff: true, isSeller: true };
}

export async function getAuthenticatedUser(req) {
  try {
    let request = req;
    if (!request) {
      const { cookies, headers } = await import('next/headers');
      request = { cookies: await cookies(), headers: await headers() };
    }
    const header = name => typeof request?.headers?.get === 'function'
      ? request.headers.get(name) : request?.headers?.[name];
    let cookie = typeof request?.cookies?.get === 'function'
      ? request.cookies.get('abkharido_admin_token')?.value : request?.cookies?.abkharido_admin_token;
    if (!cookie) {
      const match = (header('cookie') || '').match(/(?:^|;\s*)abkharido_admin_token=([^;]+)/);
      if (match) cookie = decodeURIComponent(match[1]);
    }
    const bearer = /^Bearer\s+(\S+)$/i.exec(header('authorization') || '')?.[1];
    const candidates = [header('x-admin-token'), cookie, bearer].filter(Boolean);
    let payload;
    for (const candidate of candidates) {
      const secureToken = process.env.ADMIN_SECURE_TOKEN;
      if (secureToken && secureToken.length >= 32 && candidate === secureToken) return rootAuth();
      try { payload = verifyAppToken(candidate); break; } catch {}
    }
    if (!payload) {
      payload = await getToken({
        req: request,
        secret: getJwtSecret('NEXTAUTH_SECRET'),
        secureCookie: process.env.NODE_ENV === 'production'
      });
    }
    if (!payload) {
      payload = await getToken({
        req: request,
        secret: getJwtSecret('NEXTAUTH_SECRET')
      });
    }
    if (!payload) return null;
    if (isSystemAdmin(payload)) return rootAuth();
    const id = payload.id || payload.sub;
    if (typeof id !== 'string' || !/^[a-f\d]{24}$/i.test(id)) return null;
    await connectDB();
    const userDoc = await User.findById(id).select('-password');
    const user = userDoc ? (typeof userDoc.toObject === 'function' ? userDoc.toObject() : { ...userDoc }) : null;
    if (!isActiveUser(user)) return null;
    const digits = String(user.phone || user.username || '').replace(/\D/g, '').slice(-10);
    const cleanEmail = String(user.email || '').trim().toLowerCase();
    const isOwner = digits === '9172600587' || cleanEmail === 'rj901126@gmail.com' || cleanEmail === 'admin@abkharido.com';
    const role = isOwner ? 'super_admin' : (user.role || 'user');
    const isAdmin = isOwner || ['admin', 'super_admin', 'master_admin_legacy'].includes(role);
    return {
      user: { ...user, role, _id: String(user._id), id: String(user._id) },
      isAuthenticated: true, isAdmin,
      isStaff: isAdmin || ['support_agent', 'catalog_manager'].includes(role),
      isSeller: isAdmin || (['seller', 'vendor'].includes(role) && user.sellerStatus === 'Approved')
    };
  } catch { return null; }
}
