import { NextResponse } from 'next/server';
import connectDB from '../../../lib/connectDB.js';
import User from '../../../../server/models/User.js';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    await connectDB();
    const users = await User.find({})
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      count: users.length,
      users: users || []
    });
  } catch (error) {
    console.error('[Users List API Error]:', error);
    return NextResponse.json({ error: error.message, users: [] }, { status: 500 });
  }
}
