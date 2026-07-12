import React, { useState } from 'react';
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
  Settings
} from 'lucide-react';
import '../assets/styles/navbar.css';

const Navbar = ({ activePage, onNavigate, onSearch, currentCategory, onSelectCategory }) => {
  const { currentUser, cart, switchUser, resetDatabase } = useApp();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onSearch(searchQuery);
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
      <header className="navbar-header">
        <div className="navbar-container">
          
          <div className="navbar-left">
            {/* Logo */}
            <a href="#" className="logo-container" onClick={(e) => { e.preventDefault(); onNavigate('home'); }}>
              <span className="logo-text">
                AbKharido<span className="logo-plus">.com</span>
              </span>
              <span className="logo-sub">
                Direct Buy <span style={{ color: '#ffffff', fontWeight: 'bold' }}>& Earn</span>
              </span>
            </a>
          </div>

          {/* Search form */}
          <form className="search-form" onSubmit={handleSearchSubmit}>
            <div className="search-input-wrapper">
              <input
                type="text"
                className="search-input"
                placeholder="Search for products, brands and more..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="search-button">
                <Search size={18} />
              </button>
            </div>
          </form>

          <div className="navbar-right">
            {/* Simulation Controller (Super Developer Tool) */}
            <div className="simulator-panel">
              <span className="simulator-label">Simulate:</span>
              <button 
                className={`simulator-btn ${!currentUser.isInfluencer ? 'active' : ''}`}
                onClick={() => switchUser('buyer')}
              >
                Customer
              </button>
              <button 
                className={`simulator-btn ${currentUser.isInfluencer ? 'active' : ''}`}
                onClick={() => switchUser('creator')}
              >
                Creator
              </button>
            </div>

            {/* Profile Dropdown */}
            <div 
              className="nav-item" 
              onMouseEnter={() => setDropdownOpen(true)}
              onMouseLeave={() => setDropdownOpen(false)}
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

                  <a href="#profile" className="dropdown-item" onClick={(e) => { e.preventDefault(); onNavigate('partner'); }}>
                    <User size={16} /> My Profile
                  </a>

                  {currentUser.isInfluencer ? (
                    <div className="dropdown-item" style={{ color: 'var(--success)', fontWeight: '600' }}>
                      <CircleDollarSign size={16} /> Withdrawable: ₹{currentUser.walletCash.toFixed(2)}
                    </div>
                  ) : (
                    <div className="dropdown-item" style={{ color: '#e68f00', fontWeight: '600' }}>
                      <Coins size={16} /> My Coins: {currentUser.walletCoins}
                    </div>
                  )}

                  <a href="#partner-center" className="dropdown-item" onClick={(e) => { e.preventDefault(); onNavigate('partner'); }}>
                    <Award size={16} /> Partner Dashboard
                  </a>

                  <a href="#orders" className="dropdown-item" onClick={(e) => { e.preventDefault(); onNavigate('orders'); }}>
                    <History size={16} /> My Orders
                  </a>


                  <div className="dropdown-divider"></div>

                  <button className="dropdown-item" onClick={resetDatabase} style={{ color: 'var(--error)' }}>
                    <RotateCcw size={16} /> Reset Simulation
                  </button>
                </div>
              )}
            </div>

            {/* Become an Affiliate Link */}
            <a 
              href="#partners" 
              className="nav-item nav-item-btn" 
              onClick={(e) => { e.preventDefault(); onNavigate('partner'); }}
            >
              <Award size={16} style={{ marginRight: '4px' }} />
              <span>Partner Hub</span>
            </a>

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
    </>
  );
};

export default Navbar;
