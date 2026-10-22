"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useApp } from '../context/AppContext';
import { CATEGORIES } from '../utils/constants';
import { 
  Search, 
  ShoppingCart, 
  User, 
  ChevronDown, 
  Layers, 
  LogOut, 
  Award,
  CircleDollarSign,
  Heart,
  Store,
  Mic,
  Package,
  MapPin,
  Sparkles,
  CheckCircle2,
  X,
  Smartphone,
  Headphones,
  Shirt,
  Home as HomeIcon,
  Flame,
  Coins,
  ChevronRight,
  Truck,
  ShieldCheck,
  Zap,
  HelpCircle
} from 'lucide-react';
import '../assets/styles/navbar.css';
import { normalizeSearchQuery } from '../utils/searchHelper';
import LanguageToggle from './LanguageToggle';
import PincodeModal from './PincodeModal';
import { useLanguage } from '../context/LanguageContext';
import BrandLogo from './BrandLogo';

const SEARCH_PLACEHOLDERS = [
  "Search for 'Signature Wireless ANC Earphones'...",
  "Search for 'Bluetooth Audio & Soundbars'...",
  "Search for 'Smartphones & 5G Mobiles'...",
  "Search for 'Casual Wear & Sneakers'...",
  "Search for 'Smartwatches & Accessories'..."
];

const MEGA_MENU_CATEGORIES = [
  {
    title: "Electronics & Audio",
    cat: "electronics",
    icon: Headphones,
    items: [
      { name: "True Wireless Earbuds", query: "Earbuds" },
      { name: "Noise Cancelling Headphones", query: "Headphones" },
      { name: "Bluetooth Soundbars & Speakers", query: "Speaker" }
    ]
  },
  {
    title: "Mobiles & 5G",
    cat: "mobiles",
    icon: Smartphone,
    items: [
      { name: "Smartphones", query: "Mobile" },
      { name: "Fast Chargers & Adapters", query: "Charger" },
      { name: "Cables & Accessories", query: "Accessories" }
    ]
  },
  {
    title: "Fashion & Lifestyle",
    cat: "fashion",
    icon: Shirt,
    items: [
      { name: "Apparel & Essentials", query: "Apparel" },
      { name: "Footwear & Shoes", query: "Shoes" }
    ]
  },
  {
    title: "Appliances & Kitchen",
    cat: "appliances",
    icon: HomeIcon,
    items: [
      { name: "Home Living", query: "Living" },
      { name: "Kitchen Appliances", query: "Kitchen" }
    ]
  },
  {
    title: "Beauty & Wellness",
    cat: "beauty",
    icon: Sparkles,
    items: [
      { name: "Skincare & Personal Care", query: "Beauty" },
      { name: "Grooming & Health", query: "Grooming" }
    ]
  },
  {
    title: "Sports & Fitness",
    cat: "sports",
    icon: Award,
    items: [
      { name: "Fitness Gear", query: "Fitness" },
      { name: "Outdoor & Sports", query: "Sports" }
    ]
  }
];

