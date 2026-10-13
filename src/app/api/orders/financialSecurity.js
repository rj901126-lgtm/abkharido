import mongoose from 'mongoose';
import Order from '../../../../server/models/Order.js';
import User from '../../../../server/models/User.js';
import Product from '../../../../server/models/Product.js';
import Coupon from '../../../../server/models/Coupon.js';
import { createCashfreePgOrder, getCashfreeOrderStatus, getCashfreeConfig } from '../../../lib/cashfree.js';
import { validateCoupon } from '../../../lib/couponValidator.js';
import crypto from 'crypto';

export async function checkoutOrder(body, userId, gateway = false) {
  if (!userId || !/^[a-f\d]{24}$/i.test(String(userId))) throw new Error('Authenticated buyer required');
  const user = await User.findById(userId);
  if (!user) throw new Error('Buyer unavailable');
  const cart = body.cartItems || body.cart || body.orderItems;
  if (!Array.isArray(cart) || !cart.length || cart.length > 100) throw new Error('Invalid cart');
  const address = body.shippingAddress || {};
  if (!address.fullName || !(address.streetAddress || address.address) || !address.city || !(address.postalCode || address.pincode)) throw new Error('Incomplete delivery address');
  const items = []; let itemsPrice = 0; let referralReward = 0;
  for (const raw of cart) {
    const id = raw.product?._id || raw.product?.id || raw.product || raw.id;
    if (typeof id !== 'string' || id.length > 128) throw new Error('Invalid product');
    const product = await Product.findOne(/^[a-f\d]{24}$/i.test(id) ? { _id: id } : { $or: [{ id }, { slug: id }] });
    const qty = Number(raw.qty || raw.quantity || 1);
    if (!product || !['published', 'active'].includes(product.status) || product.isArchived || product.inStock === false || !Number.isInteger(qty) || qty < 1 || qty > 100) throw new Error('Invalid or unavailable item');
    let inventoryPath = 'stock', inventorySku, variantPrice = product.price;
    const selectedColor = raw.selectedColor || raw.color;
    const selectedVariant = raw.selectedVariant?.name || raw.selectedVariant || raw.variant?.name || raw.variant;
    if (product.colorModels?.length) {
      const colorIndex = product.colorModels.findIndex(color => color.name === selectedColor);
      if (colorIndex < 0) throw new Error('Select a valid product color');
      const color = product.colorModels[colorIndex];
      const variantIndex = color.variants.findIndex(variant => variant.name === selectedVariant);
      if (variantIndex < 0) throw new Error('Select a valid product variant');
      const variant = color.variants[variantIndex];
      inventoryPath = `colorModels.${colorIndex}.variants.${variantIndex}.stock`;
      inventorySku = variant.sku; variantPrice = variant.price;
    } else if (selectedColor || selectedVariant) {
      throw new Error('Product option is no longer available');
    }
    const price = Number(product.flashSale?.isActive && new Date(product.flashSale.endTime) > new Date() ? product.flashSale.price : variantPrice);
    if (!Number.isFinite(price) || price < 0) throw new Error('Invalid product price');
    itemsPrice += price * qty;
    const referralRate = Number(product.userCommissionRate ?? 0.02);
    if (Number.isFinite(referralRate)) referralReward += Math.round(price * qty * Math.min(1, Math.max(0, referralRate)));
    const platformRate = Number(product.platformCommissionRate ?? 0.1);
    const vendorAmount = Math.round(price * qty * (1 - Math.min(1, Math.max(0, Number.isFinite(platformRate) ? platformRate : 0.1))) * 100) / 100;
    items.push({ product: product._id, name: product.name, image: product.image || product.images?.[0] || '/placeholder.png', qty, price, vendorId: product.vendorId || product.sellerId, vendorAmount, color: selectedColor, variant: selectedVariant, inventoryPath, inventorySku });
  }
  let discount = 0;
  if (body.couponCode) { const coupon = await validateCoupon(String(body.couponCode), itemsPrice); if (!coupon.valid) throw new Error('Invalid coupon'); discount = coupon.discountAmount; body.couponCode = coupon.couponCode; }
  const coinsUsed = body.useCoinsDiscount ? Math.max(0, Math.min(Number(user.walletCoins || 0), itemsPrice - discount)) : 0;
  const shippingPrice = itemsPrice >= 499 ? 0 : 40;
  const totalPrice = Math.round(Math.max(0, itemsPrice - discount - coinsUsed + shippingPrice) * 100) / 100;
  const isCod = /cod|cash on delivery/i.test(body.paymentMethod || (gateway ? 'Online Payment' : 'Cash on Delivery'));
  if (isCod && totalPrice > 15000) throw new Error('COD amount exceeds limit');
  if (!isCod && totalPrice <= 0) throw new Error('Online payment requires a positive payable amount');
  const id = new mongoose.Types.ObjectId(); const cfOrderId = `AK_${id}`;
  let payment;
  if (!isCod && gateway) {
    const base = process.env.NEXT_PUBLIC_SITE_URL || process.env.FRONTEND_URL;
    if (!base || !/^https?:\/\//.test(base)) throw new Error('Payment return URL is not configured');
    payment = await createCashfreePgOrder({ orderId: cfOrderId, orderAmount: totalPrice, customer: { id: String(user._id), phone: user.phone || address.phone, email: user.email, name: address.fullName }, returnUrl: `${base.replace(/\/$/, '')}/checkout/return?order_id={order_id}`, notifyUrl: `${base.replace(/\/$/, '')}/api/payments/cashfree/webhook` });
  }
  let referralApplied;
  const referralCode = body.activeReferral?.referrerId;
  if (typeof referralCode === 'string' && referralCode.length <= 100 && referralReward > 0) {
    const referrer = await User.findOne({ $or: [{ referralCode: referralCode.toUpperCase() }, { username: referralCode }] });
    if (referrer && String(referrer._id) !== String(user._id)) referralApplied = { referrerId: referrer.username, recipientId: referrer._id, rewardAmount: referralReward, isCredited: false };
  }
  const order = await reserveOrder({ referralApplied, _id: id, user: user._id, orderItems: items, shippingAddress: { fullName: address.fullName, address: address.streetAddress || address.address, city: address.city, postalCode: address.postalCode || address.pincode, country: address.country || 'India', phone: address.phone, state: address.state }, paymentMethod: isCod ? 'Cash on Delivery' : 'Online Payment', itemsPrice, shippingPrice, totalPrice, coinsUsed, appliedCoupon: body.couponCode || undefined, status: isCod ? 'Placed' : 'Pending', ...(isCod ? {} : { cfOrderId, paymentExpiresAt: new Date(Date.now() + 15 * 60000) }), deliveryPin: String(crypto.randomInt(100000, 1000000)), trackingHistory: [{ status: isCod ? 'Placed' : 'Pending', comment: 'Order reserved' }] });
  return { order, payment, orderId: isCod ? String(order._id) : cfOrderId, dbOrderId: String(order._id), amount: totalPrice, paymentSessionId: payment?.paymentSessionId, environment: getCashfreeConfig().env, success: true };
}

export const ownerId = auth => String(auth?.user?.id || auth?.user?._id || '');
export const ownsOrder = (auth, order) => Boolean(ownerId(auth)) && ownerId(auth) === String(order.user?._id || order.user);
export const sellerOwnsOrder = (auth, order) => auth?.isSeller && order.orderItems?.length > 0 && order.orderItems.every(item => item.vendorId && String(item.vendorId) === ownerId(auth));
export function requireFulfillable(order) {
  if (['Cancelled', 'Returned', 'Delivered'].includes(order.status)) throw new Error('Order cannot be fulfilled');
  if (!/cod|cash on delivery/i.test(order.paymentMethod) && !order.isPaid) throw new Error('Verified payment required before fulfillment');
}
export async function findOrder(id) {
  if (typeof id !== 'string' || !id || id.length > 128) return null;
  return Order.findOne(/^[a-f\d]{24}$/i.test(id) ? { $or: [{ _id: id }, { cfOrderId: id }] } : { cfOrderId: id });
}
async function transaction(work) {
  const session = await mongoose.startSession();
  try { let result; await session.withTransaction(async () => { result = await work(session); }); result?.decryptFieldsSync?.(); return result; }
  finally { await session.endSession(); }
}
export async function reserveOrder(orderData) {
  return transaction(async session => {
    if (orderData.appliedCoupon) {
      const coupon = await Coupon.findOne({ code: orderData.appliedCoupon }).session(session);
      if (coupon) {
        if (!coupon.isActive || coupon.expiryDate && coupon.expiryDate < new Date() || coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit || coupon.usedBy?.some(id => String(id) === String(orderData.user))) throw new Error('Coupon unavailable');
        coupon.usedCount = (coupon.usedCount || 0) + 1;
        coupon.usedBy.push(orderData.user);
        await coupon.save({ session });
      }
    }
    const coins = Number(orderData.coinsUsed || 0);
    if (!Number.isFinite(coins) || coins < 0) throw new Error('Invalid wallet reservation');
    if (coins > 0) {
      const debit = await User.updateOne({ _id: orderData.user, walletCoins: { $gte: coins } }, { $inc: { walletCoins: -coins } }, { session });
      if (debit.modifiedCount !== 1) throw new Error('Insufficient wallet balance');
    }
    for (const item of orderData.orderItems) {
      if (!Number.isInteger(item.qty) || item.qty <= 0) throw new Error('Invalid quantity');
      const path = item.inventoryPath || 'stock';
      if (!/^(stock|colorModels\.\d+\.variants\.\d+\.stock)$/.test(path)) throw new Error('Invalid inventory reservation');
      const stock = await Product.updateOne({ _id: item.product, [path]: { $gte: item.qty } }, { $inc: { [path]: -item.qty, soldCount: item.qty } }, { session });
      if (stock.modifiedCount !== 1) throw new Error('Insufficient inventory');
    }
    const [order] = await Order.create([{ ...orderData, coinsDebited: coins > 0, inventoryReserved: true }], { session });
    const buyer = await User.updateOne({ _id: order.user }, { $set: { cart: [], cartUpdatedAt: new Date() } }, { session });
    if (buyer.matchedCount !== 1) throw new Error('Buyer unavailable');
    return order;
  });
}
export async function settleVerifiedPayment(id) {
  const original = await findOrder(id);
  if (!original?.cfOrderId) throw new Error('Gateway order binding missing');
  const paid = await getCashfreeOrderStatus(original.cfOrderId);
  const amount = Number(paid.order_amount);
  if (paid.simulated || paid.order_status !== 'PAID' || paid.order_id !== original.cfOrderId || paid.order_currency !== 'INR' || !Number.isFinite(amount) || Math.round(amount * 100) !== Math.round(Number(original.totalPrice) * 100)) throw new Error('Payment is not verified');
  return transaction(async session => {
    const order = await Order.findById(original._id).session(session);
    if (order.isPaid) { if (!order.gatewayPaymentVerified) throw new Error('Legacy payment requires reconciliation'); return order; }
    if (order.cfOrderId !== paid.order_id || Math.round(Number(order.totalPrice) * 100) !== Math.round(amount * 100) || ['Cancelled', 'Returned'].includes(order.status)) throw new Error('Order is no longer payable');
    if (!order.inventoryReserved || order.coinsUsed > 0 && !order.coinsDebited) throw new Error('Legacy reservation requires reconciliation before settlement');
    order.gatewayPaymentVerified = true;
    order.isPaid = true; order.paidAt = new Date();
    if (order.status === 'Pending') order.status = 'Placed';
    order.paymentResult = { id: paid.order_id, status: 'SUCCESS', update_time: new Date().toISOString() };
    if (!order.paymentRewardsCredited) {
      const reward = Math.floor(order.totalPrice * 0.005) + (order.conversionBonusPending ? 50 : 0);
      const credit = await User.updateOne({ _id: order.user }, { $inc: { walletCoins: reward }, $set: { cart: [] } }, { session });
      if (credit.matchedCount !== 1) throw new Error('Buyer unavailable');
      order.paymentRewardsCredited = true;
      order.paymentRewardsAmount = reward;
      await creditReferral(order, session);
    }
    await order.save({ session }); return order;
  });
}
export async function cancelAndRefund(id, { userId, admin = false, expired = false, reason = 'Cancelled by customer' } = {}) {
  return transaction(async session => {
    const order = await Order.findById(id).session(session);
    if (!order || (!admin && String(order.user) !== String(userId))) throw new Error('Order unavailable');
    if (order.cancellationSettled) return order;
    if (['Delivered', 'Returned', 'Shipped', 'In Transit', 'Out for Delivery'].includes(order.status)) throw new Error('Order cannot be cancelled');
    if (expired && (order.isPaid || order.status !== 'Pending' || !order.paymentExpiresAt || order.paymentExpiresAt > new Date())) throw new Error('Order has not expired');
    // Claim and credit are committed together, so retries never lose or duplicate money.
    order.status = 'Cancelled'; order.cancellationReason = reason;
    if (order.inventoryReserved && !order.inventoryReleased) {
      for (const item of order.orderItems) {
        const path = item.inventoryPath || 'stock';
        if (!/^(stock|colorModels\.\d+\.variants\.\d+\.stock)$/.test(path)) throw new Error('Invalid inventory reservation');
        await Product.updateOne({ _id: item.product }, { $inc: { [path]: item.qty, soldCount: -item.qty } }, { session });
      }
      order.inventoryReleased = true;
    }
    if (!Number.isFinite(Number(order.totalPrice)) || order.totalPrice < 0 || !Number.isFinite(Number(order.coinsUsed)) || order.coinsUsed < 0) throw new Error('Invalid refund amount');
    const credit = {};
    if (order.coinsDebited && !order.coinsRefunded) { credit.walletCoins = order.coinsUsed; order.coinsRefunded = true; }
    if (order.paymentRewardsCredited && !order.paymentRewardsReversed) { credit.walletCoins = (credit.walletCoins || 0) - order.paymentRewardsAmount; order.paymentRewardsReversed = true; }
    if (order.isPaid && !order.gatewayPaymentVerified && !order.cashCollectionVerified) throw new Error('Payment requires reconciliation before refund');
    if (order.isPaid && !order.financialRefundClaimed) { credit.walletCash = order.totalPrice; order.financialRefundClaimed = true; order.refundDetails = { refundStatus: 'Credited', amount: order.totalPrice, creditedAt: new Date() }; }
    if (Object.keys(credit).length) {
      const credited = await User.updateOne({ _id: order.user }, { $inc: credit }, { session });
      if (credited.matchedCount !== 1) throw new Error('Refund recipient unavailable');
    }
    if (order.appliedCoupon) await Coupon.updateOne({ code: order.appliedCoupon, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 }, $pull: { usedBy: order.user } }, { session });
    await reverseReferral(order, session);
    order.cancellationSettled = true;
    order.trackingHistory.push({ status: 'Cancelled', timestamp: new Date(), comment: reason });
    await order.save({ session }); return order;
  });
}
export async function creditReturn(id) {
  return transaction(async session => {
    const order = await Order.findById(id).session(session);
    if (!order || !order.isPaid || !order.gatewayPaymentVerified && !order.cashCollectionVerified || order.status !== 'Delivered' || !['Picked Up', 'QC Passed'].includes(order.returnStatus) || order.returnDetails?.qcStatus === 'Failed') throw new Error('Paid order and received return required');
    if (order.financialRefundClaimed) throw new Error('Refund already claimed');
    if (!Number.isFinite(Number(order.totalPrice)) || order.totalPrice < 0) throw new Error('Invalid refund amount');
    if (!['None', 'Wallet'].includes(order.refundDestination?.type || 'None')) throw new Error('Only an atomic wallet refund is supported by this operation');
    const amount = Math.round(order.totalPrice * 100) / 100;
    await reverseReferral(order, session);
    order.financialRefundClaimed = true; order.returnStatus = 'Refunded'; order.status = 'Returned';
    order.returnDetails.qcStatus = 'Passed'; order.returnDetails.refundAmount = amount; order.returnDetails.refundMethod = 'Wallet'; order.returnDetails.refundedAt = new Date();
    order.refundDetails = { refundStatus: 'Credited', amount, creditedAt: new Date() };
    const credit = { walletCash: amount };
    if (order.coinsDebited && !order.coinsRefunded) { credit.walletCoins = order.coinsUsed; order.coinsRefunded = true; }
    if (order.paymentRewardsCredited && !order.paymentRewardsReversed) { credit.walletCoins = (credit.walletCoins || 0) - order.paymentRewardsAmount; order.paymentRewardsReversed = true; }
    const credited = await User.updateOne({ _id: order.user }, { $inc: credit }, { session });
    if (credited.matchedCount !== 1) throw new Error('Refund recipient unavailable');
    await order.save({ session }); return order;
  });
}
// Administrative attestation of cash actually collected. This never verifies an online payment.
export async function recordCashCollection(id, amount) {
  return transaction(async session => {
    const order = await Order.findById(id).session(session);
    if (!order || !/cod|cash on delivery/i.test(order.paymentMethod) || order.status !== 'Delivered' || !Number.isFinite(Number(amount)) || Math.round(Number(amount) * 100) !== Math.round(Number(order.totalPrice) * 100)) throw new Error('Delivered COD order and exact collection amount required');
    if (order.cashCollectionVerified) return order;
    if (order.isPaid) throw new Error('Legacy payment requires reconciliation');
    order.cashCollectionVerified = true; order.isPaid = true; order.paidAt = new Date();
    order.paymentResult = { id: `cash_${order._id}`, status: 'CASH_COLLECTION_ATTESTED', update_time: new Date().toISOString() };
    await creditReferral(order, session);
    order.trackingHistory.push({ status: 'Cash Collected', comment: 'Cash collection attested by administrator', timestamp: new Date() });
    await order.save({ session }); return order;
  });
}
export async function startConversion(order) {
  if (order.isPaid || !/cod|cash on delivery/i.test(order.paymentMethod) || ['Cancelled', 'Returned', 'Delivered'].includes(order.status)) throw new Error('Order cannot be converted');
  const config = getCashfreeConfig();
  if (!config.isConfigured) throw new Error('Payment gateway unavailable');
  const gatewayId = `AK_${order._id}_convert`;
  const user = await User.findById(order.user);
  const base = process.env.NEXT_PUBLIC_SITE_URL || process.env.FRONTEND_URL;
  if (!base || !/^https?:\/\//.test(base)) throw new Error('Payment return URL is not configured');
  const gateway = await createCashfreePgOrder({ orderId: gatewayId, orderAmount: Number(order.totalPrice), customer: { id: String(order.user), phone: user?.phone, email: user?.email, name: user?.firstName }, returnUrl: `${base.replace(/\/$/, '')}/orders?order_id={order_id}`, notifyUrl: `${base.replace(/\/$/, '')}/api/payments/cashfree/webhook` });
  const updated = await Order.findOneAndUpdate({ _id: order._id, isPaid: false, status: { $nin: ['Cancelled', 'Returned', 'Delivered'] } }, { $set: { cfOrderId: gatewayId, paymentMethod: 'Online Payment (Prepaid)', conversionBonusPending: true } }, { new: true });
  if (!updated) throw new Error('Order is no longer payable');
  return { success: true, orderId: gatewayId, paymentSessionId: gateway.paymentSessionId, mode: config.env, order: updated };
}

async function creditReferral(order, session) {
  const reward = order.referralApplied;
  if (order.status !== 'Delivered' || !order.isPaid || (!order.gatewayPaymentVerified && !order.cashCollectionVerified) || !reward?.recipientId || reward.isCredited || String(reward.recipientId) === String(order.user)) return;
  if (!Number.isFinite(reward.rewardAmount) || reward.rewardAmount <= 0) return;
  const result = await User.updateOne({ _id: reward.recipientId }, { $inc: { walletCoins: reward.rewardAmount } }, { session });
  if (result.matchedCount === 1) reward.isCredited = true;
}
async function reverseReferral(order, session) {
  const reward = order.referralApplied;
  if (!reward?.isCredited || reward.isReversed) return;
  if (!reward.recipientId) throw new Error('Legacy referral requires reconciliation');
  const result = await User.updateOne({ _id: reward.recipientId }, { $inc: { walletCoins: -reward.rewardAmount } }, { session });
  if (result.matchedCount !== 1) throw new Error('Referral recipient unavailable');
  reward.isReversed = true;
}
export async function creditDeliveredReferral(id) {
  return transaction(async session => {
    const order = await Order.findById(id).session(session);
    if (!order) throw new Error('Order unavailable');
    await creditReferral(order, session);
    await order.save({ session });
    return order;
  });
}
