import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/connectDB.js';
import Coupon from '../../../../../server/models/Coupon.js';
import { getAuthenticatedUser } from '../../../../lib/serverAuth.js';

export const dynamic = 'force-dynamic';

export async function DELETE(req, context) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth || !auth.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 401 });
    }

    await connectDB();
    const params = await (context?.params || {});
    const id = params?.id;
    if (!id) return NextResponse.json({ error: 'Coupon ID required' }, { status: 400 });

    await Coupon.findOneAndDelete({ $or: [{ _id: id.length === 24 ? id : undefined }, { code: id }].filter(Boolean) });
    return NextResponse.json({ success: true, message: 'Coupon deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req, context) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth || !auth.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 401 });
    }

    await connectDB();
    const params = await (context?.params || {});
    const id = params?.id;
    if (!id) return NextResponse.json({ error: 'Coupon ID required' }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const updated = await Coupon.findOneAndUpdate(
      { $or: [{ _id: id.length === 24 ? id : undefined }, { code: id }].filter(Boolean) },
      { $set: body },
      { new: true }
    );
    return NextResponse.json({ success: true, coupon: updated });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
