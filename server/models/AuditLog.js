import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  adminId: { type: String, required: true },
  adminName: { type: String, required: true },
  action: { type: String, required: true }, // e.g., 'UPDATE_PRODUCT', 'DELETE_ORDER'
  targetId: { type: String, required: true }, // ID of the product, order, etc.
  targetModel: { type: String, required: true }, // 'Product', 'Order', 'Layout'
  changes: { type: mongoose.Schema.Types.Mixed }, // JSON of what was changed
  ipAddress: { type: String }
}, { 
  timestamps: true 
});

const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
