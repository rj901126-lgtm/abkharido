import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  PlusCircle, 
  Trash2, 
  // eslint-disable-next-line
  Settings, 
  Package, 
  // eslint-disable-next-line
  Image, 
  // eslint-disable-next-line
  Tag, 
  DollarSign, 
  Layers,
  ArrowLeft,
  ArrowRight,
  X,
  FileText,
  Store,
  TrendingUp,
  CreditCard,
  AlertCircle,
  LogOut,
  // eslint-disable-next-line
  Lock,
  CheckCircle2,
  // eslint-disable-next-line
  Mail,
  // eslint-disable-next-line
  Phone
} from 'lucide-react';
import '../assets/styles/admin.css'; // Reuse administrative styling framework

const SellerDashboard = ({ onNavigate }) => {
  const { showToast, products } = useApp();
  
  // Decoupled Merchant Account Session
  const [currentSeller, setCurrentSeller] = useState(() => {
    try {
      const saved = localStorage.getItem('abkharido_seller_session');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'orders' | 'payouts'
  const [sellerOrders, setSellerOrders] = useState([]);
  const [sellerProducts, setSellerProducts] = useState([]);
  // eslint-disable-next-line
  const [loading, setLoading] = useState(false);

  // --- Login / Signup Form Toggle ---
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
  const [regStep, setRegStep] = useState(1); // 1: Email & Password, 2: Business Details
  
  // Signup State fields
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [shopName, setShopName] = useState('');
  const [address, setAddress] = useState('');
  const [upi, setUpi] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');

  // Simulated OTP States
  const [mobileOtpSent, setMobileOtpSent] = useState(false);
  const [mobileOtpInput, setMobileOtpInput] = useState('');
  const [mobileVerified, setMobileVerified] = useState(false);

  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpInput, setEmailOtpInput] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);

  // --- Add Product Form State ---
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('electronics');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [image, setImage] = useState('');
  const [description, setDescription] = useState('');
  const [specs, setSpecs] = useState([
    { key: 'Brand', value: '' },
    { key: 'Model', value: '' }
  ]);
  const [colorModels, setColorModels] = useState([]);

  // Payout request form
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('UPI');

  const fetchSellerData = async () => {
    if (!currentSeller || !currentSeller.isApproved) return;
    setLoading(true);
    try {
      // Fetch seller's products
      const prodRes = await fetch(`/api/seller/products?sellerId=${currentSeller.email}`);
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setSellerProducts(prodData);
      }
      
      // Fetch seller's orders
      const orderRes = await fetch(`/api/seller/orders?sellerId=${currentSeller.email}`);
      if (orderRes.ok) {
        const orderData = await orderRes.json();
        setSellerOrders(orderData);
      }
    } catch (err) {
      console.error('Failed to load seller metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line
    fetchSellerData();
  }, [currentSeller, products]);

  // Sync profile details after payout changes
  const fetchUpdatedSellerProfile = async () => {
    if (!currentSeller) return;
    try {
      const res = await fetch(`/api/sellers`);
      if (res.ok) {
        const sellersList = await res.json();
        const updated = Array.isArray(sellersList) ? sellersList.find(s => s.email === currentSeller.email) : null;
        if (updated) {
          setCurrentSeller(updated);
          localStorage.setItem('abkharido_seller_session', JSON.stringify(updated));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('abkharido_seller_session');
    setCurrentSeller(null);
    setRegStep(1);
    setMobileVerified(false);
    setMobileOtpSent(false);
    setEmailVerified(false);
    setEmailOtpSent(false);
    showToast('Merchant session logged out successfully.', 'info');
  };

  // Simulated OTP helpers
  const handleSendMobileOtp = () => {
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      showToast('Please enter a valid 10-digit mobile number.', 'error');
      return;
    }
    setMobileOtpSent(true);
    showToast('Simulated SMS OTP sent! Enter "123456" to verify.', 'success');
  };

  const handleVerifyMobileOtp = () => {
    if (mobileOtpInput === '123456') {
      setMobileVerified(true);
      setMobileOtpSent(false);
      showToast('Mobile number verified successfully! ✓', 'success');
    } else {
      showToast('Incorrect OTP. Please enter 123456.', 'error');
    }
  };

  const handleSendEmailOtp = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }
    setEmailOtpSent(true);
    showToast('Simulated Email OTP sent! Enter "123456" to verify.', 'success');
  };

  const handleVerifyEmailOtp = () => {
    if (emailOtpInput === '123456') {
      setEmailVerified(true);
      setEmailOtpSent(false);
      showToast('Email verified successfully! ✓', 'success');
    } else {
      showToast('Incorrect OTP. Please enter 123456.', 'error');
    }
  };

  // --- Authentications handlers ---
  const handleAuthSubmit = async (e) => {
    if (e) e.preventDefault();
    
    if (authMode === 'login') {
      if (!email || !password) {
        showToast('Please fill out all fields.', 'error');
        return;
      }
      try {
        const res = await fetch('/api/seller/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        if (res.ok) {
          const data = await res.json();
          setCurrentSeller(data.seller);
          localStorage.setItem('abkharido_seller_session', JSON.stringify(data.seller));
          showToast(`Welcome back, ${data.seller.shopName}!`, 'success');
        } else {
          const err = await res.json();
          showToast(err.error || 'Authentication failed.', 'error');
        }
      // eslint-disable-next-line
      } catch (err) {
        showToast('Fulfillment server lookup error.', 'error');
      }
    } else {
      // Sign up process (Step 2 Submit)
      if (!shopName || !address || !upi) {
        showToast('Please fill out all required business fields.', 'error');
        return;
      }
      try {
        const res = await fetch('/api/seller/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            phone,
            password,
            shopName,
            sellerAddress: address,
            payoutDetails: { upi, bankAccount, bankIfsc }
          })
        });
        if (res.ok) {
          const data = await res.json();
          setCurrentSeller(data.seller);
          localStorage.setItem('abkharido_seller_session', JSON.stringify(data.seller));
          showToast('Merchant account registered successfully!', 'success');
        } else {
          const err = await res.json();
          showToast(err.error || 'Registration failed.', 'error');
        }
      // eslint-disable-next-line
      } catch (err) {
        showToast('Fulfillment server registration error.', 'error');
      }
    }
  };

  const handleStep1Submit = (e) => {
    e.preventDefault();
    if (!phone || !email || !password || !confirmPassword) {
      showToast('Please fill out all fields.', 'error');
      return;
    }
    if (password !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }
    if (!mobileVerified || !emailVerified) {
      showToast('Please verify your Mobile Number and Email using OTP first.', 'error');
      return;
    }
    setRegStep(2);
  };

  // --- Specs rows handlers ---
  const handleAddSpecRow = () => setSpecs([...specs, { key: '', value: '' }]);
  const handleRemoveSpecRow = (idx) => setSpecs(specs.filter((_, i) => i !== idx));
  const handleSpecChange = (idx, field, val) => {
    setSpecs(specs.map((spec, i) => i === idx ? { ...spec, [field]: val } : spec));
  };

  // --- Variations handlers ---
  const handleAddColorModel = () => {
    setColorModels([...colorModels, {
      name: '',
      primaryImage: '',
      imagesInput: '',
      variants: [{ name: '', price: '', originalPrice: '', stock: '10' }]
    }]);
  };
  const handleRemoveColorModel = (colorIdx) => {
    setColorModels(colorModels.filter((_, idx) => idx !== colorIdx));
  };
  const handleColorModelChange = (colorIdx, field, val) => {
    setColorModels(colorModels.map((cm, idx) => idx === colorIdx ? { ...cm, [field]: val } : cm));
  };
  const handleAddVariant = (colorIdx) => {
    setColorModels(colorModels.map((cm, idx) => idx === colorIdx ? {
      ...cm,
      variants: [...cm.variants, { name: '', price: '', originalPrice: '', stock: '10' }]
    } : cm));
  };
  const handleRemoveVariant = (colorIdx, variantIdx) => {
    setColorModels(colorModels.map((cm, idx) => idx === colorIdx ? {
      ...cm,
      variants: cm.variants.filter((_, vIdx) => vIdx !== variantIdx)
    } : cm));
  };
  const handleVariantChange = (colorIdx, variantIdx, field, val) => {
    setColorModels(colorModels.map((cm, idx) => idx === colorIdx ? {
      ...cm,
      variants: cm.variants.map((v, vIdx) => vIdx === variantIdx ? { ...v, [field]: val } : v)
    } : cm));
  };

  // --- Form submission ---
  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    if (!id || !name || !price || !originalPrice || !image || !description) {
      showToast('Please fill out all required fields.', 'error');
      return;
    }

    const cleanSpecs = specs.filter(s => s.key.trim() !== '' && s.value.trim() !== '');

    const cleanColorModels = colorModels.map(cm => {
      const extraImages = cm.imagesInput
        ? cm.imagesInput.split(',').map(url => url.trim()).filter(url => url !== '')
        : [];
      const cleanVariants = cm.variants
        .filter(v => v.name.trim() !== '' && v.price !== '')
        .map(v => {
          const orig = Number(v.originalPrice || v.price || 0);
          const prc = Number(v.price || 0);
          const discountPct = orig > 0 ? Math.round(((orig - prc) / orig) * 100) : 0;
          return {
            name: v.name.trim(),
            price: prc,
            originalPrice: orig,
            discount: discountPct,
            stock: Number(v.stock || 0)
          };
        });

      return {
        name: cm.name.trim(),
        primaryImage: cm.primaryImage.trim(),
        images: [cm.primaryImage.trim(), ...extraImages],
        variants: cleanVariants
      };
    }).filter(cm => cm.name !== '' && cm.primaryImage !== '' && cm.variants.length > 0);

    const newProduct = {
      id: id.toLowerCase().trim().replace(/[\s\W]+/g, '-'),
      name,
      category,
      price: Number(price),
      originalPrice: Number(originalPrice),
      rating: 4.5,
      reviewsCount: 1,
      image,
      description,
      specifications: cleanSpecs,
      influencerCommissionRate: 0.03, // default 3% creator payout
      userCommissionRate: 0.012, // default 1.2% coin reward
      inStock: true,
      colorModels: cleanColorModels.length > 0 ? cleanColorModels : undefined
    };

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-seller-id': currentSeller.email
        },
        body: JSON.stringify(newProduct)
      });
      if (res.ok) {
        showToast(`Product "${name}" added to marketplace!`, 'success');
        setId('');
        setName('');
        setPrice('');
        setOriginalPrice('');
        setImage('');
        setDescription('');
        setSpecs([{ key: 'Brand', value: '' }, { key: 'Model', value: '' }]);
        setColorModels([]);
        fetchSellerData();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to submit product.', 'error');
      }
    // eslint-disable-next-line
    } catch (err) {
      showToast('Network error listing product.', 'error');
    }
  };

  const handleRemoveProduct = async (prodId) => {
    try {
      const res = await fetch(`/api/products/${prodId}`, {
        method: 'DELETE',
        headers: { 'x-seller-id': currentSeller.email }
      });
      if (res.ok) {
        showToast('Product removed successfully.', 'success');
        fetchSellerData();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to remove product.', 'error');
      }
    // eslint-disable-next-line
    } catch (err) {
      showToast('Fulfillment server connection error.', 'error');
    }
  };

  const handleWithdrawal = async (e) => {
    e.preventDefault();
    const amount = Number(withdrawAmount);
    if (!amount || amount <= 0) {
      showToast('Please enter a valid amount.', 'error');
      return;
    }
    if (amount > (currentSeller.walletCash || 0)) {
      showToast('Insufficient withdrawable cash balance.', 'error');
      return;
    }

    try {
      const res = await fetch('/api/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: currentSeller.email,
          amount,
          method: withdrawMethod
        })
      });
      if (res.ok) {
        showToast('Withdrawal request submitted successfully!', 'success');
        setWithdrawAmount('');
        await fetchUpdatedSellerProfile();
      } else {
        const err = await res.json();
        showToast(err.error || 'Payout failed.', 'error');
      }
    // eslint-disable-next-line
    } catch (err) {
      showToast('Network error requesting withdrawal.', 'error');
    }
  };

  // --- Auth Render View ---
  if (!currentSeller) {
    return (
      <div className="container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '32px 16px' }}>
        <div className="admin-panel-card" style={{ width: '100%', maxWidth: '520px', padding: '36px' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)', margin: '0 auto' }}>
              <Store size={24} />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)' }}>Seller Central Portal</h2>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {authMode === 'login' ? 'Access your merchant store manager panel' : 'Register your business on AbKharido Marketplace'}
            </span>
          </div>

          {authMode === 'login' ? (
            /* --- LOGIN FORM --- */
            <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label-txt">Business Email ID*</label>
                <input 
                  type="email" 
                  placeholder="merchant@yourdomain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input-field"
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label-txt">Access Password*</label>
                <input 
                  type="password" 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input-field"
                  required
                />
              </div>

              <button type="submit" className="btn" style={{ height: '44px', backgroundColor: '#2874f0', color: 'white', fontWeight: 'bold', fontSize: '14px', borderRadius: '4px', border: 'none', cursor: 'pointer', marginTop: '8px' }}>
                LOG IN TO SELLER CENTRAL
              </button>

              <div style={{ textAlign: 'center', marginTop: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  New to AbKharido Seller?{' '}
                  <strong style={{ color: '#2874f0', cursor: 'pointer' }} onClick={() => setAuthMode('signup')}>Register Business</strong>
                </span>
              </div>
            </form>
          ) : (
            /* --- SIGNUP MULTI-STEP WIZARD (FLIPKART STYLE) --- */
            <div>
              {/* Steps Progress Indicator */}
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '24px', borderBottom: '1px solid #f0f0f0', paddingBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: regStep === 1 ? 1 : 0.6, borderBottom: regStep === 1 ? '2px solid #2874f0' : 'none', paddingBottom: '8px' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: regStep === 1 ? '#2874f0' : '#4caf50', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold' }}>
                    {regStep > 1 ? '✓' : '1'}
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#333' }}>EMAIL & PASSWORD</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: regStep === 2 ? 1 : 0.6, borderBottom: regStep === 2 ? '2px solid #2874f0' : 'none', paddingBottom: '8px' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: regStep === 2 ? '#2874f0' : '#ccc', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold' }}>
                    2
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#333' }}>BUSINESS DETAILS</span>
                </div>
              </div>

              {/* Step 1 Form */}
              {regStep === 1 && (
                <form onSubmit={handleStep1Submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Phone input with Send OTP */}
                  <div className="form-group" style={{ position: 'relative' }}>
                    <label className="form-label-txt">Enter Mobile Number *</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input 
                        type="tel"
                        placeholder="10-digit phone number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').substring(0, 10))}
                        className="form-input-field"
                        style={{ flex: 1 }}
                        disabled={mobileVerified}
                        required
                      />
                      {mobileVerified ? (
                        <span style={{ color: '#4caf50', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          Verified <CheckCircle2 size={16} />
                        </span>
                      ) : (
                        <button type="button" onClick={handleSendMobileOtp} style={{ color: '#2874f0', background: 'none', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
                          {mobileOtpSent ? 'Resend OTP' : 'Send OTP'}
                        </button>
                      )}
                    </div>
                    {/* Simulated mobile OTP input */}
                    {mobileOtpSent && !mobileVerified && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px', alignItems: 'center', animation: 'fadeIn 0.2s' }}>
                        <input 
                          type="text" 
                          placeholder="Enter 6-digit OTP (123456)" 
                          value={mobileOtpInput}
                          onChange={(e) => setMobileOtpInput(e.target.value)}
                          className="form-input-field"
                          style={{ height: '32px', fontSize: '13px', flex: 1 }}
                        />
                        <button type="button" onClick={handleVerifyMobileOtp} style={{ backgroundColor: '#2874f0', color: 'white', border: 'none', height: '32px', padding: '0 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                          Verify
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Email input with Send OTP */}
                  <div className="form-group">
                    <label className="form-label-txt">Email ID *</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input 
                        type="email"
                        placeholder="business@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="form-input-field"
                        style={{ flex: 1 }}
                        disabled={emailVerified}
                        required
                      />
                      {emailVerified ? (
                        <span style={{ color: '#4caf50', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          Verified <CheckCircle2 size={16} />
                        </span>
                      ) : (
                        <button type="button" onClick={handleSendEmailOtp} style={{ color: '#2874f0', background: 'none', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
                          {emailOtpSent ? 'Resend OTP' : 'Send OTP'}
                        </button>
                      )}
                    </div>
                    {/* Simulated email OTP input */}
                    {emailOtpSent && !emailVerified && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px', alignItems: 'center', animation: 'fadeIn 0.2s' }}>
                        <input 
                          type="text" 
                          placeholder="Enter 6-digit OTP (123456)" 
                          value={emailOtpInput}
                          onChange={(e) => setEmailOtpInput(e.target.value)}
                          className="form-input-field"
                          style={{ height: '32px', fontSize: '13px', flex: 1 }}
                        />
                        <button type="button" onClick={handleVerifyEmailOtp} style={{ backgroundColor: '#2874f0', color: 'white', border: 'none', height: '32px', padding: '0 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                          Verify
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label-txt">Create Password *</label>
                    <input 
                      type="password"
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="form-input-field"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label-txt">Confirm Password *</label>
                    <input 
                      type="password"
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="form-input-field"
                      required
                    />
                  </div>

                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '4px 0 0 0', lineHeight: '1.4' }}>
                    By continuing, I agree to AbKharido's <span style={{ color: '#2874f0' }}>Terms of Use</span> &amp; <span style={{ color: '#2874f0' }}>Privacy Policy</span>
                  </p>

                  <button type="submit" className="btn" style={{ height: '44px', backgroundColor: '#0056b3', color: 'white', fontWeight: 'bold', fontSize: '14px', borderRadius: '4px', border: 'none', cursor: 'pointer', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    Register & Continue <ArrowRight size={16} />
                  </button>

                  <div style={{ textAlign: 'center', marginTop: '8px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      Already have an account?{' '}
                      <strong style={{ color: '#2874f0', cursor: 'pointer' }} onClick={() => setAuthMode('login')}>Log In</strong>
                    </span>
                  </div>
                </form>
              )}

              {/* Step 2 Form */}
              {regStep === 2 && (
                <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label-txt">Registered Business / Shop Name*</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Fashion Point Hub"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      className="form-input-field"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label-txt">Warehouse Address*</label>
                    <textarea 
                      placeholder="Physical office address for shipping pickups..."
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="form-input-field"
                      style={{ height: '50px', resize: 'none' }}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label-txt">Settlement UPI ID*</label>
                    <input 
                      type="text" 
                      placeholder="e.g. shopname@ybl"
                      value={upi}
                      onChange={(e) => setUpi(e.target.value)}
                      className="form-input-field"
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label-txt" style={{ fontSize: '10px' }}>Bank Account Number</label>
                      <input 
                        type="text" 
                        placeholder="Optional"
                        value={bankAccount}
                        onChange={(e) => setBankAccount(e.target.value)}
                        className="form-input-field"
                      />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label-txt" style={{ fontSize: '10px' }}>Bank IFSC Code</label>
                      <input 
                        type="text" 
                        placeholder="Optional"
                        value={bankIfsc}
                        onChange={(e) => setBankIfsc(e.target.value)}
                        className="form-input-field"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button type="button" onClick={() => setRegStep(1)} className="btn btn-outline" style={{ flex: 1, height: '40px' }}>
                      Back to Step 1
                    </button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 2, height: '40px', fontWeight: 'bold' }}>
                      COMPLETE REGISTRATION
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

        </div>
      </div>
    );
  }

  // Verification pending landing
  if (!currentSeller.isApproved) {
    return (
      <div className="container animate-fade-in" style={{ maxWidth: '500px', padding: '60px 20px' }}>
        <div className="admin-panel-card" style={{ textAlign: 'center', padding: '36px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <AlertCircle size={44} color="#ff9800" style={{ margin: '0 auto' }} />
          <h2 style={{ fontSize: '20px', fontWeight: '800' }}>Application Awaiting Approval</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
            Your merchant registration for **"{currentSeller.shopName}"** ({currentSeller.email}) has been recorded. Our warehousing audit team is auditing your details. Please check back soon or ask the administrator to approve your account.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '10px' }}>
            <button className="btn btn-outline" style={{ height: '36px', padding: '0 16px' }} onClick={fetchUpdatedSellerProfile}>
              Refresh Status
            </button>
            <button className="btn btn-sm btn-outline" style={{ height: '36px', borderColor: 'var(--error)', color: 'var(--error)' }} onClick={handleLogout}>
              <LogOut size={14} /> Log Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalSalesVolume = sellerOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);

  return (
    <div className="container admin-container animate-fade-in">
      {/* Header bar */}
      <div className="admin-header">
        <div className="admin-title-area">
          <h1 className="admin-title"><Store size={22} color="var(--primary-color)" /> Seller Central Portal</h1>
          <span className="admin-subtitle">Shop: <strong>{currentSeller.shopName}</strong> ({currentSeller.email}) | Live Merchant Control Panel</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline" style={{ borderColor: 'var(--error)', color: 'var(--error)' }} onClick={handleLogout}>
            <LogOut size={16} /> Log Out
          </button>
          <button className="btn btn-outline" onClick={() => onNavigate('home')}>
            <ArrowLeft size={16} /> Back to Storefront
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: '24px', gap: '16px' }}>
        <div className="admin-panel-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '8px', backgroundColor: '#e8f5e9', color: '#2e7d32', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={20} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total Sales volume</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>₹{totalSalesVolume.toLocaleString('en-IN')}</div>
          </div>
        </div>

        <div className="admin-panel-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '8px', backgroundColor: '#e3f2fd', color: '#1565c0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DollarSign size={20} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Withdrawable Cash</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--success)' }}>₹{(currentSeller.walletCash || 0).toFixed(2)}</div>
          </div>
        </div>

        <div className="admin-panel-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '8px', backgroundColor: '#fff3e0', color: '#ef6c00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={20} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Active Listings</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{sellerProducts.length} Items</div>
          </div>
        </div>

        <div className="admin-panel-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '8px', backgroundColor: '#f3e5f5', color: '#6a1b9a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={20} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Orders received</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{sellerOrders.length} Sales</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid #eaeaea', paddingBottom: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setActiveTab('inventory')}
          className={`btn ${activeTab === 'inventory' ? 'btn-primary' : 'btn-outline'}`}
          style={{ height: '36px', padding: '0 16px', fontSize: '13px', display: 'flex', gap: '6px', alignItems: 'center' }}
        >
          <Package size={16} /> Manage Inventory ({sellerProducts.length})
        </button>
        <button 
          onClick={() => setActiveTab('orders')}
          className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-outline'}`}
          style={{ height: '36px', padding: '0 16px', fontSize: '13px', display: 'flex', gap: '6px', alignItems: 'center' }}
        >
          <FileText size={16} /> Order Listings ({sellerOrders.length})
        </button>
        <button 
          onClick={() => setActiveTab('payouts')}
          className={`btn ${activeTab === 'payouts' ? 'btn-primary' : 'btn-outline'}`}
          style={{ height: '36px', padding: '0 16px', fontSize: '13px', display: 'flex', gap: '6px', alignItems: 'center' }}
        >
          <CreditCard size={16} /> Ledger & Cashouts
        </button>
      </div>

      {/* CONDITIONAL RENDER: INVENTORY TAB */}
      {activeTab === 'inventory' && (
        <div className="admin-grid">
          {/* Left panel: List products */}
          <div className="admin-panel-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 className="admin-form-title"><Package size={18} color="var(--primary-color)" /> My Listed Products</h3>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Preview</th>
                    <th>Name / ID</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sellerProducts.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', color: '#999', padding: '24px' }}>No products listed yet. Use the sidebar form to add items!</td>
                    </tr>
                  ) : (
                    sellerProducts.map(p => (
                      <tr key={p.id}>
                        <td><img src={p.image} alt={p.name} className="admin-prod-thumb" /></td>
                        <td>
                          <div style={{ fontWeight: 'bold' }}>{p.name.substring(0, 32)}...</div>
                          <div style={{ fontSize: '11px', color: '#777' }}>ID: <code>{p.id}</code></div>
                        </td>
                        <td style={{ textTransform: 'capitalize' }}>{p.category}</td>
                        <td>
                          <div style={{ fontWeight: 'bold' }}>₹{p.price.toLocaleString('en-IN')}</div>
                          <div style={{ fontSize: '11px', textDecoration: 'line-through', color: '#999' }}>₹{p.originalPrice.toLocaleString('en-IN')}</div>
                        </td>
                        <td>
                          <button className="admin-action-btn-danger" onClick={() => handleRemoveProduct(p.id)}>
                            <Trash2 size={12} /> Remove
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right panel: Add Product Form */}
          <div className="admin-panel-card">
            <h3 className="admin-form-title"><PlusCircle size={18} color="var(--primary-color)" /> Add Seller Product</h3>
            <form onSubmit={handleSubmitProduct} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label-txt">Product ID (lowercase, unique, no spaces)*</label>
                <input 
                  type="text" 
                  placeholder="e.g. vintage-leather-jacket" 
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  className="form-input-field"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label-txt">Display Name*</label>
                <input 
                  type="text" 
                  placeholder="e.g. Vintage Leather Jacket (Classic Brown)" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input-field"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label-txt">Category*</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="form-input-field">
                  <option value="mobiles">Mobiles</option>
                  <option value="electronics">Electronics</option>
                  <option value="fashion">Fashion</option>
                  <option value="home">Home & Living</option>
                  <option value="appliances">Appliances</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label-txt">Selling Price (₹)*</label>
                  <input 
                    type="number" 
                    placeholder="₹ price" 
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="form-input-field"
                    required
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label-txt">Original Price (₹)*</label>
                  <input 
                    type="number" 
                    placeholder="₹ original" 
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    className="form-input-field"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label-txt">Image URL*</label>
                <input 
                  type="url" 
                  placeholder="https://images.unsplash.com/..." 
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="form-input-field"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label-txt">Description*</label>
                <textarea 
                  placeholder="Tell customers about features..." 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="form-input-field"
                  style={{ height: '70px', resize: 'vertical' }}
                  required
                />
              </div>

              {/* Variations */}
              <div className="form-group" style={{ border: '1px solid #e0e0e0', padding: '12px', borderRadius: '6px', backgroundColor: '#fdfdfd', marginTop: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label className="form-label-txt" style={{ fontWeight: '700', color: '#212121', margin: 0 }}>Colors & Custom Variations</label>
                  <button
                    type="button"
                    onClick={handleAddColorModel}
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: '11px', padding: '4px 8px', height: '28px', display: 'flex', gap: '4px', alignItems: 'center' }}
                  >
                    <PlusCircle size={12} /> Add Color
                  </button>
                </div>
                
                {colorModels.map((cm, colorIdx) => (
                  <div key={colorIdx} style={{ border: '1px dashed #ccc', padding: '12px', borderRadius: '4px', backgroundColor: '#fafafa', position: 'relative', marginBottom: '10px' }}>
                    <button
                      type="button"
                      onClick={() => handleRemoveColorModel(colorIdx)}
                      style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: '#c62828', cursor: 'pointer' }}
                    >
                      <X size={16} />
                    </button>
                    
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--primary-color)', marginBottom: '8px' }}>Color Model #{colorIdx + 1}</div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="Color Name (e.g. Onyx Black)"
                        value={cm.name}
                        onChange={(e) => handleColorModelChange(colorIdx, 'name', e.target.value)}
                        style={{ width: '100%', height: '30px', padding: '0 8px', border: '1px solid #dcdcdc', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box' }}
                        required
                      />
                      <input
                        type="url"
                        placeholder="Primary image url for this color"
                        value={cm.primaryImage}
                        onChange={(e) => handleColorModelChange(colorIdx, 'primaryImage', e.target.value)}
                        style={{ width: '100%', height: '30px', padding: '0 8px', border: '1px solid #dcdcdc', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box' }}
                        required
                      />
                      
                      <div style={{ marginTop: '8px', borderTop: '1px solid #e5e5e5', paddingTop: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 'bold' }}>Variants</span>
                          <button type="button" onClick={() => handleAddVariant(colorIdx)} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '11px', cursor: 'pointer' }}>
                            + Add Size/RAM
                          </button>
                        </div>
                        
                        {cm.variants.map((v, vIdx) => (
                          <div key={vIdx} style={{ display: 'flex', gap: '4px', marginBottom: '4px', alignItems: 'center' }}>
                            <input
                              type="text"
                              placeholder="e.g. Size M"
                              value={v.name}
                              onChange={(e) => handleVariantChange(colorIdx, vIdx, 'name', e.target.value)}
                              style={{ flex: 2, height: '28px', padding: '0 6px', border: '1px solid #dcdcdc', borderRadius: '4px', fontSize: '11px', boxSizing: 'border-box' }}
                              required
                            />
                            <input
                              type="number"
                              placeholder="Price"
                              value={v.price}
                              onChange={(e) => handleVariantChange(colorIdx, vIdx, 'price', e.target.value)}
                              style={{ flex: 1, minWidth: '50px', height: '28px', padding: '0 6px', border: '1px solid #dcdcdc', borderRadius: '4px', fontSize: '11px', boxSizing: 'border-box' }}
                              required
                            />
                            <input
                              type="number"
                              placeholder="Stock"
                              value={v.stock}
                              onChange={(e) => handleVariantChange(colorIdx, vIdx, 'stock', e.target.value)}
                              style={{ width: '45px', height: '28px', padding: '0 6px', border: '1px solid #dcdcdc', borderRadius: '4px', fontSize: '11px', boxSizing: 'border-box' }}
                            />
                            {cm.variants.length > 1 && (
                              <span onClick={() => handleRemoveVariant(colorIdx, vIdx)} style={{ color: '#c62828', cursor: 'pointer', fontSize: '12px', padding: '2px' }}>
                                <Trash2 size={12} />
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Specs */}
              <div className="form-group">
                <label className="form-label-txt">Technical Specifications</label>
                {specs.map((spec, idx) => (
                  <div key={idx} className="spec-builder-row">
                    <input 
                      type="text" 
                      placeholder="Key (e.g. Fabric)" 
                      value={spec.key}
                      onChange={(e) => handleSpecChange(idx, 'key', e.target.value)}
                      className="spec-builder-input"
                    />
                    <input 
                      type="text" 
                      placeholder="Value (e.g. 100% Cotton)" 
                      value={spec.value}
                      onChange={(e) => handleSpecChange(idx, 'value', e.target.value)}
                      className="spec-builder-input"
                    />
                    <span className="spec-remove-btn" onClick={() => handleRemoveSpecRow(idx)}>
                      <X size={16} />
                    </span>
                  </div>
                ))}
                <span className="spec-add-btn" onClick={handleAddSpecRow}>
                  <PlusCircle size={14} /> Add Row
                </span>
              </div>

              <button type="submit" className="btn btn-accent" style={{ marginTop: '12px' }}>
                LIST PRODUCT ON STOREFRONT
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CONDITIONAL RENDER: ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="admin-panel-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 className="admin-form-title"><FileText size={18} color="var(--primary-color)" /> Orders containing my products</h3>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Date</th>
                  <th>My Items Detail</th>
                  <th>Total Earnings</th>
                  <th>Courier Timeline</th>
                  <th>Fulfillment Status</th>
                </tr>
              </thead>
              <tbody>
                {sellerOrders.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: '#999', padding: '24px' }}>No orders containing your products yet.</td>
                  </tr>
                ) : (
                  sellerOrders.map(o => {
                    // Sum seller specific items cost (safely guarding against deleted products/null price values)
                    const sellerTotal = (o.items || []).reduce((sum, item) => sum + ((item.product?.price || 0) * (item.quantity || 1)), 0);
                    return (
                      <tr key={o.id}>
                        <td><code>{o.id}</code></td>
                        <td>{o.date}</td>
                        <td>
                          {(o.items || []).map((item, idx) => (
                            <div key={idx} style={{ fontSize: '12px' }}>
                              • {item.product?.name ? item.product.name.substring(0, 20) : 'Deleted Product'}... (x{item.quantity})
                            </div>
                          ))}
                        </td>
                        <td style={{ fontWeight: 'bold' }}>₹{sellerTotal.toLocaleString('en-IN')}</td>
                        <td style={{ fontSize: '12px' }}>
                          <div>AWB: <code>{o.trackingNumber || 'Pending'}</code></div>
                          <div style={{ color: '#666', fontSize: '11px' }}>Courier: {o.courierPartner || 'Direct'}</div>
                        </td>
                        <td>
                          <span className={`badge ${o.status === 'Delivered' ? 'badge-success' : o.status === 'CANCELLED' ? 'badge-danger' : 'badge-info'}`}>
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONDITIONAL RENDER: PAYOUTS TAB */}
      {activeTab === 'payouts' && (
        <div className="admin-grid">
          {/* Left panel: Withdrawal form */}
          <div className="admin-panel-card">
            <h3 className="admin-form-title"><CreditCard size={18} color="var(--primary-color)" /> Request Cash Withdrawal</h3>
            <div style={{ backgroundColor: '#fcfcfc', border: '1px solid #e0e0e0', padding: '16px', borderRadius: '6px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Registered Shop Name:</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{currentSeller.shopName}</div>
              
              <div style={{ borderTop: '1px solid #e5e5e5', margin: '8px 0' }} />
              
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Payout Destination details:</div>
              <div style={{ fontSize: '13px', fontWeight: '500', color: '#333' }}>
                UPI ID: <code>{currentSeller.payoutDetails?.upi || 'Not Configured'}</code>
              </div>
              <div style={{ fontSize: '11px', color: '#888' }}>
                Bank: {currentSeller.payoutDetails?.bankAccount || 'N/A'} (IFSC: {currentSeller.payoutDetails?.bankIfsc || 'N/A'})
              </div>
            </div>

            <form onSubmit={handleWithdrawal} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label-txt">Amount to Cashout (₹)*</label>
                <input 
                  type="number"
                  placeholder="e.g. 5000"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="form-input-field"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label-txt">Preferred Mode*</label>
                <select value={withdrawMethod} onChange={(e) => setWithdrawMethod(e.target.value)} className="form-input-field">
                  <option value="UPI">Direct UPI Transfer</option>
                  <option value="Bank">IMPS/NEFT Bank Settlement</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '8px' }}>
                SUBMIT CASHOUT REQUEST
              </button>
            </form>
          </div>

          {/* Right panel: Ledger history */}
          <div className="admin-panel-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 className="admin-form-title"><Layers size={18} color="var(--primary-color)" /> Sales Ledger Transactions</h3>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Ref ID</th>
                    <th>Date</th>
                    <th>Item Name</th>
                    <th>Revenue</th>
                    <th>Net Earned</th>
                  </tr>
                </thead>
                <tbody>
                  {!currentSeller.history || currentSeller.history.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', color: '#999', padding: '24px' }}>No transaction history found.</td>
                    </tr>
                  ) : (
                    currentSeller.history.map((tx, idx) => (
                      <tr key={idx}>
                        <td><code>{tx.id.substring(0, 12)}</code></td>
                        <td>{tx.date}</td>
                        <td>{tx.productName?.substring(0, 20)}... (x{tx.quantity})</td>
                        <td>₹{tx.amount.toLocaleString('en-IN')}</td>
                        <td style={{ color: tx.earnings < 0 ? 'var(--error)' : 'var(--success)', fontWeight: 'bold' }}>
                          {tx.earnings < 0 ? '-' : ''}₹{Math.abs(tx.earnings).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerDashboard;
