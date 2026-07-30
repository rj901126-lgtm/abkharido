import React, { useState, useEffect } from 'react';
import { Timer, Zap, ArrowRight } from 'lucide-react';

const FlashDealBanner = () => {
  const [timeLeft, setTimeLeft] = useState({ hours: 2, minutes: 45, seconds: 0 });

  useEffect(() => {
    // Determine end time dynamically (e.g. 2 hours from now if not in localStorage)
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
        // Reset timer to another 2 hours to keep the FOMO loop going infinitely for demo
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
        background: 'linear-gradient(90deg, #ef4444 0%, #f97316 100%)',
        color: 'white',
        padding: '10px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        width: '100%',
        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
        position: 'relative',
        zIndex: 40,
        overflow: 'hidden'
      }}
    >
      {/* Decorative lightning bolts */}
      <div style={{ position: 'absolute', left: '10%', opacity: 0.2, top: '-5px' }}><Zap size={40} /></div>
      <div style={{ position: 'absolute', right: '10%', opacity: 0.2, bottom: '-5px' }}><Zap size={40} /></div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', letterSpacing: '0.5px', fontSize: '14px', textTransform: 'uppercase' }}>
        <Timer size={18} className="animate-pulse" />
        Flash Deal: Get 20% OFF Site-wide!
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', fontFamily: 'monospace', fontSize: '15px' }}>
            {formatTime(timeLeft.hours)}
          </div>
          <span style={{ fontWeight: 'bold', alignSelf: 'center' }}>:</span>
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', fontFamily: 'monospace', fontSize: '15px' }}>
            {formatTime(timeLeft.minutes)}
          </div>
          <span style={{ fontWeight: 'bold', alignSelf: 'center' }}>:</span>
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', fontFamily: 'monospace', fontSize: '15px' }}>
            {formatTime(timeLeft.seconds)}
          </div>
        </div>
        
        <div style={{ background: 'white', color: '#ef4444', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          CODE: HURRY20 <ArrowRight size={12} />
        </div>
      </div>
    </div>
  );
};

export default FlashDealBanner;
