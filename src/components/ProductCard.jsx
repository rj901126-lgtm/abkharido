import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Star, Award, Heart, Zap, ShieldCheck, Check, Plus, Minus } from 'lucide-react';
import LazyImage from './LazyImage';
import ProductQuickPreviewModal from './ProductQuickPreviewModal';
import { calculateCoinReward } from '../utils/coinUtils';

// Stable hash from a string — same string always yields same number
function stableHash(str, min, max) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return min + (hash % (max - min + 1));
}

const ProductCard = ({ product, onNavigateProduct }) => {
  const { addToCart, updateCartQty, removeFromCart, cart, currentUser, wishlist, toggleWishlist, showToast } = useApp();
  const [isHovered, setIsHovered] = useState(false);

  // Long Press Peek & Share Preview State
  const [showQuickPreview, setShowQuickPreview] = useState(false);
  const longPressTimerRef = useRef(null);
  const touchStartPosRef = useRef({ x: 0, y: 0 });
  const isLongPressTriggeredRef = useRef(false);

  if (!product) return null;

  const prodId = product.id || product._id;
  const isInWishlist = Array.isArray(wishlist) && wishlist.some(id => id === prodId || id.id === prodId);

  // Cart Quantity Detection for Interactive Stepper
  const cartItem = Array.isArray(cart) ? cart.find(item => (item.id || item._id) === prodId) : null;
  const quantityInCart = cartItem ? (cartItem.qty || cartItem.quantity || 1) : 0;

  // Flash Sale Engine Check
  const isFlashSale = product.flashSale?.isActive && new Date(product.flashSale.endTime) > new Date();
  const price = isFlashSale ? product.flashSale.price : (product.price || 0);
  const originalPrice = product.originalPrice || (isFlashSale ? product.price : price);
  const discountPercent = originalPrice > 0 ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  // Standardized dynamic earnings display
  const userEarningsCoins = calculateCoinReward(price);
  const influencerEarningsCash = Math.round(price * (product.influencerCommissionRate || 0.08));

  // Unit/Weight Display fallback
  const unitDisplay = product.unit || product.weight || product.packSize || product.variant || (product.category === 'mobiles' ? '1 device' : product.category === 'fashion' ? 'Standard fit' : '1 unit');

  const handleWishlistToggle = (e) => {
    e.stopPropagation();
    if (toggleWishlist) toggleWishlist(prodId);
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
          boxShadow: isHovered ? '0 12px 24px -4px rgba(15, 23, 42, 0.08), 0 4px 8px -2px rgba(15, 23, 42, 0.04)' : '0 1px 3px rgba(0, 0, 0, 0.05)',
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
          {/* Top Left Value & ETA Trigger Badge */}
          <div style={{ position: 'absolute', top: '8px', left: '8px', display: 'flex', flexDirection: 'column', gap: '4px', zIndex: 2 }}>
            {product.badge === 'bestseller' || (!product.badge && product.rating >= 4.7) ? (
              <span style={styles.badgeBestseller}>BESTSELLER</span>
            ) : product.badge === 'trending' || (!product.badge && product.rating >= 4.4) ? (
              <span style={styles.badgeTrending}>TRENDING</span>
            ) : discountPercent >= 30 ? (
              <span style={styles.badgeDeal}>⚡ {discountPercent}% OFF</span>
            ) : null}

            <span style={styles.badgeETA}>
              ⚡ 10–15 Mins
            </span>
          </div>

          {/* Top Right Interactive Wishlist Button */}
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
          
          {/* Product Image Normalized */}
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
              src={product.image} 
              alt={product.name} 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
            />
          </div>
        </div>

        {/* Streamlined Information Hierarchy */}
        <div className="product-card-info" style={styles.info}>
          {/* Unit / Weight Subtitle */}
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'capitalize' }}>
            {unitDisplay}
          </div>

          {/* Product Name (2-Line Clamp) */}
          <h4 className="product-card-name" style={styles.name} title={product.name}>
            {product.name}
          </h4>

          {/* Rating & Reward Coins Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px', marginTop: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span style={styles.ratingTag}>
                <span style={{ fontSize: '10.5px', fontWeight: '800' }}>{product.rating || '4.5'}</span>
                <span style={{ color: '#fde047', fontSize: '9.5px' }}>★</span>
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

          {/* Pricing Stack & High-Intent CTA Stepper */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '6px', paddingTop: '4px' }}>
            {/* Price Stack */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={styles.price}>₹{price.toLocaleString('en-IN')}</span>
                {discountPercent > 0 && (
                  <span style={styles.originalPrice}>₹{originalPrice.toLocaleString('en-IN')}</span>
                )}
              </div>
              {discountPercent > 0 && (
                <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#059669' }}>
                  {discountPercent}% OFF
                </span>
              )}
            </div>

            {/* High-Intent CTA / Interactive Stepper */}
            {quantityInCart === 0 ? (
              <button 
                className="product-add-to-cart-btn" 
                style={styles.addBtn}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  addToCart(product, 1);
                  showToast(`${product.name?.substring(0, 20)}... added! 🛍️`, 'success');
                }}
              >
                <Plus size={13} strokeWidth={2.8} />
                <span>ADD</span>
              </button>
            ) : (
              <div 
                style={styles.stepperContainer}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
              >
                <button
                  style={styles.stepperBtn}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (quantityInCart <= 1) {
                      removeFromCart(prodId);
                    } else {
                      updateCartQty(prodId, quantityInCart - 1);
                    }
                  }}
                  title="Decrease Quantity"
                >
                  <Minus size={13} strokeWidth={2.8} />
                </button>
                <span style={styles.stepperQty}>{quantityInCart}</span>
                <button
                  style={styles.stepperBtn}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    updateCartQty(prodId, quantityInCart + 1);
                  }}
                  title="Increase Quantity"
                >
                  <Plus size={13} strokeWidth={2.8} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 🚀 Blinkit-Style Long Press Quick Peek & Share Modal */}
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
    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', 
    color: 'white', 
    fontSize: '9px', 
    fontWeight: '900', 
    padding: '2px 6px', 
    borderRadius: '4px', 
    letterSpacing: '0.4px',
    boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)',
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
  badgeETA: {
    background: '#f8fafc',
    color: '#0f172a',
    fontSize: '9.5px',
    fontWeight: '800',
    padding: '2px 6px',
    borderRadius: '4px',
    border: '1px solid #e2e8f0',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2px'
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
    gap: '4px',
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
    margin: 0
  },
  ratingTag: {
    backgroundColor: '#059669',
    color: 'white',
    fontSize: '10px',
    fontWeight: '800',
    padding: '1px 5px',
    borderRadius: '4px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2px'
  },
  reviewsCount: {
    fontSize: '11px',
    color: '#64748b',
    fontWeight: '600'
  },
  price: {
    fontFamily: "'Outfit', sans-serif",
    fontSize: '15.5px',
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
    border: '1.5px solid #059669',
    backgroundColor: '#ecfdf5',
    color: '#059669',
    borderRadius: '8px',
    padding: '6px 14px',
    fontFamily: "'Outfit', sans-serif",
    fontSize: '12px',
    fontWeight: '900',
    letterSpacing: '0.4px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '3px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    boxShadow: '0 1px 3px rgba(5, 150, 105, 0.15)'
  },
  stepperContainer: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: '#059669',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(5, 150, 105, 0.35)'
  },
  stepperBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#ffffff',
    padding: '6px 8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.15s ease'
  },
  stepperQty: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: '12.5px',
    fontFamily: "'Outfit', sans-serif",
    padding: '0 6px',
    minWidth: '16px',
    textAlign: 'center'
  }
};

export default React.memo(ProductCard);
