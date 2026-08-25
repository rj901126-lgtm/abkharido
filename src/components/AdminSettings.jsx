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
  Sparkles,
  Zap,
  Check,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import AdminStaff from './AdminStaff';

const AdminSettings = () => {
  const { showToast } = useApp();
  const [activeSubTab, setActiveSubTab] = useState('store'); // 'store' | 'shipping' | 'payments' | 'security' | 'staff'
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);

  // 1. Store Identity State
  const [storeInfo, setStoreInfo] = useState({
    storeName: 'AbKharido.com',
    tagline: 'Direct Buy & Earn Destination',
    supportPhone: '+91 9172600587',
    supportEmail: 'support@abkharido.com',
    whatsappSupport: '+919172600587',
    registeredCIN: 'U52100DL2024PTC394821',
    gstin: '07AAACA1234A1Z5',
    registeredAddress: 'Connaught Place, Central Delhi, New Delhi - 110001, India',
    brandColor: '#4f46e5'
  });

  // 2. Shipping & Fulfillment State
  const [shippingRules, setShippingRules] = useState({
    freeShippingMin: 499,
    standardShippingFee: 40,
    expressShippingFee: 99,
    codHandlingFee: 0,
    estimatedDeliveryDays: '2-4 Business Days',
    autoAssignCourier: true,
    preferredCourier: 'Delhivery Express',
    enablePincodeServiceabilityCheck: true
  });

  // 3. Payment Gateway Config (Cashfree PG)
  const [paymentConfig, setPaymentConfig] = useState({
    environment: 'sandbox', // 'sandbox' | 'production'
    appId: '',
    secretKey: '',
    secretKeyMasked: '',
    webhookSecret: '',
    webhookSecretMasked: '',
    apiVersion: '2023-08-01',
    enableCashfree: true,
    enableUpi: true,
    enableCards: true,
    enableNetBanking: true,
    enableCod: true,
    enableCoinsRedemption: true,
    maxCoinsDiscountPercent: 20,
    codMaxOrderLimit: 15000,
    coinRateRule: '1 AB Coin = ₹1'
  });

  // 4. Security & Access PIN (Never expose live PIN in UI)
  const [securityConfig, setSecurityConfig] = useState({
    currentPin: '',
    newPin: '',
    confirmNewPin: '',
    sessionTimeoutMinutes: 60,
    enforceDualStepOtp: true
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
    
    // Fetch server payment configuration
    fetch('/api/payments/cashfree/config')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setPaymentConfig(prev => ({
            ...prev,
            environment: data.environment || 'sandbox',
            appId: data.appId || '',
            secretKeyMasked: data.secretKeyMasked || '',
            webhookSecretMasked: data.webhookSecretMasked || '',
            codMaxOrderLimit: data.codMaxOrderLimit || 15000
          }));
        }
      })
      .catch(() => {});
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
      showToast('Cashfree PG rules & checkout controls updated successfully!', 'success');
    }, 600);
  };

  const handleTestCashfreeConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus(null);
    try {
      const res = await fetch('/api/payments/cashfree/test-connection', {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setConnectionStatus({ success: true, message: data.message });
        showToast(data.message, 'success');
      } else {
        setConnectionStatus({ success: false, message: data.message || 'Connection test failed.' });
        showToast(data.message || 'Connection test failed', 'error');
      }
    } catch (err) {
      setConnectionStatus({ success: false, message: 'Network error connecting to Cashfree API.' });
      showToast('Network error pinging Cashfree API.', 'error');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleUpdatePin = async (e) => {
    e.preventDefault();
    if (!securityConfig.newPin || securityConfig.newPin.length < 4) {
      showToast('New PIN must be at least 4 digits.', 'error');
      return;
    }
    if (securityConfig.newPin !== securityConfig.confirmNewPin) {
      showToast('New PIN and Confirm PIN do not match.', 'error');
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: securityConfig.newPin })
      });
      if (res.ok) {
        showToast('Admin Security PIN updated successfully.', 'success');
        setSecurityConfig({ currentPin: '', newPin: '', confirmNewPin: '', sessionTimeoutMinutes: 60, enforceDualStepOtp: true });
      } else {
        const data = await res.json();
        showToast(data.message || 'Failed to update PIN', 'error');
      }
    } catch (err) {
      showToast('Error updating PIN', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: "'Outfit', sans-serif" }}>
      
      {/* Settings Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Settings size={26} color="#4f46e5" /> System Configuration &amp; Payment Gateway Settings
        </h2>
        <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
          Manage store policies, Cashfree Escrow Payment Gateway, shipping thresholds, and access control.
        </p>
      </div>

      {/* Settings Navigation Subtabs */}
      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '24px', borderBottom: '1px solid #e2e8f0' }}>
        {[
          { id: 'store', label: 'Store Identity & Legal', icon: Store },
          { id: 'shipping', label: 'Shipping & Logistics', icon: Truck },
          { id: 'payments', label: 'Cashfree PG & Wallet', icon: CreditCard },
          { id: 'security', label: 'Security & PIN', icon: KeyRound },
          { id: 'staff', label: 'Staff Management', icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '12px',
                border: 'none',
                background: isActive ? '#4f46e5' : '#f1f5f9',
                color: isActive ? '#ffffff' : '#475569',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
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
            <Building2 size={20} color="#4f46e5" /> Corporate Legal Entity &amp; Support Contact
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Store Display Name</label>
              <input 
                type="text" 
                value={storeInfo.storeName} 
                onChange={(e) => setStoreInfo({ ...storeInfo, storeName: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                required 
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Support Hotline</label>
              <input 
                type="text" 
                value={storeInfo.supportPhone} 
                onChange={(e) => setStoreInfo({ ...storeInfo, supportPhone: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                required 
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Official Support Email</label>
              <input 
                type="email" 
                value={storeInfo.supportEmail} 
                onChange={(e) => setStoreInfo({ ...storeInfo, supportEmail: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                required
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

      {/* Tab 3: Cashfree PG & Wallet Rules */}
      {activeSubTab === 'payments' && (
        <form onSubmit={handleSavePayments} className="admin-panel-card" style={{ background: '#ffffff', borderRadius: '20px', padding: '28px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CreditCard size={20} color="#4f46e5" /> Cashfree Payment Gateway &amp; Wallet Engine
            </h3>

            <button
              type="button"
              onClick={handleTestCashfreeConnection}
              disabled={isTestingConnection}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: connectionStatus?.success ? '#ecfdf5' : '#f8fafc',
                color: connectionStatus?.success ? '#059669' : '#1e293b',
                border: connectionStatus?.success ? '1.5px solid #a7f3d0' : '1px solid #cbd5e1',
                padding: '8px 16px',
                borderRadius: '10px',
                fontWeight: '800',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              <Zap size={15} color={connectionStatus?.success ? '#059669' : '#4f46e5'} />
              <span>{isTestingConnection ? 'Testing...' : connectionStatus?.success ? 'Gateway Verified ✓' : 'Test Cashfree Connection'}</span>
            </button>
          </div>

          {connectionStatus && (
            <div style={{ padding: '12px 16px', borderRadius: '12px', marginBottom: '20px', background: connectionStatus.success ? '#ecfdf5' : '#fef2f2', border: connectionStatus.success ? '1px solid #a7f3d0' : '1px solid #fecaca', color: connectionStatus.success ? '#065f46' : '#991b1b', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {connectionStatus.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{connectionStatus.message}</span>
            </div>
          )}

          {/* Gateway Environment & Secrets */}
          <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '800', color: '#1e293b' }}>
              ⚙️ Gateway Credentials &amp; Environment
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Gateway Environment</label>
                <select 
                  value={paymentConfig.environment} 
                  onChange={(e) => setPaymentConfig({ ...paymentConfig, environment: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box', background: '#fff', fontWeight: '700' }}
                >
                  <option value="sandbox">Sandbox (Testing / Pre-Prod)</option>
                  <option value="production">Production (Live Payments)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Cashfree App ID</label>
                <input 
                  type="text" 
                  value={paymentConfig.appId} 
                  placeholder="e.g. CF123456TEST..."
                  onChange={(e) => setPaymentConfig({ ...paymentConfig, appId: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box', fontFamily: 'monospace' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Secret Key {paymentConfig.secretKeyMasked && <span style={{ color: '#059669', fontSize: '12px' }}>({paymentConfig.secretKeyMasked})</span>}
                </label>
                <input 
                  type="password" 
                  value={paymentConfig.secretKey} 
                  placeholder={paymentConfig.secretKeyMasked ? 'Enter new secret to update' : 'Enter Secret Key'}
                  onChange={(e) => setPaymentConfig({ ...paymentConfig, secretKey: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box', fontFamily: 'monospace' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Webhook Secret {paymentConfig.webhookSecretMasked && <span style={{ color: '#059669', fontSize: '12px' }}>({paymentConfig.webhookSecretMasked})</span>}
                </label>
                <input 
                  type="password" 
                  value={paymentConfig.webhookSecret} 
                  placeholder={paymentConfig.webhookSecretMasked ? 'Enter new webhook secret to update' : 'Enter Webhook Secret'}
                  onChange={(e) => setPaymentConfig({ ...paymentConfig, webhookSecret: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box', fontFamily: 'monospace' }}
                />
              </div>
            </div>

            <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
              🔒 <strong>Webhook URL:</strong> <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>https://www.abkharido.com/api/payments/cashfree/webhook</code>
            </div>
          </div>

          {/* Payment Method Switches */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            {[
              { key: 'enableCashfree', title: 'Cashfree Escrow Gateway', desc: 'Auto escrow refund protection & instant settlements' },
              { key: 'enableUpi', title: 'UPI Quick Pay', desc: 'Google Pay, PhonePe, Paytm, and BHIM QR' },
              { key: 'enableCards', title: 'Credit & Debit Cards', desc: 'Visa, MasterCard, RuPay with 3D Secure OTP' },
              { key: 'enableNetBanking', title: 'NetBanking Portal', desc: 'Direct bank debit across 50+ Indian banks' },
              { key: 'enableCod', title: 'Cash on Delivery (COD)', desc: 'Pay cash or dynamic QR at doorstep' },
              { key: 'enableCoinsRedemption', title: 'AB Coins Rewards Engine', desc: '1 AB Coin = ₹1 direct checkout discount' }
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
                  onChange={() => {}} 
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
              <span style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'block' }}>Default: ₹15,000 to prevent COD risk on high-ticket flagships.</span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>AB Coins Valuation Rule</label>
              <input 
                type="text" 
                value="1 AB Coin = ₹1 Instant Discount" 
                disabled
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box', background: '#f1f5f9', fontWeight: '700', color: '#0f172a' }}
              />
              <span style={{ fontSize: '12px', color: '#059669', marginTop: '4px', display: 'block' }}>🔒 Locked platform-wide for consistent customer trust.</span>
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
            <KeyRound size={20} color="#4f46e5" /> Super Admin Security PIN
          </h3>
          <p style={{ margin: '0 0 20px 0', color: '#64748b', fontSize: '13px' }}>
            Super Admin second-factor authorization PIN is required for privileged operations.
          </p>

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
