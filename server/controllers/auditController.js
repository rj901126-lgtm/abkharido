import AuditLog from '../models/AuditLog.js';

// @desc    Get all audit logs
// @route   GET /api/audit-logs
// @access  Private/SuperAdmin
export const getAuditLogs = async (req, res, next) => {
  try {
    const logs = await AuditLog.find({}).sort({ createdAt: -1 }).limit(500).lean();
    res.json(logs);
  } catch (error) {
    next(error);
  }
};
