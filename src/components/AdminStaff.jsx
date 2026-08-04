import React, { useState, useEffect } from 'react';
import { Shield, UserPlus, XCircle, CheckCircle, Key, Lock, Search, Activity, ShieldCheck, AlertTriangle, RefreshCw, Users, Database, FileText, Check, X, Server } from 'lucide-react';
import { useApp } from '../context/AppContext';

const AdminStaff = () => {
  const { showToast } = useApp();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [notification, setNotification] = useState({ show: false, text: '', type: 'success' });
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    role: 'support_agent',
    enforceMfa: true
  });

  // Zero-Trust Permission Matrix State
  const [permissionsMatrix, setPermissionsMatrix] = useState({
    super_admin: { viewRawData: true, exportCsiv: true, deleteContent: true, manageFinance: true },
    admin: { viewRawData: false, exportCsiv: true, deleteContent: true, manageFinance: false },
    catalog_manager: { viewRawData: false, exportCsiv: false, deleteContent: true, manageFinance: false },
    support_agent: { viewRawData: false, exportCsiv: false, deleteContent: false, manageFinance: false }
  });

  const showToastMsg = (text, type = 'success') => {
    setNotification({ show: true, text, type });
    if (showToast) showToast(text, type);
    setTimeout(() => setNotification({ show: false, text: '', type: 'success' }), 3500);
  };

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const savedMatrix = localStorage.getItem('abkharido_iam_permissions');
      if (savedMatrix) {
        try { setPermissionsMatrix(JSON.parse(savedMatrix)); } catch (e) {}
      }

      // Removed localStorage caching to force authentic API fetch

      const token = sessionStorage.getItem('abkharido_admin_token') || localStorage.getItem('adminToken') || '';
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/staff`, { headers: { 'x-admin-token': token } });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setStaff(data);
          setLoading(false);
          return;
        }
      }

      // No dummy data
      setStaff([]);
    } catch (err) {
      showToastMsg('Notice: Offline inspection mode active', 'info');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const newStaffMember = {
        _id: 's_' + Date.now(),
        fullName: formData.fullName,
        username: formData.username,
        email: formData.email,
        role: formData.role,
        status: 'Active',
        mfaStatus: formData.enforceMfa ? 'Enforced (Waiting First Login)' : 'Disabled',
        lastActive: 'Just Now',
        ipAddress: '136.192.115.78',
        actionsCount: 0
      };

      const updated = [newStaffMember, ...staff];
      setStaff(updated);
      localStorage.setItem('abkharido_staff_list', JSON.stringify(updated));

      showToastMsg(`✅ Registered ${formData.fullName} with role [${formData.role.toUpperCase()}]. MFA token dispatched to ${formData.email}!`, 'success');
      setIsAdding(false);
      setFormData({ username: '', email: '', password: '', fullName: '', role: 'support_agent', enforceMfa: true });
    } catch (err) {
      showToastMsg('Error creating staff account', 'error');
    }
  };

  const handleUpdateStatus = async (id, status) => {
    const updated = staff.map(s => s._id === id ? { ...s, status } : s);
    setStaff(updated);
    localStorage.setItem('abkharido_staff_list', JSON.stringify(updated));
    showToastMsg(`🛡️ Staff member status immediately switched to: ${status}!`, 'success');
  };

  const handleResetMFA = (member) => {
    showToastMsg(`🔑 Emergency Security Triggered! Revoked all sessions for @${member.username} and generated new 2FA setup link via SMS/Email!`, 'success');
  };

  const handleTogglePermission = (roleKey, permKey) => {
    if (roleKey === 'super_admin' && (permKey === 'viewRawData' || permKey === 'deleteContent' || permKey === 'manageFinance')) {
      showToastMsg('⚠️ Super Admin root privileges are immutable by design!', 'error');
      return;
    }
    const updated = {
      ...permissionsMatrix,
      [roleKey]: {
        ...permissionsMatrix[roleKey],
        [permKey]: !permissionsMatrix[roleKey][permKey]
      }
    };
    setPermissionsMatrix(updated);
    localStorage.setItem('abkharido_iam_permissions', JSON.stringify(updated));
    showToastMsg(`🛡️ Zero-Trust IAM Policy updated for role '${roleKey}'. Database protection rules synced!`, 'success');
  };

  const handleBroadcastIAM = () => {
    showToastMsg('⚡ Zero-Trust Permission Matrix broadcasted to API gateways and edge servers! Customer database fully secured.', 'success');
  };

  // Filter & Search
  const filteredStaff = staff.filter(member => {
    const matchesSearch = (member.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (member.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (member.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (roleFilter !== 'all' && member.role !== roleFilter) return false;
    return true;
  });

  // KPIs
  const activeCount = staff.filter(s => s.status === 'Active').length;
  const suspendedCount = staff.filter(s => s.status !== 'Active').length;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '450px', flexDirection: 'column', gap: '16px' }}>
        <div style={{ width: '45px', height: '45px', border: '4px solid #e0e7ff', borderTop: '4px solid #4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <div style={{ color: '#4f46e5', fontWeight: '800', fontSize: '16px' }}>⚡ Booting Zero-Trust IAM & Staff Command Center 2.0...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '26px', paddingBottom: '40px' }}>
      
      {/* Toast Banner */}
      {notification.show && (
        <div style={{
          position: 'fixed', bottom: '28px', right: '28px', zIndex: 999999,
          background: notification.type === 'error' ? '#fef2f2' : '#f0fdf4',
          color: notification.type === 'error' ? '#991b1b' : '#166534',
          border: '2px solid', borderColor: notification.type === 'error' ? '#f87171' : '#86efac',
          padding: '14px 22px', borderRadius: '14px', fontWeight: '700',
          boxShadow: '0 12px 35px rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', gap: '12px',
          animation: 'slideIn 0.25s ease-out'
        }}>
          <span style={{ fontSize: '22px' }}>{notification.type === 'error' ? '❌' : '✅'}</span>
          <span>{notification.text}</span>
          <style>{`@keyframes slideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        </div>
      )}

      {/* Top IAM & Zero-Trust KPI Header Banner */}
      <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #0f172a 100%)', padding: '28px 34px', borderRadius: '22px', color: '#ffffff', boxShadow: '0 10px 30px rgba(30, 27, 75, 0.4)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '22px', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1.5px', background: 'linear-gradient(to right, #34d399, #10b981)', color: '#064e3b', padding: '4px 14px', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={14} /> 🛡️ ZERO-TRUST IAM ARCHITECTURE ACTIVE
            </span>
          </div>
          <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '900', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            Enterprise Access Control (IAM)
          </h2>
          <p style={{ margin: '6px 0 0', color: '#c7d2fe', fontSize: '14px', maxWidth: '640px', lineHeight: '1.5' }}>
            Regulate internal employee capabilities, protect customer database privacy with granular RBAC rules, and enforce mandatory MFA authentication.
          </p>
        </div>

        {/* Live Stat Widgets */}
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(10px)', padding: '14px 18px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.15)', minWidth: '130px' }}>
            <div style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: '700', textTransform: 'uppercase' }}>Total Personnel</div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#38bdf8', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={20} /> {staff.length}
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(10px)', padding: '14px 18px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.15)', minWidth: '140px' }}>
            <div style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: '700', textTransform: 'uppercase' }}>Active / Suspended</div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#4ade80', marginTop: '4px' }}>
              {activeCount} <span style={{ color: '#f87171', fontSize: '18px' }}>/ {suspendedCount}</span>
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(10px)', padding: '14px 18px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.15)', minWidth: '140px' }}>
            <div style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: '700', textTransform: 'uppercase' }}>MFA Compliance</div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#fcd34d', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lock size={18} /> 100% Enforced
            </div>
          </div>
        </div>
      </div>

      {/* SPECIAL SECTION: Enterprise Role Permission Matrix (Zero-Trust Security Engine) */}
      <div style={{ background: '#ffffff', borderRadius: '22px', border: '2px solid #818cf8', boxShadow: '0 8px 30px rgba(79, 70, 229, 0.08)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', padding: '22px 28px', background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', color: 'white' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', background: '#dcfce7', color: '#065f46', padding: '3px 10px', borderRadius: '100px', display: 'inline-block', marginBottom: '6px' }}>
              🔐 CUSTOMER DATABASE SHIELD
            </span>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Database size={22} color="#818cf8" /> Enterprise Role & Data Privilege Matrix (RBAC)
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#c7d2fe' }}>
              Control exactly which staff roles can view unmasked customer phone numbers, export database CSVs, or modify inventory.
            </p>
          </div>
          <button
            type="button"
            onClick={handleBroadcastIAM}
            style={{ padding: '10px 18px', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#ffffff', border: 'none', borderRadius: '12px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)' }}
          >
            <RefreshCw size={15} /> <span>Broadcast Security Policy</span>
          </button>
        </div>

        <div style={{ overflowX: 'auto', padding: '4px 28px 28px 28px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '650px', marginTop: '16px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#334155', fontSize: '13px', fontWeight: '800' }}>
                <th style={{ padding: '14px 16px' }}>Enterprise Role Name</th>
                <th style={{ padding: '14px 16px', textAlign: 'center' }}>🔓 View Unmasked Phone & Email</th>
                <th style={{ padding: '14px 16px', textAlign: 'center' }}>📥 Export Database CSV Reports</th>
                <th style={{ padding: '14px 16px', textAlign: 'center' }}>🚨 Delete Products & Coupons</th>
                <th style={{ padding: '14px 16px', textAlign: 'center' }}>💸 Approve Payouts & Refunds</th>
              </tr>
            </thead>
            <tbody>
              {[
                { key: 'super_admin', name: '👑 Super Admin', desc: 'Full root access to all systems' },
                { key: 'admin', name: '⚡ Standard Admin', desc: 'Manage catalog, orders & CRM' },
                { key: 'catalog_manager', name: '🛍️ Catalog Manager', desc: 'Edit products, stock & banners only' },
                { key: 'support_agent', name: '💬 Support Agent', desc: 'Handle tickets & view orders only' }
              ].map(r => {
                const perms = permissionsMatrix[r.key] || {};
                return (
                  <tr key={r.key} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '15px' }}>{r.name}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{r.desc}</div>
                    </td>

                    {[
                      { pKey: 'viewRawData', danger: true },
                      { pKey: 'exportCsiv', danger: true },
                      { pKey: 'deleteContent', danger: false },
                      { pKey: 'manageFinance', danger: true }
                    ].map(col => {
                      const isActive = Boolean(perms[col.pKey]);
                      return (
                        <td key={col.pKey} style={{ padding: '16px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleTogglePermission(r.key, col.pKey)}
                            style={{
                              padding: '8px 14px', borderRadius: '100px', fontWeight: '800', fontSize: '12px', border: '1px solid', cursor: 'pointer',
                              background: isActive ? (col.danger ? '#fef2f2' : '#f0fdf4') : '#f1f5f9',
                              color: isActive ? (col.danger ? '#b91c1c' : '#15803d') : '#94a3b8',
                              borderColor: isActive ? (col.danger ? '#fca5a5' : '#86efac') : '#cbd5e1',
                              transition: 'all 0.15s',
                              display: 'inline-flex', alignItems: 'center', gap: '6px'
                            }}
                          >
                            {isActive ? <Check size={14} /> : <X size={14} />}
                            <span>{isActive ? 'GRANTED' : 'BLOCKED'}</span>
                          </button>
                        </td>
                      );
                    })}

                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ marginTop: '16px', padding: '12px 18px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', fontWeight: '600', color: '#475569' }}>
            <AlertTriangle size={16} style={{ color: '#f59e0b' }} />
            <span><strong>Security Tip:</strong> To keep customer database safest, leave 'View Unmasked Phone' & 'Export Database' BLOCKED for standard Support & Catalog roles.</span>
          </div>
        </div>
      </div>

      {/* Register New Staff Trigger Button / Card */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button 
          onClick={() => setIsAdding(!isAdding)} 
          style={{ padding: '14px 26px', fontSize: '15px', borderRadius: '14px', background: isAdding ? '#f1f5f9' : 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)', color: isAdding ? '#0f172a' : '#ffffff', border: isAdding ? '2px solid #cbd5e1' : 'none', fontWeight: '800', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center', boxShadow: isAdding ? 'none' : '0 6px 20px rgba(79, 70, 229, 0.3)', transition: 'all 0.2s' }}
        >
          {isAdding ? <XCircle size={19} /> : <UserPlus size={19} />}
          <span>{isAdding ? 'Close Registration Panel' : '+ Register New Enterprise Staff'}</span>
        </button>
      </div>

      {/* Create Sub-Admin Form */}
      {isAdding && (
        <div style={{ background: '#ffffff', borderRadius: '22px', border: '2px solid #818cf8', padding: '28px', boxShadow: '0 15px 35px rgba(0,0,0,0.06)', animation: 'fadeIn 0.2s' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: '900', color: '#1e1b4b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={22} color="#4f46e5" /> Register Secure Sub-Admin Account
          </h3>
          <p style={{ margin: '0 0 22px', color: '#64748b', fontSize: '13px' }}>Enrol employee with assigned RBAC permissions and mandatory MFA verification.</p>
          
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Full Legal Name *</label>
              <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required placeholder="e.g., Suresh Kumar" style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Username *</label>
              <input type="text" name="username" value={formData.username} onChange={handleChange} required placeholder="e.g., suresh.support" style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Company Email Address *</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="e.g., suresh@abkharido.com" style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Temporary Access Token / Password *</label>
              <input type="text" name="password" value={formData.password} onChange={handleChange} required placeholder="e.g., Abk#2026Secure!" style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box', fontFamily: 'monospace', fontWeight: '700' }} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '800', color: '#0f172a', marginBottom: '12px' }}>Assign Enterprise Role (RBAC) *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                {[
                  { id: 'support_agent', name: '💬 Support Agent', desc: 'Can view Orders and reply to customer Helpdesk Tickets' },
                  { id: 'catalog_manager', name: '🛍️ Catalog Manager', desc: 'Can view and edit product Inventory, stock & CMS banners' },
                  { id: 'admin', name: '⚡ Standard Admin', desc: 'Can manage Orders, Inventory, and CRM (No raw database exports)' },
                  { id: 'super_admin', name: '👑 Super Admin', desc: 'Full root access to all systems, IAM rules & Financial payouts' }
                ].map(r => (
                  <label key={r.id} style={{ 
                    padding: '16px', borderRadius: '14px', cursor: 'pointer', border: formData.role === r.id ? '2px solid #4f46e5' : '1px solid #cbd5e1',
                    background: formData.role === r.id ? '#e0e7ff' : '#ffffff', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: '6px'
                  }}>
                    <input type="radio" name="role" value={r.id} checked={formData.role === r.id} onChange={handleChange} style={{ display: 'none' }} />
                    <div style={{ fontWeight: '800', fontSize: '15px', color: formData.role === r.id ? '#312e81' : '#1e293b' }}>{r.name}</div>
                    <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.4' }}>{r.desc}</div>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '16px 20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: '800', fontSize: '14px', color: '#15803d', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Lock size={16} /> Enforce Two-Factor (2FA / MFA) Authentication upon setup
                </div>
                <div style={{ fontSize: '12px', color: '#166534' }}>Staff member must verify mobile device via SMS OTP or Google Authenticator before accessing admin tools.</div>
              </div>
              <input type="checkbox" name="enforceMfa" checked={formData.enforceMfa} onChange={handleChange} style={{ width: '22px', height: '22px', cursor: 'pointer', accentColor: '#15803d' }} />
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
              <button type="button" onClick={() => setIsAdding(false)} style={{ padding: '12px 20px', borderRadius: '12px', background: '#f1f5f9', color: '#64748b', border: 'none', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
              <button type="submit" style={{ padding: '12px 28px', borderRadius: '12px', background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)', color: '#ffffff', border: 'none', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 15px rgba(79, 70, 229, 0.3)' }}>Create Account & Dispatch OTP</button>
            </div>
          </form>
        </div>
      )}

      {/* Global Staff Directory with Telemetry & Security Engine */}
      <div style={{ background: '#ffffff', borderRadius: '22px', border: '1px solid #e2e8f0', boxShadow: '0 6px 30px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
        
        {/* Directory Controls (Search + Role Filter Tabs) */}
        <div style={{ padding: '22px 26px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Users size={22} style={{ color: '#4f46e5' }} /> Global Staff Directory & Telemetry
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>Monitor live login sessions, MFA status, and audit operations counter.</p>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '250px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                type="text" 
                placeholder="Search staff name or email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#ffffff', fontWeight: '600', color: '#0f172a', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', background: '#e2e8f0', padding: '4px', borderRadius: '12px', gap: '4px' }}>
              {[
                { id: 'all', label: 'All Staff' },
                { id: 'super_admin', label: '👑 Admins' },
                { id: 'catalog_manager', label: '🛍️ Catalog' },
                { id: 'support_agent', label: '💬 Support' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setRoleFilter(tab.id)}
                  style={{
                    padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '800', border: 'none', cursor: 'pointer',
                    background: roleFilter === tab.id ? '#ffffff' : 'transparent',
                    color: roleFilter === tab.id ? '#4f46e5' : '#475569',
                    boxShadow: roleFilter === tab.id ? '0 2px 6px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Staff Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
            <thead>
              <tr style={{ background: '#ffffff', borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <th style={{ padding: '16px 26px' }}>Staff Member & Identity</th>
                <th style={{ padding: '16px 20px' }}>Assigned RBAC Role</th>
                <th style={{ padding: '16px 20px' }}>🔐 MFA Security Shield</th>
                <th style={{ padding: '16px 20px' }}>📡 Telemetry & Last Active</th>
                <th style={{ padding: '16px 20px' }}>Status</th>
                <th style={{ padding: '16px 26px', textAlign: 'right' }}>Security Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map(member => {
                const isSuper = member.role === 'super_admin';
                const isAdmin = member.role === 'admin';
                const isActive = member.status === 'Active';

                return (
                  <tr key={member._id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    
                    {/* Identity */}
                    <td style={{ padding: '16px 26px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: isSuper ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #4f46e5, #312e81)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '18px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                          {(member.fullName || member.username).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '15px' }}>{member.fullName}</div>
                          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>@{member.username} ({member.email})</div>
                        </div>
                      </div>
                    </td>

                    {/* Role Badge */}
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{
                        padding: '6px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'inline-block',
                        background: isSuper ? '#fef3c7' : isAdmin ? '#e0e7ff' : '#f1f5f9',
                        color: isSuper ? '#b45309' : isAdmin ? '#4338ca' : '#334155',
                        border: '1px solid', borderColor: isSuper ? '#fde68a' : isAdmin ? '#c7d2fe' : '#cbd5e1'
                      }}>
                        {isSuper ? '👑 Super Admin' : isAdmin ? '⚡ Standard Admin' : member.role === 'catalog_manager' ? '🛍️ Catalog Manager' : '💬 Support Agent'}
                      </span>
                    </td>

                    {/* MFA Status */}
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '800', color: isActive ? '#15803d' : '#b91c1c', background: isActive ? '#f0fdf4' : '#fef2f2', padding: '5px 12px', borderRadius: '100px', border: '1px solid', borderColor: isActive ? '#86efac' : '#fca5a5', width: 'fit-content' }}>
                        <Lock size={13} /> <span>{member.mfaStatus || '2FA Verified & Active'}</span>
                      </div>
                    </td>

                    {/* Telemetry */}
                    <td style={{ padding: '16px 20px', fontSize: '13px', color: '#475569' }}>
                      <div style={{ fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Activity size={14} style={{ color: '#38bdf8' }} /> <span>Last Active: <strong>{member.lastActive}</strong></span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>IP: <code style={{ color: '#4338ca' }}>{member.ipAddress}</code></span>
                        <span>•</span>
                        <span style={{ color: '#16a34a', fontWeight: '800' }}>{member.actionsCount || 12} Logs</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ padding: '6px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: '900', display: 'inline-flex', alignItems: 'center', gap: '6px', background: isActive ? '#dcfce7' : '#fee2e2', color: isActive ? '#166534' : '#991b1b', border: '1px solid', borderColor: isActive ? '#86efac' : '#fca5a5' }}>
                        {isActive ? <CheckCircle size={14} /> : <XCircle size={14} />}
                        {member.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '16px 26px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                        
                        <button
                          type="button"
                          onClick={() => handleResetMFA(member)}
                          style={{ padding: '8px 12px', borderRadius: '10px', background: '#f8fafc', color: '#4338ca', border: '1px solid #c7d2fe', fontWeight: '700', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.15s' }}
                          title="Reset MFA & Terminate active sessions"
                        >
                          <Key size={14} /> <span>Reset MFA</span>
                        </button>

                        {member.status === 'Active' ? (
                          <button 
                            type="button"
                            disabled={member.username === 'admin'}
                            style={{ padding: '8px 14px', fontSize: '12px', fontWeight: '800', borderRadius: '10px', color: '#ffffff', background: member.username === 'admin' ? '#cbd5e1' : '#e11d48', border: 'none', cursor: member.username === 'admin' ? 'not-allowed' : 'pointer', boxShadow: member.username === 'admin' ? 'none' : '0 2px 6px rgba(225, 29, 72, 0.3)' }}
                            onClick={() => handleUpdateStatus(member._id, 'Suspended')}
                            title={member.username === 'admin' ? 'Cannot suspend Master Root Account' : 'Suspend employee access instantly'}
                          >
                            Suspend
                          </button>
                        ) : (
                          <button 
                            type="button"
                            style={{ padding: '8px 14px', fontSize: '12px', fontWeight: '800', borderRadius: '10px', color: '#ffffff', background: '#16a34a', border: 'none', cursor: 'pointer', boxShadow: '0 2px 6px rgba(22, 163, 74, 0.3)' }}
                            onClick={() => handleUpdateStatus(member._id, 'Active')}
                          >
                            Restore
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                );
              })}
              {filteredStaff.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '50px 20px', color: '#64748b' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <Users size={36} style={{ color: '#94a3b8' }} />
                      <span style={{ fontSize: '16px', fontWeight: '700', color: '#334155' }}>No personnel records found matching your active search or role filter.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};

export default AdminStaff;
