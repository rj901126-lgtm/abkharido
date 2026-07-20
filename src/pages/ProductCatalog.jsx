import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import ProductCard from '../components/ProductCard';
import { Filter, Star, RefreshCw, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import '../assets/styles/product.css';

/* ─── Auto-rotating Category Banner Carousel ─── */
const CatBannerCarousel = ({ slides }) => {
  const [idx, setIdx] = useState(0);
  const timerRef = useRef(null);

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
    <div style={{ position: 'relative', width: '100%', marginBottom: '16px', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.10)' }}>
      <div
        className="animate-fade-in"
        style={{
          width: '100%',
          height: '140px',
          background: hasImage 
            ? `url(${slide.image}) no-repeat center center / cover, ${slide.bg || 'linear-gradient(135deg,#4f46e5,#3730a3)'}` 
            : (slide.bg || 'linear-gradient(135deg,#4f46e5,#3730a3)'),
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          padding: hasImage && isImageOnly ? '0' : '16px 20px'
        }}
      >
        {/* Dark overlay for text readability on images */}
        {hasImage && !isImageOnly && (
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 100%)' }} />
        )}

        {/* Text content overlay */}
        {!isImageOnly && (
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '75%' }}>
            {slide.tag && (
              <span style={{ fontSize: '9px', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', color: '#fff', background: 'rgba(255,255,255,0.22)', borderRadius: '3px', padding: '2px 7px', width: 'fit-content' }}>
                {slide.tag}
              </span>
            )}
            {slide.title && (
              <span style={{ fontSize: '15px', fontWeight: '800', color: '#fff', lineHeight: 1.2, textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
                {slide.title}
              </span>
            )}
            {slide.desc && (
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.88)', lineHeight: 1.3 }}>
                {slide.desc}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Dot indicators */}
      {slides.length > 1 && (
        <div style={{ position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '5px' }}>
          {slides.map((_, i) => (
            <div
              key={i}
              onClick={() => { setIdx(i); clearInterval(timerRef.current); }}
              style={{
                width: i === idx ? '18px' : '6px',
                height: '6px',
                borderRadius: '3px',
                background: i === idx ? '#fff' : 'rgba(255,255,255,0.5)',
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      filtered = filtered.filter(p => {
        const name = p.name ? p.name.toLowerCase() : '';
        const description = p.description ? p.description.toLowerCase() : '';
        const category = p.category ? p.category.toLowerCase() : '';
        return name.includes(query) || description.includes(query) || category.includes(query);
      });
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
    <div className="container catalog-container animate-fade-in">
      
      {/* 1. DESKTOP FILTERS SIDEBAR (Visible on screens > 768px via CSS) */}
      <aside className="filters-sidebar">
        {/* Sort By section */}
        <div className="filter-section">
          <h5 className="filter-title" style={{ fontSize: '12px', letterSpacing: '0.5px', marginBottom: '10px' }}>Sort By</h5>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            style={{ width: '100%', padding: '8px', border: '1px solid var(--border-light)', borderRadius: '4px', backgroundColor: 'white', fontSize: '13px' }}
          >
            <option value="popularity">Popularity</option>
            <option value="priceLow">Price: Low to High</option>
            <option value="priceHigh">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>

        {/* Category section */}
        <div className="filter-section">
          <h5 className="filter-title" style={{ fontSize: '12px', letterSpacing: '0.5px', marginBottom: '10px' }}>Category</h5>
          <select 
            value={currentCategory} 
            onChange={(e) => onSelectCategory(e.target.value)}
            style={{ width: '100%', padding: '8px', border: '1px solid var(--border-light)', borderRadius: '4px', backgroundColor: 'white', fontSize: '13px' }}
          >
            <option value="all">All Categories</option>
            <option value="mobiles">Mobiles</option>
            <option value="electronics">Electronics</option>
            <option value="fashion">Fashion</option>
            <option value="home">Home &amp; Living</option>
            <option value="appliances">Appliances</option>
          </select>
        </div>

        {/* Price section */}
        <div className="filter-section">
          <h5 className="filter-title" style={{ fontSize: '12px', letterSpacing: '0.5px', marginBottom: '10px' }}>Price Range</h5>
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

        {/* Ratings section */}
        <div className="filter-section">
          <h5 className="filter-title" style={{ fontSize: '12px', letterSpacing: '0.5px', marginBottom: '10px' }}>Ratings</h5>
          <ul className="filter-list" style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[4, 3, 2].map(stars => (
              <li key={stars}>
                <label className="filter-item-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    name="sidebar-rating-filter" 
                    checked={selectedRating === stars}
                    onChange={() => setSelectedRating(stars)}
                  />
                  <span>{stars}★ &amp; above</span>
                </label>
              </li>
            ))}
            <li>
              <label className="filter-item-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="sidebar-rating-filter" 
                  checked={selectedRating === null}
                  onChange={() => setSelectedRating(null)}
                />
                <span>All Ratings</span>
              </label>
            </li>
          </ul>
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
        
        {/* Category Banner Carousel */}
        {(() => {
          const catPromo = promotions && promotions.categoryBanners && promotions.categoryBanners[currentCategory];
          const slides = catPromo && catPromo.show && Array.isArray(catPromo.slides) ? catPromo.slides : [];
          if (slides.length === 0) return null;
          return <CatBannerCarousel slides={slides} />;
        })()}
        
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
      {showSortModal && (
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
        </div>
      )}

      {/* Filter Slide-in Drawer Modal */}
      {showFilterDrawer && (
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
        </div>
      )}
    </div>
  );
};

export default ProductCatalog;
