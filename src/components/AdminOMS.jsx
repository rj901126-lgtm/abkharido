import React, { useState, useEffect, useRef } from 'react';
// eslint-disable-next-line
import { FileText, Truck, Printer, Search, CheckSquare, Eye, X, Settings, XCircle, Package, Phone, MessageCircle, MapPin, DollarSign, ExternalLink, RefreshCw, CheckCircle, Shield, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import WorldClassInvoice from './WorldClassInvoice';
import { exportToCSV } from '../utils/csvExport';

const AdminOMS = ({ statusFilter }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('');
  const [activeTab, setActiveTab] = useState(() => {
    if (statusFilter) {
      const sf = statusFilter.toUpperCase();
      if (sf === 'PENDING' || sf === 'PROCESSING') return 'PROCESSING';
      if (sf === 'SHIPPED') return 'SHIPPED';
      if (sf === 'DELIVERED') return 'DELIVERED';
      if (sf === 'CANCELLED' || sf === 'RETURNS' || sf === 'CANCELLED_RETURNS') return 'CANCELLED';
    }
    return 'LIVE'; // Hide cancelled orders by default
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState('ALL'); // 'ALL' | '1P' | '3P'
  
  useEffect(() => {
    if (statusFilter) {
      const sf = statusFilter.toUpperCase();
      if (sf === 'PENDING' || sf === 'PROCESSING') setActiveTab('PROCESSING');
      else if (sf === 'SHIPPED') setActiveTab('SHIPPED');
      else if (sf === 'DELIVERED') setActiveTab('DELIVERED');
      else if (sf === 'CANCELLED' || sf === 'RETURNS' || sf === 'CANCELLED_RETURNS') setActiveTab('CANCELLED');
      else if (sf === 'ALL') setActiveTab('ALL');
      else if (sf === 'LIVE') setActiveTab('LIVE');
    }
  }, [statusFilter]);
  
  // Modals state
  const [viewingOrder, setViewingOrder] = useState(null);
  const [dispatchOrder, setDispatchOrder] = useState(null);
  const [courierPartner, setCourierPartner] = useState('Delhivery Express');
  const [awbInput, setAwbInput] = useState('');
  const [managingReturnOrder, setManagingReturnOrder] = useState(null);
  const [returnActionState, setReturnActionState] = useState({
    action: 'Approve',
    courierPartner: 'Delhivery Reverse Express',
    returnAwb: '',
    pickupDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    qcRemarks: '',
    adminNotes: '',
    isSubmitting: false
  });

  const { showToast } = useApp();

  const invoiceRefs = useRef({});
  const [downloadingOrderId, setDownloadingOrderId] = useState(null);
  const [emailingOrderId, setEmailingOrderId] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('abkharido_admin_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/orders?username=admin`, {
        headers: { 'x-admin-token': token }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setOrders(data);
          return;
        }
      }
      
      // No dummy data; use real data only
      setOrders([]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (e, filteredList) => {
    if (e.target.checked) {
      setSelectedOrders(filteredList.map(o => o.id || o._id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleSelectOne = (id) => {
    if (selectedOrders.includes(id)) {
      setSelectedOrders(selectedOrders.filter(orderId => orderId !== id));
    } else {
      setSelectedOrders([...selectedOrders, id]);
    }
  };

  const handleReturnAction = async (orderId, actionPayload) => {
    try {
      setReturnActionState(prev => ({ ...prev, isSubmitting: true }));
      const token = sessionStorage.getItem('abkharido_admin_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/orders/${orderId}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify(actionPayload)
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast(data.message || 'Return status updated successfully', 'success');
        setManagingReturnOrder(null);
        fetchOrders();
      } else {
        showToast(data.error || 'Failed to update return', 'error');
      }
    } catch (err) {
      showToast('Error updating return request', 'error');
    } finally {
      setReturnActionState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedOrders.length === 0) {
      showToast('Select at least one order', 'error');
      return;
    }
    if (!bulkStatus) {
      showToast('Select a status to apply', 'error');
      return;
    }

    try {
      const token = sessionStorage.getItem('abkharido_admin_token');
      await Promise.all(selectedOrders.map(async (orderId) => {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/orders/${orderId}/status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-token': token
          },
          body: JSON.stringify({ status: bulkStatus })
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Failed to update order ${orderId}`);
        }
      }));
      showToast(`Updated ${selectedOrders.length} orders to ${bulkStatus}`, 'success');
      fetchOrders();
      setSelectedOrders([]);
    } catch (err) {
      console.error(err);
      showToast(`Failed to update order status: ${err.message || 'Server error'}`, 'error');
    }
  };

  const handleBulkExport = async () => {
    if (selectedOrders.length === 0) {
      showToast('Select at least one order to export', 'error');
      return;
    }

    try {
      const token = sessionStorage.getItem('abkharido_admin_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/orders/bulk-export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token
        },
        body: JSON.stringify({ orderIds: selectedOrders })
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `shipping_manifest_${new Date().getTime()}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        showToast(`Exported ${selectedOrders.length} orders successfully`, 'success');
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to export orders', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error during export', 'error');
    }
  };

  const handleCancelOrder = async (orderId) => {
    try {
      const token = sessionStorage.getItem('abkharido_admin_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/orders/${orderId}/cancel`, { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'x-admin-token': token } : {})
        }
      });
      if (res.ok) {
        showToast(`Order ${orderId} cancelled successfully`, 'success');
        fetchOrders();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to cancel order', 'error');
      }
    // eslint-disable-next-line
    } catch (err) {
      showToast('Network error while cancelling order', 'error');
    }
  };

  const dispatchViaNimbusPost = async (orderId) => {
    try {
      showToast(`Booking shipment on NimbusPost 27+ Logistics...`, 'info');
      const token = sessionStorage.getItem('abkharido_admin_token') || '';
      
      const res = await fetch(`/api/shipping/nimbuspost/create-shipment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token
        },
        body: JSON.stringify({ orderId })
      });
      
      if (res.ok) {
        const data = await res.json();
        showToast(`🚀 Dispatched via ${data.logistics?.courier}! AWB: ${data.logistics?.awb} | PIN: ${data.logistics?.deliveryPin}`, 'success');
        fetchOrders();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Failed to dispatch via NimbusPost', 'error');
      }
    } catch (err) {
      showToast('Network error while dispatching via NimbusPost', 'error');
    }
  };

  const generateAWB = async (orderId) => {
    try {
      showToast(`Generating Shiprocket AWB for ${orderId}...`, 'info');
      const token = sessionStorage.getItem('abkharido_admin_token') || '';
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/orders/${orderId}/ship`, {
        method: 'POST',
        headers: {
          'x-admin-token': token
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        showToast(`AWB generated successfully! Courier: ${data.courier}`, 'success');
        fetchOrders();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to generate AWB', 'error');
      }
    } catch (err) {
      showToast('Network error while generating AWB', 'error');
    }
  };

  const handleCustomDispatchSubmit = async (e) => {
    e.preventDefault();
    if (!dispatchOrder) return;
    const orderId = dispatchOrder.id || dispatchOrder._id;
    const finalAwb = awbInput.trim() || `ABK-${Math.floor(10000000 + Math.random() * 90000000)}`;

    try {
      const token = sessionStorage.getItem('abkharido_admin_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/orders/${orderId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token
        },
        body: JSON.stringify({
          status: 'Shipped',
          courierPartner: courierPartner,
          awbNumber: finalAwb,
          trackingUrl: `https://rack.abkharido.com/${finalAwb}`
        })
      });

      if (res.ok) {
        showToast(`Order dispatched via ${courierPartner} with AWB: ${finalAwb}`, 'success');
        setDispatchOrder(null);
        setAwbInput('');
        fetchOrders();
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.error || 'Failed to dispatch order', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error while saving shipment details', 'error');
    }
  };

  const handleVerifyCOD = async (order) => {
    const orderId = order.id || order._id;

    try {
      const token = sessionStorage.getItem('abkharido_admin_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/orders/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify({ isPaid: true, paymentStatus: 'SUCCESS', status: 'Delivered' })
      });
      if (res.ok) {
        showToast('COD Payment marked as VERIFIED & PAID!', 'success');
        if (viewingOrder && (viewingOrder.id === orderId || viewingOrder._id === orderId)) {
          setViewingOrder({ ...viewingOrder, isPaid: true, paymentStatus: 'SUCCESS', status: 'Delivered' });
        }
        fetchOrders();
      } else {
        showToast('Failed to update COD status', 'error');
      }
    } catch (err) {
      showToast('Error verifying COD payment', 'error');
    }
  };

  const handleDownloadPremiumInvoice = (order) => {
    const orderId = order.id || order._id;
    const ref = invoiceRefs.current[orderId];
    if (ref && !downloadingOrderId) {
      setDownloadingOrderId(orderId);
      showToast(`Generating premium invoice for ${orderId}...`, 'info');
      ref.generatePDF().finally(() => setDownloadingOrderId(null));
    }
  };

  const handleSendInvoiceEmail = async (order) => {
    // BUGFIX: order.user can be null for guest orders
    if (!order.user || !order.user.isEmailVerified) {
      showToast('Customer email is not verified.', 'error');
      return;
    }
    const orderId = order.id || order._id;
    setEmailingOrderId(orderId);
    showToast(`Sending invoice email for ${orderId}...`, 'info');
    try {
      const token = sessionStorage.getItem('abkharido_admin_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/orders/${orderId}/email-invoice`, {
        method: 'POST',
        headers: { 'x-admin-token': token }
      });
      if (res.ok) {
        showToast('Invoice email sent successfully!', 'success');
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to send email', 'error');
      }
    // eslint-disable-next-line
    } catch (err) {
      showToast('Network error while sending email', 'error');
    } finally {
      setEmailingOrderId(null);
    }
  };

  // Status & Tab Filtering logic
  const liveCount = orders.filter(o => !['CANCELLED', 'Cancelled', 'cancelled', 'DELIVERED', 'Delivered', 'delivered', 'RETURNED', 'Returned', 'returned', 'REFUNDED', 'Refunded', 'FAILED', 'Failed'].includes(o.status)).length;
  const processingCount = orders.filter(o => !o.status || o.status.toLowerCase() === 'processing' || o.status.toLowerCase() === 'pending').length;
  const shippedCount = orders.filter(o => o.status && o.status.toLowerCase() === 'shipped').length;
  const deliveredCount = orders.filter(o => o.status && o.status.toLowerCase() === 'delivered').length;
  const returnsCount = orders.filter(o => o.returnStatus && o.returnStatus !== 'None').length;
  const cancelledCount = orders.filter(o => ['CANCELLED', 'Cancelled', 'cancelled', 'RETURNED', 'Returned', 'returned', 'REFUNDED', 'Refunded', 'FAILED', 'Failed'].includes(o.status)).length;

  // Enterprise Hybrid Channel Attribution (1P Direct vs 3P Marketplace)
  const getOrderChannel = (o) => {
    const items = o.orderItems || o.items || [];
    const has3P = items.some(item => Boolean(item.vendorId || item.sellerId) && item.sellerShopName !== 'AbKharido Direct');
    return has3P ? '3P' : '1P';
  };

  const count1POrders = orders.filter(o => getOrderChannel(o) === '1P').length;
  const count3POrders = orders.filter(o => getOrderChannel(o) === '3P').length;

  const filteredOrders = orders.filter(o => {
    // 1. Enterprise Channel Filter
    if (channelFilter === '1P' && getOrderChannel(o) !== '1P') return false;
    if (channelFilter === '3P' && getOrderChannel(o) !== '3P') return false;

    // 2. Tab Filter
    if (activeTab === 'LIVE') {
      if (['CANCELLED', 'Cancelled', 'cancelled', 'DELIVERED', 'Delivered', 'delivered', 'RETURNED', 'Returned', 'returned', 'REFUNDED', 'Refunded', 'FAILED', 'Failed'].includes(o.status)) return false;
    } else if (activeTab === 'PROCESSING') {
      if (!(!o.status || o.status.toLowerCase() === 'processing' || o.status.toLowerCase() === 'pending')) return false;
    } else if (activeTab === 'SHIPPED') {
      if (!o.status || o.status.toLowerCase() !== 'shipped') return false;
    } else if (activeTab === 'DELIVERED') {
      if (!o.status || o.status.toLowerCase() !== 'delivered') return false;
    } else if (activeTab === 'RETURNS') {
      if (!o.returnStatus || o.returnStatus === 'None') return false;
    } else if (activeTab === 'CANCELLED') {
      const isCancelled = ['CANCELLED', 'Cancelled', 'cancelled', 'RETURNED', 'Returned', 'returned', 'REFUNDED', 'Refunded', 'FAILED', 'Failed'].includes(o.status);
      if (!isCancelled) return false;
    }

    // 3. Search Query Filter
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const oId = String(o.id || o._id).toLowerCase();
    const cName = (o.user?.fullName || o.user?.username || o.shippingAddress?.fullName || '').toLowerCase();
    const phone = (o.shippingAddress?.phone || '').toLowerCase();
    const awb = (o.awbNumber || '').toLowerCase();
    return oId.includes(q) || cName.includes(q) || phone.includes(q) || awb.includes(q);
  });

  if (loading && orders.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', flexDirection: 'column', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #e0e7ff', borderTop: '4px solid #4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <div style={{ color: '#64748b', fontWeight: '600' }}>Loading Enterprise Order Management 2.0...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* ── 1. Sleek Enterprise Fulfillment Hero Header ── */}
      <div style={{ 
        padding: '24px 28px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        background: 'linear-gradient(135deg, #090d16 0%, #111827 50%, #1e1b4b 100%)', 
        color: 'white', 
        borderRadius: '20px', 
        boxShadow: '0 12px 30px -10px rgba(15, 23, 42, 0.4)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ padding: '3px 9px', background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', borderRadius: '100px', fontSize: '11px', fontWeight: '800', letterSpacing: '0.8px', border: '1px solid rgba(165, 180, 252, 0.3)' }}>EOM 2.0 PRO</span>
            <span className="live-pulse-dot" style={{ backgroundColor: '#10b981', width: '8px', height: '8px' }}></span>
            <span style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: '500' }}>Live Auto-Sync Active</span>
          </div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '24px', fontFamily: "'Outfit', sans-serif", fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px', color: '#ffffff' }}>
            <Package size={26} color="#818cf8" /> Enterprise Fulfillment Hub
          </h2>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '13.5px', maxWidth: '600px', lineHeight: '1.4' }}>
            Command center for global shipments, courier dispatch reconciliation, and customer order diagnostics.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={fetchOrders}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.08)', color: '#f8fafc', border: '1px solid rgba(255,255,255,0.15)', padding: '10px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
            title="Refresh Orders"
          >
            <RefreshCw size={15} /> Refresh
          </button>
          <button 
            onClick={handleBulkExport}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.08)', color: '#f8fafc', border: '1px solid rgba(255,255,255,0.15)', padding: '10px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <Printer size={15} /> Print Labels ({selectedOrders.length})
          </button>
          <button 
            onClick={() => exportToCSV(filteredOrders, 'abkharido_orders_export.csv')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '12px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 15px rgba(79, 70, 229, 0.4)', transition: 'all 0.2s' }}
          >
            <FileText size={15} /> Export CSV
          </button>
        </div>
      </div>

      {/* ── 2. Smart Status Filter Tabs ── */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        {[
          { id: 'ALL', label: 'All Orders', count: orders.length, color: '#4f46e5', bg: '#e0e7ff' },
          { id: 'LIVE', label: 'Live (Running)', count: liveCount, color: '#d97706', bg: '#fef3c7', icon: '🔥' },
          { id: 'PROCESSING', label: 'New / Processing', count: processingCount, color: '#4f46e5', bg: '#e0e7ff', icon: '🟡' },
          { id: 'SHIPPED', label: 'Shipped / Transit', count: shippedCount, color: '#0284c7', bg: '#e0f2fe', icon: '🚚' },
          { id: 'DELIVERED', label: 'Delivered', count: deliveredCount, color: '#059669', bg: '#d1fae5', icon: '✅' },
          { id: 'RETURNS', label: 'Returns (RMA)', count: returnsCount, color: '#ea580c', bg: '#ffedd5', icon: '🔄' },
          { id: 'CANCELLED', label: 'Cancelled', count: cancelledCount, color: '#dc2626', bg: '#fee2e2', icon: '❌' },
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSelectedOrders([]); }}
              style={{
                padding: '8px 16px',
                borderRadius: '100px',
                fontSize: '13px',
                fontWeight: isActive ? '800' : '600',
                border: isActive ? `1.5px solid ${tab.color}` : '1px solid #e2e8f0',
                background: isActive ? (tab.id === 'ALL' ? '#4f46e5' : tab.id === 'LIVE' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : tab.color) : '#ffffff',
                color: isActive ? '#ffffff' : '#475569',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: isActive ? `0 4px 14px ${tab.color}35` : '0 1px 3px rgba(0,0,0,0.02)',
                transition: 'all 0.2s ease'
              }}
            >
              {tab.icon && <span>{tab.icon}</span>}
              <span>{tab.label}</span>
              <span style={{
                padding: '2px 7px',
                borderRadius: '10px',
                background: isActive ? 'rgba(255,255,255,0.25)' : tab.bg,
                color: isActive ? '#ffffff' : tab.color,
                fontSize: '11.5px',
                fontWeight: '800'
              }}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Enterprise Fulfillment Channel Filter (Amazon 1P vs 3P Model) ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', background: '#ffffff', padding: '10px 16px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        <span style={{ fontSize: '12px', fontWeight: '800', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.4px', marginRight: '6px' }}>
          Fulfillment Channel:
        </span>
        {[
          { id: 'ALL', label: `🌐 All Channels (${orders.length})` },
          { id: '1P', label: `🏬 AbKharido Central Hub (1P In-House) (${count1POrders})`, color: '#2563eb' },
          { id: '3P', label: `🏪 3P Partner Merchant Dispatched (${count3POrders})`, color: '#9333ea' }
        ].map(pill => (
          <button
            key={pill.id}
            type="button"
            onClick={() => { setChannelFilter(pill.id); setSelectedOrders([]); }}
            style={{
              padding: '6px 14px',
              borderRadius: '100px',
              fontSize: '12px',
              fontWeight: '800',
              border: '1.5px solid',
              cursor: 'pointer',
              transition: 'all 0.15s',
              background: channelFilter === pill.id ? (pill.color || '#0f172a') : '#f8fafc',
              color: channelFilter === pill.id ? '#ffffff' : '#475569',
              borderColor: channelFilter === pill.id ? (pill.color || '#0f172a') : '#cbd5e1',
              boxShadow: channelFilter === pill.id ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* ── 3. Table Container with Bulk Action & Search Bar ── */}
      <div style={{ background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
        
        {/* Bulk Action & Search Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: selectedOrders.length > 0 ? '#e0e7ff' : '#f1f5f9', border: selectedOrders.length > 0 ? '1px solid #c7d2fe' : '1px solid #e2e8f0', padding: '6px 12px', borderRadius: '100px' }}>
              <CheckSquare size={15} color={selectedOrders.length > 0 ? '#4f46e5' : '#64748b'} />
              <span style={{ fontSize: '12.5px', fontWeight: '700', color: selectedOrders.length > 0 ? '#4338ca' : '#475569' }}>{selectedOrders.length} Selected</span>
            </div>
            
            <div style={{ position: 'relative' }}>
              <select 
                style={{ 
                  height: '38px', 
                  borderRadius: '10px', 
                  fontSize: '12.5px', 
                  fontWeight: '600', 
                  padding: '0 32px 0 12px', 
                  background: '#ffffff',
                  border: '1.5px solid #cbd5e1',
                  color: '#1e293b',
                  cursor: 'pointer',
                  appearance: 'none',
                  outline: 'none'
                }}
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value)}
              >
                <option value="">Set Status to...</option>
                <option value="Processing">Processing</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748b', fontSize: '10px' }}>▼</span>
            </div>

            <button 
              onClick={handleBulkUpdate}
              disabled={selectedOrders.length === 0 || !bulkStatus}
              style={{
                borderRadius: '10px', 
                height: '38px', 
                padding: '0 16px', 
                fontWeight: '700',
                fontSize: '12.5px',
                background: selectedOrders.length > 0 && bulkStatus ? 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)' : '#e2e8f0',
                color: selectedOrders.length > 0 && bulkStatus ? '#ffffff' : '#94a3b8',
                border: 'none',
                cursor: selectedOrders.length > 0 && bulkStatus ? 'pointer' : 'not-allowed',
                boxShadow: selectedOrders.length > 0 && bulkStatus ? '0 2px 8px rgba(79, 70, 229, 0.25)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              Apply Status
            </button>
          </div>

          <div style={{ position: 'relative', width: '320px' }}>
            <Search size={16} color="#64748b" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search Order ID, Phone, Name, AWB..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', height: '38px', paddingLeft: '38px', paddingRight: '32px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '12.5px', outline: 'none', fontWeight: '500', background: '#ffffff', boxSizing: 'border-box' }}
            />
            {searchQuery && (
              <X size={15} color="#94a3b8" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer' }} onClick={() => setSearchQuery('')} />
            )}
          </div>
        </div>

        {/* ── 4. Main Data Table ── */}
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
                <th style={{ width: '40px', padding: '14px 16px 14px 20px', textAlign: 'left' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                    onChange={(e) => handleSelectAll(e, filteredOrders)}
                    style={{ width: '16px', height: '16px', accentColor: '#4f46e5', cursor: 'pointer' }}
                  />
                </th>
                <th style={{ fontSize: '11.5px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px', padding: '14px 16px' }}>ORDER ID</th>
                <th style={{ fontSize: '11.5px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px', padding: '14px 16px' }}>CUSTOMER</th>
                <th style={{ fontSize: '11.5px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px', padding: '14px 16px' }}>TOTAL VALUE</th>
                <th style={{ fontSize: '11.5px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px', padding: '14px 16px' }}>ORDER STATUS</th>
                <th style={{ fontSize: '11.5px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px', padding: '14px 16px' }}>PAYMENT</th>
                <th style={{ fontSize: '11.5px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px', padding: '14px 16px' }}>RETURN</th>
                <th style={{ fontSize: '11.5px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px', padding: '14px 20px', textAlign: 'right' }}>FULFILLMENT ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => {
                const oId = order.id || order._id;
                const statusUpper = (order.status || 'PROCESSING').toUpperCase();
                const isCancelled = statusUpper === 'CANCELLED' || statusUpper === 'RETURNED' || statusUpper === 'REFUNDED' || statusUpper === 'FAILED';
                const isDelivered = statusUpper === 'DELIVERED';
                const isShipped = statusUpper === 'SHIPPED' || statusUpper === 'IN TRANSIT';

                const customerName = order.user?.fullName || order.user?.username || order.shippingAddress?.fullName || 'Guest Customer';
                const customerPhone = order.shippingAddress?.phone || order.user?.phone || '';

                return (
                  <tr key={oId} style={{ backgroundColor: selectedOrders.includes(oId) ? '#f0f4ff' : isCancelled ? '#fffbfb' : '#ffffff', borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                    <td style={{ padding: '16px 16px 16px 20px' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedOrders.includes(oId)}
                        onChange={() => handleSelectOne(oId)}
                        style={{ width: '16px', height: '16px', accentColor: '#4f46e5', cursor: 'pointer' }}
                      />
                    </td>
                    
                    {/* Order ID & Date & Fulfillment Channel */}
                    <td style={{ padding: '16px' }}>
                      <div 
                        onClick={() => setViewingOrder(order)} 
                        style={{ fontWeight: '800', fontSize: '13.5px', color: '#4f46e5', cursor: 'pointer', fontFamily: 'monospace', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        title="Click to inspect order"
                      >
                        #{String(oId).slice(-8).toUpperCase()}
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '3px', fontWeight: '500' }}>
                        {new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                      <div style={{ marginTop: '5px' }}>
                        {getOrderChannel(order) === '1P' ? (
                          <span style={{ background: '#dbeafe', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '2px 7px', borderRadius: '6px', fontSize: '10px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            🏬 1P Central Hub
                          </span>
                        ) : (
                          <span style={{ background: '#f3e8ff', color: '#7e22ce', border: '1px solid #e9d5ff', padding: '2px 7px', borderRadius: '6px', fontSize: '10px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            🏪 3P Merchant Direct
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Customer Info */}
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontWeight: '700', color: '#0f172a', fontSize: '13.5px' }}>{customerName}</span>
                        {customerPhone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#475569' }}>
                            <Phone size={12} color="#10b981" /> +91 {customerPhone}
                          </div>
                        )}
                        <div>
                          {order.user?.isEmailVerified ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '1px 6px', borderRadius: '6px', fontSize: '10.5px', fontWeight: '700' }}>
                              ✓ Verified Buyer
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', padding: '1px 6px', borderRadius: '6px', fontSize: '10.5px', fontWeight: '600' }}>
                              Guest Order
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Total Price */}
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '15px', fontFamily: "'Outfit', sans-serif" }}>
                        ₹{(order.finalAmount || order.totalPrice || 0).toLocaleString('en-IN')}
                      </div>
                      <div style={{ marginTop: '3px' }}>
                        {order.paymentMethod === 'Cash on Delivery' ? (
                          <span style={{ fontSize: '11px', color: '#b45309', background: '#fef3c7', padding: '2px 6px', borderRadius: '4px', fontWeight: '600' }}>💵 COD</span>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#0369a1', background: '#e0f2fe', padding: '2px 6px', borderRadius: '4px', fontWeight: '600' }}>💳 Prepaid</span>
                        )}
                      </div>
                    </td>

                    {/* Order Status */}
                    <td style={{ padding: '16px' }}>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        borderRadius: '100px',
                        fontSize: '12px',
                        fontWeight: '700',
                        background: isDelivered ? '#ecfdf5' : isShipped ? '#e0f2fe' : isCancelled ? '#fee2e2' : '#fef3c7',
                        color: isDelivered ? '#047857' : isShipped ? '#0369a1' : isCancelled ? '#b91c1c' : '#b45309',
                        border: `1px solid ${isDelivered ? '#a7f3d0' : isShipped ? '#bae6fd' : isCancelled ? '#fecaca' : '#fde68a'}`
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isDelivered ? '#10b981' : isShipped ? '#0284c7' : isCancelled ? '#ef4444' : '#f59e0b' }}></span>
                        {order.status || 'Processing'}
                      </div>
                      {order.awbNumber && (
                        <div style={{ fontSize: '11px', marginTop: '6px', color: '#334155', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '4px 8px', borderRadius: '6px' }}>
                          <span style={{ fontWeight: '700' }}>AWB:</span> {order.awbNumber}
                        </div>
                      )}
                    </td>

                    {/* Payment Info */}
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '11.5px',
                          fontWeight: '700',
                          background: isCancelled
                            ? ((order.financialRefundClaimed || order.refundDetails?.refundStatus === 'Credited') ? '#ecfdf5' : '#f1f5f9')
                            : (order.paymentStatus === 'SUCCESS' || order.isPaid) ? '#ecfdf5' : (order.paymentMethod === 'Cash on Delivery' && !order.isPaid) ? '#fffbeb' : '#fef2f2',
                          color: isCancelled
                            ? ((order.financialRefundClaimed || order.refundDetails?.refundStatus === 'Credited') ? '#047857' : '#475569')
                            : (order.paymentStatus === 'SUCCESS' || order.isPaid) ? '#047857' : (order.paymentMethod === 'Cash on Delivery' && !order.isPaid) ? '#b45309' : '#dc2626',
                          border: `1px solid ${isCancelled
                            ? ((order.financialRefundClaimed || order.refundDetails?.refundStatus === 'Credited') ? '#a7f3d0' : '#cbd5e1')
                            : (order.paymentStatus === 'SUCCESS' || order.isPaid) ? '#a7f3d0' : (order.paymentMethod === 'Cash on Delivery' && !order.isPaid) ? '#fde68a' : '#fecaca'}`
                        }}>
                          {isCancelled
                            ? ((order.financialRefundClaimed || order.refundDetails?.refundStatus === 'Credited') ? '💰 Refund Credited' : '🚫 COD Voided (₹0)')
                            : (order.paymentStatus === 'SUCCESS' || order.isPaid) ? '✓ Paid' : (order.paymentMethod === 'Cash on Delivery' && !order.isPaid) ? '⏳ COD Unpaid' : 'Unpaid'}
                        </span>
                        {order.refundDetails?.refundArn && (
                          <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#047857', fontWeight: '700' }}>
                            {order.refundDetails.refundArn}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Return Status */}
                    <td style={{ padding: '16px' }}>
                      {order.returnStatus && order.returnStatus !== 'None' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', background: '#fff7ed', padding: '8px 10px', borderRadius: '10px', border: '1px solid #fed7aa', minWidth: '150px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', fontWeight: '800', color: '#9a3412', textTransform: 'uppercase' }}>
                              {order.returnStatus}
                            </span>
                            {order.returnDetails?.rmaNumber && (
                              <span style={{ fontSize: '9px', color: '#7c2d12', fontWeight: '700', fontFamily: 'monospace' }}>
                                {order.returnDetails.rmaNumber}
                              </span>
                            )}
                          </div>
                          
                          {order.returnReason && (
                            <span style={{ fontSize: '10.5px', color: '#475569', fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              "{order.returnReason}"
                            </span>
                          )}

                          <button 
                            onClick={() => {
                              setManagingReturnOrder(order);
                              setReturnActionState({
                                action: order.returnStatus === 'Requested' ? 'Approve' : order.returnStatus === 'Approved' ? 'SchedulePickup' : order.returnStatus === 'Pickup Scheduled' ? 'MarkPickedUp' : 'PassQcAndRefund',
                                courierPartner: order.returnDetails?.reverseCourier || 'Delhivery Reverse Express',
                                returnAwb: order.returnDetails?.returnAwb || `REV-${Date.now().toString().slice(-8)}`,
                                pickupDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
                                qcRemarks: order.returnDetails?.qcRemarks || 'Product intact, verified at warehouse',
                                adminNotes: order.returnDetails?.adminNotes || '',
                                isSubmitting: false
                              });
                            }}
                            style={{ 
                              background: '#ea580c', 
                              color: '#ffffff', 
                              border: 'none', 
                              padding: '5px 8px', 
                              borderRadius: '6px', 
                              fontSize: '11px', 
                              fontWeight: '700', 
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px'
                            }}
                          >
                            <RefreshCw size={11} /> Manage Return
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '12px' }}>—</span>
                      )}
                    </td>

                    {/* Fulfillment Actions */}
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap' }}>
                        
                        {/* Inspect Order */}
                        <button 
                          onClick={() => setViewingOrder(order)}
                          style={{ padding: '6px 11px', display: 'inline-flex', gap: '5px', alignItems: 'center', fontSize: '11.5px', borderRadius: '8px', color: '#4f46e5', border: '1px solid #c7d2fe', background: '#eef2ff', fontWeight: '700', cursor: 'pointer' }}
                          title="View order items & address"
                        >
                          <Eye size={13} /> Inspect
                        </button>

                        {/* ⚡ 1-Click NimbusPost Dispatch Button */}
                        {(!isCancelled && !isDelivered && !isShipped) && (
                          <button 
                            onClick={() => dispatchViaNimbusPost(oId)}
                            style={{ padding: '6px 12px', display: 'inline-flex', gap: '5px', alignItems: 'center', fontSize: '11.5px', borderRadius: '8px', color: '#ffffff', background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', border: 'none', fontWeight: '800', cursor: 'pointer', boxShadow: '0 2px 8px rgba(5, 150, 105, 0.3)' }}
                            title="1-Click Automated Courier Dispatch via NimbusPost"
                          >
                            <Truck size={13} /> ⚡ NimbusPost
                          </button>
                        )}

                        {/* Custom Dispatch Button */}
                        {(!isCancelled && !isDelivered && !isShipped) && (
                          <button 
                            onClick={() => { setDispatchOrder(order); setAwbInput(order.awbNumber || ''); }}
                            style={{ padding: '6px 12px', display: 'inline-flex', gap: '5px', alignItems: 'center', fontSize: '11.5px', borderRadius: '8px', color: '#ffffff', background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)', border: 'none', fontWeight: '700', cursor: 'pointer', boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)' }}
                            title="Assign Courier & Dispatch"
                          >
                            <Truck size={13} /> Dispatch
                          </button>
                        )}

                        {/* 1-Click Mark Delivered & Settle Seller Escrow Button (for Shipped orders) */}
                        {(isShipped && !isDelivered && !isCancelled) && (
                          <button
                            onClick={() => handleVerifyCOD(order)}
                            style={{ padding: '6px 11px', display: 'inline-flex', gap: '5px', alignItems: 'center', fontSize: '11.5px', borderRadius: '8px', color: '#ffffff', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', fontWeight: '800', cursor: 'pointer', boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)' }}
                            title="Verify Delivery & Settle Seller Escrow"
                          >
                            <CheckCircle size={13} /> Deliver
                          </button>
                        )}

                        {/* Track Button */}
                        {order.trackingUrl && (
                          <a 
                            href={order.trackingUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            style={{ padding: '6px 10px', display: 'inline-flex', gap: '5px', alignItems: 'center', fontSize: '11.5px', borderRadius: '8px', color: '#059669', border: '1px solid #a7f3d0', background: '#ecfdf5', textDecoration: 'none', fontWeight: '700' }}
                            title="Track Shipment Online"
                          >
                            <Truck size={13} /> Track
                          </a>
                        )}

                        {/* Invoice Button */}
                        <button 
                          onClick={() => handleDownloadPremiumInvoice(order)}
                          disabled={downloadingOrderId === oId}
                          style={{ 
                            padding: '6px 10px', 
                            display: 'inline-flex', 
                            gap: '5px', 
                            alignItems: 'center', 
                            fontSize: '11.5px', 
                            borderRadius: '8px', 
                            color: isCancelled ? '#dc2626' : '#0284c7', 
                            border: isCancelled ? '1px solid #fca5a5' : '1px solid #bae6fd', 
                            background: isCancelled ? '#fef2f2' : '#f0f9ff', 
                            opacity: downloadingOrderId === oId ? 0.6 : 1, 
                            fontWeight: '600', 
                            cursor: 'pointer' 
                          }}
                          title={isCancelled ? "Download Cancelled Invoice / Credit Note" : "Download PDF Invoice"}
                        >
                          <Printer size={13} /> {downloadingOrderId === oId ? '...' : (isCancelled ? 'Cancelled Inv' : 'Invoice')}
                        </button>

                        {/* Hidden Premium Invoice Renderer */}
                        <div style={{ display: 'none' }}>
                          <WorldClassInvoice ref={el => invoiceRefs.current[oId] = el} order={order} />
                        </div>

                        {/* Cancel Button */}
                        {!isCancelled && !isDelivered && (
                          <button 
                            onClick={() => handleCancelOrder(oId)}
                            style={{ padding: '6px 10px', display: 'inline-flex', gap: '4px', alignItems: 'center', fontSize: '11.5px', borderRadius: '8px', color: '#dc2626', border: '1px solid #fecaca', background: '#fef2f2', fontWeight: '600', cursor: 'pointer' }}
                            title="Cancel Order & Restore Stock"
                          >
                            <XCircle size={13} /> Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                    <Package size={48} color="#cbd5e1" style={{ margin: '0 auto 16px', opacity: 0.7 }} />
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>No orders matching your filter</div>
                    <div style={{ fontSize: '13px', color: '#94a3b8' }}>Try clearing your search query or switching to another filter tab above.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: DEEP VIEW ORDER INSPECTOR */}
      {viewingOrder && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', display: 'flex', flexDirection: 'column' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '24px 32px', background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', color: 'white', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '24px', fontWeight: '800', fontFamily: "'Outfit', sans-serif" }}>
                    Order #{String(viewingOrder.id || viewingOrder._id).slice(-8).toUpperCase()}
                  </span>
                  <span style={{ padding: '4px 12px', borderRadius: '20px', background: 'rgba(255,255,255,0.15)', color: 'white', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>
                    {viewingOrder.status || 'Processing'}
                  </span>
                </div>
                <p style={{ margin: '6px 0 0', color: '#cbd5e1', fontSize: '13px' }}>
                  Placed on: {new Date(viewingOrder.createdAt || Date.now()).toLocaleString('en-IN')}
                </p>
              </div>
              <button onClick={() => setViewingOrder(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', width: '40px', height: '40px', borderRadius: '50%', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
              
              {/* Row 1: Customer Contact & Shipping Address */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
                
                {/* Shipping Details */}
                <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={18} color="#4f46e5" /> Delivery Address & Contact
                  </h4>
                  <div style={{ fontSize: '14px', color: '#334155', lineHeight: '1.6', fontWeight: '500' }}>
                    <div style={{ fontWeight: '700', fontSize: '16px', color: '#1e293b', marginBottom: '4px' }}>
                      {viewingOrder.shippingAddress?.fullName || viewingOrder.user?.fullName || 'Customer Name'}
                    </div>
                    {viewingOrder.shippingAddress?.address ? (
                      <>
                        <div>{viewingOrder.shippingAddress.address}</div>
                        <div>{viewingOrder.shippingAddress.city}, {viewingOrder.shippingAddress.state} - <strong>{viewingOrder.shippingAddress.postalCode}</strong></div>
                      </>
                    ) : (
                      <div style={{ color: '#64748b', fontStyle: 'italic' }}>Standard recorded delivery address on customer profile.</div>
                    )}
                  </div>

                  {viewingOrder.shippingAddress?.phone && (
                    <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px dashed #cbd5e1', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <a 
                        href={`https://wa.me/91${viewingOrder.shippingAddress.phone}?text=Hi%20${encodeURIComponent(viewingOrder.shippingAddress.fullName || 'Sir/Madam')},%20regarding%20your%20AbKharido%20order%20%23${String(viewingOrder.id || viewingOrder._id).slice(-8).toUpperCase()}...`} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: '#10b981', color: 'white', borderRadius: '10px', textDecoration: 'none', fontSize: '12px', fontWeight: '700', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.2)' }}
                      >
                        <MessageCircle size={15} /> WhatsApp Customer
                      </a>
                      <a 
                        href={`tel:0${viewingOrder.shippingAddress.phone}`}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: '#e2e8f0', color: '#1e293b', borderRadius: '10px', textDecoration: 'none', fontSize: '12px', fontWeight: '700' }}
                      >
                        <Phone size={14} color="#4f46e5" /> Call: {viewingOrder.shippingAddress.phone}
                      </a>
                    </div>
                  )}
                </div>

                {/* Financial & COD Reconciliation */}
                <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <DollarSign size={18} color="#10b981" /> Payment & Financial Summary
                    </h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: '14px' }}>
                      <span style={{ color: '#64748b' }}>Payment Mode:</span>
                      <strong style={{ color: '#0f172a' }}>{viewingOrder.paymentMethod || 'Online / COD'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: '14px' }}>
                      <span style={{ color: '#64748b' }}>Payment Status:</span>
                      <span className={`status-badge ${viewingOrder.paymentMethod === 'Cash on Delivery' && !viewingOrder.isPaid ? 'warning' : 'success'}`} style={{ fontWeight: '700' }}>
                        {viewingOrder.isPaid || viewingOrder.paymentStatus === 'SUCCESS' ? '✓ Verified Paid' : '⏳ Pending Collection'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0 0', fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                      <span>Total Invoice Amount:</span>
                      <span style={{ color: '#4f46e5' }}>₹{(viewingOrder.finalAmount || viewingOrder.totalPrice || 0).toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {viewingOrder.paymentMethod === 'Cash on Delivery' && !viewingOrder.isPaid && (
                    <button 
                      onClick={() => handleVerifyCOD(viewingOrder)}
                      style={{ marginTop: '16px', width: '100%', padding: '12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}
                    >
                      <CheckCircle size={16} /> Mark COD Collected & Settle Order
                    </button>
                  )}
                </div>

              </div>
              {/* Row 2: Ordered Items List */}
              <div>
                <h4 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Package size={20} color="#6366f1" /> Ordered Items ({viewingOrder.orderItems?.length || viewingOrder.items?.length || 1})
                </h4>

                <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
                  {(viewingOrder.orderItems || viewingOrder.items || []).length > 0 ? (
                    (viewingOrder.orderItems || viewingOrder.items).map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: idx === (viewingOrder.orderItems || viewingOrder.items).length - 1 ? 'none' : '1px solid #f1f5f9', background: 'white' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            {item.image ? (
                              <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&q=80'; }} />
                            ) : (
                              <Package size={24} color="#94a3b8" />
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: '700', fontSize: '15px', color: '#1e293b', marginBottom: '4px' }}>{item.name || item.title || 'AbKharido Enterprise Product'}</div>
                            <div style={{ fontSize: '13px', color: '#64748b' }}>
                              Quantity: <strong style={{ color: '#0f172a', background: '#f1f5f9', padding: '2px 8px', borderRadius: '6px' }}>x{item.qty || item.quantity || 1}</strong>
                              {item.size && <span style={{ marginLeft: '12px' }}>Size: <strong>{item.size}</strong></span>}
                            </div>
                          </div>
                        </div>
                        <div style={{ fontWeight: '800', fontSize: '16px', color: '#0f172a' }}>
                          ₹{((item.price || viewingOrder.totalPrice || 0) * (item.qty || item.quantity || 1)).toLocaleString('en-IN')}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '32px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                      Item breakdown details are stored in catalog archives for this entry.
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div style={{ padding: '20px 32px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {(() => {
                const isViewingCancelled = ['CANCELLED', 'Cancelled', 'cancelled'].includes(String(viewingOrder.status || ''));
                return (
                  <button 
                    onClick={() => handleDownloadPremiumInvoice(viewingOrder)}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      padding: '10px 20px', 
                      background: isViewingCancelled ? '#fef2f2' : '#0ea5e9', 
                      color: isViewingCancelled ? '#dc2626' : 'white', 
                      border: isViewingCancelled ? '1.5px solid #fca5a5' : 'none', 
                      borderRadius: '12px', 
                      fontWeight: '700', 
                      cursor: 'pointer', 
                      boxShadow: isViewingCancelled ? 'none' : '0 4px 12px rgba(14, 165, 233, 0.3)' 
                    }}
                  >
                    <Printer size={16} /> {isViewingCancelled ? 'Download Cancelled Invoice (Credit Note)' : 'Download PDF Invoice'}
                  </button>
                );
              })()}
              <button onClick={() => setViewingOrder(null)} className="btn btn-outline" style={{ padding: '10px 24px', borderRadius: '12px', fontWeight: '700', background: 'white' }}>
                Close Inspector
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: COURIER DISPATCH & AWB MANAGER */}
      {dispatchOrder && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '500px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden' }}>
            
            <div style={{ padding: '24px', background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Truck size={24} color="#818cf8" />
                <span style={{ fontSize: '20px', fontWeight: '800', fontFamily: 'Outfit, sans-serif' }}>Assign Courier & Dispatch</span>
              </div>
              <button onClick={() => setDispatchOrder(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCustomDispatchSubmit} style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#475569' }}>
                Dispatching Order: <strong style={{ color: '#0f172a' }}>#{String(dispatchOrder.id || dispatchOrder._id).slice(-8).toUpperCase()}</strong><br/>
                Customer: <strong style={{ color: '#0f172a' }}>{dispatchOrder.user?.fullName || dispatchOrder.shippingAddress?.fullName || 'Customer'}</strong>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Select Fulfillment Partner</label>
                <select 
                  className="admin-input" 
                  style={{ width: '100%', height: '44px', borderRadius: '12px', fontWeight: '600', background: 'white', paddingLeft: '14px' }}
                  value={courierPartner}
                  onChange={(e) => setCourierPartner(e.target.value)}
                >
                  <option value="Delhivery Express">Delhivery Express (Air & Surface)</option>
                  <option value="BlueDart Express">BlueDart Express Logistics</option>
                  <option value="Xpressbees E-commerce">Xpressbees E-commerce</option>
                  <option value="Shadowfax Courier">Shadowfax Courier & Next-Day</option>
                  <option value="Ecom Express India">Ecom Express India</option>
                  <option value="Shiprocket Direct">Shiprocket Automated Routing</option>
                  <option value="India Post Speed Post">India Post Speed Post</option>
                  <option value="Porter / Local Delivery">Porter / Local Same-Day Delivery</option>
                </select>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>AWB / Tracking Number</label>
                  <button 
                    type="button" 
                    onClick={() => setAwbInput(`AWB-${Math.floor(1000000000 + Math.random() * 9000000000)}`)}
                    style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: '12px', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    🎲 Auto-Generate ID
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Enter AWB or Click Auto-Generate..."
                  value={awbInput}
                  onChange={(e) => setAwbInput(e.target.value)}
                  style={{ width: '100%', height: '44px', padding: '0 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', fontWeight: '600', fontFamily: 'monospace' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={() => setDispatchOrder(null)} className="btn btn-outline" style={{ flex: 1, height: '46px', borderRadius: '12px', fontWeight: '700' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2, height: '46px', background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)', border: 'none', borderRadius: '12px', fontWeight: '800', fontSize: '15px', boxShadow: '0 10px 20px -5px rgba(79, 70, 229, 0.4)' }}>
                  🚀 Confirm Dispatch & Notify
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: RETURN & RMA LIFECYCLE MANAGER */}
      {managingReturnOrder && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '24px 28px', background: 'linear-gradient(135deg, #9a3412 0%, #c2410c 100%)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <RefreshCw size={22} color="#fed7aa" />
                  <span style={{ fontSize: '20px', fontWeight: '800', fontFamily: 'Outfit, sans-serif' }}>
                    Return Management (RMA)
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: '#ffedd5', marginTop: '4px' }}>
                  Order #{String(managingReturnOrder.id || managingReturnOrder._id).slice(-8).toUpperCase()} • Customer: <strong>{managingReturnOrder.user?.fullName || managingReturnOrder.shippingAddress?.fullName || 'Customer'}</strong>
                </div>
              </div>
              <button onClick={() => setManagingReturnOrder(null)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={18} />
              </button>
            </div>

            {/* Return Request Overview Card */}
            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '16px', padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#9a3412', fontWeight: '700', textTransform: 'uppercase' }}>RMA ID</span>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#7c2d12', fontFamily: 'monospace' }}>
                    {managingReturnOrder.returnDetails?.rmaNumber || 'RMA-PENDING'}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#9a3412', fontWeight: '700', textTransform: 'uppercase' }}>Current Status</span>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#c2410c' }}>
                    {managingReturnOrder.returnStatus || 'Requested'}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#9a3412', fontWeight: '700', textTransform: 'uppercase' }}>Doorstep Return PIN</span>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#047857', fontFamily: 'monospace' }}>
                    🔒 {managingReturnOrder.returnDetails?.pickupPin || 'Auto-Generates'}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#9a3412', fontWeight: '700', textTransform: 'uppercase' }}>Refund Amount</span>
                  <div style={{ fontSize: '15px', fontWeight: '900', color: '#0f172a' }}>
                    ₹{(managingReturnOrder.totalPrice || 0).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Customer Notes & Destination */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px 16px', fontSize: '13px' }}>
                <div style={{ marginBottom: '6px' }}>
                  <strong style={{ color: '#334155' }}>Customer Reason:</strong> <span style={{ color: '#0f172a' }}>"{managingReturnOrder.returnReason || 'Defective/Not as described'}"</span>
                </div>
                <div>
                  <strong style={{ color: '#334155' }}>Refund Target:</strong>{' '}
                  <span style={{ color: '#047857', fontWeight: '700' }}>
                    {managingReturnOrder.refundDestination?.type === 'Wallet' 
                      ? '⚡ AbKharido Wallet Cash (+5% Bonus Instant Credit)' 
                      : managingReturnOrder.refundDestination?.type === 'UPI' 
                        ? `💳 UPI Direct (${managingReturnOrder.refundDestination?.upiId || 'Pending'})` 
                        : '🏦 Original Payment Gateway (Cashfree Escrow)'}
                  </span>
                </div>
              </div>

              {/* Action Form */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <label style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>
                  Select Next Return Milestone Action:
                </label>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                  {[
                    { key: 'Approve', label: '1. Approve' },
                    { key: 'SchedulePickup', label: '2. Schedule Pickup' },
                    { key: 'MarkPickedUp', label: '3. Mark Picked Up' },
                    { key: 'PassQcAndRefund', label: '4. Pass QC & Refund' },
                    { key: 'FailQc', label: '5. Fail QC' },
                    { key: 'Reject', label: 'Reject' }
                  ].map(act => (
                    <button
                      key={act.key}
                      type="button"
                      onClick={() => setReturnActionState(prev => ({ ...prev, action: act.key }))}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        border: returnActionState.action === act.key ? '2px solid #ea580c' : '1px solid #cbd5e1',
                        background: returnActionState.action === act.key ? '#fff7ed' : '#ffffff',
                        color: returnActionState.action === act.key ? '#c2410c' : '#475569'
                      }}
                    >
                      {act.label}
                    </button>
                  ))}
                </div>

                {/* Dynamic Inputs based on Action */}
                {returnActionState.action === 'SchedulePickup' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Reverse Courier Partner</label>
                      <select
                        value={returnActionState.courierPartner}
                        onChange={(e) => setReturnActionState(prev => ({ ...prev, courierPartner: e.target.value }))}
                        style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 10px', fontSize: '13px', fontWeight: '600', background: 'white' }}
                      >
                        <option value="Delhivery Reverse Express">Delhivery Reverse Express</option>
                        <option value="NimbusPost Reverse Logistics">NimbusPost Reverse Logistics</option>
                        <option value="BlueDart Reverse Air">BlueDart Reverse Air</option>
                        <option value="Shadowfax Reverse Doorstep">Shadowfax Reverse Doorstep</option>
                        <option value="Store Pickup Boy / Local">Store Pickup Boy / Local</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Reverse AWB Number</label>
                      <input
                        type="text"
                        value={returnActionState.returnAwb}
                        onChange={(e) => setReturnActionState(prev => ({ ...prev, returnAwb: e.target.value }))}
                        placeholder="e.g. REV-94827104"
                        style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px', fontWeight: '600', fontFamily: 'monospace' }}
                      />
                    </div>
                  </div>
                )}

                {returnActionState.action === 'PassQcAndRefund' && (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ fontSize: '13px', color: '#166534', fontWeight: '700' }}>
                      ⚡ 100% Refund of ₹{(managingReturnOrder.totalPrice || 0).toLocaleString('en-IN')} will be issued immediately upon confirmation!
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#166534', marginBottom: '4px' }}>Warehouse Inspection / QC Remarks</label>
                      <input
                        type="text"
                        value={returnActionState.qcRemarks}
                        onChange={(e) => setReturnActionState(prev => ({ ...prev, qcRemarks: e.target.value }))}
                        placeholder="e.g. All items inspected, tags intact, approved for refund"
                        style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1px solid #86efac', padding: '0 12px', fontSize: '13px' }}
                      />
                    </div>
                  </div>
                )}

                {(returnActionState.action === 'FailQc' || returnActionState.action === 'Reject') && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#991b1b', marginBottom: '4px' }}>Rejection / Failure Reason *</label>
                    <input
                      type="text"
                      value={returnActionState.adminNotes}
                      onChange={(e) => setReturnActionState(prev => ({ ...prev, adminNotes: e.target.value }))}
                      placeholder="e.g. Item missing original accessories or physically damaged by user"
                      style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1px solid #fca5a5', padding: '0 12px', fontSize: '13px' }}
                      required
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setManagingReturnOrder(null)}
                  className="btn btn-outline"
                  style={{ flex: 1, height: '46px', borderRadius: '12px', fontWeight: '700' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={returnActionState.isSubmitting}
                  onClick={() => handleReturnAction(managingReturnOrder._id || managingReturnOrder.id, {
                    action: returnActionState.action,
                    courierPartner: returnActionState.courierPartner,
                    returnAwb: returnActionState.returnAwb,
                    pickupDate: returnActionState.pickupDate,
                    qcRemarks: returnActionState.qcRemarks,
                    adminNotes: returnActionState.adminNotes
                  })}
                  style={{
                    flex: 2,
                    height: '46px',
                    borderRadius: '12px',
                    fontWeight: '800',
                    fontSize: '14px',
                    border: 'none',
                    color: '#ffffff',
                    cursor: returnActionState.isSubmitting ? 'not-allowed' : 'pointer',
                    background: returnActionState.action === 'Reject' || returnActionState.action === 'FailQc' ? '#dc2626' : returnActionState.action === 'PassQcAndRefund' ? '#16a34a' : '#ea580c'
                  }}
                >
                  {returnActionState.isSubmitting ? 'Processing...' : `Confirm: ${returnActionState.action}`}
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default AdminOMS;
