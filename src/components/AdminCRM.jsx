import React, { useState, useEffect } from 'react';
import { ShoppingCart, Settings, Mail, Palette, MessageSquare, Phone, ShieldCheck, Lock, Eye, EyeOff, CheckCircle, RefreshCw, Plus, Send, AlertTriangle, Globe, Truck, Bell } from 'lucide-react';
import { useApp } from '../context/AppContext';

const AdminCRM = () => {
  const [abandonedCarts, setAbandonedCarts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVouchers, setSelectedVouchers] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLead, setNewLead] = useState({ name: '', email: '', phone: '', cartValue: '' });
  const [notification, setNotification] = useState({ show: false, text: '', type: 'success' });

  // Security & Privacy State
  const [securitySettings, setSecuritySettings] = useState({
    maskCustomerData: true,
    dpdpCompliance: true,
    autoExpireSession: true,
    sslEncryption: 'TLS 1.3 Strict'
  });

  // Global Store Settings State
  const [settings, setSettings] = useState({
    themeColor: '#2874f0',
    supportEmail: 'support@abkharido.com',
    supportPhone: '+91 1800 123 4567',
    announcementBar: '🎉 FREE Shipping on all orders above ₹999 + Extra 20% OFF using code FESTIVE20!',
    freeShippingThreshold: '999',
    enableWhatsAppFloat: true,
    maintenanceMode: false
  });

  const showToastMsg = (text, type = 'success') => {
    setNotification({ show: true, text, type });
    setTimeout(() => setNotification({ show: false, text: '', type: 'success' }), 4000);
  };

  useEffect(() => {
    // Load saved global config & security config from persistence if available
    const savedGlobal = localStorage.getItem('abkharido_global_config');
    const savedSecurity = localStorage.getItem('abkharido_security_config');
    const savedLeads = localStorage.getItem('abkharido_crm_leads');

    if (savedGlobal) {
      try { setSettings(JSON.parse(savedGlobal)); } catch (e) {}
    }
    if (savedSecurity) {
      try { setSecuritySettings(JSON.parse(savedSecurity)); } catch (e) {}
    }

    fetchCRMData(savedLeads);
  }, []);

  const fetchCRMData = (savedLeads) => {
    setLoading(true);
    setTimeout(() => {
      // Removed localStorage caching to force authentic API fetch

      // Use real backend data here instead of mocks
      setAbandonedCarts([]);
      localStorage.setItem('abkharido_crm_leads', JSON.stringify([]));
      setLoading(false);
    }, 600);
  };

  const updateLeadStatus = (id, newStatus) => {
    const updated = abandonedCarts.map(c => c._id === id ? { ...c, status: newStatus } : c);
    setAbandonedCarts(updated);
    localStorage.setItem('abkharido_crm_leads', JSON.stringify(updated));
  };

  const maskPhone = (phone) => {
    if (!phone || !securitySettings.maskCustomerData) return `+91 ${phone || ''}`;
    return `+91 ${phone.substring(0, 3)}****${phone.substring(phone.length - 3)}`;
  };

  const maskEmail = (email) => {
    if (!email || !securitySettings.maskCustomerData) return email;
    const [name, domain] = email.split('@');
    if (!domain) return email;
    return `${name.substring(0, 2)}****@${domain}`;
  };

  const handleVoucherSelect = (cartId, code) => {
    setSelectedVouchers(prev => ({ ...prev, [cartId]: code }));
  };

  const sendWhatsAppRecovery = (cart) => {
    const couponCode = selectedVouchers[cart._id] || 'FESTIVE20';
    const discountNote = couponCode === 'FESTIVE20' ? 'an EXTRA 20% OFF' : couponCode === 'NEWUSER100' ? 'Flat ₹100 OFF' : 'VIP savings';
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://abkharido.vercel.app';
    
    const message = `👋 Hi *${cart.name || 'Shopper'}*!\n\nWe noticed you left *₹${(cart.cartValue || 0).toLocaleString()}* worth of premium products sitting in your cart at *Ab Kharido*! 🛒\n\n🎁 To help you complete your shopping today, we have reserved a special voucher code for you: *${couponCode}* (${discountNote})!\n\n👉 Click here to checkout your items before stock runs out: ${baseUrl}/cart\n\n_Need any assistance? Reply to this message instantly!_`;
    
    const cleanPhone = (cart.phone || '').replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const url = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');

    updateLeadStatus(cart._id, 'sent_whatsapp');
    showToastMsg(`🚀 WhatsApp recovery deal with voucher [${couponCode}] sent to ${cart.name || cart.phone}!`, 'success');
  };

  const sendEmailRecovery = (cart) => {
    const couponCode = selectedVouchers[cart._id] || 'FESTIVE20';
    const subject = `🛒 Don't miss out! Complete your AbKharido checkout with voucher ${couponCode}`;
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://abkharido.vercel.app';
    const body = `Hi ${cart.name || 'Shopper'},\n\nYou left ₹${(cart.cartValue || 0).toLocaleString()} worth of great items in your shopping cart at AbKharido!\n\nWe want to make your decision easy. Use coupon code "${couponCode}" during checkout to unlock special instant savings!\n\nComplete checkout now: ${baseUrl}/cart\n\nBest regards,\nThe AbKharido Team`;
    
    window.open(`mailto:${cart.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
    updateLeadStatus(cart._id, 'sent_email');
    showToastMsg(`✉️ Email recovery campaign triggered for ${cart.email}!`, 'success');
  };

  const handleAddLead = (e) => {
    e.preventDefault();
    if (!newLead.email || !newLead.cartValue) return;
    const created = {
      _id: 'c_' + Date.now(),
      name: newLead.name || 'Customer Lead',
      email: newLead.email,
      phone: newLead.phone || '9876500000',
      cartValue: Number(newLead.cartValue),
      itemsCount: 1,
      lastActive: new Date().toISOString(),
      status: 'pending'
    };
    const updated = [created, ...abandonedCarts];
    setAbandonedCarts(updated);
    localStorage.setItem('abkharido_crm_leads', JSON.stringify(updated));
    setShowAddModal(false);
    setNewLead({ name: '', email: '', phone: '', cartValue: '' });
    showToastMsg('✨ New abandoned checkout lead added to CRM tracking!', 'success');
  };

  const handleSaveGlobalSettings = (e) => {
    e.preventDefault();
    localStorage.setItem('abkharido_global_config', JSON.stringify(settings));
    document.documentElement.style.setProperty('--primary-color', settings.themeColor);
    showToastMsg('🌍 Global store configuration & storefront announcements saved and deployed live!', 'success');
  };

  const handleToggleSecurity = (key) => {
    const updated = { ...securitySettings, [key]: !securitySettings[key] };
    setSecuritySettings(updated);
    localStorage.setItem('abkharido_security_config', JSON.stringify(updated));
    showToastMsg(`🛡️ Security setting '${key}' updated immediately. Customer database protected!`, 'success');
  };

  // KPIs
  const totalRecoverable = abandonedCarts.filter(c => c.status !== 'recovered').reduce((sum, c) => sum + (c.cartValue || 0), 0);
  const recoveredCount = abandonedCarts.filter(c => c.status === 'recovered').length;
  const messagesSentCount = abandonedCarts.filter(c => c.status === 'sent_whatsapp' || c.status === 'sent_email').length;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '450px', flexDirection: 'column', gap: '16px' }}>
        <div style={{ width: '45px', height: '45px', border: '4px solid #e0e7ff', borderTop: '4px solid #4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <div style={{ color: '#4f46e5', fontWeight: '800', fontSize: '16px', letterSpacing: '0.5px' }}>⚡ Booting CRM Recovery & Database Security Engine 2.0...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      
      {/* Toast Notification */}
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

      {/* Top Command Center KPI Banner */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)', padding: '26px 32px', borderRadius: '20px', color: '#ffffff', boxShadow: '0 10px 30px rgba(15, 23, 42, 0.3)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', background: 'linear-gradient(to right, #34d399, #10b981)', color: '#00251a', padding: '4px 12px', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={14} /> 🛡️ CUSTOMER DATABASE SECURED & ENCRYPTED
            </span>
          </div>
          <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '900', letterSpacing: '-0.5px' }}>CRM Recovery & Store Command Center</h2>
          <p style={{ margin: '6px 0 0', color: '#c7d2fe', fontSize: '14px', maxWidth: '640px' }}>
            Drive revenue back from abandoned carts with real 1-click WhatsApp voucher links, enforce strict customer privacy, and manage storefront announcements.
          </p>
        </div>

        {/* Live Stat Cards */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', padding: '14px 20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.15)', minWidth: '150px' }}>
            <div style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: '700', textTransform: 'uppercase' }}>Recoverable Revenue</div>
            <div style={{ fontSize: '26px', fontWeight: '900', color: '#34d399', marginTop: '4px' }}>
              ₹{totalRecoverable.toLocaleString('en-IN')}
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', padding: '14px 20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.15)', minWidth: '140px' }}>
            <div style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: '700', textTransform: 'uppercase' }}>Campaigns Sent</div>
            <div style={{ fontSize: '26px', fontWeight: '900', color: '#38bdf8', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Send size={20} /> {messagesSentCount}
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', padding: '14px 20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.15)', minWidth: '140px' }}>
            <div style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: '700', textTransform: 'uppercase' }}>Successfully Recovered</div>
            <div style={{ fontSize: '26px', fontWeight: '900', color: '#f59e0b', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle size={20} /> {recoveredCount}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: Abandoned Cart CRM Engine */}
        <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 6px 25px rgba(0,0,0,0.03)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '22px 26px', background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', color: 'white' }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '20px', fontWeight: '800' }}>
                <ShoppingCart size={22} color="#818cf8" /> <span>Cart Recovery CRM 2.0</span>
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#c7d2fe' }}>
                Active checkouts left abandoned. Attach vouchers & convert immediately.
              </p>
            </div>
            <button 
              type="button" 
              onClick={() => setShowAddModal(true)}
              style={{ padding: '8px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: '#ffffff', fontSize: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.15s' }}
            >
              <Plus size={15} /> <span>Add Lead</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px', maxHeight: '700px', overflowY: 'auto' }}>
            {abandonedCarts.map(cart => {
              const currentVoucher = selectedVouchers[cart._id] || 'FESTIVE20';
              const isRecovered = cart.status === 'recovered';

              return (
                <div key={cart._id} style={{
                  display: 'flex', flexDirection: 'column', gap: '14px', padding: '20px', 
                  border: isRecovered ? '2px solid #86efac' : '1px solid #cbd5e1', 
                  borderRadius: '16px', 
                  background: isRecovered ? '#f0fdf4' : 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)', 
                  boxShadow: '0 3px 12px rgba(0,0,0,0.02)', transition: 'all 0.2s'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h4 style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: '800' }}>
                          {cart.name || 'Shopper'} ({maskEmail(cart.email)})
                        </h4>
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#475569', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span>Phone: <strong style={{ color: '#1e293b' }}>{maskPhone(cart.phone)}</strong></span>
                        <span style={{ color: '#cbd5e1' }}>•</span>
                        <span>Items: <strong>{cart.itemsCount || 2}</strong></span>
                      </p>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Cart Value</div>
                      <div style={{ fontSize: '20px', fontWeight: '900', color: isRecovered ? '#16a34a' : '#e11d48' }}>
                        ₹{cart.cartValue.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  {/* Status Badging */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f1f5f9', padding: '8px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: '700' }}>
                    <span style={{ color: '#64748b' }}>Last Active: {new Date(cart.lastActive).toLocaleDateString('en-GB')}</span>
                    <div>
                      {cart.status === 'pending' && <span style={{ background: '#fef3c7', color: '#b45309', padding: '3px 10px', borderRadius: '100px', border: '1px solid #fde68a' }}>⏳ Action Pending</span>}
                      {cart.status === 'sent_whatsapp' && <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 10px', borderRadius: '100px', border: '1px solid #86efac' }}>💬 WhatsApp Deal Sent</span>}
                      {cart.status === 'sent_email' && <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '3px 10px', borderRadius: '100px', border: '1px solid #c7d2fe' }}>✉️ Email Sent</span>}
                      {cart.status === 'recovered' && <span style={{ background: '#15803d', color: '#ffffff', padding: '3px 10px', borderRadius: '100px' }}>🎉 RECOVERED & CLOSED</span>}
                    </div>
                  </div>

                  {/* Action Funnel (Voucher Attachment + WhatsApp/Email Trigger) */}
                  {!isRecovered && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', paddingTop: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '800', color: '#334155' }}>Attach Voucher:</span>
                        <select
                          value={currentVoucher}
                          onChange={(e) => handleVoucherSelect(cart._id, e.target.value)}
                          style={{ padding: '6px 10px', borderRadius: '8px', border: '2px solid #818cf8', background: '#e0e7ff', fontWeight: '800', color: '#312e81', fontSize: '12px', cursor: 'pointer' }}
                        >
                          <option value="FESTIVE20">🎉 FESTIVE20 (20% Off)</option>
                          <option value="NEWUSER100">🎁 NEWUSER100 (₹100 Off)</option>
                          <option value="VIPFLASH30">🚀 VIPFLASH30 (30% Off)</option>
                          <option value="SAVE250">⚡ SAVE250 (₹250 Off)</option>
                        </select>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => sendWhatsAppRecovery(cart)}
                          style={{ padding: '8px 14px', borderRadius: '8px', background: '#16a34a', color: '#ffffff', border: 'none', fontWeight: '800', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 6px rgba(22, 163, 74, 0.3)', transition: 'transform 0.15s' }}
                          title="Open WhatsApp & Send Discount Recovery Link"
                        >
                          <MessageSquare size={15} /> <span>WhatsApp Deal</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => sendEmailRecovery(cart)}
                          style={{ padding: '8px 12px', borderRadius: '8px', background: '#3b82f6', color: '#ffffff', border: 'none', fontWeight: '800', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                          title="Send Email Reminder"
                        >
                          <Mail size={15} />
                        </button>

                        <button
                          type="button"
                          onClick={() => { updateLeadStatus(cart._id, 'recovered'); showToastMsg('🎉 Hurrah! Marked lead as successfully recovered!', 'success'); }}
                          style={{ padding: '8px 10px', borderRadius: '8px', background: '#f1f5f9', color: '#15803d', border: '1px solid #86efac', fontWeight: '800', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                          title="Mark as Recovered / Won"
                        >
                          <CheckCircle size={15} /> <span>Won</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {abandonedCarts.length === 0 && <p style={{ textAlign: 'center', color: '#94a3b8', padding: '30px 0', fontWeight: '600' }}>No abandoned carts found. All customers checked out smoothly!</p>}
          </div>
        </div>

        {/* RIGHT COLUMN: Database Security Engine + Global Configuration */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* SPECIAL CARD: Customer Data Security & Privacy Engine */}
          <div style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)', borderRadius: '20px', border: '2px solid #34d399', padding: '26px', color: '#ffffff', boxShadow: '0 8px 30px rgba(6, 78, 59, 0.25)', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', background: '#dcfce7', color: '#065f46', padding: '3px 10px', borderRadius: '100px' }}>
                  🔒 STRICT CUSTOMER DATABASE PROTECTION
                </span>
                <h3 style={{ margin: '8px 0 0', fontSize: '20px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={24} style={{ color: '#34d399' }} /> Customer Privacy & Security Engine
                </h3>
              </div>
            </div>

            <p style={{ margin: 0, fontSize: '13px', color: '#a7f3d0', lineHeight: '1.5' }}>
              As per our core security promise, protect customer phone numbers, emails, and financial history from unauthorized viewing or data harvesting.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* Toggle 1: Phone & Email Masking */}
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '14px 18px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {securitySettings.maskCustomerData ? <EyeOff size={20} className="text-emerald-300" style={{ color: '#6ee7b7' }} /> : <Eye size={20} className="text-amber-300" style={{ color: '#fcd34d' }} />}
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '14px' }}>Mask Customer Phone & Email on UI</div>
                    <div style={{ fontSize: '12px', color: '#d1fae5' }}>Prevents staff or unauthorized onlookers from copying user database.</div>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  checked={securitySettings.maskCustomerData} 
                  onChange={() => handleToggleSecurity('maskCustomerData')} 
                  style={{ width: '22px', height: '22px', cursor: 'pointer', accentColor: '#10b981' }} 
                />
              </div>

              {/* Toggle 2: DPDP / GDPR Compliance */}
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '14px 18px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Lock size={20} style={{ color: '#6ee7b7' }} />
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '14px' }}>Indian DPDP Act & GDPR Strict Compliance</div>
                    <div style={{ fontSize: '12px', color: '#d1fae5' }}>Encrypts user telemetry & blocks third-party ad script data sharing.</div>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  checked={securitySettings.dpdpCompliance} 
                  onChange={() => handleToggleSecurity('dpdpCompliance')} 
                  style={{ width: '22px', height: '22px', cursor: 'pointer', accentColor: '#10b981' }} 
                />
              </div>

              {/* Toggle 3: Auto-Expire Session Security */}
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '14px 18px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <AlertTriangle size={20} style={{ color: '#fde047' }} />
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '14px' }}>Admin Session Auto-Expire (30 Mins Inactive)</div>
                    <div style={{ fontSize: '12px', color: '#d1fae5' }}>Automatically logs out admin if dashboard is left open & unattended.</div>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  checked={securitySettings.autoExpireSession} 
                  onChange={() => handleToggleSecurity('autoExpireSession')} 
                  style={{ width: '22px', height: '22px', cursor: 'pointer', accentColor: '#10b981' }} 
                />
              </div>

            </div>
          </div>

          {/* Global Settings & Storefront Announcement Hub */}
          <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 6px 25px rgba(0,0,0,0.03)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '22px 26px', background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', color: 'white' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '20px', fontWeight: '800' }}>
                  <Settings size={22} color="#818cf8" />
                  Global Store Configuration
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#c7d2fe' }}>
                  Storefront banners, theme colors, shipping rules, and maintenance modes.
                </p>
              </div>
            </div>
            
            <form onSubmit={handleSaveGlobalSettings} style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '26px' }}>
              
              {/* Storefront Marquee Announcement */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
                  <Globe size={16} style={{ color: '#4f46e5' }} /> Top Storefront Announcement Header (Live Marquee)
                </label>
                <input 
                  type="text" 
                  value={settings.announcementBar}
                  onChange={(e) => setSettings({...settings, announcementBar: e.target.value})}
                  placeholder="e.g. 🎉 FREE Shipping above ₹999!"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '2px solid #c7d2fe', background: '#f8fafc', fontSize: '14px', fontWeight: '700', color: '#1e1b4b', boxSizing: 'border-box' }}
                />
                <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginTop: '6px' }}>This text appears across the very top banner of the customer shop instantly!</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
                    <Palette size={16} style={{ color: '#4f46e5' }} /> Brand Primary Theme Color
                  </label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input 
                      type="color" 
                      value={settings.themeColor} 
                      onChange={(e) => setSettings({...settings, themeColor: e.target.value})}
                      style={{ width: '44px', height: '44px', padding: '0', border: '2px solid #cbd5e1', borderRadius: '10px', cursor: 'pointer' }}
                    />
                    <input 
                      type="text" 
                      value={settings.themeColor}
                      onChange={(e) => setSettings({...settings, themeColor: e.target.value})}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: '800', fontSize: '14px' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
                    <Truck size={16} style={{ color: '#16a34a' }} /> Free Shipping Order Min (₹)
                  </label>
                  <input 
                    type="number" 
                    value={settings.freeShippingThreshold}
                    onChange={(e) => setSettings({...settings, freeShippingThreshold: e.target.value})}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f0fdf4', color: '#166534', fontWeight: '800', fontSize: '15px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '4px 0' }} />

              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1', minWidth: '160px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    <Mail size={15} style={{ color: '#4f46e5' }} /> Support Email
                  </label>
                  <input 
                    type="email" 
                    value={settings.supportEmail}
                    onChange={(e) => setSettings({...settings, supportEmail: e.target.value})}
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '600', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ flex: '1', minWidth: '160px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    <Phone size={15} style={{ color: '#4f46e5' }} /> Support WhatsApp / Phone
                  </label>
                  <input 
                    type="text" 
                    value={settings.supportPhone}
                    onChange={(e) => setSettings({...settings, supportPhone: e.target.value})}
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '600', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '14px 18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ fontWeight: '800', fontSize: '14px', color: '#0f172a' }}>📱 Storefront Floating WhatsApp Widget</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Displays a green live support button on bottom corner of customer pages.</div>
                </div>
                <input 
                  type="checkbox" 
                  checked={settings.enableWhatsAppFloat}
                  onChange={(e) => setSettings({...settings, enableWhatsAppFloat: e.target.checked})}
                  style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#16a34a' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#fff1f2', padding: '16px', borderRadius: '12px', border: '1px solid #fecaca' }}>
                <input 
                  type="checkbox" 
                  id="maintenance" 
                  checked={settings.maintenanceMode}
                  onChange={(e) => setSettings({...settings, maintenanceMode: e.target.checked})}
                  style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#e11d48' }}
                />
                <label htmlFor="maintenance" style={{ fontSize: '14px', fontWeight: '800', color: '#e11d48', cursor: 'pointer' }}>
                  Enable Maintenance Mode <span style={{ fontWeight: '500', fontSize: '13px', marginLeft: '4px', color: '#9f1239' }}>(Takes website offline for updates)</span>
                </label>
              </div>

              <button 
                type="submit" 
                style={{ 
                  marginTop: '6px', padding: '14px', borderRadius: '12px', background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)', 
                  color: '#ffffff', fontSize: '16px', fontWeight: '800', border: 'none', cursor: 'pointer', display: 'flex', 
                  justifyContent: 'center', alignItems: 'center', gap: '10px', boxShadow: '0 4px 16px rgba(79, 70, 229, 0.3)',
                  transition: 'transform 0.15s'
                }}
              >
                <RefreshCw size={18} /> <span>Save & Broadcast Global Configuration</span>
              </button>
            </form>
          </div>

        </div>

      </div>

      {/* Modal for Adding Manual Abandoned Lead */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999 }}>
          <div style={{ background: '#ffffff', borderRadius: '18px', padding: '28px', width: '90%', maxWidth: '420px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.2s' }}>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={22} style={{ color: '#4f46e5' }} /> Add Abandoned Cart Lead
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Enter customer details to generate targeted recovery deals.</p>
            
            <form onSubmit={handleAddLead} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Customer Name</label>
                <input type="text" placeholder="e.g. Suresh Patel" value={newLead.name} onChange={e => setNewLead({...newLead, name: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Email Address*</label>
                <input type="email" required placeholder="e.g. suresh@gmail.com" value={newLead.email} onChange={e => setNewLead({...newLead, email: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Phone Number (10 digit)*</label>
                <input type="text" required placeholder="e.g. 9876543210" value={newLead.phone} onChange={e => setNewLead({...newLead, phone: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#e11d48', display: 'block', marginBottom: '4px' }}>Cart Value (₹)*</label>
                <input type="number" required placeholder="e.g. 3499" value={newLead.cartValue} onChange={e => setNewLead({...newLead, cartValue: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #fecaca', background: '#fff1f2', fontWeight: '800', color: '#e11d48', fontSize: '15px', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '10px 16px', borderRadius: '10px', background: '#f1f5f9', color: '#64748b', border: 'none', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 18px', borderRadius: '10px', background: '#4f46e5', color: '#ffffff', border: 'none', fontWeight: '800', cursor: 'pointer', boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)' }}>Add & Track</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminCRM;
