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
  
  status: { type: String, enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'], default: 'Pending' },

  // Returns / RMA Engine
  returnStatus: { type: String, enum: ['None', 'Requested', 'Approved', 'Rejected', 'Refunded'], default: 'None' },
  returnReason: { type: String },

  // Shipping & Logistics
  awbNumber: { type: String },
  trackingUrl: { type: String },
  courierPartner: { type: String },
  
  // Payment Gateway Tracking
  cfOrderId: { type: String },

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
