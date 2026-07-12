import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose }) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={20} color="#388e3c" />;
      case 'error':
        return <AlertCircle size={20} color="#d32f2f" />;
      case 'warning':
        return <AlertTriangle size={20} color="#fbc02d" />;
      case 'info':
        return <Info size={20} color="#1976d2" />;
      default:
        return null;
    }
  };

  const getStyle = () => {
    const baseStyle = {
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      backgroundColor: 'white',
      color: '#212121',
      padding: '12px 20px',
      borderRadius: '4px',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
      borderLeft: '4px solid',
      minWidth: '300px',
      maxWidth: '450px',
      animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
    };

    switch (type) {
      case 'success':
        return { ...baseStyle, borderLeftColor: '#388e3c' };
      case 'error':
        return { ...baseStyle, borderLeftColor: '#d32f2f' };
      case 'warning':
        return { ...baseStyle, borderLeftColor: '#fbc02d' };
      case 'info':
        return { ...baseStyle, borderLeftColor: '#1976d2' };
      default:
        return baseStyle;
    }
  };

  return (
    <>
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(24px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
      <div style={getStyle()}>
        <div style={{ flexShrink: 0 }}>{getIcon()}</div>
        <div style={{ flex: 1, fontSize: '14px', fontWeight: 500 }}>
          {message}
        </div>
      </div>
    </>
  );
};

export default Toast;
