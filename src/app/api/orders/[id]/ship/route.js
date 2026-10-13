import { findOrder, ownsOrder, sellerOwnsOrder, requireFulfillable } from '../../financialSecurity.js';
import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/connectDB.js';
import Order from '../../../../../../server/models/Order.js';
import { getAuthenticatedUser } from '../../../../../lib/serverAuth.js';

export const dynamic = 'force-dynamic';

export async function POST(req, context) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth || (!auth.isAdmin && !auth.isSeller)) {
      return NextResponse.json({ error: 'Unauthorized: Admin or Vendor access required' }, { status: 401 });
    }

    await connectDB();
    const params = await (context?.params || {});
    const id = params?.id;
    const body = await req.json().catch(() => ({}));
    const { courierPartner = 'Delhivery Express', awbNumber = `ABK-${Date.now().toString().slice(-8)}` } = body;

    let order = await findOrder(id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (!auth.isAdmin && !sellerOwnsOrder(auth, order)) return NextResponse.json({ error: 'Order unavailable' }, { status: 403 });
    requireFulfillable(order);
    order.status = 'Shipped';
    order.courierPartner = courierPartner;
    order.awbNumber = awbNumber;

    if (!order.trackingHistory) order.trackingHistory = [];
    order.trackingHistory.push({
      status: 'Shipped',

      timestamp: new Date(),
      location: 'National Logistics Hub',
      comment: `Dispatched via ${courierPartner} (AWB: ${awbNumber})`
    });

    await order.save();


    return NextResponse.json({
      success: true,
      message: 'Order shipped successfully',
      courier: courierPartner,
      awb: awbNumber,
      order
    });
  } catch (error) {
    console.error('Error shipping order:', error);
    return NextResponse.json({ error: error.message || 'Failed to dispatch order' }, { status: 500 });
  }
}
