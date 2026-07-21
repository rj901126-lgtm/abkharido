import React, { useState, useEffect } from 'react';
import { Tag, Plus, Trash2, CheckCircle, Percent } from 'lucide-react';

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    minCartValue: '',
    maxDiscount: '',
    expiryDate: '',
    usageLimit: '100'
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      // Fetching requires Admin token
      const token = sessionStorage.getItem('abkharido_admin_token');
      // For this step in transition, we simulate since auth is midway
      // We will mock the fetch if it fails 401
      const res = await fetch('/api/coupons', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setCoupons(data);
      } else {
        // Mock fallback for UI preview during transition
        setCoupons([
          { _id: '1', code: 'WELCOME50', discountType: 'FLAT', discountValue: 50, minCartValue: 500, expiryDate: '2026-12-31', usedCount: 12, usageLimit: 100, isActive: true },
          { _id: '2', code: 'DIWALI20', discountType: 'PERCENTAGE', discountValue: 20, maxDiscount: 200, minCartValue: 1000, expiryDate: '2026-10-31', usedCount: 85, usageLimit: 100, isActive: true }
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const token = sessionStorage.getItem('abkharido_admin_token');
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newCoupon)
      });
      if (res.ok) {
        alert('Coupon created successfully!');
        setNewCoupon({
          code: '', discountType: 'PERCENTAGE', discountValue: '', minCartValue: '', maxDiscount: '', expiryDate: '', usageLimit: '100'
        });
        fetchCoupons();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create coupon');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    try {
      const token = sessionStorage.getItem('abkharido_admin_token');
      await fetch(`/api/v2/coupons/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchCoupons();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', flexDirection: 'column', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #e0e7ff', borderTop: '4px solid #4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <div style={{ color: '#64748b', fontWeight: '500' }}>Loading Coupons...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
      
      {/* Create Coupon Form */}
      <div className="admin-panel-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 className="admin-form-title"><Plus size={18} color="var(--primary-color)"/> Create New Coupon</h3>
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label className="admin-input-label">Coupon Code</label>
              <input type="text" className="admin-input" required placeholder="e.g. SUMMER50" value={newCoupon.code} onChange={(e) => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})} />
            </div>
            <div style={{ flex: 1 }}>
              <label className="admin-input-label">Discount Type</label>
              <select className="admin-input" value={newCoupon.discountType} onChange={(e) => setNewCoupon({...newCoupon, discountType: e.target.value})}>
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FLAT">Flat Amount (₹)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label className="admin-input-label">Discount Value</label>
              <input type="number" className="admin-input" required placeholder={newCoupon.discountType === 'FLAT' ? '₹ Amount' : '% Amount'} value={newCoupon.discountValue} onChange={(e) => setNewCoupon({...newCoupon, discountValue: e.target.value})} />
            </div>
            {newCoupon.discountType === 'PERCENTAGE' && (
              <div style={{ flex: 1 }}>
                <label className="admin-input-label">Max Discount (₹)</label>
                <input type="number" className="admin-input" placeholder="e.g. 500" value={newCoupon.maxDiscount} onChange={(e) => setNewCoupon({...newCoupon, maxDiscount: e.target.value})} />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label className="admin-input-label">Min Cart Value (₹)</label>
              <input type="number" className="admin-input" placeholder="e.g. 1000" value={newCoupon.minCartValue} onChange={(e) => setNewCoupon({...newCoupon, minCartValue: e.target.value})} />
            </div>
            <div style={{ flex: 1 }}>
              <label className="admin-input-label">Usage Limit</label>
              <input type="number" className="admin-input" placeholder="e.g. 100" value={newCoupon.usageLimit} onChange={(e) => setNewCoupon({...newCoupon, usageLimit: e.target.value})} />
            </div>
          </div>

          <div>
            <label className="admin-input-label">Expiry Date</label>
            <input type="date" className="admin-input" required value={newCoupon.expiryDate} onChange={(e) => setNewCoupon({...newCoupon, expiryDate: e.target.value})} />
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: '16px', padding: '12px', fontSize: '15px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', gap: '8px' }}>
            <Plus size={18} /> Generate Coupon
          </button>
        </form>
      </div>

      {/* Coupon List */}
      <div className="admin-panel-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 className="admin-form-title"><Percent size={18} color="var(--primary-color)"/> Active Coupons ({coupons.length})</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {coupons.map((coupon) => (
            <div key={coupon._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', border: '2px dashed #cbd5e1', borderRadius: '16px', background: 'linear-gradient(to right, #f8fafc, #ffffff)', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
              {/* Ticket Notch Left */}
              <div style={{ position: 'absolute', left: '-10px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', background: '#fff', borderRadius: '50%', borderRight: '2px dashed #cbd5e1' }}></div>
              
              <div style={{ marginLeft: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <h4 style={{ margin: 0, fontSize: '20px', color: '#0f172a', fontWeight: '800', letterSpacing: '1px' }}>{coupon.code}</h4>
                  {coupon.isActive && <span style={{ background: '#dcfce7', color: '#16a34a', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '800', border: '1px solid #bbf7d0' }}>ACTIVE</span>}
                </div>
                <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#475569', fontWeight: '500' }}>
                  {coupon.discountType === 'FLAT' ? `Flat ₹${coupon.discountValue} Off` : `${coupon.discountValue}% Off (Up to ₹${coupon.maxDiscount})`} 
                  <span style={{ color: '#cbd5e1', margin: '0 8px' }}>|</span> Min ₹{coupon.minCartValue}
                </p>
                <div style={{ display: 'flex', gap: '16px', margin: '12px 0 0', fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={14} /> Used: {coupon.usedCount} / {coupon.usageLimit}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Tag size={14} /> Expires: {new Date(coupon.expiryDate).toLocaleDateString()}</span>
                </div>
              </div>
              
              <button className="btn btn-outline" style={{ color: '#ef4444', borderColor: 'transparent', background: '#fee2e2', borderRadius: '50%', padding: '12px', marginRight: '10px', transition: 'all 0.2s' }} onMouseEnter={e => {e.currentTarget.style.background='#fecaca'; e.currentTarget.style.transform='scale(1.05)'}} onMouseLeave={e => {e.currentTarget.style.background='#fee2e2'; e.currentTarget.style.transform='none'}} onClick={() => handleDelete(coupon._id)} title="Delete Coupon">
                <Trash2 size={18} />
              </button>
              
              {/* Ticket Notch Right */}
              <div style={{ position: 'absolute', right: '-10px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', background: '#fff', borderRadius: '50%', borderLeft: '2px dashed #cbd5e1' }}></div>
            </div>
          ))}
          {coupons.length === 0 && <p style={{ textAlign: 'center', color: '#999' }}>No active coupons.</p>}
        </div>
      </div>

    </div>
  );
};

export default AdminCoupons;
