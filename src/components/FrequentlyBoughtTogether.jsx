import React, { useState, useEffect, useMemo } from 'react';

import { Plus, Check, ShoppingBag, Sparkles, Tag } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PRODUCTS } from '../db/mockData';

// Intelligent complementary accessory catalog based on category or product type
const COMPLEMENTARY_ACCESSORIES = {
  mobiles: [
    {
      id: 'acc-20w-fast-charger',
      name: '20W USB-C PD SuperFast Power Adapter (BIS Certified)',
      price: 1499,
      originalPrice: 2499,
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?q=80&w=400&auto=format&fit=crop',
      category: 'electronics'
    },
    {
      id: 'acc-magsafe-case-clear',
      name: 'Ultra-Clear Shockproof MagSafe Protective Armor Case',
      price: 699,
      originalPrice: 1299,
      rating: 4.7,
      image: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?q=80&w=400&auto=format&fit=crop',
      category: 'accessories'
    }
  ],
  electronics: [
    {
      id: 'acc-braided-cable-100w',
      name: '100W Heavy-Duty Braided Type-C Fast Data Cable (2 Meter)',
      price: 499,
      originalPrice: 999,
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=400&auto=format&fit=crop',
      category: 'accessories'
    },
    {
      id: 'acc-hard-eva-case',
      name: 'Shockproof Water-Resistant Hard Storage Travel Pouch',
      price: 599,
      originalPrice: 1199,
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=400&auto=format&fit=crop',
      category: 'accessories'
    }
  ],
  fashion: [
    {
      id: 'acc-designer-sunglasses',
      name: 'UV400 Polarized Aviator Classic Sunglasses',
      price: 999,
      originalPrice: 2499,
      rating: 4.6,
      image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=400&auto=format&fit=crop',
      category: 'fashion'
    },
    {
      id: 'acc-leather-belt-matte',
      name: 'Full Grain Genuine Leather Reversible Casual Belt',
      price: 799,
      originalPrice: 1599,
      rating: 4.7,
      image: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?q=80&w=400&auto=format&fit=crop',
      category: 'fashion'
    }
  ],
  sports: [
    {
      id: 'acc-gym-shaker-pro',
      name: 'BPA-Free Leakproof Cyclone Gym Protein Shaker (700ml)',
      price: 399,
      originalPrice: 899,
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=400&auto=format&fit=crop',
      category: 'sports'
    },
    {
      id: 'acc-cushioned-socks-3p',
      name: 'Anti-Odor Cushioned Performance Sports Socks (Pack of 3)',
      price: 499,
      originalPrice: 999,
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1582965372486-66442657e03c?q=80&w=400&auto=format&fit=crop',
      category: 'sports'
    }
  ],
  home: [
    {
      id: 'acc-microfiber-cloths-4p',
      name: 'Ultra-Dense Scratch-Free Microfiber Cleaning Towels (Pack of 4)',
      price: 349,
      originalPrice: 799,
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?q=80&w=400&auto=format&fit=crop',
      category: 'home'
    },
    {
      id: 'acc-silicone-tongs-mat',
      name: 'Heat-Resistant Non-Stick Silicone Kitchen Tongs & Resting Mat',
      price: 499,
      originalPrice: 999,
      rating: 4.7,
      image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=400&auto=format&fit=crop',
      category: 'home'
    }
  ]
};

