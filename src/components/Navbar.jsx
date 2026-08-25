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
  X
} from 'lucide-react';
import '../assets/styles/navbar.css';
import { normalizeSearchQuery } from '../utils/searchHelper';
import LanguageToggle from './LanguageToggle';
import PincodeModal from './PincodeModal';
import { useLanguage } from '../context/LanguageContext';

const SEARCH_PLACEHOLDERS = [
  "Search for 'iPhone 16 Pro'...",
  "Search for 'Nike Running Shoes'...",
  "Search for 'Sony Spatial Headphones'...",
  "Search for 'Designer Silk Saree'...",
  "Search for 'Smart Air Conditioner'...",
  "Search for 'Fast Wireless Chargers'..."
];

const MEGA_MENU_CATEGORIES = [
  {
    title: "📱 Mobiles & Tablets",
    cat: "mobiles",
    items: [
      { name: "5G Flagship Smartphones", query: "5G Mobile" },
      { name: "Budget & Mid-Range Phones", query: "Smartphone" },
      { name: "Fast Chargers & Adapters", query: "Charger" },
      { name: "Powerbanks & Cables", query: "Powerbank" },
      { name: "Protective Cases & Glass", query: "Case" }
    ]
  },
  {
    title: "🎧 Electronics & Audio",
    cat: "electronics",
    items: [
      { name: "True Wireless Earbuds", query: "Earbuds" },
      { name: "Noise Cancelling Headphones", query: "Headphones" },
      { name: "Bluetooth Soundbars", query: "Speaker" },
      { name: "Smart Fitness Watches", query: "Smartwatch" },
      { name: "Laptops & Hubs", query: "Laptop" }
    ]
  },
  {
    title: "👗 Fashion & Lifestyle",
    cat: "fashion",
    items: [
      { name: "Men's Luxury T-Shirts & Shirts", query: "Shirt" },
      { name: "Women's Ethnic & Western Wear", query: "Dress" },
      { name: "Athletic & Running Shoes", query: "Shoes" },
      { name: "Designer Sunglasses & Belts", query: "Accessories" },
      { name: "Titanium Chronograph Watches", query: "Watch" }
    ]
  },
  {
    title: "🏠 Home Appliances",
    cat: "home",
    items: [
      { name: "Smart 4K Ultra HD TVs", query: "TV" },
      { name: "Kitchen Air Fryers & Mixers", query: "Kitchen" },
      { name: "Robotic & Hand Vacuums", query: "Vacuum" },
      { name: "Smart Lighting & Lamps", query: "Lighting" },
      { name: "Air Purifiers & Coolers", query: "Air Purifier" }
    ]
  }
];

