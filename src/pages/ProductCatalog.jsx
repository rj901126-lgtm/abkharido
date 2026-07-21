import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import ProductCard from '../components/ProductCard';
import { Filter, Star, RefreshCw, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import '../assets/styles/product.css';

/* ─── Auto-rotating Category Banner Carousel ─── */
const CatBannerCarousel = ({ slides }) => {
  const [idx, setIdx] = useState(0);
  const timerRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleTouchStart = (e) => { touchStartX.current = e.targetTouches[0].clientX; };
  const handleTouchMove = (e) => { touchEndX.current = e.targetTouches[0].clientX; };
  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 50) {
      setIdx(prev => (prev + 1) % slides.length);
      clearInterval(timerRef.current);
    } else if (diff < -50) {
      setIdx(prev => (prev - 1 + slides.length) % slides.length);
      clearInterval(timerRef.current);
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  useEffect(() => {
    if (slides.length <= 1) return;
    timerRef.current = setInterval(() => {
      setIdx(prev => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(timerRef.current);
  }, [slides.length]);

  if (!slides || slides.length === 0) return null;
  const slide = slides[idx];
  const hasImage = !!slide.image;
  const isImageOnly = slide.imageOnly;

  return (
    <div 
      style={{ 
        position: 'relative', 
        width: '100%', 
        marginBottom: '32px', 
        borderRadius: '24px', 
        overflow: 'hidden', 
        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.2)',
        backgroundColor: '#0f172a' 
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <style>{`
        .world-class-btn {
          background: linear-gradient(135deg, #fef08a 0%, #f59e0b 100%);
          color: #78350f;
          border: none;
          padding: 10px 24px;
          border-radius: 30px;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          width: fit-content;
          box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .world-class-btn:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 6px 20px rgba(245, 158, 11, 0.6);
        }
        .animated-gradient-bg {
          background: linear-gradient(-45deg, #4f46e5, #3b82f6, #8b5cf6, #ec4899);
          background-size: 400% 400%;
          animation: gradientBg 10s ease infinite;
        }
        @keyframes gradientBg {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .floating-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(40px);
          opacity: 0.6;
          z-index: 0;
        }
      `}</style>
      
      <div
        className={!hasImage ? "animated-gradient-bg" : ""}
        style={{
          width: '100%',
          height: '220px',
          background: hasImage 
            ? `url(${slide.image}) no-repeat right center / contain, ${slide.bg || 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)'}` 
            : undefined,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          padding: hasImage && isImageOnly ? '0' : '32px 40px'
        }}
      >
        {/* Decorative Floating Orbs when no image */}
        {!hasImage && (
          <>
            <div className="floating-orb" style={{ top: '-20%', left: '-10%', width: '150px', height: '150px', background: '#f472b6' }}></div>
            <div className="floating-orb" style={{ bottom: '-30%', right: '10%', width: '200px', height: '200px', background: '#60a5fa' }}></div>
            <div className="floating-orb" style={{ top: '20%', right: '40%', width: '100px', height: '100px', background: '#c084fc' }}></div>
          </>
        )}

        {/* Dark overlay for text readability on images */}
        {hasImage && !isImageOnly && (
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 100%)', zIndex: 0 }} />
        )}

        {/* Premium Text Content Overlay */}
        {!isImageOnly && (
          <div style={{ 
            position: 'relative', 
            zIndex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '12px', 
            maxWidth: '70%',
            padding: '0 12px'
          }}>
            {slide.tag && (
              <span style={{ 
                fontSize: '11px', 
                fontWeight: '900', 
                letterSpacing: '1.5px', 
                textTransform: 'uppercase', 
                color: '#fff', 
                background: 'linear-gradient(90deg, #ec4899 0%, #f43f5e 100%)', 
                borderRadius: '6px', 
                padding: '4px 10px', 
                width: 'fit-content',
                boxShadow: '0 2px 10px rgba(236, 72, 153, 0.4)'
              }}>
                {slide.tag}
              </span>
            )}
            {slide.title && (
              <span style={{ 
                fontSize: '32px', 
                fontWeight: '900', 
                color: '#ffffff', 
                lineHeight: 1.1, 
                letterSpacing: '-0.5px',
                textShadow: '0 2px 10px rgba(0,0,0,0.3)' 
              }}>
                {slide.title}
              </span>
            )}
            {slide.desc && (
              <span style={{ 
                fontSize: '15px', 
                color: 'rgba(255,255,255,0.9)', 
                lineHeight: 1.5, 
                fontWeight: '500',
                marginBottom: '8px',
                textShadow: '0 1px 4px rgba(0,0,0,0.3)'
              }}>
                {slide.desc}
              </span>
            )}
            <button className="world-class-btn">
              Explore Collection
            </button>
          </div>
        )}
      </div>

      {/* Dot indicators */}
      {slides.length > 1 && (
        <div style={{ position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px', zIndex: 2 }}>
          {slides.map((_, i) => (
            <div
              key={i}
              onClick={() => { setIdx(i); clearInterval(timerRef.current); }}
              style={{
                width: i === idx ? '24px' : '8px',
                height: '8px',
                borderRadius: '4px',
                background: i === idx ? '#fff' : 'rgba(255,255,255,0.4)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const ProductCatalog = ({ currentCategory, onSelectCategory, searchQuery, onNavigateProduct, promotions }) => {
  const { products } = useApp();
  // Filter States
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(150000);
  const [selectedRating, setSelectedRating] = useState(null);
  const [sortBy, setSortBy] = useState('popularity'); // popularity, priceLow, priceHigh
  const [showSortModal, setShowSortModal] = useState(false);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Scroll to top when category changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentCategory]);

  // Synchronize category or resets
  useEffect(() => {
    // When category changes, we can reset some filters if needed
  }, [currentCategory]);

  // Apply filters and sorting
  const getFilteredProducts = () => {
    let filtered = [...products];

    // 1. Category Filter
    if (currentCategory !== 'all') {
      filtered = filtered.filter(p => p.category === currentCategory);
    }

    // 2. Search Query Filter
    if (searchQuery && searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      
      // Smart search for Popular Store badges
      if (query.includes('min') && query.includes('off')) {
        const match = query.match(/(\d+)%/);
        const targetDiscount = match ? parseInt(match[1]) : 0;
        filtered = filtered.filter(p => {
          const discount = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
          return discount >= targetDiscount;
        });
      } else if (query.includes('flat') || query.includes('under') || query.includes('onwards')) {
        // Price-based queries
        const match = query.match(/₹([\d,]+)/);
        const val = match ? parseInt(match[1].replace(/,/g, '')) : 0;
        if (query.includes('under') && val > 0) {
          filtered = filtered.filter(p => p.price <= val);
        } else if (query.includes('onwards') && val > 0) {
          filtered = filtered.filter(p => p.price >= val);
        } else if (query.includes('flat')) {
          filtered = filtered.filter(p => p.originalPrice > p.price);
        }
      } else if (query === 'sale live' || query === 'hot' || query === 'new in' || query === 'just in') {
        filtered = filtered.filter(p => p.originalPrice > p.price); // Just show discounted items
      } else {
        // Standard text search
        filtered = filtered.filter(p => {
          const name = p.name ? p.name.toLowerCase() : '';
          const description = p.description ? p.description.toLowerCase() : '';
          const category = p.category ? p.category.toLowerCase() : '';
          return name.includes(query) || description.includes(query) || category.includes(query);
        });
      }
    }

    // 3. Price Filter
    filtered = filtered.filter(p => p.price >= minPrice && p.price <= maxPrice);

    // 4. Rating Filter
    if (selectedRating) {
      filtered = filtered.filter(p => p.rating >= selectedRating);
    }

    // 5. Sorting
    if (sortBy === 'popularity') {
      // Sort by reviews count as proxy for popularity
      filtered.sort((a, b) => b.reviewsCount - a.reviewsCount);
    } else if (sortBy === 'priceLow') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'priceHigh') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      filtered.sort((a, b) => b.rating - a.rating);
    }

    return filtered;
  };

  const filteredProducts = getFilteredProducts();

  const handleResetFilters = () => {
    setMinPrice(0);
    setMaxPrice(150000);
    setSelectedRating(null);
    setSortBy('popularity');
    onSelectCategory('all');
  };

  return (
    <div className="container catalog-page-layout-container animate-fade-in-only">
      
      {/* 1. DESKTOP FILTERS SIDEBAR (Visible on screens > 768px via CSS) */}
      <aside className="filters-sidebar">
        {/* Sort By section */}
        <div className="filter-section">
          <h5 className="filter-title" style={{ fontSize: '13px', letterSpacing: '0.5px', marginBottom: '12px' }}>Sort By</h5>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { id: 'popularity', label: 'Popularity' },
              { id: 'priceLow', label: 'Price: Low to High' },
              { id: 'priceHigh', label: 'Price: High to Low' },
              { id: 'rating', label: 'Highest Rated' }
            ].map(opt => (
              <label key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer', padding: '6px 8px', borderRadius: '6px', background: sortBy === opt.id ? 'var(--primary-light)' : 'transparent', color: sortBy === opt.id ? 'var(--primary-color)' : 'var(--text-primary)', fontWeight: sortBy === opt.id ? '600' : '500', transition: 'all 0.2s' }}>
                <input 
                  type="radio" 
                  name="desktop-sort" 
                  checked={sortBy === opt.id} 
                  onChange={() => setSortBy(opt.id)}
                  style={{ accentColor: 'var(--primary-color)', width: '16px', height: '16px' }}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        {/* Category section */}
        <div className="filter-section">
          <h5 className="filter-title" style={{ fontSize: '13px', letterSpacing: '0.5px', marginBottom: '12px' }}>Category</h5>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {[
              { id: 'all', label: 'All Categories' },
              { id: 'mobiles', label: 'Mobiles' },
              { id: 'electronics', label: 'Electronics' },
              { id: 'fashion', label: 'Fashion' },
              { id: 'home', label: 'Home & Living' },
              { id: 'appliances', label: 'Appliances' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  border: currentCategory === cat.id ? '1px solid var(--primary-color)' : '1px solid #e2e8f0',
                  background: currentCategory === cat.id ? 'var(--primary-color)' : 'white',
                  color: currentCategory === cat.id ? 'white' : '#64748b',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: currentCategory === cat.id ? '0 2px 8px rgba(79,70,229,0.25)' : 'none'
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Price section */}
        <div className="filter-section">
          <h5 className="filter-title" style={{ fontSize: '13px', letterSpacing: '0.5px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
            <span>Price Range</span>
            <span style={{ color: 'var(--primary-color)', fontWeight: '800' }}>₹{maxPrice.toLocaleString('en-IN')}</span>
          </h5>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input 
              type="range" 
              min="1000" 
              max="150000" 
              step="1000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--primary-color)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>
              <span>₹1k</span>
              <span>₹150k</span>
            </div>
          </div>
        </div>

        {/* Ratings section */}
        <div className="filter-section">
          <h5 className="filter-title" style={{ fontSize: '13px', letterSpacing: '0.5px', marginBottom: '12px' }}>Customer Ratings</h5>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[4, 3, 2].map(stars => (
              <label key={stars} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer', padding: '6px 8px', borderRadius: '6px', background: selectedRating === stars ? 'var(--primary-light)' : 'transparent', color: selectedRating === stars ? 'var(--primary-color)' : 'var(--text-primary)', fontWeight: selectedRating === stars ? '600' : '500', transition: 'all 0.2s' }}>
                <input 
                  type="radio" 
                  name="sidebar-rating-filter" 
                  checked={selectedRating === stars}
                  onChange={() => setSelectedRating(stars)}
                  style={{ accentColor: 'var(--primary-color)', width: '16px', height: '16px' }}
                />
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {stars} <Star size={12} fill={selectedRating === stars ? "var(--primary-color)" : "#cbd5e1"} stroke="none" /> & above
                </span>
              </label>
            ))}
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer', padding: '6px 8px', borderRadius: '6px', background: selectedRating === null ? 'var(--primary-light)' : 'transparent', color: selectedRating === null ? 'var(--primary-color)' : 'var(--text-primary)', fontWeight: selectedRating === null ? '600' : '500', transition: 'all 0.2s' }}>
              <input 
                type="radio" 
                name="sidebar-rating-filter" 
                checked={selectedRating === null}
                onChange={() => setSelectedRating(null)}
                style={{ accentColor: 'var(--primary-color)', width: '16px', height: '16px' }}
              />
              All Ratings
            </label>
          </div>
        </div>

        {/* Reset button */}
        <button 
          className="btn btn-outline" 
          onClick={handleResetFilters}
          style={{ width: '100%', height: '36px', fontSize: '12px', fontWeight: 'bold' }}
        >
          Reset Filters
        </button>
      </aside>

      {/* 2. CATALOG MAIN AREA: Products grid + Mobile filter buttons */}
      <main className="catalog-main">
        {/* Sticky Mobile Sort & Filter Bar (Fixed at top) */}
        <div className="mobile-catalog-top-bar">
          <button 
            onClick={() => setShowSortModal(true)} 
            className="mobile-bar-btn"
          >
            <ArrowUpDown size={16} color="#4f46e5" />
            Sort
          </button>
          <div style={{ width: '1px', backgroundColor: '#eaeaea' }}></div>
          <button 
            onClick={() => setShowFilterDrawer(true)} 
            className="mobile-bar-btn"
          >
            <SlidersHorizontal size={16} color="#4f46e5" />
            Filter
          </button>
        </div>

        {/* Category Banner Carousel */}
        {(() => {
          const catPromo = promotions && promotions.categoryBanners && promotions.categoryBanners[currentCategory];
          const slides = catPromo && catPromo.show && Array.isArray(catPromo.slides) ? catPromo.slides : [];
          if (slides.length === 0) return null;
          return <CatBannerCarousel slides={slides} />;
        })()}

        {/* Results Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <span className="results-count" style={{ fontSize: '13px', fontWeight: '500', color: '#666666' }}>
            {searchQuery ? (
              <span>Search results for "<strong>{searchQuery}</strong>" ({filteredProducts.length} items)</span>
            ) : (
              <span>Showing {filteredProducts.length} products in <strong>{currentCategory === 'all' ? 'All Categories' : currentCategory.toUpperCase()}</strong></span>
            )}
          </span>
        </div>

        {/* Grid listing */}
        {filteredProducts.length > 0 ? (
          <div className="grid-cols-4" style={{ gap: '16px' }}>
            {filteredProducts.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onNavigateProduct={onNavigateProduct} 
              />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', backgroundColor: 'white', padding: '60px 20px', borderRadius: '4px', border: '1px solid var(--border-light)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>No products found</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px' }}>
              We couldn't find any products in this category matching your search criteria.
            </p>
          </div>
        )}
      </main>


      {/* Sort Bottom Sheet Modal */}
      {showSortModal && createPortal(
        <div className="bottom-sheet-backdrop" onClick={() => setShowSortModal(false)}>
          <div className="bottom-sheet-content" onClick={(e) => e.stopPropagation()}>
            <h4 className="bottom-sheet-title" style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Sort By</h4>
            <div className="sort-option-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { value: 'popularity', label: 'Popularity' },
                { value: 'priceLow', label: 'Price: Low to High' },
                { value: 'priceHigh', label: 'Price: High to Low' },
                { value: 'rating', label: 'Highest Rated' }
              ].map(opt => (
                <label key={opt.value} className="sort-option-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    name="mobile-sort" 
                    checked={sortBy === opt.value} 
                    onChange={() => { setSortBy(opt.value); setShowSortModal(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Filter Slide-in Drawer Modal */}
      {showFilterDrawer && createPortal(
        <div className="filter-drawer-backdrop" onClick={() => setShowFilterDrawer(false)}>
          <div className="filter-drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="filter-drawer-header">
              <span>Filters</span>
              <button className="filter-drawer-clear" onClick={() => { handleResetFilters(); setShowFilterDrawer(false); }}>
                Clear All
              </button>
            </div>
            
            <div className="filter-drawer-body">
              {/* Category filter */}
              <div className="drawer-filter-section">
                <h5 className="filter-title">Category</h5>
                <select 
                  value={currentCategory} 
                  onChange={(e) => onSelectCategory(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid var(--border-light)', borderRadius: '4px', backgroundColor: 'white' }}
                >
                  <option value="all">All Categories</option>
                  <option value="mobiles">Mobiles</option>
                  <option value="electronics">Electronics</option>
                  <option value="fashion">Fashion</option>
                  <option value="home">Home & Living</option>
                  <option value="appliances">Appliances</option>
                </select>
              </div>

              {/* Price range */}
              <div className="drawer-filter-section">
                <h5 className="filter-title">Price Range</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Max Price: ₹{maxPrice.toLocaleString('en-IN')}</label>
                  <input 
                    type="range" 
                    min="1000" 
                    max="150000" 
                    step="1000"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    style={{ width: '100%', cursor: 'pointer' }}
                  />
                </div>
              </div>

              {/* Ratings */}
              <div className="drawer-filter-section">
                <h5 className="filter-title">Customer Ratings</h5>
                <ul className="filter-list">
                  {[4, 3, 2].map(stars => (
                    <li key={stars}>
                      <label className="filter-item-label">
                        <input 
                          type="radio" 
                          name="drawer-rating-filter" 
                          checked={selectedRating === stars}
                          onChange={() => setSelectedRating(stars)}
                        />
                        <span>{stars}★ & above</span>
                      </label>
                    </li>
                  ))}
                  <li>
                    <label className="filter-item-label">
                      <input 
                        type="radio" 
                        name="drawer-rating-filter" 
                        checked={selectedRating === null}
                        onChange={() => setSelectedRating(null)}
                      />
                      <span>All Ratings</span>
                    </label>
                  </li>
                </ul>
              </div>
            </div>

            <div className="filter-drawer-footer">
              <button className="btn btn-accent btn-block" onClick={() => { setShowFilterDrawer(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={{ width: '100%', height: '42px', fontWeight: 'bold' }}>
                APPLY FILTERS ({filteredProducts.length} items)
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ProductCatalog;
