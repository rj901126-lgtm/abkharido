"use client";

import React, { useState, useEffect, useRef } from 'react';
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
  CreditCard,
  AlertCircle,
  Info,
  ExternalLink,
  HelpCircle,
  Receipt,
  Download
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { lookupPincode } from '../utils/pincodeData.js';
import BulkProductUploadModal from '../components/BulkProductUploadModal';
import WorldClassInvoice from '../components/WorldClassInvoice';
import '../assets/styles/admin.css';

export default function SellerDashboard({ onNavigate }) {
  const { showToast, currentUser } = useApp();
  const invoiceRef = useRef(null);

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

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'orders' | 'payouts' | 'catalog' | 'share'
  const [stats, setStats] = useState({
    totalRevenue: 0,
    deliveredGrossSales: 0,
    netEarnings: 0,
    totalOrders: 0,
    totalProducts: 0,
    unitsSold: 0,
    walletBalance: 0,
    availableBalance: 0,
    pendingPayout: 0,
    shopName: 'Merchant Portal',
    sellerType: 'non_gst',
    gstin: '',
    pan: ''
  });

  const [sellerProducts, setSellerProducts] = useState([]);
  const [sellerOrders, setSellerOrders] = useState([]);
  const [payoutHistory, setPayoutHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [copiedLink, setCopiedLink] = useState('');
  const [orderFilter, setOrderFilter] = useState('all'); // 'all' | 'pending' | 'shipped' | 'delivered'

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
  const [withdrawMethod, setWithdrawMethod] = useState('Bank');
  const [withdrawDestination, setWithdrawDestination] = useState('');

  // ─── AUTH FORM STATES (GST & NON-GST DUAL ONBOARDING) ─────────────
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
  const [signupSellerType, setSignupSellerType] = useState('non_gst'); // 'gst' | 'non_gst'
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Signup Fields
  const [signupShopName, setSignupShopName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupGstin, setSignupGstin] = useState('');
  const [signupPan, setSignupPan] = useState('');
  const [signupEnrolmentId, setSignupEnrolmentId] = useState('');
  const [signupUdyamNumber, setSignupUdyamNumber] = useState('');
  const [certifiedTurnover, setCertifiedTurnover] = useState(true);
  const [signupLegalName, setSignupLegalName] = useState('');
  const [signupStreet, setSignupStreet] = useState('');
  const [signupCity, setSignupCity] = useState('');
  const [signupState, setSignupState] = useState('Maharashtra');
  const [signupPincode, setSignupPincode] = useState('');
  const [signupBankName, setSignupBankName] = useState('');
  const [signupAccountNo, setSignupAccountNo] = useState('');
  const [signupIfsc, setSignupIfsc] = useState('');
  const [signupUpi, setSignupUpi] = useState('');
  const [formError, setFormError] = useState('');
  const [panError, setPanError] = useState('');
  const [gstinError, setGstinError] = useState('');
  const [isExistingCustomerPrompt, setIsExistingCustomerPrompt] = useState(false);

  // Auto-prefill from existing logged-in customer account
  useEffect(() => {
    if (currentUser) {
      if (currentUser.email) {
        setSignupEmail(prev => prev || currentUser.email);
        setLoginEmail(prev => prev || currentUser.email);
      }
      if (currentUser.phone) {
        const p = String(currentUser.phone).replace(/\D/g, '').slice(-10);
        setSignupPhone(prev => prev || p);
        setLoginEmail(prev => prev || p);
      }
      if (currentUser.name || currentUser.fullName) {
        setSignupLegalName(prev => prev || currentUser.name || currentUser.fullName);
      }
    }
  }, [currentUser]);

  const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

  const getPanHolderType = (pan) => {
    if (!pan || pan.length < 4) return 'Indian Tax Identity';
    const char = pan[3];
    switch (char) {
      case 'P': return 'Individual / Proprietorship';
      case 'C': return 'Company / Corporate';
      case 'H': return 'Hindu Undivided Family (HUF)';
      case 'F': return 'Partnership Firm / LLP';
      case 'T': return 'Trust';
      case 'A': return 'Association of Persons (AOP)';
      case 'B': return 'Body of Individuals (BOI)';
      default: return 'Business Entity';
    }
  };

  const handlePanChange = (val) => {
    const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    setSignupPan(clean);
    if (clean.length === 10) {
      if (PAN_REGEX.test(clean)) {
        setPanError('');
      } else {
        setPanError('Invalid format. PAN must have 5 letters, 4 numbers, and 1 letter (e.g. ABCDE1234F).');
      }
    } else if (clean.length > 0) {
      setPanError(`${clean.length}/10 characters entered`);
    } else {
      setPanError('');
    }
  };

  const handleGstinChange = (val) => {
    const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
    setSignupGstin(clean);
    if (clean.length === 15) {
      if (GSTIN_REGEX.test(clean)) {
        setGstinError('');
      } else {
        setGstinError('Invalid GSTIN format (e.g. 27AAPCA1234F1Z5).');
      }
    } else if (clean.length > 0) {
      setGstinError(`${clean.length}/15 characters entered`);
    } else {
      setGstinError('');
    }
  };

  const handlePincodeChange = (val) => {
    const clean = val.replace(/\D/g, '').slice(0, 6);
    setSignupPincode(clean);
    if (clean.length === 6) {
      try {
        const pinInfo = lookupPincode(clean);
        if (pinInfo && pinInfo.city && pinInfo.state) {
          setSignupCity(pinInfo.city);
          setSignupState(pinInfo.state);
        }
      } catch (_) {}
    }
  };

  // Add Product Form States
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('electronics');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdOriginalPrice, setNewProdOriginalPrice] = useState('');
  const [newProdHsn, setNewProdHsn] = useState('8517');
  const [newProdGstRate, setNewProdGstRate] = useState(18);
  const [newProdStock, setNewProdStock] = useState(50);
  const [newProdImage, setNewProdImage] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');

  useEffect(() => {
    if (currentSeller) {
      fetchSellerStats();
      fetchSellerProducts();
      fetchSellerOrders();
      fetchSellerPayouts();
      if (currentSeller.payoutDetails?.bankAccount) {
        setWithdrawDestination(currentSeller.payoutDetails.bankAccount);
      } else if (currentSeller.payoutDetails?.upiId) {
        setWithdrawDestination(currentSeller.payoutDetails.upiId);
      }
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
    } catch {}
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
    setFormError('');
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
      } else if (data.isCustomerAccount) {
        // Customer account found! Help them open their store immediately
        setFormError(data.error);
        if (data.email) setSignupEmail(data.email);
        if (data.phone) setSignupPhone(data.phone);
        if (data.name) setSignupLegalName(data.name);
        setSignupPassword(loginPassword);
        setIsExistingCustomerPrompt(true);
        setAuthMode('signup');
        showToast('AbKharido customer account found. Please register your store name & PAN to start selling.', 'info');
      } else {
        setFormError(data.error || 'Login failed. Please verify credentials.');
        showToast(data.error || 'Login failed. Please verify credentials.', 'error');
      }
    } catch {
      setFormError('Network connection error while contacting server. Please check your internet connection.');
      showToast('Network error during merchant login', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setFormError('');

    const cleanShop = signupShopName.trim();
    if (!cleanShop) {
      setFormError('Please enter your Shop / Brand name.');
      return;
    }

    const cleanPhoneDigits = signupPhone.replace(/\D/g, '').slice(-10);
    if (cleanPhoneDigits.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhoneDigits)) {
      setFormError('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
      return;
    }

    if (signupSellerType === 'non_gst') {
      const cleanPancard = signupPan.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
      if (!cleanPancard || cleanPancard.length !== 10 || !PAN_REGEX.test(cleanPancard)) {
        setFormError('Please enter a valid 10-character Indian PAN Card number (e.g. ABCDE1234F). It must be 5 uppercase letters, 4 numbers, and 1 uppercase letter.');
        return;
      }
    } else {
      const cleanGst = signupGstin.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
      if (!cleanGst || cleanGst.length !== 15 || !GSTIN_REGEX.test(cleanGst)) {
        setFormError('Please enter a valid 15-character Indian GSTIN (e.g. 27AAPCA1234F1Z5).');
        return;
      }
    }

    if (signupPassword.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }

    if (!signupStreet.trim()) {
      setFormError('Please enter your Courier Pickup Warehouse Street / Building Address.');
      return;
    }

    if (!signupPincode || signupPincode.length !== 6) {
      setFormError('Please enter a valid 6-digit warehouse pincode.');
      return;
    }

    if (!certifiedTurnover) {
      setFormError('Please accept the Merchant Terms & Conditions to proceed.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/seller/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'signup',
          sellerType: signupSellerType,
          shopName: cleanShop,
          legalBusinessName: signupLegalName || cleanShop,
          email: signupEmail,
          phone: cleanPhoneDigits,
          password: signupPassword,
          gstin: signupSellerType === 'gst' ? signupGstin : '',
          pan: signupSellerType === 'gst' ? signupGstin.slice(2, 12) : signupPan,
          enrolmentId: signupEnrolmentId,
          udyamNumber: signupUdyamNumber,
          pickupStreet: signupStreet,
          pickupCity: signupCity,
          pickupState: signupState,
          pickupPincode: signupPincode,
          bankName: signupBankName,
          bankAccount: signupAccountNo,
          bankIfsc: signupIfsc,
          upi: signupUpi,
          accountHolderName: signupLegalName || cleanShop
        })
      });

      const data = await res.json();
      if (res.ok && data.seller) {
        setCurrentSeller(data.seller);
        localStorage.setItem('abkharido_seller_session', JSON.stringify(data.seller));
        showToast(data.message || '🎉 Seller account opened successfully!', 'success');
      } else {
        setFormError(data.error || 'Registration failed. Please check your details.');
        showToast(data.error || 'Registration failed', 'error');
      }
    } catch {
      setFormError('Network connection error while contacting server. Please check your internet connection.');
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

  // ─── LOGISTICS DISPATCH & SETTLEMENT ─────────────────────────────
  const handleUpdateOrderStatus = async (orderId, newStatus, courier = 'Delhivery Express') => {
    try {
      const res = await fetch('/api/seller/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentSeller?.token || ''}`
        },
        body: JSON.stringify({
          orderId,
          status: newStatus,
          courier
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast(data.message || `Order updated to ${newStatus}! 🚚`, 'success');
        fetchSellerOrders();
        fetchSellerStats();
      } else {
        showToast(data.error || 'Failed to update order', 'error');
      }
    } catch {
      showToast('Network error updating order', 'error');
    }
  };

  // ─── WITHDRAWAL SUBMISSION ───────────────────────────────────────
  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    const amountNum = Number(withdrawAmount);
    if (!amountNum || amountNum < 100) {
      showToast('Minimum payout amount is ₹100', 'error');
      return;
    }

    if (amountNum > (stats.availableBalance || 0)) {
      showToast('Withdrawal amount exceeds your live cleared wallet balance', 'error');
      return;
    }

    try {
      const res = await fetch('/api/seller/payouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentSeller?.token || ''}`
        },
        body: JSON.stringify({
          amount: amountNum,
          method: withdrawMethod,
          bankAccount: withdrawMethod === 'Bank' ? withdrawDestination : undefined,
          upiId: withdrawMethod === 'UPI' ? withdrawDestination : undefined
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Payout processed successfully! 💰', 'success');
        setIsWithdrawModalOpen(false);
        setWithdrawAmount('');
        fetchSellerPayouts();
        fetchSellerStats();
      } else {
        showToast(data.error || 'Failed to process payout', 'error');
      }
    } catch {
      showToast('Network error processing payout', 'error');
    }
  };

  // ─── ADD PRODUCT HANDLER ─────────────────────────────────────────
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
          countInStock: Number(newProdStock),
          hsnCode: newProdHsn,
          gstRate: isGstSeller ? Number(newProdGstRate) : 0,
          image: newProdImage || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
          description: newProdDesc || `${newProdName} with verified quality guarantee and fast dispatch.`
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Product listed live on AbKharido marketplace! 🛍️', 'success');
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

  // Quick Edit
  const handleSaveQuickEdit = async (e) => {
    e.preventDefault();
    if (!selectedEditProduct) return;

    try {
      const res = await fetch(`/api/seller/products/${selectedEditProduct.id || selectedEditProduct._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentSeller?.token || ''}`
        },
        body: JSON.stringify({
          price: Number(editPrice),
          stock: Number(editStock),
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

  // Storefront URLs & Sharing
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

  const handleShareWhatsApp = () => {
    const url = getStorefrontUrl();
    const text = `🏪 Welcome to *${currentSeller?.shopName || 'Our Store'}* on AbKharido!\n\n✨ Browse our verified collection with 24-48h Express Delivery & Cash on Delivery.\n\n👉 Shop Now: ${url}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Filtered Orders
  const filteredOrders = sellerOrders.filter(o => {
    if (orderFilter === 'pending') return ['Placed', 'Pending', 'Processing', 'Packed'].includes(o.status);
    if (orderFilter === 'shipped') return ['Shipped', 'Dispatched', 'In Transit', 'Out for Delivery'].includes(o.status);
    if (orderFilter === 'delivered') return o.status === 'Delivered';
    return true;
  });

  const isGstSeller = currentSeller?.sellerType === 'gst' || Boolean(currentSeller?.gstin);

  // ═════════════════════════════════════════════════════════════════
  // 1. UN-AUTHENTICATED ONBOARDING & LOGIN SCREEN
  // ═════════════════════════════════════════════════════════════════
  if (!currentSeller) {
    return (
      <div className="container animate-fade-in" style={{ maxWidth: '640px', margin: '40px auto 100px auto', padding: '0 16px' }}>
        <div style={{ background: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '36px 30px', boxShadow: '0 12px 40px rgba(15, 23, 42, 0.08)' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto', boxShadow: '0 8px 20px rgba(37, 99, 235, 0.3)' }}>
              <Store size={28} color="#ffffff" />
            </div>
            <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '24px', fontWeight: '900', color: '#0f172a', margin: '0 0 6px 0' }}>
              AbKharido Merchant &amp; Seller Hub
            </h1>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: '1.5' }}>
              Sell with <strong>GST or Without GST (PAN Card Only)</strong> under the Indian E-Commerce Small Seller Scheme. Automated Delhivery logistics dispatch &amp; instant bank settlements.
            </p>
          </div>

          {/* 🔗 Smart Customer Account Recognition Banner */}
          {currentUser && (
            <div style={{
              background: '#eff6ff',
              border: '1.5px solid #bfdbfe',
              borderRadius: '14px',
              padding: '12px 14px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <ShieldCheck size={20} color="#2563eb" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '12.5px', color: '#1e40af', lineHeight: 1.4 }}>
                Logged in as <strong>{currentUser.name || currentUser.phone || currentUser.email}</strong>. 
                {authMode === 'signup' 
                  ? ' Your existing AbKharido customer account will be upgraded to a Seller Store with no duplicate logins!' 
                  : ' Use your account credentials to log in.'}
              </div>
            </div>
          )}

          {isExistingCustomerPrompt && (
            <div style={{
              background: '#fef3c7',
              border: '1.5px solid #fde68a',
              borderRadius: '14px',
              padding: '12px 14px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <Info size={20} color="#b45309" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '12.5px', color: '#92400e', lineHeight: 1.4 }}>
                <strong>Customer Account Found:</strong> Enter your existing password and store details below to activate your Seller Store.
              </div>
            </div>
          )}

          {/* ⚠️ Prominent Inline Error Display */}
          {formError && (
            <div style={{
              background: '#fef2f2',
              border: '1.5px solid #f87171',
              borderRadius: '14px',
              padding: '12px 16px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.08)'
            }}>
              <AlertCircle size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '13px', color: '#991b1b', fontWeight: '600', lineHeight: 1.45 }}>
                {formError}
              </div>
            </div>
          )}

          {/* Mode Switcher */}
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '12px', marginBottom: '22px' }}>
            <button 
              type="button"
              onClick={() => { setAuthMode('login'); setFormError(''); }}
              style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: authMode === 'login' ? '#ffffff' : 'transparent', color: authMode === 'login' ? '#0f172a' : '#64748b', fontWeight: '800', fontSize: '13px', cursor: 'pointer', boxShadow: authMode === 'login' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none' }}
            >
              Merchant Login
            </button>
            <button 
              type="button"
              onClick={() => { setAuthMode('signup'); setFormError(''); }}
              style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: authMode === 'signup' ? '#ffffff' : 'transparent', color: authMode === 'signup' ? '#0f172a' : '#64748b', fontWeight: '800', fontSize: '13px', cursor: 'pointer', boxShadow: authMode === 'signup' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none' }}
            >
              Open New Seller Account
            </button>
          </div>

          {authMode === 'login' ? (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Merchant Email or Registered Phone
                </label>
                <input 
                  type="text" 
                  placeholder="seller@brand.com or 9876543210"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  style={{ width: '100%', height: '42px', padding: '0 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Password
                </label>
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
                style={{ width: '100%', height: '46px', background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)', color: '#ffffff', borderRadius: '12px', border: 'none', fontWeight: '800', fontSize: '14px', cursor: 'pointer', marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                {loading ? 'Authenticating...' : 'Login to Merchant Portal'} <ArrowRight size={16} />
              </button>

              <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '12.5px', color: '#64748b' }}>
                Don&apos;t have a seller account yet?{' '}
                <button
                  type="button"
                  onClick={() => { setAuthMode('signup'); setFormError(''); }}
                  style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: '700', cursor: 'pointer', padding: 0 }}
                >
                  Open your Store in 1 Minute
                </button>
              </div>
            </form>

          ) : (
            <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* GST / Non-GST Segmented Toggle */}
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
                  Select Your Business Tax Scheme
                </span>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => { setSignupSellerType('non_gst'); setFormError(''); }}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: signupSellerType === 'non_gst' ? '2px solid #16a34a' : '1px solid #cbd5e1',
                      background: signupSellerType === 'non_gst' ? '#f0fdf4' : '#ffffff',
                      color: signupSellerType === 'non_gst' ? '#166534' : '#475569',
                      fontWeight: '800',
                      fontSize: '12px',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                  >
                    🛍️ Without GST (PAN Only)
                    <div style={{ fontSize: '10px', fontWeight: '500', color: '#64748b', marginTop: '2px' }}>
                      Turnover &lt; ₹40L (Govt Scheme)
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setSignupSellerType('gst'); setFormError(''); }}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: signupSellerType === 'gst' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                      background: signupSellerType === 'gst' ? '#eff6ff' : '#ffffff',
                      color: signupSellerType === 'gst' ? '#1e40af' : '#475569',
                      fontWeight: '800',
                      fontSize: '12px',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                  >
                    🏢 I Have GSTIN
                    <div style={{ fontSize: '10px', fontWeight: '500', color: '#64748b', marginTop: '2px' }}>
                      Inter-state sales &amp; Tax Invoices
                    </div>
                  </button>
                </div>

                {signupSellerType === 'non_gst' ? (
                  <div style={{ marginTop: '8px', fontSize: '11px', color: '#166534', background: '#dcfce7', padding: '8px 10px', borderRadius: '8px', lineHeight: '1.4' }}>
                    💡 <strong>Govt Notification 34/2023:</strong> Small sellers in India can sell on e-commerce without GST! You only need your <strong>10-Digit PAN Card</strong> &amp; Bank Account. Orders are legally issued as <strong>Bill of Supply with 0% tax</strong>.
                  </div>
                ) : (
                  <div style={{ marginTop: '8px', fontSize: '11px', color: '#1e40af', background: '#dbeafe', padding: '8px 10px', borderRadius: '8px', lineHeight: '1.4' }}>
                    💡 <strong>GST Registered Merchant:</strong> We will automatically extract and link your PAN card from your 15-character GSTIN. Tax invoices will be generated automatically.
                  </div>
                )}
              </div>

              {/* Basic Business Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '3px' }}>
                    Shop / Brand Name*
                  </label>
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
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '3px' }}>
                    Owner Name (As on PAN/Bank)
                  </label>
                  <input 
                    type="text" 
                    placeholder="Full Legal Name"
                    value={signupLegalName}
                    onChange={(e) => setSignupLegalName(e.target.value)}
                    style={{ width: '100%', height: '38px', padding: '0 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Contact Credentials */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '3px' }}>
                    Email Address*
                  </label>
                  <input 
                    type="email" 
                    placeholder="seller@brand.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                    style={{ width: '100%', height: '38px', padding: '0 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '3px' }}>
                    10-Digit Mobile Number*
                  </label>
                  <input 
                    type="tel" 
                    placeholder="9876543210"
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    required
                    style={{ width: '100%', height: '38px', padding: '0 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Password with Account Linking Tip */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '3px' }}>
                  Password (Min 6 Characters)*
                </label>
                <input 
                  type="password" 
                  placeholder="••••••••"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  required
                  style={{ width: '100%', height: '38px', padding: '0 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
                <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginTop: '3px' }}>
                  💡 If you already have an AbKharido customer account, enter your account password to link your store.
                </span>
              </div>

              {/* Conditional Tax Compliance: GST vs Non-GST Inputs */}
              {signupSellerType === 'gst' ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#1e40af' }}>
                      15-Character GSTIN Number*
                    </label>
                    {signupGstin.length > 0 && (
                      <span style={{ fontSize: '11px', color: signupGstin.length === 15 && GSTIN_REGEX.test(signupGstin) ? '#16a34a' : '#d97706', fontWeight: '700' }}>
                        {signupGstin.length}/15 {signupGstin.length === 15 && GSTIN_REGEX.test(signupGstin) ? '✓ Valid' : ''}
                      </span>
                    )}
                  </div>
                  <input 
                    type="text" 
                    placeholder="27AAPCA1234F1Z5"
                    value={signupGstin}
                    onChange={(e) => handleGstinChange(e.target.value)}
                    required
                    autoCapitalize="characters"
                    autoCorrect="off"
                    spellCheck="false"
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '0 12px',
                      borderRadius: '8px',
                      border: signupGstin.length === 15 && GSTIN_REGEX.test(signupGstin)
                        ? '2px solid #2563eb'
                        : (gstinError ? '2px solid #ef4444' : '1.5px solid #cbd5e1'),
                      fontSize: '13.5px',
                      boxSizing: 'border-box',
                      fontWeight: '700',
                      letterSpacing: '1.5px',
                      background: signupGstin.length === 15 && GSTIN_REGEX.test(signupGstin) ? '#eff6ff' : '#ffffff'
                    }}
                  />
                  {signupGstin.length >= 12 && PAN_REGEX.test(signupGstin.slice(2, 12)) ? (
                    <div style={{ marginTop: '5px', fontSize: '11px', color: '#1d4ed8', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={13} color="#2563eb" /> Linked PAN from GSTIN: <strong>{signupGstin.slice(2, 12)}</strong>
                    </div>
                  ) : gstinError ? (
                    <div style={{ marginTop: '4px', fontSize: '11px', color: '#dc2626', fontWeight: '600' }}>
                      {gstinError}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '700', color: '#166534' }}>
                        PAN Card Number (10 Chars)*
                      </label>
                      {signupPan.length > 0 && (
                        <span style={{ fontSize: '11px', color: signupPan.length === 10 && PAN_REGEX.test(signupPan) ? '#16a34a' : '#d97706', fontWeight: '700' }}>
                          {signupPan.length}/10
                        </span>
                      )}
                    </div>
                    <input 
                      type="text" 
                      placeholder="ABCDE1234F"
                      value={signupPan}
                      onChange={(e) => handlePanChange(e.target.value)}
                      required
                      autoCapitalize="characters"
                      autoCorrect="off"
                      spellCheck="false"
                      style={{
                        width: '100%',
                        height: '40px',
                        padding: '0 12px',
                        borderRadius: '8px',
                        border: signupPan.length === 10 && PAN_REGEX.test(signupPan)
                          ? '2px solid #16a34a'
                          : (panError ? '2px solid #ef4444' : '1.5px solid #16a34a'),
                        fontSize: '13.5px',
                        boxSizing: 'border-box',
                        fontWeight: '700',
                        letterSpacing: '1.5px',
                        background: signupPan.length === 10 && PAN_REGEX.test(signupPan) ? '#f0fdf4' : '#ffffff',
                        transition: 'all 0.2s ease'
                      }}
                    />
                    {signupPan.length === 10 && PAN_REGEX.test(signupPan) ? (
                      <div style={{ marginTop: '5px', fontSize: '11px', color: '#15803d', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={13} color="#16a34a" /> Valid Indian PAN ({getPanHolderType(signupPan)})
                      </div>
                    ) : panError ? (
                      <div style={{ marginTop: '4px', fontSize: '11px', color: '#dc2626', fontWeight: '600' }}>
                        {panError}
                      </div>
                    ) : (
                      <div style={{ marginTop: '4px', fontSize: '10.5px', color: '#64748b' }}>
                        5 letters, 4 digits, 1 letter (e.g. ABCDE1234F)
                      </div>
                    )}
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '3px' }}>
                      MSME / Udyam Reg. No. (Optional)
                    </label>
                    <input 
                      type="text" 
                      placeholder="UDYAM-XX-00-0000000"
                      value={signupUdyamNumber}
                      onChange={(e) => setSignupUdyamNumber(e.target.value.toUpperCase())}
                      style={{ width: '100%', height: '40px', padding: '0 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                    <div style={{ marginTop: '4px', fontSize: '10.5px', color: '#64748b' }}>
                      Govt Aadhaar-verified registration
                    </div>
                  </div>
                </div>
              )}

              {/* Pickup Warehouse Address with Auto-Pincode Resolution */}
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                  📍 Courier Pickup Warehouse Address
                </span>
                
                <input 
                  type="text" 
                  placeholder="Street / Building / Shop Address*"
                  value={signupStreet}
                  onChange={(e) => setSignupStreet(e.target.value)}
                  required
                  style={{ width: '100%', height: '36px', padding: '0 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', marginBottom: '8px', boxSizing: 'border-box' }}
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                  <input 
                    type="text" 
                    placeholder="6-Digit PIN*"
                    value={signupPincode}
                    onChange={(e) => handlePincodeChange(e.target.value)}
                    required
                    style={{ height: '34px', padding: '0 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box', fontWeight: '700' }}
                  />
                  <input 
                    type="text" 
                    placeholder="City*"
                    value={signupCity}
                    onChange={(e) => setSignupCity(e.target.value)}
                    required
                    style={{ height: '34px', padding: '0 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                  <input 
                    type="text" 
                    placeholder="State*"
                    value={signupState}
                    onChange={(e) => setSignupState(e.target.value)}
                    required
                    style={{ height: '34px', padding: '0 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Bank & Settlement Details */}
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                  💳 Settlement Bank Account or UPI (Where Earnings are Transferred)
                </span>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '6px' }}>
                  <input 
                    type="text" 
                    placeholder="Bank Account Number"
                    value={signupAccountNo}
                    onChange={(e) => setSignupAccountNo(e.target.value)}
                    style={{ height: '34px', padding: '0 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                  <input 
                    type="text" 
                    placeholder="Bank IFSC Code (e.g. HDFC0000123)"
                    value={signupIfsc}
                    onChange={(e) => setSignupIfsc(e.target.value.toUpperCase())}
                    style={{ height: '34px', padding: '0 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>

                <input 
                  type="text" 
                  placeholder="Or Instant UPI ID (e.g. yourname@okaxis / gpay)"
                  value={signupUpi}
                  onChange={(e) => setSignupUpi(e.target.value)}
                  style={{ width: '100%', height: '34px', padding: '0 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box' }}
                />

                <div style={{ marginTop: '8px', fontSize: '11px', color: '#0369a1', background: '#f0f9ff', padding: '7px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #bae6fd' }}>
                  <ShieldCheck size={14} color="#0284c7" />
                  <span><strong>Bank Name Match:</strong> Under Section 194-O, Account Holder Name must match the PAN Card Name for payouts to be processed.</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: '#475569' }}>
                <input 
                  type="checkbox" 
                  id="cert-turnover"
                  checked={certifiedTurnover}
                  onChange={(e) => setCertifiedTurnover(e.target.checked)}
                  required
                />
                <label htmlFor="cert-turnover" style={{ cursor: 'pointer' }}>
                  I certify that all details are accurate and agree to AbKharido&apos;s Merchant Terms &amp; Conditions.
                </label>
              </div>

              <button 
                type="submit"
                disabled={loading}
                style={{ width: '100%', height: '46px', background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)', color: '#ffffff', borderRadius: '12px', border: 'none', fontWeight: '800', fontSize: '14px', cursor: 'pointer', marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 6px 18px rgba(37, 99, 235, 0.25)' }}
              >
                {loading ? 'Opening Merchant Account...' : 'Open Storefront & Start Selling'} <ArrowRight size={16} />
              </button>

              <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '12.5px', color: '#64748b' }}>
                Already have a merchant store?{' '}
                <button
                  type="button"
                  onClick={() => { setAuthMode('login'); setFormError(''); }}
                  style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: '700', cursor: 'pointer', padding: 0 }}
                >
                  Login to Merchant Portal
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════
  // 2. AUTHENTICATED MERCHANT DASHBOARD (10/10 PRODUCTION PORTAL)
  // ═════════════════════════════════════════════════════════════════
  return (
    <div className="container animate-fade-in" style={{ maxWidth: '1320px', margin: '20px auto 120px auto', padding: '0 16px' }}>
      
      {/* 🌟 Top Header Ribbon with Store Name & Live Compliance Badge */}
      <div style={{ background: 'linear-gradient(135deg, #090d16 0%, #1e3a8a 60%, #1d4ed8 100%)', borderRadius: '24px', padding: '24px 30px', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px', boxShadow: '0 12px 30px rgba(15, 23, 42, 0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(37, 99, 235, 0.4)' }}>
            <Store size={28} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '22px', fontWeight: '900', margin: 0 }}>
                {currentSeller.shopName || 'Verified Merchant Store'}
              </h1>
              
              {isGstSeller ? (
                <span style={{ background: '#ecfdf5', color: '#059669', fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '6px', border: '1px solid #a7f3d0' }}>
                  ✓ GST REGISTERED ({currentSeller.gstin || stats.gstin || 'Active'})
                </span>
              ) : (
                <span style={{ background: '#fef3c7', color: '#92400e', fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '6px', border: '1px solid #fde68a' }}>
                  ★ COMPOSITION SCHEME (BILL OF SUPPLY • PAN: {currentSeller.pan || stats.pan || 'Active'})
                </span>
              )}
            </div>

            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', margin: '4px 0 0 0' }}>
              Merchant ID: {currentSeller.id || 'SEL-101'} • Automated NimbusPost Courier Dispatch &amp; Escrow Settlements
            </p>
          </div>
        </div>

        {/* ⚡ Quick Share & Payout Action Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          
          <button 
            onClick={() => setIsWithdrawModalOpen(true)}
            style={{ background: '#10b981', color: '#ffffff', border: 'none', padding: '10px 18px', borderRadius: '12px', fontWeight: '800', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)' }}
            title="Instant Payout to Bank Account or UPI"
          >
            <DollarSign size={16} /> Instant Payout: ₹{(stats.walletBalance || 0).toLocaleString('en-IN')}
          </button>

          <button 
            onClick={handleShareWhatsApp}
            style={{ background: '#25D366', color: '#ffffff', border: 'none', padding: '10px 16px', borderRadius: '12px', fontWeight: '800', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(37, 211, 102, 0.35)' }}
            title="Share storefront on WhatsApp"
          >
            <Share2 size={15} /> WhatsApp
          </button>

          <button 
            onClick={handleCopyStorefrontLink}
            style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: '#ffffff', padding: '10px 14px', borderRadius: '12px', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
          >
            {copiedLink === 'storefront' ? <Check size={15} color="#4ade80" /> : <Copy size={15} />}
            {copiedLink === 'storefront' ? 'Copied' : 'Store Link'}
          </button>

          <button 
            onClick={() => setIsQrModalOpen(true)}
            style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: '#ffffff', padding: '10px 14px', borderRadius: '12px', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
            title="Show Storefront QR Code"
          >
            <QrCode size={15} /> QR
          </button>

          <button 
            onClick={handleLogout}
            style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#fca5a5', padding: '10px 14px', borderRadius: '12px', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
            title="Logout"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>

      {/* ⚠️ Non-GST Interstate Delivery Boundary Notice (Notification 34/2023) */}
      {!isGstSeller && (
        <div style={{
          background: '#fffbeb', border: '1.5px solid #fcd34d', borderRadius: '16px',
          padding: '14px 20px', marginBottom: '22px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px',
          boxShadow: '0 4px 15px rgba(245, 158, 11, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '26px' }}>📍</span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '800', color: '#78350f' }}>
                Intra-State Delivery Protocol Active (CBIC Notification 34/2023)
              </div>
              <div style={{ fontSize: '12px', color: '#92400e', marginTop: '3px', lineHeight: '1.4' }}>
                Aapka store <strong>Non-GST Merchant</strong> ke roop mein active hai. Indian Law ke mutabik aapke products sirf aapki state (<strong>{currentSeller.pickupAddress?.state || 'Home State'}</strong>) ke buyers ko deliver honge. Bahar ke state ke orders automatically block rahenge taaki GST rules violate na hon.
              </div>
            </div>
          </div>
          <span style={{ fontSize: '11px', fontWeight: '800', background: '#fef3c7', color: '#b45309', padding: '6px 12px', borderRadius: '8px', border: '1px solid #fde68a' }}>
            🔒 Interstate Compliance Shield Active
          </span>
        </div>
      )}

      {/* 🧭 Master Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '24px', overflowX: 'auto' }}>
        {[
          { id: 'overview', label: '📊 Command Center (Overview)' },
          { id: 'orders', label: '🛍️ Orders & Logistics', count: sellerOrders.length },
          { id: 'payouts', label: '💰 Financial Ledger & Settlements' },
          { id: 'catalog', label: '📦 Product Catalog', count: sellerProducts.length },
          { id: 'share', label: '⚡ Storefront & Growth Hub' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              border: activeTab === tab.id ? '1px solid #2563eb' : '1px solid #e2e8f0',
              background: activeTab === tab.id ? '#2563eb' : '#ffffff',
              color: activeTab === tab.id ? '#ffffff' : '#334155',
              fontWeight: '800',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              boxShadow: activeTab === tab.id ? '0 4px 12px rgba(37, 99, 235, 0.25)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            {tab.label} {tab.count !== undefined && <span style={{ opacity: 0.85 }}>({tab.count})</span>}
          </button>
        ))}

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setIsAddProductModalOpen(true)}
            style={{ padding: '10px 16px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #1d4ed8, #2563eb)', color: '#ffffff', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)' }}
          >
            <PlusCircle size={15} /> Add Product
          </button>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* TAB 1: OVERVIEW & COMMAND CENTER                              */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="animate-fade-in">
          
          {/* 6 Core Analytics Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            
            {/* 1. Live Cleared Wallet Balance */}
            <div style={{ background: '#ffffff', borderRadius: '18px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Available Balance</span>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <DollarSign size={16} color="#059669" />
                </div>
              </div>
              <div style={{ fontSize: '26px', fontWeight: '900', color: '#059669', fontFamily: "'Outfit', sans-serif" }}>
                ₹{(stats.walletBalance || 0).toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '11px', color: '#059669', fontWeight: '700', marginTop: '4px' }}>
                🟢 Cleared &amp; ready to withdraw
              </div>
            </div>

            {/* 2. Gross GMV Sales */}
            <div style={{ background: '#ffffff', borderRadius: '18px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Gross Sales (GMV)</span>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={16} color="#2563eb" />
                </div>
              </div>
              <div style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', fontFamily: "'Outfit', sans-serif" }}>
                ₹{(stats.totalRevenue || 0).toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '11px', color: '#2563eb', fontWeight: '700', marginTop: '4px' }}>
                Total product value sold
              </div>
            </div>

            {/* 3. Pending Escrow Balance */}
            <div style={{ background: '#ffffff', borderRadius: '18px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>In Escrow / In Transit</span>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={16} color="#d97706" />
                </div>
              </div>
              <div style={{ fontSize: '26px', fontWeight: '900', color: '#d97706', fontFamily: "'Outfit', sans-serif" }}>
                ₹{(stats.pendingPayout || 0).toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '11px', color: '#b45309', fontWeight: '700', marginTop: '4px' }}>
                Auto-releases upon delivery
              </div>
            </div>

            {/* 4. Total Orders */}
            <div style={{ background: '#ffffff', borderRadius: '18px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Total Orders</span>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingBag size={16} color="#7c3aed" />
                </div>
              </div>
              <div style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', fontFamily: "'Outfit', sans-serif" }}>
                {sellerOrders.length || stats.totalOrders || 0}
              </div>
              <div style={{ fontSize: '11px', color: '#7c3aed', fontWeight: '700', marginTop: '4px' }}>
                Customer purchase orders
              </div>
            </div>

            {/* 5. Active Products */}
            <div style={{ background: '#ffffff', borderRadius: '18px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Live Products</span>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Package size={16} color="#16a34a" />
                </div>
              </div>
              <div style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', fontFamily: "'Outfit', sans-serif" }}>
                {sellerProducts.length || stats.totalProducts || 0}
              </div>
              <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: '700', marginTop: '4px' }}>
                Active in storefront
              </div>
            </div>

            {/* 6. Units Sold */}
            <div style={{ background: '#ffffff', borderRadius: '18px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Units Dispatched</span>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ecfeff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Truck size={16} color="#0891b2" />
                </div>
              </div>
              <div style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', fontFamily: "'Outfit', sans-serif" }}>
                {stats.unitsSold || 0} Units
              </div>
              <div style={{ fontSize: '11px', color: '#0891b2', fontWeight: '700', marginTop: '4px' }}>
                Delivered across India
              </div>
            </div>

          </div>

          {/* 🌟 ARCHITECTURE GUIDE: How AbKharido Seller Payment & Delivery System Works */}
          <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '24px', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <ShieldCheck size={22} color="#2563eb" />
              <h2 style={{ fontSize: '17px', fontWeight: '900', color: '#0f172a', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
                World-Class Transparent E-Commerce Payment &amp; Delivery System
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '13px', fontWeight: '900', color: '#1e40af', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>1️⃣</span> Customer Payment &amp; Escrow
                </div>
                <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.5' }}>
                  Buyer pays online (via Cashfree Gateway) or chooses Cash on Delivery (COD). Funds are securely held in <strong>AbKharido Safe Escrow</strong> to protect both parties.
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '13px', fontWeight: '900', color: '#0891b2', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>2️⃣</span> 1-Click Delhivery Dispatch
                </div>
                <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.5' }}>
                  Seller packs the order, clicks <strong>Dispatch</strong>. System auto-generates real Courier AWB &amp; printable Shipping Label. Courier collects directly from your registered pickup warehouse.
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '13px', fontWeight: '900', color: '#7c3aed', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>3️⃣</span> Legal GST / Bill of Supply
                </div>
                <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.5' }}>
                  {isGstSeller ? (
                    <><strong>GST Registered:</strong> Tax Invoice is issued showing your GSTIN, HSN Code &amp; CGST/SGST/IGST breakdown.</>
                  ) : (
                    <><strong>Non-GST Seller:</strong> As per Sec 31(3)(c) of CGST Act, a <strong>Bill of Supply</strong> is issued with ₹0 tax and legal notification 34/2023 endorsement.</>
                  )}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '13px', fontWeight: '900', color: '#059669', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>4️⃣</span> Instant Wallet Credit &amp; Payout
                </div>
                <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.5' }}>
                  Upon delivery confirmation, net seller earnings (Gross - 8% fee - 18% GST on fee - 1% TDS) are credited to your <strong>Live Wallet</strong>. Withdraw anytime to your Bank / UPI with 1 click!
                </div>
              </div>

            </div>
          </div>

          {/* Quick Order Actions Preview */}
          <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a', margin: 0 }}>
                Recent Customer Orders Awaiting Fulfillment
              </h3>
              <button 
                onClick={() => setActiveTab('orders')}
                style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}
              >
                View All Orders &rarr;
              </button>
            </div>

            {sellerOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 16px', color: '#64748b' }}>
                <ShoppingBag size={40} color="#cbd5e1" style={{ margin: '0 auto 8px auto' }} />
                <div style={{ fontWeight: '800', fontSize: '15px', color: '#0f172a' }}>No orders yet!</div>
                <div style={{ fontSize: '13px', marginTop: '4px' }}>List your products and share your storefront link to start receiving orders.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {sellerOrders.slice(0, 3).map(o => (
                  <div key={o._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '14px 18px', borderRadius: '14px', border: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <div style={{ fontWeight: '800', fontSize: '14px', color: '#0f172a' }}>Order #{o.orderId?.slice(-8) || o._id?.slice(-8)}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                        Customer: {o.shippingAddress?.fullName} ({o.shippingAddress?.city}, {o.shippingAddress?.state}) • {o.paymentMethod}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '800', padding: '4px 10px', borderRadius: '6px', background: o.status === 'Delivered' ? '#ecfdf5' : '#eff6ff', color: o.status === 'Delivered' ? '#059669' : '#1d4ed8' }}>
                        {o.status}
                      </span>
                      <button 
                        onClick={() => { setPrintOrder(o); }}
                        style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', fontWeight: '800', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Printer size={13} /> Label &amp; Bill
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* TAB 2: ORDERS & NIMBUSPOST COURIER FULFILLMENT                */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {activeTab === 'orders' && (
        <div className="animate-fade-in">
          
          {/* Order Filter Pills */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'All Orders' },
              { id: 'pending', label: '⏳ Awaiting Packing & Dispatch' },
              { id: 'shipped', label: '🚚 In Transit / Dispatched' },
              { id: 'delivered', label: '✅ Delivered & Settled' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setOrderFilter(f.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: orderFilter === f.id ? '1px solid #2563eb' : '1px solid #e2e8f0',
                  background: orderFilter === f.id ? '#eff6ff' : '#ffffff',
                  color: orderFilter === f.id ? '#1d4ed8' : '#64748b',
                  fontWeight: '800',
                  fontSize: '12.5px',
                  cursor: 'pointer'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filteredOrders.length === 0 ? (
            <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '48px 20px', textAlign: 'center' }}>
              <Package size={48} color="#cbd5e1" style={{ margin: '0 auto 12px auto' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', margin: '0 0 6px 0' }}>No Orders in this Status</h3>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>All orders for your listed inventory will appear here with full customer delivery and financial ledger breakdown.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {filteredOrders.map(order => {
                const isDelivered = order.status === 'Delivered';
                const isShipped = ['Shipped', 'Dispatched', 'In Transit', 'Out for Delivery'].includes(order.status);
                const isPending = ['Placed', 'Pending', 'Processing', 'Packed'].includes(order.status);
                const ledger = order.financialLedger || {};

                return (
                  <div key={order._id} style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '22px', boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)' }}>
                    
                    {/* Header Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a' }}>
                            Order #{order.orderId?.slice(-8) || order._id?.slice(-8)}
                          </span>
                          <span style={{ fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '6px', background: isDelivered ? '#ecfdf5' : (isShipped ? '#eff6ff' : '#fef3c7'), color: isDelivered ? '#059669' : (isShipped ? '#1d4ed8' : '#92400e') }}>
                            {order.status}
                          </span>
                          <span style={{ fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '6px', background: order.paymentMethod === 'Cash on Delivery' ? '#fff7ed' : '#f0fdf4', color: order.paymentMethod === 'Cash on Delivery' ? '#c2410c' : '#15803d' }}>
                            {order.paymentMethod || 'Prepaid'}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                          Placed on: {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        {isPending && (
                          <button
                            onClick={() => handleUpdateOrderStatus(order._id, 'Shipped', 'Delhivery Express')}
                            style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)', color: '#ffffff', border: 'none', padding: '9px 16px', borderRadius: '10px', fontWeight: '800', fontSize: '12.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            <Truck size={14} /> Pack &amp; Generate AWB
                          </button>
                        )}

                        {isShipped && !isDelivered && (
                          <button
                            onClick={() => handleUpdateOrderStatus(order._id, 'Delivered')}
                            style={{ background: '#10b981', color: '#ffffff', border: 'none', padding: '9px 16px', borderRadius: '10px', fontWeight: '800', fontSize: '12.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            <CheckCircle2 size={14} /> Mark Delivered &amp; Settle Wallet
                          </button>
                        )}

                        <button
                          onClick={() => setPrintOrder(order)}
                          style={{ background: '#0f172a', color: '#ffffff', border: 'none', padding: '9px 16px', borderRadius: '10px', fontWeight: '800', fontSize: '12.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Printer size={14} /> Print Label &amp; {order.invoiceType || (isGstSeller ? 'Tax Invoice' : 'Bill of Supply')}
                        </button>
                      </div>
                    </div>

                    {/* Order Body: Items & Destination */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                      
                      {/* Items */}
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                          Items to Fulfill ({order.orderItems?.length || 1})
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {(order.orderItems || []).map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc', padding: '10px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                              <img src={item.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100'} alt={item.name} style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'contain', background: '#ffffff', border: '1px solid #e2e8f0' }} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                                <div style={{ fontSize: '11px', color: '#64748b' }}>
                                  Qty: <strong>{item.qty}</strong> • Rate: <strong>₹{item.price?.toLocaleString('en-IN')}</strong> • HSN: <strong>{item.hsnCode || '8517'}</strong> • GST: <strong>{isGstSeller ? `${item.gstRate || 18}%` : '0% (Exempt)'}</strong>
                                </div>
                              </div>
                              <div style={{ fontSize: '14px', fontWeight: '900', color: '#0f172a' }}>
                                ₹{((item.price || 0) * (item.qty || 1)).toLocaleString('en-IN')}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Customer Destination & Courier Info */}
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                          📍 Customer Delivery Destination
                        </div>
                        <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#334155', lineHeight: '1.5' }}>
                          <div style={{ fontWeight: '800', fontSize: '13px', color: '#0f172a' }}>{order.shippingAddress?.fullName}</div>
                          <div>{order.shippingAddress?.address}</div>
                          <div>{order.shippingAddress?.city}, {order.shippingAddress?.state} - <strong>{order.shippingAddress?.postalCode}</strong></div>
                          <div>Phone: <strong>{order.shippingAddress?.phone}</strong></div>
                          
                          {order.awbNumber ? (
                            <div style={{ marginTop: '8px', borderTop: '1px dashed #cbd5e1', paddingTop: '6px', color: '#1e40af', fontWeight: '800' }}>
                              🚚 Courier: {order.courierPartner || 'Delhivery Express'} | AWB: {order.awbNumber}
                            </div>
                          ) : (
                            <div style={{ marginTop: '8px', borderTop: '1px dashed #cbd5e1', paddingTop: '6px', color: '#d97706', fontWeight: '700' }}>
                              ⏳ Awaiting Dispatch &amp; Courier Pickup Manifest
                            </div>
                          )}
                        </div>
                      </div>

                    </div>

                    {/* Financial Ledger Transparency Box */}
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '14px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', fontSize: '12px' }}>
                        <div>
                          <span style={{ color: '#166534' }}>Gross Sale:</span>{' '}
                          <strong>₹{(ledger.grossSale || 0).toLocaleString('en-IN')}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#166534' }}>Platform Fee (8%):</span>{' '}
                          <strong style={{ color: '#dc2626' }}>-₹{ledger.platformCommission || 0}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#166534' }}>GST on Fee (18%):</span>{' '}
                          <strong style={{ color: '#dc2626' }}>-₹{ledger.gstOnCommission || 0}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#166534' }}>TDS Sec 194-O (1%):</span>{' '}
                          <strong style={{ color: '#dc2626' }}>-₹{ledger.tdsDeducted || 0}</strong>
                        </div>
                        {isGstSeller && (
                          <div>
                            <span style={{ color: '#166534' }}>TCS Sec 52 (1%):</span>{' '}
                            <strong style={{ color: '#dc2626' }}>-₹{ledger.tcsDeducted || 0}</strong>
                          </div>
                        )}
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '11px', color: '#166534', fontWeight: '800', textTransform: 'uppercase', display: 'block' }}>
                          Net Settlement to Wallet
                        </span>
                        <span style={{ fontSize: '18px', fontWeight: '900', color: '#15803d' }}>
                          ₹{(ledger.netPayable || 0).toLocaleString('en-IN')}
                        </span>
                        <div style={{ fontSize: '10.5px', color: '#166534', fontWeight: '700' }}>
                          {ledger.settlementStatus || (isDelivered ? '✅ Credited' : '⏳ In Escrow')}
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* TAB 3: FINANCIAL LEDGER & SETTLEMENTS PASSBOOK                */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {activeTab === 'payouts' && (
        <div className="animate-fade-in">
          
          {/* Live Balance Card */}
          <div style={{ background: 'linear-gradient(135deg, #090d16 0%, #1e1b4b 100%)', borderRadius: '24px', padding: '28px', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '24px', boxShadow: '0 12px 30px rgba(15, 23, 42, 0.15)' }}>
            <div>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#86efac', textTransform: 'uppercase', letterSpacing: '1px' }}>
                LIVE CLEARED MERCHANT WALLET BALANCE
              </span>
              <div style={{ fontSize: '38px', fontWeight: '900', color: '#ffffff', fontFamily: "'Outfit', sans-serif", margin: '6px 0' }}>
                ₹{(stats.walletBalance || 0).toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.75)' }}>
                Registered Settlement Target: <strong>{currentSeller.payoutDetails?.bankAccount || currentSeller.payoutDetails?.upiId || 'Direct Bank NEFT / IMPS'}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setIsWithdrawModalOpen(true)}
                disabled={(stats.walletBalance || 0) < 100}
                style={{
                  background: (stats.walletBalance || 0) >= 100 ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' : '#475569',
                  color: '#ffffff',
                  border: 'none',
                  padding: '14px 28px',
                  borderRadius: '14px',
                  fontWeight: '800',
                  fontSize: '15px',
                  cursor: (stats.walletBalance || 0) >= 100 ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: (stats.walletBalance || 0) >= 100 ? '0 6px 20px rgba(16, 185, 129, 0.4)' : 'none'
                }}
              >
                <DollarSign size={18} /> Withdraw to Bank / UPI
              </button>
            </div>
          </div>

          {/* Settlement Ledger Table */}
          <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: '900', color: '#0f172a', margin: '0 0 4px 0' }}>
                  Merchant Settlement Passbook &amp; Transaction Ledger
                </h3>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                  Every delivered order sale credit, commission invoice, and bank withdrawal payout is permanently attested with unique UTR reference.
                </p>
              </div>

              <button 
                onClick={fetchSellerPayouts}
                style={{ padding: '8px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: '700', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <RefreshCw size={13} /> Refresh Ledger
              </button>
            </div>

            {payoutHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 16px', color: '#64748b' }}>
                <Receipt size={40} color="#cbd5e1" style={{ margin: '0 auto 8px auto' }} />
                <div style={{ fontWeight: '800', fontSize: '15px', color: '#0f172a' }}>No transactions recorded yet</div>
                <div style={{ fontSize: '13px', marginTop: '4px' }}>Delivered orders and withdrawal payouts will automatically generate ledger entries.</div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', color: '#475569', borderBottom: '1.5px solid #e2e8f0' }}>
                      <th style={{ textAlign: 'left', padding: '12px' }}>Date</th>
                      <th style={{ textAlign: 'left', padding: '12px' }}>Transaction Type</th>
                      <th style={{ textAlign: 'left', padding: '12px' }}>Order / Reference</th>
                      <th style={{ textAlign: 'right', padding: '12px' }}>Gross Sale (₹)</th>
                      <th style={{ textAlign: 'right', padding: '12px' }}>Fee &amp; Tax (₹)</th>
                      <th style={{ textAlign: 'right', padding: '12px' }}>Net Amount (₹)</th>
                      <th style={{ textAlign: 'left', padding: '12px' }}>Bank UTR / Target</th>
                      <th style={{ textAlign: 'center', padding: '12px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payoutHistory.map((item, idx) => {
                      const isCredit = item.type === 'ORDER_CREDIT';
                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                            {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td style={{ padding: '12px', fontWeight: '800', color: isCredit ? '#15803d' : '#2563eb' }}>
                            {isCredit ? '🟢 Order Sale Credit' : '🔵 Withdrawal Disbursed'}
                          </td>
                          <td style={{ padding: '12px', color: '#0f172a', fontWeight: '700' }}>
                            {item.orderNumber || 'Bank Transfer'}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right', color: '#334155' }}>
                            {isCredit ? `₹${(item.grossSale || item.amount || 0).toLocaleString('en-IN')}` : '—'}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right', color: '#dc2626' }}>
                            {isCredit && item.platformFee ? `-₹${(item.platformFee + (item.taxDeducted || 0)).toLocaleString('en-IN')}` : '—'}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right', fontWeight: '900', color: isCredit ? '#15803d' : '#0f172a' }}>
                            {isCredit ? `+₹${(item.amount || 0).toLocaleString('en-IN')}` : `-₹${(item.amount || 0).toLocaleString('en-IN')}`}
                          </td>
                          <td style={{ padding: '12px', color: '#475569', fontSize: '11.5px', fontFamily: 'monospace' }}>
                            {item.utr}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <span style={{ fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '6px', background: '#ecfdf5', color: '#059669' }}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

          </div>

        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* TAB 4: PRODUCT CATALOG & INVENTORY                            */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {activeTab === 'catalog' && (
        <div className="animate-fade-in">
          
          {/* Controls Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
              <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Search your catalog by title, SKU, or category..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                style={{ width: '100%', height: '40px', padding: '0 12px 0 36px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => setIsBulkModalOpen(true)}
                style={{ padding: '10px 16px', borderRadius: '10px', border: '1.5px solid #10b981', background: '#ecfdf5', color: '#059669', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <FileSpreadsheet size={15} /> Bulk Excel Upload
              </button>

              <button 
                onClick={() => setIsAddProductModalOpen(true)}
                style={{ padding: '10px 18px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #1d4ed8, #2563eb)', color: '#ffffff', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)' }}
              >
                <PlusCircle size={15} /> Add New Product
              </button>
            </div>
          </div>

          {/* Products Grid */}
          {sellerProducts.length === 0 ? (
            <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '48px 20px', textAlign: 'center' }}>
              <Package size={48} color="#cbd5e1" style={{ margin: '0 auto 12px auto' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', margin: '0 0 6px 0' }}>Your Catalog is Empty</h3>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0' }}>List your products to make them visible to shoppers on AbKharido marketplace.</p>
              <button 
                onClick={() => setIsAddProductModalOpen(true)}
                style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: '#2563eb', color: '#ffffff', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}
              >
                Add Your First Product
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {sellerProducts
                .filter(p => !catalogSearch || p.name?.toLowerCase().includes(catalogSearch.toLowerCase()) || p.category?.toLowerCase().includes(catalogSearch.toLowerCase()))
                .map(p => (
                  <div key={p.id || p._id} style={{ background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <img src={p.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200'} alt={p.name} style={{ width: '64px', height: '64px', borderRadius: '10px', objectFit: 'contain', background: '#f8fafc', padding: '4px', border: '1px solid #e2e8f0' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Category: {p.category}</div>
                        <div style={{ fontSize: '11px', color: '#2563eb', fontWeight: '700' }}>HSN: {p.hsnCode || '8517'} • GST: {isGstSeller ? `${p.gstRate || 18}%` : '0% (Exempt)'}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a' }}>₹{(p.price || 0).toLocaleString('en-IN')}</div>
                        <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: '700' }}>In Stock: {p.stock || p.countInStock || 50} units</div>
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => {
                            setSelectedEditProduct(p);
                            setEditPrice(String(p.price || ''));
                            setEditStock(String(p.stock || p.countInStock || 50));
                            setIsQuickEditModalOpen(true);
                          }}
                          style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: '700', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Edit3 size={13} /> Edit
                        </button>

                        <button
                          onClick={() => window.open(`/product/${p.id || p._id}`, '_blank')}
                          style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', color: '#2563eb', cursor: 'pointer' }}
                          title="View on Live Storefront"
                        >
                          <ExternalLink size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}

        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* TAB 5: STOREFRONT & GROWTH HUB                                */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {activeTab === 'share' && (
        <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
          
          <div style={{ background: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '30px', textAlign: 'center', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '18px', background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', boxShadow: '0 8px 20px rgba(37, 211, 102, 0.35)' }}>
              <Share2 size={30} color="#ffffff" />
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a', margin: '0 0 6px 0', fontFamily: "'Outfit', sans-serif" }}>
              Share Your Dedicated AbKharido Storefront
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 24px 0', maxWidth: '500px', marginInline: 'auto' }}>
              Promote your brand on WhatsApp, Instagram, and local retail counters. Customers can order directly with Cash on Delivery &amp; Express 24-48h Delivery.
            </p>

            <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '14px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '24px' }}>
              <span style={{ fontSize: '13px', color: '#1e40af', fontWeight: '700', wordBreak: 'break-all', textAlign: 'left' }}>
                {getStorefrontUrl()}
              </span>
              <button 
                onClick={handleCopyStorefrontLink}
                style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#ffffff', fontWeight: '800', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                {copiedLink === 'storefront' ? '✓ Copied' : 'Copy Link'}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <button
                onClick={handleShareWhatsApp}
                style={{ padding: '14px', borderRadius: '14px', border: 'none', background: '#25D366', color: '#ffffff', fontWeight: '800', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(37, 211, 102, 0.35)' }}
              >
                <Share2 size={16} /> Share on WhatsApp
              </button>

              <button
                onClick={() => setIsQrModalOpen(true)}
                style={{ padding: '14px', borderRadius: '14px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', fontWeight: '800', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <QrCode size={16} /> Download Store QR Code
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* MODAL 1: PRINT SHIPPING LABEL & OFFICIAL INVOICE              */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {printOrder && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '780px', padding: '28px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.35)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Printer size={20} color="#2563eb" />
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '900', color: '#0f172a' }}>
                  Courier Shipping Label &amp; {isGstSeller ? 'Tax Invoice' : 'Bill of Supply'}
                </h3>
              </div>
              <button 
                onClick={() => setPrintOrder(null)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ✕
              </button>
            </div>

            {/* Thermal / A4 Courier Shipping Label */}
            <div style={{ border: '2.5px solid #0f172a', borderRadius: '12px', padding: '16px', background: '#ffffff', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0f172a', paddingBottom: '10px' }}>
                <div>
                  <div style={{ fontSize: '17px', fontWeight: '900', color: '#1e40af' }}>ABKHARIDO EXPRESS COURIER</div>
                  <div style={{ fontSize: '11px', color: '#475569' }}>Logistics Partner: <strong>{printOrder.courierPartner || 'Delhivery Express Air'}</strong></div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '13px', fontWeight: '900', fontFamily: 'monospace' }}>AWB: {printOrder.awbNumber || 'PENDING-MANIFEST'}</div>
                  <div style={{ fontSize: '11.5px', fontWeight: '800', color: printOrder.paymentMethod === 'Cash on Delivery' ? '#c2410c' : '#15803d' }}>
                    MODE: {printOrder.paymentMethod || 'Prepaid'}
                  </div>
                </div>
              </div>

              {/* Addresses Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', padding: '12px 0', borderBottom: '1.5px dashed #0f172a', fontSize: '11.5px' }}>
                <div>
                  <div style={{ fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>RETURN / PICKUP HUB:</div>
                  <div style={{ fontWeight: '900', fontSize: '13px', color: '#0f172a' }}>{currentSeller.shopName}</div>
                  <div>{currentSeller.pickupAddress?.street || 'Warehouse'}</div>
                  <div>{currentSeller.pickupAddress?.city || 'City'}, {currentSeller.pickupAddress?.state || 'Maharashtra'} - {currentSeller.pickupAddress?.pincode || '400001'}</div>
                  <div>Phone: {currentSeller.pickupAddress?.phone || currentSeller.phone}</div>
                </div>

                <div>
                  <div style={{ fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>DELIVER TO (CUSTOMER):</div>
                  <div style={{ fontWeight: '900', fontSize: '13px', color: '#0f172a' }}>{printOrder.shippingAddress?.fullName}</div>
                  <div>{printOrder.shippingAddress?.address}</div>
                  <div style={{ fontWeight: '800', fontSize: '13px' }}>{printOrder.shippingAddress?.city}, {printOrder.shippingAddress?.state} - {printOrder.shippingAddress?.postalCode}</div>
                  <div>Phone: {printOrder.shippingAddress?.phone}</div>
                </div>
              </div>

              {/* Collectable & Doorstep PIN */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>SECURITY DOORSTEP PIN:</div>
                  <div style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '2px', color: '#0f172a' }}>🔑 {printOrder.deliveryPin || 'VERIFIED'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>TOTAL AMOUNT PAYABLE:</div>
                  <div style={{ fontSize: '18px', fontWeight: '900', color: '#1e40af' }}>₹{(printOrder.totalPrice || printOrder.financialLedger?.grossSale || 0).toLocaleString('en-IN')}</div>
                </div>
              </div>
            </div>

            {/* Official GST Tax Invoice or Bill of Supply Document Preview */}
            <WorldClassInvoice 
              ref={invoiceRef}
              order={printOrder}
              seller={currentSeller}
              isVisible={true}
            />

            {/* Print Buttons */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button 
                onClick={() => setPrintOrder(null)}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: '800', cursor: 'pointer' }}
              >
                Close
              </button>
              
              <button 
                onClick={() => {
                  if (invoiceRef.current) {
                    invoiceRef.current.generatePDF();
                  } else {
                    window.print();
                  }
                }}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#2563eb', color: '#ffffff', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)' }}
              >
                <Download size={16} /> Download Official PDF
              </button>

              <button 
                onClick={() => window.print()}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#0f172a', color: '#ffffff', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Printer size={16} /> Print Shipping Label
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* MODAL 2: INSTANT BANK PAYOUT WITHDRAWAL                      */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {isWithdrawModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '440px', padding: '28px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#0f172a', fontFamily: "'Outfit', sans-serif" }}>
                Request Instant Merchant Payout
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
                  placeholder="Min ₹100"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  max={stats.walletBalance || 0}
                  min={100}
                  required
                  style={{ width: '100%', height: '42px', padding: '0 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
                <div style={{ fontSize: '11px', color: '#059669', marginTop: '3px', fontWeight: '700' }}>
                  Live Cleared Balance: ₹{(stats.walletBalance || 0).toLocaleString('en-IN')}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Settlement Rail</label>
                <select 
                  value={withdrawMethod}
                  onChange={(e) => setWithdrawMethod(e.target.value)}
                  style={{ width: '100%', height: '40px', padding: '0 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', background: '#ffffff' }}
                >
                  <option value="Bank">Direct NEFT / IMPS Bank Transfer (0% Fee)</option>
                  <option value="UPI">Instant UPI VPA (0% Fee)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                  {withdrawMethod === 'UPI' ? 'UPI ID (e.g. brand@okaxis)' : 'Bank Account Number / Target'}
                </label>
                <input 
                  type="text" 
                  value={withdrawDestination}
                  onChange={(e) => setWithdrawDestination(e.target.value)}
                  required
                  style={{ width: '100%', height: '40px', padding: '0 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <button 
                type="submit"
                style={{ width: '100%', height: '44px', background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#ffffff', borderRadius: '10px', border: 'none', fontWeight: '800', fontSize: '14px', cursor: 'pointer', marginTop: '6px' }}
              >
                Confirm &amp; Disburse to Bank Now
              </button>
            </form>

          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* MODAL 3: ADD NEW PRODUCT TO CATALOG                           */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {isAddProductModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '540px', padding: '30px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#0f172a', fontFamily: "'Outfit', sans-serif" }}>
                Add New Product to Marketplace
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
                  placeholder="e.g. Wireless Active Noise Cancelling Earbuds"
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Category</label>
                  <select 
                    value={newProdCategory}
                    onChange={(e) => {
                      const cat = e.target.value;
                      setNewProdCategory(cat);
                      if (cat === 'mobiles' || cat === 'electronics') setNewProdHsn('8517');
                      else if (cat === 'fashion') setNewProdHsn('6109');
                      else if (cat === 'appliances') setNewProdHsn('8516');
                      else setNewProdHsn('8518');
                    }}
                    style={{ width: '100%', height: '40px', padding: '0 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', background: '#ffffff' }}
                  >
                    <option value="electronics">Electronics &amp; Audio</option>
                    <option value="mobiles">Mobiles &amp; 5G Accessories</option>
                    <option value="fashion">Fashion &amp; Apparel</option>
                    <option value="home">Home &amp; Kitchen</option>
                    <option value="appliances">Large Home Appliances</option>
                    <option value="beauty">Beauty &amp; Health</option>
                    <option value="sports">Fitness &amp; Sports</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Stock Units*</label>
                  <input 
                    type="number" 
                    placeholder="50"
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(e.target.value)}
                    required
                    style={{ width: '100%', height: '40px', padding: '0 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* HSN & GST Rate Fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#f8fafc', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '3px' }}>HSN Code</label>
                  <input 
                    type="text" 
                    placeholder="8517"
                    value={newProdHsn}
                    onChange={(e) => setNewProdHsn(e.target.value)}
                    style={{ width: '100%', height: '36px', padding: '0 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '3px' }}>
                    GST Rate ({isGstSeller ? 'Tax Invoice' : 'Non-GST / Bill of Supply'})
                  </label>
                  {isGstSeller ? (
                    <select 
                      value={newProdGstRate}
                      onChange={(e) => setNewProdGstRate(Number(e.target.value))}
                      style={{ width: '100%', height: '36px', padding: '0 10px', borderRadius: '6px', border: '1.5px solid #2563eb', fontSize: '12.5px', boxSizing: 'border-box', background: '#ffffff', fontWeight: '700' }}
                    >
                      <option value={0}>0% (Exempt)</option>
                      <option value={5}>5% (Apparel &lt; ₹1k, Fitness)</option>
                      <option value={12}>12% (Processed, Utensils)</option>
                      <option value={18}>18% (Standard Electronics)</option>
                      <option value={28}>28% (Luxury Appliances)</option>
                    </select>
                  ) : (
                    <div style={{ height: '36px', display: 'flex', alignItems: 'center', padding: '0 10px', background: '#fef3c7', borderRadius: '6px', fontSize: '11.5px', fontWeight: '800', color: '#92400e', border: '1px solid #fde68a' }}>
                      0% (Bill of Supply - Non-GST)
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Product Image URL</label>
                <input 
                  type="url" 
                  placeholder="https://images.unsplash.com/..."
                  value={newProdImage}
                  onChange={(e) => setNewProdImage(e.target.value)}
                  style={{ width: '100%', height: '40px', padding: '0 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Product Description / Features</label>
                <textarea 
                  placeholder="Key features, warranty specifications, and box contents..."
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  style={{ width: '100%', height: '70px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
              </div>

              <button 
                type="submit"
                style={{ width: '100%', height: '44px', background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)', color: '#ffffff', borderRadius: '10px', border: 'none', fontWeight: '800', fontSize: '14px', cursor: 'pointer', marginTop: '6px' }}
              >
                Publish Live to Storefront
              </button>
            </form>

          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* MODAL 4: QUICK INLINE STOCK & PRICE EDITOR                    */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {isQuickEditModalOpen && selectedEditProduct && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '400px', padding: '26px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#0f172a' }}>
                Quick Update: {selectedEditProduct.name?.slice(0, 24)}...
              </h3>
              <button 
                onClick={() => setIsQuickEditModalOpen(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuickEdit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Selling Price (₹)</label>
                <input 
                  type="number" 
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  required
                  style={{ width: '100%', height: '40px', padding: '0 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Available Stock Units</label>
                <input 
                  type="number" 
                  value={editStock}
                  onChange={(e) => setEditStock(e.target.value)}
                  required
                  style={{ width: '100%', height: '40px', padding: '0 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <button 
                type="submit"
                style={{ width: '100%', height: '42px', background: '#2563eb', color: '#ffffff', borderRadius: '8px', border: 'none', fontWeight: '800', fontSize: '13.5px', cursor: 'pointer', marginTop: '4px' }}
              >
                Save Live Changes
              </button>
            </form>

          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* MODAL 5: QR CODE DOWNLOAD                                     */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {isQrModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '380px', padding: '30px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>
              {currentSeller.shopName || 'Storefront QR'}
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 16px 0' }}>
              Display at your retail counter or package inserts. Customers scan to open your official catalog!
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
                style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: '#2563eb', color: '#ffffff', fontWeight: '800', cursor: 'pointer' }}
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* MODAL 6: BULK PRODUCT UPLOAD                                  */}
      {/* ═════════════════════════════════════════════════════════════ */}
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
