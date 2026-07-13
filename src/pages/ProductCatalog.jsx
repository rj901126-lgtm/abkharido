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
    <div className="container catalog-container animate-fade-in" style={{ padding: '16px 12px' }}>
      
      {/* Top Sort & Filter Buttons Bar (Always visible at the top of category menus) */}
      <div className="catalog-top-filter-bar" style={{
        display: 'flex',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        backgroundColor: '#ffffff',
        marginBottom: '16px',
        overflow: 'hidden',
        boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
      }}>
        <button 
          onClick={() => setShowSortModal(true)} 
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            height: '44px',
            background: 'none',
            border: 'none',
            borderRight: '1px solid #e0e0e0',
            fontSize: '14px',
            fontWeight: '600',
            color: '#212121',
            cursor: 'pointer'
          }}
        >
          <ArrowUpDown size={16} color="#757575" />
          Sort
        </button>
        <button 
          onClick={() => setShowFilterDrawer(true)} 
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            height: '44px',
            background: 'none',
            border: 'none',
            fontSize: '14px',
            fontWeight: '600',
            color: '#212121',
            cursor: 'pointer'
          }}
        >
          <SlidersHorizontal size={16} color="#757575" />
          Filter
        </button>
      </div>

      {/* Main Results Container */}
      <main className="catalog-main" style={{ width: '100%', flex: 1 }}>
        
        {/* Results Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', paddingBottom: '4px' }}>
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