const Navbar = ({ activePage, onNavigate, onNavigateProduct, onSearch, currentCategory, onSelectCategory, onCartClick, style }) => {
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const activeCat = searchParams ? (searchParams.get('category') || currentCategory || 'all') : (currentCategory || 'all');
  // eslint-disable-next-line
  const { currentUser, cart, logout, resetDatabase, products, deliveryLocation } = useApp();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const searchInputRef = useRef(null);

  // Delivery Pincode Modal State
  const [isPincodeModalOpen, setIsPincodeModalOpen] = useState(false);

  // Load saved delivery pincode
  useEffect(() => {
    try {
      const savedPin = localStorage.getItem('abkharido_delivery_pincode');
      const savedCity = localStorage.getItem('abkharido_delivery_city');
      if (savedPin) setDeliveryPincode(savedPin);
      if (savedCity) setDeliveryCity(savedCity);
    } catch (e) {}
  }, []);

  // Rotating search placeholder timer
  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIndex(prev => (prev + 1) % SEARCH_PLACEHOLDERS.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const handlePincodeLookup = async (pin) => {
    setTempPincode(pin);
    setPincodeMessage('');
    if (pin.length === 6 && /^\d+$/.test(pin)) {
      setPincodeLoading(true);
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
        const data = await res.json();
        if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
          const po = data[0].PostOffice[0];
          const city = po.District || po.Block || po.Circle || 'India';
          setDeliveryPincode(pin);
          setDeliveryCity(city);
          localStorage.setItem('abkharido_delivery_pincode', pin);
          localStorage.setItem('abkharido_delivery_city', city);
          setPincodeMessage(`✅ Deliverable to ${city} via Express (24-48 hrs)!`);
          setTimeout(() => {
            setIsPincodeModalOpen(false);
            setPincodeMessage('');
          }, 1200);
        } else {
          setPincodeMessage('⚠️ Pincode not found. Saved as standard delivery area.');
          setDeliveryPincode(pin);
          localStorage.setItem('abkharido_delivery_pincode', pin);
        }
      } catch (e) {
        setDeliveryPincode(pin);
        localStorage.setItem('abkharido_delivery_pincode', pin);
        setIsPincodeModalOpen(false);
      } finally {
        setPincodeLoading(false);
      }
    }
  };

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
      alert('Voice search is not supported in this browser. Please use Chrome.');
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

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

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
    onSelectCategory(catId);
    if (activePage !== 'home' && activePage !== 'catalog') {
      onNavigate('');
    }
  };

  return (
    <>
      <header className="navbar-header" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, ...style }}>
        <div className="navbar-container">
          
          <div className="navbar-left" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Logo */}
            <a href="#" className="logo-container" onClick={(e) => { e.preventDefault(); onNavigate('home'); }}>
              <span className="logo-text">
                AbKharido<span className="logo-plus">.com</span>
              </span>
              <span className="logo-sub">
                Direct Buy <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>& Earn</span>
              </span>
            </a>

            {/* 📍 Pincode / Delivery Location Selector */}
            <div 
              className="delivery-pincode-badge"
              onClick={() => setIsPincodeModalOpen(true)}
              title="Click to change your delivery pincode"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 10px',
                borderRadius: '10px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <MapPin size={15} color="#4f46e5" />
              <div style={{ textAlign: 'left', lineHeight: 1.15 }}>
                <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>Deliver to</div>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a' }}>
                  {deliveryLocation?.displayText || 'Palghar 401404'}
                </div>
              </div>
            </div>

            {/* 🗂️ Category Mega-Menu Trigger */}
            <div 
              className="category-mega-menu-wrapper"
              onMouseEnter={() => setMegaMenuOpen(true)}
              onMouseLeave={() => setMegaMenuOpen(false)}
              style={{ position: 'relative' }}
            >
              <button
                type="button"
                onClick={() => setMegaMenuOpen(prev => !prev)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: megaMenuOpen ? '#eff6ff' : 'none',
                  border: '1px solid',
                  borderColor: megaMenuOpen ? '#bfdbfe' : 'transparent',
                  color: megaMenuOpen ? '#2563eb' : '#334155',
                  padding: '6px 10px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <Layers size={15} color={megaMenuOpen ? '#2563eb' : '#64748b'} />
                <span>Categories</span>
                <ChevronDown size={13} style={{ transform: megaMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>

              {/* Mega-Menu Dropdown Panel */}
              {megaMenuOpen && (
                <div 
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    width: '680px',
                    backgroundColor: '#ffffff',
                    borderRadius: '20px',
                    boxShadow: '0 20px 40px rgba(9, 13, 22, 0.15)',
                    border: '1.5px solid #e2e8f0',
                    padding: '20px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '20px',
                    zIndex: 1200,
                    marginTop: '8px'
                  }}
                >
                  {MEGA_MENU_CATEGORIES.map((section, sIdx) => (
                    <div key={sIdx} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div 
                        onClick={() => { setMegaMenuOpen(false); onSelectCategory(section.cat); }}
                        style={{ fontSize: '13.5px', fontWeight: '900', color: '#0f172a', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      >
                        <span>{section.title}</span>
                        <span style={{ fontSize: '11px', color: '#4f46e5', fontWeight: '800' }}>View All →</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {section.items.map((item, iIdx) => (
                          <span
                            key={iIdx}
                            onClick={() => {
                              setMegaMenuOpen(false);
                              onSearch(item.query);
                            }}
                            style={{ fontSize: '12.5px', color: '#475569', fontWeight: '500', cursor: 'pointer', padding: '3px 6px', borderRadius: '6px', transition: 'all 0.15s' }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.color = '#4f46e5'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#475569'; }}
                          >
                            • {item.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Search form */}
          <form className="search-form" onSubmit={handleSearchSubmit}>
            <div className="search-input-wrapper" style={{ position: 'relative', border: isListening ? '1.5px solid #ef4444' : undefined, boxShadow: isListening ? '0 0 16px rgba(239, 68, 68, 0.35)' : undefined, transition: 'all 0.3s ease' }}>
              <input
                ref={searchInputRef}
                type="text"
                className="search-input"
                placeholder={isListening ? "🎙️ Listening... Speak product name now..." : SEARCH_PLACEHOLDERS[placeholderIndex]}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 250)}
                style={{ paddingRight: searchQuery ? '88px' : '62px', background: isListening ? 'rgba(239, 68, 68, 0.04)' : undefined }}
              />
              {searchQuery && !isListening && (
                <button 
                  type="button" 
                  onClick={() => { setSearchQuery(''); if (searchInputRef.current) searchInputRef.current.focus(); }}
                  style={{ position: 'absolute', right: '64px', top: '50%', transform: 'translateY(-50%)', background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '22px', height: '22px', color: '#64748b', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 6, transition: 'all 0.2s' }}
                >
                  ✕
                </button>
              )}
              {/* Voice Search Mic Button - cleanly spaced to never overlap clear button */}
              <button
                type="button"
                onClick={handleVoiceSearch}
                title="Search by voice"
                style={{
                  position: 'absolute',
                  right: '34px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: isListening ? '#ef4444' : 'rgba(241, 245, 249, 0.8)',
                  color: isListening ? '#ffffff' : '#475569',
                  border: isListening ? '1px solid #dc2626' : '1px solid #e2e8f0',
                  borderRadius: '100px',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: isListening ? '0 0 12px rgba(239, 68, 68, 0.6)' : 'none',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  zIndex: 5
                }}
              >
                <Mic size={14} style={{ animation: isListening ? 'pulse 0.8s infinite' : 'none' }} />
              </button>
              <button type="submit" className="search-button">
                <Search size={18} />
              </button>
            </div>
            {/* Active Voice Listening Visual Dialog Banner */}
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
                    E.g. &quot;Samsung Mobile&quot;, &quot;Shoes&quot;, &quot;Watch&quot;, ya &quot;Tshirt&quot;
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
                    flexShrink: 0,
                    transition: 'background 0.2s'
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
            {showSuggestions && products && (
              <div className="search-suggestions-dropdown" style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(16px)',
                borderRadius: '20px',
                boxShadow: '0 16px 40px rgba(9, 13, 22, 0.25)',
                marginTop: '8px',
                maxHeight: '360px',
                overflowY: 'auto',
                zIndex: 1100,
                border: '1px solid #e2e8f0',
                padding: '12px 16px'
              }}>
                {!searchQuery.trim() ? (
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                      🔥 Trending Searches in India
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                      {["5G AI Smartphone", "Spatial AirPods", "Luxe Couture", "Nike Air Jordan", "Smartwatch 5G"].map((tag, i) => (
                        <span
                          key={i}
                          onMouseDown={() => {
                            setSearchQuery(tag);
                            onSearch(tag);
                            setShowSuggestions(false);
                          }}
                          style={{ background: '#f1f5f9', color: '#0f172a', padding: '6px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', border: '1px solid #e2e8f0' }}
                        >
                          🔍 {tag}
                        </span>
                      ))}
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: '800', color: '#4338ca', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                      💎 Instant VIP Deal Highlights
                    </div>
                    {products.slice(0, 3).map((p, idx) => (
                      <div 
                        key={p?.id || `trending-${idx}`}
                        onMouseDown={() => { if (p?.id) onNavigateProduct(p.id); setShowSuggestions(false); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 4px', cursor: 'pointer', borderBottom: '1px solid #f8fafc', transition: 'background 0.2s' }}
                      >
                        <img src={p?.image || ''} alt={p?.name || 'Product'} style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '10px', background: '#f8fafc', padding: '4px', border: '1px solid #e2e8f0' }} />
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: "'Outfit', sans-serif" }}>{p?.name || 'Product'}</div>
                          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>⚡ Express Ready in {p?.category || 'Catalog'}</div>
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: '900', color: '#059669', background: '#ecfdf5', padding: '4px 8px', borderRadius: '8px' }}>₹{(p?.price || 0).toLocaleString('en-IN')}</span>
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
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Live Matches ({matches.length})</div>
                        {matches.map((p, idx) => (
                          <div 
                            key={p?.id || `match-${idx}`} 
                            className="suggestion-item"
                            onMouseDown={() => {
                              if (p?.id) onNavigateProduct(p.id);
                              setSearchQuery('');
                              setShowSuggestions(false);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              padding: '8px 6px',
                              cursor: 'pointer',
                              borderBottom: '1px solid #f1f5f9',
                              borderRadius: '12px',
                              transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            <img src={p?.image || ''} alt={p?.name || 'Product'} style={{ width: '42px', height: '42px', objectFit: 'contain', borderRadius: '10px', background: '#ffffff', border: '1px solid #e2e8f0', padding: '2px' }} />
                            <div className="suggestion-text" style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'left' }}>
                              <div style={{ fontWeight: '800', color: '#090d16', fontSize: '13px', fontFamily: "'Outfit', sans-serif" }}>{p?.name || 'Product'}</div>
                              <span style={{ color: '#4338ca', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>💎 VIP Deals • {p?.category || 'General'}</span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '14px', fontWeight: '900', color: '#059669' }}>₹{(p?.price || 0).toLocaleString('en-IN')}</div>
                              {(p?.originalPrice || 0) > (p?.price || 0) && (
                                <div style={{ fontSize: '11px', color: '#94a3b8', textDecoration: 'line-through' }}>₹{(p.originalPrice || 0).toLocaleString('en-IN')}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontWeight: '700', fontSize: '13px' }}>
                        No instant matches found for "{searchQuery}". Try pressing enter for deep catalog search!
                      </div>
                    );
                  })()
                )}
              </div>
            )}
          </form>

          <div className="navbar-right">
            <LanguageToggle style={{ marginRight: '6px' }} />
            {currentUser ? (
              /* Profile Dropdown */
              <div 
                className="nav-item" 
                onMouseEnter={() => setDropdownOpen(true)}
                onMouseLeave={() => setDropdownOpen(false)}
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{ position: 'relative' }}
              >
                <User size={18} />
                <span className="nav-text">{currentUser.fullName}</span>
                <ChevronDown size={14} />

                {dropdownOpen && (
                  <div className="dropdown-menu">
                    <div className="dropdown-header-banner" style={{
                      background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4f46e5 100%)',
                      padding: '16px',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      borderBottom: '1px solid rgba(255,255,255,0.1)'
                    }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#fbbf24', color: '#1e1b4b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '900', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                        {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <div className="dropdown-name" style={{ color: '#ffffff', fontSize: '15px', fontWeight: '800', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{currentUser.fullName}</div>
                        <div className="dropdown-email" style={{ color: 'rgba(255,255,255,0.75)', fontSize: '11.5px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{currentUser.email || 'VIP Indian Member'}</div>
                      </div>
                    </div>

                    <div style={{ padding: '10px' }}>
                      {currentUser.isInfluencer ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', color: '#059669', fontWeight: '800', fontSize: '13px', marginBottom: '6px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                          <CircleDollarSign size={18} color="#059669" /> 
                          <span>Withdrawable: ₹{(currentUser.walletCash || 0).toFixed(2)}</span>
                        </div>
                      ) : (
                        <a href="#rewards" onClick={(e) => { e.preventDefault(); setDropdownOpen(false); onNavigate('profile?tab=rewards'); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', borderRadius: '12px', color: '#b45309', fontWeight: '800', fontSize: '13.5px', marginBottom: '8px', border: '1px solid #fde68a', boxShadow: '0 2px 4px rgba(245,158,11,0.06)', textDecoration: 'none', cursor: 'pointer', transition: 'transform 0.2s' }}>
                          <span style={{ fontSize: '22px' }}>🪙</span> 
                          <div style={{ flex: 1 }}>
                            <div style={{ color: '#92400e', lineHeight: 1.2, fontSize: '13px' }}>My Coins: <span style={{ color: '#d97706', fontWeight: '900', fontSize: '16px', marginLeft: '2px' }}>{currentUser.walletCoins !== undefined ? currentUser.walletCoins : 100}</span></div>
                            <div style={{ fontSize: '10px', color: '#b45309', fontWeight: '700', marginTop: '2px' }}>✨ View & Redeem rewards &gt;</div>
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
                        <span style={{ fontWeight: '600', color: '#1e293b' }}>My Wishlist</span>
                      </a>

                      <a href="#orders" className="dropdown-item" onClick={(e) => { e.preventDefault(); setDropdownOpen(false); onNavigate('orders'); }}>
                        <div className="dropdown-icon-box" style={{ background: '#f0fdf4', color: '#16a34a' }}><Package size={16} /></div>
                        <span style={{ fontWeight: '600', color: '#1e293b' }}>My Orders</span>
                      </a>

                      <a href="#seller" className="dropdown-item" onClick={(e) => { e.preventDefault(); setDropdownOpen(false); onNavigate('seller'); }}>
                        <div className="dropdown-icon-box" style={{ background: '#faf5ff', color: '#9333ea' }}><Store size={16} /></div>
                        <span style={{ fontWeight: '600', color: '#1e293b' }}>Sell on AbKharido</span>
                      </a>

                      <div className="dropdown-divider" style={{ margin: '8px 0', borderColor: '#e2e8f0' }}></div>

                      <button className="dropdown-item" onClick={() => { setDropdownOpen(false); logout(); }} style={{ color: '#e11d48', width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', padding: '10px 12px', borderRadius: '10px' }}>
                        <div className="dropdown-icon-box" style={{ background: '#fff1f2', color: '#e11d48' }}><LogOut size={16} /></div>
                        <span style={{ fontWeight: '700' }}>Logout Account</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Login/Signup Button */
              <a 
                href="#login" 
                className="nav-item-btn" 
                onClick={(e) => { e.preventDefault(); onNavigate('login'); }}
                style={{ padding: '6px 20px', fontWeight: 'bold', fontSize: '14px', textDecoration: 'none' }}
              >
                {t('login', 'Login')}
              </a>
            )}

            {/* Cart */}
            <a 
              href="#cart" 
              className="nav-item cart-item" 
              onClick={(e) => { 
                e.preventDefault(); 
                if (onCartClick) {
                  onCartClick();
                } else {
                  onNavigate('cart');
                }
              }}
            >
              <div className="cart-icon-wrapper">
                <ShoppingCart size={20} />
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </div>
              <span className="nav-text">{t('cart', 'Cart')}</span>
            </a>

          </div>
        </div>
      </header>

      {/* 📍 Pincode Serviceability & Delivery Modal */}
      <PincodeModal 
        isOpen={isPincodeModalOpen} 
        onClose={() => setIsPincodeModalOpen(false)} 
      />
    </>
  );
};

export default Navbar;
