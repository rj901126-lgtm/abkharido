import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(type === 'error' ? [30, 50, 30] : 25);
      } catch (_) {}
    }
  }, [type]);

  if (!message) return null;

  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle2 size={17} color="#ffffff" strokeWidth={2.5} />,
          badgeBg: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
          glow: 'rgba(16, 185, 129, 0.3)',
          borderColor: 'rgba(52, 211, 153, 0.4)'
        };
      case 'error':
        return {
          icon: <AlertCircle size={17} color="#ffffff" strokeWidth={2.5} />,
          badgeBg: 'linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)',
          glow: 'rgba(244, 63, 94, 0.3)',
          borderColor: 'rgba(251, 113, 133, 0.4)'
        };
      case 'warning':
        return {
          icon: <AlertTriangle size={17} color="#ffffff" strokeWidth={2.5} />,
          badgeBg: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
          glow: 'rgba(245, 158, 11, 0.3)',
          borderColor: 'rgba(251, 191, 36, 0.4)'
        };
      case 'info':
      default:
        return {
          icon: <Info size={17} color="#ffffff" strokeWidth={2.5} />,
          badgeBg: 'linear-gradient(135deg, #2563eb 0%, #38bdf8 100%)',
          glow: 'rgba(56, 189, 248, 0.3)',
          borderColor: 'rgba(56, 189, 248, 0.4)'
        };
    }
  };

  const config = getTypeConfig();

  return (
    <>
      <style>{`
        @keyframes toastIslandDrop {
          0% {
            opacity: 0;
            transform: translate(-50%, -24px) scale(0.92);
          }
          65% {
            opacity: 1;
            transform: translate(-50%, 3px) scale(1.02);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, 0) scale(1);
          }
        }
        .abkharido-toast-pill {
          position: fixed;
          top: 24px;
          left: 50%;
          transform: translate(-50%, 0);
          z-index: 100000;
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(15, 23, 42, 0.92);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          color: #ffffff;
          padding: 8px 16px 8px 10px;
          border-radius: 50px;
          box-shadow: 0 16px 36px -6px rgba(0, 0, 0, 0.45), 0 0 18px ${config.glow};
          border: 1px solid ${config.borderColor};
          min-width: 240px;
          max-width: 90vw;
          width: fit-content;
          animation: toastIslandDrop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          font-family: 'Outfit', sans-serif;
          pointer-events: auto;
          box-sizing: border-box;
        }
        @media (max-width: 768px) {
          .abkharido-toast-pill {
            top: calc(env(safe-area-inset-top, 14px) + 14px);
            min-width: 200px;
            max-width: 92vw;
            padding: 8px 14px 8px 8px;
          }
        }
      `}</style>
      <div className="abkharido-toast-pill" role="alert">
        {/* Dynamic Glowing Icon Badge */}
        <div 
          style={{ 
            width: '28px', 
            height: '28px', 
            borderRadius: '50%', 
            background: config.badgeBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: `0 2px 8px ${config.glow}`
          }}
        >
          {config.icon}
        </div>

        {/* Toast Content Message */}
        <div 
          style={{ 
            flex: 1, 
            fontSize: '13.5px', 
            fontWeight: '600', 
            letterSpacing: '0.2px',
            color: '#f8fafc',
            lineHeight: 1.35,
            whiteSpace: 'normal',
            wordBreak: 'break-word'
          }}
        >
          {message}
        </div>

        {/* Optional Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: '4px'
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>
    </>
  );
};

export default Toast;
