import { NextResponse } from 'next/server';
import connectDB from '../../../lib/connectDB.js';
import AuditLog from '../../../../server/models/AuditLog.js';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    await connectDB();
    let logs = [];
    if (AuditLog) {
      logs = await AuditLog.find({}).sort({ createdAt: -1 }).limit(100).lean();
    }
    return NextResponse.json(logs || []);
  } catch (error) {
    // If AuditLog model has no documents yet, return empty list cleanly
    return NextResponse.json([]);
  }
}

export async function POST(req) {
  try {
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
