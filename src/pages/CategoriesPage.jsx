import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CATEGORIES } from '../db/mockData';
import { 
  Search, 
  ShoppingCart, 
  Camera, 
  ArrowRight,
  LayoutGrid,
  Smartphone,
  Laptop,
  Shirt,
  Home as HomeIcon,
  Tv
} from 'lucide-react';
import '../assets/styles/categories.css';

const CategoriesPage = ({ onNavigate, onSelectCategory, onNavigateProduct }) => {
  const { products, cart } = useApp();
  const [selectedCatId, setSelectedCatId] = useState('mobiles'); // default start on mobiles category

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Map icon name string to Lucide component
  const renderCatIcon = (iconName) => {
    switch (iconName) {
      case 'LayoutGrid': return <LayoutGrid size={20} />;
      case 'Smartphone': return <Smartphone size={20} />;
      case 'Laptop': return <Laptop size={20} />;
      case 'Shirt': return <Shirt size={20} />;
      case 'Home': return <HomeIcon size={20} />;
      case 'Tv': return <Tv size={20} />;
      default: return <LayoutGrid size={20} />;
    }
  };

  // Get active category's products (with safe list check)
  const productList = Array.isArray(products) ? products : [];
  const categoryProducts = productList.filter(p => {
    if (!p) return false;
    if (selectedCatId === 'all') return true;
    return p.category === selectedCatId;
  }).slice(0, 5); // display up to 5 items inside grid, then show "View All" button

  // Mock circular stores list for popular store row
  const getMockStoresForCat = (catId) => {
    switch (catId) {
      case 'mobiles':
        return [
          { name: 'Big Bachat Days', badge: 'SALE LIVE' },
          { name: 'Apple Authorized', badge: 'NEW S24' },
          { name: 'Refurbished Hub', badge: 'MIN 40% OFF' }
        ];
      case 'electronics':
        return [
          { name: 'Intel Zone', badge: 'GEN 14' },
          { name: 'Audio Fest', badge: 'UP TO 50%' },
          { name: 'Gaming Hub', badge: 'RTX 4090' }
        ];
      case 'fashion':
        return [
          { name: 'Trending Styles', badge: '70% OFF' },
          { name: 'Shoes & Clogs', badge: 'FLAT ₹500' },
          { name: 'Premium Brands', badge: 'NEW IN' }
        ];
      case 'home':
        return [
          { name: 'Bedsheets Club', badge: 'BUY 1 GET 1' },
          { name: 'Kitchen Tools', badge: 'MIN 30% OFF' },
          { name: 'Home Decor', badge: 'UNDER ₹499' }
        ];
      case 'appliances':
        return [
          { name: 'Smart TVs', badge: '₹8,990 ONWARDS' },
          { name: 'Cooling Fest', badge: 'AC OFFERS' },
          { name: 'Direct Cooling', badge: 'MIN 20% OFF' }
        ];
      default:
        return [
          { name: 'Best Offers', badge: 'SALE LIVE' },
          { name: 'New Launches', badge: 'JUST IN' },
          { name: 'Hot Sellers', badge: 'HOT' }
        ];
    }
  };

  const activeStores = getMockStoresForCat(selectedCatId);

  const handleCategorySidebarClick = (catId) => {
    setSelectedCatId(catId);
  };

  const handleViewAllClick = () => {
    onSelectCategory(selectedCatId);
    onNavigate('home');
    // small timeout to trigger hash navigation
    setTimeout(() => {
      window.location.hash = `#catalog-${selectedCatId}`;
    }, 100);
  };

  return (
    <div className="categories-page animate-fade-in">
      {/* Page Header */}
      <div className="categories-header">
        <h1 className="categories-header-title">All Categories</h1>
        <div className="categories-header-icons">
          <button className="categories-header-icon-btn" onClick={() => { onNavigate('home'); setTimeout(() => window.dispatchEvent(new CustomEvent('focus-main-search')), 150); }}>
            <Search size={20} />
          </button>
          <button className="categories-header-icon-btn" onClick={() => onNavigate('home')}>
            <Camera size={20} />
          </button>
          <button className="categories-header-icon-btn" onClick={() => onNavigate('cart')}>
            <ShoppingCart size={20} />
            {cartCount > 0 && <span className="categories-header-cart-badge">{cartCount}</span>}
          </button>
        </div>
      </div>

      {/* Main split viewport */}
      <div className="categories-split-container">
        {/* Sidebar vertical navigation */}
        <div className="categories-sidebar">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className={`sidebar-category-btn ${selectedCatId === cat.id ? 'active' : ''}`}
              onClick={() => handleCategorySidebarClick(cat.id)}
            >
              <div className="sidebar-category-icon-wrapper">
                {renderCatIcon(cat.icon)}
              </div>
              <span className="sidebar-category-label">{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Right Details Panel */}
        <div className="categories-content-panel">
          {/* Section 1: Popular Store Circles */}
          <div className="panel-section">
            <h3 className="panel-section-title">Popular Store</h3>
            <div className="popular-stores-row">
              {activeStores.map((store, idx) => (
                <div key={idx} className="popular-store-item" onClick={handleViewAllClick}>
                  <div className="popular-store-circle">
                    <span style={{ fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', textAlign: 'center', padding: '4px' }}>
                      {store.badge}
                    </span>
                  </div>
                  <span className="popular-store-label">{store.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Products Grid / Launches */}
          <div className="panel-section">
            <h3 className="panel-section-title">New & Upcoming Launches</h3>
            <div className="category-products-grid">
              {categoryProducts.map(prod => {
                if (!prod) return null;
                return (
                  <div 
                    key={prod.id} 
                    className="category-grid-item"
                    onClick={() => onNavigateProduct(prod.id)}
                  >
                    <div className="category-item-image-wrapper">
                      <img src={prod.image} alt={prod.name} className="category-item-image" />
                    </div>
                    <span className="category-item-badge">Buy Now</span>
                    <span className="category-item-name">{prod.name}</span>
                    <span className="category-item-price">₹{(prod.price || 0).toLocaleString('en-IN')}</span>
                  </div>
                );
              })}

              {/* View All Circle Button at the end */}
              <div className="view-all-circle-btn" onClick={handleViewAllClick}>
                <div className="view-all-arrow-icon">
                  <ArrowRight size={18} />
                </div>
                <span className="view-all-text">View All</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoriesPage;
