import { findOrder, ownsOrder, sellerOwnsOrder, requireFulfillable, creditDeliveredReferral } from '../../financialSecurity.js';
import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/connectDB.js';
import Order from '../../../../../../server/models/Order.js';
import { getAuthenticatedUser } from '../../../../../lib/serverAuth.js';

export const dynamic = 'force-dynamic';

async function handleUpdateStatus(req, context) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth?.isAuthenticated) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (!auth.isAdmin && !auth.isSeller) {
      return NextResponse.json({ error: 'Forbidden: Admin or Seller access required to update order status' }, { status: 403 });
    }

    await connectDB();
    const params = await (context?.params || {});
    const id = params?.id;

    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const body = await req.json();
    const { status, note, location, cancellationReason, courierPartner, awbNumber, trackingUrl } = body;

    let order = await findOrder(id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (!auth.isAdmin && !sellerOwnsOrder(auth, order)) return NextResponse.json({ error: 'Order unavailable' }, { status: 403 });
    if (!auth.isAdmin && status === 'Delivered') return NextResponse.json({ error: 'Administrator delivery verification required' }, { status: 403 });
    requireFulfillable(order);
    if (courierPartner) order.courierPartner = courierPartner;
    if (awbNumber) order.awbNumber = awbNumber;
    if (trackingUrl) order.trackingUrl = trackingUrl;

    if (status && !['Processing', 'Packed', 'Shipped', 'In Transit', 'Out for Delivery', 'Delivered'].includes(status)) throw new Error('Use the dedicated financial operation for this status');
    if (status) {
      order.status = status;
      if (status === 'Delivered') {

        order.isDelivered = true;
        order.deliveredAt = new Date();
      }
      if (status === 'Cancelled' && cancellationReason) {
        order.cancellationReason = cancellationReason;
      }
      if (!order.trackingHistory) order.trackingHistory = [];
      order.trackingHistory.push({
        status,
        timestamp: new Date(),
        location: location || order.shippingAddress?.city || (courierPartner ? `${courierPartner} Hub` : 'In Transit'),
        comment: note || (awbNumber ? `Dispatched via ${courierPartner || 'Express Air'} (AWB: ${awbNumber})` : `Order updated to ${status}`)
      });
    }

    await order.save();
    if (order.status === 'Delivered') await creditDeliveredReferral(order._id);


    return NextResponse.json({
      success: true,
      message: `Order status updated to ${order.status}`,
      order
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json({ error: error.message || 'Failed to update order status' }, { status: 500 });
  }
}

export async function POST(req, context) {
  return handleUpdateStatus(req, context);
}

export async function PUT(req, context) {
  return handleUpdateStatus(req, context);
}

export async function PATCH(req, context) {
  return handleUpdateStatus(req, context);
}
