import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { MapPin, ShoppingBag, CreditCard, CheckCircle2, ArrowRight, ShieldCheck, Tag, Download, Coins } from 'lucide-react';
import confetti from 'canvas-confetti';
import WorldClassInvoice from '../components/WorldClassInvoice';
import ScratchCard from '../components/ScratchCard';

const Checkout = ({ useCoinsDiscount, onNavigate }) => {
  const { cart, currentUser, placeOrder, showToast, verifyPayment, updateUserProfile, savedCards, fetchUserSavedCards } = useApp();
  const [step, setStep] = useState(1); // 1: Address, 2: Summary, 3: Payment, 4: Success
  const [selectedSavedCard, setSelectedSavedCard] = useState(null);

  useEffect(() => {
    fetchUserSavedCards();
  }, []);

  // Form states
  const [address, setAddress] = useState({
    name: currentUser ? (currentUser.fullName || '') : '',
    phone: currentUser ? (currentUser.phone || '') : '',
    pincode: currentUser ? (currentUser.pincode || '') : '',
    locality: '',
    streetAddress: currentUser ? (currentUser.address || '') : '',
    city: currentUser ? (currentUser.city || '') : '',
    state: currentUser ? (currentUser.state || '') : ''
  });

  const [shippingServiceability, setShippingServiceability] = useState(null);
  const [isCheckingShipping, setIsCheckingShipping] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState('cod'); // cod, online
  const [whatsAppUpdates, setWhatsAppUpdates] = useState(true);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGuestCheckout, setIsGuestCheckout] = useState(false);
  const isSubmittingRef = useRef(false);
  
  const invoiceRef = useRef();
  const [isDownloading, setIsDownloading] = useState(false);

  // Coupon states
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  // Synchronize currentUser fields
  useEffect(() => {
    if (currentUser) {
      setAddress(prev => ({
        ...prev,
        name: currentUser.fullName || prev.name,
        phone: currentUser.phone || currentUser.username || prev.phone,
        pincode: currentUser.pincode || prev.pincode,
        streetAddress: currentUser.address || prev.streetAddress,
        city: currentUser.city || prev.city,
        state: currentUser.state || prev.state
      }));
    }
  }, [currentUser]);

  // Resolve Indian postal pincode details automatically
  useEffect(() => {
    const controller = new AbortController();
    const resolvePincode = async () => {
      const pinStr = String(address.pincode || '');
      if (pinStr.length !== 6 || isNaN(pinStr)) return; // only call when full 6 digits
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${pinStr}`, { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          if (data[0]?.Status === "Success") {
            const postOffice = data[0].PostOffice[0];
            setAddress(prev => ({
              ...prev,
              city: postOffice.District || postOffice.Name,
              state: postOffice.State
            }));
            // eslint-disable-next-line
            showToast(`Pincode resolved: ${postOffice.District}, ${postOffice.State}!`, 'success');
          }
        }
      } catch (e) {
        if (e.name === 'AbortError') return;
        const code = pinStr;
        if (code.startsWith('11')) {
          setAddress(prev => ({ ...prev, city: 'New Delhi', state: 'Delhi' }));
        } else if (code.startsWith('40')) {
          setAddress(prev => ({ ...prev, city: 'Mumbai', state: 'Maharashtra' }));
        } else if (code.startsWith('56')) {
          setAddress(prev => ({ ...prev, city: 'Bengaluru', state: 'Karnataka' }));
        }
      }
    };
    resolvePincode();
    return () => controller.abort(); // cleanup on unmount or pincode change
  }, [address.pincode]);

  // Shiprocket Pincode Serviceability Check
  useEffect(() => {
    const pinStr = String(address.pincode || '');
    if (pinStr.length !== 6 || isNaN(pinStr)) {
      setShippingServiceability(null);
      return;
    }

    const checkShipping = async () => {
      setIsCheckingShipping(true);
      try {
        const res = await fetch(`/api/shipping/serviceability`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deliveryPincode: pinStr })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.status === 1 || data.serviceable) {
            const courier = data.data?.available_courier_companies?.[0];
            setShippingServiceability({
              serviceable: true,
              courier: courier?.courier_name || 'Premium Courier',
              estimatedDays: courier?.estimated_delivery_days || '3-5'
            });
          } else {
            setShippingServiceability({ serviceable: true, courier: 'Express Logistics', estimatedDays: '3-4' });
          }
        } else {
          setShippingServiceability({
            serviceable: true,
            courier: 'Express Priority Logistics',
            estimatedDays: '3-4'
          });
        }
      // eslint-disable-next-line
      } catch (err) {
        setShippingServiceability({
          serviceable: true,
          courier: 'Express Priority Logistics',
          estimatedDays: '3-4'
        });
      } finally {
        setIsCheckingShipping(false);
      }
    };

    checkShipping();
  }, [address.pincode]);

  // Price calculations — safe fallbacks to prevent NaN
  const itemsPrice = cart.reduce((acc, item) => acc + (item.product?.price || 0) * (item.quantity || 1), 0);
  const deliveryCharge = itemsPrice > 500 ? 0 : 40;
  const userCoins = currentUser ? (currentUser.walletCoins || 0) : 0;
  const coinsDiscount = useCoinsDiscount && currentUser ? Math.min(userCoins, itemsPrice) : 0;
  
  const couponDiscountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const finalAmount = itemsPrice - coinsDiscount - couponDiscountAmount + deliveryCharge;

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setApplyingCoupon(true);
    try {
      const res = await fetch(`/api/coupons/validate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(currentUser?.token ? { 'Authorization': `Bearer ${currentUser.token}` } : {})
        },
        body: JSON.stringify({ code: couponCode, cartValue: itemsPrice })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAppliedCoupon({ code: data.couponCode, discountAmount: data.discountAmount });
        showToast(`Coupon applied! You saved ₹${data.discountAmount}`, 'success');
      } else {
        setAppliedCoupon(null);
        showToast(data.error || data.message || 'Invalid Coupon', 'error');
      }
    // eslint-disable-next-line
    } catch (err) {
      showToast('Error applying coupon', 'error');
    } finally {
      setApplyingCoupon(false);
    }
  };

  // Handle Address Submit
  const handleAddressSubmit = (e) => {
    e.preventDefault();
    if (!address.name || !address.phone || !address.pincode || !address.streetAddress) {
      showToast('Please fill out all required shipping fields.', 'error');
      return;
    }
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(address.phone)) {
      showToast('Please enter a valid 10-digit Indian mobile number.', 'error');
      return;
    }
    if (shippingServiceability && !shippingServiceability.serviceable) {
      showToast('We cannot deliver to this pincode. Please try a different address.', 'error');
      return;
    }

    // Persist address to profile
    if (updateUserProfile && currentUser) {
      updateUserProfile({
        fullName: address.name,
        phone: address.phone,
        pincode: address.pincode,
        address: address.streetAddress,
        city: address.city,
        state: address.state
      });
    }

    setStep(2);
  };

  // Handle Payment Submit and Order Placement (Cashfree Integration)
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent double submission synchronously with ref
    if (isSubmittingRef.current || isSubmitting) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    if (paymentMethod === 'cod') {
      if (finalAmount > 15000) {
        showToast('Cash on Delivery is limited to orders up to ₹15,000 for delivery security. Please choose Instant Online Payment.', 'error');
        isSubmittingRef.current = false;
        setIsSubmitting(false);
        return;
      }

      try {
        // Direct Cash on Delivery placement
        const orderDetails = await placeOrder(
          address, 
          'Cash on Delivery',
          useCoinsDiscount,
          null,
          appliedCoupon?.code
        );
        if (orderDetails) {
          setCreatedOrder(orderDetails);
          setStep(4);
          triggerConfetti();
          
          // Auto-save address to profile
          if (updateUserProfile) {
            updateUserProfile({
              fullName: address.name,
              phone: address.phone,
              pincode: address.pincode,
              address: address.streetAddress,
              city: address.city,
              state: address.state
            });
          }

          // Auto-generate invoice after a short delay so DOM is ready
          setTimeout(() => triggerInvoiceDownload(), 500);
        } else {
          showToast('Failed to place order. Please try again.', 'error');
        }
      } catch (err) {
        showToast('Network error placing order. Please try again.', 'error');
      } finally {
        isSubmittingRef.current = false;
        setIsSubmitting(false);
      }
      return;

    }

    // Cashfree PG integration
    try {
      showToast('Connecting to Cashfree Escrow Gateway...', 'info');
      const res = await fetch(`/api/payments/cashfree/create-order`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(currentUser?.token ? { 'Authorization': `Bearer ${currentUser.token}` } : {})
        },
        body: JSON.stringify({
          cartItems: cart,
          shippingAddress: {
            fullName: address.name,
            phone: address.phone,
            streetAddress: address.streetAddress,
            city: address.city,
            postalCode: address.pincode,
            state: address.state,
            country: 'India'
          },
          paymentMethod: 'Online Payment',
          useCoinsDiscount,
          couponCode: appliedCoupon?.code
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.error || errData.message || 'Payment gateway initialization failed.', 'error');
        isSubmittingRef.current = false;
        setIsSubmitting(false);
        return;
      }

      const data = await res.json();
      
      if (data.simulated) {
        // Developer simulated successful checkout (Verify instantly)
        showToast('Verifying simulated payment...', 'info');
        const verifyRes = await fetch('/api/payments/cashfree/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: data.orderId })
        });
        const verifyData = await verifyRes.json().catch(() => ({}));
        
        if (verifyRes.ok && verifyData.success) {
          showToast('Payment Verified Successfully!', 'success');
          setCreatedOrder({
            _id: data.dbOrderId || data.orderId,
            orderId: data.orderId,
            totalPrice: data.amount || finalAmount,
            paymentStatus: 'SUCCESS',
            status: 'Placed',
            shippingAddress: address
          });
          setStep(4);
          triggerConfetti();
          
          if (updateUserProfile && currentUser) {
            updateUserProfile({
              fullName: address.name,
              phone: address.phone,
              pincode: address.pincode,
              address: address.streetAddress,
              city: address.city,
              state: address.state
            });
          }

          setTimeout(() => triggerInvoiceDownload(), 500);
        } else {
          showToast('Simulated payment verification failed.', 'error');
          isSubmittingRef.current = false;
          setIsSubmitting(false);
        }
      } else {
        // Real Cashfree integration
        showToast('Launching Cashfree Gateway...', 'success');
        if (window.Cashfree) {
          const env = process.env.NEXT_PUBLIC_CASHFREE_ENV || (process.env.NODE_ENV === 'production' ? 'production' : 'sandbox');
          const cashfree = window.Cashfree({
            mode: env === 'production' ? 'production' : 'sandbox'
          });
          
          cashfree.checkout({
            paymentSessionId: data.paymentSessionId,
            redirectTarget: "_self" // Redirects to return_url configured in backend
          }).then(() => {
            isSubmittingRef.current = false;
            setIsSubmitting(false);
          });
        } else {
          showToast('Cashfree SDK script failed to load. Redirecting to payment...', 'error');
          window.location.href = `/checkout/return?order_id=${data.orderId}`;
          isSubmittingRef.current = false;
          setIsSubmitting(false);
        }
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('Payment checkout failed:', err);
      showToast('Checkout transaction communication error.', 'error');
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const triggerConfetti = () => {
    // Fire multiple bursts of confetti
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 }
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 }
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  };

  const triggerInvoiceDownload = () => {
    if (invoiceRef.current && !isDownloading) {
      setIsDownloading(true);
      showToast('Generating your Premium Invoice...', 'info');
      invoiceRef.current.generatePDF().finally(() => {
        setIsDownloading(false);
      });
    }
  };

  if (!currentUser && !isGuestCheckout) {
    return (
      <div className="container animate-fade-in" style={{ padding: '60px 20px', minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '28px',
          border: '1px solid rgba(226, 232, 240, 0.9)',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(99, 102, 241, 0.05)',
          padding: '44px 36px',
          maxWidth: '520px',
          width: '100%',
          textAlign: 'center',
          boxSizing: 'border-box'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '24px',
            background: 'linear-gradient(135deg, #e0e7ff 0%, #ede9fe 100%)',
            border: '2px solid #c7d2fe',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
            boxShadow: '0 8px 16px rgba(99, 102, 241, 0.15)'
          }}>
            <ShieldCheck size={42} color="#4f46e5" strokeWidth={2.2} />
          </div>

          <span style={{
            display: 'inline-block',
            background: 'rgba(79, 70, 229, 0.1)',
            color: '#4f46e5',
            fontSize: '12px',
            fontWeight: '800',
            letterSpacing: '0.5px',
            padding: '4px 14px',
            borderRadius: '20px',
            textTransform: 'uppercase',
            marginBottom: '12px'
          }}>
            🔒 Secure Escrow Checkout
          </span>

          <h2 style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', margin: '0 0 10px 0', fontFamily: "'Outfit', sans-serif" }}>
            Sign In to Complete Order
          </h2>
          <p style={{ color: '#64748b', fontSize: '15px', lineHeight: '1.5', margin: '0 0 28px 0' }}>
            Access saved delivery addresses, apply festive discount vouchers, and track real-time delivery status.
          </p>

          <button 
            className="btn btn-primary" 
            onClick={() => onNavigate('login?callbackUrl=/checkout')} 
            style={{ 
              width: '100%',
              padding: '16px 24px',
              fontSize: '16px',
              fontWeight: '800',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              cursor: 'pointer',
              border: 'none',
              color: '#ffffff'
            }}
          >
            <span>Continue with Mobile / OTP</span>
            <ArrowRight size={18} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', margin: '18px 0', gap: '12px' }}>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
          </div>

          <button 
            type="button"
            onClick={() => setIsGuestCheckout(true)} 
            style={{ 
              width: '100%',
              padding: '14px 24px',
              fontSize: '14.5px',
              fontWeight: '700',
              borderRadius: '16px',
              background: '#ffffff',
              border: '2px solid #cbd5e1',
              color: '#334155',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#4f46e5'; e.currentTarget.style.color = '#4f46e5'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#334155'; }}
          >
            ⚡ Continue as Guest (Fast 1-Step Checkout)
          </button>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            marginTop: '28px',
            paddingTop: '24px',
            borderTop: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
              ⚡ 1-Click Fast OTP
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
              🛡️ Cashfree Escrow
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
              📦 Easy 7-Day Returns
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step < 4 && (!cart || cart.length === 0)) {
    return (
      <div className="container animate-fade-in" style={{ padding: '100px 20px', textAlign: 'center', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: '#fff1f2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
          <ShoppingBag size={56} color="#e11d48" />
        </div>
        <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '16px', color: '#1f2937' }}>Your Cart is Empty</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', maxWidth: '450px', lineHeight: '1.6', fontSize: '15px' }}>
          It looks like you haven't added any items to your cart, or the items were removed from another device. Please add items to proceed with checkout.
        </p>
        <button 
          className="btn btn-primary" 
          onClick={() => onNavigate('home')} 
          style={{ padding: '14px 40px', fontSize: '16px', fontWeight: '600' }}
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in desktop-premium-checkout" style={{ padding: '24px 0 150px 0', maxWidth: '800px' }}>
      
      {/* Wizard Step Progress Tracker */}
      {step < 4 && (
        <div className="checkout-tracker-container">
          <div className={`checkout-step-indicator ${step >= 1 ? 'active' : ''}`}>
            <span className="checkout-step-num">1</span>
            <span className="checkout-step-text">Delivery Address</span>
          </div>
          <div className="checkout-step-connector"></div>
          <div className={`checkout-step-indicator ${step >= 2 ? 'active' : ''}`}>
            <span className="checkout-step-num">2</span>
            <span className="checkout-step-text">Order Summary</span>
          </div>
          <div className="checkout-step-connector"></div>
          <div className={`checkout-step-indicator ${step >= 3 ? 'active' : ''}`}>
            <span className="checkout-step-num">3</span>
            <span className="checkout-step-text">Payment Options</span>
          </div>
        </div>
      )}

      {/* STEP 1: Address Details */}
      {step === 1 ? (
        <div className="card checkout-card">
          <h2 className="checkout-step-header"><MapPin size={20} /> Select Delivery Address</h2>
          
          {currentUser?.addresses && currentUser.addresses.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'grid', gap: '12px' }}>
                {currentUser.addresses.map((addr) => {
                  const isSelected = address.streetAddress === (addr.streetAddress || addr.streetArea) && address.pincode === addr.pincode;
                  return (
                    <div 
                      key={addr.id}
                      onClick={() => {
                        setAddress({
                          name: addr.name || currentUser.fullName,
                          phone: addr.phone || currentUser.phone,
                          pincode: addr.pincode,
                          locality: addr.streetArea || '',
                          streetAddress: addr.houseNo ? addr.houseNo + ', ' + (addr.streetArea || addr.streetAddress) : (addr.streetArea || addr.streetAddress),
                          city: addr.city,
                          state: addr.state
                        });
                      }}
                      style={{
                        padding: '16px',
                        border: isSelected ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                        borderRadius: '12px',
                        background: isSelected ? '#eff6ff' : '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: '700', fontSize: '15px' }}>
                          {addr?.addressType === 'Home' ? '🏠 ' : addr?.addressType === 'Work' ? '🏢 ' : '📍 '} 
                          {addr?.addressType || 'Address'} {addr?.isDefault && <span style={{fontSize: '11px', background: '#4f46e5', color: 'white', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px'}}>DEFAULT</span>}
                        </div>
                        {isSelected && <CheckCircle2 size={18} color="#4f46e5" />}
                      </div>
                      <div style={{ fontSize: '13.5px', color: '#475569', lineHeight: '1.4' }}>
                        {addr?.name || currentUser?.fullName || 'Customer'}<br/>
                        {addr?.houseNo ? addr.houseNo + ', ' : ''}{addr?.streetArea || addr?.streetAddress || ''}<br/>
                        {addr?.city || ''}, {addr?.state || ''} {addr?.pincode ? `- ${addr.pincode}` : ''}<br/>
                        {addr?.phone ? `Phone: ${addr.phone}` : ''}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
                <button 
                  onClick={() => setAddress({ name: currentUser?.fullName||'', phone: currentUser?.phone||'', pincode: '', locality: '', streetAddress: '', city: '', state: '' })}
                  style={{ 
                    background: '#eef2ff', 
                    border: '1px solid #c7d2fe', 
                    color: '#4f46e5', 
                    padding: '12px 24px', 
                    borderRadius: '12px', 
                    cursor: 'pointer', 
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#e0e7ff'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#eef2ff'; }}
                >
                  <span style={{ fontSize: '18px', lineHeight: 1 }}>+</span> Enter New Address
                </button>
              </div>
            </div>
          )}

          {(!currentUser?.addresses || currentUser.addresses.length === 0 || !address.pincode) && (
            <form onSubmit={handleAddressSubmit} className="checkout-form">
              <div className="checkout-form-row">
                <div style={{ flex: 1 }}>
                  <label className="checkout-label">Full Name*</label>
                  <input type="text" value={address.name} onChange={(e) => setAddress({...address, name: e.target.value})} className="checkout-input" required />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="checkout-label">Mobile Number*</label>
                  <input type="tel" value={address.phone} onChange={(e) => setAddress({...address, phone: e.target.value})} className="checkout-input" required />
                </div>
              </div>

              <div className="checkout-form-row">
                <div style={{ flex: 1 }}>
                  <label className="checkout-label">Pincode*</label>
                  <input type="text" value={address.pincode} onChange={(e) => setAddress({...address, pincode: e.target.value})} className="checkout-input" maxLength="6" inputMode="numeric" pattern="[0-9]{6}" placeholder="6-digit pincode" required />
                  
                  {isCheckingShipping && <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>Checking shipping serviceability...</div>}
                  {shippingServiceability && !isCheckingShipping && (
                    <div style={{ fontSize: '11px', marginTop: '4px', fontWeight: '500' }}>
                      {shippingServiceability.serviceable ? (
                        <span style={{ color: '#2e7d32' }}>✓ Deliverable by {shippingServiceability.courier || 'Express Air'} in {shippingServiceability.estimatedDays || '3-4'} days.</span>
                      ) : (
                        <span style={{ color: '#c62828' }}>✗ Delivery unavailable for this pin code.</span>
                      )}
                    </div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <label className="checkout-label">Locality/Area*</label>
                  <input type="text" value={address.locality} onChange={(e) => setAddress({...address, locality: e.target.value})} className="checkout-input" required />
                </div>
              </div>

              <div>
                <label className="checkout-label">Street Address/Flat No.*</label>
                <textarea value={address.streetAddress} onChange={(e) => setAddress({...address, streetAddress: e.target.value})} className="checkout-input" required />
              </div>

              <div className="checkout-form-row">
                <div style={{ flex: 1 }}>
                  <label className="checkout-label">City*</label>
                  <input type="text" value={address.city} onChange={(e) => setAddress({...address, city: e.target.value})} className="checkout-input" required />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="checkout-label">State*</label>
                  <input type="text" value={address.state} onChange={(e) => setAddress({...address, state: e.target.value})} className="checkout-input" required />
                </div>
              </div>

              {/* WhatsApp Tracking Updates Opt-in */}
              <div style={{ marginTop: '16px', background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '14px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input 
                  type="checkbox" 
                  id="whatsapp-optin"
                  checked={whatsAppUpdates} 
                  onChange={(e) => setWhatsAppUpdates(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#16a34a', cursor: 'pointer', flexShrink: 0 }}
                />
                <label htmlFor="whatsapp-optin" style={{ fontSize: '13px', color: '#166534', fontWeight: '700', cursor: 'pointer', margin: 0, lineHeight: '1.4' }}>
                  💬 Send real-time courier tracking &amp; live dispatch updates via <strong>WhatsApp</strong> to {address.phone || 'my phone'}.
                </label>
              </div>
            </form>
          )}

          <div className="checkout-sticky-action-bar">
            <button 
              type="button" 
              onClick={handleAddressSubmit}
              disabled={!address.name || !address.phone || !address.pincode || !address.streetAddress || isCheckingShipping || (shippingServiceability && !shippingServiceability.serviceable)} 
              className="btn btn-primary checkout-btn"
              style={{ width: '100%' }}
            >
              DELIVER HERE <ArrowRight size={18} />
            </button>
          </div>
        </div>
      ) : null}

      {/* STEP 2: Order Summary */}
      {step === 2 ? (
        <div className="card checkout-card">
          <h2 className="checkout-step-header"><ShoppingBag size={20} /> Review Order Items</h2>
          
          <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>Delivery Address:</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {address.name} | {address.phone}<br />
              {address.streetAddress}, {address.locality}, {address.city}, {address.state} - {address.pincode}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            {cart.map(item => (
              <div key={item.product.id} style={{ display: 'flex', gap: '16px', alignItems: 'center', borderBottom: '1px solid #f9f9f9', paddingBottom: '8px' }}>
                <img src={item?.product?.image || ''} alt={item?.product?.name || 'Product'} style={{ width: '50px', height: '50px', objectFit: 'contain', border: '1px solid #f0f0f0', padding: '2px', borderRadius: '4px' }} />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '500', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item?.product?.name || 'Product'}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Qty: {item?.quantity || 1} {item?.selectedColor ? `| ${item.selectedColor}` : ''} {item?.selectedVariant ? `| ${item.selectedVariant}` : ''}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Coupon Code Section */}
          <div style={{ backgroundColor: '#fff', border: '1px dashed #ccc', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 10px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Tag size={16} color="var(--primary-color)" /> Have a Coupon Code?
            </h4>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="text" 
                placeholder="Enter Code (e.g. DIWALI50)" 
                className="checkout-input"
                style={{ flex: 1, textTransform: 'uppercase' }}
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                disabled={!!appliedCoupon}
              />
              {appliedCoupon ? (
                <button className="btn btn-outline checkout-btn" onClick={() => { setAppliedCoupon(null); setCouponCode(''); }} style={{ color: '#d32f2f', borderColor: '#d32f2f' }}>
                  REMOVE
                </button>
              ) : (
                <button className="btn btn-primary checkout-btn" onClick={handleApplyCoupon} disabled={applyingCoupon || !couponCode}>
                  {applyingCoupon ? 'APPLYING...' : 'APPLY'}
                </button>
              )}
            </div>
            {appliedCoupon && (
              <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#2e7d32', fontWeight: 'bold' }}>
                ✓ Coupon '{appliedCoupon.code}' applied successfully.
              </p>
            )}
          </div>

          <div style={{ backgroundColor: '#fafafa', border: '1px solid #e0e0e0', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
              <span>Items Total Price:</span>
              <span>₹{itemsPrice.toLocaleString('en-IN')}</span>
            </div>
            {useCoinsDiscount && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#b45309', fontWeight: '600' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Coins size={14} /> AB Coins Redeemed:</span>
                <span style={{ fontWeight: '700' }}>- ₹{coinsDiscount.toLocaleString('en-IN')}</span>
              </div>
            )}
            {appliedCoupon && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#2e7d32' }}>
                <span>Coupon Discount ({appliedCoupon.code}):</span>
                <span>- ₹{appliedCoupon.discountAmount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
              <span>Delivery Charges:</span>
              <span>{deliveryCharge > 0 ? `₹${deliveryCharge}` : 'FREE'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '16px', borderTop: '1px solid #e0e0e0', paddingTop: '8px', marginTop: '8px' }}>
              <span>Total Payable Amount:</span>
              <span>₹{finalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="checkout-sticky-action-bar" style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-outline checkout-btn" style={{ flex: 1 }} onClick={() => setStep(1)}>BACK</button>
            <button className="btn btn-accent checkout-btn" style={{ flex: 2 }} onClick={() => setStep(3)}>PROCEED TO PAYMENT</button>
          </div>
        </div>
      ) : step > 2 ? (
        <div className="collapsed-step animate-fade-in" onClick={() => setStep(2)}>
          <div className="collapsed-step-title">
            <CheckCircle2 size={18} color="#10b981" /> Order Summary
          </div>
          <div className="collapsed-step-content">
            {cart.length} Items | Total: ₹{finalAmount.toLocaleString('en-IN')}
          </div>
        </div>
      ) : null}

      {/* STEP 3: Payment Options */}
      {step === 3 && (
        <div className="card checkout-card">
          <h2 className="checkout-step-header"><CreditCard size={20} /> Select Payment Option</h2>
          <form onSubmit={handlePaymentSubmit}>
            <div className="checkout-form">
              
              {/* Saved Cards Section */}
              {savedCards && savedCards.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', marginLeft: '4px' }}>Saved Cards</div>
                  {savedCards.map(card => (
                    <div 
                      key={card.instrument_id}
                      className={`checkout-payment-option ${paymentMethod === 'Online Payment' && selectedSavedCard === card.instrument_id ? 'active' : ''}`}
                      onClick={() => {
                        setPaymentMethod('Online Payment');
                        setSelectedSavedCard(card.instrument_id);
                      }}
                      style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', marginBottom: '12px' }}
                    >
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid', borderColor: paymentMethod === 'Online Payment' && selectedSavedCard === card.instrument_id ? 'var(--primary-color)' : '#cbd5e1', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        {paymentMethod === 'Online Payment' && selectedSavedCard === card.instrument_id && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary-color)' }} />}
                      </div>
                      <CreditCard size={20} color={paymentMethod === 'Online Payment' && selectedSavedCard === card.instrument_id ? 'var(--primary-color)' : '#64748b'} />
                      <div>
                        <div style={{ fontWeight: '600', color: paymentMethod === 'Online Payment' && selectedSavedCard === card.instrument_id ? 'var(--primary-color)' : '#334155', textTransform: 'capitalize' }}>
                          {card.card_bank_name ? `${card.card_bank_name} ` : ''}{card.card_network} •••• {card.last4}
                        </div>
                        <div style={{ fontSize: '13px', color: '#64748b' }}>Saved securely via Cashfree Token Vault</div>
                      </div>
                    </div>
                  ))}
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', marginLeft: '4px', marginTop: '16px' }}>Other Methods</div>
                </div>
              )}

              {/* Online Payment Option */}
              <label 
                className={`checkout-payment-option ${paymentMethod === 'online' ? 'active' : ''}`}
                style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', marginBottom: '12px', borderRadius: '16px', border: paymentMethod === 'online' ? '2px solid var(--primary-color)' : '1.5px solid #e2e8f0', background: paymentMethod === 'online' ? '#f5f3ff' : '#ffffff', transition: 'all 0.2s ease' }}
              >
                <input 
                  type="radio" 
                  name="payment" 
                  value="online" 
                  checked={paymentMethod === 'online'}
                  onChange={() => { setPaymentMethod('online'); setSelectedSavedCard(null); }}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary-color)' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '800', fontSize: '15px', color: paymentMethod === 'online' ? 'var(--primary-color)' : '#0f172a' }}>
                    ⚡ Instant Online Payment (UPI, Cards, Netbanking)
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>
                    Pay securely via UPI (Google Pay, PhonePe, Paytm), Cards &amp; Netbanking via Cashfree PG.
                  </div>
                </div>
              </label>

              {/* Cash on Delivery Option */}
              <label 
                className={`checkout-payment-option ${paymentMethod === 'cod' ? 'active' : ''}`}
                style={{ 
                  padding: '16px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '14px', 
                  cursor: finalAmount > 15000 ? 'not-allowed' : 'pointer', 
                  marginBottom: '12px', 
                  borderRadius: '16px', 
                  border: paymentMethod === 'cod' ? '2px solid var(--primary-color)' : '1.5px solid #e2e8f0', 
                  background: finalAmount > 15000 ? '#f8fafc' : (paymentMethod === 'cod' ? '#f5f3ff' : '#ffffff'), 
                  opacity: finalAmount > 15000 ? 0.6 : 1,
                  transition: 'all 0.2s ease' 
                }}
              >
                <input 
                  type="radio" 
                  name="payment" 
                  value="cod" 
                  disabled={finalAmount > 15000}
                  checked={paymentMethod === 'cod' && finalAmount <= 15000}
                  onChange={() => { if (finalAmount <= 15000) { setPaymentMethod('cod'); setSelectedSavedCard(null); } }}
                  style={{ width: '18px', height: '18px', cursor: finalAmount > 15000 ? 'not-allowed' : 'pointer', accentColor: 'var(--primary-color)' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '800', fontSize: '15px', color: paymentMethod === 'cod' ? 'var(--primary-color)' : '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span>💵 Cash On Delivery (COD)</span>
                    {finalAmount > 15000 && (
                      <span style={{ fontSize: '11px', background: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: '6px', fontWeight: '800' }}>
                        Max ₹15,000 Cap
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>
                    {finalAmount > 15000 
                      ? 'Unavailable for orders above ₹15,000. Please use Instant Online Payment for bank-grade escrow protection.' 
                      : 'Pay with cash or UPI QR scan at doorstep upon delivery.'}
                  </div>
                </div>
              </label>
            </div>

            <div className="checkout-sticky-action-bar" style={{ display: 'flex', gap: '12px' }}>
              <button type="button" className="btn btn-outline checkout-btn" style={{ flex: 1 }} onClick={() => setStep(2)} disabled={isSubmitting}>BACK</button>
              <button type="submit" className="btn btn-accent checkout-btn" style={{ flex: 2 }} disabled={isSubmitting}>
                {isSubmitting ? 'PROCESSING...' : `PLACE ORDER (₹${finalAmount.toLocaleString('en-IN')})`}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 4: Order Success Confetti Screen */}
      {step === 4 && createdOrder && (
        <div className="card animate-fade-in checkout-card" style={{ textAlign: 'center', background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'inline-flex', padding: '12px', borderRadius: '50%', backgroundColor: '#e8f5e9', marginBottom: '8px' }}>
            <CheckCircle2 size={56} color="var(--success)" />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '900', color: 'var(--success)' }}>Order Placed!</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', maxWidth: '500px' }}>
            Thank you for shopping at AbKharido.com! Your order <strong>#{createdOrder?._id?.toString()?.slice(-8)?.toUpperCase() || createdOrder?.id || 'CONFIRMED'}</strong> has been received.
          </p>

          <div style={{ backgroundColor: '#fafafa', border: '1px solid #e0e0e0', padding: '16px', borderRadius: '12px', textAlign: 'left', width: '100%', maxWidth: '550px', fontSize: '14px', margin: '8px 0' }}>
            <div style={{ fontWeight: 'bold', borderBottom: '1px solid #eee', paddingBottom: '8px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><ShieldCheck size={16} color="var(--primary-color)" /> Direct Warehousing dispatch</div>
            <div style={{ marginBottom: '4px' }}><strong>Deliver to:</strong> {createdOrder?.shippingAddress?.fullName || createdOrder?.shippingAddress?.name || address?.name || 'Customer'}</div>
            <div style={{ marginBottom: '8px' }}><strong>Address:</strong> {createdOrder?.shippingAddress?.address || createdOrder?.shippingAddress?.streetAddress || address?.streetAddress || ''}, {createdOrder?.shippingAddress?.locality || address?.locality || ''}, {createdOrder?.shippingAddress?.city || address?.city || ''} - {createdOrder?.shippingAddress?.postalCode || createdOrder?.shippingAddress?.pincode || address?.pincode || ''}</div>
            <div style={{ marginBottom: '4px', color: '#059669', fontWeight: '500' }}><strong>Estimated Arrival:</strong> Next-day priority shipping</div>
            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #eee' }}><strong>Payment Mode:</strong> {createdOrder?.paymentMethod || paymentMethod?.toUpperCase() || 'Cash on Delivery'}</div>
            <div style={{ fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px', fontSize: '16px' }}>Paid Amount: ₹{(createdOrder?.totalPrice || finalAmount || 0).toLocaleString('en-IN')}</div>
          </div>

          {/* Post Purchase Referral Boost */}
          <div style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', border: '1px solid #bbf7d0', padding: '16px', borderRadius: '12px', width: '100%', maxWidth: '550px', textAlign: 'center' }}>
            <h4 style={{ fontWeight: '800', color: '#166534', fontSize: '15px', marginBottom: '4px' }}>Earn cash back on your purchase!</h4>
            <p style={{ color: '#166534', fontSize: '13px', marginBottom: '12px' }}>
              Recommend your purchased products to friends or followers. Get up to 3% Coins (as user) or 7% Cash (as creator) on every referral sale!
            </p>
            <button 
              className="btn btn-sm btn-primary checkout-btn" 
              style={{ backgroundColor: '#15803d', border: 'none', padding: '0 24px', margin: '0 auto' }}
              onClick={() => onNavigate('partner')}
            >
              Get My Referral Links
            </button>
          </div>

          {/* Post Purchase Gamification / Scratch Card */}
          <div style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)', border: '1px solid #e2e8f0', padding: '24px', borderRadius: '16px', width: '100%', maxWidth: '550px', textAlign: 'center', marginTop: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            <h4 style={{ fontWeight: '800', color: '#0f172a', fontSize: '18px', marginBottom: '8px' }}>🎉 A Gift For Your Next Order!</h4>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
              Scratch the card below to reveal an exclusive discount coupon.
            </p>
            <ScratchCard rewardCode="SURPRISE100" />
          </div>

          <div className="checkout-btn-group" style={{ width: '100%', maxWidth: '550px', marginTop: '24px' }}>
            <button className="btn btn-primary checkout-btn" style={{ width: '100%', marginBottom: '12px' }} onClick={() => onNavigate('home')}>
              Continue Shopping
            </button>

            <button 
              className="btn btn-outline checkout-btn" 
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} 
              onClick={triggerInvoiceDownload}
              disabled={isDownloading}
            >
              <Download size={16} /> 
              {isDownloading ? 'Generating PDF...' : 'Download Invoice PDF'}
            </button>
          </div>

          {/* Hidden Premium Invoice Renderer */}
          <WorldClassInvoice ref={invoiceRef} order={createdOrder} />
        </div>
      )}

    </div>
  );
};



export default Checkout;
