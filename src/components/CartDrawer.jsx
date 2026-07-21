import React, { useState, useEffect } from 'react';
import { ShoppingBag, X, Minus, Plus, Trash2, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { createPortal } from 'react-dom';

const CartDrawer = ({ isOpen, onClose, onNavigate }) => {
  const { cart, updateCartQty, removeFromCart } = useApp();
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
              <span>{itemsPrice >= 500 ? '🎉 You unlocked FREE Shipping!' : `Add ₹${(500 - itemsPrice).toLocaleString('en-IN')} more for FREE Shipping!`}</span>
            </div>
            <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progressPercent}%`, backgroundColor: itemsPrice >= 500 ? '#10b981' : 'var(--primary-color)', transition: 'width 0.4s ease' }} />
            </div>
          </div>
        )}

        {/* Cart Items List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {cart.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
              <ShoppingBag size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <p style={{ fontSize: '16px', fontWeight: '600' }}>Your cart is empty.</p>
              <button 
                onClick={() => { onClose(); onNavigate('catalog'); }}
                className="btn btn-primary" 
                style={{ marginTop: '20px' }}
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {cart.map((item) => (
                <div key={item.product.id} style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ width: '80px', height: '80px', backgroundColor: '#f8fafc', borderRadius: '8px', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #f1f5f9' }}>
                    <img src={item.product.image} alt={item.product.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.4' }}>
                        {item.product.name}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--primary-color)', marginTop: '4px' }}>
                        ₹{(item.product.price || 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                        <button onClick={() => updateCartQty(item.product.id, item.quantity - 1)} style={{ padding: '6px 10px', background: '#f8fafc', border: 'none', borderRight: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex' }}><Minus size={14} /></button>
                        <span style={{ padding: '0 12px', fontSize: '13px', fontWeight: '600' }}>{item.quantity}</span>
                        <button onClick={() => updateCartQty(item.product.id, item.quantity + 1)} style={{ padding: '6px 10px', background: '#f8fafc', border: 'none', borderLeft: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex' }}><Plus size={14} /></button>
                      </div>
                      <button onClick={() => removeFromCart(item.product.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer / Summary */}
        {cart.length > 0 && (
          <div style={{ padding: '20px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
              <span>Subtotal:</span>
              <span>₹{itemsPrice.toLocaleString('en-IN')}</span>
            </div>
            <button 
              onClick={() => { onClose(); onNavigate('checkout'); }}
              className="btn btn-accent" 
              style={{ width: '100%', height: '48px', fontSize: '16px', fontWeight: '800', display: 'flex', justifyContent: 'center', gap: '8px' }}
            >
              PROCEED TO CHECKOUT <ArrowRight size={18} />
            </button>
            <button 
              onClick={() => { onClose(); onNavigate('cart'); }}
              style={{ width: '100%', marginTop: '12px', background: 'none', border: 'none', color: '#64748b', fontSize: '13px', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}
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
