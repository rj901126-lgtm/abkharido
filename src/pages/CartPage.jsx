import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Trash2, ShoppingBag, Award, Coins, HelpCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import '../assets/styles/cart.css';

const CartPage = ({ onNavigate, onCheckout }) => {
  const { cart, updateCartQty, removeFromCart, activeReferral, currentUser } = useApp();
  const [useCoinsDiscount, setUseCoinsDiscount] = useState(false);

  if (cart.length === 0) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <div style={{ display: 'inline-flex', padding: '16px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', marginBottom: '16px' }}>
          <ShoppingBag size={48} color="var(--primary-color)" />
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>Your cart is empty!</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '14px' }}>
          Explore our wide range of products directly in stock and fill it up!
        </p>
        <button 
          className="btn btn-primary" 
          style={{ marginTop: '20px' }} 
          onClick={() => onNavigate('home')}
        >
          Shop Now
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
      const rate = activeReferral.type === 'aff' ? item.product.influencerCommissionRate : item.product.userCommissionRate;
      rewardSum += item.product.price * item.quantity * rate;
    });

    if (activeReferral.type === 'aff') {
      return (
        <span>
          Influencer <strong>{activeReferral.referrerId}</strong> will receive{' '}
          <strong style={{ color: 'var(--success)' }}>₹{Math.round(rewardSum * 100) / 100}</strong> cash commission.
        </span>
      );
    } else {
      return (
        <span>
          Referrer <strong>{activeReferral.referrerId}</strong> will receive{' '}
          <strong style={{ color: '#e68f00' }}>{Math.round(rewardSum)}</strong> AbKharido Coins.
        </span>
      );
    }
  };

  return (
    <div className="container cart-layout-grid animate-fade-in">
      
      {/* Left side: Cart Items list */}
      <div className="cart-items-section">
        <div className="cart-card-header">
          My Cart ({cart.reduce((acc, item) => acc + item.quantity, 0)} Items)
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
          const discountPercent = Math.round(
            ((item.product.originalPrice - item.product.price) / item.product.originalPrice) * 100
          );
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
                  <span className="cart-item-price">₹{item.product.price.toLocaleString('en-IN')}</span>
                  <span className="cart-item-original">₹{item.product.originalPrice.toLocaleString('en-IN')}</span>
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

                  <button 
                    className="item-action-btn"
                    onClick={() => removeFromCart(item.product.id)}
                  >
                    <Trash2 size={16} /> Remove
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Right side: Summary Details */}
      <div className="price-details-card">
        <div className="price-card-title">Price Details</div>

        {/* AbKharido Loyalty Coins Redemption */}
        {currentUser.walletCoins > 0 && (
          <div className="coins-redeem-banner">
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Coins size={18} color="#e68f00" />
              <div style={{ fontSize: '12px' }}>
                <div style={{ fontWeight: 'bold', color: '#854d0e' }}>Redeem Coins</div>
                <div style={{ color: '#854d0e' }}>Apply max {maxCoinsToRedeem} coins (Save ₹{maxCoinsToRedeem})</div>
              </div>
            </div>
            <input 
              type="checkbox" 
              className="coins-checkbox" 
              checked={useCoinsDiscount}
              onChange={(e) => setUseCoinsDiscount(e.target.checked)}
            />
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderBottom: '1px solid var(--border-light)', paddingBottom: '16px' }}>
          <div className="price-row-item">
            <span>Price ({cart.length} items)</span>
            <span>₹{originalItemsPrice.toLocaleString('en-IN')}</span>
          </div>
          <div className="price-row-item">
            <span>Product Discount</span>
            <span style={{ color: 'var(--success)' }}>- ₹{discountValue.toLocaleString('en-IN')}</span>
          </div>
          
          {useCoinsDiscount && (
            <div className="price-row-item">
              <span>Redeemed Coins Discount</span>
              <span style={{ color: '#e68f00' }}>- ₹{coinsDiscount.toLocaleString('en-IN')}</span>
            </div>
          )}

          <div className="price-row-item">
            <span>Delivery Charges</span>
            <span>{deliveryCharge > 0 ? `₹${deliveryCharge}` : <span style={{ color: 'var(--success)' }}>FREE</span>}</span>
          </div>
        </div>

        <div className="price-total-row">
          <span>Amount Payable</span>
          <span>₹{finalAmount.toLocaleString('en-IN')}</span>
        </div>

        {discountValue + coinsDiscount > 0 && (
          <div className="price-savings-notice">
            You will save ₹{(discountValue + coinsDiscount).toLocaleString('en-IN')} on this order!
          </div>
        )}

        <button 
          className="btn btn-accent btn-lg" 
          style={{ width: '100%', marginTop: '8px', display: 'flex', justifyContent: 'center', gap: '8px' }}
          onClick={() => onCheckout(useCoinsDiscount)}
        >
          PLACE ORDER <ArrowRight size={16} />
        </button>

        {/* Flipkart Style Trust Badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11px', color: '#7f7f7f', marginTop: '16px', borderTop: '1px solid #f0f0f0', paddingTop: '12px' }}>
          <ShieldCheck size={14} color="#388e3c" style={{ flexShrink: 0 }} />
          <span>Safe and Secure Payments. 100% Authentic Products.</span>
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
