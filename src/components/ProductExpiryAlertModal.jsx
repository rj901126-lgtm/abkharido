"use client";

import React, { useState, useEffect } from 'react';
import { Clock, RefreshCw, X, AlertTriangle, Sparkles, ChevronRight, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function ProductExpiryAlertModal({ onNavigate }) {
  const { currentUser, addToCart, showToast } = useApp();
  const [expiringList, setExpiringList] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    const checkExpiringProducts = async () => {
      const token = currentUser?.token || (typeof window !== 'undefined' ? (localStorage.getItem('abkharido_token') || localStorage.getItem('abkharido_user_session')) : null);
      if (!token) return;

      // Check if user dismissed alert in the current session
      const dismissedAt = typeof window !== 'undefined' ? sessionStorage.getItem('abkharido_expiry_dismissed') : null;
      if (dismissedAt && Date.now() - Number(dismissedAt) < 4 * 60 * 60 * 1000) {
        return; // Don't pop up again for 4 hours if dismissed
      }

      try {
        const res = await fetch('/api/user/expiring-products', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.items) && data.items.length > 0) {
            setExpiringList(data.items);
            setIsOpen(true);
          }
        }
      } catch (_) {}
    };

    if (currentUser) {
      const timer = setTimeout(checkExpiringProducts, 2500); // Trigger after 2.5s graceful entrance
      return () => clearTimeout(timer);
    }
  }, [currentUser]);

  if (!isOpen || expiringList.length === 0) return null;

  const handleDismiss = () => {
    setIsOpen(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('abkharido_expiry_dismissed', String(Date.now()));
    }
  };

  const primaryItem = expiringList[0];
  const isUrgent = primaryItem.daysLeft <= 3;
  const isOverdue = primaryItem.daysLeft <= 0;

  const handleReorder = (item) => {
    addToCart({
      id: item.productRef || item.name,
      _id: item.productRef,
      name: item.name,
      price: item.price,
      image: item.image,
      selectedColor: item.color,
      selectedVariant: item.variant
    }, item.qty || 1);
    showToast(`🎉 1-Click Reorder! ${item.name} added to cart (+25 AB Coins)`, 'success');
    handleDismiss();
    if (onNavigate) onNavigate('cart');
  };

  if (isMinimized) {
    return (
      <div 
        onClick={() => setIsMinimized(false)}
        style={{
          position: 'fixed',
          bottom: '90px',
          left: '20px',
          zIndex: 9990,
          background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
          color: '#ffffff',
          padding: '8px 14px',
          borderRadius: '100px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(217, 119, 6, 0.4)',
          fontSize: '12px',
          fontWeight: '800',
          animation: 'pulse 2s infinite'
        }}
      >
        <span>⏰</span>
        <span>{expiringList.length} Item(s) Expiring Soon</span>
        <ChevronRight size={14} />
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      maxWidth: '380px',
      width: 'calc(100vw - 48px)',
      zIndex: 9999,
      background: '#ffffff',
      borderRadius: '20px',
      boxShadow: '0 20px 50px rgba(15, 23, 42, 0.25), 0 0 0 1.5px rgba(245, 158, 11, 0.4)',
      overflow: 'hidden',
      fontFamily: "'Outfit', system-ui, sans-serif",
      animation: 'slideUpBounce 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      {/* Header Bar */}
      <div style={{
        background: isOverdue 
          ? 'linear-gradient(135deg, #991b1b 0%, #dc2626 100%)' 
          : isUrgent 
          ? 'linear-gradient(135deg, #c2410c 0%, #ea580c 100%)' 
          : 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
        color: '#ffffff',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px'
          }}>
            ⏰
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '900', letterSpacing: '-0.2px' }}>
              Product Expiry Reminder
            </div>
            <div style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.85)', fontWeight: '600' }}>
              {expiringList.length > 1 ? `${expiringList.length} products need replenishment` : 'Pre-expiry smart alert'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => setIsMinimized(true)}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: '#ffffff',
              borderRadius: '6px',
              padding: '2px 6px',
              fontSize: '10px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            Minimize
          </button>
          <button
            onClick={handleDismiss}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '2px'
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Product Content Body */}
      <div style={{ padding: '16px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: '#f8fafc',
          padding: '10px',
          borderRadius: '14px',
          border: '1px solid #e2e8f0'
        }}>
          <img
            src={primaryItem.image || 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=200'}
            alt={primaryItem.name}
            style={{
              width: '54px',
              height: '54px',
              objectFit: 'contain',
              borderRadius: '10px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              padding: '2px',
              flexShrink: 0
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '13px',
              fontWeight: '800',
              color: '#0f172a',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {primaryItem.name}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '10px',
                fontWeight: '900',
                padding: '2px 7px',
                borderRadius: '6px',
                background: isOverdue ? '#fee2e2' : isUrgent ? '#ffedd5' : '#fef9c3',
                color: isOverdue ? '#b91c1c' : isUrgent ? '#c2410c' : '#854d0e'
              }}>
                {isOverdue ? '⚠️ ' : '⏳ '}{primaryItem.statusText}
              </span>
              <span style={{ fontSize: '12px', fontWeight: '900', color: '#059669' }}>
                ₹{(primaryItem.price || 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Incentive tag */}
        <div style={{
          marginTop: '10px',
          padding: '8px 12px',
          background: '#f0fdf4',
          borderRadius: '10px',
          border: '1px solid #bbf7d0',
          fontSize: '11px',
          color: '#15803d',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span>🎁</span>
          <span>Reorder now &amp; get <strong>+25 Bonus AB Coins</strong>!</span>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <button
            onClick={() => handleReorder(primaryItem)}
            style={{
              flex: 1,
              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '10px',
              borderRadius: '12px',
              fontSize: '12.5px',
              fontWeight: '900',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)'
            }}
          >
            <RefreshCw size={14} /> 1-Click Reorder
          </button>
          
          <button
            onClick={() => {
              handleDismiss();
              if (onNavigate) onNavigate('orders');
            }}
            style={{
              background: '#f1f5f9',
              color: '#334155',
              border: '1px solid #cbd5e1',
              padding: '10px 14px',
              borderRadius: '12px',
              fontSize: '11.5px',
              fontWeight: '800',
              cursor: 'pointer'
            }}
          >
            Orders
          </button>
        </div>
      </div>
    </div>
  );
}