const Navbar = ({ activePage, onNavigate, onNavigateProduct, onSearch, currentCategory, onSelectCategory, onCartClick, style }) => {
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const activeCat = searchParams ? (searchParams.get('category') || currentCategory || 'all') : (currentCategory || 'all');
  const { currentUser, cart, wishlist, logout, products, deliveryLocation, showToast } = useApp();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isPincodeModalOpen, setIsPincodeModalOpen] = useState(false);

  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const headerRef = useRef(null);

  // Measure real header height (varies with safe-area, font scaling, device) and expose as CSS variable
  useEffect(() => {
    const el = headerRef.current;
    if (!el || typeof window === 'undefined') return;
    const applyHeight = () => {
      const h = Math.round(el.getBoundingClientRect().height);
      if (h > 0) document.documentElement.style.setProperty('--navbar-h', `${h}px`);
    };
    applyHeight();
    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(applyHeight);
      ro.observe(el);
    }
    window.addEventListener('resize', applyHeight);
    window.addEventListener('orientationchange', applyHeight);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', applyHeight);
      window.removeEventListener('orientationchange', applyHeight);
    };
  }, []);

  // Close dropdown on outside click or escape key
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [dropdownOpen]);

  // Close menus on navigation
  useEffect(() => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    setMegaMenuOpen(false);
  }, [activePage]);

  // Lock scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') setMobileMenuOpen(false);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = prevOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [mobileMenuOpen]);

  // Rotating search placeholder timer
  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIndex(prev => (prev + 1) % SEARCH_PLACEHOLDERS.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const playBeep = (freq = 800, duration = 0.15) => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {}
  };

  const handleVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      showToast('🎤 Voice search is not supported in this browser. Please use Chrome.', 'info');
      return;
    }
    if (isListening) {
      setIsListening(false);
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    setIsListening(true);
    playBeep(880, 0.15);
    recognition.start();
    recognition.onresult = (event) => {
      playBeep(1200, 0.2);
      const transcript = event.results[0][0].transcript;
      const normalized = normalizeSearchQuery(transcript);
      setSearchQuery(normalized);
      setIsListening(false);
      if (onSearch) onSearch(normalized);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
  };

  useEffect(() => {
    const handleFocusSearch = () => {
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 50);
    };
    window.addEventListener('focus-main-search', handleFocusSearch);
    return () => window.removeEventListener('focus-main-search', handleFocusSearch);
  }, []);

  const availableMegaCategories = React.useMemo(() => {
    const activeCats = new Set(
      (Array.isArray(products) ? products : [])
        .filter(p => p && (Number(p.stock) > 0 || p.inStock) && (p.status === 'published' || p.status === 'active') && !p.isArchived)
        .map(p => (p.category || '').toLowerCase().trim())
        .filter(Boolean)
    );
    return MEGA_MENU_CATEGORIES.map(cat => ({
      ...cat,
      hasStock: activeCats.has(cat.cat.toLowerCase())
    }));
  }, [products]);

  const cartCount = Array.isArray(cart) ? cart.reduce((acc, item) => acc + (Number(item?.quantity) || 1), 0) : 0;
  const wishlistCount = Array.isArray(wishlist) ? wishlist.length : 0;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const normalized = normalizeSearchQuery(searchQuery);
    if (normalized !== searchQuery) {
      setSearchQuery(normalized);
    }
    onSearch(normalized);
    setShowSuggestions(false);
  };

  const handleCategoryClick = (catId) => {
    setMegaMenuOpen(false);
    onSelectCategory(catId);
    if (activePage !== 'home' && activePage !== 'catalog') {
      onNavigate('');
    }
  };

  // User display name resolution
  const userFullName = (typeof currentUser?.fullName === 'string' && currentUser.fullName.trim())
    || (typeof currentUser?.name === 'string' && currentUser.name.trim())
    || (typeof currentUser?.username === 'string' && currentUser.username.trim())
    || 'Customer';
  const firstName = userFullName.split(' ')[0];
  const currentUserInitial = firstName.charAt(0).toUpperCase();

  return (
    <>
      <header ref={headerRef} className="navbar-header" role="banner" style={style}>

        {/* 🌟 1. TOP UTILITY STRIP (Desktop & Tablet) */}
        <div className="navbar-top-strip">
          <div className="navbar-top-container">
            {/* Left side benefits */}
            <div className="navbar-top-left">
              <span className="top-benefit-item">
                <Truck size={13} color="#f59e0b" />
                <span><strong>FREE Delivery</strong> on orders ₹499+</span>
              </span>
              <span className="top-strip-divider">•</span>
              <span className="top-benefit-item">
                <ShieldCheck size={13} color="#10b981" />
                <span>100% Genuine Products • 7-Day Doorstep Returns</span>
              </span>
              <span className="top-strip-divider">•</span>
              <span className="top-benefit-item">
                <Zap size={13} color="#fbbf24" />
                <span>Express COD Available India-Wide</span>
              </span>
            </div>

            {/* Right side links */}
            <div className="navbar-top-right">
              <a 
                href="/seller" 
                onClick={(e) => { e.preventDefault(); onNavigate('seller'); }} 
                className="top-link seller-badge-link"
                title="Open your store on AbKharido"
              >
                <Store size={13} />
                <span>Sell on AbKharido</span>
                <span className="top-pill-free">Zero Fee</span>
              </a>
              <span className="top-strip-divider">|</span>
              <a 
                href="/orders" 
                onClick={(e) => { e.preventDefault(); onNavigate('orders'); }} 
                className="top-link"
              >
                <Package size={13} />
                <span>Track Order</span>
              </a>
              <span className="top-strip-divider">|</span>
              <a 
                href="/support" 
                onClick={(e) => { e.preventDefault(); onNavigate('support'); }} 
                className="top-link"
              >
                <HelpCircle size={13} />
                <span>24/7 Support</span>
              </a>
              <span className="top-strip-divider">|</span>
              <LanguageToggle />
            </div>
          </div>
        </div>

        {/* 🌟 2. MAIN HEADER BAR */}
        <div className="navbar-main-bar">
          <nav className="navbar-container" aria-label="Main Navigation">
            
            {/* Left: Brand Logo & Delivery Pincode */}
            <div className="navbar-left">
              <a href="/" className="logo-container" aria-label="AbKharido Home" onClick={(e) => { e.preventDefault(); onNavigate('home'); }}>
                <BrandLogo variant="light" size="md" />
              </a>

              {/* Delivery Location Icon Button (Clean Icon Only — No truncated text) */}
              <button 
                type="button"
                className="delivery-location-icon-btn"
                onClick={() => setIsPincodeModalOpen(true)}
                title={`Deliver to: ${deliveryLocation?.displayText || 'Palghar 401404'} (Click to change pincode)`}
                aria-label={`Delivery location: ${deliveryLocation?.displayText || 'Palghar 401404'}`}
              >
                <div className="location-icon-circle">
                  <MapPin size={17} color="#2563eb" />
                </div>
                <span className="location-pulse-dot" />
              </button>

              {/* Category Mega-Menu Trigger (Desktop) */}
              <div 
                className="category-mega-menu-wrapper"
                onMouseEnter={() => setMegaMenuOpen(true)}
                onMouseLeave={() => setMegaMenuOpen(false)}
              >
                <button
                  type="button"
                  className={`category-mega-menu-btn ${megaMenuOpen ? 'active' : ''}`}
                  onClick={() => setMegaMenuOpen(prev => !prev)}
                  aria-expanded={megaMenuOpen}
                  aria-haspopup="true"
                  aria-label="Category mega menu"
                >
                  <Layers size={15} />
                  <span>Categories</span>
                  <ChevronDown size={12} className="category-chevron" />
                </button>

                {/* Mega-Menu Dropdown Panel */}
                {megaMenuOpen && (
                  <div className="mega-menu-dropdown">
                    <div className="dropdown-header-banner mega-menu-banner">
                      <div className="dropdown-avatar-circle" style={{ width: '36px', height: '36px', fontSize: '15px' }}>
                        <Layers size={18} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="dropdown-user-title" style={{ fontSize: '14.5px' }}>Explore Store Departments</div>
                        <div className="dropdown-user-sub">100% Genuine Inventory • Direct Factory Dispatch</div>
                      </div>
                      <span
                        onClick={() => { setMegaMenuOpen(false); onSelectCategory('All'); }}
                        style={{
                          background: 'rgba(255,255,255,0.16)',
                          border: '1px solid rgba(255,255,255,0.28)',
                          color: '#ffffff',
                          fontSize: '11.5px',
                          fontWeight: '800',
                          padding: '6px 12px',
                          borderRadius: '99px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        All Products <ChevronRight size={13} />
                      </span>
                    </div>

                    {availableMegaCategories.length === 0 ? (
                      <div style={{ padding: '24px 16px', textAlign: 'center', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>
                        Catalogue restock in progress. Check back shortly!
                      </div>
                    ) : (
                      <div className="mega-menu-grid">
                        {availableMegaCategories.map((section, sIdx) => {
                          const SectionIcon = section.icon || Layers;
                          const tintClasses = ['blue', 'purple', 'green', 'amber'];
                          const tintClass = tintClasses[sIdx % tintClasses.length];
                          return (
                            <div key={sIdx} className="mega-section-block">
                              <div 
                                onClick={() => { setMegaMenuOpen(false); onSelectCategory(section.cat); }}
                                className="mega-section-header"
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <div className={`dropdown-icon-box ${tintClass}`}>
                                    <SectionIcon size={16} />
                                  </div>
                                  <div>
                                    <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#0f172a', lineHeight: 1.2 }}>{section.title}</div>
                                    <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '600', marginTop: '2px' }}>{section.items.length} curated collections</div>
                                  </div>
                                </div>
                                <span className="mega-view-all-pill">View All <ChevronRight size={12} /></span>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                {section.items.map((item, iIdx) => (
                                  <span
                                    key={iIdx}
                                    onClick={() => {
                                      setMegaMenuOpen(false);
                                      onSearch(item.query);
                                    }}
                                    className="mega-subitem-link"
                                  >
                                    <span>{item.name}</span>
                                    <ChevronRight size={13} className="mega-subitem-chevron" />
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Center: High-Tech Search Bar */}
            <form className="search-form" role="search" aria-label="Sitewide Product Search" onSubmit={handleSearchSubmit}>
              <div className="search-input-wrapper">
                <div className="search-prefix-icon">
                  <Search size={17} />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  id="main-store-search"
                  className="search-input"
                  aria-label="Search products, brands, or categories"
                  placeholder={isListening ? "🎙️ Listening... Speak product name now..." : SEARCH_PLACEHOLDERS[placeholderIndex]}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 250)}
                />
                {searchQuery && !isListening && (
                  <button 
                    type="button" 
                    className="search-clear-btn"
                    aria-label="Clear search input"
                    onClick={() => { setSearchQuery(''); if (searchInputRef.current) searchInputRef.current.focus(); }}
                  >
                    ✕
                  </button>
                )}
                <button
                  type="button"
                  className={`search-mic-btn ${isListening ? 'active-listening' : ''}`}
                  onClick={handleVoiceSearch}
                  title="Search by voice"
                  aria-label={isListening ? "Listening to voice input" : "Search by voice"}
                >
                  <Mic size={15} />
                </button>
                <button type="submit" className="search-submit-btn" aria-label="Submit Search">
                  <span>Search</span>
                  <Search size={14} />
                </button>
              </div>

              {/* Active Voice Listening Dialog Banner */}
              {isListening && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  left: 0,
                  right: 0,
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  padding: '14px 16px',
                  borderRadius: '16px',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  boxShadow: '0 16px 40px rgba(9, 13, 22, 0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  zIndex: 9999
                }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1.5px solid #ef4444',
                    flexShrink: 0
                  }}>
                    <Mic size={18} color="#ef4444" style={{ animation: 'pulse 0.6s infinite' }} />
                  </div>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontSize: '13px', fontWeight: '900', color: '#f8fafc', letterSpacing: '-0.2px' }}>
                      🎙️ Listening... Boliye kya chahiye!
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px', fontWeight: '500' }}>
                      E.g. &quot;Wireless Earbuds&quot;, &quot;Shoes&quot;, &quot;Smartwatch&quot;, ya &quot;Tshirt&quot;
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setIsListening(false)}
                    style={{
                      background: 'rgba(255,255,255,0.12)',
                      border: '1px solid rgba(255,255,255,0.25)',
                      color: '#ffffff',
                      padding: '6px 12px',
                      borderRadius: '100px',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Auto-Suggestions Dropdown */}
              {showSuggestions && products && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: '#ffffff',
                  borderRadius: '20px',
                  boxShadow: '0 20px 45px rgba(15, 23, 42, 0.2), 0 4px 12px rgba(15, 23, 42, 0.06)',
                  marginTop: '10px',
                  maxHeight: '420px',
                  overflowY: 'auto',
                  zIndex: 1100,
                  border: '1px solid #e2e8f0',
                  padding: '8px'
                }}>
                  <div className="dropdown-header-banner" style={{ padding: '12px 14px', marginBottom: '8px', borderRadius: '14px' }}>
                    <div className="dropdown-avatar-circle" style={{ width: '32px', height: '32px', fontSize: '13px' }}>
                      <Sparkles size={15} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="dropdown-user-title" style={{ fontSize: '13px' }}>
                        {!searchQuery.trim() ? 'Discover Curated Tech & Lifestyle' : `Instant Search Results`}
                      </div>
                      <div className="dropdown-user-sub" style={{ fontSize: '11px' }}>
                        {!searchQuery.trim() ? 'Popular keywords & top-rated express inventory' : `Showing live matches for "${searchQuery}"`}
                      </div>
                    </div>
                  </div>

                  {!searchQuery.trim() ? (
                    <div style={{ padding: '4px 6px' }}>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Flame size={14} color="#f59e0b" /> Trending Searches
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                        {["Wireless Audio", "Bluetooth Earphones", "ANC Headphones", "5G Mobiles", "Smartwatch"].map((tag, i) => (
                          <span
                            key={i}
                            onMouseDown={() => {
                              setSearchQuery(tag);
                              onSearch(tag);
                              setShowSuggestions(false);
                            }}
                            style={{ background: '#f8fafc', color: '#0f172a', padding: '6px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', border: '1px solid #e2e8f0', display: 'inline-flex', alignItems: 'center', gap: '5px', transition: 'all 0.15s ease' }}
                          >
                            <Search size={12} color="#2563eb" /> {tag}
                          </span>
                        ))}
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--brand-accent)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Sparkles size={14} color="var(--brand-accent)" /> Featured Inventory
                      </div>
                      {products.slice(0, 3).map((p, idx) => (
                        <div 
                          key={p?.id || `trending-${idx}`}
                          onMouseDown={() => { if (p?.id) onNavigateProduct(p.id); setShowSuggestions(false); }}
                          className="dropdown-item"
                          style={{ padding: '8px 10px' }}
                        >
                          <img src={p?.image || ''} alt={p?.name || 'Product'} style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '10px', background: '#f8fafc', padding: '4px', border: '1px solid #e2e8f0', flexShrink: 0 }} />
                          <div style={{ flex: 1, overflow: 'hidden' }}>
                            <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: "'Outfit', sans-serif" }}>{p?.name || 'Product'}</div>
                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>In {p?.category || 'Catalog'} • Express Dispatch</div>
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: '900', color: '#059669', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '4px 8px', borderRadius: '8px', flexShrink: 0 }}>₹{(p?.price || 0).toLocaleString('en-IN')}</span>
                          <ChevronRight size={14} color="#94a3b8" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    (() => {
                      const matches = products.filter(p => {
                        if (!p) return false;
                        const name = p.name ? p.name.toLowerCase() : '';
                        const category = p.category ? p.category.toLowerCase() : '';
                        const desc = p.description ? p.description.toLowerCase() : '';
                        const query = normalizeSearchQuery(searchQuery.toLowerCase());
                        return name.includes(query) || category.includes(query) || desc.includes(query);
                      }).slice(0, 6);
                      
                      return matches.length > 0 ? (
                        <div style={{ padding: '2px 4px' }}>
                          {matches.map((p, idx) => (
                            <div 
                              key={p?.id || `match-${idx}`} 
                              onMouseDown={() => {
                                if (p?.id) onNavigateProduct(p.id);
                                setSearchQuery('');
                                setShowSuggestions(false);
                              }}
                              className="dropdown-item"
                              style={{ padding: '8px 10px' }}
                            >
                              <img src={p?.image || ''} alt={p?.name || 'Product'} style={{ width: '42px', height: '42px', objectFit: 'contain', borderRadius: '10px', background: '#ffffff', border: '1px solid #e2e8f0', padding: '3px', flexShrink: 0 }} />
                              <div style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'left' }}>
                                <div style={{ fontWeight: '800', color: '#090d16', fontSize: '13px', fontFamily: "'Outfit', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis' }}>{p?.name || 'Product'}</div>
                                <span style={{ color: '#2563eb', fontSize: '11px', fontWeight: '700' }}>💎 Verified Genuine • {p?.category || 'General'}</span>
                              </div>
                              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <div style={{ fontSize: '13.5px', fontWeight: '900', color: '#059669' }}>₹{(p?.price || 0).toLocaleString('en-IN')}</div>
                                {(p?.originalPrice || 0) > (p?.price || 0) && (
                                  <div style={{ fontSize: '10.5px', color: '#94a3b8', textDecoration: 'line-through' }}>₹{(p.originalPrice || 0).toLocaleString('en-IN')}</div>
                                )}
                              </div>
                              <ChevronRight size={14} color="#94a3b8" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ padding: '20px 16px', textAlign: 'center', color: '#64748b', fontWeight: '700', fontSize: '13px' }}>
                          No instant matches found for &quot;{searchQuery}&quot;. Press enter for deep catalog search!
                        </div>
                      );
                    })()
                  )}
                </div>
              )}
            </form>

            {/* Right: Actions (Coins, Wishlist, Cart, User / Login) */}
            <div className="navbar-right">

              {/* VIP Coins Pill (Logged In) */}
              {currentUser && (
                <a 
                  href="/profile?tab=rewards" 
                  onClick={(e) => { e.preventDefault(); onNavigate('profile?tab=rewards'); }}
                  className="nav-coins-pill"
                  title="Your AbKharido Rewards Coins"
                >
                  <Coins size={16} color="#d97706" />
                  <span>{currentUser.walletCoins !== undefined ? currentUser.walletCoins : 100}</span>
                </a>
              )}

              {/* Cart Link with Live Counter Badge */}
              <a 
                href="/cart" 
                className="nav-action-btn cart-btn" 
                aria-label={`Shopping Cart, ${cartCount} items`}
                title="View Shopping Cart"
                onClick={(e) => { 
                  e.preventDefault(); 
                  if (onCartClick) {
                    onCartClick();
                  } else {
                    onNavigate('cart');
                  }
                }}
              >
                <div className="nav-action-icon-wrap">
                  <ShoppingCart size={20} color="#ffffff" />
                  {cartCount > 0 && <span className="nav-badge">{cartCount}</span>}
                </div>
                <span className="cart-btn-label">Cart</span>
              </a>

              {/* User Account / Login */}
              {currentUser ? (
                <div 
                  ref={dropdownRef}
                  className="user-profile-menu-wrap"
                  onMouseEnter={() => {
                    if (typeof window !== 'undefined' && window.innerWidth > 768) {
                      setDropdownOpen(true);
                    }
                  }}
                  onMouseLeave={() => {
                    if (typeof window !== 'undefined' && window.innerWidth > 768) {
                      setDropdownOpen(false);
                    }
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
                      setMobileMenuOpen(true);
                      return;
                    }
                    setDropdownOpen(!dropdownOpen);
                  }}
                >
                  <div className={`user-profile-pill ${dropdownOpen ? 'active' : ''}`}>
                    <div className="user-avatar-circle">
                      {currentUserInitial}
                    </div>
                    <div className="user-pill-text">
                      <span className="user-pill-greet">Hello,</span>
                      <span className="user-pill-name">{firstName}</span>
                    </div>
                    <ChevronDown size={12} className="user-pill-chevron" />
                  </div>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div className="dropdown-menu">
                      <div className="dropdown-header-banner">
                        <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#fbbf24', color: '#1e1b4b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '900', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                          {currentUserInitial}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ color: '#ffffff', fontSize: '15px', fontWeight: '800', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{userFullName}</div>
                          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '11.5px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{currentUser.email || currentUser.phone || 'VIP Indian Member'}</div>
                        </div>
                      </div>

                      <div style={{ padding: '10px' }}>
                        {currentUser.isInfluencer ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', color: '#059669', fontWeight: '800', fontSize: '13px', marginBottom: '6px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                            <CircleDollarSign size={18} color="#059669" /> 
                            <span>Withdrawable: ₹{(currentUser.walletCash || 0).toFixed(2)}</span>
                          </div>
                        ) : (
                          <a href="#rewards" onClick={(e) => { e.preventDefault(); setDropdownOpen(false); onNavigate('profile?tab=rewards'); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', borderRadius: '12px', color: '#b45309', fontWeight: '800', fontSize: '13.5px', marginBottom: '8px', border: '1px solid #fde68a', textDecoration: 'none', cursor: 'pointer' }}>
                            <Coins size={22} color="#d97706" /> 
                            <div style={{ flex: 1 }}>
                              <div style={{ color: '#92400e', lineHeight: 1.2, fontSize: '13px' }}>My Coins: <span style={{ color: '#d97706', fontWeight: '900', fontSize: '16px', marginLeft: '2px' }}>{currentUser.walletCoins !== undefined ? currentUser.walletCoins : 100}</span></div>
                              <div style={{ fontSize: '10px', color: '#b45309', fontWeight: '700', marginTop: '2px' }}>✨ View &amp; Redeem rewards &gt;</div>
                            </div>
                          </a>
                        )}

                        {currentUser.isInfluencer && (
                          <a href="#partner-center" className="dropdown-item" onClick={(e) => { e.preventDefault(); setDropdownOpen(false); onNavigate('partner'); }}>
                            <div className="dropdown-icon-box" style={{ background: '#ecfdf5', color: '#059669' }}><Award size={16} /></div>
                            <span style={{ fontWeight: '600' }}>Creator Dashboard</span>
                          </a>
                        )}

                        <a href="#profile" className="dropdown-item" onClick={(e) => { e.preventDefault(); setDropdownOpen(false); onNavigate('profile'); }}>
                          <div className="dropdown-icon-box" style={{ background: '#eff6ff', color: '#2563eb' }}><User size={16} /></div>
                          <span style={{ fontWeight: '600', color: '#1e293b' }}>My Profile</span>
                        </a>

                        <a href="#wishlist" className="dropdown-item" onClick={(e) => { e.preventDefault(); setDropdownOpen(false); onNavigate('profile?tab=wishlist'); }}>
                          <div className="dropdown-icon-box" style={{ background: '#fef2f2', color: '#dc2626' }}><Heart size={16} fill="#dc2626" /></div>
                          <span style={{ fontWeight: '600', color: '#1e293b' }}>My Wishlist ({wishlistCount})</span>
                        </a>

                        <a href="#orders" className="dropdown-item" onClick={(e) => { e.preventDefault(); setDropdownOpen(false); onNavigate('orders'); }}>
                          <div className="dropdown-icon-box" style={{ background: '#f0fdf4', color: '#16a34a' }}><Package size={16} /></div>
                          <span style={{ fontWeight: '600', color: '#1e293b' }}>My Orders</span>
                        </a>

                        <a href="#seller" className="dropdown-item" onClick={(e) => { e.preventDefault(); setDropdownOpen(false); onNavigate('seller'); }}>
                          <div className="dropdown-icon-box" style={{ background: '#faf5ff', color: '#9333ea' }}><Store size={16} /></div>
                          <span style={{ fontWeight: '600', color: '#1e293b' }}>Sell on AbKharido</span>
                        </a>

                        <div style={{ height: '1px', background: '#f1f5f9', margin: '8px 0' }}></div>

                        <button className="dropdown-item" onClick={() => { setDropdownOpen(false); logout(); }} style={{ color: '#e11d48', width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', padding: '10px 12px', borderRadius: '10px' }}>
                          <div className="dropdown-icon-box" style={{ background: '#fff1f2', color: '#e11d48' }}><LogOut size={16} /></div>
                          <span style={{ fontWeight: '700' }}>Logout Account</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* High-Conversion Sign-In Button (Logged Out) */
                <a 
                  href="/login" 
                  className="login-action-btn"
                  onClick={(e) => { e.preventDefault(); onNavigate('login'); }}
                >
                  <User size={18} />
                  <div className="login-btn-text">
                    <span className="login-subtext">HELLO, GUEST</span>
                    <span className="login-maintext">{t('login', 'Sign In')}</span>
                  </div>
                </a>
              )}

            </div>
          </nav>
        </div>

      </header>

      {/* 📍 Pincode Serviceability & Delivery Modal */}
      <PincodeModal 
        isOpen={isPincodeModalOpen} 
        onClose={() => setIsPincodeModalOpen(false)} 
      />

      {/* 📱 Luxury Mobile Account Action Sheet (Bottom Drawer) */}
      {mobileMenuOpen && currentUser && (
        <div 
          className="mobile-profile-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="User Account Menu"
        >
          <div 
            className="mobile-profile-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Handle */}
            <div className="mobile-sheet-handle" />

            {/* User Profile Card */}
            <div className="mobile-sheet-header">
              <div className="mobile-sheet-avatar">
                {currentUserInitial}
              </div>
              <div className="mobile-sheet-userinfo">
                <div className="mobile-sheet-name">{userFullName}</div>
                <div className="mobile-sheet-email">{currentUser.email || currentUser.phone || 'VIP Member'}</div>
              </div>
              <button 
                type="button" 
                className="mobile-sheet-close-btn" 
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>

            {/* Coins / Rewards Card */}
            {currentUser.isInfluencer ? (
              <div className="mobile-sheet-creator-card">
                <CircleDollarSign size={20} color="#059669" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '11px', color: '#047857', fontWeight: '700' }}>CREATOR WALLET</div>
                  <div style={{ fontSize: '15px', color: '#065f46', fontWeight: '900' }}>Withdrawable: ₹{(currentUser.walletCash || 0).toFixed(2)}</div>
                </div>
                <button 
                  type="button" 
                  onClick={() => { setMobileMenuOpen(false); onNavigate('partner'); }}
                  className="mobile-sheet-creator-btn"
                >
                  Dashboard &gt;
                </button>
              </div>
            ) : (
              <div 
                className="mobile-sheet-coins-card"
                onClick={() => { setMobileMenuOpen(false); onNavigate('profile?tab=rewards'); }}
              >
                <div className="mobile-sheet-coins-icon">
                  <Coins size={22} color="#d97706" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#92400e', fontSize: '13px', fontWeight: '700' }}>
                    AbKharido Coins: <span style={{ color: '#b45309', fontWeight: '900', fontSize: '16px' }}>{currentUser.walletCoins !== undefined ? currentUser.walletCoins : 100}</span>
                  </div>
                  <div style={{ color: '#b45309', fontSize: '11px', fontWeight: '600', marginTop: '2px' }}>
                    ✨ Tap to view &amp; redeem discounts &gt;
                  </div>
                </div>
              </div>
            )}

            {/* Menu Navigation Items */}
            <div className="mobile-sheet-menu-list">
              <button 
                type="button"
                className="mobile-sheet-item"
                onClick={() => { setMobileMenuOpen(false); onNavigate('profile'); }}
              >
                <div className="mobile-sheet-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
                  <User size={18} />
                </div>
                <div className="mobile-sheet-item-text">
                  <span className="mobile-sheet-item-title">My Profile</span>
                  <span className="mobile-sheet-item-subtitle">Manage personal info, phone &amp; addresses</span>
                </div>
                <ChevronRight size={18} color="#94a3b8" />
              </button>

              <button 
                type="button"
                className="mobile-sheet-item"
                onClick={() => { setMobileMenuOpen(false); onNavigate('orders'); }}
              >
                <div className="mobile-sheet-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>
                  <Package size={18} />
                </div>
                <div className="mobile-sheet-item-text">
                  <span className="mobile-sheet-item-title">My Orders</span>
                  <span className="mobile-sheet-item-subtitle">Track, return &amp; cancel active orders</span>
                </div>
                <ChevronRight size={18} color="#94a3b8" />
              </button>

              <button 
                type="button"
                className="mobile-sheet-item"
                onClick={() => { setMobileMenuOpen(false); onNavigate('profile?tab=wishlist'); }}
              >
                <div className="mobile-sheet-icon" style={{ background: '#fef2f2', color: '#dc2626' }}>
                  <Heart size={18} fill="#dc2626" />
                </div>
                <div className="mobile-sheet-item-text">
                  <span className="mobile-sheet-item-title">My Wishlist ({wishlistCount})</span>
                  <span className="mobile-sheet-item-subtitle">Items saved for future shopping</span>
                </div>
                <ChevronRight size={18} color="#94a3b8" />
              </button>

              {currentUser.isInfluencer && (
                <button 
                  type="button"
                  className="mobile-sheet-item"
                  onClick={() => { setMobileMenuOpen(false); onNavigate('partner'); }}
                >
                  <div className="mobile-sheet-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
                    <Award size={18} />
                  </div>
                  <div className="mobile-sheet-item-text">
                    <span className="mobile-sheet-item-title">Creator Dashboard</span>
                    <span className="mobile-sheet-item-subtitle">Partner earnings, links &amp; analytics</span>
                  </div>
                  <ChevronRight size={18} color="#94a3b8" />
                </button>
              )}

              <button 
                type="button"
                className="mobile-sheet-item"
                onClick={() => { setMobileMenuOpen(false); onNavigate('seller'); }}
              >
                <div className="mobile-sheet-icon" style={{ background: '#faf5ff', color: '#9333ea' }}>
                  <Store size={18} />
                </div>
                <div className="mobile-sheet-item-text">
                  <span className="mobile-sheet-item-title">Sell on AbKharido</span>
                  <span className="mobile-sheet-item-subtitle">Grow your business as verified seller</span>
                </div>
                <ChevronRight size={18} color="#94a3b8" />
              </button>
            </div>

            {/* Logout Action */}
            <div className="mobile-sheet-footer">
              <button 
                type="button"
                className="mobile-sheet-logout-btn"
                onClick={() => { setMobileMenuOpen(false); logout(); }}
              >
                <LogOut size={18} />
                <span>Logout Account</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
