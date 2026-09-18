import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/connectDB.js';
import Ticket from '../../../../../server/models/Ticket.js';
import { getAuthenticatedUser } from '../../../../lib/serverAuth.js';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth || !auth.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized: Please log in to view tickets' }, { status: 401 });
    }

    await connectDB();
    const userId = auth.user._id || auth.user.id;

    const tickets = await Ticket.find({ customerId: userId })
      .populate('orderId', 'createdAt totalPrice status cfOrderId')
      .sort({ updatedAt: -1 })
      .lean();

    const formatted = (tickets || []).map(t => ({
      _id: t._id,
      id: t._id,
      subject: t.subject,
      priority: t.priority || 'Medium',
      status: t.status || 'Open',
      orderId: t.orderId,
      customerId: t.customerId,
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
    console.error('[GET /api/tickets/my-tickets error]:', error);
    return NextResponse.json({ error: 'Failed to fetch user tickets' }, { status: 500 });
  }
}
