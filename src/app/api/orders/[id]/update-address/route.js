import { findOrder, ownsOrder } from '../../financialSecurity.js';
import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/connectDB.js';
import User from '../../../../../../server/models/User.js';
import { getAuthenticatedUser } from '../../../../../lib/serverAuth.js';
import { lookupPincode } from '../../../../../utils/pincodeData.js';
import mongoose from 'mongoose';

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
    const { fullName, phone, address, city, state, postalCode } = body;

    if (!address || !city || !postalCode) {
      return NextResponse.json({ error: 'Address, city, and postal code are required' }, { status: 400 });
    }

    const cleanPin = String(postalCode).replace(/\D/g, '');
    if (!/^[1-9][0-9]{5}$/.test(cleanPin)) {
      return NextResponse.json({ error: 'Invalid 6-digit Indian PIN code' }, { status: 400 });
    }

    let order = await findOrder(id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const isOwner = ownsOrder(auth, order);
    if (!isOwner && !auth.isAdmin) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to modify this order' }, { status: 403 });
    }

    const nonEditableStatuses = ['shipped', 'in transit', 'out for delivery', 'delivered', 'cancelled', 'returned'];
    if (nonEditableStatuses.includes((order.status || '').toLowerCase())) {
      return NextResponse.json(
        {
          error: `Cannot update delivery address because order is already ${order.status}`
        },
        { status: 400 }
      );
    }

    const resolvedPin = lookupPincode(cleanPin);
    const targetState = (state || resolvedPin?.state || order.shippingAddress?.state || '').trim();

    // Enforce CBIC Notification 34/2023 intra-state restriction for non-GST 3P sellers
    for (const item of order.orderItems || []) {
      const isNonGstItem = item.sellerType === 'non_gst' || item.isBillOfSupply === true;
      if (isNonGstItem) {
        let sellerState = (order.shippingAddress?.state || 'Maharashtra').trim();
        if (item.vendorId && mongoose.Types.ObjectId.isValid(String(item.vendorId))) {
          const seller = await User.findById(item.vendorId).select('pickupAddress state').lean();
          if (seller) {
            sellerState = (seller.pickupAddress?.state || seller.state || sellerState).trim();
          }
        }
        if (targetState && sellerState && targetState.toLowerCase() !== sellerState.toLowerCase()) {
          return NextResponse.json(
            {
              error: `GST_INTERSTATE_RESTRICTION: "${item.name}" is fulfilled by a non-GST merchant in ${sellerState} and can only be delivered intra-state within ${sellerState}.`
            },
            { status: 400 }
          );
        }
      }
    }

    order.shippingAddress = {
      fullName: fullName || order.shippingAddress?.fullName || 'Customer',
      phone: phone || order.shippingAddress?.phone || '',
      address: address || order.shippingAddress?.address,
      streetAddress: address || order.shippingAddress?.streetAddress,
      city: city || resolvedPin?.city || order.shippingAddress?.city,
      state: targetState,
      postalCode: cleanPin,
      country: order.shippingAddress?.country || 'India'
    };

    if (!order.trackingHistory) order.trackingHistory = [];
    order.trackingHistory.push({
      status: order.status,
      timestamp: new Date(),
      location: order.shippingAddress.city,
      comment: `Shipping address updated prior to dispatch: ${address}, ${order.shippingAddress.city} - ${cleanPin}`
    });

    await order.save();

    return NextResponse.json({
      success: true,
      message: 'Shipping address updated successfully',
      order
    });
  } catch (error) {
    console.error('Error updating order address:', error);
    return NextResponse.json({ error: error.message || 'Failed to update address' }, { status: 500 });
  }
}
