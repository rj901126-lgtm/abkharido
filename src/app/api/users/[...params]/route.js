import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/connectDB.js';
import User from '../../../../../server/models/User.js';

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
    const routeParams = params?.params || [];
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
    if (!username) {
      const users = await User.find({}).limit(50).select('-password');
      return NextResponse.json(users);
    }

    const user = await User.findOne({ $or: [{ username }, { phone: username }, { email: username }, { _id: username.length === 24 ? username : undefined }].filter(Boolean) }).select('-password');
    
    if (user) {
      const userObj = user.toObject();
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
    const routeParams = params?.params || [];
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
    if (body.address) user.address = body.address;
    if (body.houseNo) user.houseNo = body.houseNo;
    if (body.streetArea) user.streetArea = body.streetArea;
    if (body.addressType) user.addressType = body.addressType;
    if (body.pincode) user.pincode = body.pincode;
    if (body.city) user.city = body.city;
    if (body.state) user.state = body.state;

    const updatedUser = await user.save();
    return NextResponse.json(updatedUser.toObject());
  } catch (error) {
    console.error('[User API Proxy POST Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to update user profile' }, { status: 500 });
  }
}
