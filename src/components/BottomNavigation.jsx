import React from 'react';
import { useApp } from '../context/AppContext';
import { Home, Zap, ShoppingBag, Package, User } from 'lucide-react';
import '../assets/styles/bottomnav.css';

const BottomNavigation = ({ activePage, onNavigate }) => {
  const { currentUser, cart, wishlist } = useApp();
  const totalCartItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="bottom-nav-island">
      <button 
        className={`bottom-nav-item ${activePage === 'home' ? 'active' : ''}`}
        onClick={() => onNavigate('home')}
      >
        <div className="nav-icon-wrapper">
          <Home size={20} />
        </div>
        <span>Home</span>
      </button>

      <button 
        className={`bottom-nav-item ${activePage === 'categories' ? 'active' : ''}`}
        onClick={() => onNavigate('categories')}
      >
        <div className="nav-icon-wrapper">
          <Zap size={20} />
        </div>
        <span>VIP Vault</span>
      </button>

      {/* Floating Center Buy Action / Cart */}
      <button 
        className={`bottom-nav-item cart-center-btn ${activePage === 'cart' ? 'active' : ''}`}
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
        className={`bottom-nav-item ${activePage === 'orders' ? 'active' : ''}`}
        onClick={() => onNavigate('orders')}
      >
        <div className="nav-icon-wrapper" style={{ position: 'relative' }}>
          <Package size={20} />
        </div>
        <span>Orders</span>
      </button>

      <button 
        className={`bottom-nav-item ${activePage === 'login' || activePage === 'profile' ? 'active' : ''}`}
        onClick={() => onNavigate(currentUser ? 'profile' : 'login')}
      >
        <div className="nav-icon-wrapper">
          <User size={20} />
        </div>
        <span>{currentUser ? 'Profile' : 'Login'}</span>
      </button>
    </div>
  );
};

export default BottomNavigation;
