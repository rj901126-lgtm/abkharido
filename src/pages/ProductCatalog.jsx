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
    <div className="container catalog-container animate-fade-in" style={{ padding: '24px 12px' }}>
      {/* Main Results Container */}
      <main className="catalog-main" style={{ width: '100%', flex: 1 }}>
        
        {/* Results Header */}
        <div className="catalog-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #f0f0f0', paddingBottom: '12px' }}>
          <span className="results-count" style={{ fontSize: '14px', fontWeight: '500', color: '#212121' }}>
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
    </div>
  );
};

export default ProductCatalog;
