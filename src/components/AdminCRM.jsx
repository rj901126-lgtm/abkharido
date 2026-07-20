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

  if (loading) return <div>Loading CRM Data...</div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
      
      {/* Abandoned Cart CRM */}
      <div className="admin-panel-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="admin-form-title"><ShoppingCart size={18} color="#d32f2f" /> Abandoned Cart Recovery</h3>
          <span style={{ fontSize: '12px', background: '#ffebee', color: '#c62828', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
            Potential Lost Revenue: ₹{abandonedCarts.reduce((acc, curr) => acc + curr.cartValue, 0).toLocaleString()}
          </span>
        </div>
        
        <p style={{ fontSize: '13px', color: '#666', marginTop: '-10px' }}>
          Users who added items to their cart but did not complete the checkout process. Send them a reminder!
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {abandonedCarts.map(cart => (
            <div key={cart._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid #e0e0e0', borderRadius: '8px', background: '#fafafa' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '14px', color: '#333' }}>{cart.email}</h4>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#666' }}>Cart Value: <strong style={{ color: '#d32f2f' }}>₹{cart.cartValue.toLocaleString()}</strong></p>
                <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#999' }}>Last Active: {new Date(cart.lastActive).toLocaleDateString()}</p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-outline" style={{ padding: '8px' }} onClick={() => sendRecoveryEmail(cart.email, cart.cartValue)} title="Send Email">
                  <Mail size={16} />
                </button>
                <button className="btn btn-outline" style={{ padding: '8px', color: '#2e7d32', borderColor: '#2e7d32' }} onClick={() => sendRecoverySMS(cart.phone)} title="Send SMS">
                  <MessageSquare size={16} />
                </button>
              </div>
            </div>
          ))}
          {abandonedCarts.length === 0 && <p style={{ textAlign: 'center', color: '#999' }}>No abandoned carts found.</p>}
        </div>
      </div>

      {/* Global Settings Manager */}
      <div className="admin-panel-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 className="admin-form-title"><Settings size={18} color="var(--primary-color)"/> Global Website Settings</h3>
        
        <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div>
            <label className="admin-input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Palette size={14} /> Brand Primary Theme Color
            </label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input 
                type="color" 
                value={settings.themeColor} 
                onChange={(e) => setSettings({...settings, themeColor: e.target.value})}
                style={{ width: '40px', height: '40px', padding: '0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              />
              <input 
                type="text" 
                className="admin-input" 
                value={settings.themeColor}
                onChange={(e) => setSettings({...settings, themeColor: e.target.value})}
                style={{ flex: 1 }}
              />
            </div>
            <span style={{ fontSize: '11px', color: '#888' }}>This changes the color of buttons, links, and banners across the entire AbKharido website instantly!</span>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '10px 0' }} />

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label className="admin-input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={14} /> Support Email
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
              <label className="admin-input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Phone size={14} /> Support Phone
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

          <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '10px 0' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input 
              type="checkbox" 
              id="maintenance" 
              checked={settings.maintenanceMode}
              onChange={(e) => setSettings({...settings, maintenanceMode: e.target.checked})}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <label htmlFor="maintenance" style={{ fontSize: '14px', fontWeight: 'bold', color: '#d32f2f', cursor: 'pointer' }}>
              Enable Maintenance Mode (Takes website offline for customers)
            </label>
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>Save Global Settings</button>
        </form>
      </div>

    </div>
  );
};

export default AdminCRM;
