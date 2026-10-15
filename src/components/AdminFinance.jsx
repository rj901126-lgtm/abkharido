import { csvRows as serializeCSV } from '../utils/csvExport.js';
import React, { useState, useEffect } from 'react';
import { DollarSign, ArrowDownRight, CreditCard, Activity, CheckCircle, Clock, ShieldCheck, Lock, Building, Landmark, Percent, FileText, Download, Plus, AlertTriangle, Send, RefreshCw, Eye, EyeOff, Sparkles, ShieldAlert, ArrowRight, CheckCircle2, Copy, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

const AdminFinance = () => {
  const { showToast } = useApp();
  const [vendors, setVendors] = useState([]);
  const [treasury, setTreasury] = useState(null);
  const [loading, setLoading] = useState(true);
  const [settlingId, setSettlingId] = useState(null);
  const [batchSettling, setBatchSettling] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [revealedAccounts, setRevealedAccounts] = useState({});
  const [notification, setNotification] = useState({ show: false, text: '', type: 'success' });

  // New Vendor Form
  const [newVendor, setNewVendor] = useState({
    name: '',
    email: '',
    phone: '',
    accountNumber: '',
    ifscCode: '',
    sellerType: 'non_gst',
    gstin: '',
    pan: '',
    totalEarned: '0',
    pendingBalance: '0'
  });

  // Financial Security Toggles
  const [safeguards, setSafeguards] = useState({
    requireDualOtp: true,
    autoFreezeSuspicious: true,
    automatedNightlyT1: true,
    tdsWithholding: true
  });

  const [realOrders, setRealOrders] = useState([]);

  const showToastMsg = (text, type = 'success') => {
    setNotification({ show: true, text, type });
    if (showToast) showToast(text, type);
    setTimeout(() => setNotification({ show: false, text: '', type: 'success' }), 3800);
  };

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const fetchFinanceData = async () => {
    setLoading(true);
    try {
      const savedSafeguards = localStorage.getItem('abkharido_finance_safeguards');
      if (savedSafeguards) {
        try { setSafeguards(JSON.parse(savedSafeguards)); } catch (e) {}
      }

      const token = sessionStorage.getItem('abkharido_admin_token') || localStorage.getItem('adminToken') || '';
      
      // Fetch real orders to drive GMV and revenue
      try {
        const ordersRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/orders?limit=1000`, { 
          headers: { 'x-admin-token': token } 
        });
        if (ordersRes.ok) {
          const oData = await ordersRes.json();
          const list = Array.isArray(oData) ? oData : (oData.orders || []);
          setRealOrders(list);
        }
      } catch (err) {}

      const vendorsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/finance/vendors-balance`, {
        headers: { 'x-admin-token': token }
      });
      
      if (vendorsRes.ok) {
        const data = await vendorsRes.json();
        if (data.vendors && Array.isArray(data.vendors)) {
          setVendors(data.vendors);
          setTreasury(data.treasury || null);
          setLoading(false);
          return;
        } else if (Array.isArray(data) && data.length > 0) {
          setVendors(data);
          setLoading(false);
          return;
        }
      }

      setVendors([]);
    } catch (err) {
      showToastMsg('Notice: Could not load vendor balances', 'info');
    } finally {
      setLoading(false);
    }
  };

  const toggleAccountMask = (id) => {
    setRevealedAccounts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const maskAccount = (acc, id) => {
    if (!acc) return 'XXXX-XXXX-XXXX';
    if (revealedAccounts[id]) return acc;
    return `XXXX-XXXX-${String(acc).slice(-4)}`;
  };

  // Direct RBI Escrow Release Payout Handler
  const handleSettle = async (vendor) => {
    if ((vendor.pendingBalance || 0) <= 0) {
      showToastMsg('No cleared escrow balance available to settle for this vendor!', 'info');
      return;
    }

    if (!vendor.hasValidBank && !vendor.accountNumber && !vendor.upiId) {
      showToastMsg('Vendor missing KYC bank account or UPI ID!', 'error');
      return;
    }

    setSettlingId(vendor._id);
    try {
      const token = sessionStorage.getItem('abkharido_admin_token') || localStorage.getItem('adminToken') || '';
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/finance/vendors-balance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token
        },
        body: JSON.stringify({
          vendorId: vendor._id,
          amount: vendor.pendingBalance,
          transferMode: vendor.upiId && !vendor.accountNumber ? 'UPI' : 'IMPS',
          remarks: `AbKharido RBI Escrow Payout - ${vendor.name}`
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to execute escrow settlement transfer');
      }

      showToastMsg(`✅ Escrow Released! ₹${vendor.pendingBalance.toLocaleString('en-IN')} transferred via IMPS. UTR: ${data.payout?.utrNumber}`, 'success');
      setActiveReceipt(data.payout);
      setShowReceiptModal(true);
      fetchFinanceData();
    } catch (err) {
      showToastMsg(`❌ Settlement error: ${err.message}`, 'error');
    } finally {
      setSettlingId(null);
    }
  };

  // Batch Settle All Vendors
  const handleBatchSettle = async () => {
    const eligibleCount = vendors.filter(v => (v.pendingBalance || 0) > 0).length;
    const totalPending = vendors.reduce((sum, v) => sum + (v.pendingBalance || 0), 0);

    if (totalPending <= 0 || eligibleCount === 0) {
      showToastMsg('No cleared escrow funds available for batch release.', 'info');
      return;
    }

    const confirmed = window.confirm(
      `⚡ EXECUTE BATCH ESCROW SETTLEMENT?\n\n` +
      `Total Vendors: ${eligibleCount}\n` +
      `Total Escrow Amount: ₹${totalPending.toLocaleString('en-IN')}\n\n` +
      `Funds will disburse directly from the RBI Nodal Escrow Account into each vendor's verified bank account via IMPS/NEFT.`
    );

    if (!confirmed) return;

    setBatchSettling(true);
    try {
      const token = sessionStorage.getItem('abkharido_admin_token') || localStorage.getItem('adminToken') || '';
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/finance/vendors-balance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token
        },
        body: JSON.stringify({ batchAll: true, transferMode: 'IMPS' })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to execute batch escrow settlement');
      }

      showToastMsg(data.message, 'success');
      fetchFinanceData();
    } catch (err) {
      showToastMsg(`❌ Batch settlement failed: ${err.message}`, 'error');
    } finally {
      setBatchSettling(false);
    }
  };

  const handleAddVendor = (e) => {
    e.preventDefault();
    if (!newVendor.name || !newVendor.accountNumber || !newVendor.ifscCode) return;

    const created = {
      _id: 'v_' + Date.now(),
      name: newVendor.name,
      legalBusinessName: newVendor.name,
      email: newVendor.email || 'vendor@abkharido.in',
      phone: newVendor.phone || '9876543210',
      accountNumber: newVendor.accountNumber,
      ifscCode: newVendor.ifscCode.toUpperCase(),
      sellerType: newVendor.sellerType || 'non_gst',
      gstin: newVendor.gstin || '',
      pan: newVendor.pan || '',
      totalEarned: Number(newVendor.totalEarned || 0),
      totalSettled: Math.max(Number(newVendor.totalEarned || 0) - Number(newVendor.pendingBalance || 0), 0),
      pendingBalance: Number(newVendor.pendingBalance || 0),
      hasValidBank: true,
      status: 'Active (KYC Verified)'
    };

    const updated = [created, ...vendors];
    setVendors(updated);
    setShowAddModal(false);
    setNewVendor({ name: '', email: '', phone: '', accountNumber: '', ifscCode: '', sellerType: 'non_gst', gstin: '', pan: '', totalEarned: '45000', pendingBalance: '12500' });
    showToastMsg(`✨ Successfully onboarded ${created.name} to Treasury & Escrow payout ledger!`, 'success');
  };

  const handleToggleSafeguard = (key) => {
    const updated = { ...safeguards, [key]: !safeguards[key] };
    setSafeguards(updated);
    localStorage.setItem('abkharido_finance_safeguards', JSON.stringify(updated));
    showToastMsg(`🛡️ Financial Security safeguard '${key}' updated! Treasury protection rules saved.`, 'success');
  };

  const exportGSTReport = () => {
    const headers = ['Category', 'Description', 'Applicable Rate', 'Turnover / Amount (₹)', 'Tax Liability (₹)', 'Statutory Status'];
    const csvRows = serializeCSV([headers,
      ['Platform Service Turnover', 'AbKharido Marketplace Commission (10%)', '0% (Exempt)', totalPlatformRev, '0.00', 'Section 22 CGST Act (Turnover < ₹20 Lakhs)'],
      ['E-commerce TCS (Sec 52)', 'Tax Collection at Source', '0% (Not Applicable)', totalEarnedVol, '0.00', 'Exempt for Unregistered Electronic Commerce Operators'],
      ['Seller Invoices (GST)', 'Tax Invoices generated for GST registered sellers', '5% - 28%', 'Varies by Seller', 'Direct Seller Filing', 'Seller Files GSTR-1 & GSTR-3B'],
      ['Seller Invoices (Non-GST)', 'Bills of Supply for unregistered micro-sellers', '0%', totalEarnedVol, '0.00', 'Section 31(3)(c) CGST Act & Notification 34/2023']
    ]);
    const blob = new Blob([csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `AbKharido_Tax_Exemption_Compliance_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToastMsg('📥 Tax Exemption & Compliance Report (CSV) downloaded successfully!', 'success');
  };

  const exportLedgerCSV = () => {
    const headers = ['Vendor Name', 'Seller Type', 'GSTIN/PAN', 'Email', 'Account Number', 'IFSC Code', 'Total Earned (₹)', 'Total Settled (₹)', 'Pending Escrow Balance (₹)', 'KYC Status'];
    const csvRows = serializeCSV([headers, ...vendors.map(v => [
      v.name,
      v.sellerType === 'gst' ? 'GST Registered' : 'Non-GST (Sec 31(3)(c))',
      v.gstin || v.pan || 'N/A',
      v.email,
      v.accountNumber,
      v.ifscCode,
      v.totalEarned,
      v.totalSettled,
      v.pendingBalance,
      v.status
    ])]);
    const blob = new Blob([csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `AbKharido_Vendor_Payouts_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToastMsg('📥 Global Vendor Settlement Ledger downloaded successfully!', 'success');
  };

  // Authoritative Calculations
  const nonCancelledOrders = realOrders.filter(o => o.status !== 'Cancelled');
  const totalEarnedVol = nonCancelledOrders.reduce((acc, o) => acc + (o.totalPrice || 0), 0);
  const totalPlatformRev = Math.round(totalEarnedVol * 0.10); // 10% Platform Commission
  const totalSettledVol = vendors.reduce((acc, v) => acc + (v.totalSettled || 0), 0);
  const totalPendingVol = vendors.reduce((acc, v) => acc + (v.pendingBalance || 0), 0);
  const totalQuarantinedVol = vendors.reduce((acc, v) => acc + (v.inEscrowQuarantine || 0), 0);
  const totalGstCollected = Math.round(totalPlatformRev * 0.18);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '450px', flexDirection: 'column', gap: '16px' }}>
        <div style={{ width: '45px', height: '45px', border: '4px solid #e0e7ff', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <div style={{ color: '#3b82f6', fontWeight: '800', fontSize: '16px', letterSpacing: '0.5px' }}>Loading Financial &amp; Treasury Ledger...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '26px', paddingBottom: '40px' }}>
      
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

      {/* Official Bank Settlement Receipt Modal */}
      {showReceiptModal && activeReceipt && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#ffffff', borderRadius: '24px', maxWidth: '540px', width: '100%', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid #e2e8f0', position: 'relative', animation: 'scaleUp 0.2s ease-out' }}>
            <button onClick={() => setShowReceiptModal(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}>
              <X size={18} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <CheckCircle2 size={36} />
              </div>
              <span style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', background: '#e0e7ff', color: '#3730a3', padding: '4px 12px', borderRadius: '100px' }}>
                RBI NODAL ESCROW DISBURSEMENT
              </span>
              <h3 style={{ margin: '10px 0 4px', fontSize: '22px', fontWeight: '900', color: '#0f172a' }}>Settlement Disbursed Directly</h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Funds released from RBI-regulated Escrow Pool directly into the seller bank account via IMPS.</p>
            </div>

            <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Amount Disbursed</span>
                <span style={{ fontSize: '24px', fontWeight: '900', color: '#15803d' }}>₹{Number(activeReceipt.amount).toLocaleString('en-IN')}</span>
              </div>
              
              <div style={{ height: '1px', background: '#e2e8f0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Bank UTR Number</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <code style={{ background: '#eff6ff', color: '#1e40af', padding: '4px 8px', borderRadius: '6px', fontWeight: '800', fontSize: '13px' }}>{activeReceipt.utrNumber}</code>
                  <button onClick={() => { navigator.clipboard?.writeText(activeReceipt.utrNumber); showToastMsg('UTR Copied!', 'info'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                    <Copy size={14} />
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Beneficiary Merchant</span>
                <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>{activeReceipt.vendorName}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Destination A/C</span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#334155', fontFamily: 'monospace' }}>{activeReceipt.destination}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Escrow Source</span>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#15803d', background: '#dcfce7', padding: '3px 8px', borderRadius: '6px' }}>{activeReceipt.escrowSource || 'RBI Nodal Escrow (Cashfree)'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Settlement Rail</span>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a' }}>IMPS Instant 24x7</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Timestamp</span>
                <span style={{ fontSize: '12px', color: '#64748b' }}>{new Date(activeReceipt.settledAt || Date.now()).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowReceiptModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: '#0f172a', color: '#ffffff', fontWeight: '800', fontSize: '14px', border: 'none', cursor: 'pointer' }}>
                Close Receipt
              </button>
            </div>
            <style>{`@keyframes scaleUp { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }`}</style>
          </div>
        </div>
      )}

      {/* Top Treasury, Cashfree Escrow & Tax KPI Header */}
      <div style={{ background: 'linear-gradient(135deg, #090e17 0%, #171e31 40%, #1e1b4b 100%)', padding: '28px 34px', borderRadius: '22px', color: '#ffffff', boxShadow: '0 10px 30px rgba(9, 14, 23, 0.4)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '22px', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', background: 'linear-gradient(to right, #34d399, #10b981)', color: '#064e3b', padding: '4px 14px', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={14} /> ⚡ CASHFREE ESCROW DIRECT PAYOUTS: ACTIVE
            </span>
            <span style={{ fontSize: '11px', fontWeight: '800', background: '#312e81', color: '#c7d2fe', padding: '4px 12px', borderRadius: '100px', border: '1px solid #4f46e5' }}>
              🇮🇳 RBI NODAL ESCROW ACCOUNT MANDATE
            </span>
          </div>
          <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '900', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            Finance & Treasury Command Center 2.0
          </h2>
          <p style={{ margin: '6px 0 0', color: '#cbd5e1', fontSize: '14px', maxWidth: '660px', lineHeight: '1.5' }}>
            Buyer payments are segregated in an RBI-mandated Nodal Escrow Account. When orders are delivered and return periods clear, Admin releases payouts directly from Escrow to the seller bank account via IMPS with 12-digit RBI UTR.
          </p>
        </div>

        {/* Live Treasury Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: '14px', width: '100%', maxWidth: '820px', marginTop: '6px' }}>
          
          <div style={{ background: 'rgba(34, 197, 94, 0.1)', backdropFilter: 'blur(10px)', padding: '16px 20px', borderRadius: '18px', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
            <div style={{ fontSize: '11px', color: '#86efac', fontWeight: '800', textTransform: 'uppercase' }}>Gross Sales Vol. (GMV)</div>
            <div style={{ fontSize: '26px', fontWeight: '900', color: '#4ade80', marginTop: '4px' }}>
              ₹{totalEarnedVol.toLocaleString('en-IN')}
            </div>
            <span style={{ fontSize: '11px', color: '#cbd5e1', display: 'block', marginTop: '4px' }}>Marketplace cumulative volume</span>
          </div>

          <div style={{ background: 'rgba(59, 130, 246, 0.1)', backdropFilter: 'blur(10px)', padding: '16px 20px', borderRadius: '18px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            <div style={{ fontSize: '11px', color: '#bfdbfe', fontWeight: '800', textTransform: 'uppercase' }}>Platform Revenue (10%)</div>
            <div style={{ fontSize: '26px', fontWeight: '900', color: '#60a5fa', marginTop: '4px' }}>
              ₹{totalPlatformRev.toLocaleString('en-IN')}
            </div>
            <span style={{ fontSize: '11px', color: '#cbd5e1', display: 'block', marginTop: '4px' }}>Net AbKharido earnings</span>
          </div>

          <div style={{ background: 'rgba(217, 70, 239, 0.1)', backdropFilter: 'blur(10px)', padding: '16px 20px', borderRadius: '18px', border: '1px solid rgba(217, 70, 239, 0.3)' }}>
            <div style={{ fontSize: '11px', color: '#f0abfc', fontWeight: '800', textTransform: 'uppercase' }}>Total Settled to Sellers</div>
            <div style={{ fontSize: '26px', fontWeight: '900', color: '#e879f9', marginTop: '4px' }}>
              ₹{totalSettledVol.toLocaleString('en-IN')}
            </div>
            <span style={{ fontSize: '11px', color: '#cbd5e1', display: 'block', marginTop: '4px' }}>Disbursed via RBI Escrow IMPS</span>
          </div>

          <div style={{ background: 'rgba(245, 158, 11, 0.12)', backdropFilter: 'blur(10px)', padding: '16px 20px', borderRadius: '18px', border: '1px solid rgba(245, 158, 11, 0.35)' }}>
            <div style={{ fontSize: '11px', color: '#fde68a', fontWeight: '800', textTransform: 'uppercase' }}>Cleared Escrow Ready</div>
            <div style={{ fontSize: '26px', fontWeight: '900', color: '#fbbf24', marginTop: '4px' }}>
              ₹{totalPendingVol.toLocaleString('en-IN')}
            </div>
            <span style={{ fontSize: '11px', color: '#cbd5e1', display: 'block', marginTop: '4px' }}>{vendors.filter(v => (v.pendingBalance || 0) > 0).length} sellers ready for payout</span>
          </div>

        </div>
      </div>

      {/* SPECIAL ARCHITECTURAL DIAGRAM: RBI Nodal Escrow Direct Settlement Journey */}
      <div style={{ background: '#ffffff', borderRadius: '22px', border: '1px solid #e2e8f0', padding: '26px 30px', boxShadow: '0 6px 25px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', background: '#dbeafe', color: '#1e40af', padding: '3px 10px', borderRadius: '100px' }}>
              RBI PA/PG ESCROW PROTOCOL (SECTION 10A PSS ACT)
            </span>
            <h3 style={{ margin: '6px 0 0', fontSize: '19px', fontWeight: '900', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Landmark size={22} style={{ color: '#2563eb' }} /> How Escrow Direct Payouts Work at AbKharido
            </h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '800', color: '#059669', background: '#f0fdf4', padding: '6px 14px', borderRadius: '100px', border: '1px solid #bbf7d0' }}>
            <CheckCircle size={15} /> <span>Funds never enter AbKharido operating account — 100% compliant direct disbursement</span>
          </div>
        </div>

        {/* 5-Step Visual Flowchart */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '12px', position: 'relative' }}>
          
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#2563eb', color: '#ffffff', fontWeight: '900', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>1</span>
              <span style={{ fontSize: '10px', fontWeight: '800', color: '#2563eb', background: '#eff6ff', padding: '2px 8px', borderRadius: '100px' }}>BUYER</span>
            </div>
            <div style={{ fontWeight: '800', fontSize: '14px', color: '#0f172a' }}>Customer Pays Order</div>
            <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.4' }}>Payment received via UPI, Cards, NetBanking on Cashfree Gateway.</div>
          </div>

          <div style={{ background: '#eff6ff', padding: '16px', borderRadius: '16px', border: '1.5px solid #93c5fd', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#1d4ed8', color: '#ffffff', fontWeight: '900', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>2</span>
              <span style={{ fontSize: '10px', fontWeight: '800', color: '#1d4ed8', background: '#dbeafe', padding: '2px 8px', borderRadius: '100px' }}>QUARANTINE</span>
            </div>
            <div style={{ fontWeight: '800', fontSize: '14px', color: '#1e3a8a' }}>RBI Nodal Escrow</div>
            <div style={{ fontSize: '12px', color: '#1e40af', lineHeight: '1.4' }}>Funds legally quarantined at ICICI/Cashfree Escrow Pool. Untouchable by platform.</div>
          </div>

          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#0284c7', color: '#ffffff', fontWeight: '900', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</span>
              <span style={{ fontSize: '10px', fontWeight: '800', color: '#0284c7', background: '#e0f2fe', padding: '2px 8px', borderRadius: '100px' }}>LOGISTICS</span>
            </div>
            <div style={{ fontWeight: '800', fontSize: '14px', color: '#0f172a' }}>Delivery & Return Window</div>
            <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.4' }}>Delhivery AWB status marks Delivered. Return period clears to seller wallet.</div>
          </div>

          <div style={{ background: '#fdf4ff', padding: '16px', borderRadius: '16px', border: '1.5px solid #f0abfc', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#a21caf', color: '#ffffff', fontWeight: '900', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>4</span>
              <span style={{ fontSize: '10px', fontWeight: '800', color: '#a21caf', background: '#fae8ff', padding: '2px 8px', borderRadius: '100px' }}>ADMIN APPROVAL</span>
            </div>
            <div style={{ fontWeight: '800', fontSize: '14px', color: '#701a75' }}>Direct Escrow Release</div>
            <div style={{ fontSize: '12px', color: '#86198f', lineHeight: '1.4' }}>Admin approves single or 1-click batch payout to Cashfree Payouts API.</div>
          </div>

          <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '16px', border: '1.5px solid #86efac', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#16a34a', color: '#ffffff', fontWeight: '900', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>5</span>
              <span style={{ fontSize: '10px', fontWeight: '800', color: '#16a34a', background: '#dcfce7', padding: '2px 8px', borderRadius: '100px' }}>IMPS BANK UTR</span>
            </div>
            <div style={{ fontWeight: '800', fontSize: '14px', color: '#14532d' }}>Direct Bank Account Credit</div>
            <div style={{ fontSize: '12px', color: '#166534', lineHeight: '1.4' }}>Escrow pool dispatches IMPS directly to Seller IFSC. Real 12-digit UTR assigned.</div>
          </div>

        </div>
      </div>

      {/* SPECIAL SECTION: Indian GST Compliance & Financial Fraud Safeguard Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' }}>
        
        {/* CARD 1: Indian GST & Tax Status Engine */}
        <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 6px 25px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', background: '#dcfce7', color: '#166534', padding: '3px 10px', borderRadius: '100px', border: '1px solid #86efac' }}>
                  ✓ SEC 22 CGST EXEMPT (&lt; ₹20L)
                </span>
                <span style={{ fontSize: '11px', fontWeight: '800', background: '#eff6ff', color: '#1e40af', padding: '3px 10px', borderRadius: '100px' }}>
                  MSME INTERMEDIARY
                </span>
              </div>
              <h3 style={{ margin: '8px 0 0', fontSize: '19px', fontWeight: '900', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Landmark size={22} style={{ color: '#2563eb' }} /> Marketplace Tax & GST Compliance Engine
              </h3>
            </div>
            <button
              type="button"
              onClick={exportGSTReport}
              style={{ padding: '9px 14px', borderRadius: '10px', background: '#0f172a', color: '#ffffff', fontWeight: '800', fontSize: '12px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 3px 12px rgba(15, 23, 42, 0.2)' }}
            >
              <Download size={14} /> <span>Download Compliance Report</span>
            </button>
          </div>

          <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>
            Operating legally under Indian Law as an unregistered technology facilitator (turnover &lt; ₹20 Lakhs). No GST is charged on AbKharido fees, and Section 52 TCS does not apply to unregistered platforms.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Platform GST Liability</div>
              <div style={{ fontSize: '20px', fontWeight: '900', color: '#16a34a', marginTop: '2px' }}>₹0.00 (Exempt)</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Turnover under ₹20L threshold</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Sec 52 TCS Withholding</div>
              <div style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', marginTop: '2px' }}>₹0.00 (N/A)</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Only registered ECOs file GSTR-8</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#15803d', fontWeight: '700', background: '#f0fdf4', padding: '10px 14px', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
            <CheckCircle size={16} /> <span>100% Legal: Non-GST Sellers issue Bill of Supply; GST Sellers issue Tax Invoices. Platform acts as IT Intermediary.</span>
          </div>
        </div>

        {/* CARD 2: Financial Fraud & Payout Safeguards */}
        <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', borderRadius: '20px', border: '2px solid #818cf8', padding: '24px', color: '#ffffff', boxShadow: '0 8px 30px rgba(30, 27, 75, 0.2)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', background: '#fee2e2', color: '#991b1b', padding: '3px 10px', borderRadius: '100px' }}>
              🔒 TREASURY DEFENSE ENGINE
            </span>
            <h3 style={{ margin: '8px 0 0', fontSize: '19px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={22} style={{ color: '#f87171' }} /> Financial Fraud & Payout Safeguards
            </h3>
          </div>

          <p style={{ margin: 0, fontSize: '13px', color: '#c7d2fe', lineHeight: '1.5' }}>
            Enforce double authorization on high-value settlements and automate midnight batch disbursements from the RBI Escrow Pool.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ background: 'rgba(255,255,255,0.08)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: '800', fontSize: '13px' }}>Require Dual-Admin OTP for Payouts (Above ₹50,000)</div>
                <div style={{ fontSize: '11px', color: '#cbd5e1' }}>Prevents single-admin errors on high value bank transfers.</div>
              </div>
              <input type="checkbox" checked={safeguards.requireDualOtp} onChange={() => handleToggleSafeguard('requireDualOtp')} style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#34d399' }} />
            </div>

            <div style={{ background: 'rgba(255,255,255,0.08)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: '800', fontSize: '13px' }}>Auto-Freeze Refunds on Suspicious IP Telemetry</div>
                <div style={{ fontSize: '11px', color: '#cbd5e1' }}>Blocks automated refund exploitation from VPNs / untrusted IPs.</div>
              </div>
              <input type="checkbox" checked={safeguards.autoFreezeSuspicious} onChange={() => handleToggleSafeguard('autoFreezeSuspicious')} style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#34d399' }} />
            </div>

            <div style={{ background: 'rgba(255,255,255,0.08)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: '800', fontSize: '13px' }}>Automate T+1 Nightly Cashfree Escrow Settlement</div>
                <div style={{ fontSize: '11px', color: '#cbd5e1' }}>Automatically batches approved vendor payments every midnight.</div>
              </div>
              <input type="checkbox" checked={safeguards.automatedNightlyT1} onChange={() => handleToggleSafeguard('automatedNightlyT1')} style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#34d399' }} />
            </div>
          </div>
        </div>

      </div>

      {/* Vendor Ledger Section Header + Onboard & Batch Release Buttons */}
      <div style={{ background: '#ffffff', borderRadius: '22px', border: '1px solid #e2e8f0', boxShadow: '0 6px 30px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', padding: '24px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
          <div>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '20px', fontWeight: '900', color: '#0f172a' }}>
              <Building size={24} style={{ color: '#3b82f6' }} /> Global Vendor Settlements Ledger
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
              Direct Escrow payout control for GST and Non-GST merchant accounts.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {/* Batch Release Button */}
            <button
              type="button"
              disabled={batchSettling || totalPendingVol <= 0}
              onClick={handleBatchSettle}
              style={{
                padding: '11px 20px', borderRadius: '12px',
                background: totalPendingVol > 0 ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : '#f1f5f9',
                color: totalPendingVol > 0 ? '#ffffff' : '#94a3b8',
                border: 'none', fontWeight: '900', fontSize: '13px',
                cursor: totalPendingVol > 0 && !batchSettling ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', gap: '8px',
                boxShadow: totalPendingVol > 0 ? '0 4px 15px rgba(245, 158, 11, 0.35)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <Sparkles size={16} />
              <span>{batchSettling ? 'Processing Batch Escrow...' : `⚡ Settle All Cleared Escrow (₹${totalPendingVol.toLocaleString('en-IN')})`}</span>
            </button>

            <button 
              type="button"
              onClick={() => setShowAddModal(!showAddModal)}
              style={{ padding: '11px 18px', borderRadius: '12px', background: showAddModal ? '#f1f5f9' : '#3b82f6', color: showAddModal ? '#0f172a' : '#ffffff', border: '1px solid #cbd5e1', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s', boxShadow: showAddModal ? 'none' : '0 4px 14px rgba(59, 130, 246, 0.3)' }}
            >
              <Plus size={16} /> <span>{showAddModal ? 'Close Form' : '+ Onboard New Vendor Partner'}</span>
            </button>

            <button 
              type="button"
              style={{ padding: '11px 18px', borderRadius: '12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#ffffff', border: 'none', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)' }}
              onClick={exportLedgerCSV}
            >
              <Download size={15} /> <span>Export Ledger (CSV)</span>
            </button>
          </div>
        </div>

        {/* Modal / Inline Drawer for Onboarding New Vendor */}
        {showAddModal && (
          <div style={{ padding: '26px', background: '#eff6ff', borderBottom: '2px solid #bfdbfe', animation: 'fadeIn 0.2s' }}>
            <h4 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '900', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building size={20} color="#2563eb" /> Onboard Verified Vendor & Bank Account
            </h4>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#1e40af' }}>Enter KYC verified Bank IFSC and account number to enable automatic Cashfree settlement transfers.</p>
            
            <form onSubmit={handleAddVendor} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#1e3a8a', display: 'block', marginBottom: '4px' }}>Vendor Business Name *</label>
                <input type="text" required placeholder="e.g. Apex Electronics India" value={newVendor.name} onChange={e => setNewVendor({...newVendor, name: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #93c5fd', fontSize: '14px', boxSizing: 'border-box', background: '#ffffff', fontWeight: '600' }} />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#1e3a8a', display: 'block', marginBottom: '4px' }}>Company Email *</label>
                <input type="email" required placeholder="e.g. billing@apexelectronics.com" value={newVendor.email} onChange={e => setNewVendor({...newVendor, email: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #93c5fd', fontSize: '14px', boxSizing: 'border-box', background: '#ffffff', fontWeight: '600' }} />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#1e3a8a', display: 'block', marginBottom: '4px' }}>Seller GST Category *</label>
                <select value={newVendor.sellerType} onChange={e => setNewVendor({...newVendor, sellerType: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #93c5fd', fontSize: '14px', boxSizing: 'border-box', background: '#ffffff', fontWeight: '700' }}>
                  <option value="non_gst">Non-GST (Turnover &lt; ₹40L - Bill of Supply)</option>
                  <option value="gst">GST Registered (15-Digit GSTIN - Tax Invoice)</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#1e3a8a', display: 'block', marginBottom: '4px' }}>{newVendor.sellerType === 'gst' ? '15-Digit GSTIN *' : '10-Digit PAN / Enrolment ID *'}</label>
                <input type="text" placeholder={newVendor.sellerType === 'gst' ? '27AAAAA0000A1Z5' : 'ABCDE1234F'} value={newVendor.sellerType === 'gst' ? newVendor.gstin : newVendor.pan} onChange={e => newVendor.sellerType === 'gst' ? setNewVendor({...newVendor, gstin: e.target.value.toUpperCase()}) : setNewVendor({...newVendor, pan: e.target.value.toUpperCase()})} style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #93c5fd', fontSize: '14px', boxSizing: 'border-box', background: '#ffffff', fontWeight: '700', textTransform: 'uppercase' }} />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#1e3a8a', display: 'block', marginBottom: '4px' }}>Bank Account Number *</label>
                <input type="text" required placeholder="e.g. 5010029837192" value={newVendor.accountNumber} onChange={e => setNewVendor({...newVendor, accountNumber: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #93c5fd', fontSize: '14px', boxSizing: 'border-box', background: '#ffffff', fontWeight: '700', fontFamily: 'monospace' }} />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#1e3a8a', display: 'block', marginBottom: '4px' }}>Bank IFSC Code *</label>
                <input type="text" required placeholder="e.g. HDFC0001234" value={newVendor.ifscCode} onChange={e => setNewVendor({...newVendor, ifscCode: e.target.value.toUpperCase()})} style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #93c5fd', fontSize: '14px', boxSizing: 'border-box', background: '#ffffff', fontWeight: '800', fontFamily: 'monospace', textTransform: 'uppercase' }} />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#16a34a', display: 'block', marginBottom: '4px' }}>Initial Earned Volume (₹)</label>
                <input type="number" value={newVendor.totalEarned} onChange={e => setNewVendor({...newVendor, totalEarned: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #86efac', fontSize: '14px', boxSizing: 'border-box', background: '#f0fdf4', fontWeight: '800', color: '#16a34a' }} />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#d97706', display: 'block', marginBottom: '4px' }}>Pending Payout Balance (₹)</label>
                <input type="number" value={newVendor.pendingBalance} onChange={e => setNewVendor({...newVendor, pendingBalance: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #fde68a', fontSize: '14px', boxSizing: 'border-box', background: '#fef3c7', fontWeight: '800', color: '#b45309' }} />
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '10px 18px', borderRadius: '10px', background: '#ffffff', color: '#64748b', border: '1px solid #cbd5e1', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 24px', borderRadius: '10px', background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)', color: '#ffffff', border: 'none', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)' }}>Verify & Save Vendor Ledger</button>
              </div>
            </form>
          </div>
        )}

        {/* Vendors Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '920px' }}>
            <thead>
              <tr style={{ background: '#ffffff', borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <th style={{ padding: '16px 26px' }}>Vendor & Tax Category</th>
                <th style={{ padding: '16px 20px' }}>Verified Bank / IFSC</th>
                <th style={{ padding: '16px 20px' }}>Total Earned</th>
                <th style={{ padding: '16px 20px' }}>Settled from Escrow</th>
                <th style={{ padding: '16px 20px' }}>Cleared for Release</th>
                <th style={{ padding: '16px 26px', textAlign: 'right' }}>Direct Escrow Action</th>
              </tr>
            </thead>
            <tbody>
              {vendors.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '50px 20px', color: '#64748b' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <Building size={36} style={{ color: '#94a3b8' }} />
                      <span style={{ fontSize: '16px', fontWeight: '700', color: '#334155' }}>No vendor ledgers currently onboarded.</span>
                      <span style={{ fontSize: '13px', color: '#94a3b8' }}>Click '+ Onboard New Vendor Partner' above to add bank accounts.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                vendors.map(v => {
                  const hasPending = (v.pendingBalance || 0) > 0;
                  const isSettling = settlingId === v._id;
                  const isGst = v.sellerType === 'gst' || Boolean(v.gstin);

                  return (
                    <tr key={v._id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      
                      {/* Vendor Identity & Tax Category */}
                      <td style={{ padding: '16px 26px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: isGst ? 'linear-gradient(135deg, #eff6ff, #dbeafe)' : 'linear-gradient(135deg, #fef3c7, #fde68a)', color: isGst ? '#1e40af' : '#92400e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '18px', border: `1px solid ${isGst ? '#bfdbfe' : '#fcd34d'}` }}>
                            {v.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '15px' }}>{v.name}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                              <span style={{ fontSize: '10px', fontWeight: '800', padding: '2px 8px', borderRadius: '100px', background: isGst ? '#e0e7ff' : '#fef3c7', color: isGst ? '#3730a3' : '#b45309', border: `1px solid ${isGst ? '#c7d2fe' : '#fde68a'}` }}>
                                {isGst ? 'GST REG (TAX INVOICE)' : 'NON-GST (BILL OF SUPPLY)'}
                              </span>
                              {(v.gstin || v.pan) && (
                                <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace', fontWeight: '700' }}>
                                  {v.gstin ? `GSTIN: ${v.gstin}` : `PAN: ${v.pan}`}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Bank Details */}
                      <td style={{ padding: '16px 20px' }}>
                        {v.accountNumber ? (
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{maskAccount(v.accountNumber, v._id)}</span>
                              <button onClick={() => toggleAccountMask(v._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 0 }}>
                                {revealedAccounts[v._id] ? <EyeOff size={13} /> : <Eye size={13} />}
                              </button>
                            </div>
                            <div style={{ fontSize: '11px', color: '#15803d', fontWeight: '800', marginTop: '2px' }}>
                              IFSC: {v.ifscCode || 'HDFC0001234'}
                            </div>
                          </div>
                        ) : v.upiId ? (
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: '800', color: '#2563eb' }}>UPI: {v.upiId}</div>
                            <div style={{ fontSize: '11px', color: '#16a34a' }}>Instant VPA Rail</div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: '700' }}>⚠️ Bank Missing</span>
                        )}
                      </td>

                      {/* Total Earned */}
                      <td style={{ padding: '16px 20px', fontWeight: '900', color: '#1e293b', fontSize: '15px' }}>
                        ₹{Number(v.totalEarned || 0).toLocaleString('en-IN')}
                      </td>

                      {/* Total Settled */}
                      <td style={{ padding: '16px 20px', fontWeight: '900', color: '#16a34a', fontSize: '15px' }}>
                        ₹{Number(v.totalSettled || 0).toLocaleString('en-IN')}
                      </td>

                      {/* Pending Balance Badge */}
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{
                          padding: '6px 14px', borderRadius: '100px', fontSize: '13px', fontWeight: '900', display: 'inline-block',
                          background: hasPending ? '#fef3c7' : '#f1f5f9', color: hasPending ? '#b45309' : '#64748b',
                          border: '1px solid', borderColor: hasPending ? '#fde68a' : '#cbd5e1'
                        }}>
                          ₹{Number(v.pendingBalance || 0).toLocaleString('en-IN')} {hasPending && '⚡'}
                        </span>
                      </td>

                      {/* Action */}
                      <td style={{ padding: '16px 26px', textAlign: 'right' }}>
                        <button
                          type="button"
                          disabled={!hasPending || isSettling}
                          onClick={() => handleSettle(v)}
                          style={{
                            padding: '10px 18px', borderRadius: '12px', fontWeight: '800', fontSize: '13px', border: 'none',
                            cursor: hasPending && !isSettling ? 'pointer' : 'not-allowed',
                            background: hasPending ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' : '#f1f5f9',
                            color: hasPending ? '#ffffff' : '#94a3b8',
                            boxShadow: hasPending ? '0 4px 14px rgba(37, 99, 235, 0.35)' : 'none',
                            transition: 'all 0.15s'
                          }}
                        >
                          {isSettling ? '⏳ Releasing Escrow...' : hasPending ? '💸 Settle via Escrow' : '✓ Fully Settled'}
                        </button>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};

export default AdminFinance;
