import mongoose from 'mongoose';
import Order from '../../../../server/models/Order.js';
import User from '../../../../server/models/User.js';
import Product from '../../../../server/models/Product.js';
import Coupon from '../../../../server/models/Coupon.js';
import Settlement from '../../../../server/models/Settlement.js';
import { createCashfreePgOrder, getCashfreeOrderStatus, getCashfreeConfig } from '../../../lib/cashfree.js';
import { validateCoupon } from '../../../lib/couponValidator.js';
import { lookupPincode } from '../../../utils/pincodeData.js';
import crypto from 'crypto';

export async function checkoutOrder(body, userId, gateway = false) {
  if (!userId || !/^[a-f\d]{24}$/i.test(String(userId))) throw new Error('Authenticated buyer required');
  const user = await User.findById(userId);
  if (!user) throw new Error('Buyer unavailable');
  const cart = body.cartItems || body.cart || body.orderItems;
  if (!Array.isArray(cart) || !cart.length || cart.length > 100) throw new Error('Invalid cart');
  const address = body.shippingAddress || {};
  if (!address.fullName || !(address.streetAddress || address.address) || !address.city || !(address.postalCode || address.pincode)) throw new Error('Incomplete delivery address');

  // Resolve buyer state for GST interstate compliance check
  let buyerState = (address.state || '').trim().toLowerCase();
  const rawPin = address.postalCode || address.pincode;
  if (!buyerState && rawPin) {
    const resolvedPin = lookupPincode(rawPin);
    if (resolvedPin?.state) buyerState = resolvedPin.state.trim().toLowerCase();
  }

  const items = []; let itemsPrice = 0; let referralReward = 0;
  for (const raw of cart) {
    const id = raw.product?._id || raw.product?.id || raw.product || raw.id;
    if (typeof id !== 'string' || id.length > 128) throw new Error('Invalid product');
    const product = await Product.findOne(/^[a-f\d]{24}$/i.test(id) ? { _id: id } : { $or: [{ id }, { slug: id }] });
    const qty = Number(raw.qty || raw.quantity || 1);
    if (!product || !['published', 'active'].includes(product.status) || product.isArchived || product.inStock === false || !Number.isInteger(qty) || qty < 1 || qty > 100) throw new Error('Invalid or unavailable item');

    // Verify 1P Direct vs 3P Seller & Interstate Compliance under CBIC Notification 34/2023 - Central Tax
    const merchantId = product.vendorId || product.sellerId;
    let seller = null;
    if (merchantId && mongoose.Types.ObjectId.isValid(String(merchantId))) {
      seller = await User.findById(merchantId).select('role sellerType gstin pickupAddress shopName fullName state commissionRate').lean();
      if (seller && seller.role === 'seller') {
        const isGstSeller = seller.sellerType === 'gst' || Boolean(seller.gstin);
        if (!isGstSeller) {
          // Unregistered non-GST seller: strictly intra-state only
          const sellerState = (seller.pickupAddress?.state || seller.state || 'Maharashtra').trim().toLowerCase();
          if (buyerState && sellerState && buyerState !== sellerState) {
            const prettySellerState = seller.pickupAddress?.state || seller.state || 'their home state';
            const prettyBuyerState = address.state || buyerState.toUpperCase();
            throw new Error(`GST_INTERSTATE_RESTRICTION: "${product.name}" is sold by a non-GST registered merchant in ${prettySellerState}. Under Indian GST Law (Notification 34/2023), non-GST merchants can only deliver intra-state within ${prettySellerState} and cannot ship interstate to ${prettyBuyerState}. Please remove this item to proceed.`);
          }
        }
      } else {
        seller = null;
      }
    }

    let inventoryPath = 'stock', inventorySku, variantPrice = product.price;
    // Storefront cart lines wrap the selected product; API clients may send flat lines.
    const selection = raw.product && typeof raw.product === 'object' ? raw.product : raw;
    const selectedColor = raw.selectedColor || raw.color || selection.selectedColor || selection.color;
    const selectedVariant = raw.selectedVariant?.name || raw.selectedVariant || raw.variant?.name || raw.variant || selection.selectedVariant?.name || selection.selectedVariant || selection.variant?.name || selection.variant;
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
    const is3PItem = Boolean(seller && seller._id);
    const isGstSeller = is3PItem ? (seller.sellerType === 'gst' || Boolean(seller.gstin)) : true;
    const platformRate = is3PItem ? Number(seller.commissionRate ?? product.platformCommissionRate ?? 0.08) : 0;
    const vendorAmount = is3PItem
      ? Math.round(price * qty * (1 - Math.min(1, Math.max(0, Number.isFinite(platformRate) ? platformRate : 0.08))) * 100) / 100
      : 0;
    items.push({
      product: product._id,
      name: product.name,
      image: product.image || product.images?.[0] || '/placeholder.png',
      qty,
      price,
      vendorId: is3PItem ? seller._id : undefined,
      vendorAmount,
      color: selectedColor,
      variant: selectedVariant,
      inventoryPath,
      inventorySku: inventorySku || product.sku,
      hsnCode: product.hsnCode || '8517',
      gstRate: isGstSeller ? Number(product.gstRate ?? 18) : 0,
      sellerType: is3PItem ? (isGstSeller ? 'gst' : 'non_gst') : 'gst',
      sellerGstin: is3PItem ? (seller.gstin || '') : (process.env.COMPANY_GSTIN || '27AABCA1234F1Z5'),
      sellerShopName: is3PItem ? (seller.shopName || 'Verified Merchant') : 'AbKharido Direct',
      isBillOfSupply: !isGstSeller
    });
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
    const wasCodConversion = Boolean(order.conversionBonusPending) || /cod|cash on delivery/i.test(order.paymentMethod);
    if (wasCodConversion) {
      order.paymentMethod = 'Online Payment (Prepaid)';
    }
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
    if (!order.trackingHistory) order.trackingHistory = [];
    order.trackingHistory.push({
      status: order.status,
      timestamp: new Date(),
      location: 'Cashfree Escrow Gateway',
      comment: wasCodConversion
        ? 'Converted from COD to Prepaid Online Payment (+50 Bonus AB Coins credited)'
        : `100% Escrow Payment Verified (Ref: ${paid.order_id})`
    });
    await order.save({ session }); return order;
  });
}
export async function settleOrderSellerEscrow(order, session = null) {
  if (!order || order.status !== 'Delivered' || order.sellerSettlement?.isSettled) return;
  const allItems = order.orderItems || [];
  const sellerItems = allItems.filter(i => i.vendorId && mongoose.Types.ObjectId.isValid(String(i.vendorId)));
  if (!sellerItems.length) return;

  const byVendor = new Map();
  for (const item of sellerItems) {
    const vid = String(item.vendorId);
    if (!byVendor.has(vid)) byVendor.set(vid, []);
    byVendor.get(vid).push(item);
  }

  let totalGross = 0, totalComm = 0, totalGstComm = 0, totalGateway = 0, totalTds = 0, totalTcs = 0, totalNet = 0;
  const utr = `AK-ESC-${Date.now().toString().slice(-8)}`;

  for (const [vendorId, vItems] of byVendor.entries()) {
    const sellerUser = await User.findById(vendorId).session(session || null);
    if (!sellerUser) continue;
    const isGstSeller = sellerUser.sellerType === 'gst' || Boolean(sellerUser.gstin);
    const itemsSubtotal = vItems.reduce((acc, i) => acc + (Number(i.price) || 0) * (Number(i.qty) || 1), 0);
    const commissionRate = Number(sellerUser.commissionRate || 0.08);
    const platformFee = Math.round(itemsSubtotal * commissionRate);
    const gstOnPlatformFee = Math.round(platformFee * 0.18);
    const gatewayFee = !/cod|cash on delivery/i.test(order.paymentMethod) ? Math.round(itemsSubtotal * 0.02) : 0;
    const tdsAmount = Math.round(itemsSubtotal * 0.01);
    const tcsAmount = isGstSeller ? Math.round(itemsSubtotal * 0.01) : 0;
    const netPayable = Math.max(0, itemsSubtotal - platformFee - gstOnPlatformFee - gatewayFee - tdsAmount - tcsAmount);

    totalGross += itemsSubtotal;
    totalComm += platformFee;
    totalGstComm += gstOnPlatformFee;
    totalGateway += gatewayFee;
    totalTds += tdsAmount;
    totalTcs += tcsAmount;
    totalNet += netPayable;

    if (netPayable > 0) {
      await User.updateOne({ _id: vendorId }, { $inc: { walletCash: netPayable } }, session ? { session } : {});
      await Settlement.create([{
        vendorId,
        orderId: order._id,
        orderNumber: order.cfOrderId || String(order._id),
        type: 'ORDER_CREDIT',
        grossSale: itemsSubtotal,
        platformFee: platformFee + gstOnPlatformFee,
        taxDeducted: tdsAmount + tcsAmount,
        shippingFee: 0,
        netAmount: netPayable,
        amount: netPayable,
        status: 'Paid',
        notes: `Order ${order.cfOrderId || order._id} delivered — Net 3P seller earnings credited`,
        transactionId: utr
      }], session ? { session } : {});
    }
  }

  order.sellerSettlement = {
    isSettled: true,
    grossAmount: totalGross,
    platformCommission: totalComm,
    gstOnCommission: totalGstComm,
    shippingDeduction: 0,
    gatewayFee: totalGateway,
    tdsAmount: totalTds,
    tcsAmount: totalTcs,
    netPayable: totalNet,
    settledAt: new Date(),
    utrNumber: utr
  };
}

