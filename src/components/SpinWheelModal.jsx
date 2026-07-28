import React, { useState } from 'react';
import { X, Gift } from 'lucide-react';
import confetti from 'canvas-confetti';

const SpinWheelModal = ({ isOpen, onClose, onWin }) => {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [hasSpun, setHasSpun] = useState(() => {
    try {
      const lastSpin = localStorage.getItem('abkharido_last_spin_date');
      const today = new Date().toDateString();
      return lastSpin === today;
    } catch {
      return false;
    }
  });

  const prizes = [
    { label: 'Try Again', value: 0, color: '#f87171' },
    { label: '50 Coins', value: 50, color: '#60a5fa' },
    { label: 'Bad Luck', value: 0, color: '#fbbf24' },
    { label: '100 Coins', value: 100, color: '#34d399' },
    { label: '10 Coins', value: 10, color: '#a78bfa' },
    { label: '20% OFF', value: 'COUPON20', color: '#fb923c' }
  ];

  const handleSpin = () => {
    if (spinning || hasSpun) return;
    setSpinning(true);

    const winningIndex = Math.floor(Math.random() * prizes.length);
    const sliceAngle = 360 / prizes.length;
    const extraRotations = 5 * 360; 
    
    // Calculate the target rotation.
    // The wheel starts at 0 rotation. 
    // The pointer is at the top (which corresponds to -90 degrees from the right side).
    // The prizes are drawn starting from the right side going clockwise.
    const landAngle = (winningIndex * sliceAngle) + (sliceAngle / 2);
    // Add extra rotations, subtract landAngle, subtract 90 to align with top pointer
    const targetRotation = rotation + extraRotations + (360 - landAngle) - 90;

    setRotation(targetRotation);

    setTimeout(() => {
      setSpinning(false);
      setHasSpun(true);
      const wonPrize = prizes[winningIndex];
      
      if (wonPrize.value !== 0) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
      
      try {
        localStorage.setItem('abkharido_last_spin_date', new Date().toDateString());
      } catch (e) {
        console.error('Failed to save spin state', e);
      }

      setTimeout(() => {
        onWin(wonPrize);
      }, 1000);
    }, 4000);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.7)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <div style={{
        background: 'linear-gradient(145deg, #ffffff, #f8fafc)',
        borderRadius: '24px',
        padding: '32px',
        width: '90%',
        maxWidth: '400px',
        position: 'relative',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        textAlign: 'center'
      }}>
        <button 
          onClick={onClose}
          style={{
            position: 'absolute', top: '16px', right: '16px',
            background: '#f1f5f9', border: 'none', borderRadius: '50%',
            width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#64748b'
          }}
        >
          <X size={18} />
        </button>

        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#0f172a', background: 'linear-gradient(90deg, #4f46e5, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Daily Spin & Win
          </h2>
          <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#64748b' }}>Test your luck! Win coins or exclusive coupons.</p>
        </div>

        {/* Wheel Container */}
        <div style={{ position: 'relative', width: '280px', height: '280px', margin: '0 auto 24px' }}>
          {/* Pointer */}
          <div style={{
            position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '15px solid transparent',
            borderRight: '15px solid transparent',
            borderTop: '30px solid #ef4444',
            zIndex: 10, filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))'
          }}></div>
          
          {/* The Wheel */}
          <div style={{
            width: '100%', height: '100%',
            borderRadius: '50%',
            position: 'relative',
            overflow: 'hidden',
            border: '8px solid #ffffff',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1), inset 0 0 10px rgba(0,0,0,0.1)',
            transform: `rotate(${rotation}deg)`,
            transition: 'transform 4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}>
            {prizes.map((prize, idx) => {
              const rotationAngle = idx * (360 / prizes.length);
              const skewAngle = 90 - (360 / prizes.length);
              return (
                <div key={idx} style={{
                  position: 'absolute',
                  top: '0', right: '0',
                  width: '50%', height: '50%',
                  transformOrigin: '0% 100%',
                  transform: `rotate(${rotationAngle}deg) skewY(-${skewAngle}deg)`,
                  backgroundColor: prize.color,
                  border: '1px solid rgba(255,255,255,0.2)'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '50%', left: '50%',
                    transform: `skewY(${skewAngle}deg) rotate(${180/prizes.length}deg) translate(-20%, -100%)`,
                    textAlign: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    width: '60px',
                    textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                  }}>
                    {prize.label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Center Hub */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: '40px', height: '40px', backgroundColor: 'white', borderRadius: '50%',
            boxShadow: '0 4px 6px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Gift size={20} color="#4f46e5" />
          </div>
        </div>

        <button 
          onClick={handleSpin}
          disabled={spinning || hasSpun}
          style={{
            width: '100%', padding: '14px', borderRadius: '12px',
            background: hasSpun ? '#cbd5e1' : 'linear-gradient(90deg, #4f46e5, #6366f1)',
            color: 'white', fontSize: '16px', fontWeight: 'bold',
            border: 'none', cursor: (spinning || hasSpun) ? 'not-allowed' : 'pointer',
            boxShadow: hasSpun ? 'none' : '0 10px 20px -10px rgba(79, 70, 229, 0.6)',
            transition: 'all 0.2s'
          }}
        >
          {spinning ? 'SPINNING...' : hasSpun ? 'COME BACK TOMORROW' : 'SPIN THE WHEEL'}
        </button>
      </div>
    </div>
  );
};

export default SpinWheelModal;
