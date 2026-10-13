import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/connectDB.js';
import Product from '../../../../../../server/models/Product.js';
import Order from '../../../../../../server/models/Order.js';
import { getAuthenticatedUser } from '../../../../../lib/serverAuth.js';
export async function GET(req, { params }) {
  try {
    const { id } = await params;
    await connectDB();
    const product = await Product.findOne({ id, status: { $in: ['published','active'] }, isArchived: { $ne: true } }).lean();
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    const reviews = (product.reviews || []).map(r => ({ name: r.name, rating: r.rating, comment: r.comment, photos: r.photos, isVerifiedPurchase: Boolean(r.isVerifiedPurchase), createdAt: r.createdAt }));
    return NextResponse.json({ reviews, rating: reviews.length ? reviews.reduce((s,r) => s + Number(r.rating || 0),0) / reviews.length : 0, reviewsCount: reviews.length });
  } catch { return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 }); }
}
export async function POST(req, { params }) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth?.isAuthenticated) return NextResponse.json({ error: 'Please log in to submit a review' }, { status: 401 });
    const { id } = await params;
    const { rating, comment, photos = [] } = await req.json();
    const numRating = Number(rating);
    if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5 || typeof comment !== 'string' || comment.trim().length < 10 || comment.length > 500) return NextResponse.json({ error: 'Invalid rating or review comment' }, { status: 400 });
    await connectDB();
    const product = await Product.findOne({ id, status: { $in: ['published','active'] }, isArchived: { $ne: true } });
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    const userId = auth.user._id || auth.user.id;
    if ((product.reviews || []).some(r => String(r.user) === String(userId))) return NextResponse.json({ error: 'Product already reviewed' }, { status: 409 });
    const purchase = await Order.exists({ user: userId, 'orderItems.product': product._id, isPaid: true, status: { $nin: ['Cancelled','Returned'] } });
    const review = { user: userId, name: auth.user.fullName || auth.user.username || 'Customer', rating: numRating, comment: comment.trim(), photos: Array.isArray(photos) ? photos.filter(p => typeof p === 'string' && /^https:\/\//.test(p)).slice(0,5) : [], isVerifiedPurchase: Boolean(purchase) };
    const updated = await Product.findOneAndUpdate({ _id: product._id, 'reviews.user': { $ne: userId } }, { $push: { reviews: review } }, { new: true, runValidators: true });
    if (!updated) return NextResponse.json({ error: 'Product already reviewed' }, { status: 409 });
    const average = updated.reviews.reduce((sum,r) => sum + Number(r.rating || 0),0) / updated.reviews.length;
    await Product.updateOne({ _id: updated._id }, { $set: { rating: average, reviewsCount: updated.reviews.length } });
    return NextResponse.json({ success: true, review: { ...review, user: undefined }, rating: average, reviewsCount: updated.reviews.length }, { status: 201 });
  } catch { return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 }); }
}
