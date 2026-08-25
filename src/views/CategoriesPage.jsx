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
  Plus,
  Tag,
  Sparkles
} from 'lucide-react';
import '../assets/styles/categories.css';
import { CATEGORY_DETAILS, ALL_POPULAR_BRANDS, getCategoryData } from '../utils/categoryData';

/* ─── Auto-rotating Category Banner Carousel (reused in CategoriesPage) ─── */
const CatBannerCarousel = ({ slides, onClick, maxHeight = '120px' }) => {
  const [idx, setIdx] = useState(0);
  const timerRef = useRef(null);
  useEffect(() => {
    if (!slides || slides.length <= 1) return;
    timerRef.current = setInterval(() => setIdx(prev => (prev + 1) % slides.length), 4500);
    return () => clearInterval(timerRef.current);
  }, [slides]);
  if (!slides || slides.length === 0) return null;
  const slide = slides[idx] || slides[0];
  const imgUrl = slide.imageUrl || slide.image || slide.img;
  const hasImage = !!imgUrl;
  const isImageOnly = slide.imageOnly;
  return (
    <div style={{ position: 'relative', width: '100%', marginBottom: '16px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
      <div
        className="animate-fade-in"
        style={{
          width: '100%', minHeight: maxHeight,
          backgroundImage: hasImage 
            ? `linear-gradient(90deg, rgba(15, 23, 42, 0.88) 0%, rgba(30, 27, 75, 0.6) 60%, rgba(0, 0, 0, 0.25) 100%), url(${imgUrl})` 
            : (slide.bg || 'linear-gradient(135deg, #090d16 0%, #1e1b4b 100%)'),
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative', display: 'flex', alignItems: 'center',
          padding: '16px 18px',
          boxSizing: 'border-box'
        }}
      >
        {!isImageOnly && (
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '85%' }}>
            {(slide.badge || slide.tag) && (
              <span style={{ fontSize: '9px', fontWeight: '900', letterSpacing: '0.5px', textTransform: 'uppercase', color: '#fde047', background: 'rgba(253, 224, 71, 0.15)', border: '1px solid rgba(253, 224, 71, 0.3)', borderRadius: '6px', padding: '2px 8px', width: 'fit-content' }}>
                {slide.badge || slide.tag}
              </span>
            )}
            {slide.title && (
              <span style={{ fontSize: '14px', fontWeight: '900', color: '#ffffff', lineHeight: 1.25, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                {slide.title}
              </span>
            )}
            {slide.desc && (
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.3 }}>
                {slide.desc}
              </span>
            )}
          </div>
        )}
      </div>
      {slides.length > 1 && (
        <div style={{ position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '4px' }}>
          {slides.map((_, i) => (
            <div key={i} onClick={e => { e.stopPropagation(); setIdx(i); clearInterval(timerRef.current); }}
              style={{ width: i === idx ? '18px' : '6px', height: '5px', borderRadius: '3px', background: i === idx ? '#ffffff' : 'rgba(255,255,255,0.4)', cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CategoriesPage = ({ onNavigate, onSelectCategory, onNavigateProduct, promotions, onSearch, initialProducts }) => {
  const { products: contextProducts, cart } = useApp();
  const products = (initialProducts && initialProducts.length > 0) ? initialProducts : contextProducts;
  const [selectedCatId, setSelectedCatId] = useState('all'); // default start on all category

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
          { name: 'Super Deals', badge: 'HOT', img: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=150&q=80' },
          { name: 'Trending Now', badge: 'NEW', img: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=150&q=80' },
          { name: 'Direct Wholesale', badge: 'UP TO 60%', img: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=150&q=80' }
        ];
    }
  };

  const handleCategorySidebarClick = (catId) => {
    setSelectedCatId(catId);
  };

  const handleViewAllClick = () => {
    if (selectedCatId === 'all') {
      onNavigate('catalog');
    } else {
      onSelectCategory(selectedCatId);
      onNavigate('catalog');
    }
  };

  const catInfo = getCategoryData(selectedCatId);

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
                {(cat?.name || 'Category').split(' ')[0]}
              </span>
            </button>
          ))}
        </div>

        {/* Right Details Panel */}
        <div className="categories-content-panel" key={selectedCatId}>
          {/* Dynamic Category Header */}
          <div className="dynamic-category-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0', marginBottom: '14px' }}>
            <div>
              <h2 className="dynamic-category-title" style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{catInfo?.icon || '🛍️'}</span> {catInfo?.name || 'All Categories'}
              </h2>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
                {catInfo?.tagline || 'Direct Brand Authorization with Official 1-Year Pan-India Warranty'}
              </span>
            </div>
          </div>

          {/* VIP Vault Exclusives Membership Banner */}
          <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4f46e5 100%)', borderRadius: '18px', padding: '16px', marginBottom: '16px', color: 'white', border: '1px solid rgba(253, 224, 71, 0.25)', boxShadow: '0 10px 28px rgba(30, 27, 75, 0.18)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '900', background: 'linear-gradient(135deg, #f59e0b, #ea580c)', color: '#ffffff', padding: '3px 10px', borderRadius: '100px', letterSpacing: '0.4px', boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)' }}>
                👑 VIP VAULT UNLOCKED
              </span>
              <span style={{ fontSize: '11px', color: '#fde047', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}>
                ⚡ MEMBER EXCLUSIVE
              </span>
            </div>
            <div style={{ fontSize: '15px', fontWeight: '900', letterSpacing: '-0.2px', marginBottom: '4px', lineHeight: '1.3' }}>
              Instant Extra 15% Savings with AB Coins!
            </div>
            <p style={{ fontSize: '11.5px', color: '#cbd5e1', margin: 0, lineHeight: '1.4', fontWeight: '500' }}>
              Unlock wholesale direct factory prices across {selectedCatId === 'all' ? 'all catalog products' : `${catInfo?.name || 'this category'} items`}. Zero hidden charges or processing fees.
            </p>
          </div>

          {/* Category Banner Carousel */}
          {(() => {
            const catPromo = promotions && promotions.categoryBanners && promotions.categoryBanners[selectedCatId];
            const slides = catPromo && catPromo.show && Array.isArray(catPromo.slides) ? catPromo.slides : [];
            if (slides.length === 0) return null;
            return <CatBannerCarousel slides={slides} onClick={handleViewAllClick} maxHeight="120px" />;
          })()}

          {/* ── 1. Sub-Categories Exploration Grid ── */}
          {(() => {
            const subCats = catInfo ? catInfo.subCategories : [];
            if (!subCats || subCats.length === 0) return null;
            return (
              <div className="panel-section" style={{ marginBottom: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 className="panel-section-title" style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0, fontSize: '14px', fontWeight: '900', color: '#0f172a' }}>
                    <Tag size={15} color="#4f46e5" /> Sub-Categories
                  </h3>
                  <span style={{ fontSize: '11.5px', color: '#4f46e5', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }} onClick={handleViewAllClick}>
                    {selectedCatId === 'all' ? 'Explore All' : `All ${catInfo.name.split(' ')[0]}`} →
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {subCats.map(sub => (
                    <div
                      key={sub.id}
                      onClick={() => {
                        onSelectCategory(selectedCatId);
                        if (onSearch) onSearch(sub.query);
                        else onNavigate(`catalog?category=${selectedCatId}&search=${encodeURIComponent(sub.query)}`);
                      }}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '14px',
                        padding: '10px 6px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        transition: 'all 0.15s ease',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
                        position: 'relative'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#4f46e5'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 14px rgba(79, 70, 229, 0.12)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.03)'; }}
                    >
                      {sub.badge && (
                        <div style={{ position: 'absolute', top: '5px', right: '5px', fontSize: '7.5px', fontWeight: '900', padding: '1px 5px', borderRadius: '4px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
                          {sub.badge}
                        </div>
                      )}
                      <div style={{ width: '44px', height: '44px', borderRadius: '50%', overflow: 'hidden', marginBottom: '6px', border: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img 
                          src={sub.img} 
                          alt={sub.name} 
                          onError={(e) => { e.target.style.display = 'none'; if (e.target.nextSibling) e.target.nextSibling.style.display = 'block'; }} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                        <span style={{ display: 'none', fontSize: '20px' }}>{sub.icon || '🛍️'}</span>
                      </div>
                      <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#0f172a', lineHeight: 1.2, marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{sub.name}</span>
                      <span style={{ fontSize: '10.5px', fontWeight: '900', color: '#059669', marginBottom: '1px' }}>{sub.startingPrice}</span>
                      <span style={{ fontSize: '9px', color: '#64748b', fontWeight: '700' }}>{sub.discount}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* ── 2. Official Brand Partners Section (Home Page Style) ── */}
          {(() => {
            const catInfo = getCategoryData(selectedCatId);
            const brands = catInfo ? catInfo.popularBrands : ALL_POPULAR_BRANDS;
            return (
              <div className="panel-section" style={{ marginBottom: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <h3 className="panel-section-title" style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                      <span>🏛️</span> Popular Brands in {catInfo ? catInfo.name : 'Store'}
                    </h3>
                    <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Direct authorized brand distribution & warranty</p>
                  </div>
                  <span style={{ fontSize: '10.5px', color: '#059669', fontWeight: '800', background: '#ecfdf5', padding: '2px 8px', borderRadius: '12px', border: '1px solid #a7f3d0' }}>
                    ✓ 100% Genuine
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(115px, 1fr))', gap: '8px' }}>
                  {brands.map((brand, bIdx) => (
                    <div
                      key={bIdx}
                      onClick={() => {
                        onSelectCategory(selectedCatId);
                        if (onSearch) onSearch(brand.query);
                        else onNavigate(`catalog?category=${selectedCatId}&search=${encodeURIComponent(brand.query)}`);
                      }}
                      style={{
                        background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '10px 8px',
                        color: '#0f172a',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        textAlign: 'center',
                        position: 'relative'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#4f46e5'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'none'; }}
                    >
                      {brand.offer && (
                        <div style={{ position: 'absolute', top: '4px', right: '4px', fontSize: '7.5px', fontWeight: '900', padding: '1px 4px', borderRadius: '3px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
                          {brand.offer}
                        </div>
                      )}
                      <div style={{ fontSize: '20px', margin: '2px 0 4px 0' }}>{brand.icon}</div>
                      <h4 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '12.5px', fontWeight: '900', margin: '0 0 2px 0', color: '#0f172a' }}>{brand.name}</h4>
                      <p style={{ fontSize: '9.5px', color: '#64748b', margin: 0, fontWeight: '600' }}>{brand.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Section 3: Products Grid */}
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

