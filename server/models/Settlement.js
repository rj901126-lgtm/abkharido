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
    type: String, // e.g. UTR number from bank
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Paid', 'Failed'],
    default: 'Paid'
  },
  notes: {
    type: String
  },
  settledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Admin who marked this as settled
    required: true
  }
}, {
  timestamps: true
});

const Settlement = mongoose.model('Settlement', settlementSchema);
export default Settlement;
