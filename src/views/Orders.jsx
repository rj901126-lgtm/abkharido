import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
// eslint-disable-next-line
import { History, Calendar, CreditCard, ShieldCheck, ShoppingBag, Truck, ChevronDown, ChevronUp, ChevronRight, Download, Search, Filter } from 'lucide-react';
import WorldClassInvoice from '../components/WorldClassInvoice';

const Orders = ({ onNavigate }) => {
  const { orders, hasMoreOrders, currentUser, fetchOrders, cancelOrder, addToCart, showToast } = useApp();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  
  const [activeTrackingId, setActiveTrackingId] = useState(null); 
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [orderToReturn, setOrderToReturn] = useState(null); 
  const [returnReason, setReturnReason] = useState('');

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
      // eslint-disable-next-line
      fetchOrders(currentUser.username || currentUser.email, 1, debouncedSearch, statusFilter, timeFilter);
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

  const handleCancelOrder = async () => {
    if (!orderToCancel) return;
    const token = localStorage.getItem('abkharido_token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/orders/${orderToCancel}/user-cancel`, {
        method: 'POST',
        headers: { 'x-auth-token': token }
      });
      if (res.ok) {
        showToast('Order cancelled successfully', 'success');
        setOrderToCancel(null);
        fetchOrders();
      } else {
        const data = await res.json();
        showToast(`Failed to cancel: ${data.error || 'Unknown error'}`, 'error');
      }
    } catch (err) {
      showToast('Network error while cancelling', 'error');
    }
  };

  const handleRequestReturn = async () => {
    if (!orderToReturn) return;
    const token = localStorage.getItem('abkharido_token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/orders/${orderToReturn}/return`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-auth-token': token 
        },
        body: JSON.stringify({ reason: returnReason })
      });
      if (res.ok) {
        showToast('Return requested successfully', 'success');
        setOrderToReturn(null);
        setReturnReason('');
        fetchOrders();
      } else {
        const data = await res.json();
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
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

        {/* Search inside header */}
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
      </div>

      {orders.length === 0 ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '48px 24px 120px 24px', textAlign: 'center',
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
          <p style={{ color: '#64748b', fontSize: '14px', maxWidth: '260px', lineHeight: '1.6', marginBottom: '28px' }}>
            {searchQuery || statusFilter !== 'all'
              ? "Try a different search or filter to find your orders."
              : "You haven't placed any orders yet on AbKharido.com. Start exploring VIP deals!"}
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <button
              onClick={() => onNavigate('catalog')}
              style={{
                padding: '15px 32px',
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                color: 'white', border: 'none', borderRadius: '14px',
                fontSize: '15px', fontWeight: '800', cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(79, 70, 229, 0.4)',
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              🛍️ Start Shopping
            </button>
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
                {order.orderItems && order.orderItems.length > 0 ? (
                  <div style={{ width: '74px', height: '74px', borderRadius: '12px', overflow: 'hidden', background: '#f8fafc', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', padding: '4px' }}>
                    <img src={order.orderItems[0].image} alt={order.orderItems[0].name} style={{ width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'multiply' }} />
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
                      background: order.status === 'CANCELLED' ? '#fef2f2' : order.status === 'Delivered' ? '#ecfdf5' : '#fffbeb',
                      color: order.status === 'CANCELLED' ? '#ef4444' : order.status === 'Delivered' ? '#059669' : '#d97706',
                      border: `1px solid ${order.status === 'CANCELLED' ? '#fecaca' : order.status === 'Delivered' ? '#a7f3d0' : '#fde68a'}`
                    }}>
                      {order.status === 'Delivered' ? '✅ Delivered' : order.status === 'CANCELLED' ? '❌ Cancelled' : `🚚 ${order.status || 'Processing'}`}
                    </span>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                      ₹{(order.totalPrice || 0).toLocaleString('en-IN')} • {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  
                  {order.orderItems && order.orderItems.length > 0 && (
                    <div style={{ fontSize: '14.5px', color: '#0f172a', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                      {order.orderItems[0].name}
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
                        order.orderItems.forEach(item => addToCart(item));
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
            <div className="order-card-header">
              <div className="order-meta-item">
                <span className="order-meta-label">ORDER PLACED</span>
                <div className="order-meta-value"><Calendar size={14} /> {new Date(order.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</div>
              </div>
              <div className="order-meta-item">
                <span className="order-meta-label">TOTAL AMOUNT</span>
                <div className="order-meta-value">₹{(order.totalPrice || 0).toLocaleString('en-IN')}</div>
              </div>
              <div className="order-meta-item">
                <span className="order-meta-label">SHIP TO</span>
                <div className="order-meta-value" title={(order.shippingAddress?.streetAddress || order.shippingAddress?.address || '')}>{(order.shippingAddress?.name || order.shippingAddress?.fullName || 'Customer')}</div>
              </div>
              <div className="order-meta-item">
                <span className="order-meta-label">ORDER #</span>
                <div className="order-meta-value"><code>{order._id}</code></div>
              </div>
            </div>

            {/* Order Status Badge & Timeline */}
            {(() => {
              const status = order.status;
              let width = '0%';
              let orderedClass = 'completed';
              let packedClass = '';
              let transitClass = '';
              let deliveredClass = '';
              let orderedIcon = '✓';
              let packedIcon = '●';
              let transitIcon = '●';
              let deliveredIcon = '●';

              if (status === 'CANCELLED') {
                width = '0%';
                orderedClass = 'cancelled';
                orderedIcon = '✕';
              } else if (status === 'Processing') {
                width = '0%';
                orderedClass = 'completed';
                orderedIcon = '✓';
                packedClass = 'active';
              } else if (status === 'Packed') {
                width = '33%';
                orderedClass = 'completed';
                packedClass = 'completed';
                orderedIcon = '✓';
                packedIcon = '✓';
                transitClass = 'active';
              } else if (status === 'In Transit') {
                width = '66%';
                orderedClass = 'completed';
                packedClass = 'completed';
                transitClass = 'completed';
                orderedIcon = '✓';
                packedIcon = '✓';
                transitIcon = '✓';
                deliveredClass = 'active';
              } else if (status === 'Delivered') {
                width = '100%';
                orderedClass = 'completed';
                packedClass = 'completed';
                transitClass = 'completed';
                deliveredClass = 'completed';
                orderedIcon = '✓';
                packedIcon = '✓';
                transitIcon = '✓';
                deliveredClass = '✓';
              }

              return (
                <div className="order-status-banner">
                  <div className="order-status-header">
                    <Truck size={16} color="var(--primary-color)" />
                    <span className="order-status-text">Status:</span>
                    <span className={`badge ${status === 'CANCELLED' ? 'badge-error' : 'badge-info'}`} style={{ backgroundColor: status === 'CANCELLED' ? '#d32f2f' : '#2874f0', color: 'white' }}>
                      {status.toUpperCase()}
                    </span>
                    {status !== 'CANCELLED' && (
                      <span className="order-delivery-eta">
                        {status === 'Delivered' ? 'Delivered successfully' : 'Estimated Delivery: Tomorrow'}
                      </span>
                    )}
                  </div>

                  {/* Delivery Progress Timeline Tracker */}
                  <div className="timeline-container">
                    <div className="timeline-line"></div>
                    <div className="timeline-line-progress" style={{ width: width, backgroundColor: status === 'CANCELLED' ? '#d32f2f' : 'var(--success)' }}></div>
                    
                    <div className="timeline-step">
                      <div className={`timeline-node ${orderedClass}`}>
                        {orderedIcon}
                      </div>
                      <span className={`timeline-label ${orderedClass}`}>{status === 'CANCELLED' ? 'Cancelled' : 'Ordered'}</span>
                    </div>
                    <div className="timeline-step">
                      <div className={`timeline-node ${packedClass}`}>
                        {packedIcon}
                      </div>
                      <span className={`timeline-label ${packedClass}`}>Packed</span>
                    </div>
                    <div className="timeline-step">
                      <div className={`timeline-node ${transitClass}`}>
                        {transitIcon}
                      </div>
                      <span className={`timeline-label ${transitClass}`}>In Transit</span>
                    </div>
                    <div className="timeline-step">
                      <div className={`timeline-node ${deliveredClass}`}>
                        {deliveredIcon}
                      </div>
                      <span className={`timeline-label ${deliveredClass}`}>Delivered</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Expanded Shipment Tracking Panel */}
            {activeTrackingId === order._id && order.status !== 'CANCELLED' && (() => {
              const status = order.status;
              const p0 = { x: 50, y: 80 };
              const p1 = { x: 150, y: 20 };
              const p2 = { x: 350, y: 20 };
              const p3 = { x: 450, y: 80 };
              
              let t = 0.15; // default Processing
              if (status === 'Packed') t = 0.45;
              else if (status === 'In Transit') t = 0.75;
              else if (status === 'Delivered') t = 1.0;
              
              // Cubic Bezier curve path math
              const getCubicBezierXY = (paramT, start, c1, c2, end) => {
                const mt = 1 - paramT;
                const x = Math.pow(mt, 3) * start.x + 
                          3 * Math.pow(mt, 2) * paramT * c1.x + 
                          3 * mt * Math.pow(paramT, 2) * c2.x + 
                          Math.pow(paramT, 3) * end.x;
                const y = Math.pow(mt, 3) * start.y + 
                          3 * Math.pow(mt, 2) * paramT * c1.y + 
                          3 * mt * Math.pow(paramT, 2) * c2.y + 
                          Math.pow(paramT, 3) * end.y;
                return { x, y };
              };
              
              const truckPos = getCubicBezierXY(t, p0, p1, p2, p3);
              const strokeOffset = 420 * (1 - t);
              
              // Date calculations
              const orderDate = order.createdAt;
              const getFormattedDate = (days) => {
                try {
                  const date = new Date(orderDate);
                  date.setDate(date.getDate() + days);
                  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                // eslint-disable-next-line
                } catch (e) {
                  return orderDate;
                }
              };

              return (
                <div className="animate-fade-in" style={{ marginTop: '0px', marginBottom: '20px', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '16px', backgroundColor: 'white', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', borderBottom: '1px solid #f0f0f0', paddingBottom: '12px', marginBottom: '12px' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#878787', fontWeight: 'bold' }}>COURIER PARTNER</span>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#212121', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Truck size={14} color="var(--primary-color)" /> {order.courierPartner || 'Shiprocket (Delhivery)'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span style={{ fontSize: '11px', color: '#878787', fontWeight: 'bold' }}>TRACKING AWB</span>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                        {order.trackingNumber || `12${order._id.replace(/\D/g, '') || '9873210423'}`}
                      </div>
                      <a 
                        href={`https://shiprocket.co/tracking/${order.trackingNumber || ('12' + (order._id.replace(/\D/g, '') || '9873210423'))}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ fontSize: '11px', color: 'var(--success)', fontWeight: 'bold', textDecoration: 'underline', marginTop: '4px', display: 'inline-flex', alignItems: 'center', gap: '2px' }}
                      >
                        Track on Shiprocket Portal ↗
                      </a>
                    </div>
                  </div>

                  {/* Live Route Map (SVG) */}
                  <div style={{ position: 'relative', width: '100%', overflow: 'hidden', marginBottom: '20px' }}>
                    <svg viewBox="0 0 500 130" style={{ width: '100%', height: 'auto', backgroundColor: '#fcfdfd', border: '1px solid #f0f0f0', borderRadius: '6px', padding: '10px 10px 20px 10px', boxSizing: 'border-box' }}>
                      {/* Dotted path background */}
                      <path d="M 50 80 C 150 20, 350 20, 450 80" fill="none" stroke="#e2e8f0" strokeWidth="3" strokeDasharray="6,6" />
                      
                      {/* Active path colored on top */}
                      <path 
                        d="M 50 80 C 150 20, 350 20, 450 80" 
                        fill="none" 
                        stroke="var(--success)" 
                        strokeWidth="3.5" 
                        strokeDasharray="420"
                        strokeDashoffset={strokeOffset}
                        style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                      />
                      
                      {/* Origin node (Fulfillment Center) */}
                      <g transform="translate(50, 80)">
                        <circle r="8" fill="var(--primary-color)" />
                        <circle r="12" fill="var(--primary-color)" fillOpacity="0.2" />
                        <text y="24" textAnchor="middle" style={{ fontSize: '9px', fontWeight: 'bold', fill: '#666' }}>Warehouse Hub</text>
                      </g>
                      
                      {/* Transit Node (Sorting facility) */}
                      <g transform="translate(250, 35)">
                        <circle r="7" fill={t >= 0.45 ? 'var(--primary-color)' : '#cbd5e1'} />
                        {t >= 0.45 && <circle r="11" fill="var(--primary-color)" fillOpacity="0.15" />}
                        <text y="-14" textAnchor="middle" style={{ fontSize: '9px', fontWeight: 'bold', fill: '#666' }}>Sorting Hub</text>
                      </g>
                      
                      {/* Destination Node (Customer Address) */}
                      <g transform="translate(450, 80)">
                        <circle r="8" fill={status === 'Delivered' ? 'var(--success)' : '#cbd5e1'} />
                        {status === 'Delivered' && <circle r="12" fill="var(--success)" fillOpacity="0.2" />}
                        <text y="24" textAnchor="middle" style={{ fontSize: '9px', fontWeight: 'bold', fill: '#666' }}>
                          {(order.shippingAddress?.city || '') ? `${(order.shippingAddress?.city || '')} (${(order.shippingAddress?.pincode || order.shippingAddress?.postalCode || '')})` : 'Destination'}
                        </text>
                      </g>
                      
                      {/* Moving Truck Icon */}
                      <g transform={`translate(${truckPos.x}, ${truckPos.y})`} style={{ transition: 'transform 1s ease-in-out' }}>
                        <circle r="13" fill="#fb641b" fillOpacity="0.2" />
                        <path d="M-8,-5 L1,-5 L5,-1 L5,4 L-8,4 Z" fill="#fb641b" />
                        <rect x="5" y="-1" width="3" height="5" fill="#fb641b" />
                        <circle cx="-4" cy="4" r="2" fill="#212121" />
                        <circle cx="3" cy="4" r="2" fill="#212121" />
                      </g>
                    </svg>
                  </div>

                  {/* Detailed Shipping Checkpoints Stepper */}
                  <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '12px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#212121', marginBottom: '12px' }}>Shipment Checkpoints</div>
                    <div className="tracking-checkpoints-list">
                      
                      {/* Delivered step */}
                      {(status === 'Delivered') && (
                        <div className="tracking-checkpoint-item completed">
                          <div className="tracking-checkpoint-node"></div>
                          <div className="tracking-checkpoint-title">Delivered Successfully</div>
                          <div className="tracking-checkpoint-desc">Package delivered directly to {(order.shippingAddress?.name || order.shippingAddress?.fullName || 'Customer')} at destination location.</div>
                          <div className="tracking-checkpoint-date">{getFormattedDate(2)}</div>
                        </div>
                      )}

                      {/* Out for Delivery step */}
                      {(status === 'In Transit' || status === 'Delivered') && (
                        <div className={`tracking-checkpoint-item ${status === 'In Transit' ? 'active' : 'completed'}`}>
                          <div className="tracking-checkpoint-node"></div>
                          <div className="tracking-checkpoint-title">Out for Delivery</div>
                          <div className="tracking-checkpoint-desc">Package is with local courier delivery partner near {(order.shippingAddress?.city || '') || 'your city'}.</div>
                          <div className="tracking-checkpoint-date">{getFormattedDate(1)}</div>
                        </div>
                      )}

                      {/* Transit Hub step */}
                      {(status === 'Packed' || status === 'In Transit' || status === 'Delivered') && (
                        <div className={`tracking-checkpoint-item ${status === 'Packed' ? 'active' : 'completed'}`}>
                          <div className="tracking-checkpoint-node"></div>
                          <div className="tracking-checkpoint-title">Reached Sorting Hub</div>
                          <div className="tracking-checkpoint-desc">Package processed and dispatched from regional sorting facility hub.</div>
                          <div className="tracking-checkpoint-date">{getFormattedDate(1)}</div>
                        </div>
                      )}

                      {/* Packed step */}
                      {(status === 'Processing' || status === 'Packed' || status === 'In Transit' || status === 'Delivered') && (
                        <div className={`tracking-checkpoint-item ${status === 'Processing' ? 'active' : 'completed'}`}>
                          <div className="tracking-checkpoint-node"></div>
                          <div className="tracking-checkpoint-title">Package Packed & Secured</div>
                          <div className="tracking-checkpoint-desc">Item inspected, bubble wrapped and handed over to Delhivery logistics partner.</div>
                          <div className="tracking-checkpoint-date">{getFormattedDate(0)}</div>
                        </div>
                      )}

                      {/* Order Placed step */}
                      <div className="tracking-checkpoint-item completed">
                        <div className="tracking-checkpoint-node"></div>
                        <div className="tracking-checkpoint-title">Order Placed & Confirmed</div>
                        <div className="tracking-checkpoint-desc">Order request received and payment validation checked successfully.</div>
                        <div className="tracking-checkpoint-date">{getFormattedDate(0)}</div>
                      </div>

                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Order Items */}
            <div className="order-item-list">
              {(order.orderItems || []).map((item, index) => { 
                return (
                <div key={item.product || index} className="order-item-row">
                  <div className="order-item-image">
                    <img src={item.image} alt={item.name} />
                  </div>
                  <div className="order-item-info">
                    <h4 className="order-item-title">{item.name}</h4>
                    <div className="order-item-meta">
                      Qty: {item.qty || item.quantity} {item.selectedColor ? `| ${item.selectedColor}` : ''} {item.selectedVariant ? `| ${item.selectedVariant}` : ''}
                    </div>
                    <div className="order-item-price">
                      ₹{(item.price || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <button 
                    className="btn btn-outline btn-sm" 
                    onClick={() => {
                      const productToAdd = { id: item.product, name: item.name, price: item.price, image: item.image, selectedColor: item.selectedColor, selectedVariant: item.selectedVariant };
                      addToCart(productToAdd, 1);
                      onNavigate('cart');
                    }}
                  >
                    Buy Again
                  </button>
                </div>
              )})}
            </div>

            {/* Bottom Meta & Referral info */}
            <div className="order-footer-actions">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <CreditCard size={14} />
                <span>Payment Mode: <strong>{order.paymentMethod}</strong></span>
                {order.coinsDiscountValue > 0 && (
                  <span style={{ color: '#e68f00', marginLeft: '6px' }}>(Redeemed {order.coinsDiscountValue} Coins)</span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                {order.status !== 'CANCELLED' && (
                  <button
                    className="btn btn-outline"
                    style={{
                      borderColor: 'var(--primary-color)',
                      color: 'var(--primary-color)',
                      backgroundColor: activeTrackingId === order._id ? '#f0f4ff' : 'transparent'
                    }}
                    onClick={() => setActiveTrackingId(activeTrackingId === order._id ? null : order._id)}
                  >
                    <Truck size={14} />
                    <span>{activeTrackingId === order._id ? 'Hide Tracking' : 'Track Shipment'}</span>
                    {activeTrackingId === order._id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                )}

                  {/* Cancel Button */}
                  {order.status !== 'Delivered' && order.status !== 'In Transit' && order.status !== 'CANCELLED' && order.status !== 'Cancelled' && (
                    <button
                      className="btn btn-outline"
                      style={{ borderColor: '#ef4444', color: '#ef4444' }}
                      onClick={() => setOrderToCancel(order._id)}
                    >
                      Cancel Order
                    </button>
                  )}
                  {/* Return Button */}
                  {order.status === 'Delivered' && (!order.returnStatus || order.returnStatus === 'None') && (
                    <button
                      className="btn btn-outline"
                      style={{ borderColor: '#eab308', color: '#eab308' }}
                      onClick={() => setOrderToReturn(order._id)}
                    >
                      Request Return (RMA)
                    </button>
                  )}
                  {order.returnStatus && order.returnStatus !== 'None' && (
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#b45309', padding: '8px 12px', backgroundColor: '#fef3c7', borderRadius: '4px', border: '1px solid #fde68a' }}>
                      Return {order.returnStatus}
                    </span>
                  )}
                
                <button
                  className="btn btn-primary"
                  onClick={() => handleDownloadInvoice(order._id)}
                  disabled={downloadingOrderId === order._id}
                >
                  <Download size={14} />
                  {downloadingOrderId === order._id ? 'Generating...' : 'Invoice'}
                </button>
              </div>

              {/* Hidden Premium Invoice Renderer */}
              <WorldClassInvoice ref={el => invoiceRefs.current[order._id] = el} order={order} />

              {/* Referral attribution display */}
              {order.referralApplied ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', color: '#166534', fontWeight: '500' }}>
                  <ShieldCheck size={14} color="var(--success)" />
                  <span>
                    Referred via link by:{' '}
                    <strong>
                      {order.referralApplied.referrerId} (
                      {order.referralApplied.type === 'aff' ? 'Influencer' : 'User'})
                    </strong>
                  </span>
                </div>
              ) : (
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Direct Purchase (No referral)</span>
              )}
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
      
      {/* Custom Enterprise Cancel Order Modal */}
      {orderToCancel && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setOrderToCancel(null)}>
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', animation: 'slideUp 0.3s ease-out' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <div style={{ width: '56px', height: '56px', backgroundColor: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={28} color="#ef4444" />
              </div>
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', textAlign: 'center', color: '#1e293b', marginBottom: '8px' }}>Cancel Order?</h3>
            <p style={{ fontSize: '14px', color: '#64748b', textAlign: 'center', marginBottom: '24px', lineHeight: '1.5' }}>
              Are you sure you want to cancel this order? If you have already paid, your refund will be initiated immediately.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-outline" style={{ flex: 1, padding: '12px', fontWeight: '600' }} onClick={() => setOrderToCancel(null)}>
                No, Keep it
              </button>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1, padding: '12px', backgroundColor: '#ef4444', borderColor: '#ef4444', fontWeight: '600' }} 
                onClick={() => {
                  cancelOrder(orderToCancel);
                  setOrderToCancel(null);
                }}
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Order Modal */}
      {orderToReturn && (
        <div className="modal-overlay" onClick={() => setOrderToReturn(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <h3 style={{ marginBottom: '16px' }}>Request Return (RMA)</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Are you sure you want to return this item? Please provide a reason below.
            </p>
            <textarea
              placeholder="Why are you returning this item? (e.g. Defective, Wrong Size, etc.)"
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              style={{ width: '100%', height: '80px', padding: '8px', border: '1px solid #e0e0e0', borderRadius: '4px', marginBottom: '16px' }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setOrderToReturn(null)}>Go Back</button>
              <button className="btn btn-primary" style={{ backgroundColor: '#eab308', border: 'none' }} onClick={handleRequestReturn}>Submit Request</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Orders;
