import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: { type: String, required: true },
  qty: { type: Number, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  color: { type: String },
  variant: { type: String },
  inventoryPath: { type: String, default: 'stock' },
  inventorySku: { type: String },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  vendorAmount: { type: Number, default: 0 },
  hsnCode: { type: String },
  gstRate: { type: Number, default: 18 },
  sellerType: { type: String, enum: ['gst', 'non_gst', 'composition'], default: 'non_gst' },
  sellerGstin: { type: String },
  sellerShopName: { type: String },
  isBillOfSupply: { type: Boolean, default: false }
}, { _id: false });




const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderItems: [orderItemSchema],
  shippingAddress: {
    fullName: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
    phone: { type: String },
    email: { type: String },
    state: { type: String }
  },
  paymentMethod: { type: String, required: true, default: 'Razorpay' },
  paymentResult: {
    id: { type: String },
    status: { type: String },
    update_time: { type: String },
    email_address: { type: String }
  },
  itemsPrice: { type: Number, required: true, default: 0.0 },
  taxPrice: { type: Number, required: true, default: 0.0 },
  shippingPrice: { type: Number, required: true, default: 0.0 },
  totalPrice: { type: Number, required: true, default: 0.0 },
  totalPlatformFee: { type: Number, default: 0.0 },
  sellerSettlement: {
    isSettled: { type: Boolean, default: false },
    grossAmount: { type: Number, default: 0 },
    platformCommission: { type: Number, default: 0 },
    gstOnCommission: { type: Number, default: 0 },
    shippingDeduction: { type: Number, default: 0 },
    gatewayFee: { type: Number, default: 0 },
    tdsAmount: { type: Number, default: 0 },
    tcsAmount: { type: Number, default: 0 },
    netPayable: { type: Number, default: 0 },
    settledAt: { type: Date },
    utrNumber: { type: String }
  },
  
  // Discount Engine Tracking
  appliedCoupon: { type: String },
  coinsUsed: { type: Number, default: 0 },
  coinsDebited: { type: Boolean, default: false },
  coinsRefunded: { type: Boolean, default: false },
  inventoryReserved: { type: Boolean, default: false },
  inventoryReleased: { type: Boolean, default: false },
  conversionBonusPending: { type: Boolean, default: false },
  paymentRewardsCredited: { type: Boolean, default: false },
  paymentRewardsAmount: { type: Number, default: 0 },
  paymentRewardsReversed: { type: Boolean, default: false },
  gatewayPaymentVerified: { type: Boolean, default: false },
  cashCollectionVerified: { type: Boolean, default: false },
  cancellationSettled: { type: Boolean, default: false },
  financialRefundClaimed: { type: Boolean, default: false },
  
  isPaid: { type: Boolean, required: true, default: false },
  paidAt: { type: Date },
  
  isDelivered: { type: Boolean, required: true, default: false },
  deliveredAt: { type: Date },
  
  status: { type: String, enum: ['Placed', 'Pending', 'Processing', 'Packed', 'Shipped', 'In Transit', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned'], default: 'Processing' },

  // Visual Order Tracking History
  trackingHistory: [{
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    location: { type: String },
    comment: { type: String }
  }],

  // Returns / RMA & Exchange Engine
  returnStatus: { 
    type: String, 
    enum: ['None', 'Requested', 'Approved', 'Pickup Scheduled', 'Picked Up', 'In Transit', 'QC Passed', 'QC Failed', 'Rejected', 'Refunded'], 
    default: 'None' 
  },
  returnReason: { type: String },
  cancellationReason: { type: String },
  returnDetails: {
    rmaNumber: { type: String },
    returnAwb: { type: String },
    reverseCourier: { type: String },
    pickupPin: { type: String },
    pickupScheduledDate: { type: Date },
    pickedUpAt: { type: Date },
    qcStatus: { type: String, enum: ['Pending', 'Passed', 'Failed'], default: 'Pending' },
    qcRemarks: { type: String },
    refundMethod: { type: String },
    refundAmount: { type: Number },
    refundTransactionId: { type: String },
    refundedAt: { type: Date },
    adminNotes: { type: String }
  },
  
  exchangeStatus: { type: String, enum: ['None', 'Requested', 'Approved', 'Rejected', 'Exchanged'], default: 'None' },
  exchangeReason: { type: String },
  exchangeSize: { type: String },
  
  // Doorstep Security PIN & Refund Tracking
  deliveryPin: { type: String },
  deliverySlot: {
    slot: { type: String, default: 'Anytime (9 AM - 9 PM)' },
    instructions: { type: String, default: '' }
  },
  refundDestination: {
    type: { type: String, enum: ['None', 'Wallet', 'UPI', 'Bank', 'Original'], default: 'None' },
    upiId: { type: String },
    bankAccount: { type: String }
  },
  refundDetails: {
    refundArn: { type: String },
    refundStatus: { type: String, enum: ['None', 'Initiated', 'Processing', 'Credited'], default: 'None' },
    amount: { type: Number },
    creditedAt: { type: Date }
  },

  // Shipping & Logistics
  awbNumber: { type: String },
  trackingUrl: { type: String },
  courierPartner: { type: String },
  nimbusShipmentId: { type: String },
  nimbusLabelUrl: { type: String },
  
  // Payment Gateway Tracking
  // sparse: true allows multiple null values (for COD orders without a cfOrderId)
  // unique: true is the DB-level guard against double-submit race conditions
  cfOrderId: { type: String, unique: true, sparse: true },

  // TTL Stock-Release Engine
  // Set to 15 minutes after order creation for online payments.
  // The releaseExpiredOrderStock cron queries { status: 'Pending', isPaid: false, paymentExpiresAt: { $lt: now } }
  // and atomically cancels the order + restores stock.
  // COD orders should have this set to a far-future date or null.
  paymentExpiresAt: { type: Date, index: true },

  // Referral Rewards
  referralApplied: {
    referrerId: { type: String }, // username of the referrer
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isReversed: { type: Boolean, default: false },
    rewardAmount: { type: Number }, // Coins rewarded to referrer
    isCredited: { type: Boolean, default: false }
  }
}, {
  timestamps: true,
  optimisticConcurrency: true
});

