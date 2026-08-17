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
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  vendorAmount: { type: Number, default: 0 },
  platformFee: { type: Number, default: 0 }
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
    country: { type: String, required: true }
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
  
  // Discount Engine Tracking
  appliedCoupon: { type: String },
  coinsUsed: { type: Number, default: 0 },
  
  isPaid: { type: Boolean, required: true, default: false },
  paidAt: { type: Date },
  
  isDelivered: { type: Boolean, required: true, default: false },
  deliveredAt: { type: Date },
  
  status: { type: String, enum: ['Pending', 'Processing', 'Packed', 'Shipped', 'In Transit', 'Out for Delivery', 'Delivered', 'Cancelled'], default: 'Pending' },

  // Visual Order Tracking History
  trackingHistory: [{
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    location: { type: String },
    comment: { type: String }
  }],

  // Returns / RMA & Exchange Engine
  returnStatus: { type: String, enum: ['None', 'Requested', 'Approved', 'Rejected', 'Refunded'], default: 'None' },
  returnReason: { type: String },
  cancellationReason: { type: String },
  
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
    rewardAmount: { type: Number }, // Coins rewarded to referrer
    isCredited: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

// Phase 6: Database Optimization
// Add explicit indexes for frequent queries to avoid full collection scans
orderSchema.index({ user: 1, createdAt: -1 }); // Fast lookup for user's order history
orderSchema.index({ 'orderItems.vendorId': 1, createdAt: -1 }); // Fast lookup for seller dashboards
orderSchema.index({ status: 1, createdAt: -1 }); // Fast lookup for admin filtering
orderSchema.index({ createdAt: -1 }); // Fast lookup for admin sorting by date
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
    return "1234567890123456"; // 16 byte static salt for deterministic encryption if needed
  },
});

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
export default Order;
