import React, { useState, useEffect, useRef } from 'react';
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

/* ─── Auto-rotating Category Banner Carousel (reused in CategoriesPage) ─── */
const CatBannerCarousel = ({ slides, onClick, maxHeight = '110px' }) => {
  const [idx, setIdx] = useState(0);
  const timerRef = useRef(null);
  useEffect(() => {
    if (slides.length <= 1) return;
    timerRef.current = setInterval(() => setIdx(prev => (prev + 1) % slides.length), 4500);
    return () => clearInterval(timerRef.current);
  }, [slides.length]);
  if (!slides || slides.length === 0) return null;
  const slide = slides[idx];
  const hasImage = !!slide.image;
  const isImageOnly = slide.imageOnly;
  return (
    <div style={{ position: 'relative', width: '100%', marginBottom: '14px', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.09)', cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
      <div
        className="animate-fade-in"
        style={{
          width: '100%', height: maxHeight,
          background: hasImage ? 'transparent' : (slide.bg || 'linear-gradient(135deg,#4f46e5,#3730a3)'),
          backgroundImage: hasImage ? `url(${slide.image})` : undefined,
          backgroundSize: 'cover', backgroundPosition: 'center',
          position: 'relative', display: 'flex', alignItems: 'center',
          padding: hasImage && isImageOnly ? '0' : '12px 16px'
        }}
      >
        {hasImage && !isImageOnly && (
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.1) 100%)' }} />
        )}
        {!isImageOnly && (
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '3px', maxWidth: '75%' }}>
            {slide.tag && <span style={{ fontSize: '8px', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', color: '#fff', background: 'rgba(255,255,255,0.2)', borderRadius: '3px', padding: '1px 6px', width: 'fit-content' }}>{slide.tag}</span>}
            {slide.title && <span style={{ fontSize: '13px', fontWeight: '800', color: '#fff', lineHeight: 1.2, textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>{slide.title}</span>}
            {slide.desc && <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.3 }}>{slide.desc}</span>}
          </div>
        )}
      </div>
      {slides.length > 1 && (
        <div style={{ position: 'absolute', bottom: '6px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '4px' }}>
          {slides.map((_, i) => (
            <div key={i} onClick={e => { e.stopPropagation(); setIdx(i); clearInterval(timerRef.current); }}
              style={{ width: i === idx ? '16px' : '5px', height: '5px', borderRadius: '3px', background: i === idx ? '#fff' : 'rgba(255,255,255,0.5)', cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CategoriesPage = ({ onNavigate, onSelectCategory, onNavigateProduct, promotions }) => {
  const { products, cart } = useApp();
  const [selectedCatId, setSelectedCatId] = useState('mobiles'); // default start on mobiles category

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Map icon name string to Lucide component with premium sizing
  const renderCatIcon = (iconName) => {
    const iconProps = { size: 22, strokeWidth: 1.75 };
    switch (iconName) {
      case 'LayoutGrid': return <LayoutGrid {...iconProps} />;
      case 'Smartphone': return <Smartphone {...iconProps} />;
      case 'Laptop': return <Laptop {...iconProps} />;
      case 'Shirt': return <Shirt {...iconProps} />;
      case 'Home': return <HomeIcon {...iconProps} />;
      case 'Tv': return <Tv {...iconProps} />;
      default: return <LayoutGrid {...iconProps} />;
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
    onNavigate('catalog'); // correctly go to catalog page, not home
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
          {/* Category Banner Carousel */}
          {(() => {
            const catPromo = promotions && promotions.categoryBanners && promotions.categoryBanners[selectedCatId];
            const slides = catPromo && catPromo.show && Array.isArray(catPromo.slides) ? catPromo.slides : [];
            if (slides.length === 0) return null;
            return <CatBannerCarousel slides={slides} onClick={handleViewAllClick} maxHeight="110px" />;
          })()}

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
