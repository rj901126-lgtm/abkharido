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

    // Show first popup after 10 seconds
    const initialTimer = setTimeout(() => {
      showRandomPurchase();
      
      // Then show every 20-30 seconds
      setInterval(() => {
        showRandomPurchase();
      }, Math.random() * 10000 + 20000);
      
    }, 10000);

    return () => clearTimeout(initialTimer);
  }, [products]);

  if (!popupData) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '80px', // Above mobile nav
        left: '20px',
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)',
        border: '1px solid #f1f5f9',
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.9)',
        opacity: visible ? 1 : 0,
        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        pointerEvents: 'none',
        zIndex: 9998,
        maxWidth: '320px'
      }}
    >
      <div style={{ width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
        <img src={popupData.product.image} alt={popupData.product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>{popupData.name} from {popupData.city}</span>
        </div>
        <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a', lineHeight: '1.3', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          Purchased {popupData.product.name}
        </div>
        <div style={{ fontSize: '10px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600', marginTop: '2px' }}>
          <CheckCircle2 size={10} /> Verified • {popupData.timeAgo} min ago
        </div>
      </div>
    </div>
  );
};

export default LivePurchasePopup;
