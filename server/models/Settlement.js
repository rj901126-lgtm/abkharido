import mongoose from 'mongoose';

const settlementSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  orderNumber: { type: String },
  type: {
    type: String,
    enum: ['ORDER_CREDIT', 'WITHDRAWAL_PAYOUT', 'REFUND_DEBIT', 'SHIPPING_ADJUSTMENT', 'COMMISSION_INVOICE'],
    default: 'ORDER_CREDIT'
  },
  grossSale: { type: Number, default: 0 },
  platformFee: { type: Number, default: 0 },
  taxDeducted: { type: Number, default: 0 },
  shippingFee: { type: Number, default: 0 },
  netAmount: { type: Number, default: 0 },
  payoutDestination: { type: String },
  utrNumber: { type: String },
  transactionId: {
    type: String // e.g. UTR number from bank. Optional until Paid
  },
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Paid', 'Failed'],
    default: 'Pending'
  },
  notes: {
    type: String
  },
  settledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Admin who marked this as settled
  }
}, {
  timestamps: true
});

const Settlement = mongoose.models.Settlement || mongoose.model('Settlement', settlementSchema);
export default Settlement;
