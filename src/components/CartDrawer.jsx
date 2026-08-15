import React, { useState, useEffect } from 'react';
import { ShoppingBag, X, Minus, Plus, Trash2, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { createPortal } from 'react-dom';

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

  if (!mounted) return null;

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const itemsPrice = cart.reduce((acc, item) => acc + (item.product?.price || 0) * (item.quantity || 1), 0);
  const progressPercent = Math.min((itemsPrice / 500) * 100, 100);

  const drawerContent = (
    <>
      {/* Backdrop */}
      <div 
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
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
        width: '100%', maxWidth: '400px',
        backgroundColor: 'white',
        zIndex: 10001,
        boxShadow: '-8px 0 30px rgba(0,0,0,0.1)',
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag size={20} color="var(--primary-color)" /> Your Cart ({cartCount})
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={20} color="#64748b" />
          </button>
        </div>

        {/* Free Shipping Progress */}
        {cartCount > 0 && (
          <div style={{ padding: '16px 20px', backgroundColor: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: itemsPrice >= 500 ? '#10b981' : '#475569' }}>
              <span>{itemsPrice >= 500 ? 'You have free shipping!' : `Add ₹${(500 - itemsPrice).toLocaleString('en-IN')} more for free shipping`}</span>
              {itemsPrice >= 500 && <span style={{ fontWeight: '800' }}>UNLOCKED</span>}
            </div>
            <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${progressPercent}%`, height: '100%', backgroundColor: '#10b981', transition: 'width 0.3s ease' }} />
            </div>
          </div>
        )}

        {/* Cart Items List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', backgroundColor: '#f8fafc' }}>
          {cart.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>
              <ShoppingBag size={64} opacity={0.2} style={{ marginBottom: '16px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>Your cart is empty</h3>
              <p style={{ fontSize: '14px', textAlign: 'center', maxWidth: '250px' }}>Looks like you haven't added anything to your cart yet.</p>
              <button 
                onClick={() => { onClose(); onNavigate('catalog'); }}
                className="btn btn-primary"
                style={{ marginTop: '24px', padding: '12px 24px' }}
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {cart.map((item, index) => {
                const prod = item?.product || {};
                const prodId = prod.id || prod._id || index;
                return (
                <div key={`${prodId}-${index}`} style={{ display: 'flex', gap: '16px', backgroundColor: '#fff', padding: '16px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}>
                  <img 
                    src={prod.image || (prod.images && prod.images[0]) || ''} 
                    alt={prod.name || 'Product'}
                    style={{ width: '80px', height: '80px', objectFit: 'contain', borderRadius: '12px', backgroundColor: '#f8fafc', padding: '4px' }}
                  />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', marginBottom: '4px', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {prod.name || 'Product'}
                    </div>
                    
                    {item?.selectedVariant && (
                      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>Variant: {item.selectedVariant}</div>
                    )}
                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                      <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>₹{((prod.price) || 0).toLocaleString('en-IN')}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                          <button onClick={() => updateCartQty(prodId, (item?.quantity || 1) - 1)} style={{ padding: '6px 10px', background: '#f8fafc', border: 'none', borderRight: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex' }}><Minus size={14} /></button>
                          <span style={{ padding: '0 12px', fontSize: '13px', fontWeight: '600' }}>{item?.quantity || 1}</span>
                          <button onClick={() => updateCartQty(prodId, (item?.quantity || 1) + 1)} style={{ padding: '6px 10px', background: '#f8fafc', border: 'none', borderLeft: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex' }}><Plus size={14} /></button>
                        </div>
                        <button onClick={() => removeFromCart(prodId)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}>
                          <Trash2 size={16} />
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
          <div style={{ padding: '20px', borderTop: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '16px', fontWeight: '900', color: '#090d16' }}>
              <span>Subtotal:</span>
              <span>₹{itemsPrice.toLocaleString('en-IN')}</span>
            </div>
            <button 
              onClick={handleCheckoutClick}
              style={{
                width: '100%',
                padding: '14px 20px',
                fontSize: '15px',
                fontWeight: '900',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #090d16 0%, #1e1b4b 100%)',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 8px 24px rgba(9, 13, 22, 0.25)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
            >
              PROCEED TO CHECKOUT <ArrowRight size={18} color="#34d399" />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11px', color: '#059669', fontWeight: '800', marginTop: '10px' }}>
              <span>🔒 100% Cashfree Escrow Protected</span>
            </div>
            <button 
              onClick={() => { onClose(); onNavigate('cart'); }}
              style={{ width: '100%', marginTop: '10px', background: 'none', border: 'none', color: '#64748b', fontSize: '13px', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}
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
