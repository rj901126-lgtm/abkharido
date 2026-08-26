import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Heart, ShoppingCart, Check, ShieldCheck, Truck, Star } from 'lucide-react';
import LazyImage from './LazyImage';
import ProductQuickPreviewModal from './ProductQuickPreviewModal';
import { calculateCoinReward } from '../utils/coinUtils';

// Stable hash for static reviews count fallback
function stableHash(str, min, max) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return min + (hash % (max - min + 1));
}

// Color map for standard swatches
const COLOR_PALETTE = {
  black: '#0f172a',
  space: '#1e293b',
  midnight: '#0f172a',
  white: '#f8fafc',
  silver: '#cbd5e1',
  grey: '#64748b',
  gray: '#64748b',
  titanium: '#94a3b8',
  natural: '#d1d5db',
  blue: '#2563eb',
  navy: '#1e3a8a',
  gold: '#fbbf24',
  green: '#16a34a',
  red: '#dc2626',
  pink: '#f472b6',
  purple: '#9333ea',
  cream: '#fef3c7'
};

function resolveSwatchColor(colorName) {
  if (!colorName) return '#0f172a';
  const lower = colorName.toLowerCase();
  for (const [key, hex] of Object.entries(COLOR_PALETTE)) {
    if (lower.includes(key)) return hex;
  }
  return '#475569';
}

