import React from 'react';
import { useApp } from '../context/AppContext';
import { History, Calendar, CreditCard, ShieldCheck, ShoppingBag, Truck } from 'lucide-react';

const Orders = ({ onNavigate }) => {
  const { orders, currentUser, fetchOrders } = useApp();

  React.useEffect(() => {
    if (currentUser) {
      fetchOrders(currentUser.email);
    }
  }, []);

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
          onClick={() => onNavigate('home')}
        >
          Go Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={{ padding: '24px 0', maxWidth: '850px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
        <History size={24} color="var(--primary-color)" /> Order History
      </h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {orders.map(order => (
          <div key={order.id} className="card" style={{ padding: '20px', border: '1px solid var(--border-light)' }}>
            
            {/* Order Card Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0', paddingBottom: '12px', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>ORDER PLACED</span>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> {order.date}</div>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>TOTAL AMOUNT</span>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>₹{order.finalAmount.toLocaleString('en-IN')}</div>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>SHIP TO</span>
                <div style={{ fontSize: '13px', fontWeight: '600' }} title={order.shippingAddress.streetAddress}>{order.shippingAddress.name}</div>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>ORDER #</span>
                <div style={{ fontSize: '13px', fontWeight: '600' }}><code>{order.id}</code></div>
              </div>
            </div>

            {/* Order Status Badge & Timeline */}
            <div style={{ backgroundColor: '#f9f9f9', padding: '16px', borderRadius: '4px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #eaeaea', paddingBottom: '12px', marginBottom: '12px' }}>
                <Truck size={16} color="var(--primary-color)" />
                <span style={{ fontSize: '13px', fontWeight: '600' }}>Status:</span>
                <span className="badge badge-info" style={{ fontSize: '11px' }}>{order.status}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: 'auto' }}>Estimated Delivery: Tomorrow</span>
              </div>

              {/* Delivery Progress Timeline Tracker */}
              <div className="timeline-container">
                <div className="timeline-line"></div>
                <div className="timeline-line-progress" style={{ width: order.status === 'Delivered' ? '100%' : '50%' }}></div>
                
                <div className="timeline-step">
                  <div className="timeline-node completed" style={{ fontSize: '11px', color: 'white', fontWeight: 'bold' }}>✓</div>
                  <span className="timeline-label completed">Ordered</span>
                </div>
                <div className="timeline-step">
                  <div className="timeline-node completed" style={{ fontSize: '11px', color: 'white', fontWeight: 'bold' }}>✓</div>
                  <span className="timeline-label completed">Packed</span>
                </div>
                <div className="timeline-step">
                  <div className={`timeline-node ${order.status === 'Delivered' ? 'completed' : 'active'}`} style={{ fontSize: '11px', color: order.status === 'Delivered' ? 'white' : 'var(--primary-color)', fontWeight: 'bold' }}>
                    {order.status === 'Delivered' ? '✓' : '●'}
                  </div>
                  <span className={`timeline-label ${order.status === 'Delivered' ? 'completed' : 'active'}`}>In Transit</span>
                </div>
                <div className="timeline-step">
                  <div className={`timeline-node ${order.status === 'Delivered' ? 'completed' : ''}`} style={{ fontSize: '11px', color: 'white', fontWeight: 'bold' }}>
                    {order.status === 'Delivered' ? '✓' : ''}
                  </div>
                  <span className={`timeline-label ${order.status === 'Delivered' ? 'completed' : ''}`}>Delivered</span>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderBottom: '1px solid #f0f0f0', paddingBottom: '16px', marginBottom: '16px' }}>
              {order.items.map(item => (
                <div key={item.product.id} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <img 
                    src={item.product.image} 
                    alt={item.product.name} 
                    style={{ width: '60px', height: '60px', objectFit: 'contain', border: '1px solid #eee', padding: '2px', borderRadius: '4px', backgroundColor: 'white' }} 
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{item.product.name}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Price: ₹{item.product.price.toLocaleString('en-IN')} | Quantity: {item.quantity}
                    </div>
                  </div>
                  <button 
                    className="btn btn-outline btn-sm" 
                    style={{ fontSize: '12px', padding: '4px 10px' }}
                    onClick={() => onNavigate(`product-${item.product.id}`)}
                  >
                    Buy Again
                  </button>
                </div>
              ))}
            </div>

            {/* Bottom Meta & Referral info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <CreditCard size={14} />
                <span>Payment Mode: <strong>{order.paymentMethod}</strong></span>
                {order.coinsDiscountValue > 0 && (
                  <span style={{ color: '#e68f00', marginLeft: '6px' }}>(Redeemed {order.coinsDiscountValue} Coins)</span>
                )}
              </div>

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
