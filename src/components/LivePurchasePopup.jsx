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
      
      const timeAgo = Math.floor(Math.random() * 59) + 1; / 1 to 59 mins ago

      setPopupData({
        name: randomName,
        city: randomCity,
        product: randomProduct,
        timeAgo
      });
      setVisible(true);

      / Hide after 4 seconds
      setTimeout(() => {
        setVisible(false);
      }, 4000);
    };

    / Show first popup after 4 seconds for instant social trust
    const initialTimer = setTimeout(() => {
      showRandomPurchase();
      
      / Then show every 12 to 18 seconds
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
        bottom: '80px',
        left: '16px',
        right: '16px',
        margin: '0 auto',
        backgroundColor: 'rgba(9, 13, 22, 0.94)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: '20px',
        padding: '8px 14px 8px 8px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.9)',
        opacity: visible ? 1 : 0,
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: 'none',
        zIndex: 9998,
        maxWidth: '320px',
        width: 'max-content',
        fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif"
      }}
    >
      <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '1.5px solid #10b981', backgroundColor: '#ffffff', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src={popupData.product.image || (popupData.product.images && popupData.product.images[0]) || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', minWidth: 0 }}>
        <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          <span>⚡ <strong style={{ color: '#ffffff' }}>{popupData.name}</strong> in <strong style={{ color: '#ffffff' }}>{popupData.city}</strong></span>
        </div>
        <div style={{ fontSize: '12px', fontWeight: '800', color: '#f8fafc', lineHeight: '1.2', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          Bought {popupData.product.name}
        </div>
        <div style={{ fontSize: '10px', color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '800' }}>
          <CheckCircle2 size={10} color="#34d399" /> Verified • {popupData.timeAgo}m ago
        </div>
      </div>
    </div>
  );
};

export default LivePurchasePopup;
