import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { CATEGORIES } from '../db/mockData';
import { 
  Search, 
  ShoppingCart, 
  User, 
  ChevronDown, 
  Layers, 
  TrendingUp, 
  LogOut, 
  Award,
  CircleDollarSign,
  Coins,
  History,
  RotateCcw,
  Settings,
  Heart,
  Store
} from 'lucide-react';
import '../assets/styles/navbar.css';

const Navbar = ({ activePage, onNavigate, onNavigateProduct, onSearch, currentCategory, onSelectCategory, style }) => {
  const { currentUser, cart, logout, resetDatabase, products } = useApp();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef(null);

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
    onSearch(searchQuery);
    setShowSuggestions(false);
  };

  const handleCategoryClick = (catId) => {
    onSelectCategory(catId);
    // Automatically navigate to home/catalog page when selecting category
    if (activePage !== 'home' && activePage !== 'catalog') {
      onNavigate('home');
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
            <div className="search-input-wrapper">
              <input
                ref={searchInputRef}
                type="text"
                className="search-input"
                placeholder="Search for products, brands and more..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 250)}
              />
              <button type="submit" className="search-button">
                <Search size={18} />
              </button>
            </div>
            {showSuggestions && searchQuery.trim() && products && (
              (() => {
                const matches = products.filter(p => {
                  const name = p.name ? p.name.toLowerCase() : '';
                  const category = p.category ? p.category.toLowerCase() : '';
                  const query = searchQuery.toLowerCase();
                  return name.includes(query) || category.includes(query);
                }).slice(0, 5);
                
                return matches.length > 0 ? (
                  <div className="search-suggestions-dropdown" style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    borderRadius: '4px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    marginTop: '4px',
                    maxHeight: '260px',
                    overflowY: 'auto',
                    zIndex: 1100,
                    border: '1px solid #e0e0e0'
                  }}>
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
                          padding: '10px 14px',
                          fontSize: '13px',
                          color: '#212121',
                          cursor: 'pointer',
                          borderBottom: '1px solid #f0f0f0'
                        }}
                      >
                        <Search size={14} color="#8c8c8c" />
                        <div className="suggestion-text" style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'left' }}>
                          <span style={{ fontWeight: '500' }}>{p.name}</span> <span style={{ color: '#888', fontSize: '11px', textTransform: 'uppercase', marginLeft: '6px' }}>in {p.category}</span>
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#388e3c' }}>₹{(p.price || 0).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                ) : null;
              })()
            )}
          </form>

          <div className="navbar-right">
            {currentUser ? (
              /* Profile Dropdown */
              <div 
                className="nav-item" 
                onMouseEnter={() => setDropdownOpen(true)}
                onMouseLeave={() => setDropdownOpen(false)}
                style={{ position: 'relative' }}
              >
                <User size={18} />
                <span className="nav-text">{currentUser.fullName}</span>
                <ChevronDown size={14} />

                {dropdownOpen && (
                  <div className="dropdown-menu">
                    <div className="dropdown-user-info">
                      <div className="dropdown-name">{currentUser.fullName}</div>
                      <div className="dropdown-email">{currentUser.email}</div>
                    </div>

                    {currentUser.isInfluencer ? (
                      <div className="dropdown-item" style={{ color: 'var(--success)', fontWeight: '600' }}>
                        <CircleDollarSign size={16} /> Withdrawable: ₹{(currentUser.walletCash || 0).toFixed(2)}
                      </div>
                    ) : (
                      <div className="dropdown-item" style={{ color: '#e68f00', fontWeight: '600' }}>
                        <Coins size={16} /> My Coins: {currentUser.walletCoins}
                      </div>
                    )}

                    {currentUser.isInfluencer && (
                      <a href="#partner-center" className="dropdown-item" onClick={(e) => { e.preventDefault(); onNavigate('partner'); }}>
                        <Award size={16} /> Creator Dashboard
                      </a>
                    )}

                    <a href="#profile" className="dropdown-item" onClick={(e) => { e.preventDefault(); onNavigate('profile'); }}>
                      <User size={16} /> My Profile
                    </a>

                    <a href="#profile" className="dropdown-item" onClick={(e) => { e.preventDefault(); onNavigate('profile'); setTimeout(() => { document.getElementById('wishlist-section')?.scrollIntoView({ behavior: 'smooth' }); }, 100); }}>
                      <Heart size={16} fill="#d32f2f" color="#d32f2f" /> My Wishlist
                    </a>

                    <a href="#orders" className="dropdown-item" onClick={(e) => { e.preventDefault(); onNavigate('orders'); }}>
                      <History size={16} /> My Orders
                    </a>

                    <a href="#seller" className="dropdown-item" onClick={(e) => { e.preventDefault(); onNavigate('seller'); }}>
                      <Store size={16} /> Sell on AbKharido
                    </a>

                    <div className="dropdown-divider"></div>

                    <button className="dropdown-item" onClick={logout} style={{ color: 'var(--error)' }}>
                      <LogOut size={16} /> Logout Account
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Login/Signup Button */
              <a 
                href="#login" 
                className="nav-item-btn" 
                onClick={(e) => { e.preventDefault(); onNavigate('login'); }}
                style={{ backgroundColor: 'white', color: 'var(--primary-color)', padding: '6px 20px', borderRadius: '2px', fontWeight: 'bold', fontSize: '14px', textDecoration: 'none' }}
              >
                Login
              </a>
            )}

            {/* Cart */}
            <a 
              href="#cart" 
              className="nav-item" 
              onClick={(e) => { e.preventDefault(); onNavigate('cart'); }}
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

      {/* Subnav categories bar */}
      {(activePage === 'home' || activePage === 'catalog') && (
        <nav className="cat-bar">
          <div className="cat-container">
            {CATEGORIES.map(cat => (
              <div
                key={cat.id}
                className={`cat-item ${currentCategory === cat.id ? 'active' : ''}`}
                onClick={() => handleCategoryClick(cat.id)}
              >
                <span>{cat.name}</span>
              </div>
            ))}
          </div>
        </nav>
      )}
    </>
  );
};

export default Navbar;
