import React, { useState, useEffect, useMemo } from 'react';

import { Plus, Check, ShoppingBag, Sparkles, Tag } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { buildAvailableBundle, bundleFitsInCart } from '../utils/bundleProducts';

export default function FrequentlyBoughtTogether({ currentProduct, selectedColor = '', selectedVariant = '' }) {
  const { addToCart, showToast, cart, products: allContextProducts } = useApp();
  const [isAdding, setIsAdding] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  const bundleItems = useMemo(() => buildAvailableBundle(
    currentProduct, allContextProducts, { selectedColor, selectedVariant }
  ), [currentProduct, allContextProducts, selectedColor, selectedVariant]);

  // Selected state for each bundle item (all checked by default)
  const [selectedMap, setSelectedMap] = useState({});

  useEffect(() => {
    setSelectedMap(Object.fromEntries(bundleItems.map(item => [item.id, true])));
  }, [bundleItems]);

  if (!currentProduct || bundleItems.length === 0) return null;

  const toggleSelect = (id) => {
    setSelectedMap(prev => {
      const next = { ...prev, [id]: !prev[id] };
      const hasAny = Object.values(next).some(Boolean);
      return hasAny ? next : prev;
    });
  };


  // Math Calculations
  const selectedItems = bundleItems.filter(item => selectedMap[item.id]);
  const rawTotalPrice = selectedItems.reduce((acc, item) => acc + item.price, 0);
  const rawOriginalPrice = selectedItems.reduce((acc, item) => acc + item.originalPrice, 0);
  
  const finalBundlePrice = rawTotalPrice;
  const totalSavings = rawOriginalPrice - finalBundlePrice;

  // Add all selected items to cart
  const handleAddBundleToCart = () => {
    if (!selectedItems.length || !bundleFitsInCart(selectedItems, cart)) {
      showToast?.('A selected item has reached its available stock. Please review your bag.', 'warning');
      return;
    }
    setIsAdding(true);
    try {
      selectedItems.forEach(item => {
        const { isMain, ...cartProduct } = item;
        addToCart(cartProduct, 1);
      });

      setAddedSuccess(true);
      if (showToast) {
        showToast(`🎉 ${selectedItems.length} items added to your bag.`, 'success');
      }
      setTimeout(() => {
        setAddedSuccess(false);
        setIsAdding(false);
      }, 2500);
    } catch (e) {
      setIsAdding(false);
    }
  };

  return (
    <section 
      className="frequently-bought-together-section"
      style={{
        marginTop: '32px',
        marginBottom: '24px',
        background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
        borderRadius: '24px',
        border: '1.5px solid #e2e8f0',
        padding: '24px 20px',
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.04)',
        fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif"
      }}
    >
      {/* Header Badge & Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: '900',
            letterSpacing: '0.5px',
            textTransform: 'uppercase'
          }}>
            <Sparkles size={14} /> Smart Bundle
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>
            Frequently Bought Together
          </h3>
        </div>

        <div style={{ fontSize: '12px', color: '#059669', fontWeight: '800', background: '#ecfdf5', padding: '4px 10px', borderRadius: '8px', border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Tag size={13} /> Current Product Prices
        </div>
      </div>

      {/* Visual Bundle Flow Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '16px',
        alignItems: 'center'
      }}>
        
        {/* Left Side: Product Thumbnails with (+) Connectors */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          overflowX: 'auto',
          paddingBottom: '8px'
        }}>
          {bundleItems.map((item, idx) => {
            const isSelected = selectedMap[item.id];
            return (
              <React.Fragment key={item.id}>
                <div 
                  onClick={() => toggleSelect(item.id)}
                  style={{
                    position: 'relative',
                    width: '105px',
                    minWidth: '105px',
                    height: '125px',
                    background: isSelected ? '#ffffff' : '#f1f5f9',
                    borderRadius: '16px',
                    border: isSelected ? '2px solid var(--brand-accent)' : '1.5px dashed #cbd5e1',
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: isSelected ? '0 6px 16px rgba(37, 99, 235, 0.12)' : 'none',
                    opacity: isSelected ? 1 : 0.45
                  }}
                  title={isSelected ? 'Click to deselect' : 'Click to add to bundle'}
                >
                  {/* Selected Badge */}
                  <div style={{
                    position: 'absolute',
                    top: '6px',
                    left: '6px',
                    width: '18px',
                    height: '18px',
                    borderRadius: '6px',
                    background: isSelected ? 'var(--brand-accent)' : '#ffffff',
                    border: isSelected ? 'none' : '1.5px solid #94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '11px',
                    fontWeight: '900'
                  }}>
                    {isSelected && <Check size={12} strokeWidth={3} />}
                  </div>

                  {item.isMain && (
                    <span style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      background: '#0f172a',
                      color: '#ffffff',
                      fontSize: '8.5px',
                      fontWeight: '800',
                      padding: '2px 5px',
                      borderRadius: '4px',
                      textTransform: 'uppercase'
                    }}>
                      Current
                    </span>
                  )}

                  <img 
                    src={item.image} 
                    alt={item.name} 
                    style={{
                      width: '65px',
                      height: '65px',
                      objectFit: 'contain',
                      marginBottom: '6px'
                    }}
                  />
                  <div style={{
                    fontSize: '11.5px',
                    fontWeight: '800',
                    color: '#0f172a',
                    textAlign: 'center'
                  }}>
                    ₹{item.price.toLocaleString('en-IN')}
                  </div>
                </div>

                {/* Plus Connector Icon */}
                {idx < bundleItems.length - 1 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#94a3b8',
                    flexShrink: 0
                  }}>
                    <Plus size={20} strokeWidth={2.5} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Right Side: Total Price Calculation & 1-Click Buy CTA */}
        <div style={{
          background: '#ffffff',
          borderRadius: '18px',
          border: '1.5px solid #e2e8f0',
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '12px',
          boxShadow: '0 4px 14px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '700' }}>
              Total Bundle Price ({selectedItems.length} items):
            </span>
            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                {rawOriginalPrice > finalBundlePrice && (
                  <span style={{ fontSize: '14px', color: '#94a3b8', textDecoration: 'line-through', fontWeight: '600' }}>
                    ₹{rawOriginalPrice.toLocaleString('en-IN')}
                  </span>
                )}
                <span style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.5px' }}>
                  ₹{finalBundlePrice.toLocaleString('en-IN')}
                </span>
              </div>
              {totalSavings > 0 && (
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#059669', marginTop: '2px' }}>
                  ⚡ Total Savings: ₹{totalSavings.toLocaleString('en-IN')} ({Math.round((totalSavings / rawOriginalPrice) * 100)}% OFF)
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            className="bundle-add-all-btn"
            onClick={handleAddBundleToCart}
            disabled={isAdding || selectedItems.length === 0}
            style={{
              width: '100%',
              height: '46px',
              borderRadius: '12px',
              border: 'none',
              background: addedSuccess
                ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
                : 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: '900',
              cursor: selectedItems.length === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: addedSuccess
                ? '0 4px 14px rgba(5, 150, 105, 0.3)'
                : '0 4px 16px rgba(37, 99, 235, 0.3)',
              transition: 'all 0.2s ease',
              fontFamily: "'Outfit', sans-serif"
            }}
          >
            {addedSuccess ? (
              <>
                <Check size={18} strokeWidth={3} /> Added to Bag!
              </>
            ) : isAdding ? (
              'Adding Items to Bag...'
            ) : (
              <>
                <ShoppingBag size={17} /> Add All {selectedItems.length} Items to Bag ➔
              </>
            )}
          </button>
        </div>

      </div>

      {/* Item Checkbox Details List */}
      <div style={{
        marginTop: '20px',
        paddingTop: '16px',
        borderTop: '1px solid #f1f5f9',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        {bundleItems.map((item) => {
          const isSelected = selectedMap[item.id];
          return (
            <label 
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                cursor: 'pointer',
                fontSize: '13px',
                color: isSelected ? '#1e293b' : '#94a3b8',
                lineHeight: '1.4'
              }}
            >
              <input 
                type="checkbox"
                checked={Boolean(isSelected)}
                onChange={() => toggleSelect(item.id)}
                style={{
                  width: '16px',
                  height: '16px',
                  accentColor: 'var(--brand-accent)',
                  marginTop: '2px',
                  cursor: 'pointer'
                }}
              />
              <div style={{ flex: 1 }}>
                <strong style={{ color: isSelected ? '#0f172a' : '#64748b' }}>
                  {item.isMain ? 'This item: ' : ''}{item.name}
                  {item.selectedColor ? ` • ${item.selectedColor}` : ''}
                  {item.selectedVariant ? ` • ${item.selectedVariant}` : ''}
                </strong>
                <span style={{ marginLeft: '8px', fontWeight: '800', color: isSelected ? '#059669' : '#94a3b8' }}>
                  ₹{item.price.toLocaleString('en-IN')}
                </span>
                {item.originalPrice > item.price && (
                  <span style={{ marginLeft: '6px', fontSize: '11px', textDecoration: 'line-through', color: '#94a3b8' }}>
                    ₹{item.originalPrice.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
            </label>
          );
        })}
      </div>
    </section>
  );
}
