import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/connectDB.js';
import Order from '../../../../../server/models/Order.js';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json().catch(() => ({}));
    const { orderIds } = body;

    const query = Array.isArray(orderIds) && orderIds.length > 0 
      ? { _id: { $in: orderIds } } 
      : {};

    const orders = await Order.find(query).sort({ createdAt: -1 }).lean();

    const headers = [
      'Order ID',
      'Date',
      'Customer Name',
      'Phone',
      'Address',
      'City',
      'Postal Code',
      'Items Count',
      'Total Amount (INR)',
      'Payment Method',
      'Payment Status',
      'Order Status',
      'Courier Partner',
      'AWB Number'
    ];

    const rows = orders.map(ord => [
      `"${ord.cfOrderId || ord._id}"`,
      `"${new Date(ord.createdAt).toISOString()}"`,
      `"${(ord.shippingAddress?.fullName || '').replace(/"/g, '""')}"`,
      `"${(ord.shippingAddress?.phone || '').replace(/"/g, '""')}"`,
      `"${(ord.shippingAddress?.address || '').replace(/"/g, '""')}"`,
      `"${(ord.shippingAddress?.city || '').replace(/"/g, '""')}"`,
      `"${(ord.shippingAddress?.postalCode || '').replace(/"/g, '""')}"`,
      ord.orderItems?.length || 0,
      ord.totalPrice || 0,
      `"${ord.paymentMethod || ''}"`,
      ord.isPaid ? 'PAID' : 'UNPAID',
      `"${ord.status || 'Processing'}"`,
      `"${ord.courierPartner || 'NimbusPost'}"`,
      `"${ord.awbNumber || ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="shipping_manifest_${Date.now()}.csv"`
      }
    });
  } catch (error) {
    console.error('Bulk export error:', error);
    return NextResponse.json({ error: error.message || 'Failed to export orders' }, { status: 500 });
  }
}
