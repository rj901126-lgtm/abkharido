import React, { useState, useEffect } from 'react';
import { ShoppingCart, Settings, Mail, Palette, MessageSquare, Phone } from 'lucide-react';
import { useApp } from '../context/AppContext';

const AdminCRM = () => {
  const [abandonedCarts, setAbandonedCarts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useApp();

  // Settings State
  const [settings, setSettings] = useState({
    themeColor: '#2874f0',
    supportEmail: 'support@abkharido.com',
    supportPhone: '+91 1800 123 4567',
    maintenanceMode: false
  });

  useEffect(() => {
    fetchCRMData();
  }, []);

  const fetchCRMData = async () => {
    try {
      // In a real app, we fetch users where cart.length > 0 and no recent order
      // We simulate the data for now since we don't have the specific mongoose aggregation route written yet
      setTimeout(() => {
        setAbandonedCarts([
          { _id: 'u1', email: 'rahul@example.com', phone: '9876543210', cartValue: 2499, lastActive: new Date(Date.now() - 86400000).toISOString() },
          { _id: 'u2', email: 'priya.s@gmail.com', phone: '9123456789', cartValue: 12500, lastActive: new Date(Date.now() - 172800000).toISOString() },
          { _id: 'u3', email: 'amit_kumar@yahoo.com', phone: '9988776655', cartValue: 450, lastActive: new Date(Date.now() - 43200000).toISOString() }
        ]);
        setLoading(false);
      }, 800);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const sendRecoveryEmail = (email, value) => {
    // Simulated Email Sending
    showToast(`Sending 10% discount recovery email to ${email} for their ₹${value} cart...`, 'success');
  };

  const sendRecoverySMS = (phone) => {
    showToast(`Sending recovery SMS to +91 ${phone}...`, 'success');
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    // Here we would typically save to a GlobalSettings mongoose model
    // For now, we update CSS variables on the document root to simulate dynamic theming!
    document.documentElement.style.setProperty('--primary-color', settings.themeColor);
    showToast('Global settings updated! Site theme color changed.', 'success');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', flexDirection: 'column', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #e0e7ff', borderTop: '4px solid #4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <div style={{ color: '#64748b', fontWeight: '500' }}>Loading CRM Data...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
      
      {/* Abandoned Cart CRM */}
      {/* Abandoned Cart CRM */}
      <div className="admin-panel-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', color: 'white' }}>
          <div>
            <h3 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '22px', fontWeight: '800' }}>
              <ShoppingCart size={24} color="#818cf8" />
              Cart Recovery CRM
            </h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8' }}>
              Recover lost revenue from abandoned checkouts.
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#818cf8', fontWeight: '700', letterSpacing: '1px' }}>Recoverable Revenue</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#34d399' }}>
              ₹{abandonedCarts.reduce((acc, curr) => acc + curr.cartValue, 0).toLocaleString()}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '24px' }}>
          {abandonedCarts.map(cart => (
            <div key={cart._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', border: '1px solid #e2e8f0', borderRadius: '12px', background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', transition: 'all 0.2s' }} onMouseEnter={e => {e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.05)'}} onMouseLeave={e => {e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,0.02)'}}>
              <div>
                <h4 style={{ margin: 0, fontSize: '15px', color: '#0f172a', fontWeight: '700' }}>{cart.email}</h4>
                <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#475569', fontWeight: '500' }}>Cart Value: <strong style={{ color: '#ef4444' }}>₹{cart.cartValue.toLocaleString()}</strong></p>
                <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>Last Active: {new Date(cart.lastActive).toLocaleDateString()}</p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-outline" style={{ padding: '10px', borderRadius: '50%', background: '#fff', color: '#3b82f6', borderColor: '#bfdbfe' }} onClick={() => sendRecoveryEmail(cart.email, cart.cartValue)} title="Send Email Reminder">
                  <Mail size={18} />
                </button>
                <button className="btn btn-outline" style={{ padding: '10px', borderRadius: '50%', background: '#fff', color: '#10b981', borderColor: '#a7f3d0' }} onClick={() => sendRecoverySMS(cart.phone)} title="Send SMS Reminder">
                  <MessageSquare size={18} />
                </button>
              </div>
            </div>
          ))}
          {abandonedCarts.length === 0 && <p style={{ textAlign: 'center', color: '#999' }}>No abandoned carts found.</p>}
        </div>
      </div>

      {/* Global Settings Manager */}
      <div className="admin-panel-card" style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', color: 'white' }}>
          <div>
            <h3 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '22px', fontWeight: '800' }}>
              <Settings size={24} color="#818cf8" />
              Global Configuration
            </h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8' }}>
              Storefront theming and core platform variables.
            </p>
          </div>
        </div>
        
        <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px' }}>
          
          <div>
            <label className="admin-input-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#1e293b' }}>
              <Palette size={16} color="#6366f1" /> Brand Primary Theme Color
            </label>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '8px' }}>
              <input 
                type="color" 
                value={settings.themeColor} 
                onChange={(e) => setSettings({...settings, themeColor: e.target.value})}
                style={{ width: '50px', height: '50px', padding: '0', border: '3px solid #fff', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
              />
              <input 
                type="text" 
                className="admin-input" 
                value={settings.themeColor}
                onChange={(e) => setSettings({...settings, themeColor: e.target.value})}
                style={{ flex: 1, textTransform: 'uppercase', fontFamily: 'monospace', letterSpacing: '1px' }}
              />
            </div>
            <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginTop: '8px' }}>This changes the color of buttons, links, and banners across the entire AbKharido website instantly!</span>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '10px 0' }} />

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label className="admin-input-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                <Mail size={16} color="#6366f1" /> Support Email
              </label>
              <input 
                type="email" 
                className="admin-input" 
                value={settings.supportEmail}
                onChange={(e) => setSettings({...settings, supportEmail: e.target.value})}
                required
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="admin-input-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                <Phone size={16} color="#6366f1" /> Support Phone
              </label>
              <input 
                type="text" 
                className="admin-input" 
                value={settings.supportPhone}
                onChange={(e) => setSettings({...settings, supportPhone: e.target.value})}
                required
              />
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '8px 0' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#fff1f2', padding: '16px', borderRadius: '12px', border: '1px solid #fecaca' }}>
            <input 
              type="checkbox" 
              id="maintenance" 
              checked={settings.maintenanceMode}
              onChange={(e) => setSettings({...settings, maintenanceMode: e.target.checked})}
              style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#e11d48' }}
            />
            <label htmlFor="maintenance" style={{ fontSize: '14px', fontWeight: '700', color: '#e11d48', cursor: 'pointer' }}>
              Enable Maintenance Mode <span style={{ fontWeight: '400', fontSize: '13px', marginLeft: '4px' }}>(Takes website offline for customers)</span>
            </label>
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: '16px', padding: '14px', fontSize: '15px', fontWeight: 'bold' }}>Save Global Settings</button>
        </form>
      </div>

    </div>
  );
};

export default AdminCRM;
