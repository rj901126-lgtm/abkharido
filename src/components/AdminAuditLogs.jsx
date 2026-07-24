import React, { useState, useEffect } from 'react';
import { ShieldAlert, Clock, User } from 'lucide-react';

const AdminAuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const token = sessionStorage.getItem('abkharido_admin_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/audit-logs`, {
        headers: { 'x-admin-token': token }
      });
      if (res.ok) {
        setLogs(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading Enterprise Audit Logs...</div>;
  }

  return (
    <div className="admin-panel-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h3 className="admin-form-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <ShieldAlert size={20} color="var(--primary-color)" />
        Enterprise Audit Logs
      </h3>
      <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 16px 0' }}>
        Track every critical action taken by administrators on the platform to ensure compliance and security.
      </p>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Admin Name</th>
              <th>Action</th>
              <th>Target Type</th>
              <th>Target ID</th>
              <th>IP Address</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#888' }}>No audit logs found yet. Modifying products or orders will generate logs.</td></tr>
            ) : (
              logs.map((log) => (
                <tr key={log._id}>
                  <td style={{ fontSize: '13px', color: '#64748b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> {new Date(log.createdAt).toLocaleString()}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}><User size={14} color="#4f46e5" /> {log.adminName}</div>
                  </td>
                  <td>
                    <span style={{ 
                      padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold',
                      background: log.action.includes('DELETE') ? '#fee2e2' : log.action.includes('UPDATE') ? '#e0e7ff' : '#dcfce7',
                      color: log.action.includes('DELETE') ? '#ef4444' : log.action.includes('UPDATE') ? '#4f46e5' : '#22c55e'
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td>{log.targetModel}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{log.targetId}</td>
                  <td style={{ fontSize: '12px', color: '#888' }}>{log.ipAddress}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminAuditLogs;
