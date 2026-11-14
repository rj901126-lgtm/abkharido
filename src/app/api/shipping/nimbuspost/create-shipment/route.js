import { findOrder, sellerOwnsOrder, requireFulfillable } from '../../../orders/financialSecurity.js';
import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/connectDB.js';
import Order from '../../../../../../server/models/Order.js';
import { getAuthenticatedUser } from '../../../../../lib/serverAuth.js';

export const dynamic = 'force-dynamic';

/**
 * NimbusPost Automated Courier Logistics Engine
 * Creates shipment on NimbusPost, gets AWB, assigns cheapest/fastest courier,
 * and generates 4-digit secure Delivery PIN for doorstep verification.
 */
export async function POST(req) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth || (!auth.isAdmin && !auth.isSeller)) {
      return NextResponse.json({ error: 'Unauthorized: Admin or Vendor access required' }, { status: 401 });
    }

    await connectDB();
    const body = await req.json().catch(() => ({}));
    const { orderId, preferredCourier } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    let order = await findOrder(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order not found in database' }, { status: 404 });
    }

    if (!auth.isAdmin && !sellerOwnsOrder(auth, order)) return NextResponse.json({ error: 'Order unavailable' }, { status: 403 });
    requireFulfillable(order);
    // Determine Courier Partner
    let chosenCourier = preferredCourier || (
      order.shippingAddress?.postalCode?.startsWith('4') 
        ? 'BlueDart Express Air' 
        : 'Delhivery Air Direct'
    );

    // Check for real NimbusPost credentials in environment
    const nimbusToken = process.env.NIMBUSPOST_TOKEN || process.env.NIMBUSPOST_API_KEY || process.env.NIMBUS_API_KEY;
    if (!nimbusToken) {
      return NextResponse.json({ error: 'NimbusPost credentials are not configured. No shipment was booked.' }, { status: 503 });
    }

    const cleanPhone = String(order.shippingAddress?.phone || '').replace(/\D/g, '').slice(-10);
    const nameParts = (order.shippingAddress?.fullName || 'Customer').trim().split(' ');
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.slice(1).join(' ') || '.';
    const nimbusPayload = {
      order_number: String(order.cfOrderId || order._id || order.id),
      shipping_address: {
        first_name: firstName,
        last_name: lastName,
        address: order.shippingAddress?.streetAddress || order.shippingAddress?.address || '',
        city: order.shippingAddress?.city || '',
        state: order.shippingAddress?.state || '',
        pincode: String(order.shippingAddress?.postalCode || order.shippingAddress?.pincode || ''),
        phone: cleanPhone
      },
      order_type: order.paymentMethod === 'Cash on Delivery' ? 'cod' : 'prepaid',
      total_amount: Number(order.totalPrice || 0),
      weight: 500,
      order_items: (order.orderItems || []).map(item => ({
        name: item.name || 'Product Item',
        qty: item.qty || 1,
        price: item.price || 0
      }))
    };

    let npData;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      let npRes;
      try {
        npRes = await fetch('https://api.nimbuspost.com/v1/shipments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${nimbusToken.trim()}`
          },
          body: JSON.stringify(nimbusPayload),
          signal: controller.signal
        });
      } finally {
        clearTimeout(timeoutId);
      }

      npData = await npRes.json().catch(() => null);
      if (!npRes.ok) {
        console.warn('[NimbusPost Booking Failed]:', npRes.status, npData?.message || 'Gateway rejected shipment');
        return NextResponse.json({ error: 'NimbusPost rejected the booking. The order was not marked shipped.' }, { status: 502 });
      }
    } catch (npErr) {
      console.warn('[NimbusPost Booking Error]:', npErr.message);
      return NextResponse.json({ error: 'NimbusPost could not confirm the booking. The order was not marked shipped.' }, { status: 502 });
    }

    const carrierData = npData?.data;
    const awbNumber = carrierData?.awb_number || carrierData?.awb;
    if (!npData?.status || !carrierData || !awbNumber) {
      return NextResponse.json({ error: 'NimbusPost returned no confirmed AWB. The order was not marked shipped.' }, { status: 502 });
    }
    chosenCourier = carrierData.courier_name || carrierData.courier || chosenCourier;
    const trackingUrl = carrierData.tracking_url || `https://track.nimbuspost.com/?awb=${encodeURIComponent(awbNumber)}`;
    const shipmentId = String(carrierData.shipment_id || carrierData.id || awbNumber);

    // Generate or retain Secure Delivery PIN
    const deliveryPin = order.deliveryPin || String(Math.floor(100000 + Math.random() * 900000));

    // Update order logistics state
    order.status = 'Shipped';
    order.courierPartner = chosenCourier;
    order.awbNumber = awbNumber;
    order.deliveryPin = deliveryPin;
    order.nimbusShipmentId = shipmentId;
    order.nimbusLabelUrl = `/api/orders/${order._id || order.id}/label`;
    order.trackingUrl = trackingUrl;

    if (!order.trackingHistory) order.trackingHistory = [];
    order.trackingHistory.push({
      status: 'Shipped',
      timestamp: new Date(),
      location: 'NimbusPost Logistics Hub',
      comment: `Dispatched via NimbusPost [${chosenCourier}] (AWB: ${awbNumber}) [Live Carrier Booked] | Doorstep PIN active`
    });

    await order.save();

    return NextResponse.json({
      success: true,
      message: 'NimbusPost shipment booked with carrier!',
      isLiveNimbus: true,
      logistics: {
        provider: 'NimbusPost 27+ Courier Engine',
        courier: chosenCourier,
        awb: awbNumber,
        trackingUrl: order.trackingUrl,
        labelUrl: order.nimbusLabelUrl,
        orderId: order._id || order.id,
        status: 'Shipped'
      }
    });

  } catch (error) {
    console.error('NimbusPost Create Shipment Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to create NimbusPost shipment' 
    }, { status: 500 });
  }
}
