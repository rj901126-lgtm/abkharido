import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/connectDB.js';
import Ticket from '../../../../../../server/models/Ticket.js';
import User from '../../../../../../server/models/User.js';
import { getAuthenticatedUser } from '../../../../../lib/serverAuth.js';

export const dynamic = 'force-dynamic';

async function handleStatusUpdate(req, context) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth || !auth.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }

    if (!auth.isAdmin && !auth.isStaff) {
      return NextResponse.json({ error: 'Forbidden: Admin or Support privileges required to change ticket status' }, { status: 403 });
    }

    await connectDB();
    const params = await (context?.params || {});
    const id = params?.id;

    if (!id || !/^[0-9a-fA-F]{24}$/.test(String(id))) {
      return NextResponse.json({ error: 'Invalid ticket ID format' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const { status, priority } = body;

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    if (status && ['Open', 'In Progress', 'Resolved', 'Closed'].includes(status)) {
      ticket.status = status;
    }
    if (priority && ['Low', 'Medium', 'High', 'Urgent'].includes(priority)) {
      ticket.priority = priority;
    }

    const savedTicket = await ticket.save();

    const customerUser = await User.findById(savedTicket.customerId).select('fullName username email phone').lean();

    const formatted = {
      _id: savedTicket._id,
      id: savedTicket._id,
      subject: savedTicket.subject,
      priority: savedTicket.priority,
      status: savedTicket.status,
      orderId: savedTicket.orderId,
      customerId: savedTicket.customerId,
      customer: {
        id: customerUser?._id || savedTicket.customerId,
        name: customerUser?.fullName || customerUser?.username || 'Valued Customer',
        email: customerUser?.email || 'customer@abkharido.com',
        phone: customerUser?.phone || '9876543210'
      },
      messages: savedTicket.messages,
      createdAt: savedTicket.createdAt,
      updatedAt: savedTicket.updatedAt
    };

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('[PUT/POST /api/tickets/:id/status error]:', error);
    return NextResponse.json({ error: 'Failed to update ticket status' }, { status: 500 });
  }
}

export async function PUT(req, context) {
  return handleStatusUpdate(req, context);
}

export async function POST(req, context) {
  return handleStatusUpdate(req, context);
}
