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
        transform: isHovered ? 'translateY(-6px)' : 'translateY(0)',
        boxShadow: isHovered ? '0 20px 45px -10px rgba(15, 23, 42, 0.15)' : '0 4px 16px rgba(15, 23, 42, 0.05)',
        borderColor: isHovered ? '#818cf8' : '#e2e8f0'
      }} 
      onClick={() => onNavigateProduct(product.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image Stage */}
      <div className="product-card-image-wrapper" style={styles.imageWrapper}>
        {/* Top Left Sales Booster Pills */}
        {product.badge === 'bestseller' || (!product.badge && product.rating >= 4.7) ? (
          <div style={styles.badgeFire}>
            🔥 #1 IN INDIA
          </div>
        ) : product.badge === 'trending' || (!product.badge && product.rating >= 4.4) ? (
          <div style={styles.badgeTrending}>
            ⚡ HOT DEAL
          </div>
        ) : product.badge === 'new' || discountPercent >= 30 ? (
          <div style={styles.badgeNew}>
            👑 VIP SPECIAL
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
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #e2e8f0',
            cursor: 'pointer',
            zIndex: 10,
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
          onClick={handleWishlistToggle}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          title={isInWishlist ? "Remove from Wishlist" : "Save to Wishlist"}
        >
          <Heart size={18} fill={isInWishlist ? '#e11d48' : 'none'} color={isInWishlist ? '#e11d48' : '#475569'} style={{ strokeWidth: 2.5 }} />
        </button>
        
        <div style={{ 
          width: '100%', 
          height: '100%', 
          transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
          transform: isHovered ? 'scale(1.09)' : 'scale(1)'
        }}>
          <LazyImage src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>

        {/* Floating Express Delivery Pill */}
        <div style={{
          position: 'absolute',
          bottom: '8px',
          left: '10px',
          background: 'rgba(15, 23, 42, 0.88)',
          color: '#38bdf8',
          backdropFilter: 'blur(8px)',
          fontSize: '10px',
          fontWeight: '800',
          padding: '4px 8px',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          letterSpacing: '0.2px'
        }}>
          <Zap size={10} fill="#38bdf8" /> 10-MIN RAPID DELIVERY
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
          <span style={styles.reviewsCount}>({product.reviewsCount || Math.floor(Math.random() * 400 + 50)} reviews)</span>
          
          {/* Holographic A-Assured VIP Tag */}
          <div style={styles.assuredBadge}>
            <ShieldCheck size={11} color="#ffe500" style={{ marginRight: '2px' }} />
            <span>A-ASSURED <strong style={{ color: '#ffe500' }}>VIP</strong></span>
          </div>
        </div>

        {/* Pricing Row with Big Outfit Font */}
        <div className="product-card-price-row" style={styles.priceRow}>
          <span style={styles.price}>₹{(price).toLocaleString('en-IN')}</span>
          {discountPercent > 0 && (
            <>
              <span style={styles.originalPrice}>₹{(originalPrice).toLocaleString('en-IN')}</span>
              <span style={styles.discount}>🔥 {discountPercent}% OFF</span>
            </>
          )}
        </div>

        {/* Flash Sale or High Demand Urgency Meter */}
        {isFlashSale ? (
          <div style={{ marginTop: '4px', marginBottom: '8px' }}>
            <CountdownTimer endTime={product.flashSale.endTime} compact={true} />
          </div>
        ) : (discountPercent >= 15 || product.rating >= 4.5) ? (
          <div style={{ marginTop: '6px', marginBottom: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '800', color: '#e11d48', marginBottom: '3px' }}>
              <span>🔥 Selling Fast in Metro City</span>
              <span style={{ color: '#090d16' }}>Only 3 units left!</span>
            </div>
            <div style={{ height: '5px', width: '100%', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: '82%', background: 'linear-gradient(90deg, #ff0055, #ff5500)', borderRadius: '4px', transition: 'width 1s ease' }}></div>
            </div>
          </div>
        ) : null}

        {/* Dynamic Affiliate / Referral Earning Banner */}
        {currentUser && currentUser.isInfluencer ? (
          <div className="product-card-reward-banner" style={styles.rewardBanner}>
            <Award size={14} color="#4338ca" style={{ flexShrink: 0 }} />
            <div style={styles.rewardText}>
              <span>Partner Reward: <strong style={{ color: '#059669', fontSize: '13px' }}>₹{influencerEarningsCash} Cash</strong></span>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 'auto', background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', border: '1px solid #fde68a', borderRadius: '10px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', width: '100%', boxShadow: '0 2px 8px rgba(245, 158, 11, 0.12)' }}>
            <span style={{ fontSize: '13px' }}>🪙</span>
            <span style={{ fontSize: '12px', color: '#92400e', fontWeight: '800', letterSpacing: '0.2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Earn <span style={{ fontSize: '13px', fontWeight: '900', color: '#d97706' }}>+{userEarningsCoins}</span> VIP Cashback Coins
            </span>
          </div>
        )}

        {/* 1-Click Buy Action Button */}
        <button 
          className="product-add-to-cart-btn" 
          style={{
            ...styles.addBtn,
            background: isBtnHovered ? 'linear-gradient(135deg, #3730a3 0%, #1e1b4b 100%)' : 'linear-gradient(135deg, #4338ca 0%, #6366f1 100%)',
            boxShadow: isBtnHovered ? '0 10px 25px -4px rgba(67, 56, 202, 0.55)' : '0 4px 12px rgba(67, 56, 202, 0.25)',
            transform: isBtnHovered ? 'scale(1.02)' : 'scale(1)'
          }} 
          onClick={handleAddToCart}
          onMouseEnter={() => setIsBtnHovered(true)}
          onMouseLeave={() => setIsBtnHovered(false)}
        >
          <ShoppingCart size={16} /> ⚡ Grab Best Deal
        </button>
      </div>
    </div>
  );
};

const styles = {
  card: {
    backgroundColor: 'white',
    borderRadius: '24px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    height: '100%',
    transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
    boxSizing: 'border-box'
  },
  imageWrapper: {
    width: '100%',
    height: '230px',
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'radial-gradient(circle at center, #ffffff 0%, #f8fafc 100%)',
    borderBottom: '1px solid #f1f5f9',
    position: 'relative',
    overflow: 'hidden',
    boxSizing: 'border-box',
  },
  badgeFire: {
    position: 'absolute', 
    top: '12px', 
    left: '12px', 
    background: 'linear-gradient(135deg, #e11d48, #be123c)', 
    color: 'white', 
    fontSize: '10px', 
    fontWeight: '900', 
    padding: '5px 10px', 
    borderRadius: '8px', 
    zIndex: 2, 
    boxShadow: '0 4px 12px rgba(225, 29, 72, 0.4)',
    letterSpacing: '0.3px'
  },
  badgeTrending: {
    position: 'absolute', 
    top: '12px', 
    left: '12px', 
    background: 'linear-gradient(135deg, #059669, #047857)', 
    color: 'white', 
    fontSize: '10px', 
    fontWeight: '900', 
    padding: '5px 10px', 
    borderRadius: '8px', 
    zIndex: 2, 
    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.35)',
    letterSpacing: '0.3px'
  },
  badgeNew: {
    position: 'absolute', 
    top: '12px', 
    left: '12px', 
    background: 'linear-gradient(135deg, #7c3aed, #4338ca)', 
    color: 'white', 
    fontSize: '10px', 
    fontWeight: '900', 
    padding: '5px 10px', 
    borderRadius: '8px', 
    zIndex: 2, 
    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.4)',
    letterSpacing: '0.3px'
  },
  info: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    gap: '8px',
  },
  name: {
    fontFamily: "'Outfit', sans-serif",
    fontSize: '15px',
    fontWeight: '700',
    color: '#090d16',
    lineHeight: '1.35',
    height: '40px',
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    letterSpacing: '-0.2px'
  },
  ratingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  ratingTag: {
    backgroundColor: '#059669',
    color: 'white',
    fontSize: '12px',
    fontWeight: '800',
    padding: '2px 7px',
    borderRadius: '6px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
    boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)'
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
    height: '20px', 
    background: 'linear-gradient(135deg, #090d16 0%, #1e293b 100%)', 
    color: 'white', 
    borderRadius: '6px', 
    padding: '0 7px', 
    fontSize: '9px', 
    fontWeight: '900', 
    letterSpacing: '0.4px',
    border: '1px solid #3b82f6',
    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.25)'
  },
  priceRow: {
    display: 'flex',
    alignItems: 'baseline',
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
    fontSize: '12px',
    fontWeight: '800',
    color: '#059669',
    backgroundColor: '#dcfce7',
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
    borderRadius: '14px',
    padding: '12px 16px',
    fontFamily: "'Outfit', sans-serif",
    fontSize: '14px',
    fontWeight: '800',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginTop: '10px',
    cursor: 'pointer',
    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
  },
};

export default React.memo(ProductCard);
