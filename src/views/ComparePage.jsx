"use client";

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Trash2, Plus, ShoppingCart, Star, ShieldCheck, Check, Zap } from 'lucide-react';
import LazyImage from '../components/LazyImage';

const ComparePage = ({ onNavigate, onNavigateProduct, initialProductIds = [] }) => {
  const { products, addToCart, showToast } = useApp();
  
  // Selected product IDs for comparison (max 4)
  const [selectedIds, setSelectedIds] = useState(() => {
    if (initialProductIds.length > 0) return initialProductIds.slice(0, 4);
    if (products.length >= 2) return [products[0].id, products[1].id];
    return [];
  });

  const [showProductPicker, setShowProductPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');

  const selectedProducts = selectedIds.map(id => products.find(p => p.id === id)).filter(Boolean);

  const handleRemove = (id) => {
    setSelectedIds(prev => prev.filter(x => x !== id));
  };

  const handleAdd = (id) => {
    if (selectedIds.includes(id)) {
      showToast('Product is already in comparison table', 'info');
      return;
    }
    if (selectedIds.length >= 4) {
      showToast('You can compare up to 4 products simultaneously', 'warning');
      return;
    }
    setSelectedIds(prev => [...prev, id]);
    setShowProductPicker(false);
  };

  // Collect all unique specification keys across selected products
  const allSpecKeys = Array.from(
    new Set(
      selectedProducts.flatMap(p => (p.specifications || []).map(s => s.key))
    )
  );

  return (
    <div className="container animate-fade-in" style={{ padding: '32px 16px 80px 16px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={() => onNavigate ? onNavigate('catalog') : window.history.back()}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '8px 14px', fontSize: '13px', fontWeight: '700', color: '#1e293b', cursor: 'pointer' }}
          >
            <ArrowLeft size={16} /> Back
          </button>
          <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
            ⚖️ Product Comparison Tool
          </h1>
        </div>

        {selectedIds.length < 4 && (
          <button
            onClick={() => setShowProductPicker(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              color: 'white', border: 'none', borderRadius: '12px',
              padding: '10px 18px', fontSize: '13px', fontWeight: '800',
              cursor: 'pointer', fontFamily: "'Outfit', sans-serif",
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)'
            }}
          >
            <Plus size={16} /> Add Product to Compare ({selectedIds.length}/4)
          </button>
        )}
      </div>

      {selectedProducts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', background: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚖️</div>
          <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginBottom: '8px', fontFamily: "'Outfit', sans-serif" }}>No Products Selected for Comparison</h3>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>Select 2 to 4 products to compare their specifications, pricing, ratings, and features side-by-side.</p>
          <button
            onClick={() => setShowProductPicker(true)}
            style={{ background: '#4f46e5', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: '800', fontSize: '14px', cursor: 'pointer' }}
          >
            Select Products
          </button>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', background: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 8px 30px rgba(9, 13, 22, 0.04)', padding: '20px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: `${Math.max(650, selectedProducts.length * 220 + 150)}px` }}>
            <thead>
              <tr>
                <th style={{ width: '180px', textAlign: 'left', padding: '16px', color: '#64748b', fontSize: '13px', fontWeight: '700', borderBottom: '2px solid #e2e8f0' }}>
                  Product / Metric
                </th>
                {selectedProducts.map(p => (
                  <th key={p.id} style={{ padding: '16px', textAlign: 'center', verticalAlign: 'top', borderBottom: '2px solid #e2e8f0', minWidth: '200px' }}>
                    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => handleRemove(p.id)}
                        style={{ position: 'absolute', top: '-6px', right: '0', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '50%', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        title="Remove product"
                      >
                        <Trash2 size={13} />
                      </button>

                      <div 
                        onClick={() => onNavigateProduct ? onNavigateProduct(p.id) : (window.location.href = `/product/${p.id}`)}
                        style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                      >
                        <LazyImage src={p.image} alt={p.name} style={{ width: '110px', height: '110px', objectFit: 'contain', marginBottom: '8px' }} />
                        <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', lineHeight: '1.3', textAlign: 'center', height: '36px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.name}
                        </div>
                      </div>

                      <div style={{ fontSize: '18px', fontWeight: '900', color: '#059669', fontFamily: "'Outfit', sans-serif", marginTop: '4px' }}>
                        ₹{(p.price || 0).toLocaleString('en-IN')}
                      </div>

                      <button
                        onClick={() => { addToCart(p); showToast(`Added ${p.name} to cart!`, 'success'); }}
                        style={{ width: '100%', background: '#4f46e5', color: 'white', border: 'none', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '6px' }}
                      >
                        <ShoppingCart size={14} /> Add to Cart
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Category */}
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '14px 16px', fontWeight: '800', color: '#334155', fontSize: '13px' }}>Category</td>
                {selectedProducts.map(p => (
                  <td key={p.id} style={{ padding: '14px 16px', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#4f46e5', textTransform: 'capitalize' }}>
                    {p.category}
                  </td>
                ))}
              </tr>

              {/* Rating */}
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '14px 16px', fontWeight: '800', color: '#334155', fontSize: '13px' }}>Customer Rating</td>
                {selectedProducts.map(p => (
                  <td key={p.id} style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <span style={{ background: '#059669', color: 'white', fontSize: '12px', fontWeight: '800', padding: '4px 10px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {p.rating || 4.5} <Star size={12} fill="white" />
                    </span>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>({p.reviewsCount || 0} reviews)</div>
                  </td>
                ))}
              </tr>

              {/* Delivery & Warranty */}
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '14px 16px', fontWeight: '800', color: '#334155', fontSize: '13px' }}>Delivery &amp; COD</td>
                {selectedProducts.map(p => (
                  <td key={p.id} style={{ padding: '14px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '700', color: '#16a34a' }}>
                    ✅ Express Dispatch &amp; COD Available
                  </td>
                ))}
              </tr>

              {/* Dynamic Specifications Rows */}
              {allSpecKeys.map((key, kIdx) => (
                <tr key={kIdx} style={{ backgroundColor: kIdx % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 16px', fontWeight: '800', color: '#334155', fontSize: '13px' }}>{key}</td>
                  {selectedProducts.map(p => {
                    const spec = (p.specifications || []).find(s => s.key === key);
                    return (
                      <td key={p.id} style={{ padding: '14px 16px', textAlign: 'center', fontSize: '13px', color: spec ? '#0f172a' : '#94a3b8', fontWeight: spec ? '600' : '400' }}>
                        {spec ? spec.value : '—'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Product Selection Modal */}
      {showProductPicker && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a', fontFamily: "'Outfit', sans-serif" }}>
                Add Product to Compare
              </h3>
              <button onClick={() => setShowProductPicker(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            <div style={{ padding: '12px 20px', borderBottom: '1px solid #f1f5f9' }}>
              <input
                type="text"
                placeholder="Search products by name or category..."
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
              />
            </div>

            <div style={{ overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {products
                .filter(p => !pickerSearch || p.name.toLowerCase().includes(pickerSearch.toLowerCase()) || p.category.toLowerCase().includes(pickerSearch.toLowerCase()))
                .map(p => {
                  const isSelected = selectedIds.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => !isSelected && handleAdd(p.id)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '12px 16px', borderRadius: '16px',
                        border: isSelected ? '1.5px solid #a7f3d0' : '1.5px solid #f1f5f9',
                        background: isSelected ? '#f0fdf4' : '#ffffff',
                        cursor: isSelected ? 'default' : 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <LazyImage src={p.image} alt={p.name} style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>{p.name}</div>
                          <div style={{ fontSize: '12px', fontWeight: '700', color: '#059669', marginTop: '2px' }}>₹{(p.price || 0).toLocaleString('en-IN')}</div>
                        </div>
                      </div>

                      <button
                        disabled={isSelected}
                        style={{
                          background: isSelected ? '#15803d' : '#4f46e5',
                          color: 'white', border: 'none', borderRadius: '8px',
                          padding: '6px 14px', fontSize: '12px', fontWeight: '800',
                          cursor: isSelected ? 'default' : 'pointer'
                        }}
                      >
                        {isSelected ? '✓ Added' : '+ Compare'}
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ComparePage;
