import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/connectDB.js';
import Order from '../../../../../server/models/Order.js';
import { getAuthenticatedUser } from '../../../../lib/serverAuth.js';
import { csvRows } from '../../../../utils/csvExport.js';
export const dynamic = 'force-dynamic';
export async function POST(req) {
 try {
  const auth = await getAuthenticatedUser(req);
  if (!auth?.isAuthenticated || !auth.isAdmin) return NextResponse.json({ error: 'Admin required' }, { status: 403 });
  const { orderIds } = await req.json();
  if (!Array.isArray(orderIds) || !orderIds.length || orderIds.length > 250 || orderIds.some(id => typeof id !== 'string' || !/^[a-f\d]{24}$/i.test(id))) return NextResponse.json({ error: 'Provide up to 250 valid order IDs' }, { status: 400 });
  await connectDB();
  const orders = await Order.find({ _id: { $in: orderIds } }).sort({ createdAt: -1 }).limit(250);
  const rows = [['Order ID','Date','Customer Name','Phone','Address','City','Postal Code','Items Count','Total Amount (INR)','Payment Method','Payment Status','Order Status','Courier Partner','AWB Number'], ...orders.map(o => [String(o.cfOrderId || o._id), o.createdAt.toISOString(), o.shippingAddress?.fullName, o.shippingAddress?.phone, o.shippingAddress?.address, o.shippingAddress?.city, o.shippingAddress?.postalCode, o.orderItems.length, o.totalPrice, o.paymentMethod, o.isPaid ? 'PAID':'UNPAID', o.status, o.courierPartner, o.awbNumber])];
  return new Response(csvRows(rows), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="shipping_manifest.csv"', 'Cache-Control': 'private, no-store' } });
 } catch { return NextResponse.json({ error: 'Unable to export orders' }, { status: 400 }); }
}
