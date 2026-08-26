"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { 
  Star, 
  SlidersHorizontal, 
  ChevronRight, 
  ChevronDown, 
  Tag, 
  Store, 
  Check, 
  Truck, 
  ShieldCheck, 
  RotateCcw, 
  Zap, 
  Sparkles,
  Search,
  X
} from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { normalizeSearchQuery } from '../utils/searchHelper';
import { getCategoryData, ALL_POPULAR_BRANDS } from '../utils/categoryData';


const ProductCatalog = ({ currentCategory = 'all', onSelectCategory, searchQuery = '', sellerShopName = '', onNavigateProduct, promotions, initialProducts }) => {
  const { products: contextProducts } = useApp();
  const [serverProducts, setServerProducts] = useState(initialProducts || null);
  const [isSearching, setIsSearching] = useState(false);

  // Faceted Filter States
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(150000);
  const [tempMinPrice, setTempMinPrice] = useState('');
  const [tempMaxPrice, setTempMaxPrice] = useState('');
  const [selectedRating, setSelectedRating] = useState(null);
  const [sortBy, setSortBy] = useState('popularity'); // popularity, priceLow, priceHigh, rating, discount, newest
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [brandSearchInput, setBrandSearchInput] = useState('');
  const [selectedQuickChip, setSelectedQuickChip] = useState(null);
  const [isFreeDeliveryOnly, setIsFreeDeliveryOnly] = useState(false);
  const [isWarrantyOnly, setIsWarrantyOnly] = useState(false);
  const [isEmiOnly, setIsEmiOnly] = useState(false);

  // Mobile Drawers
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isDeptTreeOpen, setIsDeptTreeOpen] = useState(true);

  // Scroll to top and reset sub-filters when primary category changes
  useEffect(() => {
    window.scrollTo(0, 0);
    setSelectedSubCategory(null);
    setSelectedBrand(null);
    setSelectedQuickChip(null);
  }, [currentCategory]);

  const activeCategoryInfo = getCategoryData(currentCategory);
  const activeSubCategories = activeCategoryInfo ? activeCategoryInfo.subCategories : [];
  const activePopularBrands = activeCategoryInfo ? activeCategoryInfo.popularBrands : ALL_POPULAR_BRANDS;

  // High-Intent Attribute Quick Filter Chips
  const quickFilterChips = [
    { id: 'free_delivery', label: '⚡ Free Express Delivery' },
    { id: 'no_cost_emi', label: '💳 No-Cost EMI' },
    { id: 'warranty', label: '🛡️ 1 Year Warranty' },
    { id: 'top_rated', label: '⭐ Top Rated (4.5+)' },
    { id: 'under_5k', label: '🏷️ Under ₹5,000' },
    { id: 'under_15k', label: '📱 Under ₹15,000' },
    { id: 'min_30_off', label: '🔥 Min 30% Off' }
  ];

  // Fetch from Backend Search API
  useEffect(() => {
    const fetchSearchResults = async () => {
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

    const timeoutId = setTimeout(() => {
      fetchSearchResults();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, currentCategory, sellerShopName, initialProducts]);

  // Apply Faceted Filters & Sorting
  const filteredProducts = useMemo(() => {
    const fallbackProducts = (initialProducts && initialProducts.length > 0) ? initialProducts : contextProducts;
    let filtered = serverProducts !== null ? [...serverProducts] : [...(fallbackProducts || [])];

    // 1. Strict Seller Isolation
    if (sellerShopName) {
      const cleanSellerSlug = sellerShopName.toLowerCase().replace(/[^a-z0-9]/g, '');
      filtered = filtered.filter(p => {
        if (!p) return false;
        const pSeller = (p.sellerShopName || p.sellerName || 'abkharido-official-store').toLowerCase().replace(/[^a-z0-9]/g, '');
        return pSeller === cleanSellerSlug || pSeller.includes(cleanSellerSlug) || cleanSellerSlug.includes(pSeller);
      });
    }

    // 2. Primary Category Filter
    if (currentCategory && currentCategory !== 'all') {
      const cat = currentCategory.toLowerCase().trim();
      filtered = filtered.filter(p => {
        const prodCat = p.category ? p.category.toLowerCase().trim() : '';
        return prodCat === cat || prodCat.includes(cat) || cat.includes(prodCat);
      });
    }

    // 3. Sub-Category Tree Filter
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

    // 4. Brand Facet Filter
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

    // 5. Price Range Filter
    filtered = filtered.filter(p => (p.price || 0) >= minPrice && (p.price || 0) <= maxPrice);

    // 6. Customer Rating Filter
    if (selectedRating) {
      filtered = filtered.filter(p => (p.rating || 4.5) >= selectedRating);
    }

    // 7. Trust & Logistics Toggles
    if (isFreeDeliveryOnly) {
      filtered = filtered.filter(p => (p.price || 0) >= 499);
    }
    if (isEmiOnly) {
      filtered = filtered.filter(p => (p.price || 0) >= 1500);
    }
    if (isWarrantyOnly) {
      filtered = filtered.filter(p => p.hasProCare || (p.price || 0) >= 999);
    }

    // 8. Quick Chips Override
    if (selectedQuickChip) {
      if (selectedQuickChip === 'free_delivery') {
        filtered = filtered.filter(p => (p.price || 0) >= 499);
      } else if (selectedQuickChip === 'no_cost_emi') {
        filtered = filtered.filter(p => (p.price || 0) >= 1500);
      } else if (selectedQuickChip === 'warranty') {
        filtered = filtered.filter(p => p.hasProCare || (p.price || 0) >= 999);
      } else if (selectedQuickChip === 'top_rated') {
        filtered = filtered.filter(p => (p.rating || 4.5) >= 4.5);
      } else if (selectedQuickChip === 'under_5k') {
        filtered = filtered.filter(p => (p.price || 0) <= 5000);
      } else if (selectedQuickChip === 'under_15k') {
        filtered = filtered.filter(p => (p.price || 0) <= 15000);
      } else if (selectedQuickChip === 'min_30_off') {
        filtered = filtered.filter(p => {
          const disc = p.originalPrice > 0 ? ((p.originalPrice - p.price) / p.originalPrice) * 100 : 0;
          return disc >= 30;
        });
      }
    }

    // 9. Sorting
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
  }, [serverProducts, initialProducts, contextProducts, currentCategory, sellerShopName, selectedSubCategory, selectedBrand, minPrice, maxPrice, selectedRating, isFreeDeliveryOnly, isEmiOnly, isWarrantyOnly, selectedQuickChip, sortBy]);

  const handleResetFilters = () => {
    setMinPrice(0);
    setMaxPrice(150000);
    setTempMinPrice('');
    setTempMaxPrice('');
    setSelectedRating(null);
    setSortBy('popularity');
    setSelectedSubCategory(null);
    setSelectedBrand(null);
    setSelectedQuickChip(null);
    setIsFreeDeliveryOnly(false);
    setIsWarrantyOnly(false);
    setIsEmiOnly(false);
    if (onSelectCategory && currentCategory !== 'all') {
      onSelectCategory('all');
    }
  };

  const handleApplyCustomPrice = () => {
    const minVal = parseInt(tempMinPrice, 10);
    const maxVal = parseInt(tempMaxPrice, 10);
    if (!isNaN(minVal) && minVal >= 0) setMinPrice(minVal);
    if (!isNaN(maxVal) && maxVal > (isNaN(minVal) ? 0 : minVal)) setMaxPrice(maxVal);
  };

  // Filtered brands by search
  const visibleBrands = activePopularBrands.filter(b => 
    !brandSearchInput.trim() || b.name.toLowerCase().includes(brandSearchInput.toLowerCase().trim())
  );

  // Resolved Page Title
  const pageHeadingTitle = selectedBrand 
    ? `${selectedBrand} Products`
    : selectedSubCategory
      ? selectedSubCategory.name
      : searchQuery
        ? `Search: "${searchQuery}"`
        : activeCategoryInfo
          ? activeCategoryInfo.name
          : 'All Products & Electronics';

  return (
    <div className="container catalog-page-layout-container" style={{ padding: '16px 12px 60px' }}>
      
      {/* ── 1. DESKTOP FILTERS SIDEBAR ── */}
      <aside className="filters-sidebar" style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', height: 'fit-content' }}>
        
        {/* Sidebar Header & Clear All */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '14px', borderBottom: '1px solid #f1f5f9', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '800', color: '#0f172a', fontFamily: "'Outfit', sans-serif" }}>
            <SlidersHorizontal size={16} color="#4f46e5" />
            <span>Faceted Filters</span>
          </div>
          {(selectedSubCategory || selectedBrand || selectedRating || minPrice > 0 || maxPrice < 150000 || isFreeDeliveryOnly || isWarrantyOnly || isEmiOnly || selectedQuickChip) && (
            <button 
              onClick={handleResetFilters}
              style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '11.5px', fontWeight: '800', cursor: 'pointer', padding: 0 }}
            >
              Clear All
            </button>
          )}
        </div>

        {/* 1. Department / Sub-Categories Collapsible Tree */}
        <div className="filter-section" style={{ marginBottom: '20px' }}>
          <div 
            onClick={() => setIsDeptTreeOpen(!isDeptTreeOpen)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', marginBottom: '10px' }}
          >
            <h5 style={{ fontSize: '12.5px', textTransform: 'uppercase', color: '#0f172a', fontWeight: '800', letterSpacing: '0.4px', margin: 0 }}>
              Department
            </h5>
            {isDeptTreeOpen ? <ChevronDown size={15} color="#64748b" /> : <ChevronRight size={15} color="#64748b" />}
          </div>

          {isDeptTreeOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div 
                onClick={() => { setSelectedSubCategory(null); setSelectedQuickChip(null); }}
                style={{
                  padding: '6px 10px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  fontWeight: !selectedSubCategory ? '800' : '600',
                  color: !selectedSubCategory ? '#4f46e5' : '#334155',
                  background: !selectedSubCategory ? '#eef2ff' : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span>All {activeCategoryInfo ? activeCategoryInfo.name : 'Items'}</span>
                {!selectedSubCategory && <Check size={14} color="#4f46e5" strokeWidth={3} />}
              </div>

              {activeSubCategories.map(sub => {
                const isSelected = selectedSubCategory?.id === sub.id;
                return (
                  <div
                    key={sub.id}
                    onClick={() => {
                      setSelectedSubCategory(isSelected ? null : sub);
                      setSelectedQuickChip(null);
                    }}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      fontWeight: isSelected ? '800' : '500',
                      color: isSelected ? '#4f46e5' : '#334155',
                      background: isSelected ? '#eef2ff' : 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <span>{sub.name}</span>
                    {isSelected && <Check size={14} color="#4f46e5" strokeWidth={3} />}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. Brand Filter with Search */}
        <div className="filter-section" style={{ marginBottom: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
          <h5 style={{ fontSize: '12.5px', textTransform: 'uppercase', color: '#0f172a', fontWeight: '800', letterSpacing: '0.4px', marginBottom: '10px' }}>
            Brand
          </h5>
          <div style={{ position: 'relative', marginBottom: '8px' }}>
            <Search size={13} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
            <input 
              type="text"
              placeholder="Search brand..."
              value={brandSearchInput}
              onChange={(e) => setBrandSearchInput(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 10px 7px 30px',
                fontSize: '12px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {visibleBrands.map((brand, idx) => {
              const isChecked = selectedBrand === brand.name;
              return (
                <label 
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '12.5px',
                    color: '#334155',
                    cursor: 'pointer',
                    padding: '3px 0'
                  }}
                >
                  <input 
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => setSelectedBrand(isChecked ? null : brand.name)}
                    style={{ accentColor: '#4f46e5', width: '15px', height: '15px', cursor: 'pointer' }}
                  />
                  <span>{brand.name}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* 3. Price Range Facet */}
        <div className="filter-section" style={{ marginBottom: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
          <h5 style={{ fontSize: '12.5px', textTransform: 'uppercase', color: '#0f172a', fontWeight: '800', letterSpacing: '0.4px', marginBottom: '10px' }}>
            Price Range
          </h5>
          {/* Quick Price Chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
            {[
              { label: 'Under ₹1k', min: 0, max: 1000 },
              { label: '₹1k - ₹5k', min: 1000, max: 5000 },
              { label: '₹5k - ₹20k', min: 5000, max: 20000 },
              { label: 'Above ₹20k', min: 20000, max: 150000 }
            ].map((chip, cIdx) => (
              <button
                key={cIdx}
                type="button"
                onClick={() => { setMinPrice(chip.min); setMaxPrice(chip.max); }}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: (minPrice === chip.min && maxPrice === chip.max) ? '1px solid #4f46e5' : '1px solid #e2e8f0',
                  background: (minPrice === chip.min && maxPrice === chip.max) ? '#eef2ff' : '#f8fafc',
                  color: (minPrice === chip.min && maxPrice === chip.max) ? '#4f46e5' : '#475569',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Min / Max Inputs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input 
              type="number"
              placeholder="Min"
              value={tempMinPrice}
              onChange={(e) => setTempMinPrice(e.target.value)}
              style={{ width: '45%', padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
            />
            <span style={{ color: '#94a3b8' }}>-</span>
            <input 
              type="number"
              placeholder="Max"
              value={tempMaxPrice}
              onChange={(e) => setTempMaxPrice(e.target.value)}
              style={{ width: '45%', padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
            />
            <button
              type="button"
              onClick={handleApplyCustomPrice}
              style={{ padding: '6px 10px', background: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}
            >
              Go
            </button>
          </div>
        </div>

        {/* 4. Customer Rating Facet */}
        <div className="filter-section" style={{ marginBottom: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
          <h5 style={{ fontSize: '12.5px', textTransform: 'uppercase', color: '#0f172a', fontWeight: '800', letterSpacing: '0.4px', marginBottom: '10px' }}>
            Customer Ratings
          </h5>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[4, 3].map(stars => (
              <label 
                key={stars}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#334155', cursor: 'pointer' }}
              >
                <input 
                  type="radio"
                  name="rating-filter"
                  checked={selectedRating === stars}
                  onChange={() => setSelectedRating(selectedRating === stars ? null : stars)}
                  style={{ accentColor: '#4f46e5', width: '15px', height: '15px', cursor: 'pointer' }}
                />
                <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  {stars}★ &amp; Above
                </span>
              </label>
            ))}
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#334155', cursor: 'pointer' }}>
              <input 
                type="radio"
                name="rating-filter"
                checked={selectedRating === null}
                onChange={() => setSelectedRating(null)}
                style={{ accentColor: '#4f46e5', width: '15px', height: '15px', cursor: 'pointer' }}
              />
              <span>All Ratings</span>
            </label>
          </div>
        </div>

        {/* 5. Marketplace Assurance Toggles */}
        <div className="filter-section" style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
          <h5 style={{ fontSize: '12.5px', textTransform: 'uppercase', color: '#0f172a', fontWeight: '800', letterSpacing: '0.4px', marginBottom: '10px' }}>
            Marketplace Perks
          </h5>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#334155', cursor: 'pointer' }}>
              <input 
                type="checkbox"
                checked={isFreeDeliveryOnly}
                onChange={(e) => setIsFreeDeliveryOnly(e.target.checked)}
                style={{ accentColor: '#4f46e5' }}
              />
              <span>Free Delivery Eligible</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#334155', cursor: 'pointer' }}>
              <input 
                type="checkbox"
                checked={isEmiOnly}
                onChange={(e) => setIsEmiOnly(e.target.checked)}
                style={{ accentColor: '#4f46e5' }}
              />
              <span>No-Cost EMI Available</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#334155', cursor: 'pointer' }}>
              <input 
                type="checkbox"
                checked={isWarrantyOnly}
                onChange={(e) => setIsWarrantyOnly(e.target.checked)}
                style={{ accentColor: '#4f46e5' }}
              />
              <span>1 Year Brand Warranty</span>
            </label>
          </div>
        </div>

      </aside>

      {/* ── 2. CATALOG MAIN LISTING AREA ── */}
      <main className="catalog-main" style={{ paddingBottom: '80px' }}>

        {/* 🏪 Verified Seller Storefront Banner (If browsing seller URL) */}
        {sellerShopName && (
          <div style={{ background: 'linear-gradient(135deg, #090d16 0%, #1e1b4b 100%)', borderRadius: '14px', padding: '14px 18px', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px', boxShadow: '0 4px 16px rgba(15, 23, 42, 0.12)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)', flexShrink: 0 }}>
                <Store size={20} color="#ffffff" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 style={{ fontSize: '15px', fontWeight: '900', margin: 0, textTransform: 'capitalize', color: '#ffffff' }}>
                    {sellerShopName.replace(/-/g, ' ')}
                  </h2>
                  <span style={{ background: '#ecfdf5', color: '#059669', fontSize: '9.5px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px', border: '1px solid #a7f3d0' }}>
                    ✓ VERIFIED SELLER
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', marginTop: '2px' }}>
                  Showing <strong>{filteredProducts.length}</strong> official verified products from this seller • 100% Brand Warranty &amp; COD
                </div>
              </div>
            </div>
            {onSelectCategory && (
              <button
                onClick={() => { window.location.href = '/catalog'; }}
                style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: '#ffffff', padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
              >
                View All Store ➔
              </button>
            )}
          </div>
        )}

        {/* ── 🧭 Breadcrumbs Navigation ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '12px', color: '#64748b', fontWeight: '600', flexWrap: 'wrap' }}>
          <span 
            onClick={() => onSelectCategory && onSelectCategory('all')} 
            style={{ cursor: 'pointer', color: '#4f46e5' }}
          >
            Home
          </span>
          <span>›</span>
          <span 
            onClick={() => { setSelectedSubCategory(null); setSelectedBrand(null); setSelectedQuickChip(null); }}
            style={{ cursor: 'pointer', color: currentCategory !== 'all' ? '#4f46e5' : '#0f172a', fontWeight: currentCategory !== 'all' ? '600' : '800' }}
          >
            {activeCategoryInfo ? activeCategoryInfo.name : 'All Catalog'}
          </span>
          {selectedSubCategory && (
            <>
              <span>›</span>
              <span style={{ color: '#0f172a', fontWeight: '800' }}>{selectedSubCategory.name}</span>
            </>
          )}
          {selectedBrand && (
            <>
              <span>›</span>
              <span style={{ color: '#0f172a', fontWeight: '800' }}>{selectedBrand}</span>
            </>
          )}
        </div>

        {/* ── 🏷️ Sleek Category Header + Single Source Sort Control ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(18px, 2.5vw, 24px)', fontWeight: '900', color: '#0f172a', margin: 0, fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.3px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span>{pageHeadingTitle}</span>
              <span style={{ fontSize: '13.5px', fontWeight: '600', color: '#64748b' }}>
                ({filteredProducts.length} Products)
              </span>
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Mobile Filter Button */}
            <button
              className="mobile-filter-trigger-btn"
              onClick={() => setShowFilterDrawer(true)}
              style={{
                display: 'none',
                alignItems: 'center',
                gap: '6px',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                padding: '7px 12px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              <SlidersHorizontal size={14} color="#4f46e5" />
              <span>Filters</span>
            </button>

            {/* Single Source of Truth: Sort Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: '7px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  fontSize: '12.5px',
                  fontWeight: '700',
                  color: '#0f172a',
                  fontFamily: "'Outfit', sans-serif",
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="popularity">Featured &amp; Popular</option>
                <option value="priceLow">Price: Low to High</option>
                <option value="priceHigh">Price: High to Low</option>
                <option value="rating">Customer Rating</option>
                <option value="discount">Highest Discount</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── ⚡ High-Intent Attribute Quick Filter Chips Row ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '16px', scrollbarWidth: 'none' }}>
          {quickFilterChips.map(chip => {
            const isSelected = selectedQuickChip === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => setSelectedQuickChip(isSelected ? null : chip.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '11.5px',
                  fontWeight: '700',
                  border: isSelected ? '1.5px solid #4f46e5' : '1px solid #e2e8f0',
                  background: isSelected ? '#4f46e5' : '#ffffff',
                  color: isSelected ? '#ffffff' : '#334155',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  boxShadow: isSelected ? '0 2px 6px rgba(79, 70, 229, 0.25)' : '0 1px 3px rgba(0,0,0,0.03)',
                  transition: 'all 0.15s ease'
                }}
              >
                {chip.label} {isSelected ? '✓' : ''}
              </button>
            );
          })}
          {selectedQuickChip && (
            <button
              onClick={() => setSelectedQuickChip(null)}
              style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '11px', fontWeight: '800', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              ✕ Reset Chip
            </button>
          )}
        </div>

        {/* ── 🛒 Product Listing Grid (3 or 4 Columns) ── */}
        {isSearching ? (
          <div className="grid-cols-4" style={{ gap: '16px' }}>
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #f1f5f9', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ width: '100%', height: '170px', background: '#f1f5f9', borderRadius: '8px' }} />
                <div style={{ width: '80%', height: '16px', background: '#f1f5f9', borderRadius: '4px' }} />
                <div style={{ width: '40%', height: '14px', background: '#f1f5f9', borderRadius: '4px' }} />
              </div>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid-cols-4" style={{ gap: '16px' }}>
            {filteredProducts.map(product => (
              <ProductCard 
                key={product.id || product._id} 
                product={product} 
                onNavigateProduct={onNavigateProduct} 
              />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', backgroundColor: '#ffffff', padding: '60px 24px', borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', margin: '20px 0' }}>
            <div style={{ fontSize: '42px', marginBottom: '12px' }}>🔍</div>
            <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', marginBottom: '8px', fontFamily: "'Outfit', sans-serif" }}>
              No products found {searchQuery ? `for "${searchQuery}"` : ''}
            </h3>
            <p style={{ color: '#64748b', fontSize: '13.5px', maxWidth: '420px', margin: '0 auto 20px', lineHeight: '1.5' }}>
              We couldn't find any products matching your specific filters. Try clearing some filters or searching with different terms.
            </p>
            <button
              onClick={handleResetFilters}
              style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                color: 'white',
                border: 'none',
                padding: '10px 24px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '800',
                cursor: 'pointer',
                fontFamily: "'Outfit', sans-serif"
              }}
            >
              🔄 Reset All Filters
            </button>
          </div>
        )}

      </main>

      {/* ── 📱 Mobile Filter Slide-in Drawer Modal ── */}
      {showFilterDrawer && createPortal(
        <div 
          style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 99999, display: 'flex', justifyContent: 'flex-end' }}
          onClick={() => setShowFilterDrawer(false)}
        >
          <div 
            style={{ width: '85%', maxWidth: '340px', background: '#ffffff', height: '100%', overflowY: 'auto', padding: '20px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '16px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <span style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a' }}>Filters</span>
              <button onClick={() => setShowFilterDrawer(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}>✕</button>
            </div>

            {/* Department */}
            <div>
              <h5 style={{ fontSize: '12.5px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px' }}>Department</h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div onClick={() => { setSelectedSubCategory(null); setShowFilterDrawer(false); }} style={{ padding: '6px', fontSize: '12.5px', color: !selectedSubCategory ? '#4f46e5' : '#334155', fontWeight: !selectedSubCategory ? '800' : '500' }}>
                  All Items
                </div>
                {activeSubCategories.map(sub => (
                  <div key={sub.id} onClick={() => { setSelectedSubCategory(sub); setShowFilterDrawer(false); }} style={{ padding: '6px', fontSize: '12.5px', color: selectedSubCategory?.id === sub.id ? '#4f46e5' : '#334155', fontWeight: selectedSubCategory?.id === sub.id ? '800' : '500' }}>
                    {sub.name}
                  </div>
                ))}
              </div>
            </div>

            {/* Apply & Reset Buttons */}
            <div style={{ marginTop: 'auto', display: 'flex', gap: '8px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
              <button 
                onClick={() => { handleResetFilters(); setShowFilterDrawer(false); }}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', fontSize: '12.5px', fontWeight: '800', cursor: 'pointer' }}
              >
                Reset
              </button>
              <button 
                onClick={() => setShowFilterDrawer(false)}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#0f172a', color: '#ffffff', fontSize: '12.5px', fontWeight: '800', cursor: 'pointer' }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default React.memo(ProductCatalog);
