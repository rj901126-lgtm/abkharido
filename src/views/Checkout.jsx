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
    phone: currentUser ? (currentUser.phone || currentUser.username || '') : '',
    pincode: currentUser ? (currentUser.pincode || '') : '',
    locality: '',
    streetAddress: currentUser ? (currentUser.address || '') : '',
    city: currentUser ? (currentUser.city || '') : '',
    state: currentUser ? (currentUser.state || '') : ''
  });

  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [shippingServiceability, setShippingServiceability] = useState(null);
  const [isCheckingShipping, setIsCheckingShipping] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState('online'); // default to online for smooth checkout
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

  // Synchronize currentUser fields & auto-select default address
  useEffect(() => {
    if (currentUser) {
      if (Array.isArray(currentUser.addresses) && currentUser.addresses.length > 0) {
        const defaultAddr = currentUser.addresses.find(a => a?.isDefault) || currentUser.addresses[0];
        if (defaultAddr) {
          setAddress({
            name: defaultAddr.name || currentUser.fullName || '',
            phone: defaultAddr.phone || currentUser.phone || currentUser.username || '',
            pincode: defaultAddr.pincode || '',
            locality: defaultAddr.streetArea || '',
            streetAddress: defaultAddr.houseNo 
              ? `${defaultAddr.houseNo}, ${defaultAddr.streetArea || defaultAddr.streetAddress || ''}`.trim()
              : (defaultAddr.streetArea || defaultAddr.streetAddress || defaultAddr.address || ''),
            city: defaultAddr.city || '',
            state: defaultAddr.state || ''
          });
          return;
        }
      }
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
    if (e && e.preventDefault) e.preventDefault();
    if (!address.name || !address.phone || !address.pincode || !address.streetAddress) {
      showToast('Please fill out all required shipping fields.', 'error');
      return;
    }
    const cleanPhone = String(address.phone || '').replace(/[^0-9]/g, '').slice(-10);
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      showToast('Please enter a valid 10-digit Indian mobile number.', 'error');
      return;
    }
    if (shippingServiceability && shippingServiceability.serviceable === false) {
      showToast('We cannot deliver to this pincode. Please try a different address.', 'error');
      return;
    }

    // Persist new address to profile address book
    if (updateUserProfile && currentUser && isAddingNewAddress) {
      const existingAddresses = Array.isArray(currentUser.addresses) ? [...currentUser.addresses] : [];
      const newAddrObj = {
        id: 'addr_' + Date.now(),
        name: address.name,
        phone: cleanPhone,
        houseNo: '',
        streetArea: address.locality || '',
        streetAddress: address.streetAddress,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        addressType: 'Home',
        isDefault: existingAddresses.length === 0
      };
      const updatedAddresses = [...existingAddresses, newAddrObj];
      updateUserProfile({
        addresses: updatedAddresses
      });
      setIsAddingNewAddress(false);
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
            <h2 className="checkout-step-header" style={{ margin: 0, border: 'none', padding: 0 }}>
              <MapPin size={20} /> Select Delivery Address
            </h2>
            {currentUser?.addresses && currentUser.addresses.length > 0 && isAddingNewAddress && (
              <button 
                type="button" 
                onClick={() => setIsAddingNewAddress(false)}
                style={{ background: '#f1f5f9', border: 'none', color: '#4f46e5', fontWeight: '800', fontSize: '12.5px', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer' }}
              >
                ← Saved Addresses
              </button>
            )}
          </div>
          
          {/* Saved Addresses View */}
          {currentUser?.addresses && currentUser.addresses.length > 0 && !isAddingNewAddress ? (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {currentUser.addresses.map((addr, idx) => {
                  const addrStreet = addr.houseNo 
                    ? `${addr.houseNo}, ${addr.streetArea || addr.streetAddress || ''}`.trim()
                    : (addr.streetArea || addr.streetAddress || addr.address || '');
                  const isSelected = (address.pincode === addr.pincode && address.streetAddress === addrStreet) || (!address.pincode && (addr.isDefault || idx === 0));
                  
                  return (
                    <div 
                      key={addr.id || `checkout-addr-${idx}`}
                      onClick={() => {
                        setAddress({
                          name: addr.name || currentUser.fullName || '',
                          phone: addr.phone || currentUser.phone || currentUser.username || '',
                          pincode: addr.pincode || '',
                          locality: addr.streetArea || '',
                          streetAddress: addrStreet,
                          city: addr.city || '',
                          state: addr.state || ''
                        });
                      }}
                      style={{
                        padding: '16px',
                        border: isSelected ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                        borderRadius: '14px',
                        background: isSelected ? '#f8faff' : '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'flex-start',
                        boxShadow: isSelected ? '0 4px 14px rgba(79, 70, 229, 0.08)' : '0 2px 6px rgba(0,0,0,0.02)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {/* Radio Circle */}
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: isSelected ? '6px solid #4f46e5' : '2px solid #cbd5e1', background: '#ffffff', flexShrink: 0, marginTop: '2px', transition: 'all 0.2s' }} />

                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <div style={{ fontWeight: '800', fontSize: '14.5px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{addr?.addressType === 'Home' ? '🏠' : addr?.addressType === 'Work' ? '🏢' : '📍'}</span>
                            <span>{addr?.addressType || 'Home'}</span>
                            {addr?.isDefault && (
                              <span style={{ fontSize: '9.5px', background: '#4f46e5', color: 'white', padding: '2px 8px', borderRadius: '100px', fontWeight: '900', letterSpacing: '0.3px' }}>
                                DEFAULT
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{ fontSize: '13.5px', color: '#0f172a', fontWeight: '700', marginBottom: '2px' }}>
                          {addr?.name || currentUser?.fullName || 'Customer'} • <span style={{ color: '#64748b', fontWeight: '600' }}>{addr?.phone || currentUser?.phone}</span>
                        </div>
                        <div style={{ fontSize: '12.5px', color: '#475569', lineHeight: '1.4' }}>
                          {addrStreet}<br/>
                          {addr?.city || ''}{addr?.city && addr?.state ? ', ' : ''}{addr?.state || ''} {addr?.pincode ? `- ${addr.pincode}` : ''}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add New Address Button */}
              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
                <button 
                  type="button"
                  onClick={() => {
                    setAddress({ name: currentUser?.fullName || '', phone: currentUser?.phone || currentUser?.username || '', pincode: '', locality: '', streetAddress: '', city: '', state: '' });
                    setIsAddingNewAddress(true);
                  }}
                  style={{ 
                    background: '#f8fafc', 
                    border: '1.5px dashed #cbd5e1', 
                    color: '#4f46e5', 
                    padding: '12px 20px', 
                    borderRadius: '12px', 
                    cursor: 'pointer', 
                    fontWeight: '800',
                    fontSize: '13.5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                >
                  <span style={{ fontSize: '18px', lineHeight: 1 }}>+</span> Add New Delivery Address
                </button>
              </div>

              {/* WhatsApp Opt-in */}
              <div style={{ marginTop: '16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input 
                  type="checkbox" 
                  id="whatsapp-optin-saved"
                  checked={whatsAppUpdates} 
                  onChange={(e) => setWhatsAppUpdates(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#16a34a', cursor: 'pointer', flexShrink: 0 }}
                />
                <label htmlFor="whatsapp-optin-saved" style={{ fontSize: '12px', color: '#166534', fontWeight: '700', cursor: 'pointer', margin: 0, lineHeight: '1.4' }}>
                  💬 Send courier tracking &amp; live dispatch updates via <strong>WhatsApp</strong> to {address.phone || currentUser.phone || 'my number'}.
                </label>
              </div>
            </div>
          ) : (
            /* Manual Address Input Form */
            <form onSubmit={handleAddressSubmit} className="checkout-form">
              <div className="checkout-form-row">
                <div style={{ flex: 1 }}>
                  <label className="checkout-label">Full Name *</label>
                  <input type="text" value={address.name} onChange={(e) => setAddress({...address, name: e.target.value})} className="checkout-input" placeholder="e.g. Raj Chauhan" required />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="checkout-label">Mobile Number *</label>
                  <input type="tel" value={address.phone} onChange={(e) => setAddress({...address, phone: e.target.value})} className="checkout-input" placeholder="10-digit mobile number" required />
                </div>
              </div>

              <div className="checkout-form-row">
                <div style={{ flex: 1 }}>
                  <label className="checkout-label">Pincode *</label>
                  <input type="text" value={address.pincode} onChange={(e) => setAddress({...address, pincode: e.target.value})} className="checkout-input" maxLength="6" inputMode="numeric" pattern="[0-9]{6}" placeholder="6-digit pincode" required />
                  
                  {isCheckingShipping && <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>Checking shipping serviceability...</div>}
                  {shippingServiceability && !isCheckingShipping && (
                    <div style={{ fontSize: '11px', marginTop: '4px', fontWeight: '600' }}>
                      {shippingServiceability.serviceable ? (
                        <span style={{ color: '#059669' }}>✓ Deliverable by {shippingServiceability.courier || 'Express Air'} in {shippingServiceability.estimatedDays || '3-4'} days.</span>
                      ) : (
                        <span style={{ color: '#dc2626' }}>✗ Delivery unavailable for this pin code.</span>
                      )}
                    </div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <label className="checkout-label">Locality / Area *</label>
                  <input type="text" value={address.locality} onChange={(e) => setAddress({...address, locality: e.target.value})} className="checkout-input" placeholder="e.g. Indiranagar" required />
                </div>
              </div>

              <div>
                <label className="checkout-label">Flat No. / Building / Street Address *</label>
                <textarea value={address.streetAddress} onChange={(e) => setAddress({...address, streetAddress: e.target.value})} className="checkout-input" placeholder="e.g. Flat 402, 100 Ft Road" required />
              </div>

              <div className="checkout-form-row">
                <div style={{ flex: 1 }}>
                  <label className="checkout-label">City *</label>
                  <input type="text" value={address.city} onChange={(e) => setAddress({...address, city: e.target.value})} className="checkout-input" placeholder="e.g. Bengaluru" required />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="checkout-label">State *</label>
                  <input type="text" value={address.state} onChange={(e) => setAddress({...address, state: e.target.value})} className="checkout-input" placeholder="e.g. Karnataka" required />
                </div>
              </div>

              {/* WhatsApp Tracking Updates Opt-in */}
              <div style={{ marginTop: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input 
                  type="checkbox" 
                  id="whatsapp-optin-form"
                  checked={whatsAppUpdates} 
                  onChange={(e) => setWhatsAppUpdates(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#16a34a', cursor: 'pointer', flexShrink: 0 }}
                />
                <label htmlFor="whatsapp-optin-form" style={{ fontSize: '12px', color: '#166534', fontWeight: '700', cursor: 'pointer', margin: 0, lineHeight: '1.4' }}>
                  💬 Send courier tracking &amp; live dispatch updates via <strong>WhatsApp</strong> to {address.phone || 'my phone'}.
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
              Deliver to this Address →
            </button>
          </div>
        </div>
      ) : null}

      {/* STEP 2: Order Summary */}
      {step === 2 ? (
        <div className="card checkout-card">
          <h2 className="checkout-step-header"><ShoppingBag size={20} /> Review Order Items</h2>
          
          {/* Delivery Address Recap */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px 16px', marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>📍 Delivering To</div>
              <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
                {address.name} • <span style={{ color: '#64748b', fontWeight: '600' }}>{address.phone}</span>
              </div>
              <div style={{ fontSize: '12.5px', color: '#475569', marginTop: '2px', lineHeight: '1.4' }}>
                {address.streetAddress}{address.locality ? `, ${address.locality}` : ''}, {address.city}, {address.state} - {address.pincode}
              </div>
            </div>
            <button 
              type="button" 
              onClick={() => setStep(1)} 
              style={{ background: '#ffffff', border: '1px solid #cbd5e1', color: '#4f46e5', fontWeight: '800', fontSize: '11.5px', padding: '5px 12px', borderRadius: '8px', cursor: 'pointer', flexShrink: 0 }}
            >
              Change
            </button>
          </div>

          {/* Product Items List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            {cart.map((item, i) => (
              <div key={item.product?.id || `summary-item-${i}`} style={{ display: 'flex', gap: '12px', alignItems: 'center', background: '#ffffff', border: '1px solid #f1f5f9', padding: '10px 12px', borderRadius: '12px' }}>
                <div style={{ width: '54px', height: '54px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: '4px' }}>
                  <img src={item?.product?.image || ''} alt={item?.product?.name || 'Product'} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item?.product?.name || 'Product'}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                    Qty: <strong style={{ color: '#0f172a' }}>{item?.quantity || 1}</strong>
                    {item?.selectedColor ? ` • ${item.selectedColor}` : ''}
                    {item?.selectedVariant ? ` • ${item.selectedVariant}` : ''}
                  </div>
                </div>
                <div style={{ fontSize: '14px', fontWeight: '900', color: '#0f172a', textAlign: 'right' }}>
                  ₹{((item?.product?.price || 0) * (item?.quantity || 1)).toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>

          {/* Coupon Code Section */}
          <div style={{ backgroundColor: '#ffffff', border: '1px dashed #cbd5e1', padding: '14px', borderRadius: '14px', marginBottom: '18px' }}>
            <h4 style={{ margin: '0 0 8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', color: '#0f172a', fontWeight: '800' }}>
              <Tag size={15} color="#4f46e5" /> Have a Coupon Code?
            </h4>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                placeholder="ENTER COUPON CODE" 
                className="checkout-input"
                style={{ flex: 1, textTransform: 'uppercase', height: '42px', fontSize: '13px', fontWeight: '700' }}
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                disabled={!!appliedCoupon}
              />
              {appliedCoupon ? (
                <button className="btn btn-outline checkout-btn" onClick={() => { setAppliedCoupon(null); setCouponCode(''); }} style={{ color: '#dc2626', borderColor: '#fca5a5', height: '42px', padding: '0 16px', fontSize: '12px' }}>
                  Remove
                </button>
              ) : (
                <button className="btn btn-primary checkout-btn" onClick={handleApplyCoupon} disabled={applyingCoupon || !couponCode} style={{ height: '42px', padding: '0 20px', fontSize: '12px' }}>
                  {applyingCoupon ? 'Applying...' : 'Apply'}
                </button>
              )}
            </div>
            {appliedCoupon && (
              <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#059669', fontWeight: '800' }}>
                🎉 Coupon '{appliedCoupon.code}' applied! You saved ₹{appliedCoupon.discountAmount}.
              </p>
            )}
          </div>

          {/* Price Breakdown */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', padding: '16px', borderRadius: '14px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13.5px', color: '#475569', fontWeight: '600' }}>
              <span>Items Total Price:</span>
              <span style={{ color: '#0f172a', fontWeight: '700' }}>₹{itemsPrice.toLocaleString('en-IN')}</span>
            </div>
            {useCoinsDiscount && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13.5px', color: '#b45309', fontWeight: '700' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Coins size={14} /> AB Coins Redeemed:</span>
                <span>- ₹{coinsDiscount.toLocaleString('en-IN')}</span>
              </div>
            )}
            {appliedCoupon && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13.5px', color: '#059669', fontWeight: '700' }}>
                <span>Coupon Discount ({appliedCoupon.code}):</span>
                <span>- ₹{appliedCoupon.discountAmount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13.5px', color: '#475569', fontWeight: '600' }}>
              <span>Delivery Charges:</span>
              <span style={{ color: '#059669', fontWeight: '800' }}>{deliveryCharge > 0 ? `₹${deliveryCharge}` : 'FREE'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '900', fontSize: '17px', borderTop: '1.5px dashed #cbd5e1', paddingTop: '10px', marginTop: '6px', color: '#0f172a' }}>
              <span>Total Payable Amount:</span>
              <span>₹{finalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="checkout-sticky-action-bar" style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-outline checkout-btn" style={{ flex: 1 }} onClick={() => setStep(1)}>Back</button>
            <button className="btn btn-accent checkout-btn" style={{ flex: 2 }} onClick={() => setStep(3)}>Proceed to Payment →</button>
          </div>
        </div>
      ) : step > 2 ? (
        <div className="collapsed-step animate-fade-in" onClick={() => setStep(2)}>
          <div className="collapsed-step-title">
            <CheckCircle2 size={18} color="#10b981" /> Order Summary
          </div>
          <div className="collapsed-step-content">
            {cart.reduce((a, b) => a + b.quantity, 0)} {cart.length === 1 ? 'Item' : 'Items'} | Total: ₹{finalAmount.toLocaleString('en-IN')}
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
                  <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px', marginLeft: '2px' }}>Saved Cards</div>
                  {savedCards.map(card => (
                    <div 
                      key={card.instrument_id}
                      className={`checkout-payment-option ${paymentMethod === 'Online Payment' && selectedSavedCard === card.instrument_id ? 'active' : ''}`}
                      onClick={() => {
                        setPaymentMethod('Online Payment');
                        setSelectedSavedCard(card.instrument_id);
                      }}
                      style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', marginBottom: '8px', borderRadius: '14px', border: '1.5px solid #e2e8f0' }}
                    >
                      <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid', borderColor: paymentMethod === 'Online Payment' && selectedSavedCard === card.instrument_id ? '#4f46e5' : '#cbd5e1', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        {paymentMethod === 'Online Payment' && selectedSavedCard === card.instrument_id && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4f46e5' }} />}
                      </div>
                      <CreditCard size={20} color={paymentMethod === 'Online Payment' && selectedSavedCard === card.instrument_id ? '#4f46e5' : '#64748b'} />
                      <div>
                        <div style={{ fontWeight: '700', color: '#0f172a', textTransform: 'capitalize', fontSize: '13.5px' }}>
                          {card.card_bank_name ? `${card.card_bank_name} ` : ''}{card.card_network} •••• {card.last4}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#64748b' }}>Saved via Cashfree Token Vault</div>
                      </div>
                    </div>
                  ))}
                  <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px', marginLeft: '2px', marginTop: '12px' }}>Payment Options</div>
                </div>
              )}

              {/* Online Payment Option */}
              <label 
                className={`checkout-payment-option ${paymentMethod === 'online' ? 'active' : ''}`}
                style={{ padding: '16px', display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', marginBottom: '10px', borderRadius: '16px', border: paymentMethod === 'online' ? '2px solid #4f46e5' : '1.5px solid #e2e8f0', background: paymentMethod === 'online' ? '#f8faff' : '#ffffff', transition: 'all 0.2s ease', boxShadow: paymentMethod === 'online' ? '0 4px 14px rgba(79, 70, 229, 0.08)' : 'none' }}
              >
                <input 
                  type="radio" 
                  name="payment" 
                  value="online" 
                  checked={paymentMethod === 'online'}
                  onChange={() => { setPaymentMethod('online'); setSelectedSavedCard(null); }}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#4f46e5', marginTop: '2px' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '800', fontSize: '14.5px', color: '#0f172a' }}>
                    ⚡ Instant Online Payment (UPI, Cards, Netbanking)
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', lineHeight: 1.4 }}>
                    Pay securely via UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards &amp; Netbanking via Cashfree.
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                    {['Google Pay', 'PhonePe', 'Paytm', 'Cards', 'NetBanking'].map((badge, bIdx) => (
                      <span key={bIdx} style={{ fontSize: '10px', fontWeight: '800', background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              </label>

              {/* Cash on Delivery Option */}
              <label 
                className={`checkout-payment-option ${paymentMethod === 'cod' ? 'active' : ''}`}
                style={{ 
                  padding: '16px', 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: '12px', 
                  cursor: finalAmount > 15000 ? 'not-allowed' : 'pointer', 
                  marginBottom: '10px', 
                  borderRadius: '16px', 
                  border: paymentMethod === 'cod' ? '2px solid #4f46e5' : '1.5px solid #e2e8f0', 
                  background: finalAmount > 15000 ? '#f8fafc' : (paymentMethod === 'cod' ? '#f8faff' : '#ffffff'), 
                  opacity: finalAmount > 15000 ? 0.65 : 1,
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
                  style={{ width: '18px', height: '18px', cursor: finalAmount > 15000 ? 'not-allowed' : 'pointer', accentColor: '#4f46e5', marginTop: '2px' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '800', fontSize: '14.5px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span>💵 Cash On Delivery (COD)</span>
                    {finalAmount > 15000 && (
                      <span style={{ fontSize: '10.5px', background: '#fee2e2', color: '#dc2626', padding: '1px 8px', borderRadius: '6px', fontWeight: '800' }}>
                        Max ₹15,000 Cap
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', lineHeight: 1.4 }}>
                    {finalAmount > 15000 
                      ? 'Unavailable for orders above ₹15,000. Please use Instant Online Payment for bank-grade escrow protection.' 
                      : 'Pay with cash or UPI QR scan at doorstep upon delivery.'}
                  </div>
                </div>
              </label>
            </div>

            <div className="checkout-sticky-action-bar" style={{ display: 'flex', gap: '10px' }}>
              <button type="button" className="btn btn-outline checkout-btn" style={{ flex: 1 }} onClick={() => setStep(2)} disabled={isSubmitting}>Back</button>
              <button type="submit" className="btn btn-accent checkout-btn" style={{ flex: 2 }} disabled={isSubmitting}>
                {isSubmitting ? 'Processing...' : `Place Order (₹${finalAmount.toLocaleString('en-IN')})`}
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
