import { findOrder, ownsOrder, sellerOwnsOrder, requireFulfillable } from '../../financialSecurity.js';
import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/connectDB.js';
import Order from '../../../../../../server/models/Order.js';
import { getAuthenticatedUser } from '../../../../../lib/serverAuth.js';

export const dynamic = 'force-dynamic';

export async function POST(req, context) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth?.isAuthenticated) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    await connectDB();
    const params = await (context?.params || {});
    const id = params?.id;

    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const { requestedSize, reason } = body;

    if (typeof requestedSize !== 'string' || !requestedSize.trim() || requestedSize.length > 100) {
      return NextResponse.json({ error: 'Replacement size or variant is required' }, { status: 400 });
    }

    let order = await findOrder(id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const isOwner = ownsOrder(auth, order);
    if (!isOwner && !auth.isAdmin ) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to modify this order' }, { status: 403 });
    }

    if ((order.status || '').toLowerCase() !== 'delivered') {
      return NextResponse.json({ error: 'Exchange requests can only be placed for delivered orders' }, { status: 400 });
    }

    if (order.returnStatus && !['None', 'Rejected'].includes(order.returnStatus)) {
      return NextResponse.json({ error: 'This order already has an active return request' }, { status: 409 });
    }

    if (!['None', 'Rejected'].includes(order.exchangeStatus || 'None')) {
      return NextResponse.json({ error: `An exchange request is already in progress or completed (${order.exchangeStatus})` }, { status: 409 });
    }

    order.exchangeStatus = 'Requested';
    order.exchangeSize = requestedSize.trim();
    order.exchangeReason = typeof reason === 'string' && reason.trim() ? reason.trim().slice(0, 500) : 'Size/Fit issue';

    if (!order.trackingHistory) order.trackingHistory = [];
    order.trackingHistory.push({
      status: 'Exchange Requested',
      timestamp: new Date(),
      location: order.shippingAddress?.city || 'Returns Hub',
      comment: `Exchange requested: ${order.exchangeReason} (Replacement Size: ${order.exchangeSize}). Pickup is pending scheduling.`
    });

    await order.save();

    return NextResponse.json({
      success: true,
      message: 'Exchange request submitted. It is waiting for admin review; pickup details will be shared after scheduling.',
      order
    });
  } catch (error) {
    console.error('Error creating exchange request:', error);
    return NextResponse.json({ error: error.message || 'Failed to submit exchange request' }, { status: 500 });
  }
}

export async function PATCH(req, context) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const params = await (context?.params || {});
    const id = params?.id;
    if (!id) return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });

    await connectDB();
    const order = await findOrder(id);
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const nextStatus = body?.status;
    const allowedNextStatuses = {
      Requested: ['Approved', 'Rejected'],
      Approved: ['Exchanged']
    };
    if (!allowedNextStatuses[order.exchangeStatus]?.includes(nextStatus)) {
      return NextResponse.json({ error: 'This exchange status change is not allowed' }, { status: 409 });
    }

    order.exchangeStatus = nextStatus;
    if (!order.trackingHistory) order.trackingHistory = [];
    const statusLabel = nextStatus === 'Exchanged' ? 'Exchange Fulfilled' : `Exchange ${nextStatus}`;
    const note = typeof body?.note === 'string' ? body.note.trim().slice(0, 500) : '';
    order.trackingHistory.push({
      status: statusLabel,
      timestamp: new Date(),
      location: order.shippingAddress?.city || 'Returns Hub',
      comment: note || (nextStatus === 'Approved'
        ? 'Exchange request approved; fulfillment is awaiting coordination.'
        : nextStatus === 'Rejected'
          ? 'Exchange request was not approved.'
          : 'Replacement exchange marked fulfilled by store management.')
    });
    await order.save();

    return NextResponse.json({
      success: true,
      message: nextStatus === 'Exchanged' ? 'Exchange marked fulfilled' : `Exchange request ${nextStatus.toLowerCase()}`,
      order
    });
  } catch (error) {
    console.error('Error updating exchange request:', error);
    return NextResponse.json({ error: error.message || 'Failed to update exchange request' }, { status: 500 });
  }
}
