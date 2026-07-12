import React from 'react';
import { useApp } from '../context/AppContext';
import { Home, Search, Award, History, User } from 'lucide-react';
import '../assets/styles/bottomnav.css';

const BottomNavigation = ({ activePage, onNavigate }) => {
  const { currentUser } = useApp();

  return (
    <div className="bottom-nav">
      <button 
        className={`bottom-nav-item ${activePage === 'home' ? 'active' : ''}`}
        onClick={() => onNavigate('home')}
      >
        <Home size={20} />
        <span>Home</span>
      </button>

      <button 
        className={`bottom-nav-item ${activePage === 'catalog' ? 'active' : ''}`}
        onClick={() => onNavigate('catalog')}
      >
        <Search size={20} />
        <span>Categories</span>
      </button>

      <button 
        className={`bottom-nav-item ${activePage === 'orders' ? 'active' : ''}`}
        onClick={() => onNavigate('orders')}
      >
        <History size={20} />
        <span>Orders</span>
      </button>

      {currentUser && currentUser.isInfluencer && (
        <button 
          className={`bottom-nav-item ${activePage === 'partner' ? 'active' : ''}`}
          onClick={() => onNavigate('partner')}
        >
          <Award size={20} />
          <span>Creator</span>
        </button>
      )}

      <button 
        className={`bottom-nav-item ${activePage === 'login' || activePage === 'profile' ? 'active' : ''}`}
        onClick={() => onNavigate(currentUser ? 'orders' : 'login')}
      >
        <User size={20} />
        <span>{currentUser ? 'Profile' : 'Login'}</span>
      </button>
    </div>
  );
};

export default BottomNavigation;
