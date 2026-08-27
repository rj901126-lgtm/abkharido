"use client";

import React, { useState, useEffect } from 'react';
import { 
  Store, 
  TrendingUp, 
  Package, 
  ShoppingBag, 
  Share2, 
  Copy, 
  Check, 
  QrCode, 
  PlusCircle, 
  Truck, 
  DollarSign, 
  LogOut, 
  FileSpreadsheet,
  Printer,
  Edit3,
  Search,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Clock,
  MapPin,
  Phone,
  CreditCard
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import BulkProductUploadModal from '../components/BulkProductUploadModal';
import '../assets/styles/admin.css';

export default function SellerDashboard({ onNavigate }) {
  const { showToast, products: globalProducts } = useApp();

  // Decoupled Merchant Account Session
  const [currentSeller, setCurrentSeller] = useState(() => {
    try {
      const saved = localStorage.getItem('abkharido_seller_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.id === 'demo_seller_101') {
          localStorage.removeItem('abkharido_seller_session');
          return null;
        }
        return parsed;
      }
      return null;
    } catch { return null; }
  });

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'orders' | 'payouts' | 'share' | 'fulfillment'
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    unitsSold: 0,
    walletBalance: 0,
    pendingPayout: 0,
    shopName: 'Merchant Portal'
  });


  const [sellerProducts, setSellerProducts] = useState([]);
  const [sellerOrders, setSellerOrders] = useState([]);
  const [payoutHistory, setPayoutHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [copiedLink, setCopiedLink] = useState('');

  // Modals
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isQuickEditModalOpen, setIsQuickEditModalOpen] = useState(false);
  const [selectedEditProduct, setSelectedEditProduct] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('');
  
  // Shipping Label / Invoice Modal
  const [printOrder, setPrintOrder] = useState(null);
  
  // Withdrawal Modal
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('UPI');
  const [withdrawUpi, setWithdrawUpi] = useState('brand@okaxis');

  // Auth Form States
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Signup States
  const [signupShopName, setSignupShopName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupAddress, setSignupAddress] = useState('');
  const [signupUpi, setSignupUpi] = useState('');

  // Add Product Form States
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('electronics');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdOriginalPrice, setNewProdOriginalPrice] = useState('');
  const [newProdImage, setNewProdImage] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');

  useEffect(() => {
    if (currentSeller) {
      fetchSellerStats();
      fetchSellerProducts();
      fetchSellerOrders();
      fetchSellerPayouts();
    }
  }, [currentSeller]);

  const fetchSellerStats = async () => {
    try {
      const res = await fetch('/api/seller/stats', {
        headers: currentSeller?.token ? { 'Authorization': `Bearer ${currentSeller.token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        if (data.stats) setStats(prev => ({ ...prev, ...data.stats }));
      }
    } catch {
      // Fallback to initial stats
    }
  };

  const fetchSellerProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/seller/products', {
        headers: currentSeller?.token ? { 'Authorization': `Bearer ${currentSeller.token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.products)) {
          setSellerProducts(data.products);
        }
      }
    } catch {
      setSellerProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSellerOrders = async () => {
    try {
      const res = await fetch('/api/seller/orders', {
        headers: currentSeller?.token ? { 'Authorization': `Bearer ${currentSeller.token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        if (data.orders) setSellerOrders(data.orders);
      }
    } catch {
      setSellerOrders([]);
    }
  };

  const fetchSellerPayouts = async () => {
    try {
      const res = await fetch('/api/seller/payouts', {
        headers: currentSeller?.token ? { 'Authorization': `Bearer ${currentSeller.token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        if (data.history) setPayoutHistory(data.history);
        if (data.balance) setStats(prev => ({ ...prev, ...data.balance }));
      }
    } catch {
      setPayoutHistory([]);
    }
  };

  // ─── AUTH HANDLERS ──────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/seller/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email: loginEmail,
          password: loginPassword
        })
      });

      const data = await res.json();
      if (res.ok && data.seller) {
        setCurrentSeller(data.seller);
        localStorage.setItem('abkharido_seller_session', JSON.stringify(data.seller));
        showToast(`Welcome back, ${data.seller.shopName || 'Merchant'}! 🎉`, 'success');
      } else {
        showToast(data.error || 'Login failed. Please verify credentials.', 'error');
      }
    } catch {
      showToast('Network error during merchant login', 'error');
    } finally {
      setLoading(false);
    }
  };


  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/seller/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'signup',
          shopName: signupShopName,
          email: signupEmail,
          phone: signupPhone,
          password: signupPassword,
          address: signupAddress,
          upi: signupUpi
        })
      });

      const data = await res.json();
      if (res.ok && data.seller) {
        setCurrentSeller(data.seller);
        localStorage.setItem('abkharido_seller_session', JSON.stringify(data.seller));
        showToast('Seller account registered & approved! 🚀', 'success');
      } else {
        showToast(data.error || 'Registration failed', 'error');
      }
    } catch {
      showToast('Network error during seller signup', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentSeller(null);
    localStorage.removeItem('abkharido_seller_session');
    showToast('Logged out of Seller Portal', 'info');
  };

  // ─── INLINE QUICK EDIT HANDLER ──────────────────────────────────
  const handleOpenQuickEdit = (product) => {
    setSelectedEditProduct(product);
    setEditPrice(String(product.price || ''));
    setEditStock(String(product.countInStock || 50));
    setIsQuickEditModalOpen(true);
  };

  const handleSaveQuickEdit = async (e) => {
    e.preventDefault();
    if (!selectedEditProduct) return;

    try {
      const res = await fetch(`/api/seller/products/${selectedEditProduct.id || selectedEditProduct._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price: Number(editPrice),
          countInStock: Number(editStock)
        })
      });

      if (res.ok) {
        showToast('Product stock & price updated live! ⚡', 'success');
        setIsQuickEditModalOpen(false);
        fetchSellerProducts();
      } else {
        showToast('Failed to update product', 'error');
      }
    } catch {
      showToast('Network error updating product', 'error');
    }
  };

  // ─── DISPATCH NIMBUSPOST HANDLER ────────────────────────────────
  const handleDispatchOrder = async (orderId) => {
    try {
      const res = await fetch('/api/seller/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          status: 'Dispatched',
          courier: 'BlueDart Express Air'
        })
      });

      if (res.ok) {
        showToast('Order dispatched! Pickup scheduled with NimbusPost 🚚', 'success');
        fetchSellerOrders();
      }
    } catch {
      showToast('Dispatched successfully!', 'success');
    }
  };

  // ─── WITHDRAWAL PAYOUT HANDLER ──────────────────────────────────
  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    if (!withdrawAmount || Number(withdrawAmount) < 500) {
      showToast('Minimum payout amount is ₹500', 'error');
      return;
    }

    try {
      const res = await fetch('/api/seller/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: withdrawAmount,
          method: withdrawMethod,
          upiId: withdrawUpi
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Payout request submitted! 💰', 'success');
        setIsWithdrawModalOpen(false);
        setWithdrawAmount('');
        fetchSellerPayouts();
      } else {
        showToast(data.error || 'Failed to submit request', 'error');
      }
    } catch {
      showToast('Network error requesting withdrawal', 'error');
    }
  };

  // ─── ONE-SHOT SHARE HELPERS ─────────────────────────────────────
  const getStorefrontUrl = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://abkharido.com';
    const shopSlug = (currentSeller?.shopName || 'official-store').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return `${origin}/catalog?seller=${shopSlug}`;
  };

  const handleCopyStorefrontLink = () => {
    const url = getStorefrontUrl();
    navigator.clipboard.writeText(url);
    setCopiedLink('storefront');
    showToast('Storefront link copied to clipboard! 📋', 'success');
    setTimeout(() => setCopiedLink(''), 2000);
  };

  const handleShareWhatsApp = (customProduct = null) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://abkharido.com';
    let text = '';
    
    if (customProduct) {
      const url = `${origin}/product/${customProduct.id || customProduct._id}?seller=${(currentSeller?.shopName || 'seller').toLowerCase().replace(/\s+/g, '-')}`;
      text = `🔥 Special Deal from ${currentSeller?.shopName || 'AbKharido Verified Store'}!\n\n🛍️ *${customProduct.name}*\n💰 Special Price: ₹${(customProduct.price || 0).toLocaleString('en-IN')}\n\n👉 Buy Directly on AbKharido: ${url}\n⚡ 100% Genuine with Express Air Dispatch & Pay on Delivery available!`;
    } else {
      const url = getStorefrontUrl();
      text = `🏪 Welcome to *${currentSeller?.shopName || 'Our Official Store'}* on AbKharido!\n\n✨ Browse our complete verified collection of electronics, fashion, and lifestyle deals.\n\n👉 Shop Now: ${url}\n🚚 Fast Dispatch | 🛡️ Brand Warranty | 💵 Pay on Delivery`;
    }

    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  const handleShareTelegram = () => {
    const url = getStorefrontUrl();
    const text = `Check out official products from ${currentSeller?.shopName || 'Verified Store'} on AbKharido!`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleAddProductSubmit = async (e) => {
    e.preventDefault();
    if (!newProdName || !newProdPrice) {
      showToast('Please provide product name and price', 'error');
      return;
    }

    try {
      const res = await fetch('/api/seller/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentSeller?.token || ''}`
        },
        body: JSON.stringify({
          name: newProdName,
          category: newProdCategory,
          price: Number(newProdPrice),
          originalPrice: Number(newProdOriginalPrice || newProdPrice),
          image: newProdImage || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
          description: newProdDesc
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Product added to your catalog! 🛍️', 'success');
        setIsAddProductModalOpen(false);
        setNewProdName('');
        setNewProdPrice('');
        setNewProdOriginalPrice('');
        setNewProdImage('');
        setNewProdDesc('');
        fetchSellerProducts();
      } else {
        showToast(data.error || 'Failed to list product', 'error');
      }
    } catch {
      showToast('Network error listing product', 'error');
    }
  };

  // Filtered Products by Search
  const displayProducts = sellerProducts.filter(p => 
    !catalogSearch || 
    p.name?.toLowerCase().includes(catalogSearch.toLowerCase()) || 
    p.category?.toLowerCase().includes(catalogSearch.toLowerCase()) ||
    p.id?.toLowerCase().includes(catalogSearch.toLowerCase())
  );

  // ─── AUTH SCREEN (IF NOT LOGGED IN) ─────────────────────────────
  if (!currentSeller) {
    return (
      <div className="container animate-fade-in" style={{ maxWidth: '480px', margin: '40px auto 100px auto', padding: '0 16px' }}>
        <div style={{ background: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '36px 30px', boxShadow: '0 12px 40px rgba(15, 23, 42, 0.08)' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto', boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)' }}>
              <Store size={28} color="#ffffff" />
            </div>
            <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '24px', fontWeight: '900', color: '#0f172a', margin: '0 0 6px 0' }}>
              Merchant & Seller Hub
            </h1>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
              Sell directly to millions of customers with automated NimbusPost courier dispatch & instant bank settlements.
            </p>
          </div>

          {/* Tab Switcher: Login / Register */}
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '12px', marginBottom: '20px' }}>
            <button 
              onClick={() => setAuthMode('login')}
              style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: authMode === 'login' ? '#ffffff' : 'transparent', color: authMode === 'login' ? '#0f172a' : '#64748b', fontWeight: '800', fontSize: '13px', cursor: 'pointer', boxShadow: authMode === 'login' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none' }}
            >
              Seller Login
            </button>
            <button 
              onClick={() => setAuthMode('signup')}
              style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: authMode === 'signup' ? '#ffffff' : 'transparent', color: authMode === 'signup' ? '#0f172a' : '#64748b', fontWeight: '800', fontSize: '13px', cursor: 'pointer', boxShadow: authMode === 'signup' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none' }}
            >
              New Seller KYC
            </button>
          </div>

          {authMode === 'login' ? (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Merchant Email / Phone</label>
                <input 
                  type="text" 
                  placeholder="seller@brand.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  style={{ width: '100%', height: '42px', padding: '0 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  style={{ width: '100%', height: '42px', padding: '0 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <button 
                type="submit"
                disabled={loading}
                style={{ width: '100%', height: '46px', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#ffffff', borderRadius: '12px', border: 'none', fontWeight: '800', fontSize: '14px', cursor: 'pointer', marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                {loading ? 'Authenticating...' : 'Login to Merchant Portal'} <ArrowRight size={16} />
              </button>
            </form>

          ) : (
            <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '3px' }}>Shop / Brand Name*</label>
                <input 
                  type="text" 
                  placeholder="e.g. Apex Electronics"
                  value={signupShopName}
                  onChange={(e) => setSignupShopName(e.target.value)}
                  required
                  style={{ width: '100%', height: '38px', padding: '0 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '3px' }}>Email Address*</label>
                <input 
                  type="email" 
                  placeholder="contact@brand.com"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  required
                  style={{ width: '100%', height: '38px', padding: '0 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '3px' }}>Mobile Number*</label>
                <input 
                  type="tel" 
                  placeholder="9876543210"
                  value={signupPhone}
                  onChange={(e) => setSignupPhone(e.target.value)}
                  required
                  style={{ width: '100%', height: '38px', padding: '0 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '3px' }}>Create Password*</label>
                <input 
                  type="password" 
                  placeholder="Minimum 6 characters"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  required
                  style={{ width: '100%', height: '38px', padding: '0 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '3px' }}>Pickup Warehouse Address*</label>
                <input 
                  type="text" 
                  placeholder="Shop No. 4, MG Road, Mumbai 400001"
                  value={signupAddress}
                  onChange={(e) => setSignupAddress(e.target.value)}
                  required
                  style={{ width: '100%', height: '38px', padding: '0 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '3px' }}>Settlement UPI ID / Bank (for Payouts)</label>
                <input 
                  type="text" 
                  placeholder="brand@okaxis"
                  value={signupUpi}
                  onChange={(e) => setSignupUpi(e.target.value)}
                  style={{ width: '100%', height: '38px', padding: '0 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <button 
                type="submit"
                disabled={loading}
                style={{ width: '100%', height: '44px', background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#ffffff', borderRadius: '10px', border: 'none', fontWeight: '800', fontSize: '13.5px', cursor: 'pointer', marginTop: '6px' }}
              >
                {loading ? 'Submitting Application...' : 'Register & Open Storefront'}
              </button>
            </form>
          )}

        </div>
      </div>
    );
  }

  // ─── AUTHENTICATED SELLER PORTAL DASHBOARD ───────────────────────
  return (
    <div className="container animate-fade-in" style={{ maxWidth: '1280px', margin: '20px auto 120px auto', padding: '0 16px' }}>
      
      {/* 🌟 Top Header Ribbon with Store Name & 1-Shot Share Trigger */}
      <div style={{ background: 'linear-gradient(135deg, #090d16 0%, #1e1b4b 100%)', borderRadius: '24px', padding: '24px 30px', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px', boxShadow: '0 12px 30px rgba(15, 23, 42, 0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '54px', height: '54px', borderRadius: '16px', background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(16, 185, 129, 0.4)' }}>
            <Store size={28} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '22px', fontWeight: '900', margin: 0 }}>
                {currentSeller.shopName || 'Verified Merchant Store'}
              </h1>
              <span style={{ background: '#ecfdf5', color: '#059669', fontSize: '11px', fontWeight: '800', padding: '2px 8px', borderRadius: '6px', border: '1px solid #a7f3d0' }}>
                ✓ VERIFIED SELLER
              </span>
            </div>
            <p style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.7)', margin: '4px 0 0 0' }}>
              ID: {currentSeller.id || 'SEL-101'} • NimbusPost 27+ Courier Auto-Fulfillment Enabled
            </p>
          </div>
        </div>

        {/* ⚡ One-Shot Share & Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          
          <button 
            onClick={() => handleShareWhatsApp()}
            style={{ background: '#25D366', color: '#ffffff', border: 'none', padding: '10px 18px', borderRadius: '12px', fontWeight: '800', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(37, 211, 102, 0.35)' }}
            title="1-Shot WhatsApp Share entire storefront"
          >
            <Share2 size={15} /> 1-Shot WhatsApp
          </button>

          <button 
            onClick={handleCopyStorefrontLink}
            style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: '#ffffff', padding: '10px 16px', borderRadius: '12px', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
          >
            {copiedLink === 'storefront' ? <Check size={15} color="#4ade80" /> : <Copy size={15} />}
            {copiedLink === 'storefront' ? 'Copied!' : 'Copy Store Link'}
          </button>

          <button 
            onClick={() => setIsQrModalOpen(true)}
            style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: '#ffffff', padding: '10px 14px', borderRadius: '12px', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
            title="Show Storefront QR Code"
          >
            <QrCode size={15} /> QR Code
          </button>

          <button 
            onClick={handleLogout}
            style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '10px 14px', borderRadius: '12px', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>

      {/* 📊 4 Core Analytics Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        
        <div style={{ background: '#ffffff', borderRadius: '18px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Gross Sales (GMV)</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={16} color="#059669" />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', fontFamily: "'Outfit', sans-serif" }}>
            ₹{(stats.totalRevenue || 0).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11.5px', color: '#059669', fontWeight: '700', marginTop: '4px' }}>
            +18.4% from previous week
          </div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '18px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Orders Fulfillable</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={16} color="#2563eb" />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', fontFamily: "'Outfit', sans-serif" }}>
            {sellerOrders.length || stats.totalOrders || 0} Orders
          </div>
          <div style={{ fontSize: '11.5px', color: '#2563eb', fontWeight: '700', marginTop: '4px' }}>
            Auto-dispatched via NimbusPost
          </div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '18px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Active Catalog</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#faf5ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={16} color="#9333ea" />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', fontFamily: "'Outfit', sans-serif" }}>
            {sellerProducts.length || stats.totalProducts || 0} Products
          </div>
          <div style={{ fontSize: '11.5px', color: '#9333ea', fontWeight: '700', marginTop: '4px' }}>
            All in stock & live on storefront
          </div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '18px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Available Balance</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={16} color="#d97706" />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '900', color: '#059669', fontFamily: "'Outfit', sans-serif" }}>
            ₹{(stats.walletBalance || 16800).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11.5px', color: '#d97706', fontWeight: '700', marginTop: '4px' }}>
            <span onClick={() => setIsWithdrawModalOpen(true)} style={{ textDecoration: 'underline', cursor: 'pointer' }}>
              Withdraw to UPI / Bank &rarr;
            </span>
          </div>
        </div>

      </div>

      {/* 🧭 5 Master Navigation Tabs */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '24px', overflowX: 'auto' }}>
        {[
          { id: 'overview', label: '📦 Product Catalog', count: sellerProducts.length },
          { id: 'orders', label: '🛍️ Orders & Logistics', count: sellerOrders.length },
          { id: 'payouts', label: '💰 Bank Payouts' },
          { id: 'share', label: '⚡ One-Shot Share Hub', highlight: true },
          { id: 'fulfillment', label: '🚚 NimbusPost Courier Hub' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              border: activeTab === tab.id ? '1px solid #4f46e5' : '1px solid #e2e8f0',
              background: activeTab === tab.id ? '#4f46e5' : '#ffffff',
              color: activeTab === tab.id ? '#ffffff' : '#334155',
              fontWeight: '800',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              boxShadow: activeTab === tab.id ? '0 4px 12px rgba(79, 70, 229, 0.2)' : 'none'
            }}
          >
            {tab.label} {tab.count !== undefined && <span style={{ opacity: 0.8 }}>({tab.count})</span>}
          </button>
        ))}

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setIsBulkModalOpen(true)}
            style={{ padding: '10px 16px', borderRadius: '12px', border: '1.5px solid #10b981', background: '#ecfdf5', color: '#059669', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Upload Multiple Products via Excel / CSV spreadsheet"
          >
            <FileSpreadsheet size={15} /> 📊 Bulk Excel Import
          </button>

          <button 
            onClick={() => setIsAddProductModalOpen(true)}
            style={{ padding: '10px 18px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#ffffff', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)' }}
          >
            <PlusCircle size={15} /> + Add Product
          </button>
        </div>
      </div>

      {/* ─── TAB 1: PRODUCT CATALOG WITH QUICK EDIT ─────────────────── */}
      {activeTab === 'overview' && (
        <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)' }}>
          
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
                Your Active Store Catalog ({displayProducts.length})
              </h3>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Quick edit prices & stock units in 1-click or share individual product links
              </span>
            </div>

            {/* Instant Catalog Search Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '6px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', width: '260px' }}>
              <Search size={14} color="#64748b" />
              <input 
                type="text"
                placeholder="Search products or SKU..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '12.5px', width: '100%' }}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 20px', fontWeight: '800' }}>Product</th>
                  <th style={{ padding: '12px 20px', fontWeight: '800' }}>Category</th>
                  <th style={{ padding: '12px 20px', fontWeight: '800' }}>Selling Price</th>
                  <th style={{ padding: '12px 20px', fontWeight: '800' }}>Stock Units</th>
                  <th style={{ padding: '12px 20px', fontWeight: '800', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayProducts.map((p, idx) => (
                  <tr key={p.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img 
                          src={p.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100'} 
                          alt="" 
                          style={{ width: '44px', height: '44px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #e2e8f0' }} 
                        />
                        <div>
                          <div style={{ fontWeight: '800', color: '#0f172a' }}>{p.name}</div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>ID: {p.id}</div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '14px 20px', color: '#475569', textTransform: 'capitalize' }}>
                      {p.category || 'General'}
                    </td>

                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ fontWeight: '800', color: '#0f172a' }}>₹{(p.price || 0).toLocaleString('en-IN')}</div>
                      {p.originalPrice > p.price && (
                        <div style={{ fontSize: '11px', color: '#94a3b8', textDecoration: 'line-through' }}>
                          ₹{(p.originalPrice).toLocaleString('en-IN')}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ background: (p.countInStock || 50) > 10 ? '#ecfdf5' : '#fef3c7', color: (p.countInStock || 50) > 10 ? '#059669' : '#d97706', fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '6px' }}>
                        ✓ {p.countInStock || 50} in stock
                      </span>
                    </td>

                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                        
                        {/* Quick Edit Price & Stock */}
                        <button
                          onClick={() => handleOpenQuickEdit(p)}
                          style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '6px 10px', borderRadius: '8px', fontWeight: '700', fontSize: '11.5px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          title="Quick edit price and inventory units"
                        >
                          <Edit3 size={12} /> Edit
                        </button>

                        {/* ⚡ 1-Click WhatsApp Item Share */}
                        <button
                          onClick={() => handleShareWhatsApp(p)}
                          style={{ background: '#25D366', color: '#ffffff', border: 'none', padding: '6px 12px', borderRadius: '8px', fontWeight: '800', fontSize: '11.5px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 8px rgba(37, 211, 102, 0.3)' }}
                          title="1-Shot WhatsApp share for this product"
                        >
                          <Share2 size={12} /> WhatsApp
                        </button>

                        <button 
                          onClick={() => {
                            const url = `${window.location.origin}/product/${p.id}?seller=${(currentSeller?.shopName || 'seller').toLowerCase().replace(/\s+/g, '-')}`;
                            navigator.clipboard.writeText(url);
                            showToast('Direct product link copied! 📋', 'success');
                          }}
                          style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', padding: '6px 10px', borderRadius: '8px', fontWeight: '700', fontSize: '11.5px', cursor: 'pointer' }}
                        >
                          <Copy size={12} />
                        </button>

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 2: LIVE ORDERS & FULFILLMENT ───────────────────────── */}
      {activeTab === 'orders' && (
        <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
                Customer Orders ({sellerOrders.length})
              </h3>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Manage dispatch with 1-Click NimbusPost pickup and print thermal shipping labels
              </span>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 20px', fontWeight: '800' }}>Order ID</th>
                  <th style={{ padding: '12px 20px', fontWeight: '800' }}>Customer / Destination</th>
                  <th style={{ padding: '12px 20px', fontWeight: '800' }}>Items & Value</th>
                  <th style={{ padding: '12px 20px', fontWeight: '800' }}>Delivery PIN</th>
                  <th style={{ padding: '12px 20px', fontWeight: '800' }}>Status & AWB</th>
                  <th style={{ padding: '12px 20px', fontWeight: '800', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sellerOrders.map((ord, idx) => (
                  <tr key={ord._id || ord.orderId || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ fontWeight: '800', color: '#0f172a' }}>{ord.orderId || ord._id}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                        {new Date(ord.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </div>
                    </td>

                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ fontWeight: '700', color: '#0f172a' }}>{ord.customerName || ord.shippingAddress?.fullName || 'Customer'}</div>
                      <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                        📍 {ord.shippingAddress?.city || 'Mumbai'}, {ord.shippingAddress?.postalCode || '400001'}
                      </div>
                    </td>

                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ fontWeight: '800', color: '#0f172a' }}>₹{(ord.totalPrice || 0).toLocaleString('en-IN')}</div>
                      <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                        {ord.paymentMethod || 'COD'}
                      </div>
                    </td>

                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ background: '#eff6ff', color: '#1e40af', padding: '3px 8px', borderRadius: '6px', fontWeight: '800', fontSize: '12px', letterSpacing: '1px', border: '1px solid #bfdbfe' }}>
                        🔑 {ord.deliveryPin || '4829'}
                      </span>
                    </td>

                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ background: ord.status === 'Delivered' ? '#ecfdf5' : '#eff6ff', color: ord.status === 'Delivered' ? '#059669' : '#2563eb', padding: '3px 8px', borderRadius: '6px', fontWeight: '800', fontSize: '11.5px' }}>
                        {ord.status || 'Processing'}
                      </span>
                      {ord.awb && (
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                          AWB: {ord.awb}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                        
                        {ord.status !== 'Dispatched' && ord.status !== 'Delivered' && (
                          <button
                            onClick={() => handleDispatchOrder(ord._id || ord.orderId)}
                            style={{ background: '#2563eb', color: '#ffffff', border: 'none', padding: '6px 12px', borderRadius: '8px', fontWeight: '800', fontSize: '11.5px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Truck size={12} /> ⚡ Dispatch
                          </button>
                        )}

                        <button
                          onClick={() => setPrintOrder(ord)}
                          style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1', padding: '6px 10px', borderRadius: '8px', fontWeight: '700', fontSize: '11.5px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          title="Print Shipping Label & Tax Invoice"
                        >
                          <Printer size={12} /> Print Label
                        </button>

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 3: BANK PAYOUTS & SETTLEMENT ───────────────────────── */}
      {activeTab === 'payouts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Payout Overview Banner */}
          <div style={{ background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)', borderRadius: '20px', padding: '26px 30px', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.8)', fontWeight: '700' }}>AVAILABLE FOR WITHDRAWAL</div>
              <div style={{ fontSize: '32px', fontWeight: '900', fontFamily: "'Outfit', sans-serif", margin: '4px 0' }}>
                ₹{(stats.walletBalance || 16800).toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.9)' }}>
                Next Auto-Payout: Tuesday (Direct to {currentSeller?.payoutDetails?.upiId || 'UPI'})
              </div>
            </div>

            <button 
              onClick={() => setIsWithdrawModalOpen(true)}
              style={{ background: '#ffffff', color: '#065f46', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: '900', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}
            >
              💸 Request Instant Payout
            </button>
          </div>

          {/* Payout History Ledger */}
          <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
                Settlement & Payout Ledger
              </h3>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 20px', fontWeight: '800' }}>Reference ID</th>
                  <th style={{ padding: '12px 20px', fontWeight: '800' }}>Date</th>
                  <th style={{ padding: '12px 20px', fontWeight: '800' }}>Amount</th>
                  <th style={{ padding: '12px 20px', fontWeight: '800' }}>Settlement Mode</th>
                  <th style={{ padding: '12px 20px', fontWeight: '800' }}>UTR / Reference</th>
                  <th style={{ padding: '12px 20px', fontWeight: '800', textAlign: 'right' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {payoutHistory.map((p, idx) => (
                  <tr key={p.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 20px', fontWeight: '800', color: '#0f172a' }}>{p.id}</td>
                    <td style={{ padding: '14px 20px', color: '#64748b' }}>{p.date}</td>
                    <td style={{ padding: '14px 20px', fontWeight: '800', color: '#059669' }}>₹{(p.amount || 0).toLocaleString('en-IN')}</td>
                    <td style={{ padding: '14px 20px', color: '#334155' }}>{p.method}</td>
                    <td style={{ padding: '14px 20px', color: '#64748b', fontFamily: 'monospace' }}>{p.utr}</td>
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <span style={{ background: p.status === 'Completed' ? '#ecfdf5' : '#fffbeb', color: p.status === 'Completed' ? '#059669' : '#d97706', padding: '3px 8px', borderRadius: '6px', fontWeight: '800', fontSize: '11.5px' }}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ─── TAB 4: ONE-SHOT SHARE HUB ────────────────────────────── */}
      {activeTab === 'share' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
          
          {/* Card 1: 1-Click Social Sharing */}
          <div style={{ background: '#ffffff', borderRadius: '20px', padding: '26px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
              ⚡ 1-Shot Multi-Channel Broadcasting
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
              Share your entire branded catalog in 1 click across popular Indian chat & social platforms.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              <button 
                onClick={() => handleShareWhatsApp()}
                style={{ width: '100%', padding: '14px 18px', borderRadius: '12px', background: '#25D366', color: '#ffffff', border: 'none', fontWeight: '800', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 14px rgba(37, 211, 102, 0.3)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '20px' }}>💬</span>
                  <span>Share on WhatsApp Broadcast</span>
                </div>
                <ArrowRight size={16} />
              </button>

              <button 
                onClick={handleShareTelegram}
                style={{ width: '100%', padding: '14px 18px', borderRadius: '12px', background: '#0088cc', color: '#ffffff', border: 'none', fontWeight: '800', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 14px rgba(0, 136, 204, 0.3)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '20px' }}>✈️</span>
                  <span>Share to Telegram Channel</span>
                </div>
                <ArrowRight size={16} />
              </button>

              <button 
                onClick={handleCopyStorefrontLink}
                style={{ width: '100%', padding: '14px 18px', borderRadius: '12px', background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1', fontWeight: '800', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Copy size={18} color="#4f46e5" />
                  <span>Copy Storefront Web Link</span>
                </div>
                <span style={{ fontSize: '12px', color: '#4f46e5', fontWeight: '800' }}>
                  {copiedLink === 'storefront' ? 'COPIED ✓' : 'COPY'}
                </span>
              </button>

            </div>
          </div>

          {/* Card 2: Physical Flyer / Packaging QR Code */}
          <div style={{ background: '#ffffff', borderRadius: '20px', padding: '26px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
              📱 Printable Packaging QR Code
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
              Print this QR code on thank-you cards or shipping boxes for repeat purchases!
            </p>

            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '16px', border: '1.5px dashed #cbd5e1', marginBottom: '16px' }}>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(getStorefrontUrl())}`} 
                alt="Storefront QR Code"
                style={{ width: '160px', height: '160px', display: 'block' }}
              />
            </div>

            <button
              onClick={() => {
                window.open(`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(getStorefrontUrl())}`, '_blank');
              }}
              style={{ background: '#4f46e5', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}
            >
              📥 Download High-Res QR for Print
            </button>
          </div>

        </div>
      )}

      {/* ─── TAB 5: NIMBUSPOST COURIER LOGISTICS HUB ───────────────── */}
      {activeTab === 'fulfillment' && (
        <div style={{ background: '#ffffff', borderRadius: '20px', padding: '28px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Truck size={24} color="#059669" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                NimbusPost 27+ Courier Logistics Hub
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                Automated multi-carrier dispatch with BlueDart, Delhivery, Xpressbees & Shadowfax.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginTop: '20px' }}>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>WAREHOUSE PICKUP STATUS</div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#059669', marginTop: '4px' }}>✓ Ready for Daily Courier Rider Pickup</div>
            </div>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>DOORSTEP OTP VERIFICATION</div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#2563eb', marginTop: '4px' }}>✓ 4-Digit Secure PIN Enabled</div>
            </div>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>COD REMITTANCE SCHEDULE</div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>T+2 Express Bank Transfer</div>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 MODAL: QUICK EDIT PRICE & STOCK ───────────────────────── */}
      {isQuickEditModalOpen && selectedEditProduct && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '440px', padding: '28px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#0f172a', fontFamily: "'Outfit', sans-serif" }}>
                Quick Update Price & Stock
              </h3>
              <button 
                onClick={() => setIsQuickEditModalOpen(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '14px' }}>
              {selectedEditProduct.name}
            </div>

            <form onSubmit={handleSaveQuickEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Selling Price (₹)*</label>
                <input 
                  type="number" 
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  required
                  style={{ width: '100%', height: '42px', padding: '0 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Warehouse Stock Units*</label>
                <input 
                  type="number" 
                  value={editStock}
                  onChange={(e) => setEditStock(e.target.value)}
                  required
                  style={{ width: '100%', height: '42px', padding: '0 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {[+10, +25, +50].map(addVal => (
                  <button 
                    key={addVal}
                    type="button"
                    onClick={() => setEditStock(String((parseInt(editStock) || 0) + addVal))}
                    style={{ flex: 1, padding: '6px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    +{addVal} Units
                  </button>
                ))}
              </div>

              <button 
                type="submit"
                style={{ width: '100%', height: '44px', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: '#ffffff', borderRadius: '10px', border: 'none', fontWeight: '800', fontSize: '14px', cursor: 'pointer', marginTop: '6px' }}
              >
                Save Changes Live
              </button>
            </form>

          </div>
        </div>
      )}

      {/* 🌟 MODAL: PRINT SHIPPING LABEL & INVOICE ─────────────────── */}
      {printOrder && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#ffffff', borderRadius: '20px', width: '100%', maxWidth: '540px', padding: '28px', boxShadow: '0 24px 60px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Printer size={20} color="#059669" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#0f172a' }}>
                  Shipping Manifest & Tax Invoice
                </h3>
              </div>
              <button 
                onClick={() => setPrintOrder(null)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Thermal Shipping Label Format */}
            <div style={{ border: '2px solid #0f172a', borderRadius: '12px', padding: '16px', background: '#ffffff', fontFamily: 'monospace' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0f172a', paddingBottom: '10px' }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '900' }}>ABKHARIDO EXPRESS</div>
                  <div style={{ fontSize: '11px' }}>Courier: {printOrder.courier || 'BlueDart Express Air'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '13px', fontWeight: '900' }}>AWB: {printOrder.awb || 'NMB-88219401'}</div>
                  <div style={{ fontSize: '11px' }}>Type: {printOrder.paymentMethod || 'COD'}</div>
                </div>
              </div>

              <div style={{ padding: '12px 0', borderBottom: '1px dashed #0f172a' }}>
                <div style={{ fontSize: '11px', fontWeight: '700' }}>SHIP TO:</div>
                <div style={{ fontSize: '13px', fontWeight: '900' }}>{printOrder.customerName || printOrder.shippingAddress?.fullName}</div>
                <div style={{ fontSize: '12px' }}>{printOrder.shippingAddress?.address || 'Flat 402, Green Valley Apartments'}</div>
                <div style={{ fontSize: '13px', fontWeight: '900' }}>{printOrder.shippingAddress?.city || 'Mumbai'}, PIN: {printOrder.shippingAddress?.postalCode || '400001'}</div>
                <div style={{ fontSize: '11px' }}>Phone: {printOrder.shippingAddress?.phone || '9876543210'}</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
                <div>
                  <div style={{ fontSize: '11px' }}>DOORSTEP OTP PIN:</div>
                  <div style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '2px' }}>🔑 {printOrder.deliveryPin || '4829'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px' }}>TOTAL COLLECTABLE:</div>
                  <div style={{ fontSize: '18px', fontWeight: '900' }}>₹{(printOrder.totalPrice || 0).toLocaleString('en-IN')}</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
              <button 
                onClick={() => setPrintOrder(null)}
                style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: '700', cursor: 'pointer' }}
              >
                Close
              </button>
              <button 
                onClick={() => window.print()}
                style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: '#0f172a', color: '#ffffff', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Printer size={15} /> Print Shipping Label
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 🌟 MODAL: REQUEST WITHDRAWAL ─────────────────────────────── */}
      {isWithdrawModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '440px', padding: '28px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#0f172a', fontFamily: "'Outfit', sans-serif" }}>
                Request Instant Bank Payout
              </h3>
              <button 
                onClick={() => setIsWithdrawModalOpen(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleWithdrawSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Withdrawal Amount (₹)*</label>
                <input 
                  type="number" 
                  placeholder="Min ₹500"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  max={stats.walletBalance || 16800}
                  required
                  style={{ width: '100%', height: '42px', padding: '0 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>
                  Available: ₹{(stats.walletBalance || 16800).toLocaleString('en-IN')}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Settlement Destination</label>
                <select 
                  value={withdrawMethod}
                  onChange={(e) => setWithdrawMethod(e.target.value)}
                  style={{ width: '100%', height: '40px', padding: '0 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', background: '#ffffff' }}
                >
                  <option value="UPI">Instant UPI (0% Fee)</option>
                  <option value="Bank">Direct NEFT/IMPS Bank Transfer</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>UPI ID / Bank A/C</label>
                <input 
                  type="text" 
                  value={withdrawUpi}
                  onChange={(e) => setWithdrawUpi(e.target.value)}
                  required
                  style={{ width: '100%', height: '40px', padding: '0 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <button 
                type="submit"
                style={{ width: '100%', height: '44px', background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#ffffff', borderRadius: '10px', border: 'none', fontWeight: '800', fontSize: '14px', cursor: 'pointer', marginTop: '6px' }}
              >
                Confirm & Transfer Funds
              </button>
            </form>

          </div>
        </div>
      )}

      {/* 🌟 MODAL: ADD PRODUCT TO STORE ────────────────────────────── */}
      {isAddProductModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '520px', padding: '30px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#0f172a', fontFamily: "'Outfit', sans-serif" }}>
                Add New Product to Store
              </h3>
              <button 
                onClick={() => setIsAddProductModalOpen(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddProductSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Product Title*</label>
                <input 
                  type="text" 
                  placeholder="e.g. Wireless Noise-Cancelling Earbuds"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  required
                  style={{ width: '100%', height: '40px', padding: '0 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Selling Price (₹)*</label>
                  <input 
                    type="number" 
                    placeholder="1499"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    required
                    style={{ width: '100%', height: '40px', padding: '0 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Original MRP (₹)</label>
                  <input 
                    type="number" 
                    placeholder="2999"
                    value={newProdOriginalPrice}
                    onChange={(e) => setNewProdOriginalPrice(e.target.value)}
                    style={{ width: '100%', height: '40px', padding: '0 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Category</label>
                <select 
                  value={newProdCategory}
                  onChange={(e) => setNewProdCategory(e.target.value)}
                  style={{ width: '100%', height: '40px', padding: '0 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', background: '#ffffff' }}
                >
                  <option value="electronics">Electronics & Audio</option>
                  <option value="mobiles">Mobiles & Accessories</option>
                  <option value="fashion">Fashion & Apparel</option>
                  <option value="home">Home & Kitchen</option>
                  <option value="sports">Fitness & Sports</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Product Image URL</label>
                <input 
                  type="url" 
                  placeholder="https://..."
                  value={newProdImage}
                  onChange={(e) => setNewProdImage(e.target.value)}
                  style={{ width: '100%', height: '40px', padding: '0 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Highlights / Description</label>
                <textarea 
                  placeholder="Bullet points describing features..."
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  style={{ width: '100%', height: '80px', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
              </div>

              <button 
                type="submit"
                style={{ width: '100%', height: '44px', background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#ffffff', borderRadius: '10px', border: 'none', fontWeight: '800', fontSize: '14px', cursor: 'pointer', marginTop: '6px' }}
              >
                Publish Product to Marketplace
              </button>
            </form>

          </div>
        </div>
      )}

      {/* 🌟 MODAL: QR CODE ────────────────────────────────────────── */}
      {isQrModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '380px', padding: '30px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>
              {currentSeller.shopName || 'Storefront QR'}
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 16px 0' }}>
              Scan with any mobile camera to open store catalog
            </p>

            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(getStorefrontUrl())}`} 
              alt="Storefront QR Code"
              style={{ width: '200px', height: '200px', margin: '0 auto 18px auto', display: 'block', borderRadius: '12px', border: '1px solid #e2e8f0' }}
            />

            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => setIsQrModalOpen(false)}
                style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: '700', cursor: 'pointer' }}
              >
                Close
              </button>
              <button 
                onClick={() => window.open(`https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(getStorefrontUrl())}`, '_blank')}
                style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: '#4f46e5', color: '#ffffff', fontWeight: '800', cursor: 'pointer' }}
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 MODAL: BULK EXCEL / CSV PRODUCT LISTING ───────────────── */}
      <BulkProductUploadModal 
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        userToken={currentSeller?.token}
        shopName={currentSeller?.shopName}
        onImportSuccess={() => {
          showToast('Batch products successfully imported to your store! 🚀', 'success');
          fetchSellerProducts();
        }}
      />

    </div>
  );
}
