import AuditLog from '../models/AuditLog.js';

export const logAdminAction = (action, targetModel) => {
  return async (req, res, next) => {
    // We capture the original res.json to intercept the response
    const originalJson = res.json;
    
    res.json = function (body) {
      // If the request was successful and it was an admin action
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        
        let targetId = 'unknown';
        if (req.params.id) targetId = req.params.id;
        else if (req.params.type) targetId = req.params.type;
        else if (body && body._id) targetId = body._id.toString();
        else if (body && body.id) targetId = body.id;

        const auditEntry = new AuditLog({
          adminId: req.user._id,
          adminName: req.user.username || 'Admin',
          action: action || req.method,
          targetId: targetId,
          targetModel: targetModel || 'Unknown',
          changes: req.method !== 'DELETE' ? req.body : { note: 'Deleted' },
          ipAddress: req.ip || req.headers['x-forwarded-for'] || 'unknown'
        });

        auditEntry.save().catch(err => console.error('Audit Log Error:', err));
      }
      
      originalJson.call(this, body);
    };
    
    next();
  };
};
