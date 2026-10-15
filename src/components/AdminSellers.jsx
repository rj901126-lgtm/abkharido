"use client";

import React, { useState, useEffect } from 'react';
import { 
  Store, 
  Search, 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  CheckCircle, 
  XCircle, 
  DollarSign, 
  Package, 
  MapPin, 
  Phone, 
  Mail, 
  FileText, 
  Filter, 
  Download, 
  ExternalLink, 
  AlertCircle,
  RefreshCw,
  Building2,
  Lock,
  Unlock,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { exportToCSV } from '../utils/csvExport';

export default function AdminSellers({ onNavigate }) {
  const { showToast, products } = useApp();
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'Approved' | 'Pending' | 'Suspended'
  const [taxFilter, setTaxFilter] = useState('ALL'); // 'ALL' | 'gst' | 'non_gst'
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [catalogModalSeller, setCatalogModalSeller] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchSellers = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('abkharido_admin_token') || '';
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/sellers`, {
        headers: { 'x-admin-token': token }
      });
      if (res.ok) {
        const data = await res.json();
        setSellers(Array.isArray(data) ? data : []);
      } else {
        showToast('Failed to load merchant directory.', 'error');
      }
    } catch (err) {
      console.error('Fetch sellers error:', err);
      showToast('Error connecting to vendor backend.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, []);

  const handleUpdateSellerStatus = async (sellerId, newStatus) => {
    setIsUpdatingStatus(true);
    try {
      const token = sessionStorage.getItem('abkharido_admin_token') || '';
      const res = await fetch(`/api/users/${sellerId}/seller-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token
        },
        body: JSON.stringify({ sellerStatus: newStatus })
      });

      if (res.ok) {
        showToast(`Merchant status successfully updated to "${newStatus}"!`, 'success');
        setSellers(prev => prev.map(s => {
          if (s._id === sellerId || s.id === sellerId) {
            return { ...s, sellerStatus: newStatus };
          }
          return s;
        }));
        if (selectedSeller && (selectedSeller._id === sellerId || selectedSeller.id === sellerId)) {
          setSelectedSeller(prev => ({ ...prev, sellerStatus: newStatus }));
        }
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || 'Failed to update merchant status.', 'error');
      }
    } catch {
      showToast('Network error while updating seller status.', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleExportCSV = () => {
    if (sellers.length === 0) {
      showToast('No sellers available to export.', 'info');
      return;
    }
    const exportData = filteredSellers.map(s => ({
      "Shop Name": s.shopName || s.fullName || 'Verified Seller',
      "Owner Name": s.fullName || s.username || 'Merchant',
      "Phone": s.phone || 'N/A',
      "Email": s.email || 'N/A',
      "GSTIN": s.sellerGstin || 'Not Registered (Composition)',
      "Tax Scheme": s.sellerType === 'gst' ? 'Regular GST' : 'Non-GST / Exempt',
      "State": s.sellerState || 'Maharashtra',
      "KYC Status": s.sellerStatus || 'Approved',
      "Escrow Wallet Cash": s.walletCash || 0,
      "Commission Rate": '10%',
      "Registered Date": s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-IN') : 'N/A'
    }));
    exportToCSV(exportData, 'abkharido_registered_merchants.csv');
  };

  // Filter logic
  const filteredSellers = sellers.filter(s => {
    const statusMatch = statusFilter === 'ALL' || (s.sellerStatus || 'Approved').toLowerCase() === statusFilter.toLowerCase();
    const isGst = Boolean(s.sellerGstin && s.sellerGstin.length >= 15);
    const taxMatch = taxFilter === 'ALL' || (taxFilter === 'gst' ? isGst : !isGst);
    
    const query = searchQuery.trim().toLowerCase();
    const searchMatch = !query || 
      (s.shopName && s.shopName.toLowerCase().includes(query)) ||
      (s.fullName && s.fullName.toLowerCase().includes(query)) ||
      (s.sellerGstin && s.sellerGstin.toLowerCase().includes(query)) ||
      (s.phone && s.phone.includes(query)) ||
      (s.email && s.email.toLowerCase().includes(query));

    return statusMatch && taxMatch && searchMatch;
  });

  // KPI Calculations
  const totalApproved = sellers.filter(s => (s.sellerStatus || 'Approved') === 'Approved').length;
  const totalPending = sellers.filter(s => s.sellerStatus === 'Pending').length;
  const totalGst = sellers.filter(s => Boolean(s.sellerGstin && s.sellerGstin.length >= 15)).length;
  const totalNonGst = sellers.length - totalGst;
  const totalEscrowHeld = sellers.reduce((acc, s) => acc + Number(s.walletCash || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.2s' }}>
      
      {/* Top Header Banner */}
      <div style={{ 
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #311042 100%)', 
        padding: '30px', 
        borderRadius: '24px', 
        color: '#ffffff', 
        boxShadow: '0 10px 30px rgba(0,0,0,0.15)', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '20px' 
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: '900', background: '#9333ea', color: '#ffffff', padding: '4px 12px', borderRadius: '8px', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Store size={13} /> 3P MARKETPLACE OPERATIONS
            </span>
            <span style={{ fontSize: '11px', fontWeight: '800', background: 'rgba(255,255,255,0.15)', color: '#ffffff', padding: '4px 10px', borderRadius: '8px' }}>
              Amazon/Flipkart Hybrid Model
            </span>
          </div>
          <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '900', fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.5px' }}>
            Merchant Command Center &amp; Vendor Hub
          </h2>
          <p style={{ margin: 0, color: '#c7d2fe', fontSize: '14px', maxWidth: '640px', lineHeight: '1.5' }}>
            Oversee third-party registered vendors, verify GST/Non-GST tax compliance, regulate merchant KYC approvals, inspect merchant catalogs, and release RBI Escrow disbursements.
          </p>
        </div>

        {/* Live Vendor KPIs */}
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', padding: '14px 20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.15)', textAlign: 'center', minWidth: '120px' }}>
            <span style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: '700', textTransform: 'uppercase' }}>Active Merchants</span>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#38bdf8', marginTop: '2px' }}>{totalApproved}</div>
            <span style={{ fontSize: '11px', color: '#86efac' }}>{totalPending > 0 ? `+${totalPending} Pending KYC` : 'All KYC Cleared'}</span>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', padding: '14px 20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.15)', textAlign: 'center', minWidth: '120px' }}>
            <span style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: '700', textTransform: 'uppercase' }}>Tax Classification</span>
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#a855f7', marginTop: '4px' }}>
              {totalGst} GST <span style={{ fontSize: '14px', color: '#e2e8f0' }}>/ {totalNonGst} Non-GST</span>
            </div>
            <span style={{ fontSize: '11px', color: '#c7d2fe' }}>Composition verified</span>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', padding: '14px 20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.15)', textAlign: 'center', minWidth: '140px' }}>
            <span style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: '700', textTransform: 'uppercase' }}>Escrow Payout Balance</span>
            <div style={{ fontSize: '22px', fontWeight: '900', color: '#4ade80', marginTop: '2px' }}>
              ₹{totalEscrowHeld.toLocaleString('en-IN')}
            </div>
            <span style={{ fontSize: '11px', color: '#86efac' }}>Held in RBI Escrow</span>
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Status Filters & CSV Export */}
      <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          {/* Search Box */}
          <div style={{ flex: '1 1 320px', position: 'relative' }}>
            <Search size={17} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              type="text"
              placeholder="Search merchants by Shop Name, Owner, GSTIN, Phone, Email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '12px 14px 12px 42px', border: '2px solid #cbd5e1', borderRadius: '12px', fontSize: '13.5px', background: '#f8fafc', fontWeight: '600', color: '#0f172a', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={fetchSellers}
              style={{ padding: '11px 18px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#334155', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={15} /> Refresh
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              style={{ padding: '11px 20px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#ffffff', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)' }}
            >
              <Download size={16} /> Export Vendors (CSV)
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Filter size={13} /> KYC Status:
            </span>
            {[
              { id: 'ALL', label: `All (${sellers.length})` },
              { id: 'Approved', label: `✅ Approved (${totalApproved})`, color: '#059669' },
              { id: 'Pending', label: `⏳ Pending KYC (${totalPending})`, color: '#d97706' },
              { id: 'Suspended', label: `🚫 Suspended`, color: '#dc2626' }
            ].map(pill => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setStatusFilter(pill.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '100px',
                  border: statusFilter === pill.id ? '2px solid transparent' : '1px solid #cbd5e1',
                  background: statusFilter === pill.id ? (pill.color || '#0f172a') : '#ffffff',
                  color: statusFilter === pill.id ? '#ffffff' : '#475569',
                  fontWeight: '800',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                {pill.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#475569' }}>Tax Scheme:</span>
            {[
              { id: 'ALL', label: 'All Schemes' },
              { id: 'gst', label: '🏛️ Regular GST' },
              { id: 'non_gst', label: '🏷️ Non-GST Composition' }
            ].map(pill => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setTaxFilter(pill.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '100px',
                  border: taxFilter === pill.id ? '2px solid #6366f1' : '1px solid #cbd5e1',
                  background: taxFilter === pill.id ? '#eff6ff' : '#ffffff',
                  color: taxFilter === pill.id ? '#1e40af' : '#475569',
                  fontWeight: '800',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Sellers Data Table */}
      <div style={{ background: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 8px 35px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
            <RefreshCw size={36} className="animate-spin" style={{ margin: '0 auto 12px' }} />
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>Loading Verified Merchants...</h4>
          </div>
        ) : filteredSellers.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
            <Store size={48} style={{ color: '#cbd5e1', margin: '0 auto 16px' }} />
            <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>No Matching Merchants Found</h4>
            <p style={{ margin: 0, fontSize: '13px' }}>Adjust your search query or KYC filters to view vendors.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '950px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '16px 20px', fontSize: '11.5px', fontWeight: '900', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Merchant / Shop</th>
                  <th style={{ padding: '16px 20px', fontSize: '11.5px', fontWeight: '900', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Owner &amp; Region</th>
                  <th style={{ padding: '16px 20px', fontSize: '11.5px', fontWeight: '900', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tax Scheme / GSTIN</th>
                  <th style={{ padding: '16px 20px', fontSize: '11.5px', fontWeight: '900', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Catalog &amp; Commission</th>
                  <th style={{ padding: '16px 20px', fontSize: '11.5px', fontWeight: '900', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Escrow Balance</th>
                  <th style={{ padding: '16px 20px', fontSize: '11.5px', fontWeight: '900', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>KYC Status</th>
                  <th style={{ padding: '16px 20px', fontSize: '11.5px', fontWeight: '900', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSellers.map((seller) => {
                  const hasGst = Boolean(seller.sellerGstin && seller.sellerGstin.length >= 15);
                  const isApproved = (seller.sellerStatus || 'Approved') === 'Approved';
                  const isPending = seller.sellerStatus === 'Pending';
                  const isSuspended = seller.sellerStatus === 'Suspended';

                  // Count products listed by this seller
                  const sellerProductsCount = products.filter(p => 
                    p.vendorId === seller._id || 
                    p.vendorId === seller.id || 
                    p.sellerId === String(seller._id || seller.id) ||
                    (p.sellerShopName && p.sellerShopName === seller.shopName)
                  ).length;

                  return (
                    <tr key={seller._id || seller.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}>
                      {/* Shop Name */}
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e40af', fontWeight: '900', fontSize: '16px', border: '1px solid #bfdbfe' }}>
                            {seller.shopName ? seller.shopName.charAt(0).toUpperCase() : 'S'}
                          </div>
                          <div>
                            <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '14.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {seller.shopName || seller.fullName || 'Official Merchant Store'}
                              {isApproved && <CheckCircle2 size={14} color="#059669" />}
                            </div>
                            <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                              Vendor ID: <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: '4px' }}>{(seller._id || seller.id).slice(-8).toUpperCase()}</code>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Owner & Region */}
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '13px' }}>
                          {seller.fullName || seller.username || 'Merchant Owner'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Phone size={11} /> {seller.phone || 'No phone'}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#0284c7', marginTop: '2px', fontWeight: '600' }}>
                          📍 {seller.sellerState || seller.city || 'Maharashtra'}
                        </div>
                      </td>

                      {/* Tax Scheme / GSTIN */}
                      <td style={{ padding: '16px 20px' }}>
                        {hasGst ? (
                          <div>
                            <span style={{ fontSize: '11px', fontWeight: '800', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '3px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              🏛️ Regular GST (Inter-State Capable)
                            </span>
                            <div style={{ fontSize: '11.5px', color: '#334155', fontWeight: '700', marginTop: '4px', fontFamily: 'monospace' }}>
                              {seller.sellerGstin}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span style={{ fontSize: '11px', fontWeight: '800', background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', padding: '3px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              🏷️ Non-GST / Composition (Intra-State)
                            </span>
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                              Bill of Supply • Local Sales
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Catalog & Commission */}
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '13.5px' }}>
                          {sellerProductsCount} Listed Product{sellerProductsCount === 1 ? '' : 's'}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#7c3aed', fontWeight: '700', marginTop: '3px' }}>
                          10% Platform Fee (Escrow)
                        </div>
                      </td>

                      {/* Escrow Balance */}
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontSize: '15px', fontWeight: '900', color: '#059669', fontFamily: 'Outfit, sans-serif' }}>
                          ₹{(seller.walletCash || 0).toLocaleString('en-IN')}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                          Ready for disbursement
                        </div>
                      </td>

                      {/* KYC Status Badge */}
                      <td style={{ padding: '16px 20px' }}>
                        {isApproved ? (
                          <span style={{ fontSize: '11.5px', fontWeight: '800', background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', padding: '4px 10px', borderRadius: '100px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle size={12} /> Approved
                          </span>
                        ) : isPending ? (
                          <span style={{ fontSize: '11.5px', fontWeight: '800', background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', padding: '4px 10px', borderRadius: '100px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} /> Pending KYC
                          </span>
                        ) : (
                          <span style={{ fontSize: '11.5px', fontWeight: '800', background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', padding: '4px 10px', borderRadius: '100px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <XCircle size={12} /> Suspended
                          </span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          
                          {/* View Catalog */}
                          <button
                            type="button"
                            onClick={() => setCatalogModalSeller(seller)}
                            style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#334155', fontWeight: '700', fontSize: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            title="Inspect products listed by this merchant"
                          >
                            <Package size={13} /> Products
                          </button>

                          {/* Approve / Suspend Toggle */}
                          {isApproved ? (
                            <button
                              type="button"
                              onClick={() => handleUpdateSellerStatus(seller._id || seller.id, 'Suspended')}
                              disabled={isUpdatingStatus}
                              style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #fca5a5', background: '#fee2e2', color: '#dc2626', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
                              title="Suspend merchant store"
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleUpdateSellerStatus(seller._id || seller.id, 'Approved')}
                              disabled={isUpdatingStatus}
                              style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#ffffff', fontWeight: '800', fontSize: '12px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)' }}
                              title="Approve merchant KYC"
                            >
                              Approve KYC
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Merchant Products Inspection Modal */}
      {catalogModalSeller && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', background: 'rgba(15, 23, 42, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }}>
          <div style={{ width: '800px', maxWidth: '92vw', maxHeight: '82vh', background: '#ffffff', borderRadius: '24px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '10px', background: '#eff6ff', borderRadius: '12px', color: '#2563eb' }}><Store size={22} /></div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>{catalogModalSeller.shopName || 'Merchant Store'}</h3>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Owner: {catalogModalSeller.fullName} • Phone: {catalogModalSeller.phone || 'N/A'}</div>
                </div>
              </div>
              <button 
                onClick={() => setCatalogModalSeller(null)} 
                style={{ background: '#f1f5f9', border: 'none', color: '#64748b', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ✕
              </button>
            </div>
            
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1, background: '#f8fafc' }}>
              {(() => {
                const vendorProducts = products.filter(p => 
                  p.vendorId === catalogModalSeller._id || 
                  p.vendorId === catalogModalSeller.id || 
                  p.sellerId === String(catalogModalSeller._id || catalogModalSeller.id) ||
                  (p.sellerShopName && p.sellerShopName === catalogModalSeller.shopName)
                );

                if (vendorProducts.length === 0) {
                  return (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
                      <Package size={48} style={{ color: '#cbd5e1', margin: '0 auto 16px' }} />
                      <h4 style={{ margin: '0 0 6px 0', color: '#334155', fontSize: '16px', fontWeight: '800' }}>No Products Uploaded Yet</h4>
                      <p style={{ margin: 0, fontSize: '13px' }}>This merchant has not listed any catalog items yet.</p>
                    </div>
                  );
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {vendorProducts.map(prod => (
                      <div key={prod.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                        <img 
                          src={prod.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'} 
                          alt={prod.name} 
                          style={{ width: '60px', height: '60px', objectFit: 'contain', borderRadius: '10px', border: '1px solid #f1f5f9', background: '#fafafa' }} 
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '14.5px' }}>{prod.name}</div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                            Category: {prod.category} • SKU: {prod.sku || prod.id}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a' }}>₹{(prod.price || 0).toLocaleString('en-IN')}</div>
                          <div style={{ fontSize: '11.5px', color: (prod.stock > 0 || prod.inStock) ? '#16a34a' : '#dc2626', fontWeight: '700', marginTop: '2px' }}>
                            {(prod.stock > 0 || prod.inStock) ? `In Stock (${prod.stock || 50})` : 'Out of Stock'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