export async function reverseOrderSellerEscrow(order, session = null, reason = 'Order cancelled/returned') {
  if (!order || !order.sellerSettlement?.isSettled || !(order.sellerSettlement?.netPayable > 0)) return;
  const allItems = order.orderItems || [];
  const sellerItems = allItems.filter(i => i.vendorId && mongoose.Types.ObjectId.isValid(String(i.vendorId)));
  if (!sellerItems.length) return;

  const byVendor = new Map();
  for (const item of sellerItems) {
    const vid = String(item.vendorId);
    if (!byVendor.has(vid)) byVendor.set(vid, []);
    byVendor.get(vid).push(item);
  }

  const revUtr = `AK-REV-${Date.now().toString().slice(-8)}`;
  for (const [vendorId, vItems] of byVendor.entries()) {
    const sellerUser = await User.findById(vendorId).session(session || null);
    if (!sellerUser) continue;
    const isGstSeller = sellerUser.sellerType === 'gst' || Boolean(sellerUser.gstin);
    const itemsSubtotal = vItems.reduce((acc, i) => acc + (Number(i.price) || 0) * (Number(i.qty) || 1), 0);
    const commissionRate = Number(sellerUser.commissionRate || 0.08);
    const platformFee = Math.round(itemsSubtotal * commissionRate);
    const gstOnPlatformFee = Math.round(platformFee * 0.18);
    const gatewayFee = !/cod|cash on delivery/i.test(order.paymentMethod) ? Math.round(itemsSubtotal * 0.02) : 0;
    const tdsAmount = Math.round(itemsSubtotal * 0.01);
    const tcsAmount = isGstSeller ? Math.round(itemsSubtotal * 0.01) : 0;
    const netPayable = Math.max(0, itemsSubtotal - platformFee - gstOnPlatformFee - gatewayFee - tdsAmount - tcsAmount);

    if (netPayable > 0) {
      await User.updateOne({ _id: vendorId }, { $inc: { walletCash: -netPayable } }, session ? { session } : {});
      await Settlement.create([{
        vendorId,
        orderId: order._id,
        orderNumber: order.cfOrderId || String(order._id),
        type: 'REFUND_DEBIT',
        grossSale: itemsSubtotal,
        platformFee: -(platformFee + gstOnPlatformFee),
        taxDeducted: -(tdsAmount + tcsAmount),
        shippingFee: 0,
        netAmount: -netPayable,
        amount: -netPayable,
        status: 'Paid',
        notes: `Escrow reversal (${reason}) for Order ${order.cfOrderId || order._id}`,
        transactionId: revUtr
      }], session ? { session } : {});
    }
  }
  order.sellerSettlement.isSettled = false;
}