export default function FrequentlyBoughtTogether({ currentProduct, onNavigateProduct }) {
  const { addToCart, showToast, products: allContextProducts } = useApp();
  const [isAdding, setIsAdding] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  // Resolve bundle items: 1 Main Product + 2 Complementary items
  const bundleItems = useMemo(() => {
    if (!currentProduct) return [];
    const main = {
      id: currentProduct.id || currentProduct._id,
      name: currentProduct.name,
      price: Number(currentProduct.price) || 0,
      originalPrice: Number(currentProduct.originalPrice || currentProduct.mrp) || Math.round((currentProduct.price || 0) * 1.35),
      image: currentProduct.image || (currentProduct.images && currentProduct.images[0]) || '',
      rating: currentProduct.rating || 4.8,
      isMain: true
    };

    const catKey = (currentProduct.category || '').toLowerCase();
    const matchedCategory = Object.keys(COMPLEMENTARY_ACCESSORIES).find(k => catKey.includes(k)) || 'electronics';
    
    // Choose curated accessories
    const curated = COMPLEMENTARY_ACCESSORIES[matchedCategory] || COMPLEMENTARY_ACCESSORIES.electronics;
    
    const accessories = curated.map((acc) => {
      return {
        id: acc.id,
        name: acc.name,
        price: acc.price,
        originalPrice: acc.originalPrice,
        image: acc.image,
        rating: acc.rating,
        isMain: false
      };
    });

    return [main, ...accessories];
  }, [currentProduct, allContextProducts]);

  // Selected state for each bundle item (all checked by default)
  const [selectedMap, setSelectedMap] = useState({});

  useEffect(() => {
    if (bundleItems && bundleItems.length > 0) {
      setSelectedMap({
        [bundleItems[0]?.id]: true,
        [bundleItems[1]?.id]: true,
        [bundleItems[2]?.id]: true
      });
    }
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
  
  // Extra 5% Combo Discount applied if 2 or more items are selected
  const comboDiscountMultiplier = selectedItems.length >= 2 ? 0.95 : 1.0;
  const finalBundlePrice = Math.round(rawTotalPrice * comboDiscountMultiplier);
  const totalSavings = rawOriginalPrice - finalBundlePrice;

  // Add all selected items to cart
  const handleAddBundleToCart = () => {
    setIsAdding(true);
    try {
      selectedItems.forEach(item => {
        addToCart({
          id: item.id,
          name: item.name,
          price: selectedItems.length >= 2 ? Math.round(item.price * 0.95) : item.price,
          originalPrice: item.originalPrice,
          image: item.image
        }, 1);
      });

      setAddedSuccess(true);
      if (showToast) {
        showToast(`🎉 ${selectedItems.length} items added to your bag with Combo Savings!`, 'success');
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
            background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
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
          <Tag size={13} /> Extra 5% Instant Combo Discount
        </div>
      </div>

      {/* Visual Bundle Flow Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
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
                    border: isSelected ? '2px solid #4f46e5' : '1.5px dashed #cbd5e1',
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: isSelected ? '0 6px 16px rgba(79, 70, 229, 0.12)' : 'none',
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
                    background: isSelected ? '#4f46e5' : '#ffffff',
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
                <span style={{ fontSize: '14px', color: '#94a3b8', textDecoration: 'line-through', fontWeight: '600' }}>
                  ₹{rawOriginalPrice.toLocaleString('en-IN')}
                </span>
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
                : 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
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
                : '0 4px 16px rgba(79, 70, 229, 0.3)',
              transition: 'all 0.2s ease',
              fontFamily: "'Outfit', sans-serif"
            }}
          >
            {addedSuccess ? (
              <>
                <Check size={18} strokeWidth={3} /> Added to Bag with Savings!
              </>
            ) : isAdding ? (
              'Adding Combo to Bag...'
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
                checked={isSelected}
                onChange={() => toggleSelect(item.id)}
                style={{
                  width: '16px',
                  height: '16px',
                  accentColor: '#4f46e5',
                  marginTop: '2px',
                  cursor: 'pointer'
                }}
              />
              <div style={{ flex: 1 }}>
                <strong style={{ color: isSelected ? '#0f172a' : '#64748b' }}>
                  {item.isMain ? 'This item: ' : ''}{item.name}
                </strong>
                <span style={{ marginLeft: '8px', fontWeight: '800', color: isSelected ? '#059669' : '#94a3b8' }}>
                  ₹{item.price.toLocaleString('en-IN')}
                </span>
                <span style={{ marginLeft: '6px', fontSize: '11px', textDecoration: 'line-through', color: '#94a3b8' }}>
                  ₹{item.originalPrice.toLocaleString('en-IN')}
                </span>
              </div>
            </label>
          );
        })}
      </div>
    </section>
  );
}
