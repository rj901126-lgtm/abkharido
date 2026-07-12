import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { MapPin, ShoppingBag, CreditCard, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

const Checkout = ({ useCoinsDiscount, onNavigate }) => {
  const { cart, currentUser, placeOrder, showToast } = useApp();
  const [step, setStep] = useState(1); // 1: Address, 2: Summary, 3: Payment, 4: Success

  // Form states
  const [address, setAddress] = useState({
    name: currentUser.fullName,
    phone: '9876543210',
    pincode: '560103',
    locality: 'Devarabeesanahalli',
    streetAddress: 'Outer Ring Road, Block B, AbKharido Tower',
    city: 'Bengaluru',
    state: 'Karnataka'
  });

  const [paymentMethod, setPaymentMethod] = useState('cod'); // cod, online
  const [createdOrder, setCreatedOrder] = useState(null);

  // Price calculations
  const itemsPrice = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const deliveryCharge = itemsPrice > 500 ? 0 : 40;
  const coinsDiscount = useCoinsDiscount ? Math.min(currentUser.walletCoins, itemsPrice) : 0;
  const finalAmount = itemsPrice - coinsDiscount + deliveryCharge;

  // Handle Address Submit
  const handleAddressSubmit = (e) => {
    e.preventDefault();
    if (!address.name || !address.phone || !address.pincode || !address.streetAddress) {
      showToast('Please fill out all required shipping fields.', 'error');
      return;
    }
    setStep(2);
  };

  // Handle Payment Submit and Order Placement (Cashfree Integration)
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();

    if (paymentMethod === 'cod') {
      // Direct Cash on Delivery placement
      const orderDetails = await placeOrder(
        address, 
        'Cash on Delivery',
        useCoinsDiscount
      );
      if (orderDetails) {
        setCreatedOrder(orderDetails);
        setStep(4);
        triggerConfetti();
      }
      return;
    }

    // Cashfree PG integration
    try {
      showToast('Initializing Cashfree gateway...', 'info');
      const res = await fetch('/api/payment/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      
      if (data.simulated) {
        // Developer simulated successful checkout
        showToast('Simulated Payment Successful (Developer Mode)!', 'success');
        const orderDetails = await placeOrder(
          address, 
          paymentMethod === 'upi' ? `UPI (Cashfree Sandbox)` : `Card (Cashfree Sandbox)`,
          useCoinsDiscount
        );
        if (orderDetails) {
          setCreatedOrder(orderDetails);
          setStep(4);
          triggerConfetti();
        }
      } else {
        // Real Cashfree integration
        showToast('Launching Cashfree Gateway...', 'success');
        if (window.Cashfree) {
          const isProd = false; // Set true for production
          const cashfree = window.Cashfree({ 
            mode: isProd ? "production" : "sandbox" 
          });
          
          cashfree.checkout({
            paymentSessionId: data.paymentSessionId,
            redirectTarget: "_self" // Redirects to return_url configured in backend
          });
        } else {
          showToast('Cashfree SDK script failed to load.', 'error');
        }
      }
    } catch (err) {
      console.error('Payment checkout failed:', err);
      showToast('Checkout transaction communication error.', 'error');
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

  return (
    <div className="container animate-fade-in" style={{ padding: '24px 0', maxWidth: '800px' }}>
      
      {/* Wizard Step Progress Tracker */}
      {step < 4 && (
        <div style={styles.trackerContainer}>
          <div style={{ ...styles.stepIndicator, ...(step >= 1 ? styles.stepActive : {}) }}>
            <span style={styles.stepNum}>1</span>
            <span>Delivery Address</span>
          </div>
          <div style={styles.stepConnector}></div>
          <div style={{ ...styles.stepIndicator, ...(step >= 2 ? styles.stepActive : {}) }}>
            <span style={styles.stepNum}>2</span>
            <span>Order Summary</span>
          </div>
          <div style={styles.stepConnector}></div>
          <div style={{ ...styles.stepIndicator, ...(step >= 3 ? styles.stepActive : {}) }}>
            <span style={styles.stepNum}>3</span>
            <span>Payment Options</span>
          </div>
        </div>
      )}

      {/* STEP 1: Address Details */}
      {step === 1 && (
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={styles.stepHeader}><MapPin size={20} /> Shipping Address Details</h2>
          <form onSubmit={handleAddressSubmit} style={styles.form}>
            <div style={styles.formRow}>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>Full Name*</label>
                <input 
                  type="text" 
                  value={address.name} 
                  onChange={(e) => setAddress({...address, name: e.target.value})}
                  style={styles.input} 
                  required
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>Mobile Number*</label>
                <input 
                  type="tel" 
                  value={address.phone} 
                  onChange={(e) => setAddress({...address, phone: e.target.value})}
                  style={styles.input} 
                  required
                />
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>Pincode*</label>
                <input 
                  type="text" 
                  value={address.pincode} 
                  onChange={(e) => setAddress({...address, pincode: e.target.value})}
                  style={styles.input} 
                  required
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>Locality/Area*</label>
                <input 
                  type="text" 
                  value={address.locality} 
                  onChange={(e) => setAddress({...address, locality: e.target.value})}
                  style={styles.input} 
                  required
                />
              </div>
            </div>

            <div>
              <label style={styles.label}>Street Address/Flat No.*</label>
              <textarea 
                value={address.streetAddress} 
                onChange={(e) => setAddress({...address, streetAddress: e.target.value})}
                style={{ ...styles.input, height: '80px', resize: 'vertical' }} 
                required
              />
            </div>

            <div style={styles.formRow}>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>City*</label>
                <input 
                  type="text" 
                  value={address.city} 
                  onChange={(e) => setAddress({...address, city: e.target.value})}
                  style={styles.input} 
                  required
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>State*</label>
                <input 
                  type="text" 
                  value={address.state} 
                  onChange={(e) => setAddress({...address, state: e.target.value})}
                  style={styles.input} 
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-accent btn-lg" style={{ marginTop: '12px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
              SAVE AND DELIVER HERE <ArrowRight size={16} />
            </button>
          </form>
        </div>
      )}

      {/* STEP 2: Order Summary Review */}
      {step === 2 && (
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={styles.stepHeader}><ShoppingBag size={20} /> Review Order Items</h2>
          
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
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Qty: {item.quantity} | Subtotal: ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ backgroundColor: '#fafafa', border: '1px solid #e0e0e0', padding: '16px', borderRadius: '4px', marginBottom: '20px' }}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
              <span>Delivery Charges:</span>
              <span>{deliveryCharge > 0 ? `₹${deliveryCharge}` : 'FREE'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '16px', borderTop: '1px solid #e0e0e0', paddingTop: '8px', marginTop: '8px' }}>
              <span>Total Payable Amount:</span>
              <span>₹{finalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setStep(1)}>BACK</button>
            <button className="btn btn-accent" style={{ flex: 2 }} onClick={() => setStep(3)}>PROCEED TO PAYMENT</button>
          </div>
        </div>
      )}

      {/* STEP 3: Payment Selection */}
      {step === 3 && (
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={styles.stepHeader}><CreditCard size={20} /> Select Payment Option</h2>
          <form onSubmit={handlePaymentSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              
              {/* COD */}
              <label style={{ ...styles.paymentOption, ...(paymentMethod === 'cod' ? styles.paymentOptionActive : {}) }}>
                <input 
                  type="radio" 
                  name="payment" 
                  value="cod" 
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  style={{ width: '18px', height: '18px' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', fontSize: '14px' }}>Cash On Delivery (COD)</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Pay with cash or digital scanning during delivery.</div>
                </div>
              </label>

              {/* Cashfree Online Payment Gateway */}
              <label style={{ ...styles.paymentOption, ...(paymentMethod === 'online' ? styles.paymentOptionActive : {}) }}>
                <input 
                  type="radio" 
                  name="payment" 
                  value="online" 
                  checked={paymentMethod === 'online'}
                  onChange={() => setPaymentMethod('online')}
                  style={{ width: '18px', height: '18px' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', fontSize: '14px' }}>Online Payment (UPI, Cards, Netbanking, Wallets)</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Pay securely using UPI, Credit/Debit Cards, Netbanking, or Digital Wallets via Cashfree.</div>
                </div>
              </label>

            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setStep(2)}>BACK</button>
              <button type="submit" className="btn btn-accent" style={{ flex: 2 }}>PLACE ORDER (₹{finalAmount.toLocaleString('en-IN')})</button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 4: Success Screen */}
      {step === 4 && createdOrder && (
        <div className="card" style={{ padding: '40px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'inline-flex', padding: '12px', borderRadius: '50%', backgroundColor: '#e8f5e9', marginBottom: '8px' }}>
            <CheckCircle2 size={56} color="var(--success)" />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--success)' }}>Order Placed Successfully!</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', maxWidth: '500px' }}>
            Thank you for shopping at AbKharido.com! Your order <strong>#{createdOrder.id}</strong> has been received and is being processed for shipping.
          </p>

          <div style={{ backgroundColor: '#fafafa', border: '1px solid #e0e0e0', padding: '16px', borderRadius: '4px', textAlign: 'left', width: '100%', maxWidth: '550px', fontSize: '13px', margin: '8px 0' }}>
            <div style={{ fontWeight: 'bold', borderBottom: '1px solid #eee', paddingBottom: '6px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><ShieldCheck size={16} color="var(--primary-color)" /> Direct Warehousing dispatch</div>
            <div><strong>Deliver to:</strong> {createdOrder.shippingAddress.name}</div>
            <div><strong>Address:</strong> {createdOrder.shippingAddress.streetAddress}, {createdOrder.shippingAddress.locality}, {createdOrder.shippingAddress.city} - {createdOrder.shippingAddress.pincode}</div>
            <div><strong>Estimated Arrival:</strong> Next-day shipping (by tomorrow evening)</div>
            <div style={{ marginTop: '6px' }}><strong>Payment Mode:</strong> {createdOrder.paymentMethod}</div>
            <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', marginTop: '6px' }}>Paid Amount: ₹{createdOrder.finalAmount.toLocaleString('en-IN')}</div>
          </div>

          {/* Post Purchase Referral Boost */}
          <div style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', border: '1px solid #bbf7d0', padding: '16px', borderRadius: '8px', width: '100%', maxWidth: '550px', textAlign: 'center' }}>
            <h4 style={{ fontWeight: 'bold', color: '#166534', fontSize: '14px', marginBottom: '4px' }}>Want to get cash back on your purchase?</h4>
            <p style={{ color: '#166534', fontSize: '12px', marginBottom: '10px' }}>
              Recommend your purchased products to friends or followers. Get up to 3% Coins (as user) or 7% Cash (as creator) on every referral sale!
            </p>
            <button 
              className="btn btn-sm btn-primary" 
              style={{ backgroundColor: '#15803d', border: 'none', fontSize: '12px', padding: '6px 16px' }}
              onClick={() => onNavigate('partner')}
            >
              Get My Referral Links
            </button>
          </div>

          <button className="btn btn-primary" style={{ marginTop: '12px' }} onClick={() => onNavigate('home')}>
            Continue Shopping
          </button>
        </div>
      )}

    </div>
  );
};

const styles = {
  trackerContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    backgroundColor: 'white',
    border: '1px solid var(--border-light)',
    borderRadius: '4px',
    marginBottom: '20px',
    fontSize: '13px',
    fontWeight: '500',
    color: 'var(--text-secondary)',
  },
  stepIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  stepActive: {
    color: 'var(--primary-color)',
    fontWeight: '600',
  },
  stepNum: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: '#eaeaea',
    color: '#333',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: 'bold',
  },
  stepConnector: {
    flex: 1,
    height: '2px',
    backgroundColor: '#eaeaea',
    margin: '0 16px',
  },
  stepHeader: {
    fontSize: '18px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '20px',
    borderBottom: '1px solid var(--border-light)',
    paddingBottom: '12px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  formRow: {
    display: 'flex',
    gap: '16px',
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    marginBottom: '4px',
  },
  input: {
    width: '100%',
    border: '1px solid var(--border-light)',
    borderRadius: '4px',
    padding: '8px 12px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s ease',
    marginBottom: '4px',
  },
  paymentOption: {
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
    border: '1px solid var(--border-light)',
    borderRadius: '4px',
    padding: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  paymentOptionActive: {
    borderColor: 'var(--primary-color)',
    backgroundColor: 'var(--primary-light)',
  },
};

// Quick style injections for the indicator active classes
styles.stepActive.stepNum = {
  ...styles.stepNum,
  backgroundColor: 'var(--primary-color)',
  color: 'white',
};

export default Checkout;
