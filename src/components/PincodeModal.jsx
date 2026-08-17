import React, { useState } from 'react';
import { MapPin, X, CheckCircle, Navigation, Clock, ShieldCheck, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { lookupPincode } from '../utils/pincodeData';

const POPULAR_METROS = [
  { name: 'New Delhi', pin: '110001' },
  { name: 'Mumbai', pin: '400001' },
  { name: 'Bengaluru', pin: '560001' },
  { name: 'Kolkata', pin: '700001' },
  { name: 'Chennai', pin: '600001' },
  { name: 'Hyderabad', pin: '500001' },
  { name: 'Pune', pin: '411001' },
  { name: 'Ahmedabad', pin: '380001' }
];

const PincodeModal = ({ isOpen, onClose }) => {
  const { currentPincode, setDeliveryLocation, showToast } = useApp();
  const [pinInput, setPinInput] = useState(currentPincode || '110001');
  const [detectedLocation, setDetectedLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handlePincodeChange = (val) => {
    const clean = val.replace(/\D/g, '').slice(0, 6);
    setPinInput(clean);
    setErrorMsg('');

    if (clean.length === 6) {
      const info = lookupPincode(clean);
      if (info) {
        setDetectedLocation(info);
      }
    } else {
      setDetectedLocation(null);
    }
  };

  const handleApply = (pinToApply) => {
    const targetPin = pinToApply || pinInput;
    if (targetPin.length !== 6) {
      setErrorMsg('Please enter a valid 6-digit Indian Pincode.');
      return;
    }

    const info = lookupPincode(targetPin);
    if (info) {
      if (setDeliveryLocation) {
        setDeliveryLocation(info);
      }
      localStorage.setItem('abkharido_delivery_pincode', JSON.stringify(info));
      if (showToast) {
        showToast(`📍 Delivery location set to ${info.city} (${info.pincode})`, 'success');
      }
      onClose();
    } else {
      setErrorMsg('Unable to verify serviceability for this Pincode.');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(8px)',
      zIndex: 999999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }} onClick={onClose}>
      <div style={{
        background: '#ffffff',
        borderRadius: '24px',
        maxWidth: '460px',
        width: '100%',
        padding: '28px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        animation: 'modalSlideUp 0.25s ease-out'
      }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', background: '#e0e7ff', borderRadius: '12px', color: '#4f46e5' }}>
              <MapPin size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>Choose Delivery Location</h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Select your address to see accurate delivery dates &amp; COD availability.</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}>
            <X size={18} />
          </button>
        </div>

        {/* Input Box */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              placeholder="Enter 6-digit Pincode"
              maxLength={6}
              value={pinInput}
              onChange={(e) => handlePincodeChange(e.target.value)}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1.5px solid #cbd5e1',
                fontSize: '15px',
                fontWeight: '700',
                outline: 'none',
                letterSpacing: '1px'
              }}
            />
            <button 
              onClick={() => handleApply()}
              style={{
                padding: '12px 20px',
                background: '#4f46e5',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '800',
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
              }}
            >
              Apply
            </button>
          </div>
          {errorMsg && <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px', fontWeight: '600' }}>{errorMsg}</div>}
        </div>

        {/* Detected Info Card */}
        {detectedLocation && (
          <div style={{
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: '14px',
            padding: '14px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <CheckCircle size={20} color="#059669" />
            <div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#065f46' }}>
                Serviceable to {detectedLocation.city}, {detectedLocation.state}
              </div>
              <div style={{ fontSize: '12px', color: '#047857', marginTop: '2px' }}>
                ⚡ Express Delivery by <strong>{detectedLocation.deliveryDateStr}</strong> | 💵 COD Available
              </div>
            </div>
          </div>
        )}

        {/* Popular Cities */}
        <div>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Popular Delivery Hubs
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {POPULAR_METROS.map(m => (
              <button
                key={m.pin}
                onClick={() => {
                  setPinInput(m.pin);
                  handleApply(m.pin);
                }}
                style={{
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  color: '#334155',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#4f46e5'; e.currentTarget.style.color = '#4f46e5'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#334155'; }}
              >
                <span>{m.name}</span>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>{m.pin}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default PincodeModal;
