import React, { useState, useEffect } from 'react';
import { Timer, Zap, ArrowRight } from 'lucide-react';

const FlashDealBanner = () => {
  const [timeLeft, setTimeLeft] = useState({ hours: 2, minutes: 45, seconds: 0 });

  useEffect(() => {
    / Determine end time dynamically (e.g. 2 hours from now if not in localStorage)
    const storedEndTime = localStorage.getItem('abkharido_flash_deal_end');
    let endTime;
    
    if (storedEndTime && new Date(storedEndTime) > new Date()) {
      endTime = new Date(storedEndTime);
    } else {
      endTime = new Date();
      endTime.setHours(endTime.getHours() + 2);
      endTime.setMinutes(endTime.getMinutes() + 45);
      localStorage.setItem('abkharido_flash_deal_end', endTime.toISOString());
    }

    const timer = setInterval(() => {
      const now = new Date();
      const difference = endTime.getTime() - now.getTime();

      if (difference <= 0) {
        / Reset timer to another 2 hours to keep the FOMO loop going infinitely for demo
        const newEnd = new Date();
        newEnd.setHours(newEnd.getHours() + 2);
        localStorage.setItem('abkharido_flash_deal_end', newEnd.toISOString());
      } else {
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (time) => time.toString().padStart(2, '0');

  return (
    <div 
      style={{
        background: 'linear-gradient(90deg, #090d16 0%, #1e1b4b 40%, #312e81 60%, #090d16 100%)',
        color: '#f8fafc',
        padding: '12px 24px',
        margin: '8px 0 16px 0',
        borderRadius: '20px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px',
        width: '100%',
        boxShadow: '0 8px 24px rgba(9, 13, 22, 0.25)',
        border: '1px solid rgba(253, 224, 71, 0.3)',
        position: 'relative',
        zIndex: 40,
        boxSizing: 'border-box',
        fontFamily: "'Outfit', sans-serif"
      }}
    >
      {/* Decorative ambient lighting */}
      <div style={{ position: 'absolute', left: '15%', opacity: 0.15, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><Zap size={48} color="#fde047" /></div>
      <div style={{ position: 'absolute', right: '15%', opacity: 0.15, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><Zap size={48} color="#fde047" /></div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', letterSpacing: '0.5px', fontSize: '14px', color: '#fde047', textTransform: 'uppercase' }}>
        <Timer size={18} className="animate-pulse" color="#fde047" />
        <span>⚡ VIP Flash Vault: <span style={{ color: '#ffffff', fontWeight: '900' }}>Flat 20% OFF Site-Wide!</span></span>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700', marginRight: '4px' }}>ENDS IN:</span>
          <div style={{ background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#fde047', padding: '3px 8px', borderRadius: '6px', fontWeight: '800', fontFamily: 'monospace', fontSize: '14px' }}>
            {formatTime(timeLeft.hours)}
          </div>
          <span style={{ fontWeight: 'bold', color: '#94a3b8' }}>:</span>
          <div style={{ background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#fde047', padding: '3px 8px', borderRadius: '6px', fontWeight: '800', fontFamily: 'monospace', fontSize: '14px' }}>
            {formatTime(timeLeft.minutes)}
          </div>
          <span style={{ fontWeight: 'bold', color: '#94a3b8' }}>:</span>
          <div style={{ background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#fde047', padding: '3px 8px', borderRadius: '6px', fontWeight: '800', fontFamily: 'monospace', fontSize: '14px' }}>
            {formatTime(timeLeft.seconds)}
          </div>
        </div>
        
        <div style={{ background: 'linear-gradient(135deg, #fde047 0%, #f59e0b 100%)', color: '#090d16', padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)', border: '1px solid #fef08a' }}>
          CODE: HURRY20 <ArrowRight size={13} strokeWidth={2.5} />
        </div>
      </div>
    </div>
  );
};

export default FlashDealBanner;
