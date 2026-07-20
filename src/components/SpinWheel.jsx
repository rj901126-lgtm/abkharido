import React, { useState, useEffect } from 'react';
import { X, Gift } from 'lucide-react';
import { useApp } from '../context/AppContext';

const SpinWheel = () => {
  const [show, setShow] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const { showToast } = useApp();

  useEffect(() => {
    // Show only once per session after 5 seconds
    const hasSpun = sessionStorage.getItem('hasSpunWheel');
    if (!hasSpun) {
      const timer = setTimeout(() => {
        setShow(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleSpin = () => {
    if (spinning || result) return;
    
    setSpinning(true);
    // Simulate spinning for 3 seconds
    setTimeout(() => {
      setSpinning(false);
      setResult('FLAT10');
      sessionStorage.setItem('hasSpunWheel', 'true');
    }, 3000);
  };

  const handleClose = () => {
    setShow(false);
    sessionStorage.setItem('hasSpunWheel', 'true');
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(result);
    showToast('Code copied to clipboard!', 'success');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '32px', maxWidth: '400px', width: '90%', position: 'relative', textAlign: 'center', boxShadow: '0 24px 48px rgba(0,0,0,0.2)' }}>
        <button onClick={handleClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
          <X size={24} />
        </button>

        <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', marginBottom: '8px' }}>Spin to Win! 🎁</h2>
        <p style={{ color: '#475569', fontSize: '14px', marginBottom: '24px' }}>Unlock exclusive discounts before you checkout.</p>

        <div style={{ position: 'relative', width: '240px', height: '240px', margin: '0 auto 32px' }}>
          {/* Wheel pointer */}
          <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', width: '0', height: '0', borderLeft: '15px solid transparent', borderRight: '15px solid transparent', borderTop: '30px solid #ef4444', zIndex: 10 }}></div>
          
          {/* The Wheel */}
          <div style={{ 
            width: '100%', 
            height: '100%', 
            borderRadius: '50%', 
            background: 'conic-gradient(#f87171 0deg 60deg, #fbbf24 60deg 120deg, #34d399 120deg 180deg, #60a5fa 180deg 240deg, #a78bfa 240deg 300deg, #f472b6 300deg 360deg)',
            border: '8px solid #0f172a',
            transition: 'transform 3s cubic-bezier(0.2, 0.8, 0.2, 1)',
            transform: spinning ? 'rotate(1800deg)' : (result ? 'rotate(1830deg)' : 'rotate(0deg)'),
            boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
          }} />
          
          <button 
            onClick={handleSpin}
            disabled={spinning || result}
            style={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)', 
              width: '60px', 
              height: '60px', 
              borderRadius: '50%', 
              backgroundColor: '#0f172a', 
              color: 'white', 
              border: '4px solid white',
              fontWeight: '900', 
              cursor: (spinning || result) ? 'default' : 'pointer',
              zIndex: 5
            }}
          >
            SPIN
          </button>
        </div>

        {result && (
          <div className="animate-fade-in" style={{ backgroundColor: '#ecfdf5', border: '2px dashed #10b981', borderRadius: '12px', padding: '16px' }}>
            <div style={{ color: '#047857', fontWeight: '800', fontSize: '18px', marginBottom: '4px' }}>You won 10% OFF!</div>
            <div style={{ fontSize: '13px', color: '#065f46', marginBottom: '12px' }}>Use code at checkout:</div>
            <button onClick={handleCopyCode} style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '8px', fontWeight: '800', fontSize: '16px', cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Gift size={18} /> {result}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpinWheel;
