import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useApp } from '../context/AppContext';
import { CATEGORIES } from '../utils/constants';
import { 
  Search, 
  ShoppingCart, 
  User, 
  ChevronDown, 
  // eslint-disable-next-line
  Layers, 
  // eslint-disable-next-line
  TrendingUp, 
  LogOut, 
  Award,
  CircleDollarSign,
  Coins,
  History,
  // eslint-disable-next-line
  RotateCcw,
  // eslint-disable-next-line
  Settings,
  Heart,
  Store,
  ArrowLeft,
  Mic,
  Package
} from 'lucide-react';
import '../assets/styles/navbar.css';
import { normalizeSearchQuery } from '../utils/searchHelper';

const Navbar = ({ activePage, onNavigate, onNavigateProduct, onSearch, currentCategory, onSelectCategory, onCartClick, style }) => {
  const searchParams = useSearchParams();
  const activeCat = searchParams ? (searchParams.get('category') || currentCategory || 'all') : (currentCategory || 'all');
  // eslint-disable-next-line
  const { currentUser, cart, logout, resetDatabase, products } = useApp();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const searchInputRef = useRef(null);

  const handleVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice search is not supported in this browser. Please use Chrome.');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN'; // Indian English / Hinglish so names like iPhone, Samsung, Mobile transcribe directly in English!
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    setIsListening(true);
    recognition.start();
    recognition.onresult = (event) => {
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
      // Focus element after small delay to allow Home page rendering
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
    // Automatically navigate to home/catalog page when selecting category
    if (activePage !== 'home' && activePage !== 'catalog') {
      onNavigate('');
    }
  };

  return (
    <>
      <header className="navbar-header" style={style}>
        <div className="navbar-container">
          
          <div className="navbar-left">
              {/* Logo */}
              <a href="#" className="logo-container" onClick={(e) => { e.preventDefault(); onNavigate('home'); }}>
                <span className="logo-text">
                  AbKharido<span className="logo-plus">.com</span>
                </span>
                <span className="logo-sub">
                  Direct Buy <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>& Earn</span>
                </span>
              </a>
          </div>

          {/* Search form */}
          <form className="search-form" onSubmit={handleSearchSubmit}>
            <div className="search-input-wrapper" style={{ position: 'relative' }}>
              <input
                ref={searchInputRef}
                type="text"
                className="search-input"
                placeholder="Search for products, brands and more..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 250)}
                style={{ paddingRight: '40px' }}
              />
              {searchQuery && (
                <button 
                  type="button" 
                  onClick={() => { setSearchQuery(''); if (searchInputRef.current) searchInputRef.current.focus(); }}
                  style={{ position: 'absolute', right: '40px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  ✕
                </button>
              )}
              <button type="submit" className="search-button">
                <Search size={18} />
              </button>
              {/* Voice Search Mic */}
              <button
                type="button"
                onClick={handleVoiceSearch}
                title="Search by voice"
                style={{
                  position: 'absolute',
                  right: '44px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  padding: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  color: isListening ? '#ef4444' : '#94a3b8',
                  animation: isListening ? 'pulse 1s infinite' : 'none',
                  transition: 'color 0.2s'
                }}
              >
                <Mic size={16} />
              </button>
            </div>
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
                    {products.slice(0, 3).map(p => (
                      <div 
                        key={p.id}
                        onMouseDown={() => { onNavigateProduct(p.id); setShowSuggestions(false); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 4px', cursor: 'pointer', borderBottom: '1px solid #f8fafc', transition: 'background 0.2s' }}
                      >
                        <img src={p.image} alt={p.name} style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '10px', background: '#f8fafc', padding: '4px', border: '1px solid #e2e8f0' }} />
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: "'Outfit', sans-serif" }}>{p.name}</div>
                          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>⚡ Express Ready in {p.category}</div>
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: '900', color: '#059669', background: '#ecfdf5', padding: '4px 8px', borderRadius: '8px' }}>₹{(p.price || 0).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  (() => {
                    const matches = products.filter(p => {
                      const name = p.name ? p.name.toLowerCase() : '';
                      const category = p.category ? p.category.toLowerCase() : '';
                      const desc = p.description ? p.description.toLowerCase() : '';
                      const query = normalizeSearchQuery(searchQuery.toLowerCase());
                      return name.includes(query) || category.includes(query) || desc.includes(query);
                    }).slice(0, 6);
                    
                    return matches.length > 0 ? (
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Live Matches ({matches.length})</div>
                        {matches.map(p => (
                          <div 
                            key={p.id} 
                            className="suggestion-item"
                            onMouseDown={() => {
                              onNavigateProduct(p.id);
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
                            <img src={p.image} alt={p.name} style={{ width: '42px', height: '42px', objectFit: 'contain', borderRadius: '10px', background: '#ffffff', border: '1px solid #e2e8f0', padding: '2px' }} />
                            <div className="suggestion-text" style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'left' }}>
                              <div style={{ fontWeight: '800', color: '#090d16', fontSize: '13px', fontFamily: "'Outfit', sans-serif" }}>{p.name}</div>
                              <span style={{ color: '#4338ca', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>💎 VIP Deals • {p.category}</span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '14px', fontWeight: '900', color: '#059669' }}>₹{(p.price || 0).toLocaleString('en-IN')}</div>
                              {p.originalPrice > p.price && (
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
                Login
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
              <span className="nav-text">Cart</span>
            </a>

          </div>
        </div>
      </header>

    </>
  );
};

export default Navbar;