const ProductCard = ({ product, onNavigateProduct }) => {
  const { addToCart, currentUser, wishlist, toggleWishlist, showToast } = useApp();
  const [isHovered, setIsHovered] = useState(false);
  const [isJustAdded, setIsJustAdded] = useState(false);
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);

  // Long Press Peek & Share Preview State
  const [showQuickPreview, setShowQuickPreview] = useState(false);
  const longPressTimerRef = useRef(null);
  const touchStartPosRef = useRef({ x: 0, y: 0 });
  const isLongPressTriggeredRef = useRef(false);

  if (!product) return null;

  const prodId = product.id || product._id;
  const isInWishlist = Array.isArray(wishlist) && wishlist.some(id => id === prodId || id.id === prodId);

  // Flash Sale Engine Check
  const isFlashSale = product.flashSale?.isActive && new Date(product.flashSale.endTime) > new Date();
  const price = isFlashSale ? product.flashSale.price : (product.price || 0);
  const originalPrice = product.originalPrice || (isFlashSale ? product.price : price);
  const discountPercent = originalPrice > 0 ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  // Standardized dynamic earnings display
  const userEarningsCoins = calculateCoinReward(price);

  // Dynamic Color Swatches & Swappable Packshot
  const hasColorModels = Array.isArray(product.colorModels) && product.colorModels.length > 0;
  const activeColorModel = hasColorModels ? product.colorModels[selectedColorIdx] : null;
  const displayedImage = activeColorModel?.primaryImage || (activeColorModel?.images && activeColorModel.images[0]) || product.image;

  // Financial & Logistics calculations
  const emiPerMonth = price >= 1500 ? Math.round(price / 6) : 0;
  const deliveryETA = 'Standard Delivery (2 to 5 Days)';


  const handleWishlistToggle = (e) => {
    e.stopPropagation();
    if (toggleWishlist) toggleWishlist(prodId);
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    setIsJustAdded(true);
    showToast(`${product.name?.substring(0, 22)}... added to Bag! 🛍️`, 'success');
    setTimeout(() => setIsJustAdded(false), 2000);
  };

  // Long press touch handlers
  const handleTouchStart = (e) => {
    if (e.touches && e.touches.length > 0) {
      touchStartPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    isLongPressTriggeredRef.current = false;
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      isLongPressTriggeredRef.current = true;
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(35); } catch (_) {}
      }
      setShowQuickPreview(true);
    }, 420);
  };

  const handleTouchMove = (e) => {
    if (e.touches && e.touches.length > 0) {
      const dx = Math.abs(e.touches[0].clientX - touchStartPosRef.current.x);
      const dy = Math.abs(e.touches[0].clientY - touchStartPosRef.current.y);
      if (dx > 10 || dy > 10) {
        if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      }
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
  };

  const handleCardClick = (e) => {
    if (isLongPressTriggeredRef.current) {
      e.preventDefault();
      e.stopPropagation();
      isLongPressTriggeredRef.current = false;
      return;
    }
    if (onNavigateProduct) {
      onNavigateProduct(prodId);
    }
  };

  return (
    <>
      <div 
        className="card product-card" 
        style={{
          ...styles.card,
          transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
          boxShadow: isHovered ? '0 14px 28px -4px rgba(15, 23, 42, 0.1), 0 4px 8px -2px rgba(15, 23, 42, 0.04)' : '0 1px 3px rgba(0, 0, 0, 0.05)',
          borderColor: isHovered ? '#cbd5e1' : '#e5e7eb',
          WebkitTouchCallout: 'none',
          userSelect: 'none'
        }} 
        onClick={handleCardClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onContextMenu={(e) => { if (isLongPressTriggeredRef.current) e.preventDefault(); }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Standardized 1:1 Image Canvas */}
        <div className="product-card-image-wrapper" style={styles.imageWrapper}>
          {/* Top Left Value Micro-Badges */}
          <div style={{ position: 'absolute', top: '8px', left: '8px', display: 'flex', flexDirection: 'column', gap: '4px', zIndex: 2 }}>
            {product.badge === 'bestseller' || (!product.badge && product.rating >= 4.7) ? (
              <span style={styles.badgeBestseller}>BESTSELLER</span>
            ) : product.badge === 'trending' || (!product.badge && product.rating >= 4.4) ? (
              <span style={styles.badgeTrending}>TOP CHOICE</span>
            ) : discountPercent >= 30 ? (
              <span style={styles.badgeDeal}>{discountPercent}% OFF</span>
            ) : null}
          </div>

          {/* Top Right Wishlist Button */}
          <button 
            style={styles.wishlistBtn}
            onClick={handleWishlistToggle}
            title={isInWishlist ? "Remove from Wishlist" : "Save to Wishlist"}
          >
            <Heart 
              size={15} 
              fill={isInWishlist ? '#f43f5e' : 'none'} 
              color={isInWishlist ? '#f43f5e' : '#64748b'} 
              strokeWidth={2.2} 
            />
          </button>
          
          {/* Packshot Image Normalized with smooth swap */}
          <div style={{ 
            width: '100%', 
            height: '100%', 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            transform: isHovered ? 'scale(1.05)' : 'scale(1)'
          }}>
            <LazyImage 
              src={displayedImage} 
              alt={product.name} 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
            />
          </div>
        </div>

        {/* Product Information Area */}
        <div className="product-card-info" style={styles.info}>
          
          {/* Interactive Color Variant Swatches (If Available) */}
          {hasColorModels && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minHeight: '18px', margin: '2px 0 4px' }} onClick={e => e.stopPropagation()}>
              {product.colorModels.slice(0, 5).map((cm, idx) => {
                const swatchBg = resolveSwatchColor(cm.name);
                const isSelected = selectedColorIdx === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    title={cm.name}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedColorIdx(idx);
                    }}
                    onMouseEnter={() => setSelectedColorIdx(idx)}
                    style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      backgroundColor: swatchBg,
                      border: isSelected ? '2px solid #4f46e5' : '1.5px solid #cbd5e1',
                      outline: isSelected ? '1px solid #4f46e5' : 'none',
                      outlineOffset: '1px',
                      cursor: 'pointer',
                      padding: 0,
                      transition: 'transform 0.15s ease'
                    }}
                  />
                );
              })}
              {product.colorModels.length > 5 && (
                <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700' }}>
                  +{product.colorModels.length - 5}
                </span>
              )}
            </div>
          )}

          {/* Product Title (2-Line Clamp) */}
          <h4 className="product-card-name" style={styles.name} title={product.name}>
            {product.name}
          </h4>

          {/* Rating & AB Coins Trust Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px', marginTop: 'auto', paddingTop: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={styles.ratingTag}>
                <span style={{ fontSize: '11px', fontWeight: '800' }}>{product.rating || '4.5'}</span>
                <Star size={10} fill="#ffffff" color="#ffffff" />
              </span>
              <span style={styles.reviewsCount}>
                ({(product.reviewsCount && product.reviewsCount > 999) ? `${(product.reviewsCount/1000).toFixed(1)}k` : (product.reviewsCount || stableHash(String(prodId || 'p'), 50, 490))})
              </span>
            </div>

            {!(currentUser && currentUser.isInfluencer) && (
              <span style={{ fontSize: '10px', color: '#b45309', fontWeight: '800', background: '#fffbeb', border: '1px solid #fde68a', padding: '1px 5px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                🪙 +{userEarningsCoins}
              </span>
            )}
          </div>

          {/* Price Stack & Discount Row */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
            <span style={styles.price}>₹{price.toLocaleString('en-IN')}</span>
            {discountPercent > 0 && (
              <>
                <span style={styles.originalPrice}>₹{originalPrice.toLocaleString('en-IN')}</span>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#059669' }}>
                  ({discountPercent}% off)
                </span>
              </>
            )}
          </div>

          {/* Financial & Trust Triggers: No-Cost EMI */}
          {emiPerMonth > 0 && (
            <div style={{ fontSize: '11px', color: '#475569', fontWeight: '600', marginTop: '2px' }}>
              No-Cost EMI from <strong style={{ color: '#0f172a' }}>₹{emiPerMonth.toLocaleString('en-IN')}/mo</strong>
            </div>
          )}

          {/* Logistics & Warranty Assurance */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px', borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#059669', fontWeight: '700' }}>
              <Truck size={12} color="#059669" />
              <span>{deliveryETA}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10.5px', color: '#64748b', fontWeight: '600' }}>
              <ShieldCheck size={12} color="#6366f1" />
              <span>1 Year Brand Warranty • 100% Genuine</span>
            </div>
          </div>

          {/* Primary Marketplace Add to Cart CTA */}
          <button 
            className="product-add-to-cart-btn" 
            style={{
              ...styles.addBtn,
              background: isJustAdded 
                ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' 
                : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              borderColor: isJustAdded ? '#059669' : '#0f172a'
            }}
            onClick={handleAddToCart}
          >
            {isJustAdded ? (
              <>
                <Check size={14} color="#ffffff" strokeWidth={3} />
                <span>Added to Bag</span>
              </>
            ) : (
              <>
                <ShoppingCart size={13} color="#ffffff" />
                <span>Add to Cart</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Long Press Quick Peek & Share Modal */}
      {showQuickPreview && (
        <ProductQuickPreviewModal
          product={product}
          isOpen={showQuickPreview}
          onClose={() => setShowQuickPreview(false)}
          onNavigateProduct={onNavigateProduct}
        />
      )}
    </>
  );
};

