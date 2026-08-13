import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/connectDB.js';
import User from '../../../../../server/models/User.js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function fetchBackend(url, options = {}) {
  const hosts = [
    process.env.BACKEND_API_URL,
    'http://127.0.0.1:5000',
    'http://localhost:5000',
    'http://16.16.195.180:5000'
  ].filter(Boolean);

  const uniqueHosts = [...new Set(hosts.map(h => h.replace(/\/$/, '')))];
  for (const host of uniqueHosts) {
    try {
      const targetUrl = `${host}${url}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(targetUrl, { ...options, signal: controller.signal });
      clearTimeout(timeout);
      if (res && res.status < 500) return res;
    } catch (err) {
      // Continue to try next host or native Mongoose fallback
    }
  }
  return null;
}

export async function GET(req, { params }) {
  try {
    const resolvedParams = await params;
    const routeParams = resolvedParams?.params || [];
    const path = `/api/users/${routeParams.join('/')}`;
    
    // Skip proxying to Express for profile GET requests to ensure our new fields are returned 
    // (the old Express server's Mongoose schema would strip them out)
    if (routeParams.length > 0 && routeParams[0] !== 'admin') {
      // Proceed directly to the Mongoose fallback below
    } else {
      // Try external Express service first for other routes
      const backendRes = await fetchBackend(path, { method: 'GET', headers: { 'Authorization': req.headers.get('authorization') || '' } });
      if (backendRes) {
        const data = await backendRes.json().catch(() => ({ error: 'Invalid backend JSON' }));
        return NextResponse.json(data, { status: backendRes.status });
      }
    }

    // ── Native Direct Mongoose Fallback when port 5000 is offline ──
    await connectDB();
    const username = routeParams[0];
    // SECURITY: VULN-03 — Only admins can list all users
    if (!username) {
      const authHeader = req.headers.get('authorization') || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
      if (!token) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
      }
      try {
        const { default: jwt } = await import('jsonwebtoken');
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
        const decoded = jwt.verify(token, jwtSecret);
        await connectDB();
        const { default: UserModel } = await import('../../../../../server/models/User.js');
        const requester = await UserModel.findById(decoded.id).select('role').lean();
        if (!requester || !['admin', 'super_admin'].includes(requester.role)) {
          return NextResponse.json({ error: 'Not authorized as admin' }, { status: 403 });
        }
        const users = await UserModel.find({}).limit(50).select('-password');
        return NextResponse.json(users);
      } catch (e) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
      }
    }

    const user = await User.findOne({ $or: [{ username }, { phone: username }, { email: username }, { _id: username.length === 24 ? username : undefined }].filter(Boolean) }).select('-password');
    
    if (user) {
      let userObj = user.toObject();
      
      // Automatic fallback migration for legacy addresses
      if ((!userObj.addresses || userObj.addresses.length === 0) && (userObj.address || userObj.city || userObj.pincode)) {
        userObj.addresses = [{
          id: 'legacy-1',
          name: userObj.fullName || 'Default User',
          phone: userObj.phone || '',
          houseNo: userObj.houseNo || '',
          streetArea: userObj.streetArea || '',
          streetAddress: userObj.address || '',
          city: userObj.city || '',
          pincode: userObj.pincode || '',
          state: userObj.state || '',
          addressType: userObj.addressType || 'Home',
          isDefault: true
        }];
      }
      
      return NextResponse.json({ ...userObj, withdrawableCoins: userObj.walletCoins || 0, lockedCoins: 0 });
    }

    return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
  } catch (error) {
    console.error('[User API Proxy GET Error]:', error);
    return NextResponse.json({ error: 'Failed to retrieve profile' }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const resolvedParams = await params;
    const routeParams = resolvedParams?.params || [];
    const path = `/api/users/${routeParams.join('/')}`;
    const body = await req.json();

    // Skip proxying to Express for profile updates to ensure our new fields are saved by the updated Next.js route
    if (!path.endsWith('/update')) {
      const backendRes = await fetchBackend(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': req.headers.get('authorization') || '' },
        body: JSON.stringify(body)
      });
      if (backendRes) {
        const data = await backendRes.json().catch(() => ({ error: 'Invalid backend JSON' }));
        return NextResponse.json(data, { status: backendRes.status });
      }
    }

    // SECURITY: VULN-04 — Verify requester owns this resource or is an admin (IDOR fix)
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (token) {
      try {
        const { default: jwt } = await import('jsonwebtoken');
        const jwtSecret = process.env.JWT_SECRET;
        if (jwtSecret) {
          const decoded = jwt.verify(token, jwtSecret);
          await connectDB();
          const targetUsername = routeParams[0];
          // Allow only if: the token user's id/username matches the target, OR they are an admin
          const isOwner = decoded.id === targetUsername || 
            (await User.findById(decoded.id).select('username role').lean())?.username === targetUsername;
          const requesterRole = (await User.findById(decoded.id).select('role').lean())?.role;
          const isAdmin = ['admin', 'super_admin'].includes(requesterRole);
          if (!isOwner && !isAdmin) {
            return NextResponse.json({ error: 'Not authorized to update this profile' }, { status: 403 });
          }
        }
      } catch (e) {
        return NextResponse.json({ error: 'Not authorized: invalid token' }, { status: 401 });
      }
    } else {
      // No token provided at all — reject
      return NextResponse.json({ error: 'Not authorized: no token provided' }, { status: 401 });
    }
    // ── Native Direct Mongoose Fallback when port 5000 is offline ──
    await connectDB();
    const username = routeParams[0];
    const user = await User.findOne({ $or: [{ username }, { phone: username }, { email: username }, { _id: username?.length === 24 ? username : undefined }].filter(Boolean) });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    }

    if (body.firstName && body.lastName) {
      user.firstName = body.firstName;
      user.lastName = body.lastName;
      user.fullName = `${body.firstName} ${body.lastName}`;
    } else if (body.fullName) {
      user.fullName = body.fullName;
    }
    if (body.email) user.email = body.email;
    if (body.phone) user.phone = body.phone;
    
    // Handle Address Book Updates
    if (body.addresses && Array.isArray(body.addresses)) {
      user.addresses = body.addresses;
      
      // Keep legacy fields in sync with the default address (or the first one)
      const defaultAddr = body.addresses.find(a => a.isDefault) || body.addresses[0];
      if (defaultAddr) {
        user.address = defaultAddr.streetAddress || defaultAddr.address || '';
        user.houseNo = defaultAddr.houseNo || '';
        user.streetArea = defaultAddr.streetArea || '';
        user.addressType = defaultAddr.addressType || 'Home';
        user.pincode = defaultAddr.pincode || '';
        user.city = defaultAddr.city || '';
        user.state = defaultAddr.state || '';
      }
    } else {
      // Legacy updates
      if (body.address !== undefined) user.address = body.address;
      if (body.houseNo !== undefined) user.houseNo = body.houseNo;
      if (body.streetArea !== undefined) user.streetArea = body.streetArea;
      if (body.addressType !== undefined) user.addressType = body.addressType;
      if (body.pincode !== undefined) user.pincode = body.pincode;
      if (body.city !== undefined) user.city = body.city;
      if (body.state !== undefined) user.state = body.state;
    }

    const updatedUser = await user.save();
    return NextResponse.json(updatedUser.toObject());
  } catch (error) {
    console.error('[User API Proxy POST Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to update user profile' }, { status: 500 });
  }
}
