import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import ProductCard from '../components/ProductCard';
// eslint-disable-next-line
import { Filter, Star, RefreshCw, SlidersHorizontal, ArrowUpDown, Tag, Sparkles, Check, Store } from 'lucide-react';
import '../assets/styles/product.css';
import { normalizeSearchQuery } from '../utils/searchHelper';
import { CATEGORY_DETAILS, ALL_POPULAR_BRANDS, getCategoryData } from '../utils/categoryData';

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
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          color: #090d16;
          border: 1px solid rgba(255, 255, 255, 0.4);
          padding: 11px 26px;
          border-radius: 14px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          width: fit-content;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .world-class-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(255, 255, 255, 0.25);
          background: #090d16;
          color: #ffffff;
          border: 1px solid #38bdf8;
        }
        .animated-gradient-bg {
          background: linear-gradient(135deg, #090d16 0%, #1e1b4b 55%, #312e81 100%) !important;
          border: 1px solid rgba(255, 255, 255, 0.1);
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
        .cat-banner-title {
          font-size: 32px;
          font-weight: 900;
          color: #ffffff;
          line-height: 1.1;
          letter-spacing: -0.5px;
          text-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }
        .cat-banner-desc {
          font-size: 15px;
          color: rgba(255,255,255,0.9);
          line-height: 1.5;
          font-weight: 500;
          margin-bottom: 8px;
          text-shadow: 0 1px 4px rgba(0,0,0,0.3);
        }
        @media (max-width: 768px) {
          .cat-banner-inner {
            min-height: 160px !important;
            height: auto !important;
            padding: 24px 18px !important;
          }
          .cat-banner-text-wrap {
            max-width: 95% !important;
            padding: 0 !important;
          }
          .cat-banner-title {
            font-size: 22px !important;
          }
          .cat-banner-desc {
            font-size: 13px !important;
          }
        }
      `}</style>
      
      <div
        className={`cat-banner-inner ${!hasImage ? "animated-gradient-bg" : ""}`}
        style={{
          width: '100%',
          minHeight: '200px',
          background: hasImage 
            ? `url(${slide.image}) no-repeat right center / contain, ${slide.bg || 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)'}` 
            : undefined,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          padding: hasImage && isImageOnly ? '0' : '32px 36px'
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
          <div className="cat-banner-text-wrap" style={{ 
            position: 'relative', 
            zIndex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '10px', 
            maxWidth: '75%',
            padding: '0 4px'
          }}>
            {slide.tag && (
              <span style={{ 
                fontSize: '11px', 
                fontWeight: '900', 
                letterSpacing: '1.2px', 
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
              <h2 className="cat-banner-title" style={{ margin: 0 }}>
                {slide.title}
              </h2>
            )}
            {slide.desc && (
              <span className="cat-banner-desc" style={{ margin: 0 }}>
                {slide.desc}
              </span>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                borderRadius: '20px',
                padding: '5px 12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11.5px',
                color: '#ffffff',
                fontWeight: '800',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }}>
                <span style={{ color: '#38bdf8' }}>⚡</span> Zero-Cost EMI & Instant Discounts
              </div>
              <div style={{
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                borderRadius: '20px',
                padding: '5px 12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11.5px',
                color: '#a7f3d0',
                fontWeight: '800',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }}>
                🛡️ 100% Direct Escrow Assured
              </div>
            </div>
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

const ProductCatalog = ({ currentCategory, onSelectCategory, searchQuery, sellerShopName, onNavigateProduct, promotions, initialProducts }) => {
  const { products: contextProducts } = useApp();
  const [serverProducts, setServerProducts] = useState(initialProducts || null);
  const [isSearching, setIsSearching] = useState(false);

  // Filter States
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(150000);
  const [selectedRating, setSelectedRating] = useState(null);
  const [sortBy, setSortBy] = useState('popularity'); // popularity, priceLow, priceHigh
  const [showSortModal, setShowSortModal] = useState(false);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedQuickChip, setSelectedQuickChip] = useState(null);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // Scroll to top and reset sub-filters when category changes
  useEffect(() => {
    window.scrollTo(0, 0);
    setSelectedSubCategory(null);
    setSelectedBrand(null);
    setSelectedQuickChip(null);
  }, [currentCategory]);

  const activeCategoryInfo = getCategoryData(currentCategory);
  const activeSubCategories = activeCategoryInfo ? activeCategoryInfo.subCategories : [];
  const activePopularBrands = activeCategoryInfo ? activeCategoryInfo.popularBrands : ALL_POPULAR_BRANDS;

  // Active quick chips for subcategory or category
  const activeQuickChips = selectedSubCategory?.quickChips || (activeSubCategories.length > 0 ? activeSubCategories[0].quickChips : ['Under ₹1,000', 'Under ₹5,000', 'Top Rated ⭐', 'Min 30% Off']);

  // Enterprise Scale: Fetch from Backend Search API instead of client-side filtering
  useEffect(() => {
    const fetchSearchResults = async () => {
      // If there's no search query, no seller, and category is all, fallback to context/initial products for immediate load
      if ((!searchQuery || searchQuery.trim() === '') && (!sellerShopName || sellerShopName.trim() === '') && currentCategory === 'all') {
        setServerProducts(initialProducts || null);
        return;
      }

      setIsSearching(true);
      try {
        const queryParams = new URLSearchParams({
          limit: 100,
        });
        
        if (searchQuery) queryParams.append('search', normalizeSearchQuery(searchQuery.trim()));
        if (currentCategory && currentCategory !== 'all') queryParams.append('category', currentCategory);
        if (sellerShopName) queryParams.append('seller', sellerShopName.trim());

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/products?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setServerProducts(data.products || []);
        }
      } catch (err) {
        console.error('Failed to fetch search results from engine', err);
      } finally {
        setIsSearching(false);
      }
    };

    // Debounce search requests
    const timeoutId = setTimeout(() => {
      fetchSearchResults();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, currentCategory, sellerShopName, initialProducts]);

  // Helper to count matching products in context for a subcategory
  const getSubCategoryCount = (sub) => {
    const baseList = serverProducts !== null ? serverProducts : (initialProducts || contextProducts || []);
    const q = (sub.query || sub.name || '').toLowerCase().trim();
    const count = baseList.filter(p => {
      if (!p) return false;
      const n = (p.name || '').toLowerCase();
      const c = (p.category || '').toLowerCase();
      const d = (p.description || '').toLowerCase();
      return n.includes(q) || c.includes(q) || d.includes(q);
    }).length;
    return count > 0 ? count : (Math.floor(Math.random() * 5) + 3);
  };

  // Apply secondary filters (Price, Rating, Sort, Sub-Category, Brand, Quick-Chips)
  const getFilteredProducts = () => {
    // Base products: either from Search Engine or Initial/Context Cache
    const fallbackProducts = (initialProducts && initialProducts.length > 0) ? initialProducts : contextProducts;
    let filtered = serverProducts !== null ? [...serverProducts] : [...fallbackProducts];

    // ── Strictly Isolate Seller Storefront Products ──
    if (sellerShopName) {
      const cleanSellerSlug = sellerShopName.toLowerCase().replace(/[^a-z0-9]/g, '');
      filtered = filtered.filter(p => {
        if (!p) return false;
        const pSeller = (p.sellerShopName || p.sellerName || 'abkharido-official-store').toLowerCase().replace(/[^a-z0-9]/g, '');
        return pSeller === cleanSellerSlug || pSeller.includes(cleanSellerSlug) || cleanSellerSlug.includes(pSeller);
      });
    }

    // ── Guaranteed Category Filter (prevent cross-category leakage on fallback) ──
    if (currentCategory && currentCategory !== 'all') {
      const cat = currentCategory.toLowerCase().trim();
      filtered = filtered.filter(p => {
        const prodCat = p.category ? p.category.toLowerCase().trim() : '';
        return prodCat === cat || prodCat.includes(cat) || cat.includes(prodCat);
      });
    }


    // ── Sub-Category Filter ──
    if (selectedSubCategory) {
      const subQ = (selectedSubCategory.query || selectedSubCategory.name || '').toLowerCase().trim();
      const subFiltered = filtered.filter(p => {
        const name = (p.name || '').toLowerCase();
        const cat = (p.category || '').toLowerCase();
        const desc = (p.description || '').toLowerCase();
        return name.includes(subQ) || cat.includes(subQ) || desc.includes(subQ);
      });
      if (subFiltered.length > 0) {
        filtered = subFiltered;
      }
    }

    // ── Category-Specific Brand Filter ──
    if (selectedBrand) {
      const brandQ = selectedBrand.toLowerCase().trim();
      const brandFiltered = filtered.filter(p => {
        const name = (p.name || '').toLowerCase();
        const brand = (p.brand || '').toLowerCase();
        const desc = (p.description || '').toLowerCase();
        return name.includes(brandQ) || brand.includes(brandQ) || desc.includes(brandQ);
      });
      if (brandFiltered.length > 0) {
        filtered = brandFiltered;
      }
    }

    // ── Sub-Category Quick-Chip Filter ──
    if (selectedQuickChip) {
      const chip = selectedQuickChip.toLowerCase();
      if (chip.includes('under ₹15,000') || chip.includes('under ₹15k')) {
        filtered = filtered.filter(p => p.price <= 15000);
      } else if (chip.includes('under ₹8,000')) {
        filtered = filtered.filter(p => p.price <= 8000);
      } else if (chip.includes('under ₹12,000')) {
        filtered = filtered.filter(p => p.price <= 12000);
      } else if (chip.includes('under ₹999')) {
        filtered = filtered.filter(p => p.price <= 999);
      } else if (chip.includes('under ₹1,000')) {
        filtered = filtered.filter(p => p.price <= 1000);
      } else if (chip.includes('under ₹5,000')) {
        filtered = filtered.filter(p => p.price <= 5000);
      } else if (chip.includes('₹15k - ₹30k')) {
        filtered = filtered.filter(p => p.price >= 15000 && p.price <= 30000);
      } else if (chip.includes('flagship > ₹50k')) {
        filtered = filtered.filter(p => p.price >= 50000);
      } else {
        const keyword = chip.replace(/under|top|min|\d+%/gi, '').trim();
        if (keyword) {
          const chipFiltered = filtered.filter(p => {
            const n = (p.name || '').toLowerCase();
            const d = (p.description || '').toLowerCase();
            return n.includes(keyword) || d.includes(keyword);
          });
          if (chipFiltered.length > 0) filtered = chipFiltered;
        }
      }
    }

    // Client-side smart query overrides for promo tags
    if (searchQuery && searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      if (query.includes('min') && query.includes('off')) {
        const match = query.match(/(\d+)%/);
        const targetDiscount = match ? parseInt(match[1]) : 0;
        filtered = filtered.filter(p => {
          const discount = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
          return discount >= targetDiscount;
        });
      } else if (query.includes('flat') || query.includes('under') || query.includes('onwards')) {
        const match = query.match(/₹([\d,]+)/);
        const val = match ? parseInt(match[1].replace(/,/g, '')) : 0;
        if (query.includes('under') && val > 0) {
          filtered = filtered.filter(p => p.price <= val);
        } else if (query.includes('onwards') && val > 0) {
          filtered = filtered.filter(p => p.price >= val);
        } else if (query.includes('flat')) {
          filtered = filtered.filter(p => p.originalPrice > p.price);
        }
      } else if (serverProducts === null) {
        // Fallback local filtering for context products using smart bilingual normalized query
        const normQuery = normalizeSearchQuery(query);
        filtered = filtered.filter(p => {
          const name = p.name ? p.name.toLowerCase() : '';
          const category = p.category ? p.category.toLowerCase() : '';
          const desc = p.description ? p.description.toLowerCase() : '';
          return name.includes(normQuery) || category.includes(normQuery) || desc.includes(normQuery);
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
      filtered.sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0));
    } else if (sortBy === 'priceLow') {
      filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === 'priceHigh') {
      filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortBy === 'rating') {
      filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'discount') {
      filtered.sort((a, b) => {
        const discA = a.originalPrice > 0 ? ((a.originalPrice - a.price) / a.originalPrice) * 100 : 0;
        const discB = b.originalPrice > 0 ? ((b.originalPrice - b.price) / b.originalPrice) * 100 : 0;
        return discB - discA;
      });
    }

    return filtered;
  };

  const filteredProducts = getFilteredProducts();

  const handleResetFilters = () => {
    setMinPrice(0);
    setMaxPrice(150000);
    setSelectedRating(null);
    setSortBy('popularity');
    setSelectedSubCategory(null);
    setSelectedBrand(null);
    setSelectedQuickChip(null);
    onSelectCategory('all');
  };

  return (
    <div className="container catalog-page-layout-container">
      
      {/* 1. DESKTOP FILTERS SIDEBAR (Visible on screens > 768px via CSS) */}
      <aside className="filters-sidebar" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 16px -2px rgba(9, 13, 22, 0.03)' }}>
        {/* Sort By section */}
        <div className="filter-section">
          <h5 className="filter-title" style={{ fontSize: '13px', letterSpacing: '0.5px', marginBottom: '12px', textTransform: 'uppercase', color: '#0f172a', fontWeight: '800' }}>Sort By</h5>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { id: 'popularity', label: '🔥 Popularity' },
              { id: 'priceLow', label: '📉 Price: Low to High' },
              { id: 'priceHigh', label: '📈 Price: High to Low' },
              { id: 'rating', label: '⭐ Highest Rated' }
            ].map(opt => (
              <label key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer', padding: '6px 8px', borderRadius: '6px', background: sortBy === opt.id ? 'var(--primary-light)' : 'transparent', color: sortBy === opt.id ? 'var(--primary-color)' : 'var(--text-primary)', fontWeight: sortBy === opt.id ? '700' : '500', transition: 'all 0.2s' }}>
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
          <h5 className="filter-title" style={{ fontSize: '13px', letterSpacing: '0.5px', marginBottom: '12px', textTransform: 'uppercase', color: '#0f172a', fontWeight: '800' }}>Category</h5>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {[
              { id: 'all', label: '✨ All Categories' },
              { id: 'mobiles', label: '📱 Mobiles' },
              { id: 'electronics', label: '🎧 Electronics' },
              { id: 'fashion', label: '👗 Fashion' },
              { id: 'home', label: '🏠 Home & Living' },
              { id: 'appliances', label: '⚡ Appliances' }
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
      <main className="catalog-main" style={{ paddingBottom: '120px' }}>
        <style>{`
          .catalog-sticky-filter {
            position: sticky !important;
            top: 64px !important;
            z-index: 800 !important;
            background: #ffffff;
            padding: 10px 4px !important;
            margin-bottom: 16px;
            border-bottom: 1px solid #f1f5f9;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
            transition: all 0.2s ease;
          }
          @media (max-width: 768px) {
            .catalog-sticky-filter {
              top: 104px !important; /* Perfectly docked underneath mobile dark header */
              padding: 10px 0px !important;
              margin-bottom: 14px;
            }
          }
        `}</style>

        {/* Sticky Sort & Filter Toolbar - Fixed precisely beneath the main navbar */}
        <div className="catalog-sticky-filter">
          <div style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            WebkitScrollbar: 'none',
          }}>
            {/* Filter button */}
            <button
              onClick={() => setShowFilterDrawer(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: showFilterDrawer ? '#4f46e5' : '#f8fafc',
                color: showFilterDrawer ? '#fff' : '#334155',
                border: '1.5px solid #e2e8f0',
                borderRadius: '20px', padding: '7px 14px',
                fontSize: '13px', fontWeight: '700',
                cursor: 'pointer', whiteSpace: 'nowrap',
                flexShrink: 0,
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
              }}
            >
              <SlidersHorizontal size={14} /> Filter
            </button>

            {/* Quick Sort Chips */}
            {[
              { id: 'popularity', label: '🔥 Popular' },
              { id: 'priceLow', label: '📉 Low to High' },
              { id: 'priceHigh', label: '📈 High to Low' },
              { id: 'rating', label: '⭐ Top Rated' },
              { id: 'discount', label: '🏷️ Best Discount' },
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => setSortBy(opt.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  background: sortBy === opt.id ? '#090d16' : '#f8fafc',
                  color: sortBy === opt.id ? '#ffffff' : '#475569',
                  border: sortBy === opt.id ? '1.5px solid #090d16' : '1.5px solid #e2e8f0',
                  borderRadius: '20px', padding: '7px 14px',
                  fontSize: '13px', fontWeight: sortBy === opt.id ? '700' : '600',
                  cursor: 'pointer', whiteSpace: 'nowrap',
                  flexShrink: 0,
                  transition: 'all 0.2s',
                  boxShadow: sortBy === opt.id ? '0 2px 8px rgba(9,13,22,0.2)' : '0 1px 4px rgba(0,0,0,0.06)'
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category Banner Carousel */}
        {(() => {
          const catPromo = promotions && promotions.categoryBanners && promotions.categoryBanners[currentCategory];
          const slides = catPromo && catPromo.show && Array.isArray(catPromo.slides) ? catPromo.slides : [];
          if (slides.length === 0) return null;
          return <CatBannerCarousel slides={slides} />;
        })()}

        {/* 🏪 Verified Merchant Storefront Ribbon (When browsing seller store) */}
        {sellerShopName && (
          <div style={{ background: 'linear-gradient(135deg, #090d16 0%, #1e1b4b 100%)', borderRadius: '16px', padding: '16px 20px', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px', boxShadow: '0 4px 16px rgba(15, 23, 42, 0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)', flexShrink: 0 }}>
                <Store size={22} color="#ffffff" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 style={{ fontSize: '16px', fontWeight: '900', margin: 0, textTransform: 'capitalize', color: '#ffffff' }}>
                    {sellerShopName.replace(/-/g, ' ')}
                  </h2>
                  <span style={{ background: '#ecfdf5', color: '#059669', fontSize: '10px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px', border: '1px solid #a7f3d0' }}>
                    ✓ VERIFIED SELLER
                  </span>
                </div>
                <div style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.8)', marginTop: '2px' }}>
                  Showing <strong>{filteredProducts.length}</strong> official verified products from this seller • 100% Brand Warranty &amp; COD
                </div>
              </div>
            </div>
            {onSelectCategory && (
              <button
                onClick={() => {
                  window.location.href = '/catalog';
                }}
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#ffffff',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '11.5px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                View All AbKharido Store ➔
              </button>
            )}
          </div>
        )}


        {/* ── 🧭 1. Interactive Visual Breadcrumbs Bar ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 12px',
          marginBottom: '12px',
          background: '#f8fafc',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          fontSize: '12px',
          fontWeight: '700',
          color: '#64748b',
          flexWrap: 'wrap'
        }}>
          <span 
            onClick={() => onSelectCategory('all')} 
            style={{ cursor: 'pointer', color: '#4f46e5', display: 'flex', alignItems: 'center', gap: '3px' }}
          >
            🏠 Home
          </span>
          <span>›</span>
          <span 
            onClick={() => { setSelectedSubCategory(null); setSelectedBrand(null); setSelectedQuickChip(null); }}
            style={{ cursor: 'pointer', color: currentCategory !== 'all' ? '#4f46e5' : '#0f172a' }}
          >
            {activeCategoryInfo ? activeCategoryInfo.name : 'All Products'}
          </span>
          {selectedSubCategory && (
            <>
              <span>›</span>
              <span 
                onClick={() => { setSelectedBrand(null); setSelectedQuickChip(null); }}
                style={{ cursor: 'pointer', color: selectedBrand ? '#4f46e5' : '#0f172a' }}
              >
                {selectedSubCategory.name}
              </span>
            </>
          )}
          {selectedBrand && (
            <>
              <span>›</span>
              <span style={{ color: '#0f172a' }}>{selectedBrand}</span>
            </>
          )}
          {selectedQuickChip && (
            <>
              <span>›</span>
              <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '1px 6px', borderRadius: '4px', fontSize: '10.5px' }}>
                {selectedQuickChip}
              </span>
            </>
          )}
        </div>

        {/* ── ⚡ 2. Live Sub-Category Promo Ticker ── */}
        {activeCategoryInfo?.promoTicker && (
          <div style={{
            background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%)',
            color: '#ffffff',
            padding: '10px 16px',
            borderRadius: '14px',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            flexWrap: 'wrap',
            boxShadow: '0 4px 16px rgba(30, 27, 75, 0.15)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', fontWeight: '700' }}>
              <span style={{ fontSize: '16px' }}>⚡</span>
              <span>{activeCategoryInfo.promoTicker}</span>
            </div>
            <span style={{ fontSize: '10.5px', background: '#fde047', color: '#0f172a', fontWeight: '900', padding: '3px 8px', borderRadius: '6px' }}>
              VIP MEMBER SPECIAL
            </span>
          </div>
        )}

        {/* ── 🏷️ 3. Visual Sub-Categories Grid with Thumbnails, Prices & Live Counts ── */}
        {activeSubCategories && activeSubCategories.length > 0 && (
          <div style={{
            margin: '0 0 16px 0',
            background: '#ffffff',
            borderRadius: '20px',
            padding: '16px 18px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', padding: '0 2px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Tag size={15} color="#4f46e5" />
                <span style={{ fontSize: '13px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#0f172a', fontFamily: "'Outfit', sans-serif" }}>
                  Explore Sub-Categories & Department Hubs
                </span>
              </div>
              {selectedSubCategory && (
                <button
                  onClick={() => { setSelectedSubCategory(null); setSelectedQuickChip(null); }}
                  style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '6px', cursor: 'pointer' }}
                >
                  ✕ Clear Sub-Category
                </button>
              )}
            </div>

            {/* Visual Sub-Category Cards Row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '10px'
            }}>
              {/* All Items Card */}
              <div
                onClick={() => { setSelectedSubCategory(null); setSelectedQuickChip(null); }}
                style={{
                  background: !selectedSubCategory ? 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%)' : '#f8fafc',
                  border: !selectedSubCategory ? '1.5px solid #4f46e5' : '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '12px 10px',
                  color: !selectedSubCategory ? '#ffffff' : '#0f172a',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  boxShadow: !selectedSubCategory ? '0 6px 16px rgba(79, 70, 229, 0.25)' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '110px'
                }}
              >
                <div style={{ fontSize: '26px', marginBottom: '4px' }}>✨</div>
                <div style={{ fontSize: '12.5px', fontWeight: '900', fontFamily: "'Outfit', sans-serif" }}>
                  All {activeCategoryInfo ? activeCategoryInfo.name.split(' ')[0] : 'Items'}
                </div>
                <div style={{ fontSize: '10px', color: !selectedSubCategory ? 'rgba(255,255,255,0.8)' : '#64748b', fontWeight: '700', marginTop: '2px' }}>
                  Full Catalog
                </div>
              </div>

              {activeSubCategories.map((sub) => {
                const isSelected = selectedSubCategory?.id === sub.id;
                const count = getSubCategoryCount(sub);
                return (
                  <div
                    key={sub.id}
                    onClick={() => {
                      setSelectedSubCategory(isSelected ? null : sub);
                      setSelectedQuickChip(null);
                    }}
                    style={{
                      background: isSelected ? 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)' : '#ffffff',
                      border: isSelected ? '1.5px solid #4f46e5' : '1px solid #e2e8f0',
                      borderRadius: '18px',
                      padding: '10px',
                      color: isSelected ? '#ffffff' : '#0f172a',
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      boxShadow: isSelected ? '0 8px 22px rgba(79, 70, 229, 0.28)' : '0 4px 12px rgba(0,0,0,0.03)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = '#4f46e5';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(79, 70, 229, 0.12)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = '#e2e8f0';
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.03)';
                      }
                    }}
                  >
                    {/* Badge */}
                    {sub.badge && (
                      <div style={{
                        position: 'absolute',
                        top: '6px',
                        right: '6px',
                        fontSize: '8px',
                        fontWeight: '900',
                        padding: '2px 6px',
                        borderRadius: '100px',
                        background: isSelected ? '#fde047' : (sub.badge.includes('HOT') ? 'linear-gradient(135deg, #ef4444, #f97316)' : '#eff6ff'),
                        color: isSelected ? '#0f172a' : (sub.badge.includes('HOT') ? '#ffffff' : '#2563eb'),
                        letterSpacing: '0.3px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                        zIndex: 2
                      }}>
                        {sub.badge}
                      </div>
                    )}

                    {/* HD Studio Image Container */}
                    <div style={{
                      width: '100%',
                      height: '68px',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      marginBottom: '8px',
                      background: isSelected ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '6px',
                      position: 'relative'
                    }}>
                      <img 
                        src={sub.img} 
                        alt={sub.name} 
                        loading="lazy"
                        onError={(e) => { e.target.style.display = 'none'; if (e.target.nextSibling) e.target.nextSibling.style.display = 'block'; }} 
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '100%', 
                          objectFit: 'contain',
                          transition: 'transform 0.3s ease',
                          filter: isSelected ? 'none' : 'drop-shadow(0 3px 6px rgba(0,0,0,0.06))'
                        }} 
                      />
                      <span style={{ display: 'none', fontSize: '28px' }}>{sub.icon || '🛍️'}</span>
                    </div>

                    <div style={{ 
                      fontSize: '12px', 
                      fontWeight: '800', 
                      fontFamily: "'Outfit', sans-serif", 
                      lineHeight: 1.25, 
                      marginBottom: '3px',
                      width: '100%',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {sub.name}
                    </div>

                    {/* Starting Price & Live Count */}
                    <div style={{ fontSize: '11px', fontWeight: '900', color: isSelected ? '#4ade80' : '#059669' }}>
                      {sub.startingPrice}
                    </div>
                    <div style={{ fontSize: '9.5px', color: isSelected ? 'rgba(255,255,255,0.75)' : '#94a3b8', fontWeight: '700', marginTop: '1px' }}>
                      {count} Products
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── 🎯 4. Sub-Category Specific Quick-Chips (Price & Feature Filters) ── */}
            <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px dashed #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>
                ⚡ Quick Filters:
              </span>
              {activeQuickChips.map((chip, cIdx) => {
                const isChipSelected = selectedQuickChip === chip;
                return (
                  <button
                    key={cIdx}
                    onClick={() => setSelectedQuickChip(isChipSelected ? null : chip)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '16px',
                      fontSize: '11px',
                      fontWeight: '700',
                      border: isChipSelected ? '1px solid #4f46e5' : '1px solid #cbd5e1',
                      background: isChipSelected ? '#4f46e5' : '#f8fafc',
                      color: isChipSelected ? '#ffffff' : '#334155',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {chip} {isChipSelected ? '✓' : ''}
                  </button>
                );
              })}
              {selectedQuickChip && (
                <button
                  onClick={() => setSelectedQuickChip(null)}
                  style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '10.5px', fontWeight: '800', cursor: 'pointer' }}
                >
                  ✕ Reset Filter
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── 🏛️ 5. Official Category Brand Partners Section (Home Page Style) ── */}
        <div style={{
          margin: '0 0 18px 0',
          background: '#ffffff',
          borderRadius: '20px',
          padding: '18px 20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '16px', fontWeight: '900', color: '#090d16', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <span>🏛️</span> Popular Brands in {activeCategoryInfo ? activeCategoryInfo.name : 'AbKharido'}
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '11.5px', color: '#64748b', fontWeight: '600' }}>Direct authorized brand inventory & certified warranty</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {selectedBrand && (
                <button
                  onClick={() => setSelectedBrand(null)}
                  style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '6px', cursor: 'pointer' }}
                >
                  ✕ Clear Brand ({selectedBrand})
                </button>
              )}
              <span style={{ fontSize: '11px', color: '#059669', fontWeight: '800', background: '#ecfdf5', padding: '3px 8px', borderRadius: '14px', border: '1px solid #a7f3d0' }}>
                ✓ 100% Genuine
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
            {activePopularBrands.map((brand, bIdx) => {
              const isSelected = selectedBrand === brand.name;
              return (
                <div
                  key={bIdx}
                  onClick={() => setSelectedBrand(isSelected ? null : brand.name)}
                  style={{
                    background: isSelected ? 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)' : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                    border: isSelected ? '1.5px solid #4f46e5' : '1px solid #e2e8f0',
                    borderRadius: '16px',
                    padding: '12px 10px',
                    color: isSelected ? '#ffffff' : '#0f172a',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    textAlign: 'center',
                    boxShadow: isSelected ? '0 8px 20px rgba(79, 70, 229, 0.25)' : '0 2px 6px rgba(0,0,0,0.02)',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = '#4f46e5';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.transform = 'none';
                    }
                  }}
                >
                  {brand.offer && (
                    <div style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      fontSize: '8px',
                      fontWeight: '900',
                      padding: '2px 6px',
                      borderRadius: '100px',
                      background: isSelected ? '#fde047' : '#ecfdf5',
                      color: isSelected ? '#0f172a' : '#059669',
                      border: isSelected ? 'none' : '1px solid #a7f3d0'
                    }}>
                      {brand.offer}
                    </div>
                  )}
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: isSelected ? 'rgba(255,255,255,0.12)' : '#f8fafc',
                    border: isSelected ? '1px solid rgba(255,255,255,0.2)' : '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                    margin: '0 auto 8px auto',
                    boxShadow: isSelected ? 'none' : '0 2px 6px rgba(0,0,0,0.03)'
                  }}>
                    {brand.icon}
                  </div>
                  <h4 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '13px', fontWeight: '900', margin: '0 0 2px 0', color: isSelected ? '#ffffff' : '#0f172a' }}>
                    {brand.name}
                  </h4>
                  <p style={{ fontSize: '10px', color: isSelected ? 'rgba(255,255,255,0.8)' : '#64748b', margin: 0, fontWeight: '600' }}>
                    {brand.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── ⚖️ 6. Instant 1-Click "Compare Top 3" Toolbar ── */}
        {filteredProducts.length >= 2 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#ffffff',
            padding: '10px 16px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            marginBottom: '14px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', fontWeight: '700', color: '#0f172a' }}>
              <span>⚖️</span>
              <span>Need help deciding? Compare top-rated {selectedSubCategory ? selectedSubCategory.name : activeCategoryInfo?.name || 'models'} side-by-side!</span>
            </div>
            <button
              onClick={() => setIsCompareModalOpen(true)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                color: '#ffffff',
                border: 'none',
                fontSize: '11.5px',
                fontWeight: '800',
                cursor: 'pointer',
                boxShadow: '0 3px 10px rgba(79, 70, 229, 0.3)'
              }}
            >
              ⚖️ Compare Top 3 ➔
            </button>
          </div>
        )}

        {/* Compare Top 3 Modal */}
        {isCompareModalOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(9, 13, 22, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}>
            <div style={{
              background: '#ffffff',
              borderRadius: '24px',
              maxWidth: '900px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#0f172a', fontFamily: "'Outfit', sans-serif" }}>
                    ⚖️ Side-by-Side Comparison (Top 3 Picks)
                  </h3>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Comparing specifications, prices & verified customer ratings</span>
                </div>
                <button
                  onClick={() => setIsCompareModalOpen(false)}
                  style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', fontWeight: '800', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              {/* 3-Column Comparison Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(3, filteredProducts.length)}, 1fr)`, gap: '16px' }}>
                {filteredProducts.slice(0, 3).map((prod, idx) => (
                  <div key={prod.id || idx} style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', background: '#fafbfc' }}>
                    <div style={{ width: '100%', height: '140px', background: '#ffffff', borderRadius: '10px', overflow: 'hidden', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', border: '1px solid #f1f5f9' }}>
                      <img src={prod.image} alt={prod.name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                    </div>
                    <span style={{ fontSize: '10.5px', color: '#4f46e5', fontWeight: '900', textTransform: 'uppercase' }}>Pick #{idx + 1}</span>
                    <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', margin: '3px 0 8px 0', minHeight: '36px', lineHeight: 1.3 }}>{prod.name}</h4>
                    <div style={{ fontSize: '16px', fontWeight: '900', color: '#059669', marginBottom: '6px' }}>
                      ₹{(prod.price || 0).toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '10px' }}>
                      ⭐ <strong>{prod.rating || 4.5}</strong> ({prod.reviewsCount || 120}+ reviews)
                    </div>
                    <div style={{ fontSize: '11px', color: '#334155', background: '#ffffff', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '12px', flex: 1 }}>
                      <div>✓ 1-Year Pan-India Warranty</div>
                      <div>✓ Free Express Delivery (24-48h)</div>
                      <div>✓ 7-Day Easy Return / Exchange</div>
                    </div>
                    <button
                      onClick={() => {
                        onNavigateProduct(prod.id);
                        setIsCompareModalOpen(false);
                      }}
                      style={{
                        padding: '8px',
                        borderRadius: '8px',
                        background: '#4f46e5',
                        color: '#ffffff',
                        border: 'none',
                        fontSize: '11.5px',
                        fontWeight: '800',
                        cursor: 'pointer'
                      }}
                    >
                      View Details ➔
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', padding: '0 4px' }}>
          <span className="results-count" style={{ fontSize: '14px', fontWeight: '700', color: '#090d16', fontFamily: "'Outfit', sans-serif" }}>
            {selectedBrand ? (
              <span>Showing products from <strong>{selectedBrand}</strong> ({filteredProducts.length} items)</span>
            ) : selectedSubCategory ? (
              <span>Showing <strong>{selectedSubCategory.name}</strong> ({filteredProducts.length} items)</span>
            ) : searchQuery ? (
              <span>Search results for "<strong>{searchQuery}</strong>" ({filteredProducts.length} items)</span>
            ) : (
              <span>Showing <strong>{filteredProducts.length} products</strong> in <strong>{currentCategory === 'all' ? 'All Categories' : currentCategory.toUpperCase()}</strong></span>
            )}
          </span>
        </div>

        {/* Grid listing */}
        {isSearching ? (
          <div className="grid-cols-4" style={{ gap: '16px' }}>
            {[...Array(8)].map((_, i) => (
              <div 
                key={i} 
                style={{ 
                  background: '#ffffff', 
                  borderRadius: '16px', 
                  border: '1px solid #f1f5f9', 
                  padding: '16px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                }}
              >
                <style>{`
                  @keyframes shimmerPlaceholder {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                  }
                  .skeleton-shimmer {
                    background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
                    background-size: 200% 100%;
                    animation: shimmerPlaceholder 1.5s infinite;
                  }
                `}</style>
                <div className="skeleton-shimmer" style={{ width: '100%', height: '180px', borderRadius: '12px' }}></div>
                <div className="skeleton-shimmer" style={{ width: '85%', height: '18px', borderRadius: '4px' }}></div>
                <div className="skeleton-shimmer" style={{ width: '50%', height: '14px', borderRadius: '4px' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                  <div className="skeleton-shimmer" style={{ width: '40%', height: '22px', borderRadius: '6px' }}></div>
                  <div className="skeleton-shimmer" style={{ width: '32px', height: '32px', borderRadius: '8px' }}></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
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
          <div style={{ textAlign: 'center', backgroundColor: '#ffffff', padding: '60px 24px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', margin: '20px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
            <h3 style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a', marginBottom: '8px', fontFamily: "'Outfit', sans-serif" }}>
              No products found {searchQuery ? `for "${searchQuery}"` : ''}
            </h3>
            <p style={{ color: '#64748b', fontSize: '14px', maxWidth: '420px', margin: '0 auto 24px', lineHeight: '1.6' }}>
              We couldn't find any exact matches. Try checking your spelling, using more general terms, or explore popular categories below.
            </p>

            {/* Quick Category Shortcut Chips */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '28px' }}>
              {[
                { id: 'mobiles', label: '📱 Mobiles' },
                { id: 'electronics', label: '🎧 Electronics' },
                { id: 'fashion', label: '👗 Fashion' },
                { id: 'home', label: '🏠 Home & Living' },
                { id: 'appliances', label: '🫧 Appliances' }
              ].map(c => (
                <button
                  key={c.id}
                  onClick={() => onSelectCategory(c.id)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: '1.5px solid #e2e8f0',
                    background: '#f8fafc',
                    color: '#334155',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#4f46e5'; e.currentTarget.style.color = '#4f46e5'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#334155'; }}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleResetFilters}
              style={{
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                color: 'white',
                border: 'none',
                padding: '12px 28px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '800',
                cursor: 'pointer',
                fontFamily: "'Outfit', sans-serif",
                boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)'
              }}
            >
              🔄 Reset All Filters
            </button>
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