const styles = {
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    overflow: 'hidden',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    height: '100%',
    transition: 'all 0.25s ease',
    boxSizing: 'border-box'
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: '1 / 1',
    maxHeight: '190px',
    padding: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#ffffff',
    borderBottom: '1px solid #f1f5f9',
    position: 'relative',
    overflow: 'hidden',
    boxSizing: 'border-box',
  },
  badgeBestseller: {
    background: 'linear-gradient(135deg, #090d16 0%, #1e293b 100%)', 
    color: '#fde047', 
    fontSize: '9px', 
    fontWeight: '900', 
    padding: '2px 6px', 
    borderRadius: '4px', 
    letterSpacing: '0.4px',
    border: '1px solid #334155',
    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
    display: 'inline-block'
  },
  badgeTrending: {
    background: 'linear-gradient(135deg, #4338ca 0%, #6366f1 100%)', 
    color: 'white', 
    fontSize: '9px', 
    fontWeight: '900', 
    padding: '2px 6px', 
    borderRadius: '4px', 
    letterSpacing: '0.4px',
    boxShadow: '0 2px 6px rgba(99, 102, 241, 0.25)',
    display: 'inline-block'
  },
  badgeDeal: {
    background: 'linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)', 
    color: 'white', 
    fontSize: '9px', 
    fontWeight: '900', 
    padding: '2px 6px', 
    borderRadius: '4px', 
    letterSpacing: '0.4px',
    boxShadow: '0 2px 6px rgba(244, 63, 94, 0.25)',
    display: 'inline-block'
  },
  wishlistBtn: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 3,
    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
    transition: 'transform 0.15s ease'
  },
  info: {
    padding: '12px 14px 14px',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    gap: '3px',
    boxSizing: 'border-box'
  },
  name: {
    fontFamily: "'Outfit', sans-serif",
    fontSize: '13.5px',
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: '1.35',
    minHeight: '36px',
    maxHeight: '36px',
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    letterSpacing: '-0.1px',
    margin: '2px 0 0 0'
  },
  ratingTag: {
    backgroundColor: '#059669',
    color: 'white',
    fontSize: '10.5px',
    fontWeight: '800',
    padding: '2px 6px',
    borderRadius: '4px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px'
  },
  reviewsCount: {
    fontSize: '11px',
    color: '#64748b',
    fontWeight: '600'
  },
  price: {
    fontFamily: "'Outfit', sans-serif",
    fontSize: '16px',
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: '-0.3px',
    lineHeight: 1.1
  },
  originalPrice: {
    fontSize: '11.5px',
    textDecoration: 'line-through',
    color: '#94a3b8',
    fontWeight: '600'
  },
  addBtn: {
    marginTop: '10px',
    width: '100%',
    padding: '9px 12px',
    borderRadius: '8px',
    border: 'none',
    color: '#ffffff',
    fontFamily: "'Outfit', sans-serif",
    fontSize: '12.5px',
    fontWeight: '800',
    letterSpacing: '0.3px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 6px rgba(15, 23, 42, 0.15)'
  }
};

export default React.memo(ProductCard);
