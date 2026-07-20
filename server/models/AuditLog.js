import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    index: true // e.g., 'UPDATE_PRODUCT', 'DELETE_ORDER', 'CHANGE_SETTINGS'
  },
  resourceType: {
    type: String,
    required: true // e.g., 'PRODUCT', 'ORDER', 'USER'
  },
  resourceId: {
    type: String
  },
  details: {
    type: mongoose.Schema.Types.Mixed // JSON representation of what changed
  }
}, {
  timestamps: true
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
