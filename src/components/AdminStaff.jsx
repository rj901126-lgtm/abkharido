import React, { useState, useEffect } from 'react';
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
    } catch (err) {
      showToast('Error loading staff', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
    } catch (err) {
      showToast('Network error', 'error');
    }
  };

  return (
    <div className="admin-grid" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: '0 0 8px', fontSize: '24px', color: '#0f172a' }}>Team & Access Management</h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Create sub-admins and assign specific roles (RBAC) to secure your enterprise data.</p>
        </div>
        <button onClick={() => setIsAdding(!isAdding)} className="btn btn-primary" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {isAdding ? <XCircle size={18} /> : <UserPlus size={18} />}
          {isAdding ? 'Cancel' : 'Add New Staff'}
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

      <div className="admin-panel-card" style={{ padding: '24px' }}>
        <h3 className="admin-form-title" style={{ margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <User size={20} color="#475569" /> Active Enterprise Staff
        </h3>
        
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading staff members...</div>
        ) : (
          <div className="admin-table-wrapper">
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
                    <td>
                      <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{member.fullName || 'N/A'}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{member.email}</div>
                    </td>
                    <td style={{ color: '#475569', fontWeight: '500' }}>@{member.username}</td>
                    <td>
                      <span style={{ 
                        padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase',
                        background: member.role === 'super_admin' ? '#fce7f3' : member.role === 'admin' ? '#e0e7ff' : '#f1f5f9',
                        color: member.role === 'super_admin' ? '#be185d' : member.role === 'admin' ? '#4338ca' : '#475569'
                      }}>
                        {member.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <span style={{ 
                        display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 'bold',
                        color: member.status === 'Active' ? '#10b981' : '#ef4444'
                      }}>
                        {member.status === 'Active' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                        {member.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {member.status === 'Active' ? (
                          <button 
                            className="btn btn-outline" 
                            style={{ padding: '4px 8px', fontSize: '11px', color: '#ef4444', borderColor: '#fca5a5' }}
                            onClick={() => handleUpdateStatus(member._id, 'Suspended')}
                          >
                            Suspend Access
                          </button>
                        ) : (
                          <button 
                            className="btn btn-outline" 
                            style={{ padding: '4px 8px', fontSize: '11px', color: '#10b981', borderColor: '#6ee7b7' }}
                            onClick={() => handleUpdateStatus(member._id, 'Active')}
                          >
                            Restore Access
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {staff.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>No staff members found.</td>
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
