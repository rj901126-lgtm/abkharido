import { NextResponse } from 'next/server';
import connectDB from '../../../lib/connectDB.js';
import User from '../../../../server/models/User.js';

export async function GET(req) {
  try {
    await connectDB();
    const url = new URL(req.url);
    const u = url.searchParams.get('u') || '9172600587';
    
    // Find all users that match the regex or exact
    const exact = await User.findOne({ username: u }).lean();
    const allMatching = await User.find({ username: new RegExp(u, 'i') }).lean();
    
    // Also try to find by phone if decrypted correctly
    // But since phone is encrypted, we can't query it easily without full table scan.
    // So let's fetch ALL users and find which one decrypts to the phone!
    const allUsers = await User.find({}).lean();
    const userByDecryptedPhone = allUsers.filter(user => user.phone === u);

    const indexes = await User.collection.indexes();
    return NextResponse.json({
      indexes,
      allUsers: allUsers.map(x => ({ _id: x._id, username: x.username, phone: x.phone, email: x.email, __enc_email: x.__enc_email, __enc_phone: x.__enc_phone })),
      totalUsers: allUsers.length
    });
  } catch (err) {
    return NextResponse.json({ error: err.message, stack: err.stack });
  }
}
