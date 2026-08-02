import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Star, Award, ShoppingCart, Heart, Zap, ShieldCheck } from 'lucide-react';
import LazyImage from './LazyImage';
import CountdownTimer from './CountdownTimer';

const ProductCard = ({ product, onNavigateProduct }) => {
  const { addToCart, currentUser, wishlist, toggleWishlist } = useApp();
  const [isHovered, setIsHovered] = useState(false);
  const [isBtnHovered, setIsBtnHovered] = useState(false);

  if (!product) return null;

  const isInWishlist = Array.isArray(wishlist) && wishlist.some(id => id === product.id || id.id === product.id);

  // Flash Sale Engine Check
  const isFlashSale = product.flashSale?.isActive && new Date(product.flashSale.endTime) > new Date();
  const price = isFlashSale ? product.flashSale.price : (product.price || 0);
  const originalPrice = product.originalPrice || (isFlashSale ? product.price : price);
  const discountPercent = originalPrice > 0 ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  // Dynamic earnings display
  const userEarningsCoins = Math.round(price * (product.userCommissionRate || 0.05));
  const influencerEarningsCash = Math.round(price * (product.influencerCommissionRate || 0.08));

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCart(product);
  };

  const handleWishlistToggle = (e) => {
    e.stopPropagation();
    if (toggleWishlist) toggleWishlist(product.id);
  };

  return (
    <div 
      className="card product-card" 
      style={{
        ...styles.card,
        transform: isHovered ? 'translateY(-5px)' : 'translateY(0)',
        boxShadow: isHovered ? '0 18px 40px -10px rgba(9, 13, 22, 0.16)' : '0 4px 16px rgba(9, 13, 22, 0.05)',
        borderColor: isHovered ? '#818cf8' : '#e2e8f0'
      }} 
      onClick={() => onNavigateProduct(product.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image Stage (Unobstructed & Clean) */}
      <div className="product-card-image-wrapper" style={styles.imageWrapper}>
        {/* Top Left Discrete VIP Badge */}
        {product.badge === 'bestseller' || (!product.badge && product.rating >= 4.7) ? (
          <div style={styles.badgeFire}>
            BESTSELLER
          </div>
        ) : product.badge === 'trending' || (!product.badge && product.rating >= 4.4) ? (
          <div style={styles.badgeTrending}>
            TRENDING
          </div>
        ) : product.badge === 'new' || discountPercent >= 30 ? (
          <div style={styles.badgeNew}>
            VIP SPECIAL
          </div>
        ) : null}

        {/* Top Right Interactive Wishlist Button */}
        <button 
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #e2e8f0',
            cursor: 'pointer',
            zIndex: 10,
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
          onClick={handleWishlistToggle}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          title={isInWishlist ? "Remove from Wishlist" : "Save to Wishlist"}
        >
          <Heart size={17} fill={isInWishlist ? '#e11d48' : 'none'} color={isInWishlist ? '#e11d48' : '#475569'} style={{ strokeWidth: 2.5 }} />
        </button>
        
        <div style={{ 
          width: '100%', 
          height: '100%', 
          transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          transform: isHovered ? 'scale(1.06)' : 'scale(1)'
        }}>
          <LazyImage src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
      </div>

      {/* Info Content Area */}
      <div className="product-card-info" style={styles.info}>
        <h4 className="product-card-name" style={styles.name} title={product.name}>
          {product.name}
        </h4>

        {/* Rating and VIP Assurance Stamp */}
        <div className="product-card-rating-row" style={styles.ratingRow}>
          <span style={styles.ratingTag}>
            {product.rating} <Star size={11} fill="white" />
          </span>
          <span style={styles.reviewsCount}>({product.reviewsCount || Math.floor(Math.random() * 400 + 50)})</span>
          
          <div style={styles.assuredBadge}>
            <ShieldCheck size={12} color="#047857" style={{ marginRight: '3px' }} />
            <span style={{ fontSize: '10px', color: '#047857', fontWeight: '800', letterSpacing: '0.3px' }}>VIP ASSURED</span>
          </div>
        </div>

        {/* Pricing Row with Clean Wrapping */}
        <div className="product-card-price-row" style={styles.priceRow}>
          <span style={styles.price}>₹{(price).toLocaleString('en-IN')}</span>
          {discountPercent > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={styles.originalPrice}>₹{(originalPrice).toLocaleString('en-IN')}</span>
              <span style={styles.discount}>{discountPercent}% OFF</span>
            </div>
          )}
        </div>

        {/* Consolidated Single-Line VIP Benefit Strip */}
        {currentUser && currentUser.isInfluencer ? (
          <div className="product-card-reward-banner" style={styles.rewardBanner}>
            <Award size={13} color="#4338ca" style={{ flexShrink: 0 }} />
            <div style={styles.rewardText}>
              <span>Partner Reward: <strong style={{ color: '#059669', fontSize: '12px' }}>₹{influencerEarningsCash} Cash</strong></span>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 'auto', background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '8px', padding: '5px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', boxSizing: 'border-box' }}>
            <span style={{ fontSize: '11px', color: '#059669', fontWeight: '700' }}>⚡ Free Express</span>
            <span style={{ fontSize: '11px', color: '#334155', fontWeight: '700' }}>🪙 <strong style={{ color: '#d97706' }}>+{userEarningsCoins}</strong> Coins</span>
          </div>
        )}

        {/* Clean, Executive Action Button */}
        <button 
          className="product-add-to-cart-btn" 
          style={{
            ...styles.addBtn,
            background: isBtnHovered ? '#4f46e5' : '#090d16',
            boxShadow: isBtnHovered ? '0 8px 20px rgba(79, 70, 229, 0.35)' : '0 2px 8px rgba(9, 13, 22, 0.15)',
            transform: isBtnHovered ? 'translateY(-2px)' : 'none'
          }} 
          onClick={handleAddToCart}
          onMouseEnter={() => setIsBtnHovered(true)}
          onMouseLeave={() => setIsBtnHovered(false)}
        >
          <ShoppingCart size={15} style={{ color: '#10b981' }} /> <span>Add to Cart</span>
        </button>
      </div>
    </div>
  );
};

