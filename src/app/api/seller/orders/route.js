import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/serverAuth.js';
import connectDB from '../../../../lib/connectDB.js';
import Order from '../../../../../server/models/Order.js';

export const dynamic = 'force-dynamic';

async function verifySeller(req) {
  const auth = await getAuthenticatedUser(req);
  if (!auth?.isAuthenticated || !auth.isSeller || (!auth.isAdmin && (auth.user.role !== 'seller' || auth.user.sellerStatus !== 'Approved' || auth.user.status !== 'Active'))) return null;
  return auth.user;
}

export async function GET(req) {
  try {
    await connectDB();
    const seller = await verifySeller(req);

    if (!seller || !seller.id) {
      return NextResponse.json({ error: 'Unauthorized merchant access' }, { status: 401 });
    }

    // Fetch real orders for this authenticated seller
    const orders = await Order.find({
      $or: [
        { 'orderItems.vendorId': seller.id },
        { 'items.vendorId': seller.id },
        { vendorId: seller.id }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({
      success: true,
      count: orders.length,
      orders: orders.map(o => ({ _id: o._id, cfOrderId: o.cfOrderId, createdAt: o.createdAt, status: o.status, shippingAddress: o.shippingAddress, paymentMethod: o.paymentMethod, isPaid: o.isPaid, awbNumber: o.awbNumber, courierPartner: o.courierPartner, orderItems: (o.orderItems || []).filter(i => String(i.vendorId) === String(seller.id)).map(i => ({ name: i.name, qty: i.qty, price: i.price, image: i.image, product: i.product })) }))
    });

  } catch (error) {
    console.error('Seller Orders GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch seller orders' }, { status: 500 });
  }
}


export async function PUT(req) {
  try {
    const seller = await verifySeller(req);
    if (!seller || !seller.id) {
      return NextResponse.json({ error: 'Unauthorized merchant access' }, { status: 401 });
    }

    await connectDB();
    const body = await req.json().catch(() => ({}));
    const { orderId, status = 'Dispatched', courier = 'BlueDart Express Air' } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const order = await Order.findOne({ $or: [{ _id: orderId }, { cfOrderId: orderId }, { id: orderId }] });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const sellerOwnsOrder = Array.isArray(order.orderItems) && order.orderItems.length > 0 && order.orderItems.every(i => i.vendorId && String(i.vendorId) === String(seller.id));
    if (!sellerOwnsOrder && !['admin','super_admin'].includes(seller.role)) return NextResponse.json({ error: 'Not authorized to manage this order' }, { status: 403 });
    if (!['Packed','Shipped','Dispatched'].includes(status)) return NextResponse.json({ error: 'Unsupported seller status' }, { status: 400 });
    if (!['Processing','Packed'].includes(order.status) || (!order.isPaid && !/cash|cod/i.test(order.paymentMethod))) return NextResponse.json({ error: 'Order cannot be dispatched' }, { status: 409 });
    order.status = status === 'Dispatched' ? 'Shipped' : status;
    if (typeof courier === 'string') order.courierPartner = courier.slice(0,100);
    await order.save();

    return NextResponse.json({
      success: true,
      message: `Order marked as ${status} with automated AWB tracking`,
      order: { _id: order._id, status: order.status }
    });

  } catch (error) {
    console.error('Seller Orders PUT error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update order' }, { status: 500 });
  }
}
