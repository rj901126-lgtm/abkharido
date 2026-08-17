import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../context/AppContext';
import { History, Calendar, CreditCard, ShieldCheck, ShoppingBag, Truck, ChevronDown, ChevronUp, ChevronRight, Download, Search, Filter, MessageCircle, RefreshCw, Star, CheckCircle, Clock, AlertTriangle, ArrowRight, Edit3 } from 'lucide-react';
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
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  
  const [activeTrackingId, setActiveTrackingId] = useState(null); 
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('Found a better price / deal elsewhere');
  const [orderToReturn, setOrderToReturn] = useState(null); 
  const [returnReason, setReturnReason] = useState('Item defective / not working');
  
  // New States: Address Edit, COD to Prepaid Conversion, Size Exchange
  const [orderToEditAddress, setOrderToEditAddress] = useState(null);
  const [editAddressForm, setEditAddressForm] = useState({ fullName: '', phone: '', postalCode: '', address: '', city: '', state: '' });
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  
  const [orderToExchange, setOrderToExchange] = useState(null);
  const [exchangeForm, setExchangeForm] = useState({ requestedSize: 'UK 9 / L', reason: 'Size too small / tight' });
  const [isSubmittingExchange, setIsSubmittingExchange] = useState(false);
  
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
    } catch (err) {
      showToast('Network error while cancelling', 'error');
    }
  };

  const handleRequestReturn = async () => {
    if (!orderToReturn) return;
    const token = currentUser?.token || (typeof window !== 'undefined' ? (localStorage.getItem('abkharido_token') || localStorage.getItem('abkharido_user_session')) : null);
    try {
      const res = await fetch(`/api/orders/${orderToReturn}/return`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ reason: returnReason })
      });
      if (res.ok) {
        showToast('Return requested successfully. Free doorstep inspection scheduled.', 'success');
        setOrderToReturn(null);
        setReturnReason('');
        fetchOrders();
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(`Failed to request return: ${data.error || 'Unknown error'}`, 'error');
      }
    } catch (err) {
      showToast('Network error while requesting return', 'error');
    }
  };

  const [isLoading, setIsLoading] = React.useState(true);
  React.useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 1500);
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
    <div className="orders-container animate-fade-in">

      {/* Premium Dark Orders Header */}
      <div style={{
        background: 'linear-gradient(135deg, #090d16 0%, #1e1b4b 60%, #312e81 100%)',
        borderRadius: '20px',
        padding: '20px 20px 24px 20px',
        marginBottom: '20px',
        boxShadow: '0 12px 40px rgba(30, 27, 75, 0.3)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: (orders.length === 0 && !searchQuery && statusFilter === 'all') ? '0px' : '16px' }}>
          <div style={{
            width: '44px', height: '44px',
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(79,70,229,0.4)',
          }}>
            <History size={22} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#ffffff', fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.3px', margin: 0 }}>My Orders</h1>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', margin: 0, marginTop: '2px' }}>Track, manage & return your purchases</p>
          </div>
        </div>

        {/* Search & filter inside header - hidden when user has zero order history to eliminate clutter */}
        {(orders.length > 0 || searchQuery !== '' || statusFilter !== 'all') && (
          <>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              background: 'rgba(255,255,255,0.1)', borderRadius: '12px',
              padding: '10px 14px', border: '1px solid rgba(255,255,255,0.12)',
              marginBottom: '12px',
            }}>
              <Search size={16} color="rgba(255,255,255,0.5)" />
              <input
                type="text"
                placeholder="Search orders, products or IDs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1, border: 'none', background: 'transparent',
                  color: '#ffffff', fontSize: '13px', outline: 'none',
                }}
              />
            </div>

            {/* Filter pills */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[{v:'all',l:'All'},{v:'processing',l:'In Progress'},{v:'delivered',l:'Delivered'},{v:'cancelled',l:'Cancelled'}].map(opt => (
                <button key={opt.v} onClick={() => setStatusFilter(opt.v)} style={{
                  padding: '6px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
                  border: statusFilter === opt.v ? '1px solid #7c3aed' : '1px solid rgba(255,255,255,0.15)',
                  background: statusFilter === opt.v ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : 'rgba(255,255,255,0.08)',
                  color: statusFilter === opt.v ? '#ffffff' : 'rgba(255,255,255,0.6)',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}>{opt.l}</button>
              ))}
            </div>
          </>
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
      ) : orders.length === 0 ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '40px 20px 120px 20px', textAlign: 'center',
        }}>
          {/* Animated icon */}
          <div style={{
            width: '120px', height: '120px',
            background: 'linear-gradient(135deg, #1e1b4b 0%, #4f46e5 100%)',
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '24px',
            boxShadow: '0 16px 48px rgba(79, 70, 229, 0.3)',
            animation: 'orderFloat 3s ease-in-out infinite',
          }}>
            <style>{`@keyframes orderFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }`}</style>
            <ShoppingBag size={52} color="#ffffff" strokeWidth={1.5} />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#090d16', fontFamily: "'Outfit', sans-serif", marginBottom: '10px' }}>
            {searchQuery || statusFilter !== 'all' ? 'No Orders Found' : 'No Orders Yet'}
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px', maxWidth: '280px', lineHeight: '1.6', marginBottom: '28px' }}>
            {searchQuery || statusFilter !== 'all'
              ? "Try a different search or filter to find your orders."
              : "You haven't placed any orders yet on AbKharido.com. Start exploring VIP deals and live savings!"}
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <div style={{ width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '28px' }}>
              <button
                onClick={() => navigateTo('home')}
                style={{
                  width: '100%',
                  padding: '16px 32px',
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  color: 'white', border: 'none', borderRadius: '16px',
                  fontSize: '16px', fontWeight: '800', cursor: 'pointer',
                  boxShadow: '0 8px 28px rgba(79, 70, 229, 0.45)',
                  fontFamily: "'Outfit', sans-serif",
                  transition: 'transform 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                🛍️ Start Shopping Now
              </button>

              <div style={{ width: '100%', textAlign: 'left' }}>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px', textAlign: 'center' }}>
                  ✨ Popular Categories to Explore
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  {[
                    { title: '⚡ Lightning Deals', sub: 'Up to 80% Off', color: '#d97706', bg: '#fffbeb', border: '#fde68a', path: 'home' },
                    { title: '📱 Smartphones', sub: '5G & VIP Models', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', path: 'catalog' },
                    { title: '👑 VIP Vault', sub: 'Member Exclusives', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', path: 'home' },
                    { title: '🎧 Tech & Gadgets', sub: 'Trending Sellers', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', path: 'catalog' }
                  ].map((card, idx) => (
                    <div
                      key={idx}
                      onClick={() => navigateTo(card.path)}
                      style={{
                        background: card.bg,
                        border: `1.5px solid ${card.border}`,
                        borderRadius: '16px',
                        padding: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        transition: 'transform 0.2s ease',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <span style={{ fontWeight: '800', fontSize: '13px', color: '#090d16', fontFamily: "'Outfit', sans-serif" }}>{card.title}</span>
                      <span style={{ fontWeight: '700', fontSize: '11px', color: card.color }}>{card.sub} →</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
      <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {orders.map(order => {
          const isExpanded = expandedOrderId === order._id;
          
          if (!isExpanded) {
            return (
              <div key={order._id} style={{ cursor: 'pointer', display: 'flex', gap: '14px', alignItems: 'center', padding: '16px', background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '16px', boxShadow: '0 4px 14px rgba(0,0,0,0.03)', transition: 'all 0.2s', position: 'relative' }} onClick={() => setExpandedOrderId(order._id)}>
                {order?.orderItems && order.orderItems.length > 0 && order.orderItems[0] ? (
                  <div style={{ width: '74px', height: '74px', borderRadius: '12px', overflow: 'hidden', background: '#f8fafc', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', padding: '4px' }}>
                    <img src={order.orderItems[0]?.image || ''} alt={order.orderItems[0]?.name || 'Product'} style={{ width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'multiply' }} />
                  </div>
                ) : (
                  <div style={{ width: '74px', height: '74px', borderRadius: '12px', background: '#f8fafc', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0' }}>
                    <ShoppingBag size={26} color="#94a3b8" />
                  </div>
                )}
                
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: '100px', 
                      fontSize: '11px', 
                      fontWeight: '800',
                      letterSpacing: '0.4px',
                      textTransform: 'uppercase',
                      background: order.status === 'Cancelled' ? '#fef2f2' : order.status === 'Delivered' ? '#ecfdf5' : '#fffbeb',
                      color: order.status === 'Cancelled' ? '#ef4444' : order.status === 'Delivered' ? '#059669' : '#d97706',
                      border: `1px solid ${order.status === 'Cancelled' ? '#fecaca' : order.status === 'Delivered' ? '#a7f3d0' : '#fde68a'}`
                    }}>
                      {order.status === 'Delivered' ? '✅ Delivered' : order.status === 'Cancelled' ? '❌ Cancelled' : `🚚 ${order.status || 'Processing'}`}
                    </span>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                      ₹{(order.totalPrice || 0).toLocaleString('en-IN')} • {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  
                  {order?.orderItems && order.orderItems.length > 0 && order.orderItems[0] && (
                    <div style={{ fontSize: '14.5px', color: '#0f172a', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                      {order.orderItems[0]?.name || 'Purchased Item'}
                    </div>
                  )}
                  
                  {order.orderItems && order.orderItems.length > 1 && (
                    <div style={{ fontSize: '12.5px', color: '#4f46e5', fontWeight: '700' }}>
                      +{order.orderItems.length - 1} more item{order.orderItems.length - 1 > 1 ? 's' : ''} in shipment
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end', flexShrink: 0 }}>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (order.orderItems) {
                        order.orderItems.forEach(item => {
                          const reorderProduct = {
                            id: item.product,
                            name: item.name,
                            price: item.price,
                            image: item.image,
                            originalPrice: item.price,
                          };
                          addToCart(reorderProduct, item.qty || 1);
                        });
                        showToast('Items added back to cart! 🛍️', 'success');
                      }
                    }}
                    style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', transition: 'background 0.2s', boxShadow: '0 2px 4px rgba(37,99,235,0.08)' }}
                    title="Repeat order"
                  >
                    🔄 Reorder
                  </button>
                  <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', display: 'flex', alignItems: 'center' }}>
                    Details <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            );
          }

          return (
          <div key={order._id} className="order-card" style={{ border: '2px solid var(--primary-color)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
               <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}><ShoppingBag size={20} color="var(--primary-color)" /> Order Details</h3>
               <button className="btn btn-outline btn-sm" onClick={() => setExpandedOrderId(null)} style={{ margin: 0, padding: '6px 12px', borderRadius: '6px', fontSize: '13px', backgroundColor: '#f1f5f9', border: 'none', color: '#475569', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                 Collapse <ChevronUp size={16} />
               </button>
            </div>

            {/* Order Card Header */}
            <div className="order-card-header" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px', alignItems: 'center' }}>
              <div className="order-meta-item">
                <span className="order-meta-label">ORDER PLACED</span>
                <div className="order-meta-value"><Calendar size={14} /> {new Date(order.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</div>
              </div>
              <div className="order-meta-item">
                <span className="order-meta-label">TOTAL AMOUNT</span>
                <div className="order-meta-value" style={{ fontWeight: '900', color: '#059669' }}>₹{(order.totalPrice || 0).toLocaleString('en-IN')}</div>
              </div>
              <div className="order-meta-item">
                <span className="order-meta-label">SHIP TO</span>
                <div className="order-meta-value" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span title={(order.shippingAddress?.streetAddress || order.shippingAddress?.address || '')}>
                    {(order.shippingAddress?.name || order.shippingAddress?.fullName || 'Customer')}
                  </span>
                  {(order.status === 'Placed' || order.status === 'Processing' || order.status === 'Pending') && (
                    <button
                      onClick={() => handleOpenEditAddress(order)}
                      style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '11.5px', fontWeight: '800', textDecoration: 'underline' }}
                      title="Edit delivery address before dispatch"
                    >
                      <Edit3 size={12} /> Edit
                    </button>
                  )}
                </div>
              </div>
              <div className="order-meta-item">
                <span className="order-meta-label">ORDER #</span>
                <div className="order-meta-value"><code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>{order._id}</code></div>
              </div>
            </div>

            {/* 🛡️ Doorstep Security Verification Code (For Active Deliveries) */}
            {order.status !== 'Cancelled' && order.status !== 'CANCELLED' && order.status !== 'Delivered' && (
              <div style={{
                background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                border: '1.5px solid #a7f3d0',
                borderRadius: '14px',
                padding: '12px 16px',
                margin: '14px 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '20px' }}>🛡️</span>
                  <div>
                    <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#065f46' }}>
                      Doorstep Delivery PIN Verification
                    </div>
                    <div style={{ fontSize: '11px', color: '#047857' }}>
                      Share this code with the delivery executive only upon receiving the package.
                    </div>
                  </div>
                </div>
                <div style={{
                  background: '#ffffff',
                  border: '2px dashed #059669',
                  borderRadius: '10px',
                  padding: '6px 14px',
                  fontSize: '16px',
                  fontWeight: '900',
                  color: '#065f46',
                  letterSpacing: '3px',
                  fontFamily: 'monospace',
                  boxShadow: '0 2px 8px rgba(5, 150, 105, 0.15)'
                }}>
                  {order.deliveryPin || (order._id ? order._id.replace(/\D/g, '').slice(-4) || '8492' : '8492')}
                </div>
              </div>
            )}

            {/* ⚡ COD to Prepaid Conversion Action Banner */}
            {(order.paymentMethod && (order.paymentMethod.toLowerCase().includes('cod') || order.paymentMethod.toLowerCase().includes('cash'))) && !order.isPaid && order.status !== 'Cancelled' && order.status !== 'CANCELLED' && order.status !== 'Delivered' && (
              <div style={{
                background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                border: '1.5px solid #fde68a',
                borderRadius: '16px',
                padding: '16px 20px',
                margin: '14px 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.12)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '24px' }}>⚡</span>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '900', color: '#92400e', fontFamily: "'Outfit', sans-serif" }}>
                      Pay Online via UPI & Earn 50 AB Coins Cashback!
                    </div>
                    <div style={{ fontSize: '12px', color: '#b45309', fontWeight: '500' }}>
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
                    padding: '10px 18px',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(217, 119, 6, 0.3)',
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
                padding: '18px 20px',
                margin: '16px 0',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.08)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <RefreshCw size={18} color="#1d4ed8" />
                    <span style={{ fontSize: '14px', fontWeight: '900', color: '#1e3a8a', fontFamily: "'Outfit', sans-serif" }}>
                      Return & Refund Progress Tracker
                    </span>
                  </div>
                  <span style={{ background: '#2563eb', color: 'white', fontSize: '11px', fontWeight: '800', padding: '4px 10px', borderRadius: '8px' }}>
                    {order.returnStatus.toUpperCase()}
                  </span>
                </div>
                
                {/* 4-Step Refund Timeline */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', textAlign: 'center' }}>
                  {[
                    { step: '1. Requested', desc: 'Inspection initiated', done: true },
                    { step: '2. Pickup', desc: 'Courier scheduled', done: order.returnStatus === 'Approved' || order.returnStatus === 'Refunded' },
                    { step: '3. QC Check', desc: 'Item verified', done: order.returnStatus === 'Approved' || order.returnStatus === 'Refunded' },
                    { step: '4. Refund Done', desc: 'Credited to Bank/Coins', done: order.returnStatus === 'Refunded' }
                  ].map((r, i) => (
                    <div key={i} style={{ background: r.done ? '#ffffff' : 'rgba(255,255,255,0.6)', padding: '10px 6px', borderRadius: '10px', border: r.done ? '1.5px solid #3b82f6' : '1px solid #cbd5e1' }}>
                      <div style={{ fontSize: '11.5px', fontWeight: '800', color: r.done ? '#1d4ed8' : '#64748b' }}>{r.step}</div>
                      <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>{r.desc}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '12px', fontSize: '11.5px', color: '#1e40af', fontWeight: '600' }}>
                  Reference Refund ID: <code>REF-{order._id.substring(0, 8).toUpperCase()}</code> (Amount: ₹{(order.totalPrice || 0).toLocaleString('en-IN')})
                </div>
              </div>
            )}

            {/* 🔄 Size / Variant Exchange Status Banner */}
            {order.exchangeStatus && order.exchangeStatus !== 'None' && (
              <div style={{
                background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
                border: '1.5px solid #ddd6fe',
                borderRadius: '16px',
                padding: '14px 18px',
                margin: '14px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{ fontSize: '22px' }}>🔄</span>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: '900', color: '#5b21b6' }}>
                    Replacement Size Exchange: {order.exchangeSize || 'Requested'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6d28d9' }}>
                    Free doorstep exchange scheduled. Hand over the current item when the delivery courier brings your new size.
                  </div>
                </div>
              </div>
            )}

            {/* 🚀 VIP Live Order Tracker & Delivery Telemetry */}
            {(() => {
              const status = order.status || 'Processing';
              const isCancelled = status === 'CANCELLED' || status === 'Cancelled';
              
              let stepIndex = 1;
              if (status === 'Packed') stepIndex = 2;
              else if (status === 'In Transit' || status === 'Shipped') stepIndex = 3;
              else if (status === 'Delivered') stepIndex = 4;
              else if (isCancelled) stepIndex = 0;

              const steps = [
                { label: 'Order Placed', desc: 'Verified & Accepted', icon: '📝' },
                { label: 'Packed & Tested', desc: '360° Quality Verified', icon: '📦' },
                { label: 'In Transit', desc: 'Express Air-Dispatch', icon: '🚚' },
                { label: 'Delivered', desc: 'OTP Handover Done', icon: '🎉' }
              ];

              return (
                <div style={{ background: isCancelled ? 'linear-gradient(135deg, #fff1f2 0%, #fef2f2 100%)' : 'linear-gradient(135deg, #090d16 0%, #1e293b 100%)', borderRadius: '20px', padding: '20px', margin: '16px 0', border: isCancelled ? '1.5px solid #fecdd3' : '1px solid rgba(255,255,255,0.12)', color: isCancelled ? '#9f1239' : '#ffffff', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
                  
                  {/* Status Top Strip */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', paddingBottom: '16px', borderBottom: isCancelled ? '1px solid #fecdd3' : '1px solid rgba(255,255,255,0.12)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '24px', background: isCancelled ? '#ffe4e6' : 'rgba(56,189,248,0.2)', padding: '8px', borderRadius: '14px' }}>
                        {isCancelled ? '❌' : '🚀'}
                      </span>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: isCancelled ? '#e11d48' : '#38bdf8' }}>
                          {isCancelled ? 'Order Status' : 'Live Delivery Radar'}
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: '900', color: isCancelled ? '#881337' : '#ffffff' }}>
                          {isCancelled ? 'ORDER CANCELLED' : status === 'Delivered' ? 'DELIVERED SAFELY TO YOUR DOORSTEP' : `IN PROGRESS: ${status.toUpperCase()}`}
                        </div>
                      </div>
                    </div>
                    
                    {!isCancelled && (
                      <span style={{ fontSize: '12px', fontWeight: '800', background: status === 'Delivered' ? '#059669' : '#3b82f6', color: '#ffffff', padding: '6px 14px', borderRadius: '20px', boxShadow: '0 2px 10px rgba(59, 130, 246, 0.35)' }}>
                        {status === 'Delivered' ? '✅ Complete' : '⚡ Est. Arrival: Within 2–3 Days'}
                      </span>
                    )}
                  </div>

                  {/* Cancelled Alert Box */}
                  {isCancelled ? (
                    <div style={{ marginTop: '16px', fontSize: '13.5px', fontWeight: '600', lineHeight: 1.5, color: '#9f1239' }}>
                      🛑 This order has been officially cancelled {order.cancellationReason ? `(Reason: ${order.cancellationReason})` : ''}. If any online debit/UPI payment was pre-captured, an automated full refund has been initiated to your original bank source via Cashfree Escrow (clears in 24-48 business hours).
                    </div>
                  ) : (
                    /* 4-Step Animated Visual Milestones */
                    <div style={{ marginTop: '20px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', position: 'relative' }}>
                        
                        {/* Connecting Track Bar background */}
                        <div style={{ position: 'absolute', top: '22px', left: '12%', right: '12%', height: '4px', background: 'rgba(255,255,255,0.15)', zIndex: 1, borderRadius: '4px' }}>
                          <div style={{ 
                            height: '100%', 
                            borderRadius: '4px',
                            background: 'linear-gradient(90deg, #38bdf8, #22c55e)', 
                            width: stepIndex === 1 ? '15%' : stepIndex === 2 ? '50%' : stepIndex === 3 ? '85%' : '100%',
                            transition: 'width 0.5s ease-in-out',
                            boxShadow: '0 0 10px rgba(34, 197, 94, 0.6)'
                          }} />
                        </div>

                        {steps.map((st, idx) => {
                          const isCompleted = stepIndex > idx + 1;
                          const isCurrent = stepIndex === idx + 1;
                          return (
                            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', zIndex: 2 }}>
                              <div style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '18px',
                                background: isCompleted || isCurrent ? '#22c55e' : '#334155',
                                border: isCurrent ? '3px solid #fde047' : isCompleted ? '2px solid #ffffff' : '2px solid rgba(255,255,255,0.2)',
                                boxShadow: isCurrent ? '0 0 16px rgba(253, 224, 71, 0.5)' : 'none',
                                transition: 'all 0.3s'
                              }}>
                                {isCompleted ? '✓' : st.icon}
                              </div>
                              <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: '800', color: isCompleted || isCurrent ? '#ffffff' : '#94a3b8' }}>
                                {st.label}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Live Radar Courier Footer */}
                      <div style={{ marginTop: '24px', paddingTop: '14px', borderTop: '1px dashed rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', fontSize: '12px', color: '#cbd5e1' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 8px #22c55e' }}></span>
                          <span>Courier Partner: <strong style={{ color: 'white' }}>{order.courierPartner || 'Delhivery Express Air'}</strong> · AWB: <strong style={{ color: '#38bdf8', fontFamily: 'monospace', fontSize: '13px' }}>{order.awbNumber || `DEL${order._id.replace(/\D/g, '') || '87492104'}`}</strong></span>
                        </span>
                        <a 
                          href={order.trackingUrl || `https://track.delhivery.com/p/${order.awbNumber || '87492104'}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ color: '#fde047', fontWeight: '800', textDecoration: 'underline', background: 'rgba(253, 224, 71, 0.1)', padding: '4px 10px', borderRadius: '8px' }}
                        >
                          Live Courier Tracking ↗
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Order Items List */}
            <div className="order-item-list">
              {(order.orderItems || []).map((item, index) => (
                <div key={item.product || index} className="order-item-row" style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <div className="order-item-image" style={{ width: '70px', height: '70px', borderRadius: '12px', overflow: 'hidden', background: '#f8fafc', flexShrink: 0, padding: '4px', border: '1px solid #e2e8f0' }}>
                    <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                  <div className="order-item-info" style={{ flex: 1, minWidth: 0 }}>
                    <h4 className="order-item-title" style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0' }}>{item.name}</h4>
                    <div className="order-item-meta" style={{ fontSize: '12.5px', color: '#64748b' }}>
                      Qty: <strong>{item.qty || item.quantity || 1}</strong> {item.color ? `| Color: ${item.color}` : ''} {item.variant ? `| Size: ${item.variant}` : ''}
                    </div>
                    <div className="order-item-price" style={{ fontSize: '15px', fontWeight: '900', color: '#059669', marginTop: '4px' }}>
                      ₹{(item.price || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end', flexShrink: 0 }}>
                    <button 
                      className="btn btn-outline btn-sm" 
                      onClick={() => {
                        const productToAdd = { id: item.product || item.customId, name: item.name, price: item.price, image: item.image };
                        addToCart(productToAdd, item.qty || 1);
                        showToast(`🛍️ ${item.name} added to cart!`, 'success');
                        navigateTo('cart');
                      }}
                      style={{ borderRadius: '8px', fontSize: '12px', fontWeight: '800' }}
                    >
                      🔄 Buy Again
                    </button>
                    {order.status === 'Delivered' && (
                      <button
                        onClick={() => {
                          const rating = prompt('Rate this product (1 to 5 stars):', '5');
                          const comment = prompt('Write your verified buyer review:');
                          if (rating && comment) {
                            showToast('⭐ Thank you! Your verified purchase review has been submitted for approval.', 'success');
                          }
                        }}
                        style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#b45309', borderRadius: '8px', fontSize: '11px', fontWeight: '800', padding: '4px 8px', cursor: 'pointer' }}
                      >
                        ⭐ Rate Item
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Meta & Actions */}
            <div className="order-footer-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569' }}>
                <CreditCard size={15} color="#4f46e5" />
                <span>Payment: <strong>{order.paymentMethod || 'Online'}</strong></span>
                {order.isPaid ? (
                  <span style={{ background: '#ecfdf5', color: '#059669', fontSize: '11px', fontWeight: '800', padding: '2px 8px', borderRadius: '6px' }}>PAID</span>
                ) : (
                  <span style={{ background: '#fffbeb', color: '#d97706', fontSize: '11px', fontWeight: '800', padding: '2px 8px', borderRadius: '6px' }}>COD PENDING</span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                {/* WhatsApp Support Button */}
                <a
                  href={`https://wa.me/919172600587?text=${encodeURIComponent(`Hi AbKharido Support, I need help with my Order #${order._id} (Total: ₹${order.totalPrice}).`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '8px 12px',
                    background: '#25D366',
                    color: '#ffffff',
                    borderRadius: '10px',
                    textDecoration: 'none',
                    fontSize: '12px',
                    fontWeight: '800',
                    boxShadow: '0 2px 8px rgba(37, 211, 102, 0.3)'
                  }}
                >
                  <MessageCircle size={14} /> WhatsApp Help
                </a>

                {/* Cancel Button (Active before dispatch) */}
                {order.status !== 'Delivered' && order.status !== 'In Transit' && order.status !== 'Shipped' && order.status !== 'CANCELLED' && order.status !== 'Cancelled' && (
                  <button
                    className="btn btn-outline"
                    style={{ borderColor: '#ef4444', color: '#ef4444', fontSize: '12px', fontWeight: '700', padding: '8px 12px', borderRadius: '10px' }}
                    onClick={() => setOrderToCancel(order._id)}
                  >
                    Cancel Order
                  </button>
                )}

                {/* Size Exchange Button (If delivered) */}
                {order.status === 'Delivered' && (!order.exchangeStatus || order.exchangeStatus === 'None') && (
                  <button
                    className="btn btn-outline"
                    style={{ borderColor: '#7c3aed', color: '#7c3aed', fontSize: '12px', fontWeight: '700', padding: '8px 12px', borderRadius: '10px' }}
                    onClick={() => setOrderToExchange(order)}
                  >
                    🔄 Exchange Size
                  </button>
                )}

                {/* Return Button (If delivered) */}
                {order.status === 'Delivered' && (!order.returnStatus || order.returnStatus === 'None') && (
                  <button
                    className="btn btn-outline"
                    style={{ borderColor: '#eab308', color: '#b45309', fontSize: '12px', fontWeight: '700', padding: '8px 12px', borderRadius: '10px' }}
                    onClick={() => setOrderToReturn(order._id)}
                  >
                    ↩️ Return (RMA)
                  </button>
                )}

                {/* Tax Invoice Download */}
                <button
                  className="btn btn-primary"
                  onClick={() => handleDownloadInvoice(order._id)}
                  disabled={downloadingOrderId === order._id}
                  style={{ fontSize: '12px', fontWeight: '800', padding: '8px 14px', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Download size={14} />
                  {downloadingOrderId === order._id ? 'Generating...' : 'Tax Invoice'}
                </button>
              </div>

              {/* Hidden Premium Invoice Renderer */}
              <WorldClassInvoice ref={el => invoiceRefs.current[order._id] = el} order={order} />
            </div>
          </div>
        )})}
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
      
      {/* ✏️ Edit Shipping Address Modal */}
      {orderToEditAddress && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setOrderToEditAddress(null)}>
          <div style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '440px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', margin: 0 }}>✏️ Update Delivery Address</h3>
              <button onClick={() => setOrderToEditAddress(null)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
              Modify recipient name, phone, or delivery postal PIN before package dispatch.
            </p>
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
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setOrderToEditAddress(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1 }} disabled={isSavingAddress} onClick={handleSaveAddress}>
                {isSavingAddress ? 'Saving...' : 'Save Address'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔄 Size / Variant Exchange Modal */}
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

      {/* ❌ Enhanced Cancel Order Modal with Categorized Reasons */}
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

      {/* ↩️ Return Order Modal */}
      {orderToReturn && (
        <div className="modal-overlay" onClick={() => setOrderToReturn(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px', borderRadius: '20px', padding: '24px' }}>
            <h3 style={{ marginBottom: '10px', fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>↩️ Request Return (RMA)</h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
              Our courier will inspect and pick up the item from your doorstep. 100% full refund will be processed upon QC pass.
            </p>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>Return Reason *</label>
              <select
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '13.5px', marginBottom: '12px' }}
              >
                <option value="Item defective / not working properly">Item defective / not working properly</option>
                <option value="Received wrong item or incorrect variant">Received wrong item or incorrect variant</option>
                <option value="Item arrived damaged or in open box">Item arrived damaged or in open box</option>
                <option value="Quality not as described on website">Quality not as described on website</option>
                <option value="Performance issues after unboxing">Performance issues after unboxing</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setOrderToReturn(null)}>Go Back</button>
              <button className="btn btn-primary" style={{ flex: 1, backgroundColor: '#eab308', borderColor: '#eab308', fontWeight: '800' }} onClick={handleRequestReturn}>
                Submit Return
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Orders;
