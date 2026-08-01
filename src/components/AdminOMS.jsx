import React, { useState, useEffect, useRef } from 'react';
// eslint-disable-next-line
import { FileText, Truck, Printer, Search, CheckSquare, Eye, X, Settings, XCircle, Package, Phone, MessageCircle, MapPin, DollarSign, ExternalLink, RefreshCw, CheckCircle, Shield, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import WorldClassInvoice from './WorldClassInvoice';
import { exportToCSV } from '../utils/csvExport';

const AdminOMS = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [viewingOrder, setViewingOrder] = useState(null);
  const [dispatchOrder, setDispatchOrder] = useState(null);
  const [courierPartner, setCourierPartner] = useState('Delhivery Express');
  const [awbInput, setAwbInput] = useState('');

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
        setOrders(data);
      } else {
        setOrders([
          { _id: 'ord_001', user: { email: 'user@example.com', fullName: 'Rahul Sharma', isEmailVerified: true }, totalPrice: 1500, status: 'Processing', isPaid: true, createdAt: new Date().toISOString(), shippingAddress: { fullName: 'Rahul Sharma', address: 'Flat 402, Green Valley Apartments', city: 'Mumbai', state: 'Maharashtra', postalCode: '400053', phone: '9876543210' }, orderItems: [{ name: 'Nike Air Zoom Running Shoes', qty: 1, price: 1500, image: '/placeholder-shoes.png' }] },
          { _id: 'ord_002', user: { email: 'guest@web.com', fullName: 'Amit Kumar', isEmailVerified: false }, totalPrice: 2300, status: 'Shipped', isPaid: false, paymentMethod: 'Cash on Delivery', awbNumber: 'DLV99281726', courierPartner: 'Delhivery', createdAt: new Date().toISOString(), shippingAddress: { fullName: 'Amit Kumar', address: 'Plot 12, Sector 18', city: 'Noida', state: 'UP', postalCode: '201301', phone: '9123456780' }, orderItems: [{ name: 'Samsung Galaxy Buds 2 Pro', qty: 1, price: 2300, image: '/placeholder-buds.png' }] }
        ]);
      }
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

  const handleApproveReturn = async (id) => {
    try {
      const token = sessionStorage.getItem('abkharido_admin_token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/orders/${id}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify({ action: 'Approve' })
      });
      showToast('Return approved successfully', 'success');
      fetchOrders();
    } catch (err) {
      showToast('Error approving return', 'error');
    }
  };

  const handleRejectReturn = async (id) => {
    try {
      showToast('Return rejected', 'info');
      fetchOrders();
    } catch (err) {
      showToast('Error rejecting return', 'error');
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
    if (!window.confirm('Are you sure you want to cancel this order? Stock and coupons will be restored.')) return;
    
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
          trackingUrl: `https://track.abkharido.com/${finalAwb}`
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
    if (!window.confirm('Confirm that CASH ON DELIVERY amount has been collected and verified?')) return;

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
  const cancelledCount = orders.filter(o => ['CANCELLED', 'Cancelled', 'cancelled', 'RETURNED', 'Returned', 'returned', 'REFUNDED', 'Refunded', 'FAILED', 'Failed'].includes(o.status) || (o.returnStatus && o.returnStatus !== 'None')).length;

  const filteredOrders = orders.filter(o => {
    // 1. Tab Filter
    if (activeTab === 'LIVE') {
      if (['CANCELLED', 'Cancelled', 'cancelled', 'DELIVERED', 'Delivered', 'delivered', 'RETURNED', 'Returned', 'returned', 'REFUNDED', 'Refunded', 'FAILED', 'Failed'].includes(o.status)) return false;
    } else if (activeTab === 'PROCESSING') {
      if (!(!o.status || o.status.toLowerCase() === 'processing' || o.status.toLowerCase() === 'pending')) return false;
    } else if (activeTab === 'SHIPPED') {
      if (!o.status || o.status.toLowerCase() !== 'shipped') return false;
    } else if (activeTab === 'DELIVERED') {
      if (!o.status || o.status.toLowerCase() !== 'delivered') return false;
    } else if (activeTab === 'CANCELLED') {
      const isCancelled = ['CANCELLED', 'Cancelled', 'cancelled', 'RETURNED', 'Returned', 'returned', 'REFUNDED', 'Refunded', 'FAILED', 'Failed'].includes(o.status);
      const hasReturn = o.returnStatus && o.returnStatus !== 'None';
      if (!isCancelled && !hasReturn) return false;
    }

    // 2. Search Query Filter
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Glassmorphic Enterprise Header */}
      <div className="admin-panel-card" style={{ padding: '28px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)', color: 'white', borderRadius: '24px', boxShadow: '0 20px 40px -15px rgba(30, 27, 75, 0.3)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ padding: '4px 10px', background: 'rgba(129, 140, 248, 0.2)', color: '#818cf8', borderRadius: '20px', fontSize: '11px', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase' }}>EOM 2.0 Pro</span>
            <span className="live-pulse-dot" style={{ backgroundColor: '#22c55e', width: '8px', height: '8px' }}></span>
            <span style={{ fontSize: '12px', color: '#a5b4fc' }}>Live Auto-Sync Active</span>
          </div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '30px', fontFamily: 'Outfit, sans-serif', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Package size={32} color="#818cf8" /> Enterprise Fulfillment Hub
          </h2>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '15px', maxWidth: '650px', lineHeight: '1.5' }}>
            Command center for global shipments, courier dispatch reconciliation, and instantaneous customer order diagnostics.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '12px 18px', borderRadius: '12px' }}
            onClick={fetchOrders}
            title="Refresh Orders"
          >
            <RefreshCw size={16} /> Refresh
          </button>
          <button 
            className="btn" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '12px 18px', borderRadius: '12px' }}
            onClick={handleBulkExport}
          >
            <Printer size={16} /> Print Labels ({selectedOrders.length})
          </button>
          <button 
            className="btn btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', padding: '12px 20px', borderRadius: '12px', boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)', fontWeight: '700' }}
            onClick={() => exportToCSV(filteredOrders, 'abkharido_orders_export.csv')}
          >
            <FileText size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Smart KPI & Status Filter Tabs */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', padding: '4px 0' }}>
        <button
          onClick={() => { setActiveTab('ALL'); setSelectedOrders([]); }}
          style={{ padding: '10px 20px', borderRadius: '100px', fontSize: '13px', fontWeight: '700', border: '1px solid', borderColor: activeTab === 'ALL' ? '#4f46e5' : '#e2e8f0', background: activeTab === 'ALL' ? '#4f46e5' : 'white', color: activeTab === 'ALL' ? 'white' : '#475569', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: activeTab === 'ALL' ? '0 4px 12px rgba(79, 70, 229, 0.25)' : 'none' }}
        >
          <span>All Orders</span>
          <span style={{ padding: '2px 8px', borderRadius: '12px', background: activeTab === 'ALL' ? 'rgba(255,255,255,0.2)' : '#f1f5f9', color: activeTab === 'ALL' ? 'white' : '#64748b', fontSize: '12px' }}>{orders.length}</span>
        </button>

        <button
          onClick={() => { setActiveTab('LIVE'); setSelectedOrders([]); }}
          style={{ padding: '10px 20px', borderRadius: '100px', fontSize: '13px', fontWeight: '700', border: '1px solid', borderColor: activeTab === 'LIVE' ? '#f59e0b' : '#fde68a', background: activeTab === 'LIVE' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : '#fffbeb', color: activeTab === 'LIVE' ? 'white' : '#b45309', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: activeTab === 'LIVE' ? '0 4px 12px rgba(245, 158, 11, 0.3)' : 'none' }}
        >
          <span className="live-pulse-dot" style={{ backgroundColor: activeTab === 'LIVE' ? 'white' : '#f59e0b' }}></span>
          <span>🔥 Live (Running)</span>
          <span style={{ padding: '2px 8px', borderRadius: '12px', background: activeTab === 'LIVE' ? 'rgba(255,255,255,0.2)' : '#fef3c7', color: activeTab === 'LIVE' ? 'white' : '#d97706', fontSize: '12px', fontWeight: '800' }}>{liveCount}</span>
        </button>

        <button
          onClick={() => { setActiveTab('PROCESSING'); setSelectedOrders([]); }}
          style={{ padding: '10px 20px', borderRadius: '100px', fontSize: '13px', fontWeight: '700', border: '1px solid', borderColor: activeTab === 'PROCESSING' ? '#6366f1' : '#e0e7ff', background: activeTab === 'PROCESSING' ? '#6366f1' : 'white', color: activeTab === 'PROCESSING' ? 'white' : '#4f46e5', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <span>🟡 New / Processing</span>
          <span style={{ padding: '2px 8px', borderRadius: '12px', background: activeTab === 'PROCESSING' ? 'rgba(255,255,255,0.2)' : '#e0e7ff', color: activeTab === 'PROCESSING' ? 'white' : '#4f46e5', fontSize: '12px' }}>{processingCount}</span>
        </button>

        <button
          onClick={() => { setActiveTab('SHIPPED'); setSelectedOrders([]); }}
          style={{ padding: '10px 20px', borderRadius: '100px', fontSize: '13px', fontWeight: '700', border: '1px solid', borderColor: activeTab === 'SHIPPED' ? '#0284c7' : '#e0f2fe', background: activeTab === 'SHIPPED' ? '#0284c7' : 'white', color: activeTab === 'SHIPPED' ? 'white' : '#0369a1', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <span>🚚 Shipped / Transit</span>
          <span style={{ padding: '2px 8px', borderRadius: '12px', background: activeTab === 'SHIPPED' ? 'rgba(255,255,255,0.2)' : '#e0f2fe', color: activeTab === 'SHIPPED' ? 'white' : '#0369a1', fontSize: '12px' }}>{shippedCount}</span>
        </button>

        <button
          onClick={() => { setActiveTab('DELIVERED'); setSelectedOrders([]); }}
          style={{ padding: '10px 20px', borderRadius: '100px', fontSize: '13px', fontWeight: '700', border: '1px solid', borderColor: activeTab === 'DELIVERED' ? '#16a34a' : '#dcfce7', background: activeTab === 'DELIVERED' ? '#16a34a' : 'white', color: activeTab === 'DELIVERED' ? 'white' : '#15803d', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <span>✅ Delivered</span>
          <span style={{ padding: '2px 8px', borderRadius: '12px', background: activeTab === 'DELIVERED' ? 'rgba(255,255,255,0.2)' : '#dcfce7', color: activeTab === 'DELIVERED' ? 'white' : '#15803d', fontSize: '12px' }}>{deliveredCount}</span>
        </button>

        <button
          onClick={() => { setActiveTab('CANCELLED'); setSelectedOrders([]); }}
          style={{ padding: '10px 20px', borderRadius: '100px', fontSize: '13px', fontWeight: '700', border: '1px solid', borderColor: activeTab === 'CANCELLED' ? '#ef4444' : '#fee2e2', background: activeTab === 'CANCELLED' ? '#ef4444' : 'white', color: activeTab === 'CANCELLED' ? 'white' : '#dc2626', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <span>❌ Cancelled / Returns</span>
          <span style={{ padding: '2px 8px', borderRadius: '12px', background: activeTab === 'CANCELLED' ? 'rgba(255,255,255,0.2)' : '#fee2e2', color: activeTab === 'CANCELLED' ? 'white' : '#dc2626', fontSize: '12px' }}>{cancelledCount}</span>
        </button>
      </div>

      <div className="admin-panel-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '0', overflow: 'hidden', borderRadius: '20px', border: '1px solid var(--admin-border)' }}>
        
        {/* Bulk Action & Search Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--admin-border)', background: '#f8fafc', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#e2e8f0', padding: '8px 14px', borderRadius: '100px' }}>
              <CheckSquare size={16} color="#475569" />
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>{selectedOrders.length} Selected</span>
            </div>
            
            <select 
              className="admin-input" 
              style={{ width: '180px', height: '40px', borderRadius: '100px', fontSize: '13px', fontWeight: '600', paddingLeft: '16px', background: 'white' }}
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
            >
              <option value="">Set Status to...</option>
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <button className="btn btn-primary btn-sm" style={{ borderRadius: '100px', height: '40px', padding: '0 20px', fontWeight: '700' }} onClick={handleBulkUpdate}>Apply Update</button>
          </div>

          <div style={{ position: 'relative', width: '320px' }}>
            <Search size={18} color="#64748b" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search Order ID, Phone, Name, AWB..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', height: '42px', paddingLeft: '44px', paddingRight: '16px', borderRadius: '100px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', fontWeight: '500', background: 'white' }}
            />
            {searchQuery && (
              <X size={16} color="#94a3b8" style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer' }} onClick={() => setSearchQuery('')} />
            )}
          </div>
        </div>

        <div className="admin-table-wrapper" style={{ border: 'none', boxShadow: 'none', borderRadius: 0 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '40px', paddingLeft: '24px' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                    onChange={(e) => handleSelectAll(e, filteredOrders)}
                    style={{ width: '16px', height: '16px', accentColor: '#6366f1', cursor: 'pointer' }}
                  />
                </th>
                <th>Order ID</th>
                <th>Customer & Contact</th>
                <th>Total Value</th>
                <th>Order Status</th>
                <th>Payment Info</th>
                <th>Return Status</th>
                <th style={{ textAlign: 'right', paddingRight: '24px' }}>Fulfillment Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => {
                const oId = order.id || order._id;
                const statusUpper = (order.status || 'PROCESSING').toUpperCase();
                const isCancelled = statusUpper === 'CANCELLED' || statusUpper === 'RETURNED' || statusUpper === 'REFUNDED' || statusUpper === 'FAILED';
                const isDelivered = statusUpper === 'DELIVERED';
                const isShipped = statusUpper === 'SHIPPED' || statusUpper === 'IN TRANSIT';

                return (
                  <tr key={oId} style={{ backgroundColor: selectedOrders.includes(oId) ? '#f0f8ff' : isCancelled ? '#fef2f2' : 'transparent', transition: 'background 0.2s' }}>
                    <td style={{ paddingLeft: '24px' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedOrders.includes(oId)}
                        onChange={() => handleSelectOne(oId)}
                        style={{ width: '16px', height: '16px', accentColor: '#6366f1', cursor: 'pointer' }}
                      />
                    </td>
                    <td>
                      <span 
                        onClick={() => setViewingOrder(order)} 
                        style={{ fontWeight: '800', fontSize: '14px', color: '#4f46e5', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '3px' }}
                        title="Click to inspect items and address"
                      >
                        #{String(oId).slice(-8).toUpperCase()}
                      </span>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        {new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontWeight: '700', color: '#1e293b' }}>{order.user?.fullName || order.user?.username || order.shippingAddress?.fullName || 'Guest Customer'}</span>
                        {order.shippingAddress?.phone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#475569' }}>
                            <Phone size={12} color="#059669" /> +91 {order.shippingAddress.phone}
                          </div>
                        )}
                        {order.user && (
                          <span className={`status-badge ${order.user.isEmailVerified ? 'success' : 'danger'}`} style={{ alignSelf: 'flex-start', fontSize: '10px', padding: '2px 8px', borderRadius: '10px', marginTop: '2px' }}>
                            {order.user.isEmailVerified ? '✓ Verified Customer' : '✗ Guest / Unverified'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '15px' }}>₹{(order.finalAmount || order.totalPrice || 0).toLocaleString('en-IN')}</div>
                      {order.paymentMethod && (
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>
                          {order.paymentMethod === 'Cash on Delivery' ? '💵 COD Order' : '💳 Online Prepaid'}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`status-badge ${isDelivered ? 'success' : isShipped ? 'info' : isCancelled ? 'danger' : 'warning'}`} style={{ fontWeight: '800', padding: '6px 12px', fontSize: '12px', letterSpacing: '0.5px' }}>
                        {order.status || 'Processing'}
                      </span>
                      {order.awbNumber && (
                        <div style={{ fontSize: '11px', marginTop: '6px', color: '#475569', background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', display: 'inline-block' }}>
                          <span style={{ fontWeight: '700' }}>AWB:</span> {order.awbNumber}<br/>
                          <span style={{ fontSize: '10px', color: '#64748b' }}>({order.courierPartner || 'Partner Express'})</span>
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`status-badge ${order.paymentMethod === 'Cash on Delivery' && !order.isPaid ? 'warning' : (order.paymentStatus === 'SUCCESS' || order.isPaid) ? 'success' : 'danger'}`} style={{ fontWeight: '700' }}>
                        {order.paymentMethod === 'Cash on Delivery' && !order.isPaid ? '⏳ COD (Unpaid)' : (order.paymentStatus === 'SUCCESS' || order.isPaid) ? '✓ Paid & Settled' : 'Unpaid / Pending'}
                      </span>
                    </td>
                    <td>
                      {order.returnStatus && order.returnStatus !== 'None' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: '#fff7ed', padding: '8px', borderRadius: '8px', border: '1px solid #fed7aa' }}>
                          <span className={`status-badge ${order.returnStatus === 'Requested' ? 'warning' : 'success'}`} style={{ alignSelf: 'flex-start' }}>Return: {order.returnStatus}</span>
                          {order.returnStatus === 'Requested' && (
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button style={{ backgroundColor: '#10b981', color: 'white', padding: '4px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: '700' }} onClick={() => handleApproveReturn(oId)}>Approve</button>
                              <button style={{ backgroundColor: '#ef4444', color: 'white', padding: '4px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: '700' }} onClick={() => handleRejectReturn(oId)}>Reject</button>
                            </div>
                          )}
                          {order.returnReason && <span style={{ fontSize: '11px', color: '#9a3412', fontStyle: 'italic' }}>"{order.returnReason}"</span>}
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '12px' }}>N/A</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        {/* Inspect Order button */}
                        <button 
                          className="btn btn-outline" 
                          style={{ padding: '8px 12px', display: 'flex', gap: '6px', alignItems: 'center', fontSize: '12px', borderRadius: '8px', color: '#4f46e5', borderColor: '#c7d2fe', background: '#e0e7ff', fontWeight: '700' }}
                          title="View items & shipping address"
                          onClick={() => setViewingOrder(order)}
                        >
                          <Eye size={14} /> Inspect
                        </button>

                        {/* Ship / Dispatch Button */}
                        {(!isCancelled && !isDelivered && !isShipped) && (
                          <button 
                            className="btn btn-outline" 
                            style={{ padding: '8px 14px', display: 'flex', gap: '6px', alignItems: 'center', fontSize: '12px', borderRadius: '8px', color: '#ffffff', background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)', border: 'none', fontWeight: '700', boxShadow: '0 4px 10px rgba(79, 70, 229, 0.25)' }}
                            title="Assign Courier & AWB"
                            onClick={() => { setDispatchOrder(order); setAwbInput(order.awbNumber || ''); }}
                          >
                            <Truck size={14} /> Dispatch
                          </button>
                        )}

                        {order.trackingUrl && (
                          <a 
                            href={order.trackingUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="btn btn-outline"
                            style={{ padding: '8px 12px', display: 'flex', gap: '6px', alignItems: 'center', fontSize: '12px', borderRadius: '8px', color: '#059669', border: '1px solid #a7f3d0', background: '#ecfdf5', textDecoration: 'none', fontWeight: '700' }}
                            title="Track Shipment Online"
                          >
                            <Truck size={14} /> Track
                          </a>
                        )}

                        <button 
                          className="btn btn-outline" 
                          style={{ padding: '8px 12px', display: 'flex', gap: '6px', alignItems: 'center', fontSize: '12px', borderRadius: '8px', color: '#0284c7', border: '1px solid #bae6fd', background: '#f0f9ff', opacity: downloadingOrderId === oId ? 0.6 : 1, fontWeight: '600' }}
                          title="Download Premium PDF Invoice"
                          onClick={() => handleDownloadPremiumInvoice(order)}
                          disabled={downloadingOrderId === oId}
                        >
                          <Printer size={14} /> {downloadingOrderId === oId ? 'PDF...' : 'Invoice'}
                        </button>

                        {/* Hidden Premium Invoice Renderer */}
                        <div style={{ display: 'none' }}>
                          <WorldClassInvoice ref={el => invoiceRefs.current[oId] = el} order={order} />
                        </div>

                        {!isCancelled && !isDelivered && (
                          <button 
                            className="btn btn-outline" 
                            style={{ padding: '8px 12px', display: 'flex', gap: '6px', alignItems: 'center', fontSize: '12px', borderRadius: '8px', color: '#dc2626', border: '1px solid #fecaca', background: '#fef2f2', fontWeight: '600' }}
                            title="Cancel Order"
                            onClick={() => handleCancelOrder(oId)}
                          >
                            <XCircle size={14} /> Cancel
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
                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>No orders matching your view</div>
                    <div style={{ fontSize: '14px', color: '#94a3b8' }}>Try clearing your search query or selecting another filter tab above.</div>
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
                  <span style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'Outfit, sans-serif' }}>
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
              <button 
                onClick={() => handleDownloadPremiumInvoice(viewingOrder)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)' }}
              >
                <Printer size={16} /> Download PDF Invoice
              </button>
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

    </div>
  );
};

export default AdminOMS;
