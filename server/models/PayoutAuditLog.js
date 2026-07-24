import mongoose from 'mongoose';

const payoutAuditLogSchema = new mongoose.Schema({
  action: { 
    type: String, 
    required: true,
    enum: ['REQUESTED', 'APPROVED', 'TRANSFERRED', 'REJECTED', 'FAILED']
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  settlementId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Settlement'
  },
  performedBy: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true 
  },
  ipAddress: { type: String },
  details: { type: mongoose.Schema.Types.Mixed } // e.g., UTR Number, rejection reason
}, { 
  timestamps: true 
});

const PayoutAuditLog = mongoose.models.PayoutAuditLog || mongoose.model('PayoutAuditLog', payoutAuditLogSchema);
export default PayoutAuditLog;