const styles = {
  card: {
    backgroundColor: 'white',
    borderRadius: '20px',
    border: '1px solid #f1f5f9',
    overflow: 'hidden',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    height: '100%',
    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    boxShadow: '0 4px 16px -2px rgba(9, 13, 22, 0.04)',
    boxSizing: 'border-box'
  },
  imageWrapper: {
    width: '100%',
    height: '220px',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f8fafc',
    borderBottom: '1px solid #f1f5f9',
    position: 'relative',
    overflow: 'hidden',
    boxSizing: 'border-box',
  },
  badgeFire: {
    position: 'absolute', 
    top: '12px', 
    left: '12px', 
    backgroundColor: '#090d16', 
    color: '#fde047', 
    fontSize: '10px', 
    fontWeight: '900', 
    padding: '4px 10px', 
    borderRadius: '8px', 
    zIndex: 2, 
    letterSpacing: '0.5px',
    border: '1px solid #334155'
  },
  badgeTrending: {
    position: 'absolute', 
    top: '12px', 
    left: '12px', 
    backgroundColor: '#059669', 
    color: 'white', 
    fontSize: '10px', 
    fontWeight: '900', 
    padding: '4px 10px', 
    borderRadius: '8px', 
    zIndex: 2, 
    letterSpacing: '0.5px'
  },
  badgeNew: {
    position: 'absolute', 
    top: '12px', 
    left: '12px', 
    backgroundColor: '#4338ca', 
    color: 'white', 
    fontSize: '10px', 
    fontWeight: '900', 
    padding: '4px 10px', 
    borderRadius: '8px', 
    zIndex: 2, 
    letterSpacing: '0.5px'
  },
  info: {
    padding: '16px 18px 18px 18px',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    gap: '8px',
    boxSizing: 'border-box'
  },
  name: {
    fontFamily: "'Outfit', sans-serif",
    fontSize: '15px',
    fontWeight: '700',
    color: '#090d16',
    lineHeight: '1.4',
    height: '42px',
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    letterSpacing: '-0.2px',
    margin: 0
  },
  ratingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap'
  },
  ratingTag: {
    backgroundColor: '#059669',
    color: 'white',
    fontSize: '11px',
    fontWeight: '800',
    padding: '2px 6px',
    borderRadius: '6px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px'
  },
  reviewsCount: {
    fontSize: '12px',
    color: '#64748b',
    fontWeight: '600'
  },
  assuredBadge: {
    marginLeft: 'auto', 
    display: 'inline-flex', 
    alignItems: 'center', 
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    padding: '2px 6px'
  },
  priceRow: {
    display: 'flex',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '2px',
  },
  price: {
    fontFamily: "'Outfit', sans-serif",
    fontSize: '20px',
    fontWeight: '900',
    color: '#090d16',
    letterSpacing: '-0.5px',
  },
  originalPrice: {
    fontSize: '13px',
    textDecoration: 'line-through',
    color: '#94a3b8',
    fontWeight: '600'
  },
  discount: {
    fontSize: '11px',
    fontWeight: '800',
    color: '#059669',
    backgroundColor: '#ecfdf5',
    border: '1px solid #a7f3d0',
    padding: '2px 6px',
    borderRadius: '6px'
  },
  rewardBanner: {
    backgroundColor: '#eff6ff',
    border: '1px dashed #93c5fd',
    borderRadius: '10px',
    padding: '8px 10px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: 'auto',
  },
  rewardText: {
    fontSize: '12px',
    color: '#1e293b',
    fontWeight: '700',
    lineHeight: '1.2',
  },
  addBtn: {
    border: 'none',
    color: 'white',
    borderRadius: '12px',
    padding: '12px 16px',
    fontFamily: "'Outfit', sans-serif",
    fontSize: '14px',
    fontWeight: '800',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginTop: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};

export default React.memo(ProductCard);
