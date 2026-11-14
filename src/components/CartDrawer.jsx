import React, { useState, useEffect } from 'react';
import { ShoppingBag, X, Minus, Plus, Trash2, ArrowRight, ShieldCheck, ChevronRight, Heart, Package } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { createPortal } from 'react-dom';
import { FREE_SHIPPING_THRESHOLD } from '../utils/constants';

const CartDrawer = ({ isOpen, onClose, onNavigate }) => {
  const { cart, updateCartQty, removeFromCart, currentUser, showToast } = useApp();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent background scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const handleCheckoutClick = () => {
    onClose();
    if (!currentUser) {
      showToast('Please login to proceed to checkout', 'info');
      onNavigate('login?redirect=/checkout');
    } else {
      onNavigate('checkout');
    }
  };

  if (!mounted || !isOpen) return null;

  const cartCount = Array.isArray(cart) ? cart.reduce((acc, item) => acc + (Number(item?.quantity) || 1), 0) : 0;
  const itemsPrice = Array.isArray(cart) ? cart.reduce((acc, item) => acc + (Number(item?.product?.price ?? item?.price) || 0) * (Number(item?.quantity) || 1), 0) : 0;

  const drawerContent = (
    <>
      {/* Backdrop */}
      <div 
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.55)',
          backdropFilter: 'blur(5px)',
          zIndex: 10000,
          opacity: isOpen ? 1 : 0,
          visibility: isOpen ? 'visible' : 'hidden',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      />
      
      {/* Drawer */}
      <div style={{
        position: 'fixed',
        top: 0, right: 0, bottom: 0,
        width: '100%', maxWidth: '410px',
        backgroundColor: '#ffffff',
        zIndex: 10001,
        boxShadow: '-12px 0 40px rgba(15, 23, 42, 0.22)',
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Signature Luxury Gradient Header Banner (Matches Header Login Badge Menu) */}
        <div style={{
          padding: '18px 20px',
          background: 'linear-gradient(135deg, #090d16 0%, #1e3a8a 60%, #2563eb 100%)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          borderBottom: '1px solid rgba(255,255,255,0.12)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: '#fbbf24',
              color: '#1e1b4b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(251, 191, 36, 0.35)',
              flexShrink: 0
            }}>
              <ShoppingBag size={20} strokeWidth={2.4} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.2px', lineHeight: 1.2 }}>
                Your Cart ({cartCount})
              </h2>
              <div style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.78)', fontWeight: '500', marginTop: '2px' }}>
                100% Genuine • Express Dispatch
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close cart drawer"
            style={{
              background: 'rgba(255,255,255,0.14)',
              border: '1px solid rgba(255,255,255,0.22)',
              cursor: 'pointer',
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              transition: 'all 0.2s ease'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Interactive Free Delivery Progress Meter */}
        {cart.length > 0 && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: itemsPrice >= FREE_SHIPPING_THRESHOLD ? '#ecfdf5' : '#f8faff',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div>
              <style>{`
                @keyframes freeShipShimmer {
                  0% { background-position: -200% 0; }
                  100% { background-position: 200% 0; }
                }
              `}</style>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12.5px', fontWeight: '700' }}>
                {itemsPrice >= FREE_SHIPPING_THRESHOLD ? (
                  <span style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    🎉 <strong>FREE Express Delivery Unlocked!</strong>
                  </span>
                ) : (
                  <span style={{ color: '#334155' }}>
                    🚚 Add <strong>₹{FREE_SHIPPING_THRESHOLD - itemsPrice}</strong> more for <strong>FREE Delivery</strong>
                  </span>
                )}
                <span style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  color: itemsPrice >= FREE_SHIPPING_THRESHOLD ? '#059669' : 'var(--brand-accent)'
                }}>
                  {Math.min(100, Math.round((itemsPrice / FREE_SHIPPING_THRESHOLD) * 100))}%
                </span>
              </div>
              <div style={{
                width: '100%',
                height: '6px',
                backgroundColor: '#e2e8f0',
                borderRadius: '999px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${Math.min(100, Math.max(0, (itemsPrice / FREE_SHIPPING_THRESHOLD) * 100))}%`,
                  height: '100%',
                  background: itemsPrice >= FREE_SHIPPING_THRESHOLD
                    ? 'linear-gradient(90deg, #059669 0%, #34d399 50%, #059669 100%)'
                    : 'linear-gradient(90deg, #1d4ed8, #2563eb)',
                  backgroundSize: itemsPrice >= FREE_SHIPPING_THRESHOLD ? '200% 100%' : 'auto',
                  animation: itemsPrice >= FREE_SHIPPING_THRESHOLD ? 'freeShipShimmer 2.5s ease-in-out infinite' : 'none',
                  borderRadius: '999px',
                  transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                }} />
              </div>
            </div>

          </div>
        )}

        {/* Cart Items List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', backgroundColor: '#f8fafc' }}>
          {cart.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100%', color: '#64748b', padding: '12px 4px' }}>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '20px',
                background: '#eff6ff',
                border: '1px solid #dbeafe',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '14px',
                boxShadow: '0 8px 20px rgba(37, 99, 235, 0.1)'
              }}>
                <ShoppingBag size={34} />
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>Your cart is empty</h3>
              <p style={{ fontSize: '13px', textAlign: 'center', maxWidth: '260px', margin: '0 0 20px', lineHeight: 1.5 }}>
                Explore verified tech &amp; lifestyle essentials with instant express dispatch.
              </p>

              {/* Quick Action Menu Rows (Matches Header Login Badge Menu UI) */}
              <div style={{ width: '100%', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px', boxShadow: '0 4px 14px rgba(15, 23, 42, 0.04)' }}>
                <div
                  onClick={() => { onClose(); onNavigate('catalog'); }}
                  className="dropdown-item"
                  style={{ cursor: 'pointer' }}
                >
                  <div className="dropdown-icon-box blue"><ShoppingBag size={16} /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a' }}>Start Shopping</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Explore top-rated gadgets &amp; audio</div>
                  </div>
                  <ChevronRight size={14} color="#94a3b8" />
                </div>

                <div
                  onClick={() => { onClose(); onNavigate('wishlist'); }}
                  className="dropdown-item"
                  style={{ cursor: 'pointer' }}
                >
                  <div className="dropdown-icon-box red"><Heart size={16} /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a' }}>Saved Wishlist</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Move your favorite items to cart</div>
                  </div>
                  <ChevronRight size={14} color="#94a3b8" />
                </div>

                <div
                  onClick={() => { onClose(); onNavigate('orders'); }}
                  className="dropdown-item"
                  style={{ cursor: 'pointer' }}
                >
                  <div className="dropdown-icon-box green"><Package size={16} /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a' }}>My Orders</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Track active shipments &amp; invoices</div>
                  </div>
                  <ChevronRight size={14} color="#94a3b8" />
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {cart.map((item, index) => {
                const prod = item?.product || {};
                const prodId = prod.id || prod._id || index;
                return (
                <div key={`${prodId}-${index}`} style={{ display: 'flex', gap: '14px', backgroundColor: '#ffffff', padding: '14px', borderRadius: '16px', boxShadow: '0 4px 14px rgba(15, 23, 42, 0.04)', border: '1px solid #e2e8f0' }}>
                  <img 
                    src={prod.image || (prod.images && prod.images[0]) || ''} 
                    alt={prod.name || 'Product'}
                    style={{ width: '76px', height: '76px', objectFit: 'contain', borderRadius: '12px', backgroundColor: '#f8fafc', padding: '6px', border: '1px solid #f1f5f9', flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#0f172a', marginBottom: '4px', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {prod.name || 'Product'}
                    </div>
                    
                    {item?.selectedVariant && (
                      <div style={{ fontSize: '11.5px', color: '#64748b', marginBottom: '8px', fontWeight: '600' }}>Variant: {item.selectedVariant}</div>
                    )}
                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '6px' }}>
                      <div style={{ fontSize: '15px', fontWeight: '900', color: '#0f172a' }}>₹{((prod.price) || 0).toLocaleString('en-IN')}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', background: '#ffffff' }}>
                          <button onClick={() => updateCartQty(prod, (item?.quantity || 1) - 1)} style={{ padding: '5px 9px', background: '#f8fafc', border: 'none', borderRight: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', color: '#0f172a' }}><Minus size={13} /></button>
                          <span style={{ padding: '0 10px', fontSize: '12.5px', fontWeight: '800', color: '#0f172a' }}>{item?.quantity || 1}</span>
                          <button onClick={() => updateCartQty(prod, (item?.quantity || 1) + 1)} style={{ padding: '5px 9px', background: '#f8fafc', border: 'none', borderLeft: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', color: '#0f172a' }}><Plus size={13} /></button>
                        </div>
                        <button onClick={() => removeFromCart(prod)} title="Remove item" style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#dc2626', cursor: 'pointer', width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )})}
            </div>
          )}
        </div>

        {/* Footer / Summary */}
        {cart.length > 0 && (
          <div style={{ padding: '18px 20px', borderTop: '1px solid #e2e8f0', backgroundColor: '#ffffff', boxShadow: '0 -4px 20px rgba(15, 23, 42, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Order Subtotal ({cartCount} items)</div>
                <div style={{ fontSize: '11px', color: '#059669', fontWeight: '700' }}>Inclusive of all taxes</div>
              </div>
              <span style={{ fontSize: '18px', fontWeight: '900', color: '#090d16' }}>₹{itemsPrice.toLocaleString('en-IN')}</span>
            </div>
            <button 
              onClick={handleCheckoutClick}
              style={{
                width: '100%',
                padding: '14px 20px',
                fontSize: '14.5px',
                fontWeight: '800',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #090d16 0%, #1e3a8a 65%, #2563eb 100%)',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 8px 24px rgba(30, 58, 138, 0.28)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
            >
              PROCEED TO CHECKOUT <ArrowRight size={18} color="#fbbf24" />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11.5px', color: '#059669', fontWeight: '800', marginTop: '10px' }}>
              <ShieldCheck size={14} /> <span>100% Cashfree Escrow Protected</span>
            </div>
            <button 
              onClick={() => { onClose(); onNavigate('cart'); }}
              style={{ width: '100%', marginTop: '8px', background: 'none', border: 'none', color: '#475569', fontSize: '12.5px', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline' }}
            >
              View Full Cart Page
            </button>
          </div>
        )}
      </div>
    </>
  );

  return createPortal(drawerContent, document.body);
};

export default CartDrawer;
