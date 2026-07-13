import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import ProductCard from '../components/ProductCard';
import { Filter, Star, RefreshCw, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import '../assets/styles/product.css';

const ProductCatalog = ({ currentCategory, onSelectCategory, searchQuery, onNavigateProduct }) => {
  const { products } = useApp();
  // Filter States
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(150000);
  const [selectedRating, setSelectedRating] = useState(null);
  const [sortBy, setSortBy] = useState('popularity'); // popularity, priceLow, priceHigh
  const [showSortModal, setShowSortModal] = useState(false);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

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
      {/* Sidebar Filters */}
      <aside className="filters-sidebar">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
            <Filter size={16} />
            <span>Filters</span>
          </div>
          <button 
            style={{ fontSize: '12px', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '4px' }}
            onClick={handleResetFilters}
          >
            <RefreshCw size={12} /> Clear All
          </button>
        </div>

        {/* Categories Section in Sidebar */}
        <div className="filter-section">
          <h5 className="filter-title">Category</h5>
          <select 
            value={currentCategory} 
            onChange={(e) => onSelectCategory(e.target.value)}
            style={{ width: '100%', padding: '6px', border: '1px solid var(--border-light)', borderRadius: '4px' }}
          >
            <option value="all">All Categories</option>
            <option value="mobiles">Mobiles</option>
            <option value="electronics">Electronics</option>
            <option value="fashion">Fashion</option>
            <option value="home">Home & Living</option>
            <option value="appliances">Appliances</option>
          </select>
        </div>

        {/* Price Slider Section */}
        <div className="filter-section">
          <h5 className="filter-title">Price Range</h5>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div>
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
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '11px', color: '#777' }}>Min</span>
                <input 
                  type="number" 
                  value={minPrice} 
                  onChange={(e) => setMinPrice(Number(e.target.value))}
                  style={{ width: '100%', padding: '4px', border: '1px solid var(--border-light)', borderRadius: '4px', fontSize: '13px' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '11px', color: '#777' }}>Max</span>
                <input 
                  type="number" 
                  value={maxPrice} 
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  style={{ width: '100%', padding: '4px', border: '1px solid var(--border-light)', borderRadius: '4px', fontSize: '13px' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Rating Filter Section */}
        <div className="filter-section">
          <h5 className="filter-title">Customer Ratings</h5>
          <ul className="filter-list">
            {[4, 3, 2].map(stars => (
              <li key={stars}>
                <label className="filter-item-label">
                  <input 
                    type="radio" 
                    name="rating-filter" 
                    checked={selectedRating === stars}
                    onChange={() => setSelectedRating(stars)}
                  />
                  <span>{stars} <Star size={12} fill="#ffc107" color="#ffc107" style={{ display: 'inline' }} /> & above</span>
                </label>
              </li>
            ))}
            <li>
              <label className="filter-item-label">
                <input 
                  type="radio" 
                  name="rating-filter" 
                  checked={selectedRating === null}
                  onChange={() => setSelectedRating(null)}
                />
                <span>All Ratings</span>
              </label>
            </li>
          </ul>
        </div>
      </aside>

      {/* Main Results Container */}
      <main className="catalog-main">
        
        {/* Mobile Quick Filter Pills */}
        <div className="mobile-filter-pills">
          <div 
            onClick={() => setSortBy(sortBy === 'priceLow' ? 'popularity' : 'priceLow')}
            className={`filter-pill ${sortBy === 'priceLow' ? 'active' : ''}`}
          >
            Price: Low to High {sortBy === 'priceLow' && '✓'}
          </div>
          <div 
            onClick={() => setSortBy(sortBy === 'priceHigh' ? 'popularity' : 'priceHigh')}
            className={`filter-pill ${sortBy === 'priceHigh' ? 'active' : ''}`}
          >
            Price: High to Low {sortBy === 'priceHigh' && '✓'}
          </div>
          <div 
            onClick={() => setSelectedRating(selectedRating === 4 ? null : 4)}
            className={`filter-pill ${selectedRating === 4 ? 'active' : ''}`}
          >
            4 ★ & above {selectedRating === 4 && '✓'}
          </div>
          <div 
            onClick={() => setMaxPrice(maxPrice === 25000 ? 150000 : 25000)}
            className={`filter-pill ${maxPrice === 25000 ? 'active' : ''}`}
          >
            Under ₹25,000 {maxPrice === 25000 && '✓'}
          </div>
        </div>

        {/* Results Header */}
        <div className="catalog-header">
          <span className="results-count">
            {searchQuery ? (
              <span>Search results for "<strong>{searchQuery}</strong>" ({filteredProducts.length} items)</span>
            ) : (
              <span>Showing {filteredProducts.length} products in {currentCategory === 'all' ? 'All Categories' : currentCategory}</span>
            )}
          </span>

          <div className="sort-wrapper">
            <span>Sort By:</span>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="popularity">Popularity / Reviews</option>
              <option value="priceLow">Price: Low to High</option>
              <option value="priceHigh">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
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
              We couldn't find anything matching your filters or search query. Try broadening your criteria.
            </p>
            <button className="btn btn-primary" onClick={handleResetFilters}>
              Reset Filters
            </button>
          </div>
        )}
      </main>

      {/* Mobile Sticky Sort & Filter bar (Flipkart Style) */}
      <div className="mobile-catalog-bottom-bar">
        <button className="mobile-bar-btn" onClick={() => setShowSortModal(true)}>
          <ArrowUpDown size={16} /> Sort
        </button>
        <div className="bar-separator"></div>
        <button className="mobile-bar-btn" onClick={() => setShowFilterDrawer(true)}>
          <SlidersHorizontal size={16} /> Filter
        </button>
      </div>

      {/* Sort Bottom Sheet Modal */}
      {showSortModal && (
        <div className="bottom-sheet-backdrop" onClick={() => setShowSortModal(false)}>
          <div className="bottom-sheet-content" onClick={(e) => e.stopPropagation()}>
            <h4 className="bottom-sheet-title">Sort By</h4>
            <div className="sort-option-list">
              {[
                { value: 'popularity', label: 'Popularity' },
                { value: 'priceLow', label: 'Price: Low to High' },
                { value: 'priceHigh', label: 'Price: High to Low' },
                { value: 'rating', label: 'Highest Rated' }
              ].map(opt => (
                <label key={opt.value} className="sort-option-item">
                  <input 
                    type="radio" 
                    name="mobile-sort" 
                    checked={sortBy === opt.value} 
                    onChange={() => { setSortBy(opt.value); setShowSortModal(false); }}
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
              <button className="btn btn-accent btn-block" onClick={() => setShowFilterDrawer(false)} style={{ width: '100%', height: '42px', fontWeight: 'bold' }}>
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
