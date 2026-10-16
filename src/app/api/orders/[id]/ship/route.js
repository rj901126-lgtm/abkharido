import { findOrder, sellerOwnsOrder, requireFulfillable } from '../../financialSecurity.js';
import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/connectDB.js';
import { getAuthenticatedUser } from '../../../../../lib/serverAuth.js';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function buildCarrierTrackingUrl(courierPartner = '', awb = '') {
  const c = courierPartner.toLowerCase();
  if (c.includes('delhivery')) return `https://www.delhivery.com/track/package/${awb}`;
  if (c.includes('bluedart') || c.includes('blue dart')) return `https://www.bluedart.com/tracking?trackno=${awb}`;
  if (c.includes('xpressbees')) return `https://www.xpressbees.com/shipment/tracking?awbNo=${awb}`;
  if (c.includes('shadowfax')) return `https://tracker.shadowfax.in/#/track/${awb}`;
  if (c.includes('dtdc')) return `https://www.dtdc.in/trace.asp?strCnno=${awb}`;
  return `https://track.nimbuspost.com/?awb=${awb}`;
}

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
    const {
      courierPartner = 'Delhivery Express',
      awbNumber = `ABK-${Date.now().toString().slice(-8)}`,
      trackingUrl
    } = body;

    let order = await findOrder(id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (!auth.isAdmin && !sellerOwnsOrder(auth, order)) {
      return NextResponse.json({ error: 'Order unavailable' }, { status: 403 });
    }
    requireFulfillable(order);

    const deliveryPin = order.deliveryPin || String(crypto.randomInt(100000, 1000000));
    const resolvedTrackingUrl = trackingUrl || buildCarrierTrackingUrl(courierPartner, awbNumber);

    order.status = 'Shipped';
    order.courierPartner = courierPartner;
    order.awbNumber = awbNumber;
    order.deliveryPin = deliveryPin;
    order.trackingUrl = resolvedTrackingUrl;

    if (!order.trackingHistory) order.trackingHistory = [];
    order.trackingHistory.push({
      status: 'Shipped',
      timestamp: new Date(),
      location: 'National Logistics Hub',
      comment: `Dispatched via ${courierPartner} (AWB: ${awbNumber}) | Secure Doorstep PIN active`
    });

    await order.save();

    return NextResponse.json({
      success: true,
      message: 'Order shipped successfully',
      courier: courierPartner,
      awb: awbNumber,
      deliveryPin,
      trackingUrl: resolvedTrackingUrl,
      order
    });
  } catch (error) {
    console.error('Error shipping order:', error);
    return NextResponse.json({ error: error.message || 'Failed to dispatch order' }, { status: 500 });
  }
}
