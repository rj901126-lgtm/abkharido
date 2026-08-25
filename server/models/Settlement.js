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
