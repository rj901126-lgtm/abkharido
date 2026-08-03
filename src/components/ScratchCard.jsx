import React, { useRef, useEffect, useState } from 'react';

const ScratchCard = ({ rewardCode, onComplete }) => {
  const canvasRef = useRef(null);
  const [isScratched, setIsScratched] = useState(false);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    / Setup Canvas
    const width = 300;
    const height = 150;
    canvas.width = width;
    canvas.height = height;

    / Fill with metallic silver coating
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#e2e8f0');
    gradient.addColorStop(0.5, '#94a3b8');
    gradient.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    / Add some scratch instructions text on top of the silver
    ctx.font = 'bold 18px "Inter", sans-serif';
    ctx.fillStyle = '#475569';
    ctx.textAlign = 'center';
    ctx.fillText('Scratch to win a reward!', width / 2, height / 2 + 6);

    let isDrawing = false;
    
    const getCoordinates = (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      if (e.touches && e.touches.length > 0) {
        return {
          x: (e.touches[0].clientX - rect.left) * scaleX,
          y: (e.touches[0].clientY - rect.top) * scaleY
        };
      }
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    };

    const scratch = (e) => {
      if (!isDrawing) return;
      e.preventDefault();
      const { x, y } = getCoordinates(e);
      
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, Math.PI * 2);
      ctx.fill();

      checkScratched();
    };

    const checkScratched = () => {
      if (isScratched) return;
      
      const imageData = ctx.getImageData(0, 0, width, height);
      const pixels = imageData.data;
      let transparentPixels = 0;
      
      for (let i = 3; i < pixels.length; i += 4) {
        if (pixels[i] === 0) transparentPixels++;
      }
      
      const totalPixels = pixels.length / 4;
      const percentage = (transparentPixels / totalPixels) * 100;
      
      if (percentage > 50) {
        setIsScratched(true);
        / Clear the remaining canvas instantly for a satisfying pop
        ctx.clearRect(0, 0, width, height);
        if (onComplete) onComplete();
      }
    };

    const handleDown = (e) => { isDrawing = true; scratch(e); };
    const handleUp = () => { isDrawing = false; };
    const handleMove = (e) => { scratch(e); };

    canvas.addEventListener('mousedown', handleDown);
    canvas.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    
    canvas.addEventListener('touchstart', handleDown, { passive: false });
    canvas.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleUp);

    return () => {
      canvas.removeEventListener('mousedown', handleDown);
      canvas.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      
      canvas.removeEventListener('touchstart', handleDown);
      canvas.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [isScratched, onComplete]);

  return (
    <div style={{ position: 'relative', width: '300px', height: '150px', margin: '0 auto', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
      {/* Hidden Reward Underneath */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #fdf4ff 0%, #fae8ff 100%)', zIndex: 1 }}>
        <h4 style={{ fontWeight: '800', color: '#c026d3', fontSize: '18px', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>You Won!</h4>
        <div style={{ fontSize: '13px', color: '#701a75', marginBottom: '12px' }}>Use code on your next order</div>
        <div style={{ background: '#c026d3', color: 'white', fontWeight: '900', fontSize: '20px', padding: '8px 24px', borderRadius: '8px', letterSpacing: '2px', boxShadow: '0 4px 10px rgba(192, 38, 211, 0.3)' }}>
          {rewardCode}
        </div>
      </div>
      
      {/* Scratchable Surface Overlay */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 2,
          cursor: isScratched ? 'default' : 'pointer',
          pointerEvents: isScratched ? 'none' : 'auto',
          transition: 'opacity 0.5s ease',
          opacity: isScratched ? 0 : 1
        }}
      />
    </div>
  );
};

export default ScratchCard;
