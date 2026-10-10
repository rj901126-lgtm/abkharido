import React from 'react';
import { useApp } from '../context/AppContext';
import { Home, Zap, ShoppingBag, Package, User } from 'lucide-react';
import '../assets/styles/bottomnav.css';

const BottomNavigation = ({ activePage, onNavigate }) => {
  const { currentUser, cart, wishlist } = useApp();
  const totalCartItems = Array.isArray(cart) ? cart.reduce((acc, item) => acc + (Number(item?.quantity) || 1), 0) : 0;

  return (
    <nav className="bottom-nav-island" aria-label="Mobile Bottom Navigation">
      <button 
        type="button"
        className={`bottom-nav-item ${activePage === 'home' ? 'active' : ''}`}
        aria-label="Home"
        aria-current={activePage === 'home' ? 'page' : undefined}
        onClick={() => onNavigate('home')}
      >
        <div className="nav-icon-wrapper">
          <Home size={20} />
        </div>
        <span>Home</span>
      </button>

      <button 
        type="button"
        className={`bottom-nav-item ${activePage === 'categories' ? 'active' : ''}`}
        aria-label="Categories and Offers"
        aria-current={activePage === 'categories' ? 'page' : undefined}
        onClick={() => onNavigate('categories')}
      >
        <div className="nav-icon-wrapper">
          <Zap size={20} />
        </div>
        <span>VIP Vault</span>
      </button>

      {/* Floating Center Buy Action / Cart */}
      <button 
        type="button"
        className={`bottom-nav-item cart-center-btn ${activePage === 'cart' ? 'active' : ''}`}
        aria-label={`Shopping Bag, ${totalCartItems} items`}
        aria-current={activePage === 'cart' ? 'page' : undefined}
        onClick={() => onNavigate('cart')}
      >
        <div className="nav-icon-wrapper center-cart-icon">
          <ShoppingBag size={22} color="white" />
          {totalCartItems > 0 && (
            <span className="floating-cart-badge">{totalCartItems}</span>
          )}
        </div>
        <span style={{ fontWeight: '900', color: '#f59e0b' }}>Cart</span>
      </button>

      <button 
        type="button"
        className={`bottom-nav-item ${activePage === 'orders' ? 'active' : ''}`}
        aria-label="Orders"
        aria-current={activePage === 'orders' ? 'page' : undefined}
        onClick={() => onNavigate('orders')}
      >
        <div className="nav-icon-wrapper" style={{ position: 'relative' }}>
          <Package size={20} />
        </div>
        <span>Orders</span>
      </button>

      <button 
        type="button"
        className={`bottom-nav-item ${activePage === 'login' || activePage === 'profile' ? 'active' : ''}`}
        aria-label={currentUser ? 'Profile' : 'Login'}
        aria-current={activePage === 'login' || activePage === 'profile' ? 'page' : undefined}
        onClick={() => onNavigate(currentUser ? 'profile' : 'login')}
      >
        <div className="nav-icon-wrapper">
          <User size={20} />
        </div>
        <span>{currentUser ? 'Profile' : 'Login'}</span>
      </button>
    </nav>
  );
};

export default BottomNavigation;
