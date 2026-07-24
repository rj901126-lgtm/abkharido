import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { MapPin, ShoppingBag, CreditCard, CheckCircle2, ArrowRight, ShieldCheck, Tag, Download } from 'lucide-react';
import confetti from 'canvas-confetti';
import WorldClassInvoice from '../components/WorldClassInvoice';

const Checkout = ({ useCoinsDiscount, onNavigate }) => {
  const { cart, currentUser, placeOrder, showToast, verifyPayment } = useApp();
  const [step, setStep] = useState(1); // 1: Address, 2: Summary, 3: Payment, 4: Success

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
  const [createdOrder, setCreatedOrder] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/shipping/serviceability', {
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
            setShippingServiceability({ serviceable: false, error: 'Pincode unserviceable' });
          }
        } else {
          setShippingServiceability({ serviceable: false, error: 'Could not fetch serviceability' });
        }
      // eslint-disable-next-line
      } catch (err) {
        setShippingServiceability({ serviceable: false, error: 'Network error checking shipping' });
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/coupons/validate', {
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
        // Auto-generate invoice after a short delay so DOM is ready
        setTimeout(() => triggerInvoiceDownload(), 500);
      }
      return;
    }

    // Cashfree PG integration
    try {
      showToast('Initializing Cashfree gateway...', 'info');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/payment/session', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser?.token}`
        },
        body: JSON.stringify({
          amount: finalAmount,
          customerId: currentUser.username,
          customerPhone: address.phone,
          customerEmail: currentUser.email
        })
      });

      if (!res.ok) {
        showToast('Payment gateway initialization failed.', 'error');
        return;
      }

      const data = await res.json();
      
      // Pre-create order in database as PENDING before starting payment
      const orderDetails = await placeOrder(
        address,
        'Online Payment',
        useCoinsDiscount,
        data.orderId,
        appliedCoupon?.code
      );

      if (!orderDetails) {
        showToast('Failed to register order transaction.', 'error');
        isSubmittingRef.current = false;
        setIsSubmitting(false);
        return;
      }
      
      if (data.simulated) {
        // Developer simulated successful checkout (Verify instantly)
        showToast('Verifying simulated payment...', 'info');
        const isVerified = await verifyPayment(orderDetails._id || data.orderId);
        
        if (isVerified) {
          showToast('Payment Verified Successfully!', 'success');
          // Fetch updated order details
          setCreatedOrder({
            ...orderDetails,
            paymentStatus: 'SUCCESS',
            status: 'Packed'
          });
          setStep(4);
          triggerConfetti();
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
          const isProd = process.env.VITE_CASHFREE_PROD === 'true';
          const cashfree = window.Cashfree({
            mode: isProd ? "production" : "sandbox"
          });
          
          cashfree.checkout({
            paymentSessionId: data.paymentSessionId,
            redirectTarget: "_self" // Redirects to return_url configured in backend
          }).then(() => {
            isSubmittingRef.current = false;
            setIsSubmitting(false);
          });
        } else {
          showToast('Cashfree SDK script failed to load.', 'error');
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

  if (!currentUser) {
    return (
      <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>Authentication Required</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Please log in to proceed to checkout.</p>
        <button 
          className="btn btn-primary" 
          onClick={() => onNavigate('login')} 
          style={{ marginTop: '16px' }}
        >
          Go to Login Page
        </button>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={{ padding: '24px 0 100px 0', maxWidth: '800px' }}>
      
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
      {step === 1 && (
        <div className="card checkout-card">
          <h2 className="checkout-step-header"><MapPin size={20} /> Shipping Address Details</h2>
          <form onSubmit={handleAddressSubmit} className="checkout-form">
            <div className="checkout-form-row">
              <div style={{ flex: 1 }}>
                <label className="checkout-label">Full Name*</label>
                <input 
                  type="text" 
                  value={address.name} 
                  onChange={(e) => setAddress({...address, name: e.target.value})}
                  className="checkout-input" 
                  required
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="checkout-label">Mobile Number*</label>
                <input 
                  type="tel" 
                  value={address.phone} 
                  onChange={(e) => setAddress({...address, phone: e.target.value})}
                  className="checkout-input" 
                  required
                />
              </div>
            </div>

            <div className="checkout-form-row">
              <div style={{ flex: 1 }}>
                <label className="checkout-label">Pincode*</label>
                <input 
                  type="text" 
                  value={address.pincode} 
                  onChange={(e) => setAddress({...address, pincode: e.target.value})}
                  className="checkout-input" 
                  maxLength="6"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  placeholder="6-digit pincode"
                  required
                />
                
                {/* Shiprocket Serviceability UI Feedback */}
                {isCheckingShipping && (
                  <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                    Checking shipping serviceability...
                  </div>
                )}
                {shippingServiceability && !isCheckingShipping && (
                  <div style={{ fontSize: '11px', marginTop: '4px', fontWeight: '500' }}>
                    {shippingServiceability.serviceable ? (
                      <span style={{ color: '#2e7d32' }}>
                        ✓ Deliverable by {shippingServiceability.courier} in {shippingServiceability.estimatedDays || 4-5} days.
                      </span>
                    ) : (
                      <span style={{ color: '#c62828' }}>
                        ✗ Delivery unavailable for this pin code.
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <label className="checkout-label">Locality/Area*</label>
                <input 
                  type="text" 
                  value={address.locality} 
                  onChange={(e) => setAddress({...address, locality: e.target.value})}
                  className="checkout-input" 
                  required
                />
              </div>
            </div>

            <div>
              <label className="checkout-label">Street Address/Flat No.*</label>
              <textarea 
                value={address.streetAddress} 
                onChange={(e) => setAddress({...address, streetAddress: e.target.value})}
                className="checkout-input"
                required
              />
            </div>

            <div className="checkout-form-row">
              <div style={{ flex: 1 }}>
                <label className="checkout-label">City*</label>
                <input 
                  type="text" 
                  value={address.city} 
                  onChange={(e) => setAddress({...address, city: e.target.value})}
                  className="checkout-input" 
                  required
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="checkout-label">State*</label>
                <input 
                  type="text" 
                  value={address.state} 
                  onChange={(e) => setAddress({...address, state: e.target.value})}
                  className="checkout-input" 
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-accent checkout-btn" style={{ marginTop: '12px' }}>
              SAVE AND DELIVER HERE <ArrowRight size={16} style={{ marginLeft: '8px' }} />
            </button>
          </form>
        </div>
      )}

      {/* STEP 2: Order Summary */}
      {step === 2 && (
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
                <img src={item.product.image} alt={item.product.name} style={{ width: '50px', height: '50px', objectFit: 'contain', border: '1px solid #f0f0f0', padding: '2px', borderRadius: '4px' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: '500', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.product.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Qty: {item.quantity} | Subtotal: ₹{((item.product.price || 0) * item.quantity).toLocaleString('en-IN')}</div>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#e68f00' }}>
                <span>Redeemed Coins Discount:</span>
                <span>- ₹{coinsDiscount.toLocaleString('en-IN')}</span>
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

          <div className="checkout-btn-group" style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-outline checkout-btn" style={{ flex: 1 }} onClick={() => setStep(1)}>BACK</button>
            <button className="btn btn-accent checkout-btn" style={{ flex: 2 }} onClick={() => setStep(3)}>PROCEED TO PAYMENT</button>
          </div>
        </div>
      )}

      {/* STEP 3: Payment Options */}
      {step === 3 && (
        <div className="card checkout-card">
          <h2 className="checkout-step-header"><CreditCard size={20} /> Select Payment Option</h2>
          <form onSubmit={handlePaymentSubmit}>
            <div className="checkout-form">
              
              {/* COD */}
              <label className={`checkout-payment-option ${paymentMethod === 'cod' ? 'active' : ''}`}>
                <input 
                  type="radio" 
                  name="payment" 
                  value="cod" 
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  style={{ width: '18px', height: '18px', marginTop: '2px' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', fontSize: '15px' }}>Cash On Delivery (COD)</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Pay with cash or digital scanning during delivery.</div>
                </div>
              </label>

              {/* Cashfree Online Payment Gateway */}
              <label className={`checkout-payment-option ${paymentMethod === 'online' ? 'active' : ''}`}>
                <input 
                  type="radio" 
                  name="payment" 
                  value="online" 
                  checked={paymentMethod === 'online'}
                  onChange={() => setPaymentMethod('online')}
                  style={{ width: '18px', height: '18px', marginTop: '2px' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', fontSize: '15px' }}>Online Payment (UPI, Cards, Netbanking)</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Pay securely using UPI, Credit/Debit Cards, Netbanking via Cashfree.</div>
                </div>
              </label>

            </div>

            <div className="checkout-btn-group" style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
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
            Thank you for shopping at AbKharido.com! Your order <strong>#{createdOrder.id}</strong> has been received.
          </p>

          <div style={{ backgroundColor: '#fafafa', border: '1px solid #e0e0e0', padding: '16px', borderRadius: '12px', textAlign: 'left', width: '100%', maxWidth: '550px', fontSize: '14px', margin: '8px 0' }}>
            <div style={{ fontWeight: 'bold', borderBottom: '1px solid #eee', paddingBottom: '8px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><ShieldCheck size={16} color="var(--primary-color)" /> Direct Warehousing dispatch</div>
            <div style={{ marginBottom: '4px' }}><strong>Deliver to:</strong> {createdOrder.shippingAddress.name}</div>
            <div style={{ marginBottom: '8px' }}><strong>Address:</strong> {createdOrder.shippingAddress.streetAddress}, {createdOrder.shippingAddress.locality}, {createdOrder.shippingAddress.city} - {createdOrder.shippingAddress.pincode}</div>
            <div style={{ marginBottom: '4px', color: '#059669', fontWeight: '500' }}><strong>Estimated Arrival:</strong> Next-day shipping</div>
            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #eee' }}><strong>Payment Mode:</strong> {createdOrder.paymentMethod}</div>
            <div style={{ fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px', fontSize: '16px' }}>Paid Amount: ₹{(createdOrder.totalPrice || 0).toLocaleString('en-IN')}</div>
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

          <div className="checkout-btn-group" style={{ width: '100%', maxWidth: '550px', marginTop: '16px' }}>
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
