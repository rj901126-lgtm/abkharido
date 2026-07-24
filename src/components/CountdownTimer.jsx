import React, { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';

const CountdownTimer = ({ endTime, style, compact = false }) => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!endTime) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const distance = end - now;

      if (distance < 0) {
        clearInterval(timer);
        setIsExpired(true);
      } else {
        setIsExpired(false);
        setTimeLeft({
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  if (isExpired || !endTime) return null;

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      backgroundColor: 'rgba(255, 87, 34, 0.1)',
      color: '#ff5722',
      padding: compact ? '4px 8px' : '6px 12px',
      borderRadius: '4px',
      fontWeight: 'bold',
      fontSize: compact ? '11px' : '13px',
      ...style
    }}>
      <Timer size={compact ? 12 : 16} />
      <span>
        Ends in: {String(timeLeft.hours).padStart(2, '0')}h {String(timeLeft.minutes).padStart(2, '0')}m {String(timeLeft.seconds).padStart(2, '0')}s
      </span>
    </div>
  );
};

export default CountdownTimer;