export async function cancelAndRefund(id, { userId, admin = false, expired = false, reason = 'Cancelled by customer' } = {}) {
  return transaction(async session => {
    const order = await Order.findById(id).session(session);
    if (!order || (!admin && String(order.user) !== String(userId))) throw new Error('Order unavailable');
    if (order.cancellationSettled || order.status === 'Cancelled') return order;
    if (['Delivered', 'Returned'].includes(order.status)) throw new Error('Delivered or returned orders cannot be cancelled; please use the Return flow.');
    if (!admin && ['Shipped', 'In Transit', 'Out for Delivery'].includes(order.status)) {
      throw new Error('Order is already dispatched; please contact support or refuse delivery at doorstep for instant RTO.');
    }
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
    const canRefundPaid = order.isPaid && (admin || order.gatewayPaymentVerified || order.cashCollectionVerified || order.paymentResult?.status === 'SUCCESS');
    if (order.isPaid && !canRefundPaid) throw new Error('Payment requires reconciliation before refund');
    if (canRefundPaid && !order.financialRefundClaimed) {
      const arn = `ARN-${Date.now().toString().slice(-10)}`;
      credit.walletCash = order.totalPrice;
      order.financialRefundClaimed = true;
      order.refundDestination = { type: 'Wallet' };
      order.refundDetails = {
        refundArn: arn,
        refundStatus: 'Credited',
        amount: order.totalPrice,
        creditedAt: new Date()
      };
    }
    if (Object.keys(credit).length) {
      const credited = await User.updateOne({ _id: order.user }, { $inc: credit }, { session });
      if (credited.matchedCount !== 1) throw new Error('Refund recipient unavailable');
    }
    if (order.appliedCoupon) await Coupon.updateOne({ code: order.appliedCoupon, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 }, $pull: { usedBy: order.user } }, { session });
    await reverseReferral(order, session);
    await reverseOrderSellerEscrow(order, session, reason);
    order.cancellationSettled = true;
    order.trackingHistory.push({
      status: 'Cancelled',
      timestamp: new Date(),
      location: admin ? 'AbKharido Operations Command' : 'Customer Self-Service Portal',
      comment: `${reason}${order.financialRefundClaimed ? ` • ₹${order.totalPrice} Refund Credited (${order.refundDetails?.refundArn})` : ' • COD Liability Voided (₹0 Charged)'}`
    });
    await order.save({ session }); return order;
  });
}
export async function creditReturn(id) {
  return transaction(async session => {
    const order = await Order.findById(id).session(session);
    if (!order || !order.isPaid || order.status !== 'Delivered' || !['Picked Up', 'QC Passed', 'Approved'].includes(order.returnStatus) || order.returnDetails?.qcStatus === 'Failed') throw new Error('Paid delivered order and approved/picked-up return required');
    if (order.financialRefundClaimed) throw new Error('Refund already claimed');
    if (!Number.isFinite(Number(order.totalPrice)) || order.totalPrice < 0) throw new Error('Invalid refund amount');
    const amount = Math.round(order.totalPrice * 100) / 100;
    const arn = `ARN-RET-${Date.now().toString().slice(-8)}`;
    if (order.inventoryReserved && !order.inventoryReleased) {
      for (const item of order.orderItems) {
        const path = item.inventoryPath || 'stock';
        if (/^(stock|colorModels\.\d+\.variants\.\d+\.stock)$/.test(path)) {
          await Product.updateOne({ _id: item.product }, { $inc: { [path]: item.qty, soldCount: -item.qty } }, { session });
        }
      }
      order.inventoryReleased = true;
    }
    await reverseReferral(order, session);
    await reverseOrderSellerEscrow(order, session, 'Customer return QC passed & refunded');
    order.financialRefundClaimed = true; order.returnStatus = 'Refunded'; order.status = 'Returned';
    order.returnDetails.qcStatus = 'Passed';
    order.returnDetails.refundAmount = amount;
    order.returnDetails.refundMethod = order.refundDestination?.type || 'Wallet';
    order.returnDetails.refundTransactionId = arn;
    order.returnDetails.refundedAt = new Date();
    order.refundDetails = { refundArn: arn, refundStatus: 'Credited', amount, creditedAt: new Date() };
    const credit = { walletCash: amount };
    if (order.coinsDebited && !order.coinsRefunded) { credit.walletCoins = order.coinsUsed; order.coinsRefunded = true; }
    if (order.paymentRewardsCredited && !order.paymentRewardsReversed) { credit.walletCoins = (credit.walletCoins || 0) - order.paymentRewardsAmount; order.paymentRewardsReversed = true; }
    const credited = await User.updateOne({ _id: order.user }, { $inc: credit }, { session });
    if (credited.matchedCount !== 1) throw new Error('Refund recipient unavailable');
    order.trackingHistory.push({
      status: 'Return Refunded',
      timestamp: new Date(),
      location: 'AbKharido Treasury & Returns Hub',
      comment: `QC Passed. ₹${amount} refunded (${arn}) to customer wallet.`
    });
    await order.save({ session }); return order;
  });
}
// Administrative attestation of cash actually collected. This never verifies an online payment.
export async function recordCashCollection(id, amount) {
  return transaction(async session => {
    const order = await Order.findById(id).session(session);
    if (!order || !/cod|cash on delivery/i.test(order.paymentMethod) || order.status !== 'Delivered' || !Number.isFinite(Number(amount)) || Math.round(Number(amount) * 100) !== Math.round(Number(order.totalPrice) * 100)) throw new Error('Delivered COD order and exact collection amount required');
    if (order.cashCollectionVerified) return order;
    order.cashCollectionVerified = true; order.isPaid = true; order.paidAt = new Date();
    order.paymentResult = { id: `cash_${order._id}`, status: 'CASH_COLLECTION_ATTESTED', update_time: new Date().toISOString() };
    await creditReferral(order, session);
    await settleOrderSellerEscrow(order, session);
    order.trackingHistory.push({ status: 'Cash Collected', comment: 'Cash collection attested by administrator', timestamp: new Date() });
    await order.save({ session }); return order;
  });
}
export async function startConversion(order) {
  if (order.isPaid || !/cod|cash on delivery/i.test(order.paymentMethod) || ['Cancelled', 'Returned', 'Delivered'].includes(order.status)) throw new Error('Order cannot be converted');
  const config = getCashfreeConfig();
  if (!config.isConfigured) throw new Error('Payment gateway unavailable');
  const gatewayId = `AK_${order._id}_c${Date.now().toString(36)}`;
  const user = await User.findById(order.user);
  const base = process.env.NEXT_PUBLIC_SITE_URL || process.env.FRONTEND_URL;
  if (!base || !/^https?:\/\//.test(base)) throw new Error('Payment return URL is not configured');
  const gateway = await createCashfreePgOrder({ orderId: gatewayId, orderAmount: Number(order.totalPrice), customer: { id: String(order.user), phone: user?.phone || order.shippingAddress?.phone, email: user?.email, name: user?.firstName || order.shippingAddress?.fullName }, returnUrl: `${base.replace(/\/$/, '')}/checkout/return?order_id={order_id}`, notifyUrl: `${base.replace(/\/$/, '')}/api/payments/cashfree/webhook` });
  const updated = await Order.findOneAndUpdate({ _id: order._id, isPaid: false, status: { $nin: ['Cancelled', 'Returned', 'Delivered'] } }, { $set: { cfOrderId: gatewayId, conversionBonusPending: true } }, { new: true });
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
    await settleOrderSellerEscrow(order, session);
    await order.save({ session });
    return order;
  });
}
