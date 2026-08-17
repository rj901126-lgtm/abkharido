import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Store, 
  Truck, 
  CreditCard, 
  ShieldCheck, 
  Users, 
  KeyRound, 
  Save, 
  RefreshCw, 
  CheckCircle2, 
  Building2, 
  Phone, 
  Mail, 
  FileText,
  BadgePercent,
  Lock,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import AdminStaff from './AdminStaff';

const AdminSettings = () => {
  const { showToast } = useApp();
  const [activeSubTab, setActiveSubTab] = useState('store'); // 'store' | 'shipping' | 'payments' | 'security' | 'staff'
  const [isSaving, setIsSaving] = useState(false);

  // 1. Store Identity State
  const [storeInfo, setStoreInfo] = useState({
    storeName: 'AbKharido.com',
    tagline: 'Direct Buy & Earn Destination',
    supportPhone: '1800-888-9999',
    supportEmail: 'support@abkharido.com',
    whatsappSupport: '+919172600587',
    registeredCIN: 'U52100DL2024PTC394821',
    gstin: '07AAACA1234A1Z5',
    registeredAddress: 'Connaught Place, Central Delhi, New Delhi - 110001, India',
    brandColor: '#4f46e5'
  });

  // 2. Shipping & Fulfillment State
  const [shippingRules, setShippingRules] = useState({
    freeShippingMin: 999,
    standardShippingFee: 49,
    expressShippingFee: 99,
    codHandlingFee: 0,
    estimatedDeliveryDays: '2-4 Business Days',
    autoAssignCourier: true,
    preferredCourier: 'Delhivery Express',
    enablePincodeServiceabilityCheck: true
  });

  // 3. Payment Gateway Config
  const [paymentConfig, setPaymentConfig] = useState({
    enableCashfree: true,
    enableUpi: true,
    enableCards: true,
    enableNetBanking: true,
    enableCod: true,
    enableCoinsRedemption: true,
    maxCoinsDiscountPercent: 20, // Max 20% order discount via coins
    codMaxOrderLimit: 25000 // COD allowed up to ₹25,000
  });

  // 4. Security & Access PIN
  const [securityConfig, setSecurityConfig] = useState({
    masterPin: '2026',
    newPin: '',
    confirmNewPin: '',
    sessionTimeoutMinutes: 60,
    enforceDualStepOtp: true,
    restrictAdminIpRange: false
  });

  useEffect(() => {
    // Load persisted settings
    const savedStore = localStorage.getItem('abkharido_store_settings');
    if (savedStore) {
      try { setStoreInfo(JSON.parse(savedStore)); } catch (e) {}
    }
    const savedShipping = localStorage.getItem('abkharido_shipping_settings');
    if (savedShipping) {
      try { setShippingRules(JSON.parse(savedShipping)); } catch (e) {}
    }
    const savedPayments = localStorage.getItem('abkharido_payment_settings');
    if (savedPayments) {
      try { setPaymentConfig(JSON.parse(savedPayments)); } catch (e) {}
    }
  }, []);

  const handleSaveStore = (e) => {
    e.preventDefault();
    setIsSaving(true);
    localStorage.setItem('abkharido_store_settings', JSON.stringify(storeInfo));
    setTimeout(() => {
      setIsSaving(false);
      showToast('Store identity and legal information updated successfully!', 'success');
    }, 600);
  };

  const handleSaveShipping = (e) => {
    e.preventDefault();
    setIsSaving(true);
    localStorage.setItem('abkharido_shipping_settings', JSON.stringify(shippingRules));
    setTimeout(() => {
      setIsSaving(false);
      showToast('Shipping thresholds and SLA rules updated successfully!', 'success');
    }, 600);
  };

  const handleSavePayments = (e) => {
    e.preventDefault();
    setIsSaving(true);
    localStorage.setItem('abkharido_payment_settings', JSON.stringify(paymentConfig));
    setTimeout(() => {
      setIsSaving(false);
      showToast('Payment gateways and checkout rules updated successfully!', 'success');
    }, 600);
  };

  const handleUpdatePin = (e) => {
    e.preventDefault();
    if (!securityConfig.newPin || securityConfig.newPin.length < 4) {
      showToast('Master PIN must be at least 4 digits.', 'error');
      return;
    }
    if (securityConfig.newPin !== securityConfig.confirmNewPin) {
      showToast('New PIN and Confirm PIN do not match.', 'error');
      return;
    }
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSecurityConfig({ ...securityConfig, masterPin: securityConfig.newPin, newPin: '', confirmNewPin: '' });
      showToast(`Master Admin PIN updated to '${securityConfig.newPin}' successfully!`, 'success');
    }, 600);
  };

  return (
    <div className="admin-settings-container animate-fade-in" style={{ padding: '24px', maxWidth: '1280px', margin: '0 auto' }}>
      
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%)',
        borderRadius: '24px',
        padding: '32px',
        color: '#ffffff',
        marginBottom: '24px',
        boxShadow: '0 12px 32px -8px rgba(30, 27, 75, 0.25)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.15)', padding: '6px 14px', borderRadius: '100px', fontSize: '12px', fontWeight: '800', marginBottom: '12px', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
            <Settings size={14} /> SYSTEM PREFERENCES
          </div>
          <h1 style={{ margin: '0 0 6px 0', fontSize: '28px', fontWeight: '900', fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.5px' }}>
            Store Configuration &amp; Governance
          </h1>
          <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', maxWidth: '600px' }}>
            Manage legal store identity, delivery SLAs, payment gateways, RBAC staff members, and master security credentials.
          </p>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
        {[
          { id: 'store', label: 'Store Identity & Legal', icon: Store },
          { id: 'shipping', label: 'Shipping & Delivery Rules', icon: Truck },
          { id: 'payments', label: 'Payment Gateways & COD', icon: CreditCard },
          { id: 'security', label: 'Master Security PIN', icon: KeyRound },
          { id: 'staff', label: 'Staff & RBAC Team', icon: Users }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '12px',
                border: '1px solid',
                borderColor: isActive ? '#4f46e5' : '#e2e8f0',
                background: isActive ? '#4f46e5' : '#ffffff',
                color: isActive ? '#ffffff' : '#475569',
                fontSize: '13.5px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isActive ? '0 4px 12px rgba(79, 70, 229, 0.2)' : 'none'
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Store Identity & Legal */}
      {activeSubTab === 'store' && (
        <form onSubmit={handleSaveStore} className="admin-panel-card" style={{ background: '#ffffff', borderRadius: '20px', padding: '28px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building2 size={20} color="#4f46e5" /> Corporate Legal Profile &amp; Branding
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Store Name</label>
              <input 
                type="text" 
                value={storeInfo.storeName} 
                onChange={(e) => setStoreInfo({ ...storeInfo, storeName: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                required 
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Tagline / Subtitle</label>
              <input 
                type="text" 
                value={storeInfo.tagline} 
                onChange={(e) => setStoreInfo({ ...storeInfo, tagline: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Support Toll-Free Phone</label>
              <input 
                type="text" 
                value={storeInfo.supportPhone} 
                onChange={(e) => setStoreInfo({ ...storeInfo, supportPhone: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Official Support Email</label>
              <input 
                type="email" 
                value={storeInfo.supportEmail} 
                onChange={(e) => setStoreInfo({ ...storeInfo, supportEmail: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Corporate CIN (Ministry of Corporate Affairs)</label>
              <input 
                type="text" 
                value={storeInfo.registeredCIN} 
                onChange={(e) => setStoreInfo({ ...storeInfo, registeredCIN: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box', fontFamily: 'monospace' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>GSTIN Number</label>
              <input 
                type="text" 
                value={storeInfo.gstin} 
                onChange={(e) => setStoreInfo({ ...storeInfo, gstin: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box', fontFamily: 'monospace' }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Registered Office Address</label>
              <input 
                type="text" 
                value={storeInfo.registeredAddress} 
                onChange={(e) => setStoreInfo({ ...storeInfo, registeredAddress: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSaving}
            style={{
              padding: '12px 24px',
              background: '#4f46e5',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              fontWeight: '800',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)'
            }}
          >
            <Save size={16} />
            <span>{isSaving ? 'Saving Changes...' : 'Save Store Details'}</span>
          </button>
        </form>
      )}

      {/* Tab 2: Shipping & Delivery Rules */}
      {activeSubTab === 'shipping' && (
        <form onSubmit={handleSaveShipping} className="admin-panel-card" style={{ background: '#ffffff', borderRadius: '20px', padding: '28px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Truck size={20} color="#4f46e5" /> Logistics, SLAs &amp; Thresholds
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Free Shipping Threshold (₹ Minimum Order)</label>
              <input 
                type="number" 
                value={shippingRules.freeShippingMin} 
                onChange={(e) => setShippingRules({ ...shippingRules, freeShippingMin: Number(e.target.value) })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                required 
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Standard Delivery Fee (for orders below threshold)</label>
              <input 
                type="number" 
                value={shippingRules.standardShippingFee} 
                onChange={(e) => setShippingRules({ ...shippingRules, standardShippingFee: Number(e.target.value) })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Default Courier Partner</label>
              <select 
                value={shippingRules.preferredCourier} 
                onChange={(e) => setShippingRules({ ...shippingRules, preferredCourier: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box', background: '#fff' }}
              >
                <option value="Delhivery Express">Delhivery Express</option>
                <option value="BlueDart Air">BlueDart Air</option>
                <option value="Shadowfax Hyperlocal">Shadowfax Hyperlocal</option>
                <option value="XpressBees Priority">XpressBees Priority</option>
                <option value="Ecom Express">Ecom Express</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Estimated Delivery SLA Display</label>
              <input 
                type="text" 
                value={shippingRules.estimatedDeliveryDays} 
                onChange={(e) => setShippingRules({ ...shippingRules, estimatedDeliveryDays: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px', background: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
              <input 
                type="checkbox" 
                checked={shippingRules.autoAssignCourier} 
                onChange={(e) => setShippingRules({ ...shippingRules, autoAssignCourier: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: '#4f46e5' }}
              />
              <span>Auto-generate AWB tracking code on order confirmation</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
              <input 
                type="checkbox" 
                checked={shippingRules.enablePincodeServiceabilityCheck} 
                onChange={(e) => setShippingRules({ ...shippingRules, enablePincodeServiceabilityCheck: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: '#4f46e5' }}
              />
              <span>Strict 27,000+ Indian Pincode database verification on checkout</span>
            </label>
          </div>

          <button 
            type="submit" 
            disabled={isSaving}
            style={{
              padding: '12px 24px',
              background: '#4f46e5',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              fontWeight: '800',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)'
            }}
          >
            <Save size={16} />
            <span>{isSaving ? 'Saving Changes...' : 'Save Shipping Rules'}</span>
          </button>
        </form>
      )}

      {/* Tab 3: Payment Gateways & COD */}
      {activeSubTab === 'payments' && (
        <form onSubmit={handleSavePayments} className="admin-panel-card" style={{ background: '#ffffff', borderRadius: '20px', padding: '28px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CreditCard size={20} color="#4f46e5" /> Checkout Methods &amp; Wallet Coin Controls
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            {[
              { key: 'enableCashfree', title: 'Cashfree Escrow Gateway', desc: 'Auto escrow refund protection & instant settlements' },
              { key: 'enableUpi', title: 'UPI Quick Pay', desc: 'Google Pay, PhonePe, Paytm, and BHIM QR' },
              { key: 'enableCards', title: 'Credit & Debit Cards', desc: 'Visa, MasterCard, RuPay with 3D Secure OTP' },
              { key: 'enableNetBanking', title: 'NetBanking Portal', desc: 'Direct bank debit across 50+ Indian banks' },
              { key: 'enableCod', title: 'Cash on Delivery (COD)', desc: 'Pay cash or dynamic QR at doorstep' },
              { key: 'enableCoinsRedemption', title: 'AB Coins Rewards Engine', desc: '10 Coins = ₹10 direct checkout discount' }
            ].map((method) => (
              <div 
                key={method.key}
                onClick={() => setPaymentConfig({ ...paymentConfig, [method.key]: !paymentConfig[method.key] })}
                style={{
                  padding: '16px',
                  borderRadius: '14px',
                  border: '1.5px solid',
                  borderColor: paymentConfig[method.key] ? '#818cf8' : '#e2e8f0',
                  background: paymentConfig[method.key] ? '#f5f3ff' : '#f8fafc',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px'
                }}
              >
                <input 
                  type="checkbox" 
                  checked={paymentConfig[method.key]} 
                  onChange={() => {}} // Handled by container
                  style={{ width: '18px', height: '18px', accentColor: '#4f46e5', marginTop: '2px' }}
                />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>{method.title}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{method.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Max Order Limit for COD (₹)</label>
              <input 
                type="number" 
                value={paymentConfig.codMaxOrderLimit} 
                onChange={(e) => setPaymentConfig({ ...paymentConfig, codMaxOrderLimit: Number(e.target.value) })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Max AB Coins Discount (% of Cart Total)</label>
              <input 
                type="number" 
                value={paymentConfig.maxCoinsDiscountPercent} 
                onChange={(e) => setPaymentConfig({ ...paymentConfig, maxCoinsDiscountPercent: Number(e.target.value) })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSaving}
            style={{
              padding: '12px 24px',
              background: '#4f46e5',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              fontWeight: '800',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)'
            }}
          >
            <Save size={16} />
            <span>{isSaving ? 'Saving Changes...' : 'Save Payment Config'}</span>
          </button>
        </form>
      )}

      {/* Tab 4: Master Security PIN */}
      {activeSubTab === 'security' && (
        <form onSubmit={handleUpdatePin} className="admin-panel-card" style={{ background: '#ffffff', borderRadius: '20px', padding: '28px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.03)', maxWidth: '600px' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <KeyRound size={20} color="#4f46e5" /> Master Admin Security PIN
          </h3>
          <p style={{ margin: '0 0 20px 0', color: '#64748b', fontSize: '13px' }}>
            Current Master PIN is active for Super Admin authorization across all management modules.
          </p>

          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Active System PIN:</span>
            <span style={{ fontFamily: 'monospace', fontWeight: '900', fontSize: '18px', letterSpacing: '3px', color: '#0f172a', background: '#e0e7ff', padding: '4px 12px', borderRadius: '8px' }}>
              {securityConfig.masterPin}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Enter New Master PIN (4+ digits)</label>
              <input 
                type="password" 
                placeholder="••••"
                value={securityConfig.newPin} 
                onChange={(e) => setSecurityConfig({ ...securityConfig, newPin: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '16px', letterSpacing: '4px', boxSizing: 'border-box' }}
                required 
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Confirm New Master PIN</label>
              <input 
                type="password" 
                placeholder="••••"
                value={securityConfig.confirmNewPin} 
                onChange={(e) => setSecurityConfig({ ...securityConfig, confirmNewPin: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '16px', letterSpacing: '4px', boxSizing: 'border-box' }}
                required 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSaving}
            style={{
              padding: '12px 24px',
              background: '#4f46e5',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              fontWeight: '800',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)'
            }}
          >
            <Lock size={16} />
            <span>{isSaving ? 'Updating PIN...' : 'Update Master PIN'}</span>
          </button>
        </form>
      )}

      {/* Tab 5: Staff & RBAC Team */}
      {activeSubTab === 'staff' && (
        <div style={{ marginTop: '10px' }}>
          <AdminStaff />
        </div>
      )}

    </div>
  );
};

export default AdminSettings;
