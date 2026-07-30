import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
// eslint-disable-next-line
import { Trash2, ShoppingBag, Award, Coins, HelpCircle, ArrowRight, ShieldCheck, Lock, Heart } from 'lucide-react';
import '../assets/styles/cart.css';

const CartPage = ({ onNavigate, onCheckout }) => {
  const { cart, updateCartQty, removeFromCart, activeReferral, currentUser, wishlist, toggleWishlist, showToast } = useApp();
  const [useCoinsDiscount, setUseCoinsDiscount] = useState(false);

  const handleMoveToWishlist = (productId) => {
    if (!currentUser) {
      showToast('Please log in to save items to your wishlist.', 'warning');
      return;
    }
    if (!wishlist.includes(productId)) {
      toggleWishlist(productId);
    } else {
      showToast('Item saved for later!', 'info');
    }
    removeFromCart(productId);
  };

  if (cart.length === 0) {
    return (
      <div className="container cart-empty-container">
        <div className="cart-empty-icon">
          <ShoppingBag size={56} color="var(--primary-color)" strokeWidth={1.5} />
        </div>
        <h2 className="cart-empty-title">Your cart is empty!</h2>
        <p className="cart-empty-text">
          Explore our wide range of premium products and find something you love.
        </p>
        <button 
          className="btn btn-primary cart-empty-btn" 
          onClick={() => onNavigate('home')}
        >
          Start Shopping
        </button>
      </div>
    );
  }

  // Price calculations
  const itemsPrice = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const originalItemsPrice = cart.reduce((acc, item) => acc + item.product.originalPrice * item.quantity, 0);
  
  const discountValue = originalItemsPrice - itemsPrice;
  const deliveryCharge = itemsPrice > 500 ? 0 : 40;
  
  // Coin redemption calculation
  const userCoins = currentUser ? (currentUser.walletCoins || 0) : 0;
  const maxCoinsToRedeem = Math.min(userCoins, itemsPrice);
  const coinsDiscount = useCoinsDiscount ? maxCoinsToRedeem : 0;
  const finalAmount = itemsPrice - coinsDiscount + deliveryCharge;

  // Calculate simulated referrer rewards to display in cart for visual feedback
  const getReferrerRewardText = () => {
    if (!activeReferral) return null;

    let rewardSum = 0;
    cart.forEach(item => {
      const rate = item.product.userCommissionRate || 0.02;
      rewardSum += item.product.price * item.quantity * rate;
    });

    return (
      <span>
        Referrer <strong>{activeReferral.referrerId}</strong> will receive{' '}
        <strong style={{ color: '#e68f00' }}>{Math.round(rewardSum)}</strong> AbKharido Coins.
      </span>
    );
  };

  return (
    <div className="container cart-layout-grid animate-fade-in desktop-premium-cart">
      
      {/* Left side: Cart Items list */}
      <div className="cart-items-section">
        <div className="cart-card-header cart-card-header-flex">
          <span>My Cart ({cart.reduce((acc, item) => acc + item.quantity, 0)} Items)</span>
        </div>

        {/* Sales Boost: Free Shipping Progress */}
        <div className="cart-promo-banner">
          {itemsPrice >= 500 ? (
            <div className="cart-promo-success">
              <span className="cart-promo-icon">🎉</span>
              You have unlocked FREE Express Shipping!
            </div>
          ) : (
            <>
              <div className="cart-promo-text">
                <span>Add <span className="cart-promo-highlight">₹{500 - itemsPrice}</span> more to get FREE Shipping!</span>
              </div>
              <div className="cart-progress-bar-bg">
                <div 
                  className="cart-progress-bar-fill" 
                  style={{ width: `${Math.min((itemsPrice / 500) * 100, 100)}%` }} 
                />
              </div>
            </>
          )}
        </div>

        {/* Active Referral Confirmation Banner */}
        {activeReferral && (
          <div className="active-referral-banner">
            <Award size={20} color="var(--primary-color)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '13px', color: '#1e3a8a' }}>
              <div style={{ fontWeight: 'bold' }}>Referral Tag Active</div>
              <div>{getReferrerRewardText()}</div>
            </div>
          </div>
        )}

        {/* List of Products in Cart */}
        {cart.map(item => {
          const discountPercent = item.product.originalPrice > 0
            ? Math.round(((item.product.originalPrice - item.product.price) / item.product.originalPrice) * 100)
            : 0;
          return (
            <div key={item.product.id} className="cart-item-card">
              <div className="cart-item-image">
                <img src={item.product.image} alt={item.product.name} />
              </div>

              <div className="cart-item-details">
                <h3 className="cart-item-title">{item.product.name}</h3>
                <span className="cart-item-category">
                  Category: {item.product.category}
                  {item.product.selectedColor && ` | Color: ${item.product.selectedColor}`}
                  {item.product.selectedVariant && ` | Variant: ${item.product.selectedVariant}`}
                </span>
                
                <div className="cart-item-prices">
                  <span className="cart-item-price">₹{(item.product.price || 0).toLocaleString('en-IN')}</span>
                  <span className="cart-item-original">₹{(item.product.originalPrice || 0).toLocaleString('en-IN')}</span>
                  <span className="cart-item-discount">{discountPercent}% Off</span>
                </div>

                <div className="qty-controls-row">
                  <div className="qty-counter">
                    <button 
                      className="qty-btn" 
                      onClick={() => updateCartQty(item.product.id, item.quantity - 1)}
                    >
                      -
                    </button>
                    <input 
                      type="text" 
                      className="qty-input" 
                      value={item.quantity} 
                      readOnly 
                    />
                    <button 
                      className="qty-btn" 
                      onClick={() => updateCartQty(item.product.id, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      className="item-action-btn item-wishlist-btn"
                      onClick={() => handleMoveToWishlist(item.product.id)}
                      title="Save for Later"
                    >
                      <Heart size={16} /> Save
                    </button>
                    <button 
                      className="item-action-btn"
                      onClick={() => removeFromCart(item.product.id)}
                    >
                      <Trash2 size={16} /> Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Right side: Summary Details */}
      <div className="price-details-card">
        <div className="price-card-title">Price Details</div>
        
        {/* Urgency Trigger */}
        <div className="cart-urgent-banner">
          <span className="cart-urgent-icon">🔥</span>
          <div className="cart-urgent-text">
            <span className="cart-urgent-bold">High Demand!</span> Items in your cart are not reserved. Checkout now to avoid stockouts.
          </div>
        </div>

        {currentUser && userCoins > 0 && (
          <div className="coins-redeem-banner">
            <div className="cart-coins-details">
              <Coins size={24} color="#f59e0b" />
              <div className="cart-coins-text-group">
                <div className="cart-coins-title">Redeem Coins</div>
                <div className="cart-coins-subtitle">Apply max {maxCoinsToRedeem} coins (Save ₹{maxCoinsToRedeem})</div>
              </div>
            </div>
            <input 
              type="checkbox" 
              checked={useCoinsDiscount}
              onChange={() => setUseCoinsDiscount(!useCoinsDiscount)}
              className="coins-checkbox" 
            />
          </div>
        )}

        <div className="cart-price-summary-list">
          <div className="price-row-item">
            <span>Price ({cart.length} items)</span>
            <span>₹{originalItemsPrice.toLocaleString('en-IN')}</span>
          </div>
          
          {discountValue > 0 && (
            <div className="price-row-item">
              <span>Discount</span>
              <span className="cart-discount-value">- ₹{discountValue.toLocaleString('en-IN')}</span>
            </div>
          )}

          {coinsDiscount > 0 && (
            <div className="price-row-item">
              <span>Coins Redeemed</span>
              <span className="cart-coins-value">- ₹{coinsDiscount.toLocaleString('en-IN')}</span>
            </div>
          )}

          <div className="price-row-item">
            <span>Delivery Charges</span>
            <span>{deliveryCharge > 0 ? `₹${deliveryCharge}` : <span className="cart-delivery-free">FREE</span>}</span>
          </div>
        </div>

        <div className="price-total-row">
          <span>Total Amount</span>
          <span>₹{finalAmount.toLocaleString('en-IN')}</span>
        </div>

        {discountValue + coinsDiscount > 0 && (
          <div className="price-savings-notice">
            You will save ₹{(discountValue + coinsDiscount).toLocaleString('en-IN')} on this order
          </div>
        )}

        {/* Desktop Checkout Button */}
        <button 
          className="btn btn-accent btn-lg cart-checkout-btn-desktop" 
          onClick={() => onCheckout(useCoinsDiscount)}
        >
          // eslint-disable-next-line
          <Lock size={18} /> PLACE ORDER
        </button>

        {/* Trust Badges */}
        <div className="cart-safe-footer">
          <ShieldCheck size={14} color="#388e3c" className="cart-safe-icon" />
          <span>Safe and Secure Payments. 100% Authentic products.</span>
        </div>
      </div>

      {/* Mobile Sticky Checkout Bar */}
      <div className="mobile-cart-sticky-bar">
        <div className="mobile-cart-price-info">
          <div className="mobile-cart-amount">₹{finalAmount.toLocaleString('en-IN')}</div>
          <div className="mobile-cart-saving">
            Save ₹{(discountValue + coinsDiscount).toLocaleString('en-IN')}
          </div>
        </div>
        <button 
          className="mobile-cart-checkout-btn"
          onClick={() => onCheckout(useCoinsDiscount)}
        >
          Place Order
        </button>
      </div>

    </div>
  );
};

export default CartPage;
