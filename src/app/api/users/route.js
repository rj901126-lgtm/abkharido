import { NextResponse } from 'next/server';
import connectDB from '../../../lib/connectDB.js';
import User from '../../../../server/models/User.js';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    await connectDB();
    // Query documents without .lean() to allow field decryption hooks to run
    const users = await User.find({})
      .select('-password')
      .sort({ createdAt: -1 });

    // Deduplicate and merge user records by phone or email
    const seen = new Map();
    const cleanUsers = [];

    for (const doc of users || []) {
      const u = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
      
      // Clean phone: never return encrypted hex string
      let cleanPhone = u.phone || '';
      if (cleanPhone.includes(':') || cleanPhone.length > 15) {
        const match = (u.username || '').match(/\d{10}/);
        cleanPhone = match ? match[0] : '';
      } else {
        cleanPhone = cleanPhone.replace(/\D/g, '').slice(-10);
      }

      // Clean email: never return ciphertext or dummy auto-generated fake email
      let cleanEmail = u.email || '';
      if (
        cleanEmail.includes(':') || 
        (cleanEmail.endsWith('@abkharido.com') && !['admin@abkharido.com', 'support@abkharido.com', 'care@abkharido.com', 'wholesale@abkharido.com'].includes(cleanEmail.toLowerCase()))
      ) {
        cleanEmail = '';
      } else {
        cleanEmail = cleanEmail.trim().toLowerCase();
      }

      const key = cleanPhone ? `phone_${cleanPhone}` : (cleanEmail ? `email_${cleanEmail}` : `id_${u._id}`);

      if (seen.has(key)) {
        // Merge richer profile info into master record
        const existing = seen.get(key);
        if (!existing.email && cleanEmail) existing.email = cleanEmail;
        if (!existing.phone && cleanPhone) existing.phone = cleanPhone;
        const isGenericName = !existing.fullName || ['Customer', 'VIP Member', 'New User', 'Valued Customer'].includes(existing.fullName);
        const hasSpecificName = u.fullName && !['Customer', 'VIP Member', 'New User', 'Valued Customer'].includes(u.fullName);
        if (isGenericName && hasSpecificName) {
          existing.fullName = u.fullName;
        }
        if (u.walletCoins && u.walletCoins > existing.walletCoins) {
          existing.walletCoins = u.walletCoins;
        }
        continue;
      }

      const userRecord = {
        _id: u._id,
        id: u._id,
        username: u.username,
        fullName: u.fullName || u.name || (cleanPhone ? `Customer (${cleanPhone})` : 'Customer'),
        email: cleanEmail || '',
        phone: cleanPhone || '',
        role: u.role || 'user',
        isEmailVerified: !!u.isEmailVerified,
        walletCoins: u.walletCoins || 0,
        status: u.status || 'Active',
        isFrozen: !!u.isFrozen,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt
      };

      seen.set(key, userRecord);
      cleanUsers.push(userRecord);
    }

    return NextResponse.json({
      success: true,
      count: cleanUsers.length,
      users: cleanUsers
    });
  } catch (error) {
    console.error('[Users List API Error]:', error);
    return NextResponse.json({ error: error.message, users: [] }, { status: 500 });
  }
}

