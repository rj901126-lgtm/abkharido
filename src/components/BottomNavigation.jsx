import React from 'react';
import { useApp } from '../context/AppContext';
import { Home, LayoutGrid, Award, History, User } from 'lucide-react';
import '../assets/styles/bottomnav.css';

const BottomNavigation = ({ activePage, onNavigate }) => {
  const { currentUser } = useApp();

  return (
    <div className="bottom-nav">
      <button 
        className={`bottom-nav-item ${activePage === 'home' ? 'active' : ''}`}
        onClick={() => onNavigate('home')}
      >
        <div className="nav-icon-wrapper">
          <Home size={22} />
        </div>
        <span>Home</span>
      </button>

      <button 
        className={`bottom-nav-item ${activePage === 'categories' ? 'active' : ''}`}
        onClick={() => onNavigate('categories')}
      >
        <div className="nav-icon-wrapper">
          <LayoutGrid size={22} />
        </div>
        <span>Categories</span>
      </button>

      <button 
        className={`bottom-nav-item ${activePage === 'orders' ? 'active' : ''}`}
        onClick={() => onNavigate('orders')}
      >
        <div className="nav-icon-wrapper">
          <History size={22} />
        </div>
        <span>Orders</span>
      </button>

      {currentUser && currentUser.isInfluencer && (
        <button 
          className={`bottom-nav-item ${activePage === 'partner' ? 'active' : ''}`}
          onClick={() => onNavigate('partner')}
        >
          <div className="nav-icon-wrapper">
            <Award size={22} />
          </div>
          <span>Creator</span>
        </button>
      )}

      <button 
        className={`bottom-nav-item ${activePage === 'login' || activePage === 'profile' ? 'active' : ''}`}
        onClick={() => onNavigate(currentUser ? 'profile' : 'login')}
      >
        <div className="nav-icon-wrapper">
          <User size={22} />
        </div>
        <span>{currentUser ? 'Profile' : 'Login'}</span>
      </button>
    </div>
  );
};

export default BottomNavigation;
