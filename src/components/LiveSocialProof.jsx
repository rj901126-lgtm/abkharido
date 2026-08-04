import React, { useState, useEffect } from 'react';
import { MapPin, ShoppingBag, X } from 'lucide-react';

const NAMES = ["Rahul", "Priya", "Amit", "Sneha", "Vikram", "Anjali", "Karan", "Pooja", "Rohan", "Neha"];
const CITIES = ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Pune", "Chennai", "Kolkata", "Ahmedabad", "Jaipur", "Surat"];
const PRODUCTS = ["Smart Watch Series 8", "Wireless Earbuds Pro", "Premium Leather Wallet", "Men's Casual Sneakers", "Classic Aviator Sunglasses", "Fast Charging Power Bank", "Luxury Perfume Set"];

const LiveSocialProof = () => {
  const [notification, setNotification] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let intervalTimer;
    let timeoutTimer;

    const showRandomNotification = () => {
      const name = NAMES[Math.floor(Math.random() * NAMES.length)];
      const city = CITIES[Math.floor(Math.random() * CITIES.length)];
      const product = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
      const timeAgo = Math.floor(Math.random() * 59) + 1; // 1 to 59 mins ago

      setNotification({ name, city, product, timeAgo });
      setIsVisible(true);

      // Hide after 5 seconds
      timeoutTimer = setTimeout(() => {
        setIsVisible(false);
      }, 5000);
    };

    // Show first notification after 3 seconds
    const initialTimer = setTimeout(() => {
      showRandomNotification();
    }, 3000);

    // Then show every 15-25 seconds randomly
    intervalTimer = setInterval(() => {
      if (!document.hidden) {
        showRandomNotification();
      }
    }, 20000);

    return () => {
      clearTimeout(initialTimer);
      clearTimeout(timeoutTimer);
      clearInterval(intervalTimer);
    };
  }, []);

  if (!notification) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '24px',
        zIndex: 9999,
        background: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        borderLeft: '4px solid #ef4444',
        transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.9)',
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? 'auto' : 'none',
        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        maxWidth: '320px',
        width: 'calc(100% - 48px)'
      }}
    >
      <div style={{ background: '#fef2f2', padding: '10px', borderRadius: '50%', color: '#ef4444' }}>
        <ShoppingBag size={20} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2px' }}>
          <span style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MapPin size={12} /> {notification.city}
          </span>
          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500' }}>
            {notification.timeAgo}m ago
          </span>
        </div>
        <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: '600', lineHeight: '1.4' }}>
          {notification.name} just purchased <span style={{ color: '#ef4444' }}>{notification.product}</span>
        </div>
        <div style={{ fontSize: '11px', color: '#10b981', fontWeight: '700', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Verified Buyer ✓
        </div>
      </div>
      <button 
        onClick={() => setIsVisible(false)}
        style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '4px', alignSelf: 'flex-start', marginTop: '-4px', marginRight: '-4px' }}
      >
        <X size={14} />
      </button>
    </div>
  );
};

export default LiveSocialProof;