// Phase 6: Database Optimization
// Add explicit indexes for frequent queries to avoid full collection scans
orderSchema.index({ user: 1, createdAt: -1 }); // Fast lookup for user's order history
orderSchema.index({ 'orderItems.vendorId': 1, createdAt: -1 }); // Fast lookup for seller dashboards
orderSchema.index({ status: 1, createdAt: -1 }); // Fast lookup for admin filtering
orderSchema.index({ createdAt: -1 }); // Fast lookup for admin sorting by date
orderSchema.index({ returnStatus: 1, createdAt: -1 }); // Fast lookup for returns & RMA management
orderSchema.index({ 'returnDetails.rmaNumber': 1 }, { sparse: true }); // Fast lookup by RMA Number
orderSchema.index({ 'returnDetails.pickupPin': 1 }, { sparse: true }); // Fast lookup for Return PIN verification
orderSchema.index({ deliveryPin: 1 }, { sparse: true }); // Fast lookup for Delivery PIN verification
// NOTE: cfOrderId index is auto-created by { unique: true, sparse: true } on the field itself
orderSchema.index({ 'orderItems.product': 1 }); // Fast lookup for product sales analysis
// Compound index for the TTL stock-release cron — covers the exact query it uses
orderSchema.index({ status: 1, isPaid: 1, paymentExpiresAt: 1 });

// Add Field-Level Encryption Plugin to protect Customer PII
import mongooseFieldEncryption from 'mongoose-field-encryption';
orderSchema.plugin(mongooseFieldEncryption.fieldEncryption, {
  fields: ['shippingAddress', 'paymentResult'],
  secret: process.env.DATABASE_ENCRYPTION_KEY || 'abkharido_default_master_encryption_key_2026_super_secure',
  saltGenerator: function (secret) {
    return process.env.DATABASE_ENCRYPTION_SALT || "1234567890123456";
  },
});

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
export default Order;
