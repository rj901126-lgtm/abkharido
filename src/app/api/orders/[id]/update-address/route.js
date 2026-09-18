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
    const { fullName, phone, address, city, state, postalCode } = body;

    if (!address || !city || !postalCode) {
      return NextResponse.json({ error: 'Address, city, and postal code are required' }, { status: 400 });
    }

    let order = null;
    if (/^[0-9a-fA-F]{24}$/.test(String(id))) {
      order = await Order.findById(id);
    }
    if (!order) {
      order = await Order.findOne({ $or: [{ cfOrderId: id }, { id }] });
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const isOwner = auth.user?._id && order.user && (String(auth.user._id) === String(order.user));
    if (!isOwner && !auth.isAdmin && !auth.isSeller) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to modify this order' }, { status: 403 });
    }

    const nonEditableStatuses = ['shipped', 'out for delivery', 'delivered', 'cancelled'];
    if (nonEditableStatuses.includes((order.status || '').toLowerCase())) {
      return NextResponse.json({ 
        error: `Cannot update delivery address because order is already ${order.status}` 
      }, { status: 400 });
    }

    order.shippingAddress = {
      fullName: fullName || order.shippingAddress?.fullName || 'Customer',
      phone: phone || order.shippingAddress?.phone || '',
      address: address || order.shippingAddress?.address,
      streetAddress: address || order.shippingAddress?.streetAddress,
      city: city || order.shippingAddress?.city,
      state: state || order.shippingAddress?.state || '',
      postalCode: postalCode || order.shippingAddress?.postalCode || order.shippingAddress?.pincode,
      country: order.shippingAddress?.country || 'India'
    };

    if (!order.trackingHistory) order.trackingHistory = [];
    order.trackingHistory.push({
      status: order.status,
      timestamp: new Date(),
      location: city,
      comment: `Shipping address updated to: ${address}, ${city} - ${postalCode}`
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
