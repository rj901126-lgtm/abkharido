import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../context/AppContext';
import { 
  History, Calendar, CreditCard, ShieldCheck, ShoppingBag, Truck, 
  ChevronDown, ChevronUp, ChevronRight, Download, Search, Filter, 
  MessageCircle, RefreshCw, Star, CheckCircle, Clock, AlertTriangle, 
  ArrowRight, Edit3, QrCode, Copy, Mail, Share2, Award, FileText, Check
} from 'lucide-react';
import WorldClassInvoice from '../components/WorldClassInvoice';
import '../assets/styles/orders.css';

const Orders = ({ onNavigate }) => {
  const router = useRouter();
  const navigateTo = (path) => {
    if (onNavigate && typeof onNavigate === 'function') {
      onNavigate(path);
    } else if (path === 'home' || path === '') {
      router.push('/');
    } else if (!path.startsWith('/')) {
      router.push('/' + path);
    } else {
      router.push(path);
    }
  };

  const { orders, hasMoreOrders, currentUser, fetchOrders, addToCart, showToast } = useApp();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('Found a better price / deal elsewhere');
  
  // Return & RMA State with Refund Destination
  const [orderToReturn, setOrderToReturn] = useState(null); 
  const [returnReason, setReturnReason] = useState('Item defective / not working');
  const [refundMode, setRefundMode] = useState('Wallet'); // 'Wallet' | 'UPI'
  const [returnUpiId, setReturnUpiId] = useState('');
  
  // Address Edit State
  const [orderToEditAddress, setOrderToEditAddress] = useState(null);
  const [editAddressForm, setEditAddressForm] = useState({ fullName: '', phone: '', postalCode: '', address: '', city: '', state: '' });
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  
  // Size Exchange State
  const [orderToExchange, setOrderToExchange] = useState(null);
  const [exchangeForm, setExchangeForm] = useState({ requestedSize: 'UK 9 / L', reason: 'Size too small / tight' });
  const [isSubmittingExchange, setIsSubmittingExchange] = useState(false);
  
  // Delivery Preferences & Time Slot State
  const [orderToSetPreferences, setOrderToSetPreferences] = useState(null);
  const [preferencesForm, setPreferencesForm] = useState({ slot: 'Anytime (9 AM - 9 PM)', instructions: 'Call before delivery' });
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);

  // Live Tracking Timeline Activity Log Modal State
  const [trackingTimelineOrder, setTrackingTimelineOrder] = useState(null);

  // QR Code PIN Modal State
  const [qrCodePinOrder, setQrCodePinOrder] = useState(null);

  // Brand Warranty & Authenticity Pass State
  const [warrantyOrder, setWarrantyOrder] = useState(null);

  // Item Review Modal State
  const [itemToReview, setItemToReview] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTags, setReviewTags] = useState(['Super Fast Delivery', '100% Genuine']);
  const [reviewComment, setReviewComment] = useState('');

  // Emailing Invoice State
  const [emailingInvoiceId, setEmailingInvoiceId] = useState(null);
  const [copiedPinId, setCopiedPinId] = useState(null);
  const [convertingOrderId, setConvertingOrderId] = useState(null);
  const [isFetching, setIsFetching] = useState(false);


  // Debounce search input
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch orders when user or filters change
  React.useEffect(() => {
    if (currentUser) {
      setCurrentPage(1);
      setIsFetching(true);
      fetchOrders(currentUser.username || currentUser.email, 1, debouncedSearch, statusFilter, timeFilter)
        .finally(() => setIsFetching(false));
    }
  }, [currentUser, debouncedSearch, statusFilter, timeFilter]);


  // Client-side instant filtering on top of server data
  const filteredOrders = React.useMemo(() => {
    return (orders || []).filter(order => {
      if (!order) return false;

      // 1. Search Query
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase().trim();
        const matchesId = (order._id || '').toLowerCase().includes(q);
        const matchesItem = (order.orderItems || []).some(item => (item?.name || '').toLowerCase().includes(q));
        const matchesCourier = (order.courierPartner || '').toLowerCase().includes(q) || (order.awbNumber || '').toLowerCase().includes(q);
        if (!matchesId && !matchesItem && !matchesCourier) return false;
      }

      // 2. Status Filter
      if (statusFilter !== 'all') {
        const s = (order.status || '').toLowerCase();
        if (statusFilter === 'delivered' && s !== 'delivered') return false;
        if (statusFilter === 'processing' && (s === 'delivered' || s === 'cancelled' || s === 'returned')) return false;
        if (statusFilter === 'cancelled' && s !== 'cancelled' && s !== 'returned') return false;
      }

      // 3. Date / Time Filter
      if (timeFilter !== 'all') {
        const orderDate = new Date(order.createdAt).getTime();
        const now = Date.now();
        if (timeFilter === '30days' && now - orderDate > 30 * 24 * 60 * 60 * 1000) return false;
        if (timeFilter === '3months' && now - orderDate > 90 * 24 * 60 * 60 * 1000) return false;
        if (timeFilter === '6months' && now - orderDate > 180 * 24 * 60 * 60 * 1000) return false;
        if (timeFilter === '2026' && new Date(order.createdAt).getFullYear() !== 2026) return false;
        if (timeFilter === '2025' && new Date(order.createdAt).getFullYear() !== 2025) return false;
        if (timeFilter === 'custom') {
          if (customStartDate) {
            const start = new Date(customStartDate).getTime();
            if (orderDate < start) return false;
          }
          if (customEndDate) {
            const end = new Date(customEndDate);
            end.setHours(23, 59, 59, 999);
            if (orderDate > end.getTime()) return false;
          }
        }
      }
      return true;
    });
  }, [orders, debouncedSearch, statusFilter, timeFilter, customStartDate, customEndDate]);

  // Order summary metrics
  const totalOrdersCount = orders ? orders.length : 0;
  const activeInTransitCount = (orders || []).filter(o => o?.status !== 'Delivered' && o?.status !== 'Cancelled' && o?.status !== 'CANCELLED' && o?.status !== 'Returned').length;
  const totalDeliveredCount = (orders || []).filter(o => o?.status === 'Delivered').length;
  const totalCancelledCount = (orders || []).filter(o => o?.status === 'Cancelled' || o?.status === 'CANCELLED' || o?.status === 'Returned').length;
  const totalSpentAmount = (orders || []).reduce((acc, o) => o?.status !== 'Cancelled' && o?.status !== 'CANCELLED' ? acc + (o?.totalPrice || o?.finalAmount || o?.totalAmount || o?.amount || 0) : acc, 0);

  const loadMoreOrders = () => {
    const next = currentPage + 1;
    setCurrentPage(next);
    fetchOrders(currentUser.username || currentUser.email, next, debouncedSearch, statusFilter, timeFilter);
  };

  const invoiceRefs = useRef({});
  const [downloadingOrderId, setDownloadingOrderId] = useState(null);

  const handleDownloadInvoice = (orderId) => {
    const ref = invoiceRefs.current[orderId];
    if (ref && !downloadingOrderId) {
      setDownloadingOrderId(orderId);
      ref.generatePDF().finally(() => setDownloadingOrderId(null));
    }
  };

  const handleEmailInvoice = async (orderId) => {
    setEmailingInvoiceId(orderId);
    const token = currentUser?.token || (typeof window !== 'undefined' ? (localStorage.getItem('abkharido_token') || localStorage.getItem('abkharido_user_session')) : null);
    try {
      const res = await fetch(`/api/orders/${orderId}/email-invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast(`📧 ${data.message || 'Invoice sent to your email!'}`, 'success');
      } else {
        showToast(data.error || data.message || 'Failed to email invoice.', 'error');
      }
    } catch (_err) {
      showToast('Network error emailing invoice.', 'error');
    } finally {
      setEmailingInvoiceId(null);
    }
  };

  const handleCopyPin = (pin, orderId) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(pin);
      setCopiedPinId(orderId);
      showToast(`📋 PIN ${pin} copied to clipboard!`, 'info');
      setTimeout(() => setCopiedPinId(null), 3000);
    }
  };

  const handleShareOnWhatsApp = (order) => {
    const pin = order.deliveryPin || (order._id ? order._id.replace(/\D/g, '').slice(-4) || '8492' : '8492');
    const msg = `📦 Track my AbKharido.com Order #${order._id.slice(-6).toUpperCase()}\nItems: ${order.orderItems?.map(i => i.name).join(', ')}\nAmount: ₹${order.totalPrice?.toLocaleString('en-IN')}\nDoorstep PIN: ${pin}\nStatus: ${order.status}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleConvertCodToPrepaid = async (orderId) => {
    setConvertingOrderId(orderId);
    const token = currentUser?.token || (typeof window !== 'undefined' ? (localStorage.getItem('abkharido_token') || localStorage.getItem('abkharido_user_session')) : null);
    try {
      const res = await fetch(`/api/orders/${orderId}/convert-to-prepaid`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        }
      });
      if (res.ok) {
        showToast('🎉 Converted to Prepaid! 50 AB Coins added to your wallet & contactless delivery activated.', 'success');
        fetchOrders();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || err.message || 'Failed to convert payment mode', 'error');
      }
    } catch (_err) {
      showToast('Network error while converting payment.', 'error');
    } finally {
      setConvertingOrderId(null);
    }
  };

  const handleOpenEditAddress = (order) => {
    setOrderToEditAddress(order);
    const addr = order.shippingAddress || {};
    setEditAddressForm({
      fullName: addr.fullName || addr.name || '',
      phone: addr.phone || currentUser?.phone || '',
      postalCode: addr.postalCode || addr.pincode || '',
      address: addr.address || addr.streetAddress || '',
      city: addr.city || '',
      state: addr.state || ''
    });
  };

  const handlePincodeLookup = (pin) => {
    const cleanPin = pin.replace(/\D/g, '').slice(0, 6);
    setEditAddressForm(prev => ({ ...prev, postalCode: cleanPin }));
    if (cleanPin.length === 6) {
      fetch(`https://api.postalpincode.in/pincode/${cleanPin}`)
        .then(res => res.json())
        .then(data => {
          if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
            const district = data[0].PostOffice[0].District || '';
            const state = data[0].PostOffice[0].State || '';
            setEditAddressForm(prev => ({
              ...prev,
              city: district || prev.city,
              state: state || prev.state
            }));
            showToast(`📍 Verified postal hub: ${district}, ${state}`, 'info');
          }
        })
        .catch(() => {});
    }
  };

  const handleSaveAddress = async () => {
    if (!orderToEditAddress) return;
    if (!editAddressForm.fullName || !editAddressForm.address || !editAddressForm.postalCode) {
      showToast('Please fill all mandatory address fields.', 'warning');
      return;
    }
    if (!/^[1-9][0-9]{5}$/.test(String(editAddressForm.postalCode).trim())) {
      showToast('Please enter a valid 6-digit Indian PIN code.', 'error');
      return;
    }
    setIsSavingAddress(true);
    const token = currentUser?.token || (typeof window !== 'undefined' ? (localStorage.getItem('abkharido_token') || localStorage.getItem('abkharido_user_session')) : null);
    try {
      const res = await fetch(`/api/orders/${orderToEditAddress._id}/update-address`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editAddressForm)
      });
      if (res.ok) {
        showToast('✅ Shipping Address updated successfully!', 'success');
        setOrderToEditAddress(null);
        fetchOrders();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || err.message || 'Failed to update address', 'error');
      }
    } catch (_err) {
      showToast('Network error updating address.', 'error');
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!orderToSetPreferences) return;
    setIsSavingPreferences(true);
    const token = currentUser?.token || (typeof window !== 'undefined' ? (localStorage.getItem('abkharido_token') || localStorage.getItem('abkharido_user_session')) : null);
    try {
      const res = await fetch(`/api/orders/${orderToSetPreferences._id}/delivery-instructions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(preferencesForm)
      });
      if (res.ok) {
        showToast('📅 Delivery preferences saved! Courier alerted.', 'success');
        setOrderToSetPreferences(null);
        fetchOrders();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || err.message || 'Failed to update preferences', 'error');
      }
    } catch (_err) {
      showToast('Network error saving preferences.', 'error');
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const handleSubmitExchange = async () => {
    if (!orderToExchange) return;
    if (!exchangeForm.requestedSize) {
      showToast('Please select a replacement size/variant.', 'warning');
      return;
    }
    setIsSubmittingExchange(true);
    const token = currentUser?.token || (typeof window !== 'undefined' ? (localStorage.getItem('abkharido_token') || localStorage.getItem('abkharido_user_session')) : null);
    try {
      const res = await fetch(`/api/orders/${orderToExchange._id}/exchange`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(exchangeForm)
      });
      if (res.ok) {
        showToast('🔄 Exchange request submitted! Free doorstep pickup scheduled.', 'success');
        setOrderToExchange(null);
        fetchOrders();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || err.message || 'Failed to submit exchange', 'error');
      }
    } catch (_err) {
      showToast('Network error submitting exchange.', 'error');
    } finally {
      setIsSubmittingExchange(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!orderToCancel) return;
    const token = currentUser?.token || (typeof window !== 'undefined' ? (localStorage.getItem('abkharido_token') || localStorage.getItem('abkharido_user_session')) : null);
    try {
      const res = await fetch(`/api/orders/${orderToCancel}/user-cancel`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ reason: cancellationReason })
      });
      if (res.ok) {
        showToast('Order cancelled successfully', 'success');
        setOrderToCancel(null);
        fetchOrders();
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(`Failed to cancel: ${data.error || 'Unknown error'}`, 'error');
      }
    } catch (_err) {
      showToast('Network error while cancelling', 'error');
    }
  };

  const handleRequestReturn = async () => {
    if (!orderToReturn) return;
    if (refundMode === 'UPI' && !returnUpiId.trim()) {
      showToast('Please enter a valid UPI ID (e.g. mobile@upi).', 'warning');
      return;
    }
    const token = currentUser?.token || (typeof window !== 'undefined' ? (localStorage.getItem('abkharido_token') || localStorage.getItem('abkharido_user_session')) : null);
    try {
      const res = await fetch(`/api/orders/${orderToReturn._id || orderToReturn}/return`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          reason: returnReason,
          refundDestination: {
            type: refundMode,
            upiId: returnUpiId.trim()
          }
        })
      });
      if (res.ok) {
        showToast(`Return requested! 100% Refund will route to ${refundMode === 'Wallet' ? 'AB Coins Wallet (+5% bonus)' : returnUpiId}.`, 'success');
        setOrderToReturn(null);
        setReturnReason('');
        setReturnUpiId('');
        fetchOrders();
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(`Failed to request return: ${data.error || 'Unknown error'}`, 'error');
      }
    } catch (_err) {
      showToast('Network error while requesting return', 'error');
    }
  };

  const [isLoading, setIsLoading] = React.useState(true);
  React.useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  if (isLoading) {
    return (
      <div className="orders-page" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #e0e7ff', borderTop: '4px solid #4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <div style={{ color: '#64748b', fontWeight: '500' }}>Loading your orders...</div>
      </div>
    );
  }

  return (
    <>
    <div className="orders-page-wrapper animate-fade-in">

      {/* 🌟 Modern Hero Orders Header */}
      <div className="orders-hero-header">
        <div className="orders-hero-top">
          <div className="orders-hero-title-group">
            <div className="orders-hero-icon">
              <History size={20} color="#ffffff" />
            </div>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: '900', color: '#ffffff', fontFamily: "'Outfit', sans-serif", margin: 0, lineHeight: 1.2 }}>My Orders</h1>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Track live shipments, download tax invoices & request returns</span>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="orders-hero-badges">
            <span className="orders-hero-badge">
              Total: <strong style={{ color: '#ffffff' }}>{totalOrdersCount}</strong>
            </span>
            <span className="orders-hero-badge">
              In Transit: <strong style={{ color: '#38bdf8' }}>{activeInTransitCount}</strong>
            </span>
            <span className="orders-hero-badge">
              Spent: <strong style={{ color: '#4ade80' }}>₹{totalSpentAmount.toLocaleString('en-IN')}</strong>
            </span>
          </div>
        </div>

        {/* Search & Filter Tabs */}
        {(orders.length > 0 || searchQuery !== '' || statusFilter !== 'all' || timeFilter !== 'all') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="orders-search-filter-row">
              <div className="orders-search-bar">
                <Search size={15} color="rgba(255,255,255,0.6)" />
                <input
                  type="text"
                  placeholder="Search orders, items, AWB..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="orders-search-input"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>
                    ✕
                  </button>
                )}
              </div>

              {/* Date Filter Dropdown */}
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: '700',
                  outline: 'none',
                  cursor: 'pointer',
                  height: '100%'
                }}
              >
                <option value="all" style={{ background: '#1e1b4b', color: 'white' }}>📅 All Time</option>
                <option value="30days" style={{ background: '#1e1b4b', color: 'white' }}>Past 30 Days</option>
                <option value="3months" style={{ background: '#1e1b4b', color: 'white' }}>Past 3 Months</option>
                <option value="6months" style={{ background: '#1e1b4b', color: 'white' }}>Past 6 Months</option>
                <option value="2026" style={{ background: '#1e1b4b', color: 'white' }}>Year 2026</option>
                <option value="2025" style={{ background: '#1e1b4b', color: 'white' }}>Year 2025</option>
              </select>
            </div>

            {/* Status Filter Chips */}
            <div className="orders-tabs-row">
              {[
                { v: 'all', l: `All (${totalOrdersCount})` },
                { v: 'processing', l: `In Progress (${activeInTransitCount}) 🚚` },
                { v: 'delivered', l: `Delivered (${totalDeliveredCount}) ✅` },
                { v: 'cancelled', l: `Cancelled (${totalOrdersCount - activeInTransitCount - totalDeliveredCount}) ❌` }
              ].map(opt => (
                <button
                  key={opt.v}
                  onClick={() => setStatusFilter(opt.v)}
                  className={`orders-tab-btn ${statusFilter === opt.v ? 'active' : ''}`}
                >
                  {opt.l}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {isFetching ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ width: '32px', height: '32px', border: '3px solid #e0e7ff', borderTop: '3px solid #4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '12px' }}></div>
          <div style={{ color: '#64748b', fontSize: '13px', fontWeight: '600' }}>Fetching orders...</div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px 80px 20px', textAlign: 'center' }}>
          <div style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #1e1b4b 0%, #4f46e5 100%)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', boxShadow: '0 12px 36px rgba(79, 70, 229, 0.25)' }}>
            <ShoppingBag size={38} color="#ffffff" strokeWidth={1.5} />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#090d16', fontFamily: "'Outfit', sans-serif", marginBottom: '6px' }}>
            {searchQuery || statusFilter !== 'all' || timeFilter !== 'all' ? 'No Matching Orders' : 'No Orders Placed Yet'}
          </h2>
          <p style={{ color: '#64748b', fontSize: '13px', maxWidth: '300px', lineHeight: '1.4', marginBottom: '20px' }}>
            {searchQuery || statusFilter !== 'all' || timeFilter !== 'all'
              ? "Try clearing filters or search queries."
              : "Discover trending electronics, fashion & daily essentials."}
          </p>
          <button
            onClick={() => { setSearchQuery(''); setStatusFilter('all'); setTimeFilter('all'); navigateTo('home'); }}
            style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', color: 'white', border: 'none', borderRadius: '24px', fontSize: '13.5px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 6px 18px rgba(79, 70, 229, 0.3)', fontFamily: "'Outfit', sans-serif" }}
          >
            🛍️ Explore Deals
          </button>
        </div>
      ) : (
      <>
      {/* 🌟 Responsive Clean Orders List */}
      <div>


        {filteredOrders.map(order => {
          const isExpanded = expandedOrderId === order._id;
          const pin = order.deliveryPin || (order._id ? order._id.replace(/\D/g, '').slice(-4) || '8492' : '8492');
          const isCancelled = order.status === 'Cancelled' || order.status === 'CANCELLED';
          const isDelivered = order.status === 'Delivered';
          const itemsList = order.orderItems || order.items || [];
          const firstItem = itemsList[0] || {};
          const totalItems = itemsList.length || 1;
          const firstItemName = firstItem.name || firstItem.title || (typeof firstItem.product === 'object' ? firstItem.product?.name : '') || 'Ordered Items';
          const firstItemImage = firstItem.image || (Array.isArray(firstItem.images) ? firstItem.images[0] : '') || (typeof firstItem.product === 'object' ? firstItem.product?.image : '') || '';
          const orderPrice = order.totalPrice || order.finalAmount || order.totalAmount || order.amount || (itemsList.reduce((acc, i) => acc + (i.price || 0) * (i.qty || i.quantity || 1), 0)) || 0;
          const orderQty = firstItem.qty || firstItem.quantity || 1;

          return (
          <div 
            key={order._id} 
            className={`ak-order-card ${isExpanded ? 'expanded' : ''}`}
          >
            {/* 1. Card Top Header */}
            <div className="ak-card-header">
              <div className="ak-order-id-group">
                <span className="ak-order-id">
                  #{order._id.slice(-8).toUpperCase()}
                </span>
                <span className="ak-order-date">
                  • {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>

              <span className={`ak-status-badge ${isDelivered ? 'delivered' : isCancelled ? 'cancelled' : 'processing'}`}>
                {isDelivered ? '✅ Delivered' : isCancelled ? '❌ Cancelled' : `🚚 ${order.status || 'Processing'}`}
              </span>
            </div>
            
            {/* 2. Product Body (Click to expand details) */}
            <div 
              className="ak-card-body"
              onClick={() => setExpandedOrderId(isExpanded ? null : order._id)}
            >
              <div className="ak-card-thumb">
                {firstItemImage ? (
                  <img src={firstItemImage} alt={firstItemName} />
                ) : (
                  <ShoppingBag size={24} color="#94a3b8" />
                )}
                {totalItems > 1 && (
                  <span style={{ position: 'absolute', bottom: '2px', right: '2px', background: '#1e1b4b', color: '#ffffff', fontSize: '9px', fontWeight: '800', padding: '1px 5px', borderRadius: '4px' }}>
                    +{totalItems - 1}
                  </span>
                )}
              </div>

              <div className="ak-card-info">
                <div className="ak-item-title">
                  {firstItemName}
                </div>

                <div className="ak-item-meta" style={{ marginTop: '4px' }}>
                  <span className="ak-item-price">
                    ₹{orderPrice.toLocaleString('en-IN')}
                  </span>
                  <span>• Qty: {orderQty}</span>
                  <span>• {order.paymentMethod || 'Online'}</span>
                </div>


                <div className={`ak-delivery-status-note ${isDelivered ? 'delivered' : isCancelled ? 'cancelled' : 'active'}`}>
                  {isDelivered 
                    ? 'Delivered safely at your doorstep' 
                    : isCancelled 
                    ? 'Order cancelled • 100% Refund processed' 
                    : `Estimated delivery: ${new Date(Date.now() + 3*24*60*60*1000).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}`}
                </div>
              </div>

            </div>

            {/* 3. Action Buttons Row */}
            <div className="ak-card-actions">
              <button
                className="ak-btn-action ak-btn-secondary"
                onClick={() => handleDownloadInvoice(order._id)}
                disabled={downloadingOrderId === order._id}
                title="Download GST Invoice"
              >
                <Download size={13} /> {downloadingOrderId === order._id ? '...' : 'Invoice'}
              </button>

              <button
                className="ak-btn-action ak-btn-primary"
                onClick={() => {
                  const itemsToReorder = order.orderItems || order.items || [];
                  if (itemsToReorder.length > 0) {
                    itemsToReorder.forEach(item => {
                      const prodId = typeof item.product === 'object' ? (item.product?._id || item.product?.id) : (item.product || item.id || item._id);
                      const prodName = item.name || item.title || (typeof item.product === 'object' ? item.product?.name : 'Product');
                      const prodPrice = item.price || (typeof item.product === 'object' ? item.product?.price : 0) || 0;
                      const prodImage = item.image || (Array.isArray(item.images) ? item.images[0] : '') || (typeof item.product === 'object' ? item.product?.image : '');
                      addToCart({ id: prodId, name: prodName, price: prodPrice, image: prodImage, originalPrice: prodPrice }, item.qty || item.quantity || 1);
                    });
                    showToast('Items added back to cart! 🛍️', 'success');
                    navigateTo('cart');
                  }
                }}
                title="Buy items again"
              >
                <RefreshCw size={13} /> Buy Again
              </button>

              <button
                className={`ak-btn-action ak-btn-details ${isExpanded ? 'active' : ''}`}
                onClick={() => setExpandedOrderId(isExpanded ? null : order._id)}
              >
                {isExpanded ? 'Hide' : 'Details'} {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            {/* 🌟 Structured 2-Column Space-Efficient Expanded Dashboard */}
            {isExpanded && (
            <div style={{ padding: '14px 16px', background: '#fafbfc', borderTop: '1px solid #f1f5f9' }}>
              
              {/* Meta Ribbon */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px', background: '#ffffff', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '10.5px', fontWeight: '700' }}>ORDER PLACED: </span>
                    <strong style={{ color: '#0f172a' }}>{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '10.5px', fontWeight: '700' }}>TOTAL: </span>
                    <strong style={{ color: '#059669' }}>₹{(order.totalPrice || 0).toLocaleString('en-IN')}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '10.5px', fontWeight: '700' }}>SHIP TO: </span>
                    <strong style={{ color: '#0f172a' }}>{order.shippingAddress?.fullName || order.shippingAddress?.name || 'Customer'}</strong>
                    {(!isCancelled && !isDelivered) && (
                      <button
                        onClick={() => handleOpenEditAddress(order)}
                        style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', padding: '0 4px', fontSize: '10.5px', fontWeight: '800', textDecoration: 'underline' }}
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '10.5px', fontWeight: '700' }}>PAYMENT: </span>
                    <strong style={{ color: '#334155' }}>{order.paymentMethod || 'Online'} {order.isPaid ? '• PAID ✓' : '• COD'}</strong>
                  </div>
                </div>
              </div>

              {/* 2-Column Responsive Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                
                {/* 📍 Left Column: Live Milestone Timeline & Doorstep PIN */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  
                  {/* Milestone Tracker Card */}
                  <div style={{ background: '#ffffff', borderRadius: '12px', padding: '14px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                        {isCancelled ? '❌ Order Cancelled' : isDelivered ? '✅ Delivered Safely' : `🚚 Status: ${order.status || 'Processing'}`}
                      </div>
                      {!isCancelled && (
                        <button
                          onClick={() => setTrackingTimelineOrder(order)}
                          style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', padding: '3px 8px', borderRadius: '6px', fontSize: '10.5px', fontWeight: '700', cursor: 'pointer' }}
                        >
                          📜 Log
                        </button>
                      )}
                    </div>

                    {!isCancelled ? (
                      <div>
                        {/* 4-Step Progress Dots */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', textAlign: 'center', position: 'relative' }}>
                          {[
                            { label: 'Placed', icon: '📝', done: true },
                            { label: 'Packed', icon: '📦', done: order.status === 'Packed' || order.status === 'Shipped' || order.status === 'In Transit' || order.status === 'Delivered' },
                            { label: 'In Transit', icon: '🚚', done: order.status === 'Shipped' || order.status === 'In Transit' || order.status === 'Delivered' },
                            { label: 'Delivered', icon: '🎉', done: order.status === 'Delivered' }
                          ].map((st, i) => (
                            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <div style={{
                                width: '28px', height: '28px', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px',
                                background: st.done ? '#059669' : '#f1f5f9',
                                color: st.done ? '#ffffff' : '#94a3b8',
                                border: st.done ? '2px solid #a7f3d0' : '1px solid #cbd5e1',
                                fontWeight: '800'
                              }}>
                                {st.done ? '✓' : i + 1}
                              </div>
                              <span style={{ fontSize: '10px', fontWeight: '700', color: st.done ? '#0f172a' : '#94a3b8', marginTop: '4px' }}>
                                {st.label}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Courier Partner & Live Tracking Link */}
                        <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#64748b' }}>
                          <span>Courier: <strong style={{ color: '#0f172a' }}>{order.courierPartner || 'Delhivery Express'}</strong></span>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button 
                              onClick={() => handleShareOnWhatsApp(order)}
                              style={{ color: '#25D366', fontWeight: '800', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '3px 6px', borderRadius: '6px', cursor: 'pointer', fontSize: '10.5px' }}
                            >
                              WhatsApp
                            </button>
                            <a 
                              href={order.trackingUrl || `https://track.delhivery.com/p/${order.awbNumber || '87492104'}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={{ color: '#4f46e5', fontWeight: '800', textDecoration: 'none', background: '#eef2ff', border: '1px solid #c7d2fe', padding: '3px 6px', borderRadius: '6px', fontSize: '10.5px' }}
                            >
                              Live AWB ↗
                            </a>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '11.5px', color: '#991b1b', lineHeight: 1.4 }}>
                        🛑 Cancelled. Any pre-captured payment has been auto-refunded to your bank.
                      </div>
                    )}
                  </div>

                  {/* Doorstep Verification PIN (Compact Box) */}
                  {!isCancelled && !isDelivered && (
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px' }}>🛡️</span>
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: '800', color: '#065f46' }}>Delivery PIN</div>
                          <div style={{ fontSize: '10px', color: '#047857' }}>Share with courier at doorstep</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ background: '#ffffff', border: '1.5px dashed #059669', borderRadius: '6px', padding: '3px 8px', fontSize: '14px', fontWeight: '900', color: '#065f46', fontFamily: 'monospace', letterSpacing: '2px' }}>
                          {pin}
                        </span>
                        <button
                          onClick={() => handleCopyPin(pin, order._id)}
                          style={{ background: '#ffffff', border: '1px solid #bbf7d0', padding: '4px 8px', borderRadius: '6px', fontSize: '10.5px', fontWeight: '700', color: '#065f46', cursor: 'pointer' }}
                        >
                          {copiedPinId === order._id ? 'Copied' : 'Copy'}
                        </button>
                        <button
                          onClick={() => setQrCodePinOrder(order)}
                          style={{ background: '#059669', color: '#ffffff', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '10.5px', fontWeight: '700', cursor: 'pointer' }}
                        >
                          QR
                        </button>
                      </div>
                    </div>
                  )}

                  {/* COD to Prepaid Banner (if applicable) */}
                  {(order.paymentMethod && (order.paymentMethod.toLowerCase().includes('cod') || order.paymentMethod.toLowerCase().includes('cash'))) && !order.isPaid && !isCancelled && !isDelivered && (
                    <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <div style={{ fontSize: '11px', color: '#92400e' }}>
                        <strong>⚡ Pay Online via UPI</strong>: Get 50 Coins cashback!
                      </div>
                      <button
                        onClick={() => handleConvertCodToPrepaid(order._id)}
                        disabled={convertingOrderId === order._id}
                        style={{ background: '#d97706', color: '#ffffff', border: 'none', padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}
                      >
                        {convertingOrderId === order._id ? '...' : `Pay ₹${(order.totalPrice || 0).toLocaleString('en-IN')}`}
                      </button>
                    </div>
                  )}
                </div>

                {/* 📦 Right Column: Items & Payment Breakdown */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  
                  {/* Items List */}
                  <div style={{ background: '#ffffff', borderRadius: '12px', padding: '12px 14px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Items ({(order.orderItems || order.items || []).length})
                    </div>
                    {(order.orderItems || order.items || []).map((item, index) => {
                      const itemTitle = item?.name || item?.title || (typeof item?.product === 'object' ? item?.product?.name : '') || 'Item';
                      const itemImg = item?.image || (Array.isArray(item?.images) ? item.images[0] : '') || (typeof item?.product === 'object' ? item?.product?.image : '') || '';
                      const itemUnitPrice = item?.price || (typeof item?.product === 'object' ? item?.product?.price : 0) || 0;
                      const itemQuantity = item?.qty || item?.quantity || 1;
                      const allItems = order.orderItems || order.items || [];

                      return (
                        <div key={item.product || item.id || index} style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '6px 0', borderBottom: index < (allItems.length - 1) ? '1px solid #f1f5f9' : 'none' }}>
                          <div style={{ width: '42px', height: '42px', borderRadius: '8px', overflow: 'hidden', background: '#f8fafc', flexShrink: 0, padding: '2px', border: '1px solid #e2e8f0' }}>
                            {itemImg ? (
                              <img src={itemImg} alt={itemTitle} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            ) : (
                              <ShoppingBag size={20} color="#94a3b8" style={{ margin: 'auto' }} />
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{itemTitle}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>
                              Qty: <strong>{itemQuantity}</strong> • <strong style={{ color: '#059669' }}>₹{itemUnitPrice.toLocaleString('en-IN')}</strong>
                            </div>
                          </div>
                          {isDelivered && (
                            <button
                              onClick={() => { setItemToReview(item); setReviewRating(5); setReviewComment(''); }}
                              style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#b45309', borderRadius: '6px', fontSize: '10.5px', fontWeight: '800', padding: '3px 6px', cursor: 'pointer', flexShrink: 0 }}
                            >
                              ⭐ Rate
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Payment Breakdown */}
                  <div style={{ background: '#ffffff', borderRadius: '12px', padding: '10px 14px', border: '1px solid #e2e8f0', fontSize: '11.5px', color: '#64748b' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span>Items MRP</span>
                      <span style={{ fontWeight: '700', color: '#0f172a' }}>₹{(order.itemsPrice || order.totalPrice || 0).toLocaleString('en-IN')}</span>
                    </div>
                    {order.appliedCoupon && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', marginBottom: '3px' }}>
                        <span>Coupon ({order.appliedCoupon})</span>
                        <span style={{ fontWeight: '800' }}>- ₹{((order.itemsPrice || order.totalPrice) * 0.1).toFixed(0)}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span>Delivery</span>
                      <span style={{ fontWeight: '800', color: '#059669' }}>FREE</span>
                    </div>
                    <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '4px', display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', fontWeight: '900', color: '#0f172a' }}>
                      <span>Total Paid</span>
                      <span style={{ color: '#059669' }}>₹{(order.totalPrice || 0).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Actions Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {/* Warranty Pass */}
                  <button
                    onClick={() => setWarrantyOrder(order)}
                    style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', color: '#6d28d9', padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Award size={12} /> Warranty Pass
                  </button>

                  {/* WhatsApp Support */}
                  <a
                    href={`https://wa.me/919172600587?text=${encodeURIComponent(`Hi AbKharido, order #${order._id}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 10px', background: '#25D366', color: '#ffffff', borderRadius: '6px', textDecoration: 'none', fontSize: '11px', fontWeight: '800' }}
                  >
                    <MessageCircle size={12} /> Support
                  </a>
                </div>

                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* Cancel */}
                  {!isDelivered && order.status !== 'In Transit' && order.status !== 'Shipped' && !isCancelled && (
                    <button
                      style={{ background: '#fff1f2', border: '1px solid #fecdd3', color: '#ef4444', fontSize: '11px', fontWeight: '700', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer' }}
                      onClick={() => setOrderToCancel(order._id)}
                    >
                      Cancel
                    </button>
                  )}

                  {/* Return */}
                  {isDelivered && (!order.returnStatus || order.returnStatus === 'None') && (
                    <button
                      style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#b45309', fontSize: '11px', fontWeight: '700', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer' }}
                      onClick={() => { setOrderToReturn(order); setReturnReason('Item defective'); setRefundMode('Wallet'); setReturnUpiId(''); }}
                    >
                      Return
                    </button>
                  )}

                  {/* Email Invoice */}
                  <button
                    onClick={() => handleEmailInvoice(order._id)}
                    disabled={emailingInvoiceId === order._id}
                    style={{ background: '#ffffff', border: '1px solid #cbd5e1', color: '#334155', fontSize: '11px', fontWeight: '700', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Mail size={12} /> Email
                  </button>

                  {/* PDF Download */}
                  <button
                    className="btn btn-primary"
                    onClick={() => handleDownloadInvoice(order._id)}
                    disabled={downloadingOrderId === order._id}
                    style={{ fontSize: '11px', fontWeight: '800', padding: '5px 12px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Download size={12} /> {downloadingOrderId === order._id ? '...' : 'PDF Invoice'}
                  </button>
                </div>
              </div>
            </div>
            )}

            {/* Hidden Invoice PDF Generator (accessible always) */}
            <WorldClassInvoice ref={el => invoiceRefs.current[order._id] = el} order={order} />
          </div>
          );
        })}
      </div>
      
      {hasMoreOrders && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px' }}>
          <button 
            className="btn btn-primary" 
            style={{ padding: '12px 24px', borderRadius: '30px', fontWeight: 'bold' }}
            onClick={loadMoreOrders}
          >
            Load More Orders <ChevronDown size={18} style={{ marginLeft: '8px' }} />
          </button>
        </div>
      )}
      </>
      )}
      </div>
      
      {/* ✏️ Modal 1: Edit Delivery Address */}
      {orderToEditAddress && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setOrderToEditAddress(null)}>
          <div style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '440px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', margin: 0 }}>✏️ Update Delivery Address</h3>
              <button onClick={() => setOrderToEditAddress(null)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Recipient Full Name *</label>
                <input
                  type="text"
                  value={editAddressForm.fullName}
                  onChange={(e) => setEditAddressForm(prev => ({ ...prev, fullName: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '14px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>10-Digit Mobile Number *</label>
                <input
                  type="tel"
                  maxLength={10}
                  value={editAddressForm.phone}
                  onChange={(e) => setEditAddressForm(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '') }))}
                  placeholder="9876543210"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '14px' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>6-Digit PIN Code *</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={editAddressForm.postalCode}
                    onChange={(e) => handlePincodeLookup(e.target.value)}
                    placeholder="110001"
                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #3b82f6', borderRadius: '10px', fontSize: '14px', fontWeight: '700' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>City / District</label>
                  <input
                    type="text"
                    value={editAddressForm.city}
                    onChange={(e) => setEditAddressForm(prev => ({ ...prev, city: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '14px' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>House / Flat / Street Address *</label>
                <textarea
                  rows={2}
                  value={editAddressForm.address}
                  onChange={(e) => setEditAddressForm(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="House number, Street, Landmark"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '14px' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setOrderToEditAddress(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1 }} disabled={isSavingAddress} onClick={handleSaveAddress}>
                {isSavingAddress ? 'Saving...' : 'Save Address'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📅 Modal 2: Delivery Slot & Preferences */}
      {orderToSetPreferences && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setOrderToSetPreferences(null)}>
          <div style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', margin: 0 }}>📅 Delivery Time & Instructions</h3>
              <button onClick={() => setOrderToSetPreferences(null)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
              Tell the delivery associate when and how to hand over your package.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>Preferred Time Slot</label>
                <select
                  value={preferencesForm.slot}
                  onChange={(e) => setPreferencesForm(prev => ({ ...prev, slot: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '13.5px' }}
                >
                  <option value="Anytime (9 AM - 9 PM)">Anytime (9 AM – 9 PM)</option>
                  <option value="Morning (9 AM - 1 PM)">Morning (9 AM – 1 PM)</option>
                  <option value="Afternoon (1 PM - 5 PM)">Afternoon (1 PM – 5 PM)</option>
                  <option value="Evening (5 PM - 9 PM)">Evening (5 PM – 9 PM)</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>Doorstep Gate Instructions</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                  {['Call before delivery', 'Leave at security gate', 'Leave with neighbor', 'Ring bell twice'].map((tag, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPreferencesForm(prev => ({ ...prev, instructions: tag }))}
                      style={{ background: preferencesForm.instructions === tag ? '#4f46e5' : '#f1f5f9', color: preferencesForm.instructions === tag ? '#ffffff' : '#334155', border: '1px solid #e2e8f0', padding: '5px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Custom instruction (e.g. Flat 304, Tower B)"
                  value={preferencesForm.instructions}
                  onChange={(e) => setPreferencesForm(prev => ({ ...prev, instructions: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '13.5px' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setOrderToSetPreferences(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1 }} disabled={isSavingPreferences} onClick={handleSavePreferences}>
                {isSavingPreferences ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📜 Modal 3: Live Tracking Activity Timeline Log */}
      {trackingTimelineOrder && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setTrackingTimelineOrder(null)}>
          <div style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '480px', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', margin: 0 }}>📜 Shipment Journey & Scans</h3>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>AWB: {trackingTimelineOrder.awbNumber || `DEL${trackingTimelineOrder._id.replace(/\D/g, '').slice(-8)}`} ({trackingTimelineOrder.courierPartner || 'Delhivery Air'})</div>
              </div>
              <button onClick={() => setTrackingTimelineOrder(null)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative', paddingLeft: '24px' }}>
              <div style={{ position: 'absolute', top: '10px', bottom: '10px', left: '8px', width: '2px', background: '#cbd5e1' }} />
              
              {[
                { title: 'Order Confirmed & Payment Verified', loc: 'New Delhi National Fulfillment Center', time: new Date(trackingTimelineOrder.createdAt).toLocaleString('en-IN'), done: true },
                { title: '360° Quality Passed & Tamper-Sealed', loc: 'AbKharido Packing Dock', time: 'Completed', done: true },
                { title: 'Handed Over to Express Air Cargo', loc: 'IGI Airport Air Cargo Hub', time: 'In Transit', done: trackingTimelineOrder.status !== 'Pending' && trackingTimelineOrder.status !== 'Placed' },
                { title: `Arrived at Delivery Facility (${trackingTimelineOrder.shippingAddress?.city || 'Destination Hub'})`, loc: `${trackingTimelineOrder.shippingAddress?.city || 'Local'} Sorting Station`, time: 'Scanned', done: trackingTimelineOrder.status === 'In Transit' || trackingTimelineOrder.status === 'Shipped' || trackingTimelineOrder.status === 'Delivered' },
                { title: 'Out for Doorstep Delivery with Associate', loc: 'Assigned Courier Rider (Rohan K. +91-9876543210)', time: 'Active', done: trackingTimelineOrder.status === 'Delivered' },
                { title: 'Delivered Successfully via OTP Handover', loc: trackingTimelineOrder.shippingAddress?.address || 'Doorstep', time: trackingTimelineOrder.deliveredAt ? new Date(trackingTimelineOrder.deliveredAt).toLocaleString('en-IN') : 'Pending', done: trackingTimelineOrder.status === 'Delivered' }
              ].map((ev, eIdx) => (
                <div key={eIdx} style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '-20px', top: '3px', width: '12px', height: '12px', borderRadius: '50%', background: ev.done ? '#10b981' : '#94a3b8', border: '2px solid #ffffff', boxShadow: ev.done ? '0 0 8px #10b981' : 'none' }} />
                  <div style={{ fontSize: '13px', fontWeight: '800', color: ev.done ? '#0f172a' : '#64748b' }}>{ev.title}</div>
                  <div style={{ fontSize: '11.5px', color: '#64748b' }}>📍 {ev.loc}</div>
                  <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '2px' }}>⏱️ {ev.time}</div>
                </div>
              ))}
            </div>

            <button 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '20px', borderRadius: '10px' }}
              onClick={() => setTrackingTimelineOrder(null)}
            >
              Close Activity Log
            </button>
          </div>
        </div>
      )}

      {/* 📱 Modal 4: Show Delivery QR Code */}
      {qrCodePinOrder && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setQrCodePinOrder(null)}>
          <div style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '360px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', margin: '0 0 6px 0' }}>Doorstep Delivery QR</h3>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 16px 0' }}>Show this screen to the delivery rider to scan instantly</p>
            
            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '2px dashed #059669', display: 'inline-block', marginBottom: '14px' }}>
              <div style={{ fontSize: '42px', fontWeight: '900', letterSpacing: '8px', color: '#065f46', fontFamily: 'monospace' }}>
                {qrCodePinOrder.deliveryPin || qrCodePinOrder._id.replace(/\D/g, '').slice(-4) || '8492'}
              </div>
              <div style={{ fontSize: '11px', color: '#047857', fontWeight: '700', marginTop: '6px' }}>AUTHENTICATED HANDOVER PIN</div>
            </div>

            <div style={{ fontSize: '12px', color: '#475569', marginBottom: '18px' }}>
              Order #{qrCodePinOrder._id.slice(-8).toUpperCase()} • ₹{(qrCodePinOrder.totalPrice || 0).toLocaleString('en-IN')}
            </div>

            <button className="btn btn-primary" style={{ width: '100%', borderRadius: '10px' }} onClick={() => setQrCodePinOrder(null)}>
              Done
            </button>
          </div>
        </div>
      )}

      {/* 🛡️ Modal 5: Digital Brand Warranty & Authenticity Pass */}
      {warrantyOrder && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setWarrantyOrder(null)}>
          <div style={{ backgroundColor: '#fff', borderRadius: '24px', padding: '28px', width: '100%', maxWidth: '440px', boxShadow: '0 25px 50px rgba(0,0,0,0.2)', border: '2px solid #7c3aed' }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '36px' }}>🛡️</span>
              <h3 style={{ fontSize: '19px', fontWeight: '900', color: '#0f172a', margin: '6px 0 2px 0', fontFamily: "'Outfit', sans-serif" }}>
                Brand Warranty & Authenticity Pass
              </h3>
              <div style={{ fontSize: '11.5px', color: '#7c3aed', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                100% Genuine Authorized Inventory
              </div>
            </div>

            <div style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', borderRadius: '16px', padding: '16px', border: '1px solid #ddd6fe', marginBottom: '16px', fontSize: '12.5px', color: '#334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Certified Retailer:</span>
                <strong style={{ color: '#0f172a' }}>AbKharido Retail Pvt Ltd</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Order Reference:</span>
                <strong style={{ color: '#0f172a' }}>#{warrantyOrder._id.slice(-8).toUpperCase()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Warranty Period:</span>
                <strong style={{ color: '#059669' }}>1 Year Brand Domestic Warranty</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Replacement Cover:</span>
                <strong style={{ color: '#059669' }}>7-Day Free Doorstep Swap</strong>
              </div>
            </div>

            <p style={{ fontSize: '11.5px', color: '#64748b', lineHeight: 1.5, margin: '0 0 18px 0', textAlign: 'center' }}>
              This digital pass verifies authorized brand procurement and guarantees repair/replacement coverage across all authorized service centers in India.
            </p>

            <button className="btn btn-primary" style={{ width: '100%', borderRadius: '10px', background: '#7c3aed', borderColor: '#7c3aed' }} onClick={() => setWarrantyOrder(null)}>
              Close Warranty Pass
            </button>
          </div>
        </div>
      )}

      {/* ⭐ Modal 6: Rate & Review Item */}
      {itemToReview && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setItemToReview(null)}>
          <div style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', margin: '0 0 4px 0' }}>Rate this Purchase</h3>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 16px 0' }}>{itemToReview.name}</p>

            {/* Stars */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setReviewRating(star)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '28px', color: star <= reviewRating ? '#f59e0b' : '#cbd5e1' }}
                >
                  ★
                </button>
              ))}
            </div>

            {/* Tags */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '11.5px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>What did you like?</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {['Super Fast Delivery', '100% Genuine', 'Value for Money', 'Great Packaging', 'Perfect Fit'].map((tag, idx) => {
                  const isSelected = reviewTags.includes(tag);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setReviewTags(prev => isSelected ? prev.filter(t => t !== tag) : [...prev, tag])}
                      style={{ background: isSelected ? '#ecfdf5' : '#f1f5f9', color: isSelected ? '#059669' : '#334155', border: `1px solid ${isSelected ? '#a7f3d0' : '#e2e8f0'}`, padding: '5px 10px', borderRadius: '8px', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      {isSelected ? '✓ ' : '+ '}{tag}
                    </button>
                  );
                })}
              </div>
            </div>

            <textarea
              rows={3}
              placeholder="Write your honest review to help fellow shoppers..."
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '13px', marginBottom: '16px' }}
            />

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setItemToReview(null)}>Cancel</button>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1 }}
                onClick={() => {
                  showToast('⭐ Thank you! Your verified purchase review has been submitted.', 'success');
                  setItemToReview(null);
                }}
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ↩️ Modal 7: Enhanced Return with Refund Destination Choice */}
      {orderToReturn && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setOrderToReturn(null)}>
          <div style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '440px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', margin: '0 0 6px 0' }}>↩️ Request Return & Refund</h3>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 14px 0' }}>
              Free doorstep pickup and QC inspection. Choose your preferred refund destination.
            </p>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Return Reason *</label>
              <select
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '13px' }}
              >
                <option value="Item defective / not working properly">Item defective / not working properly</option>
                <option value="Received wrong item or incorrect variant">Received wrong item or incorrect variant</option>
                <option value="Item arrived damaged or in open box">Item arrived damaged or in open box</option>
                <option value="Quality not as described on website">Quality not as described on website</option>
                <option value="Performance issues after unboxing">Performance issues after unboxing</option>
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>Where should we credit your ₹{(orderToReturn.totalPrice || 0).toLocaleString('en-IN')} refund? *</label>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', border: refundMode === 'Wallet' ? '1.5px solid #4f46e5' : '1px solid #e2e8f0', background: refundMode === 'Wallet' ? '#eef2ff' : '#ffffff', cursor: 'pointer' }}>
                  <input type="radio" name="refundMode" checked={refundMode === 'Wallet'} onChange={() => setRefundMode('Wallet')} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>🪙 Instant AB Coins Wallet (+5% Extra Bonus)</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Instant credit with 0 wait time to spend on any product</div>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', border: refundMode === 'UPI' ? '1.5px solid #4f46e5' : '1px solid #e2e8f0', background: refundMode === 'UPI' ? '#eef2ff' : '#ffffff', cursor: 'pointer' }}>
                  <input type="radio" name="refundMode" checked={refundMode === 'UPI'} onChange={() => setRefundMode('UPI')} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>🏦 Direct Bank Transfer via UPI</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Direct credit to your bank account via Cashfree Escrow (24-48 hrs)</div>
                  </div>
                </label>
              </div>

              {refundMode === 'UPI' && (
                <div style={{ marginTop: '10px' }}>
                  <input
                    type="text"
                    placeholder="Enter your UPI ID (e.g. mobile@okaxis, name@paytm)"
                    value={returnUpiId}
                    onChange={(e) => setReturnUpiId(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #4f46e5', borderRadius: '10px', fontSize: '13px', fontWeight: '700' }}
                  />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setOrderToReturn(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1, backgroundColor: '#eab308', borderColor: '#eab308', fontWeight: '800' }} onClick={handleRequestReturn}>
                Confirm Return
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔄 Modal 8: Size / Fit Exchange */}
      {orderToExchange && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setOrderToExchange(null)}>
          <div style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', margin: 0 }}>🔄 Request Size / Fit Exchange</h3>
              <button onClick={() => setOrderToExchange(null)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
              Choose your replacement size. Free 1-to-1 doorstep pickup & exchange.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>Select Replacement Size *</label>
                <select
                  value={exchangeForm.requestedSize}
                  onChange={(e) => setExchangeForm(prev => ({ ...prev, requestedSize: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #7c3aed', borderRadius: '10px', fontSize: '14px', fontWeight: '700', background: '#faf5ff' }}
                >
                  <option value="UK 7 / S">UK 7 / Small (S)</option>
                  <option value="UK 8 / M">UK 8 / Medium (M)</option>
                  <option value="UK 9 / L">UK 9 / Large (L)</option>
                  <option value="UK 10 / XL">UK 10 / Extra Large (XL)</option>
                  <option value="UK 11 / XXL">UK 11 / Double XL (XXL)</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>Reason for Exchange *</label>
                <select
                  value={exchangeForm.reason}
                  onChange={(e) => setExchangeForm(prev => ({ ...prev, reason: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '14px' }}
                >
                  <option value="Size too small / tight">Size too small / tight</option>
                  <option value="Size too loose / large">Size too loose / large</option>
                  <option value="Fitting not comfortable">Fitting not comfortable</option>
                  <option value="Color mismatch with expectations">Color mismatch</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setOrderToExchange(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1, background: '#7c3aed', borderColor: '#7c3aed' }} disabled={isSubmittingExchange} onClick={handleSubmitExchange}>
                {isSubmittingExchange ? 'Submitting...' : 'Confirm Exchange'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ❌ Modal 9: Cancel Order */}
      {orderToCancel && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setOrderToCancel(null)}>
          <div style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
              <div style={{ width: '54px', height: '54px', backgroundColor: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={28} color="#ef4444" />
              </div>
            </div>
            <h3 style={{ fontSize: '19px', fontWeight: '900', textAlign: 'center', color: '#0f172a', marginBottom: '6px' }}>Cancel This Order?</h3>
            <p style={{ fontSize: '13px', color: '#64748b', textAlign: 'center', marginBottom: '16px', lineHeight: '1.5' }}>
              Please select a cancellation reason. Prepaid amounts will be refunded via automated escrow within 24-48 business hours.
            </p>
            <div style={{ marginBottom: '18px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>Reason for cancellation *</label>
              <select
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #f87171', borderRadius: '10px', fontSize: '13.5px', background: '#fef2f2' }}
              >
                <option value="Found a better price / deal elsewhere">Found a better price / deal elsewhere</option>
                <option value="Delivery time is taking too long">Delivery time is taking too long</option>
                <option value="Need to change delivery address or phone number">Need to change delivery address or phone number</option>
                <option value="Ordered by mistake / duplicate order">Ordered by mistake / duplicate order</option>
                <option value="Changed mind / item no longer needed">Changed mind / item no longer needed</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-outline" style={{ flex: 1, padding: '12px', fontWeight: '700' }} onClick={() => setOrderToCancel(null)}>
                Keep Order
              </button>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1, padding: '12px', backgroundColor: '#ef4444', borderColor: '#ef4444', fontWeight: '800' }} 
                onClick={handleCancelOrder}
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
};

export default Orders;
