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
  const totalOrdersCount = orders?.length || 0;
  const activeInTransitCount = (orders || []).filter(o => o?.status !== 'Delivered' && o?.status !== 'Cancelled' && o?.status !== 'CANCELLED' && o?.status !== 'Returned').length;
  const totalDeliveredCount = (orders || []).filter(o => o?.status === 'Delivered').length;
  const totalSpentAmount = (orders || []).reduce((acc, o) => o?.status !== 'Cancelled' && o?.status !== 'CANCELLED' ? acc + (o?.totalPrice || 0) : acc, 0);

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
    <div className="orders-container animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto', padding: '16px 14px 60px' }}>

      {/* Premium Dark Orders Header */}
      <div style={{
        background: 'linear-gradient(135deg, #090d16 0%, #1e1b4b 60%, #312e81 100%)',
        borderRadius: '24px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 16px 40px rgba(30, 27, 75, 0.3)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        {/* Header Title & Subtitle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '48px', height: '48px',
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(79,70,229,0.45)',
            }}>
              <History size={24} color="#ffffff" />
            </div>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#ffffff', fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.3px', margin: 0 }}>My Orders</h1>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', margin: 0, marginTop: '3px' }}>Track shipments, manage delivery slots, download GST invoices & request replacements</p>
            </div>
          </div>

          {/* Quick Metrics Ribbon */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.12)', padding: '6px 14px', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', fontWeight: '800', textTransform: 'uppercase' }}>Total Orders</div>
              <div style={{ fontSize: '15px', fontWeight: '900', color: '#ffffff' }}>{totalOrdersCount}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.12)', padding: '6px 14px', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', fontWeight: '800', textTransform: 'uppercase' }}>In Transit</div>
              <div style={{ fontSize: '15px', fontWeight: '900', color: '#38bdf8' }}>{activeInTransitCount}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.12)', padding: '6px 14px', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', fontWeight: '800', textTransform: 'uppercase' }}>Total Spent</div>
              <div style={{ fontSize: '15px', fontWeight: '900', color: '#4ade80' }}>₹{totalSpentAmount.toLocaleString('en-IN')}</div>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        {(orders.length > 0 || searchQuery !== '' || statusFilter !== 'all' || timeFilter !== 'all') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Search Input */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              background: 'rgba(255,255,255,0.1)', borderRadius: '14px',
              padding: '12px 16px', border: '1px solid rgba(255,255,255,0.14)',
            }}>
              <Search size={18} color="rgba(255,255,255,0.6)" />
              <input
                type="text"
                placeholder="Search orders by product name, brand, Order ID, or AWB tracking..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1, border: 'none', background: 'transparent',
                  color: '#ffffff', fontSize: '13.5px', outline: 'none',
                }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>
                  Clear
                </button>
              )}
            </div>

            {/* Filter Controls: Status Tabs & Date Period Selector */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              {/* Status Filter Pills */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { v: 'all', l: 'All Orders' },
                  { v: 'processing', l: 'In Progress 🚚' },
                  { v: 'delivered', l: 'Delivered ✅' },
                  { v: 'cancelled', l: 'Cancelled ❌' }
                ].map(opt => (
                  <button key={opt.v} onClick={() => setStatusFilter(opt.v)} style={{
                    padding: '7px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '700',
                    border: statusFilter === opt.v ? '1px solid #7c3aed' : '1px solid rgba(255,255,255,0.15)',
                    background: statusFilter === opt.v ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : 'rgba(255,255,255,0.08)',
                    color: statusFilter === opt.v ? '#ffffff' : 'rgba(255,255,255,0.7)',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}>{opt.l}</button>
                ))}
              </div>

              {/* Date Filter Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={15} color="rgba(255,255,255,0.7)" />
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.12)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: '700',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all" style={{ background: '#1e1b4b', color: 'white' }}>📅 All Time</option>
                  <option value="30days" style={{ background: '#1e1b4b', color: 'white' }}>Past 30 Days</option>
                  <option value="3months" style={{ background: '#1e1b4b', color: 'white' }}>Past 3 Months</option>
                  <option value="6months" style={{ background: '#1e1b4b', color: 'white' }}>Past 6 Months</option>
                  <option value="2026" style={{ background: '#1e1b4b', color: 'white' }}>Year 2026</option>
                  <option value="2025" style={{ background: '#1e1b4b', color: 'white' }}>Year 2025</option>
                  <option value="custom" style={{ background: '#1e1b4b', color: 'white' }}>Custom Date Range 🔍</option>
                </select>
              </div>
            </div>

            {/* Custom Date Range Picker (Rendered when timeFilter === 'custom') */}
            {timeFilter === 'custom' && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
                background: 'rgba(255,255,255,0.06)', padding: '12px 16px', borderRadius: '14px',
                border: '1px solid rgba(255,255,255,0.12)', marginTop: '4px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
                  <span>From:</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    style={{
                      padding: '5px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.15)',
                      border: '1px solid rgba(255,255,255,0.25)', color: '#ffffff', fontSize: '12px', outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
                  <span>To:</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    style={{
                      padding: '5px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.15)',
                      border: '1px solid rgba(255,255,255,0.25)', color: '#ffffff', fontSize: '12px', outline: 'none'
                    }}
                  />
                </div>

                {(customStartDate || customEndDate) && (
                  <button
                    onClick={() => { setCustomStartDate(''); setCustomEndDate(''); }}
                    style={{ background: 'none', border: 'none', color: '#f87171', fontSize: '11.5px', fontWeight: '800', cursor: 'pointer' }}
                  >
                    Reset Dates
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {isFetching ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '80px 20px', textAlign: 'center',
        }}>
          <div style={{ width: '40px', height: '40px', border: '4px solid #e0e7ff', borderTop: '4px solid #4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' }}></div>
          <div style={{ color: '#64748b', fontWeight: '600' }}>Fetching latest orders...</div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '40px 20px 120px 20px', textAlign: 'center',
        }}>
          <div style={{
            width: '100px', height: '100px',
            background: 'linear-gradient(135deg, #1e1b4b 0%, #4f46e5 100%)',
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '20px',
            boxShadow: '0 16px 48px rgba(79, 70, 229, 0.3)'
          }}>
            <ShoppingBag size={48} color="#ffffff" strokeWidth={1.5} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#090d16', fontFamily: "'Outfit', sans-serif", marginBottom: '8px' }}>
            {searchQuery || statusFilter !== 'all' || timeFilter !== 'all' ? 'No Matching Orders' : 'No Orders Placed Yet'}
          </h2>
          <p style={{ color: '#64748b', fontSize: '13.5px', maxWidth: '320px', lineHeight: '1.5', marginBottom: '24px' }}>
            {searchQuery || statusFilter !== 'all' || timeFilter !== 'all'
              ? "Try clearing filters or date ranges to see your past purchases."
              : "Experience authentic brand inventory, cash protection, and instant cashback on AbKharido.com."}
          </p>
          <button
            onClick={() => { setSearchQuery(''); setStatusFilter('all'); setTimeFilter('all'); navigateTo('home'); }}
            style={{
              padding: '14px 32px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              color: 'white', border: 'none', borderRadius: '30px',
              fontSize: '15px', fontWeight: '800', cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(79, 70, 229, 0.35)',
              fontFamily: "'Outfit', sans-serif"
            }}
          >
            🛍️ Explore Trending Deals
          </button>
        </div>
      ) : (
      <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredOrders.map(order => {
          const isExpanded = expandedOrderId === order._id;
          const pin = order.deliveryPin || (order._id ? order._id.replace(/\D/g, '').slice(-4) || '8492' : '8492');
          const isCancelled = order.status === 'Cancelled' || order.status === 'CANCELLED';
          const isDelivered = order.status === 'Delivered';
          const firstItem = order.orderItems?.[0];
          const totalItems = order.orderItems?.length || 1;

          return (
          <div 
            key={order._id} 
            className="order-card" 
            style={{ 
              border: isExpanded ? '2px solid #4f46e5' : '1.5px solid #e2e8f0', 
              borderRadius: '20px', 
              background: '#ffffff', 
              boxShadow: isExpanded ? '0 12px 36px rgba(79, 70, 229, 0.12)' : '0 4px 20px rgba(0,0,0,0.03)', 
              transition: 'all 0.25s ease',
              overflow: 'hidden'
            }}
          >
            
            {/* 🌟 Summary Row (Always Visible - Collapsed by Default, Clicking Expands) */}
            <div 
              onClick={() => setExpandedOrderId(isExpanded ? null : order._id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '18px 20px',
                cursor: 'pointer',
                background: isExpanded ? '#f8fafc' : '#ffffff',
                borderBottom: isExpanded ? '1px solid #e2e8f0' : 'none',
                gap: '16px',
                flexWrap: 'wrap',
                transition: 'background 0.2s ease'
              }}
            >
              {/* Left: Product Thumbnail & Stack Count */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: '260px', flex: 1 }}>
                <div style={{ position: 'relative', width: '68px', height: '68px', borderRadius: '12px', overflow: 'hidden', background: '#f8fafc', flexShrink: 0, padding: '4px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {firstItem?.image ? (
                    <img src={firstItem.image} alt={firstItem.name || 'Product'} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <ShoppingBag size={24} color="#94a3b8" />
                  )}
                  {totalItems > 1 && (
                    <span style={{ position: 'absolute', bottom: '2px', right: '2px', background: '#1e1b4b', color: '#ffffff', fontSize: '9.5px', fontWeight: '800', padding: '2px 5px', borderRadius: '6px' }}>
                      +{totalItems - 1}
                    </span>
                  )}
                </div>

                {/* Middle Content: Status Badge, Title, Order ID & Price */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{
                      padding: '3px 9px',
                      borderRadius: '100px',
                      fontSize: '11px',
                      fontWeight: '800',
                      letterSpacing: '0.3px',
                      textTransform: 'uppercase',
                      background: isCancelled ? '#fef2f2' : isDelivered ? '#ecfdf5' : '#eff6ff',
                      color: isCancelled ? '#ef4444' : isDelivered ? '#059669' : '#2563eb',
                      border: `1px solid ${isCancelled ? '#fecaca' : isDelivered ? '#a7f3d0' : '#bfdbfe'}`
                    }}>
                      {isDelivered ? '✅ Delivered' : isCancelled ? '❌ Cancelled' : `🚚 ${order.status || 'Processing'}`}
                    </span>
                    <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: '700', fontFamily: 'monospace' }}>
                      #{order._id.slice(-8).toUpperCase()}
                    </span>
                  </div>

                  <div style={{ fontSize: '14.5px', fontWeight: '800', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '340px' }}>
                    {firstItem?.name || 'Ordered Items'}
                  </div>

                  <div style={{ fontSize: '12.5px', color: '#475569', fontWeight: '600' }}>
                    <strong style={{ color: '#059669', fontWeight: '900' }}>₹{(order.totalPrice || 0).toLocaleString('en-IN')}</strong> • {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} • {order.paymentMethod || 'Online'}
                  </div>
                </div>
              </div>

              {/* Right: Quick Action Buttons & Expand Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                {/* 1-Click Tax Invoice */}
                <button
                  onClick={() => handleDownloadInvoice(order._id)}
                  disabled={downloadingOrderId === order._id}
                  style={{
                    padding: '7px 12px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#334155',
                    fontSize: '11.5px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                  }}
                  title="Download Tax Invoice"
                >
                  <Download size={13} /> {downloadingOrderId === order._id ? 'Generating...' : 'Invoice'}
                </button>

                {/* 1-Click Reorder */}
                <button
                  onClick={() => {
                    if (order.orderItems) {
                      order.orderItems.forEach(item => {
                        addToCart({ id: item.product, name: item.name, price: item.price, image: item.image, originalPrice: item.price }, item.qty || 1);
                      });
                      showToast('Items added back to cart! 🛍️', 'success');
                      navigateTo('cart');
                    }
                  }}
                  style={{
                    padding: '7px 12px',
                    borderRadius: '10px',
                    border: '1px solid #bfdbfe',
                    background: '#eff6ff',
                    color: '#2563eb',
                    fontSize: '11.5px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Buy items again"
                >
                  🔄 Buy Again
                </button>

                {/* Expand / Collapse Details Button */}
                <button
                  onClick={() => setExpandedOrderId(isExpanded ? null : order._id)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '10px',
                    border: isExpanded ? '1px solid #4f46e5' : '1px solid #e2e8f0',
                    background: isExpanded ? '#4f46e5' : '#f8fafc',
                    color: isExpanded ? '#ffffff' : '#334155',
                    fontSize: '12px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isExpanded ? 'Hide Details' : 'View Details & Track'} {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>
              </div>
            </div>

            {/* 🌟 Expanded Order Details (Unfolds when isExpanded === true) */}
            {isExpanded && (
            <div style={{ padding: '24px', background: '#ffffff', borderTop: '1px solid #f1f5f9' }}>
              
              {/* Executive Header: Order Meta, Date, Total, Ship To, and Action Controls */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px', background: '#f8fafc', padding: '16px 20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', gap: '28px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Order Placed</span>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', marginTop: '3px' }}>
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Amount</span>
                    <div style={{ fontSize: '15px', fontWeight: '900', color: '#059669', marginTop: '2px' }}>
                      ₹{(order.totalPrice || 0).toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ship To</span>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{order.shippingAddress?.fullName || order.shippingAddress?.name || 'Customer'}</span>
                      {(!isCancelled && !isDelivered) && (
                        <button
                          onClick={() => handleOpenEditAddress(order)}
                          style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', padding: 0, fontSize: '11px', fontWeight: '800', textDecoration: 'underline' }}
                          title="Edit delivery address"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Payment Mode</span>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#334155', marginTop: '3px' }}>
                      {order.paymentMethod || 'Online'} {order.isPaid ? '• PAID ✓' : '• Cash on Delivery'}
                    </div>
                  </div>
                </div>
              </div>


            {/* 🛡️ Doorstep Security Verification PIN with 1-Click Copy & Show QR */}
            {order.status !== 'Cancelled' && order.status !== 'CANCELLED' && order.status !== 'Delivered' && (
              <div style={{
                background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                border: '1.5px solid #a7f3d0',
                borderRadius: '16px',
                padding: '14px 18px',
                margin: '14px 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '24px' }}>🛡️</span>
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#065f46' }}>
                      Doorstep Delivery PIN Verification
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#047857' }}>
                      Share this security code with the courier associate only upon box inspection.
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    background: '#ffffff',
                    border: '2px dashed #059669',
                    borderRadius: '10px',
                    padding: '6px 14px',
                    fontSize: '18px',
                    fontWeight: '900',
                    color: '#065f46',
                    letterSpacing: '3px',
                    fontFamily: 'monospace',
                    boxShadow: '0 2px 8px rgba(5, 150, 105, 0.15)'
                  }}>
                    {pin}
                  </div>
                  <button
                    onClick={() => handleCopyPin(pin, order._id)}
                    style={{ background: '#ffffff', border: '1px solid #a7f3d0', padding: '8px 12px', borderRadius: '8px', fontSize: '11.5px', fontWeight: '800', color: '#065f46', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    title="Copy PIN to clipboard"
                  >
                    {copiedPinId === order._id ? <Check size={14} color="#059669" /> : <Copy size={14} />}
                    {copiedPinId === order._id ? 'Copied' : 'Copy'}
                  </button>
                  <button
                    onClick={() => setQrCodePinOrder(order)}
                    style={{ background: '#059669', color: '#ffffff', border: 'none', padding: '8px 12px', borderRadius: '8px', fontSize: '11.5px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <QrCode size={14} /> Show QR
                  </button>
                </div>
              </div>
            )}

            {/* ⚡ COD to Prepaid Conversion Action Banner */}
            {(order.paymentMethod && (order.paymentMethod.toLowerCase().includes('cod') || order.paymentMethod.toLowerCase().includes('cash'))) && !order.isPaid && order.status !== 'Cancelled' && order.status !== 'CANCELLED' && order.status !== 'Delivered' && (
              <div style={{
                background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                border: '1.5px solid #fde68a',
                borderRadius: '16px',
                padding: '14px 18px',
                margin: '14px 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '22px' }}>⚡</span>
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: '900', color: '#92400e', fontFamily: "'Outfit', sans-serif" }}>
                      Pay Online via UPI & Earn 50 AB Coins Cashback!
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#b45309' }}>
                      Avoid handling cash at doorstep and get instant 50 Coins credited to your wallet.
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleConvertCodToPrepaid(order._id)}
                  disabled={convertingOrderId === order._id}
                  style={{
                    background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    fontSize: '12.5px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    fontFamily: "'Outfit', sans-serif",
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {convertingOrderId === order._id ? 'Processing...' : `Pay Online ₹${(order.totalPrice || 0).toLocaleString('en-IN')} ➔`}
                </button>
              </div>
            )}

            {/* 🔄 Live Refund Tracker (If Return Requested) */}
            {order.returnStatus && order.returnStatus !== 'None' && (
              <div style={{
                background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                border: '1.5px solid #bfdbfe',
                borderRadius: '16px',
                padding: '16px 18px',
                margin: '14px 0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <RefreshCw size={16} color="#1d4ed8" />
                    <span style={{ fontSize: '13.5px', fontWeight: '900', color: '#1e3a8a', fontFamily: "'Outfit', sans-serif" }}>
                      Return & Refund Progress Tracker
                    </span>
                  </div>
                  <span style={{ background: '#2563eb', color: 'white', fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '6px' }}>
                    {order.returnStatus.toUpperCase()}
                  </span>
                </div>
                
                {/* 4-Step Refund Timeline */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', textAlign: 'center' }}>
                  {[
                    { step: '1. Requested', desc: 'Doorstep pickup logged', done: true },
                    { step: '2. Pickup', desc: 'Courier verification', done: order.returnStatus === 'Approved' || order.returnStatus === 'Refunded' },
                    { step: '3. QC Check', desc: 'Item condition pass', done: order.returnStatus === 'Approved' || order.returnStatus === 'Refunded' },
                    { step: '4. Refund Done', desc: 'Credited to source', done: order.returnStatus === 'Refunded' }
                  ].map((r, i) => (
                    <div key={i} style={{ background: r.done ? '#ffffff' : 'rgba(255,255,255,0.6)', padding: '8px 4px', borderRadius: '8px', border: r.done ? '1.5px solid #3b82f6' : '1px solid #cbd5e1' }}>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: r.done ? '#1d4ed8' : '#64748b' }}>{r.step}</div>
                      <div style={{ fontSize: '9.5px', color: '#64748b', marginTop: '2px' }}>{r.desc}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '10px', fontSize: '11.5px', color: '#1e40af', fontWeight: '600' }}>
                  Refund Destination: <strong>{order.refundDestination?.type === 'UPI' ? `Bank UPI (${order.refundDestination.upiId})` : 'Instant AB Coins Wallet (+5% bonus)'}</strong> • Reference: <code>REF-{order._id.substring(0, 8).toUpperCase()}</code>
                </div>
              </div>
            )}

            {/* 🚀 Live Order Status & Tracking Milestones */}
            {(() => {
              const status = order.status || 'Processing';
              const isCancelled = status === 'CANCELLED' || status === 'Cancelled';
              
              let stepIndex = 1;
              if (status === 'Packed') stepIndex = 2;
              else if (status === 'In Transit' || status === 'Shipped') stepIndex = 3;
              else if (status === 'Delivered') stepIndex = 4;
              else if (isCancelled) stepIndex = 0;

              const steps = [
                { label: 'Order Placed', icon: '📝' },
                { label: 'Packed & Sealed', icon: '📦' },
                { label: 'In Transit', icon: '🚚' },
                { label: 'Delivered', icon: '🎉' }
              ];

              return (
                <div style={{ background: isCancelled ? 'linear-gradient(135deg, #fff1f2 0%, #fef2f2 100%)' : 'linear-gradient(135deg, #090d16 0%, #1e293b 100%)', borderRadius: '18px', padding: '18px', margin: '14px 0', border: isCancelled ? '1.5px solid #fecdd3' : '1px solid rgba(255,255,255,0.12)', color: isCancelled ? '#9f1239' : '#ffffff' }}>
                  
                  {/* Status Bar Top */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', paddingBottom: '14px', borderBottom: isCancelled ? '1px solid #fecdd3' : '1px solid rgba(255,255,255,0.12)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '20px', background: isCancelled ? '#ffe4e6' : 'rgba(56,189,248,0.2)', padding: '6px', borderRadius: '10px' }}>
                        {isCancelled ? '❌' : '🚀'}
                      </span>
                      <div>
                        <div style={{ fontSize: '10.5px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px', color: isCancelled ? '#e11d48' : '#38bdf8' }}>
                          {isCancelled ? 'Order Status' : 'Live Delivery Status'}
                        </div>
                        <div style={{ fontSize: '15px', fontWeight: '900', color: isCancelled ? '#881337' : '#ffffff' }}>
                          {isCancelled ? 'ORDER CANCELLED' : status === 'Delivered' ? 'DELIVERED SAFELY' : `IN PROGRESS: ${status.toUpperCase()}`}
                        </div>
                      </div>
                    </div>
                    
                    {!isCancelled && (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                          onClick={() => setTrackingTimelineOrder(order)}
                          style={{ background: 'rgba(255,255,255,0.12)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.25)', padding: '5px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}
                        >
                          📜 Activity Log
                        </button>
                        <span style={{ fontSize: '11px', fontWeight: '800', background: status === 'Delivered' ? '#059669' : '#3b82f6', color: '#ffffff', padding: '5px 10px', borderRadius: '20px' }}>
                          {status === 'Delivered' ? '✅ Delivered' : '⚡ Est. Delivery: 24–48 Hrs'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Cancelled Alert Box */}
                  {isCancelled ? (
                    <div style={{ marginTop: '12px', fontSize: '12.5px', fontWeight: '600', lineHeight: 1.5, color: '#9f1239' }}>
                      🛑 This order has been cancelled {order.cancellationReason ? `(${order.cancellationReason})` : ''}. If any online debit/UPI payment was pre-captured, an automated full refund has been initiated to your original bank source via Cashfree Escrow.
                    </div>
                  ) : (
                    /* 4-Step Animated Visual Milestones */
                    <div style={{ marginTop: '16px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', position: 'relative' }}>
                        
                        <div style={{ position: 'absolute', top: '18px', left: '12%', right: '12%', height: '4px', background: 'rgba(255,255,255,0.15)', zIndex: 1, borderRadius: '4px' }}>
                          <div style={{ 
                            height: '100%', 
                            borderRadius: '4px',
                            background: 'linear-gradient(90deg, #38bdf8, #22c55e)', 
                            width: stepIndex === 1 ? '15%' : stepIndex === 2 ? '50%' : stepIndex === 3 ? '85%' : '100%',
                            transition: 'width 0.5s ease-in-out'
                          }} />
                        </div>

                        {steps.map((st, idx) => {
                          const isCompleted = stepIndex > idx + 1;
                          const isCurrent = stepIndex === idx + 1;
                          return (
                            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', zIndex: 2 }}>
                              <div style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '16px',
                                background: isCompleted || isCurrent ? '#22c55e' : '#334155',
                                border: isCurrent ? '2.5px solid #fde047' : isCompleted ? '2px solid #ffffff' : '2px solid rgba(255,255,255,0.2)',
                                transition: 'all 0.3s'
                              }}>
                                {isCompleted ? '✓' : st.icon}
                              </div>
                              <div style={{ marginTop: '6px', fontSize: '11px', fontWeight: '800', color: isCompleted || isCurrent ? '#ffffff' : '#94a3b8' }}>
                                {st.label}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Courier & AWB */}
                      <div style={{ marginTop: '18px', paddingTop: '12px', borderTop: '1px dashed rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', fontSize: '11.5px', color: '#cbd5e1' }}>
                        <span>
                          Courier: <strong style={{ color: 'white' }}>{order.courierPartner || 'Delhivery Express Air'}</strong> • AWB: <strong style={{ color: '#38bdf8', fontFamily: 'monospace' }}>{order.awbNumber || `DEL${order._id.replace(/\D/g, '').slice(-8) || '87492104'}`}</strong>
                        </span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            onClick={() => handleShareOnWhatsApp(order)}
                            style={{ color: '#25D366', fontWeight: '800', background: 'rgba(37, 211, 102, 0.1)', border: '1px solid rgba(37, 211, 102, 0.25)', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' }}
                          >
                            📲 Share Tracking
                          </button>
                          <a 
                            href={order.trackingUrl || `https://track.delhivery.com/p/${order.awbNumber || '87492104'}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ color: '#fde047', fontWeight: '800', textDecoration: 'underline', background: 'rgba(253, 224, 71, 0.1)', padding: '4px 8px', borderRadius: '6px', fontSize: '11px' }}
                          >
                            Live Tracking ↗
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Order Items List */}
            <div style={{ margin: '14px 0' }}>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Items in Shipment ({order.orderItems?.length || 0})</div>
              {(order.orderItems || []).map((item, index) => (
                <div key={item.product || index} style={{ display: 'flex', gap: '14px', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '10px', overflow: 'hidden', background: '#f8fafc', flexShrink: 0, padding: '4px', border: '1px solid #e2e8f0' }}>
                    <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: '0 0 2px 0' }}>{item.name}</h4>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      Qty: <strong>{item.qty || item.quantity || 1}</strong> {item.variant ? `| Size: ${item.variant}` : ''}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '900', color: '#059669', marginTop: '2px' }}>
                      ₹{(item.price || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end', flexShrink: 0 }}>
                    <button 
                      onClick={() => {
                        const productToAdd = { id: item.product || item.customId, name: item.name, price: item.price, image: item.image };
                        addToCart(productToAdd, item.qty || 1);
                        showToast(`🛍️ ${item.name} added to cart!`, 'success');
                        navigateTo('cart');
                      }}
                      style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}
                    >
                      🔄 Buy Again
                    </button>
                    {order.status === 'Delivered' && (
                      <button
                        onClick={() => {
                          setItemToReview(item);
                          setReviewRating(5);
                          setReviewComment('');
                        }}
                        style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#b45309', borderRadius: '6px', fontSize: '11px', fontWeight: '800', padding: '4px 8px', cursor: 'pointer' }}
                      >
                        ⭐ Rate Item
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 💰 Itemized Price Breakdown (Amazon / Flipkart Standard) */}
            <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '14px 18px', border: '1px solid #e2e8f0', margin: '14px 0' }}>
              <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#334155', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Payment & Tax Breakdown
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12.5px', color: '#475569' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Items Total (MRP)</span>
                  <span style={{ fontWeight: '700', color: '#0f172a' }}>₹{(order.itemsPrice || order.totalPrice || 0).toLocaleString('en-IN')}</span>
                </div>
                {order.appliedCoupon && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
                    <span>Coupon Discount (<code>{order.appliedCoupon}</code>)</span>
                    <span style={{ fontWeight: '800' }}>- ₹{((order.itemsPrice || order.totalPrice) * 0.1).toFixed(0)}</span>
                  </div>
                )}
                {order.coinsUsed > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#d97706' }}>
                    <span>🪙 AB Coins Redeemed</span>
                    <span style={{ fontWeight: '800' }}>- ₹{order.coinsUsed}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Express Doorstep Delivery</span>
                  <span style={{ fontWeight: '800', color: '#059669' }}>FREE</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>GST (18% Goods & Services Tax)</span>
                  <span style={{ fontWeight: '600', color: '#64748b' }}>Included in MRP</span>
                </div>
                <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '900', color: '#0f172a' }}>
                  <span>Total Amount Paid / Payable</span>
                  <span style={{ color: '#059669' }}>₹{(order.totalPrice || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', paddingTop: '10px' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {/* Delivery Preferences / Slot Button */}
                {order.status !== 'Delivered' && order.status !== 'Cancelled' && order.status !== 'CANCELLED' && (
                  <button
                    onClick={() => {
                      setOrderToSetPreferences(order);
                      setPreferencesForm({
                        slot: order.deliverySlot?.slot || 'Anytime (9 AM - 9 PM)',
                        instructions: order.deliverySlot?.instructions || ''
                      });
                    }}
                    style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#334155', padding: '7px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    📅 Delivery Slot
                  </button>
                )}

                {/* Digital Brand Warranty & Authenticity Pass */}
                <button
                  onClick={() => setWarrantyOrder(order)}
                  style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', color: '#6d28d9', padding: '7px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Award size={14} /> Warranty Pass
                </button>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                {/* WhatsApp Support Button */}
                <a
                  href={`https://wa.me/919172600587?text=${encodeURIComponent(`Hi AbKharido Support, I need assistance with Order #${order._id} (Total: ₹${order.totalPrice}).`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '7px 12px',
                    background: '#25D366',
                    color: '#ffffff',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontSize: '12px',
                    fontWeight: '800'
                  }}
                >
                  <MessageCircle size={14} /> WhatsApp Support
                </a>

                {/* Cancel Button */}
                {order.status !== 'Delivered' && order.status !== 'In Transit' && order.status !== 'Shipped' && order.status !== 'CANCELLED' && order.status !== 'Cancelled' && (
                  <button
                    style={{ background: '#fff1f2', border: '1px solid #fecdd3', color: '#ef4444', fontSize: '12px', fontWeight: '700', padding: '7px 12px', borderRadius: '8px', cursor: 'pointer' }}
                    onClick={() => setOrderToCancel(order._id)}
                  >
                    Cancel Order
                  </button>
                )}

                {/* Size Exchange Button */}
                {order.status === 'Delivered' && (!order.exchangeStatus || order.exchangeStatus === 'None') && (
                  <button
                    style={{ background: '#faf5ff', border: '1px solid #e9d5ff', color: '#7c3aed', fontSize: '12px', fontWeight: '700', padding: '7px 12px', borderRadius: '8px', cursor: 'pointer' }}
                    onClick={() => setOrderToExchange(order)}
                  >
                    🔄 Exchange Size
                  </button>
                )}

                {/* Return Button */}
                {order.status === 'Delivered' && (!order.returnStatus || order.returnStatus === 'None') && (
                  <button
                    style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#b45309', fontSize: '12px', fontWeight: '700', padding: '7px 12px', borderRadius: '8px', cursor: 'pointer' }}
                    onClick={() => {
                      setOrderToReturn(order);
                      setReturnReason('Item defective / not working properly');
                      setRefundMode('Wallet');
                      setReturnUpiId('');
                    }}
                  >
                    ↩️ Return Item
                  </button>
                )}

                {/* Email Invoice */}
                <button
                  onClick={() => handleEmailInvoice(order._id)}
                  disabled={emailingInvoiceId === order._id}
                  style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', fontSize: '12px', fontWeight: '700', padding: '7px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  title="Email Tax Invoice to registered email"
                >
                  <Mail size={14} />
                  {emailingInvoiceId === order._id ? 'Sending...' : 'Email'}
                </button>

                {/* PDF Invoice Download */}
                <button
                  className="btn btn-primary"
                  onClick={() => handleDownloadInvoice(order._id)}
                  disabled={downloadingOrderId === order._id}
                  style={{ fontSize: '12px', fontWeight: '800', padding: '7px 14px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                >
                  <Download size={14} />
                  {downloadingOrderId === order._id ? 'Generating...' : 'Tax Invoice'}
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
