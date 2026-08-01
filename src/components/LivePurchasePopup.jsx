import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2 } from 'lucide-react';

const NAMES = ['Rahul', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Neha', 'Rohan', 'Kriti', 'Aditya', 'Pooja'];
const CITIES = ['Delhi', 'Mumbai', 'Bangalore', 'Pune', 'Hyderabad', 'Chennai', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Lucknow'];

const LivePurchasePopup = () => {
  const { products } = useApp();
  const [popupData, setPopupData] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!products || products.length === 0) return;

    const showRandomPurchase = () => {
      const randomName = NAMES[Math.floor(Math.random() * NAMES.length)];
      const randomCity = CITIES[Math.floor(Math.random() * CITIES.length)];
      const randomProduct = products[Math.floor(Math.random() * products.length)];
      
      const timeAgo = Math.floor(Math.random() * 59) + 1; // 1 to 59 mins ago

      setPopupData({
        name: randomName,
        city: randomCity,
        product: randomProduct,
        timeAgo
      });
      setVisible(true);

      // Hide after 4 seconds
      setTimeout(() => {
        setVisible(false);
      }, 4000);
    };

    // Show first popup after 4 seconds for instant social trust
    const initialTimer = setTimeout(() => {
      showRandomPurchase();
      
      // Then show every 12 to 18 seconds
      const interval = setInterval(() => {
        showRandomPurchase();
      }, Math.random() * 6000 + 12000);

      return () => clearInterval(interval);
    }, 4000);

    return () => clearTimeout(initialTimer);
  }, [products]);

  if (!popupData) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '86px', // Hover just above mobile nav
        left: '20px',
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
        backdropFilter: 'blur(12px)',
        borderRadius: '16px',
        padding: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        boxShadow: '0 12px 30px rgba(9, 13, 22, 0.12), 0 0 0 1px rgba(16, 185, 129, 0.25)',
        border: '1px solid #d1fae5',
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.9)',
        opacity: visible ? 1 : 0,
        transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        pointerEvents: 'none',
        zIndex: 9998,
        maxWidth: '340px',
        fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif"
      }}
    >
      <div style={{ width: '52px', height: '52px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, border: '1px solid #e2e8f0', backgroundColor: '#ffffff', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src={popupData.product.image} alt={popupData.product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>🔥 <strong style={{ color: '#090d16' }}>{popupData.name}</strong> in <strong style={{ color: '#090d16' }}>{popupData.city}</strong></span>
        </div>
        <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', lineHeight: '1.3', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          Purchased {popupData.product.name}
        </div>
        <div style={{ fontSize: '11px', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '800' }}>
          <CheckCircle2 size={12} color="#059669" fill="#d1fae5" /> Verified Order • {popupData.timeAgo}m ago
        </div>
      </div>
    </div>
  );
};

export default LivePurchasePopup;
