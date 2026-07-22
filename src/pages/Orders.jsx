import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { History, Calendar, CreditCard, ShieldCheck, ShoppingBag, Truck, ChevronDown, ChevronUp, Download } from 'lucide-react';
import WorldClassInvoice from '../components/WorldClassInvoice';

const Orders = ({ onNavigate }) => {
  const { orders, currentUser, fetchOrders, cancelOrder, addToCart } = useApp();
  const [activeTrackingId, setActiveTrackingId] = useState(null);

  React.useEffect(() => {
    if (currentUser) {
      fetchOrders(currentUser.username || currentUser.email);
    }
  }, [currentUser]); // re-fetch if user changes

  const invoiceRefs = useRef({});
  const [downloadingOrderId, setDownloadingOrderId] = useState(null);

  const handleDownloadInvoice = (orderId) => {
    const ref = invoiceRefs.current[orderId];
    if (ref && !downloadingOrderId) {
      setDownloadingOrderId(orderId);
      ref.generatePDF().finally(() => setDownloadingOrderId(null));
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

  if (orders.length === 0) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <div style={{ display: 'inline-flex', padding: '16px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', marginBottom: '16px' }}>
          <History size={48} color="var(--primary-color)" />
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>No Orders Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '14px' }}>
          You haven't placed any orders yet on AbKharido.com.
        </p>
        <button 
          className="btn btn-primary" 
          style={{ marginTop: '20px' }} 
          onClick={() => onNavigate('catalog')}
        >
          Go Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="orders-container animate-fade-in">
      <h1 className="orders-header">
        <History size={24} color="var(--primary-color)" /> Order History
      </h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {orders.map(order => (
          <div key={order.id} className="order-card">
            
            {/* Order Card Header */}
            <div className="order-card-header">
              <div className="order-meta-item">
                <span className="order-meta-label">ORDER PLACED</span>
                <div className="order-meta-value"><Calendar size={14} /> {order.date}</div>
              </div>
              <div className="order-meta-item">
                <span className="order-meta-label">TOTAL AMOUNT</span>
                <div className="order-meta-value">₹{order.finalAmount.toLocaleString('en-IN')}</div>
              </div>
              <div className="order-meta-item">
                <span className="order-meta-label">SHIP TO</span>
                <div className="order-meta-value" title={order.shippingAddress.streetAddress}>{order.shippingAddress.name}</div>
              </div>
              <div className="order-meta-item">
                <span className="order-meta-label">ORDER #</span>
                <div className="order-meta-value"><code>{order.id}</code></div>
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
                deliveredIcon = '✓';
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
            {activeTrackingId === order.id && order.status !== 'CANCELLED' && (() => {
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
              const orderDate = order.date;
              const getFormattedDate = (days) => {
                try {
                  const date = new Date(orderDate);
                  date.setDate(date.getDate() + days);
                  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
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
                        {order.trackingNumber || `12${order.id.replace(/\D/g, '') || '9873210423'}`}
                      </div>
                      <a 
                        href={`https://shiprocket.co/tracking/${order.trackingNumber || ('12' + (order.id.replace(/\D/g, '') || '9873210423'))}`}
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
                          {order.shippingAddress.city ? `${order.shippingAddress.city} (${order.shippingAddress.pincode})` : 'Destination'}
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
                          <div className="tracking-checkpoint-desc">Package delivered directly to {order.shippingAddress.name} at destination location.</div>
                          <div className="tracking-checkpoint-date">{getFormattedDate(2)}</div>
                        </div>
                      )}

                      {/* Out for Delivery step */}
                      {(status === 'In Transit' || status === 'Delivered') && (
                        <div className={`tracking-checkpoint-item ${status === 'In Transit' ? 'active' : 'completed'}`}>
                          <div className="tracking-checkpoint-node"></div>
                          <div className="tracking-checkpoint-title">Out for Delivery</div>
                          <div className="tracking-checkpoint-desc">Package is with local courier delivery partner near {order.shippingAddress.city || 'your city'}.</div>
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
              {order.items.map(item => { 
                const prod = item.product; 
                return (
                <div key={prod.id} className="order-item-row">
                  <div className="order-item-image">
                    <img src={prod.image} alt={prod.name} />
                  </div>
                  <div className="order-item-info">
                    <h4 className="order-item-title">{prod.name}</h4>
                    <div className="order-item-meta">
                      Qty: {item.quantity} {item.selectedColor ? `| ${item.selectedColor}` : ''} {item.selectedVariant ? `| ${item.selectedVariant}` : ''}
                    </div>
                    <div className="order-item-price">
                      ₹{(prod.price || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <button 
                    className="btn btn-outline btn-sm" 
                    onClick={() => {
                      const productToAdd = { ...prod, selectedColor: item.selectedColor, selectedVariant: item.selectedVariant };
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
                      backgroundColor: activeTrackingId === order.id ? '#f0f4ff' : 'transparent'
                    }}
                    onClick={() => setActiveTrackingId(activeTrackingId === order.id ? null : order.id)}
                  >
                    <Truck size={14} />
                    <span>{activeTrackingId === order.id ? 'Hide Tracking' : 'Track Shipment'}</span>
                    {activeTrackingId === order.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                )}

                {/* Cancel Button */}
                {order.status !== 'Delivered' && order.status !== 'In Transit' && order.status !== 'CANCELLED' && (
                  <button
                    className="btn btn-outline"
                    style={{ borderColor: 'var(--error)', color: 'var(--error)' }}
                    onClick={() => {
                      if (window.confirm('Are you sure you want to cancel this order?')) {
                        cancelOrder(order.id);
                      }
                    }}
                  >
                    Cancel Order
                  </button>
                )}
                
                <button
                  className="btn btn-primary"
                  onClick={() => handleDownloadInvoice(order.id)}
                  disabled={downloadingOrderId === order.id}
                >
                  <Download size={14} />
                  {downloadingOrderId === order.id ? 'Generating...' : 'Invoice'}
                </button>
              </div>

              {/* Hidden Premium Invoice Renderer */}
              <WorldClassInvoice ref={el => invoiceRefs.current[order.id] = el} order={order} />

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
        ))}
      </div>
    </div>
  );
};

export default Orders;
