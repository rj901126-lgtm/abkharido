import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/connectDB.js';
import User from '../../../../../server/models/User.js';
import { getAuthenticatedUser } from '../../../../lib/serverAuth.js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function fetchBackend(url, options = {}) {
  const hosts = [
    process.env.BACKEND_API_URL,
    'http://127.0.0.1:5000',
    'http://localhost:5000'
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
    let username = routeParams[0];

    const auth = await getAuthenticatedUser(req);
    const decodedToken = auth?.user || null;

    // Handle /api/users/me
    if (username === 'me') {
      if (!auth || !auth.isAuthenticated) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      }
      username = auth.user.id || auth.user.username || auth.user.phone;
    }

    // SECURITY: Only admins can list all users
    if (!username) {
      if (!auth || !auth.isAdmin) {
        return NextResponse.json({ error: 'Not authorized as admin' }, { status: 403 });
      }
      const users = await User.find({}).limit(50).select('-password');
      return NextResponse.json(users);
    }

    const phoneDigits = (username && username.match(/\d{10}/)) ? username.match(/\d{10}/)[0] : (decodedToken?.phone ? decodedToken.phone.replace(/\D/g, '').slice(-10) : '');

    let user = await User.findOne({ 
      $or: [
        { username }, 
        phoneDigits ? { username: phoneDigits } : null,
        phoneDigits ? { username: new RegExp('^' + phoneDigits + '(_|$)') } : null,
        phoneDigits ? { phone: phoneDigits } : null,
        phoneDigits ? { phone: '+91' + phoneDigits } : null,
        phoneDigits ? { phone: '91' + phoneDigits } : null,
        { email: username }, 
        (decodedToken?.email && !decodedToken.email.includes(':')) ? { email: decodedToken.email.toLowerCase() } : null,
        { _id: (username && username.length === 24 && /^[0-9a-fA-F]{24}$/.test(username)) ? username : undefined }
      ].filter(Boolean) 
    }).select('-password');
    
    // Auto-upsert user on first login if token is verified or phone is present but document is not in DB yet
    if (!user && (phoneDigits || (decodedToken && (decodedToken.phone || decodedToken.username || decodedToken.email)))) {
      try {
        const phoneToUse = phoneDigits || (decodedToken?.phone ? decodedToken.phone.replace(/\D/g, '').slice(-10) : '');
        const nameToUse = decodedToken?.fullName || decodedToken?.name || 'VIP Member';
        if (phoneToUse) {
          user = await User.create({
            username: phoneToUse,
            phone: phoneToUse,
            email: (decodedToken?.email && !decodedToken.email.includes(':') && !decodedToken.email.endsWith('@abkharido.com')) ? decodedToken.email : undefined,
            fullName: nameToUse,
            walletCoins: 100,
            password: 'abkharido_otp_user_' + Date.now()
          });
        }
      } catch (upsertErr) {
        if (upsertErr.code === 11000) {
          user = await User.findOne({ $or: [
            phoneDigits ? { phone: phoneDigits } : null,
            phoneDigits ? { username: phoneDigits } : null,
            decodedToken?.phone ? { phone: decodedToken.phone.replace(/\D/g, '').slice(-10) } : null,
            decodedToken?.username ? { username: decodedToken.username } : null
          ].filter(Boolean) });
        }
      }
    }

    if (user) {
      let userObj = user.toObject();
      
      // Sanitize encrypted ciphertext if present
      if (userObj.phone && (userObj.phone.includes(':') || userObj.phone.length > 15)) {
        const cleanDigits = phoneDigits || (userObj.username && userObj.username.match(/\d{10}/) ? userObj.username.match(/\d{10}/)[0] : '') || decodedToken?.phone || '';
        if (cleanDigits) userObj.phone = cleanDigits;
      }
      if (userObj.email && (userObj.email.includes(':') || (userObj.email.endsWith('@abkharido.com') && !['admin@abkharido.com', 'support@abkharido.com', 'care@abkharido.com'].includes(userObj.email.toLowerCase())))) {
        userObj.email = decodedToken?.email || undefined;
      }
      
      let isOwnerOrAdmin = false;
      if (auth && auth.isAuthenticated) {
        if (auth.isAdmin || auth.user.id === user._id.toString() || auth.user.phone === userObj.phone || auth.user.username === userObj.username) {
          isOwnerOrAdmin = true;
        }
      }

      if (!isOwnerOrAdmin) {
        // Return safe profile representation without sensitive PII
        return NextResponse.json({
          _id: userObj._id,
          username: userObj.username,
          fullName: userObj.fullName,
          avatar: userObj.avatar,
          role: userObj.role
        });
      }

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
      
      return NextResponse.json({ 
        ...userObj, 
        walletCoins: userObj.walletCoins !== undefined ? userObj.walletCoins : 100,
        withdrawableCoins: userObj.walletCoins || 100, 
        lockedCoins: 0 
      });
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

    // SECURITY: Verify requester owns this resource or is an admin (IDOR fix)
    const auth = await getAuthenticatedUser(req);
    if (!auth || !auth.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized: Please log in to update profile' }, { status: 401 });
    }

    const targetUsername = routeParams[0];
    await connectDB();

    // Lookup target user
    const targetUser = await User.findOne({ 
      $or: [
        { username: targetUsername }, 
        { phone: targetUsername }, 
        { email: targetUsername }, 
        { _id: targetUsername?.length === 24 ? targetUsername : undefined }
      ].filter(Boolean) 
    }).lean();

    const requesterId = auth.user.id?.toString();
    const targetId = targetUser?._id?.toString() || targetUsername;

    const isOwner = (requesterId && targetId && requesterId === targetId) || 
                    auth.user.id === targetUsername || 
                    (auth.user.username && auth.user.username === targetUsername) ||
                    (auth.user.phone && auth.user.phone === targetUsername) ||
                    targetUsername === 'me';
    
    if (!isOwner && !auth.isAdmin) {
      return NextResponse.json({ error: 'Not authorized to update this profile' }, { status: 403 });
    }
    
    // ── Native Direct Mongoose Fallback when port 5000 is offline ──
    await connectDB();
    const username = routeParams[0];
    const phoneDigits = (username && username.match(/\d{10}/)) ? username.match(/\d{10}/)[0] : (body.phone ? body.phone.replace(/\D/g, '').slice(-10) : '');
    const cleanEmail = (body.email && !body.email.includes(':') && !body.email.endsWith('@abkharido.com')) ? body.email.trim().toLowerCase() : undefined;
    
    let user = await User.findOne({ 
      $or: [
        { username }, 
        phoneDigits ? { username: phoneDigits } : null,
        phoneDigits ? { username: new RegExp('^' + phoneDigits + '(_|$)') } : null,
        phoneDigits ? { phone: phoneDigits } : null,
        phoneDigits ? { phone: '+91' + phoneDigits } : null,
        phoneDigits ? { phone: '91' + phoneDigits } : null,
        { email: username }, 
        cleanEmail ? { email: cleanEmail } : null,
        { _id: (username && username.length === 24 && /^[0-9a-fA-F]{24}$/.test(username)) ? username : undefined }
      ].filter(Boolean) 
    });

    if (!user) {
      const phoneToUse = phoneDigits || (body.phone ? body.phone.replace(/\D/g, '').slice(-10) : '');
      const nameToUse = body.fullName || (body.firstName ? `${body.firstName} ${body.lastName || ''}`.trim() : 'Customer');
      try {
        if (phoneToUse || cleanEmail) {
          user = await User.create({
            _id: (username && username.length === 24 && /^[0-9a-fA-F]{24}$/.test(username)) ? username : undefined,
            username: phoneToUse || body.username || (cleanEmail ? cleanEmail.split('@')[0] : `user_${Date.now()}`),
            phone: phoneToUse || undefined,
            email: cleanEmail,
            fullName: nameToUse,
            walletCoins: 100,
            password: 'abkharido_user_' + Date.now(),
            addresses: body.addresses || []
          });
        }
      } catch (upsertErr) {
        user = await User.findOne({ $or: [
          phoneToUse ? { phone: phoneToUse } : null,
          phoneToUse ? { username: phoneToUse } : null,
          cleanEmail ? { email: cleanEmail } : null,
          { username: body.username }
        ].filter(Boolean) });
      }
    }
    
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
      if (typeof user.markModified === 'function') {
        user.markModified('addresses');
      }
      
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
    const safeUser = updatedUser.toObject();
    delete safeUser.password;
    return NextResponse.json(safeUser);
  } catch (error) {
    console.error('[User API Proxy POST Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to update user profile' }, { status: 500 });
  }
}
