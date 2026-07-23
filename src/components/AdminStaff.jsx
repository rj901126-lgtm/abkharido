import React, { useState, useEffect } from 'react';
// eslint-disable-next-line
import { UserPlus, Shield, User, XCircle, CheckCircle, Edit, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

const AdminStaff = () => {
  const { showToast } = useApp();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    role: 'support_agent'
  });

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('abkharido_admin_token') || '';
      const res = await fetch('/api/staff', { headers: { 'x-admin-token': token } });
      if (res.ok) {
        setStaff(await res.json());
      }
    // eslint-disable-next-line
    } catch (err) {
      showToast('Error loading staff', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line
    fetchStaff();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = sessionStorage.getItem('abkharido_admin_token') || '';
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        showToast('Staff member added successfully', 'success');
        setIsAdding(false);
        setFormData({ username: '', email: '', password: '', fullName: '', role: 'support_agent' });
        fetchStaff();
      } else {
        const error = await res.json();
        showToast(error.error || 'Failed to add staff', 'error');
      }
    // eslint-disable-next-line
    } catch (err) {
      showToast('Network error', 'error');
    }
  };

  const handleUpdateStatus = async (id, status) => {
    if (!window.confirm(`Are you sure you want to change this staff member's status to ${status}?`)) return;
    
    try {
      const token = sessionStorage.getItem('abkharido_admin_token') || '';
      const res = await fetch(`/api/staff/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify({ status })
      });
      
      if (res.ok) {
        showToast(`Staff status updated to ${status}`, 'success');
        fetchStaff();
      } else {
        const error = await res.json();
        showToast(error.error || 'Failed to update staff', 'error');
      }
    // eslint-disable-next-line
    } catch (err) {
      showToast('Network error', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Glassmorphic Header Area */}
      <div className="admin-panel-card" style={{ padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', color: 'white', borderRadius: '24px' }}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '28px', fontFamily: 'Outfit, sans-serif', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Shield size={28} color="#818cf8" /> Enterprise Access Control (IAM)
          </h2>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '15px' }}>
            Securely manage internal roles, permissions, and staff accounts globally.
          </p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)} 
          className="btn btn-primary" 
          style={{ padding: '14px 28px', fontSize: '16px', borderRadius: '100px', background: isAdding ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)', boxShadow: isAdding ? 'none' : '0 10px 25px rgba(79, 70, 229, 0.3)', border: isAdding ? '1px solid rgba(255,255,255,0.2)' : 'none', color: 'white', display: 'flex', gap: '8px', alignItems: 'center' }}
        >
          {isAdding ? <XCircle size={18} /> : <UserPlus size={18} />}
          {isAdding ? 'Cancel Registration' : 'Register New Staff'}
        </button>
      </div>

      {isAdding && (
        <div className="admin-panel-card animate-fade-in" style={{ padding: '24px', border: '1px solid #c7d2fe', background: '#f8fafc' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', color: '#3730a3' }}>
            <Shield size={20} /> Create Sub-Admin Account
          </h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '8px' }}>Full Name *</label>
              <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required className="admin-form-input" placeholder="e.g., John Doe" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '8px' }}>Username *</label>
              <input type="text" name="username" value={formData.username} onChange={handleChange} required className="admin-form-input" placeholder="e.g., john.support" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '8px' }}>Email Address *</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required className="admin-form-input" placeholder="e.g., john@abkharido.com" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '8px' }}>Temporary Password *</label>
              <input type="text" name="password" value={formData.password} onChange={handleChange} required className="admin-form-input" placeholder="e.g., TempPass123!" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '8px' }}>Assign Enterprise Role *</label>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {[
                  { id: 'support_agent', name: 'Support Agent', desc: 'Can view Users and reply to Tickets' },
                  { id: 'catalog_manager', name: 'Catalog Manager', desc: 'Can view and edit Inventory & CMS' },
                  { id: 'admin', name: 'Standard Admin', desc: 'Can manage Orders, Inventory, Users (No Finance)' },
                  { id: 'super_admin', name: 'Super Admin', desc: 'Full access to all systems including Finance' }
                ].map(r => (
                  <label key={r.id} style={{ 
                    flex: 1, minWidth: '200px', padding: '16px', borderRadius: '12px', cursor: 'pointer', border: formData.role === r.id ? '2px solid #4f46e5' : '1px solid #cbd5e1',
                    background: formData.role === r.id ? '#eff6ff' : '#fff', transition: 'all 0.2s'
                  }}>
                    <input type="radio" name="role" value={r.id} checked={formData.role === r.id} onChange={handleChange} style={{ display: 'none' }} />
                    <div style={{ fontWeight: 'bold', color: formData.role === r.id ? '#4f46e5' : '#334155', marginBottom: '4px' }}>{r.name}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.4' }}>{r.desc}</div>
                  </label>
                ))}
              </div>
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button type="submit" className="btn btn-primary" style={{ padding: '0 32px' }}>Create Account</button>
            </div>
          </form>
        </div>
      )}

      <div className="admin-panel-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--admin-border)', background: '#f8fafc' }}>
          <h3 className="admin-form-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', background: '#e0e7ff', borderRadius: '12px', color: '#4f46e5' }}><User size={20} /></div>
            Global Staff Directory
          </h3>
        </div>
        
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>Loading active personnel...</div>
        ) : (
          <div className="admin-table-wrapper" style={{ border: 'none', boxShadow: 'none', borderRadius: 0 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Username</th>
                  <th>Assigned Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.map(member => (
                  <tr key={member._id}>
                    <td style={{ paddingLeft: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155', fontWeight: 'bold', fontSize: '16px', border: '1px solid #cbd5e1' }}>
                          {(member.fullName || member.username).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '14px' }}>{member.fullName || 'N/A'}</div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: '#475569', fontWeight: '600', fontSize: '13px' }}>@{member.username}</td>
                    <td>
                      <span className={`status-badge ${member.role === 'super_admin' ? 'danger' : member.role === 'admin' ? 'info' : 'warning'}`} style={{ padding: '6px 12px', fontSize: '12px', textTransform: 'uppercase' }}>
                        {member.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${member.status === 'Active' ? 'success' : 'danger'}`} style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        {member.status === 'Active' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                        {member.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {member.status === 'Active' ? (
                          <button 
                            className="btn btn-outline" 
                            style={{ padding: '8px 12px', fontSize: '12px', borderRadius: '8px', color: '#ef4444', borderColor: 'transparent', background: '#fee2e2' }}
                            onClick={() => handleUpdateStatus(member._id, 'Suspended')}
                          >
                            Suspend
                          </button>
                        ) : (
                          <button 
                            className="btn btn-outline" 
                            style={{ padding: '8px 12px', fontSize: '12px', borderRadius: '8px', color: '#10b981', borderColor: 'transparent', background: '#d1fae5' }}
                            onClick={() => handleUpdateStatus(member._id, 'Active')}
                          >
                            Restore
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {staff.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '15px' }}>No internal personnel records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminStaff;
