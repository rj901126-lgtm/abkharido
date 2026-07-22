import React, { useState, useEffect } from 'react';
import { DollarSign, ArrowUpRight, ArrowDownRight, CreditCard, Activity, CheckCircle, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { exportToCSV } from '../utils/csvExport';

const AdminFinance = () => {
  const { showToast } = useApp();
  const [stats, setStats] = useState({ totalSales: 0, totalPlatformRevenue: 0, totalSettled: 0 });
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFinanceData = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('abkharido_admin_token') || '';
      
      const statsRes = await fetch('/api/finance/stats', { headers: { 'x-admin-token': token } });
      const vendorsRes = await fetch('/api/finance/vendors-balance', { headers: { 'x-admin-token': token } });
      
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
      if (vendorsRes.ok) {
        setVendors(await vendorsRes.json());
      }
    } catch (err) {
      showToast('Error loading finance data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const handleSettle = async (vendor) => {
    if (vendor.pendingBalance <= 0) {
      showToast('No pending balance to settle', 'info');
      return;
    }

    const transactionId = window.prompt(`Enter UTR/Transaction ID for paying ₹${vendor.pendingBalance} to ${vendor.name}:`);
    if (!transactionId) return;

    try {
      const token = sessionStorage.getItem('abkharido_admin_token') || '';
      const res = await fetch('/api/finance/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify({
          vendorId: vendor._id,
          amount: vendor.pendingBalance,
          transactionId,
          notes: 'Settled from Admin Panel'
        })
      });

      if (res.ok) {
        showToast('Settlement recorded successfully', 'success');
        fetchFinanceData();
      } else {
        showToast('Failed to record settlement', 'error');
      }
    } catch (err) {
      showToast('Network error processing settlement', 'error');
    }
  };

  return (
    <div className="admin-grid" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* ── Finance KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        <div className="admin-panel-card" style={{ display: 'flex', alignItems: 'center', gap: '20px', background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', border: '1px solid #bbf7d0' }}>
          <div style={{ padding: '16px', background: '#22c55e', borderRadius: '16px', color: '#fff', boxShadow: '0 4px 12px rgba(34, 197, 94, 0.2)' }}>
            <Activity size={28} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '13px', color: '#166534', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Sales Vol.</p>
            <h3 style={{ margin: '4px 0 0', fontSize: '28px', color: '#14532d', fontWeight: '800' }}>₹{(stats.totalSales || 0).toLocaleString('en-IN')}</h3>
          </div>
        </div>
        
        <div className="admin-panel-card" style={{ display: 'flex', alignItems: 'center', gap: '20px', background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', border: '1px solid #bfdbfe' }}>
          <div style={{ padding: '16px', background: '#3b82f6', borderRadius: '16px', color: '#fff', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)' }}>
            <DollarSign size={28} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '13px', color: '#1e40af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Platform Revenue (10%)</p>
            <h3 style={{ margin: '4px 0 0', fontSize: '28px', color: '#1e3a8a', fontWeight: '800' }}>₹{(stats.totalPlatformRevenue || 0).toLocaleString('en-IN')}</h3>
          </div>
        </div>

        <div className="admin-panel-card" style={{ display: 'flex', alignItems: 'center', gap: '20px', background: 'linear-gradient(135deg, #fdf4ff 0%, #fae8ff 100%)', border: '1px solid #f5d0fe' }}>
          <div style={{ padding: '16px', background: '#d946ef', borderRadius: '16px', color: '#fff', boxShadow: '0 4px 12px rgba(217, 70, 239, 0.2)' }}>
            <CreditCard size={28} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '13px', color: '#86198f', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Payouts Settled</p>
            <h3 style={{ margin: '4px 0 0', fontSize: '28px', color: '#701a75', fontWeight: '800' }}>₹{(stats.totalSettled || 0).toLocaleString('en-IN')}</h3>
          </div>
        </div>
      </div>

      {/* ── Vendor Balances Grid ── */}
      <div className="admin-panel-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 className="admin-form-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', background: '#f1f5f9', borderRadius: '8px', color: '#475569' }}><ArrowDownRight size={20} /></div>
            Pending Vendor Settlements
          </h3>
          <button 
            className="btn btn-outline btn-sm" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', borderColor: '#10b981', color: '#10b981' }}
            onClick={() => exportToCSV(vendors, 'abkharido_vendor_payouts.csv')}
          >
            Export CSV
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading vendor balances...</div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Vendor Details</th>
                  <th>Total Earned (90%)</th>
                  <th>Total Settled</th>
                  <th>Pending Balance</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vendors.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>No approved vendors found.</td>
                  </tr>
                ) : (
                  vendors.map(v => (
                    <tr key={v._id}>
                      <td>
                        <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{v.name}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{v.email}</div>
                      </td>
                      <td style={{ fontWeight: '600', color: '#334155' }}>₹{v.totalEarned.toLocaleString('en-IN')}</td>
                      <td style={{ color: '#10b981', fontWeight: '500' }}>₹{v.totalSettled.toLocaleString('en-IN')}</td>
                      <td>
                        <span style={{ 
                          padding: '4px 10px', 
                          borderRadius: '20px', 
                          fontSize: '13px', 
                          fontWeight: 'bold',
                          background: v.pendingBalance > 0 ? '#fee2e2' : '#f1f5f9',
                          color: v.pendingBalance > 0 ? '#ef4444' : '#64748b'
                        }}>
                          ₹{v.pendingBalance.toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="btn btn-sm btn-primary"
                          disabled={v.pendingBalance <= 0}
                          onClick={() => handleSettle(v)}
                          style={{ opacity: v.pendingBalance <= 0 ? 0.5 : 1, fontSize: '12px', height: '32px' }}
                        >
                          {v.pendingBalance > 0 ? 'Settle Balance' : 'Settled'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminFinance;
