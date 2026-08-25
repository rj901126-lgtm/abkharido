import React, { useState, useEffect } from 'react';
import { MapPin, X, CheckCircle, Navigation, Clock, ShieldCheck, Sparkles, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { lookupPincode, lookupPincodeAsync } from '../utils/pincodeData';

const POPULAR_METROS = [
  { name: 'Palghar / Thane', pin: '401404' },
  { name: 'Mumbai', pin: '400001' },
  { name: 'Pune', pin: '411001' },
  { name: 'Bengaluru', pin: '560001' },
  { name: 'New Delhi', pin: '110001' },
  { name: 'Hyderabad', pin: '500001' },
  { name: 'Kolkata', pin: '700001' },
  { name: 'Ahmedabad', pin: '380001' }
];

const PincodeModal = ({ isOpen, onClose }) => {
  const { currentPincode, deliveryLocation, setDeliveryLocation, detectUserLocation, isDetectingLocation, showToast } = useApp();
  const [pinInput, setPinInput] = useState(currentPincode || deliveryLocation?.pincode || '401404');
  const [detectedLocation, setDetectedLocation] = useState(null);
  const [isResolving, setIsResolving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      const activePin = currentPincode || deliveryLocation?.pincode || '401404';
      setPinInput(activePin);
      if (activePin) {
        const info = lookupPincode(activePin);
        if (info) setDetectedLocation(info);
      }
    }
  }, [isOpen, currentPincode, deliveryLocation]);

  if (!isOpen) return null;

  const handlePincodeChange = async (val) => {
    const clean = val.replace(/\D/g, '').slice(0, 6);
    setPinInput(clean);
    setErrorMsg('');

    if (clean.length === 6) {
      setIsResolving(true);
      const info = await lookupPincodeAsync(clean);
      setIsResolving(false);
      if (info) {
        setDetectedLocation(info);
      }
    } else {
      setDetectedLocation(null);
    }
  };

  const handleApply = async (pinToApply) => {
    const targetPin = pinToApply || pinInput;
    if (targetPin.length !== 6) {
      setErrorMsg('Please enter a valid 6-digit Indian Pincode.');
      return;
    }

    setIsResolving(true);
    const info = await lookupPincodeAsync(targetPin);
    setIsResolving(false);

    if (info) {
      if (setDeliveryLocation) {
        setDeliveryLocation(info);
      }
      try {
        localStorage.setItem('abkharido_delivery_pincode', JSON.stringify(info));
      } catch(e) {}

      if (showToast) {
        showToast(`📍 Delivery location set to ${info.city} (${info.pincode})`, 'success');
      }
      onClose();
    } else {
      setErrorMsg('Unable to verify serviceability for this Pincode.');
    }
  };

  const handleAutoDetectClick = async () => {
    if (!detectUserLocation) return;
    setErrorMsg('');
    const res = await detectUserLocation(true);
    if (res) {
      setPinInput(res.pincode);
      setDetectedLocation(res);
      setTimeout(() => onClose(), 500);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
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
        padding: '24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        animation: 'modalSlideUp 0.25s ease-out'
      }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', background: '#e0e7ff', borderRadius: '12px', color: '#4f46e5', flexShrink: 0 }}>
              <MapPin size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>Choose Delivery Location</h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>Select your location for live dispatch dates &amp; COD availability.</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', flexShrink: 0 }}>
            <X size={18} />
          </button>
        </div>

        {/* 🌟 Auto-Detect Location Button */}
        <button 
          type="button"
          onClick={handleAutoDetectClick}
          disabled={isDetectingLocation}
          style={{
            width: '100%',
            padding: '12px 16px',
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
            border: '1.5px solid #86efac',
            borderRadius: '14px',
            color: '#15803d',
            fontWeight: '800',
            fontSize: '13.5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: isDetectingLocation ? 'wait' : 'pointer',
            marginBottom: '16px',
            boxShadow: '0 2px 8px rgba(22, 163, 74, 0.12)',
            transition: 'all 0.2s'
          }}
        >
          {isDetectingLocation ? (
            <div style={{ width: '16px', height: '16px', border: '2px solid #16a34a', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          ) : (
            <Navigation size={17} color="#16a34a" />
          )}
          <span>{isDetectingLocation ? 'Auto-Detecting Location...' : '📍 Use My Current Location (Auto Detect)'}</span>
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>or enter pincode</span>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
        </div>

        {/* Input Box */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              placeholder="Enter 6-digit Pincode"
              maxLength={6}
              value={pinInput}
              onChange={(e) => handlePincodeChange(e.target.value)}
              style={{
                flex: 1,
                padding: '12px 14px',
                borderRadius: '12px',
                border: '1.5px solid #cbd5e1',
                fontSize: '14.5px',
                fontWeight: '700',
                outline: 'none',
                letterSpacing: '1px'
              }}
            />
            <button 
              onClick={() => handleApply()}
              disabled={isResolving}
              style={{
                padding: '12px 20px',
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '800',
                fontSize: '13.5px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
              }}
            >
              {isResolving ? 'Checking...' : 'Apply'}
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
            padding: '12px 14px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <CheckCircle size={18} color="#059669" flexShrink={0} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#065f46' }}>
                Serviceable to {detectedLocation.city}, {detectedLocation.state}
              </div>
              <div style={{ fontSize: '11.5px', color: '#047857', marginTop: '1px' }}>
                ⚡ Express Delivery by <strong>{detectedLocation.deliveryDateStr}</strong> | 💵 COD Available
              </div>
            </div>
          </div>
        )}

        {/* Popular Cities */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
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
                  border: pinInput === m.pin ? '1.5px solid #4f46e5' : '1px solid #e2e8f0',
                  background: pinInput === m.pin ? '#f5f3ff' : '#f8fafc',
                  color: pinInput === m.pin ? '#4f46e5' : '#334155',
                  fontSize: '12.5px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.2s ease'
                }}
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
