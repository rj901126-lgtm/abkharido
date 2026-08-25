import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/connectDB.js';
import Coupon from '../../../../../server/models/Coupon.js';

export const dynamic = 'force-dynamic';

export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const id = params.id;
    await Coupon.findOneAndDelete({ $or: [{ _id: id.length === 24 ? id : undefined }, { code: id }].filter(Boolean) });
    return NextResponse.json({ success: true, message: 'Coupon deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    await connectDB();
    const id = params.id;
    const body = await req.json();
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
