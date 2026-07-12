import React from 'react';
import { useApp } from '../context/AppContext';
import { Star, Award, ShoppingCart } from 'lucide-react';

const ProductCard = ({ product, onNavigateProduct }) => {
  const { addToCart, currentUser } = useApp();

  const discountPercent = Math.round(
    ((product.originalPrice - product.price) / product.originalPrice) * 100
  );

  // Dynamic earnings display
  const userEarningsCoins = Math.round(product.price * product.userCommissionRate);
  const influencerEarningsCash = Math.round(product.price * product.influencerCommissionRate);

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCart(product);
  };

  return (
    <div style={styles.card} onClick={() => onNavigateProduct(product.id)}>
      {/* Product Image */}
      <div style={styles.imageWrapper}>
        <img src={product.image} alt={product.name} style={styles.image} />
      </div>

      {/* Info Content */}
      <div style={styles.info}>
        <h4 style={styles.name} title={product.name}>
          {product.name}
        </h4>

        {/* Rating and Reviews */}
        <div style={styles.ratingRow}>
          <span className="rating-tag">
            {product.rating} <Star size={10} fill="white" />
          </span>
          <span style={styles.reviewsCount}>({product.reviewsCount})</span>
        </div>

        {/* Pricing */}
        <div style={styles.priceRow}>
          <span style={styles.price}>₹{product.price.toLocaleString('en-IN')}</span>
          <span style={styles.originalPrice}>₹{product.originalPrice.toLocaleString('en-IN')}</span>
          <span style={styles.discount}>{discountPercent}% off</span>
        </div>

        {/* Dynamic Affiliate / Referral Earning Banner */}
        <div style={styles.rewardBanner}>
          <Award size={14} color="var(--primary-color)" />
          <div style={styles.rewardText}>
            {currentUser && currentUser.isInfluencer ? (
              <span>Earn <strong style={{ color: 'var(--success)' }}>₹{influencerEarningsCash}</strong> cash commission</span>
            ) : (
              <span>Earn <strong style={{ color: '#e68f00' }}>{userEarningsCoins}</strong> Coins referral reward</span>
            )}
          </div>
        </div>

        {/* Quick Add To Cart */}
        <button style={styles.addBtn} onClick={handleAddToCart}>
          <ShoppingCart size={14} /> Add to Cart
        </button>
      </div>
    </div>
  );
};

const styles = {
  card: {
    backgroundColor: 'white',
    borderRadius: '4px',
    border: '1px solid #f0f0f0',
    overflow: 'hidden',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    height: '100%',
  },
  imageWrapper: {
    width: '100%',
    height: '180px',
    padding: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderBottom: '1px solid #f6f6f6',
  },
  image: {
    maxHeight: '100%',
    maxWidth: '100%',
    objectFit: 'contain',
    transition: 'transform 0.3s ease',
  },
  info: {
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    gap: '6px',
  },
  name: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#212121',
    lineHeight: '1.4',
    height: '38px',
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },
  ratingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  reviewsCount: {
    fontSize: '12px',
    color: '#878787',
  },
  priceRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '6px',
    marginTop: '2px',
  },
  price: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#212121',
  },
  originalPrice: {
    fontSize: '12px',
    textDecoration: 'line-through',
    color: '#878787',
  },
  discount: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#388e3c',
  },
  rewardBanner: {
    backgroundColor: '#f5f8ff',
    border: '1px dashed #c0d8ff',
    borderRadius: '4px',
    padding: '6px 8px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: 'auto',
  },
  rewardText: {
    fontSize: '11px',
    color: '#333333',
    fontWeight: '500',
    lineHeight: '1.2',
  },
  addBtn: {
    backgroundColor: '#fff',
    border: '1px solid var(--primary-color)',
    color: 'var(--primary-color)',
    borderRadius: '2px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    marginTop: '8px',
    transition: 'all 0.15s ease',
  },
};

export default ProductCard;
