import { NextResponse } from 'next/server';
import connectDB from '../../../lib/connectDB.js';
import Ticket from '../../../../server/models/Ticket.js';
import User from '../../../../server/models/User.js';
import Order from '../../../../server/models/Order.js';
import { getAuthenticatedUser } from '../../../lib/serverAuth.js';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth || !auth.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized: Please log in to access support tickets' }, { status: 401 });
    }

    await connectDB();

    // Customers only see their own tickets; Admin and Staff see all tickets
    const query = (auth.isAdmin || auth.isStaff) ? {} : { customerId: auth.user.id };

    const tickets = await Ticket.find(query)
      .populate('customerId', 'fullName username email phone avatar')
      .populate('orderId', 'totalPrice createdAt status cfOrderId')
      .sort({ createdAt: -1 })
      .lean();

    const formatted = (tickets || []).map(t => ({
      _id: t._id,
      id: t._id,
      subject: t.subject,
      priority: t.priority || 'Medium',
      status: t.status || 'Open',
      orderId: t.orderId,
      customerId: t.customerId?._id || t.customerId,
      customer: {
        id: t.customerId?._id || t.customerId,
        name: t.customerId?.fullName || t.customerId?.username || 'Valued Customer',
        email: t.customerId?.email || 'customer@abkharido.com',
        phone: t.customerId?.phone || '9876543210'
      },
      messages: (t.messages || []).map(m => ({
        _id: m._id,
        senderId: m.senderId,
        isAdmin: Boolean(m.isAdmin),
        content: m.content,
        createdAt: m.createdAt
      })),
      createdAt: t.createdAt,
      updatedAt: t.updatedAt
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('[GET /api/tickets error]:', error);
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth || !auth.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized: Please log in to create a support ticket' }, { status: 401 });
    }

    await connectDB();
    const body = await req.json().catch(() => ({}));
    const { subject, message, priority = 'Medium', orderId } = body;

    if (!subject || !subject.trim() || !message || !message.trim()) {
      return NextResponse.json({ error: 'Subject and message description are required' }, { status: 400 });
    }

    const isStaffOrAdmin = Boolean(auth.isAdmin || auth.isStaff);

    const ticket = new Ticket({
      customerId: auth.user._id || auth.user.id,
      orderId: (orderId && /^[0-9a-fA-F]{24}$/.test(String(orderId))) ? orderId : undefined,
      subject: subject.trim(),
      priority: ['Low', 'Medium', 'High', 'Urgent'].includes(priority) ? priority : 'Medium',
      status: 'Open',
      messages: [
        {
          senderId: auth.user._id || auth.user.id,
          isAdmin: isStaffOrAdmin,
          content: message.trim()
        }
      ]
    });

    const savedTicket = await ticket.save();

    // Populate customer info for immediate frontend display
    const customerUser = await User.findById(auth.user._id || auth.user.id).select('fullName username email phone').lean();

    const formatted = {
      _id: savedTicket._id,
      id: savedTicket._id,
      subject: savedTicket.subject,
      priority: savedTicket.priority,
      status: savedTicket.status,
      orderId: savedTicket.orderId,
      customerId: savedTicket.customerId,
      customer: {
        id: customerUser?._id || auth.user.id,
        name: customerUser?.fullName || customerUser?.username || auth.user.fullName || 'Valued Customer',
        email: customerUser?.email || auth.user.email || 'customer@abkharido.com',
        phone: customerUser?.phone || auth.user.phone || '9876543210'
      },
      messages: savedTicket.messages,
      createdAt: savedTicket.createdAt,
      updatedAt: savedTicket.updatedAt
    };

    return NextResponse.json(formatted, { status: 201 });
  } catch (error) {
    console.error('[POST /api/tickets error]:', error);
    return NextResponse.json({ error: 'Failed to create support ticket' }, { status: 500 });
  }
}
