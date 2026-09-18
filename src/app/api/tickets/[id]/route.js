import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/connectDB.js';
import Ticket from '../../../../../server/models/Ticket.js';
import { getAuthenticatedUser } from '../../../../lib/serverAuth.js';

export const dynamic = 'force-dynamic';

export async function GET(req, context) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth || !auth.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized: Please log in to view ticket' }, { status: 401 });
    }

    await connectDB();
    const params = await (context?.params || {});
    const id = params?.id;

    if (!id || !/^[0-9a-fA-F]{24}$/.test(String(id))) {
      return NextResponse.json({ error: 'Invalid ticket ID format' }, { status: 400 });
    }

    const ticket = await Ticket.findById(id)
      .populate('customerId', 'fullName username email phone avatar')
      .populate('orderId', 'totalPrice createdAt status cfOrderId')
      .lean();

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const isStaffOrAdmin = Boolean(auth.isAdmin || auth.isStaff);
    const customerIdStr = String(ticket.customerId?._id || ticket.customerId);
    const userIdStr = String(auth.user._id || auth.user.id);

    if (!isStaffOrAdmin && customerIdStr !== userIdStr) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to view this ticket' }, { status: 403 });
    }

    const formatted = {
      _id: ticket._id,
      id: ticket._id,
      subject: ticket.subject,
      priority: ticket.priority || 'Medium',
      status: ticket.status || 'Open',
      orderId: ticket.orderId,
      customerId: ticket.customerId?._id || ticket.customerId,
      customer: {
        id: ticket.customerId?._id || ticket.customerId,
        name: ticket.customerId?.fullName || ticket.customerId?.username || 'Valued Customer',
        email: ticket.customerId?.email || 'customer@abkharido.com',
        phone: ticket.customerId?.phone || '9876543210'
      },
      messages: (ticket.messages || []).map(m => ({
        _id: m._id,
        senderId: m.senderId,
        isAdmin: Boolean(m.isAdmin),
        content: m.content,
        createdAt: m.createdAt
      })),
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt
    };

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('[GET /api/tickets/:id error]:', error);
    return NextResponse.json({ error: 'Failed to fetch ticket details' }, { status: 500 });
  }
}
