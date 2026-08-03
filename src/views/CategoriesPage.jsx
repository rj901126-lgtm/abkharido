import LazyImage from '../components/LazyImage';
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { CATEGORIES } from '../utils/constants';
import { 
  // eslint-disable-next-line
  Search, 
  // eslint-disable-next-line
  ShoppingCart, 
  // eslint-disable-next-line
  Camera, 
  ArrowRight,
  LayoutGrid,
  Smartphone,
  Laptop,
  Shirt,
  Home as HomeIcon,
  Tv,
  Plus
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
          background: hasImage 
            ? `url(${slide.image}) no-repeat center center / cover, ${slide.bg || 'linear-gradient(135deg, #090d16 0%, #1e1b4b 100%)'}` 
            : (slide.bg || 'linear-gradient(135deg, #090d16 0%, #1e1b4b 100%)'),
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

const CategoriesPage = ({ onNavigate, onSelectCategory, onNavigateProduct, promotions, onSearch }) => {
  const { products, cart } = useApp();
  const [selectedCatId, setSelectedCatId] = useState('mobiles'); // default start on mobiles category

  // eslint-disable-next-line
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Map category id to clear, accurate emoji icons
  const CAT_EMOJIS = {
    all:         '🛍️',   // shopping bags = all
    mobiles:     '📱',   // phone = mobiles ✓
    electronics: '🎧',   // headphones = electronics (audio/gadgets)
    fashion:     '👗',   // dress = fashion ✓
    home:        '🏠',   // house = home & living ✓
    beauty:      '💄',   // lipstick = beauty & personal care
    sports:      '🏏',   // cricket bat = sports (India loves cricket)
    appliances:  '🫧',   // washing = appliances
    laptop:      '💻',   // laptop ✓
    grocery:     '🛒',   // cart = grocery
    toys:        '🧸',   // teddy = toys
    books:       '📚',   // books ✓
    jewelry:     '💍',   // ring = jewelry
  };

  const renderCatIcon = (cat) => {
    const emoji = CAT_EMOJIS[cat.id] || '🛒';
    return (
      <span style={{ fontSize: '24px', lineHeight: 1, display: 'block' }}>{emoji}</span>
    );
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
          { name: 'Big Bachat Days', badge: 'SALE LIVE', img: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=150&q=80' },
          { name: 'Apple Authorized', badge: 'NEW S24', img: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=150&q=80' },
          { name: 'Refurbished Hub', badge: 'MIN 40% OFF', img: 'https://images.unsplash.com/photo-1598327105666-5b89351cb31b?w=150&q=80' }
        ];
      case 'electronics':
        return [
          { name: 'Intel Zone', badge: 'GEN 14', img: 'https://images.unsplash.com/photo-1531297172867-4f444c66657c?w=150&q=80' },
          { name: 'Audio Fest', badge: 'UP TO 50%', img: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=150&q=80' },
          { name: 'Gaming Hub', badge: 'RTX 4090', img: 'https://images.unsplash.com/photo-1600861194942-f88481e1d071?w=150&q=80' }
        ];
      case 'fashion':
        return [
          { name: 'Trending Styles', badge: '70% OFF', img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=150&q=80' },
          { name: 'Shoes & Clogs', badge: 'FLAT ₹500', img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=150&q=80' },
          { name: 'Premium Brands', badge: 'NEW IN', img: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=150&q=80' }
        ];
      case 'home':
        return [
          { name: 'Bedsheets Club', badge: 'BUY 1 GET 1', img: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=150&q=80' },
          { name: 'Kitchen Tools', badge: 'MIN 30% OFF', img: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=150&q=80' },
          { name: 'Home Decor', badge: 'UNDER ₹499', img: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=150&q=80' }
        ];
      case 'appliances':
        return [
          { name: 'Smart TVs', badge: '₹8,990 ONWARDS', img: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=150&q=80' },
          { name: 'Cooling Fest', badge: 'AC OFFERS', img: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=150&q=80' },
          { name: 'Direct Cooling', badge: 'MIN 20% OFF', img: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=150&q=80' }
        ];
      default:
        return [
          { name: 'Best Offers', badge: 'SALE LIVE', img: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=150&q=80' },
          { name: 'New Launches', badge: 'JUST IN', img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=150&q=80' },
          { name: 'Hot Sellers', badge: 'HOT', img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=150&q=80' }
        ];
    }
  };

  const activeStores = getMockStoresForCat(selectedCatId);

  const handleCategorySidebarClick = (catId) => {
    setSelectedCatId(catId);
  };

  const handleViewAllClick = () => {
    onSelectCategory(selectedCatId);
    if (onSearch) onSearch('');
    else onNavigate('catalog'); // correctly go to catalog page, not home
  };

  const handleStoreClick = (store) => {
    onSelectCategory(selectedCatId);
    if (onSearch) {
      // Find a searchable keyword from badge or name
      const q = store.badge.toLowerCase();
      onSearch(q);
    } else {
      onNavigate('catalog');
    }
  };

  return (
    <div className="categories-page animate-fade-in">
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
                {renderCatIcon(cat)}
              </div>
              <span className="sidebar-category-label">
                {cat.name.split(' ')[0]}
              </span>
            </button>
          ))}
        </div>

        {/* Right Details Panel */}
        <div className="categories-content-panel" key={selectedCatId}>
          {/* Dynamic Category Header */}
          <div className="dynamic-category-header">
            <h2 className="dynamic-category-title">
              {CATEGORIES.find(c => c.id === selectedCatId)?.name || 'All'}
            </h2>
          </div>

          {/* VIP Vault Exclusives Membership Banner */}
          <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4f46e5 100%)', borderRadius: '18px', padding: '16px', marginBottom: '18px', color: 'white', border: '1px solid rgba(253, 224, 71, 0.35)', boxShadow: '0 8px 24px rgba(30, 27, 75, 0.25)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: '900', background: 'linear-gradient(135deg, #f59e0b, #ea580c)', color: '#ffffff', padding: '4px 12px', borderRadius: '100px', letterSpacing: '0.4px', boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)' }}>
                👑 VIP VAULT UNLOCKED
              </span>
              <span style={{ fontSize: '11.5px', color: '#fde047', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}>
                ⚡ MEMBER EXCLUSIVE
              </span>
            </div>
            <div style={{ fontSize: '15.5px', fontWeight: '900', letterSpacing: '-0.2px', marginBottom: '5px', lineHeight: '1.3' }}>
              Instant Extra 15% Savings with AB Coins!
            </div>
            <p style={{ fontSize: '12px', color: '#cbd5e1', margin: 0, lineHeight: '1.45', fontWeight: '500' }}>
              Unlock wholesale direct factory prices across all {CATEGORIES.find(c => c.id === selectedCatId)?.name || 'All'} items. Zero hidden charges or processing fees.
            </p>
          </div>

          {/* Category Banner Carousel */}
          {(() => {
            const catPromo = promotions && promotions.categoryBanners && promotions.categoryBanners[selectedCatId];
            const slides = catPromo && catPromo.show && Array.isArray(catPromo.slides) ? catPromo.slides : [];
            if (slides.length === 0) return null;
            return <CatBannerCarousel slides={slides} onClick={handleViewAllClick} maxHeight="110px" />;
          })()}

          {/* Section 1: Popular Store Cards */}
          <div className="panel-section">
            <h3 className="panel-section-title">Popular Stores</h3>
            <div className="popular-stores-row">
              {activeStores.map((store, idx) => (
                <div key={idx} className="popular-store-item" onClick={() => handleStoreClick(store)}>
                  <div
                    className="popular-store-circle"
                    style={{ backgroundImage: `url(${store.img})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                  >
                    <div className="store-badge-pill">{store.badge}</div>
                  </div>
                  <span className="popular-store-label">{store.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Products Grid */}
          <div className="panel-section">
            <h3 className="panel-section-title">New & Upcoming Launches</h3>
            <div className="category-products-grid">
              {categoryProducts.map((prod, i) => {
                if (!prod) return null;
                return (
                  <div
                    key={prod.id}
                    className="category-grid-item animate-fade-in"
                    style={{ animationDelay: `${i * 0.06}s` }}
                    onClick={() => onNavigateProduct(prod.id)}
                  >
                    <div className="category-item-image-wrapper">
                      <LazyImage src={prod.image} alt={prod.name} className="category-item-image" />
                    </div>
                    <div className="category-item-details">
                      <span className="category-item-name">{prod.name}</span>
                      <span className="category-item-price">₹{(prod.price || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <button
                      className="category-item-add-btn"
                      onClick={(e) => { e.stopPropagation(); onNavigateProduct(prod.id); }}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                );
              })}

              {/* View All */}
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

