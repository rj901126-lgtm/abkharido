import { NextResponse } from 'next/server';
import connectDB from '../../../lib/connectDB.js';
import AuditLog from '../../../../server/models/AuditLog.js';
import { getAuthenticatedUser } from '../../../lib/serverAuth.js';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth || !auth.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }

    await connectDB();
    let logs = [];
    if (AuditLog) {
      logs = await AuditLog.find({}).sort({ createdAt: -1 }).limit(100).lean();
    }
    return NextResponse.json(logs || []);
  } catch (error) {
    return NextResponse.json([]);
  }
}

export async function POST(req) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth || !auth.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    let log = null;
    if (AuditLog) {
      log = await AuditLog.create({
        action: body.action || 'ADMIN_ACTION',
        performedBy: body.performedBy || 'super_admin',
        ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
        details: body.details || {},
        timestamp: new Date()
      });
    }
    return NextResponse.json({ success: true, log });
  } catch (error) {
    return NextResponse.json({ success: true, message: 'Logged' });
  }
}
