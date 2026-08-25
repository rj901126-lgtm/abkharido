import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
// eslint-disable-next-line
import { Trash2, ShoppingBag, Award, Coins, HelpCircle, ArrowRight, ShieldCheck, Lock, Heart } from 'lucide-react';
import '../assets/styles/cart.css';

const CartPage = ({ onNavigate, onCheckout }) => {
  const { cart, updateCartQty, removeFromCart, activeReferral, currentUser, wishlist, toggleWishlist, showToast } = useApp();
  const [useCoinsDiscount, setUseCoinsDiscount] = useState(false);

  const handleMoveToWishlist = (productId) => {
    if (!wishlist.includes(productId)) {
      toggleWishlist(productId);
    } else {
      showToast('Item saved for later in your wishlist!', 'info');
    }
    removeFromCart(productId);
  };

  if (cart.length === 0) {
    return (
      <div style={{
        minHeight: 'calc(100vh - 180px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 20px 120px 20px',
        background: 'linear-gradient(180deg, #f8faff 0%, #ffffff 100%)',
      }}>
        {/* Animated Illustration */}
        <div style={{
          width: '130px',
          height: '130px',
          background: 'linear-gradient(135deg, #1e1b4b 0%, #4f46e5 60%, #7c3aed 100%)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '28px',
          boxShadow: '0 20px 60px rgba(79, 70, 229, 0.35)',
          animation: 'cartBounce 3s ease-in-out infinite',
          position: 'relative',
        }}>
          <style>{`
            @keyframes cartBounce {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-8px); }
            }
            @keyframes shimmerGlow {
              0%, 100% { opacity: 0.6; }
              50% { opacity: 1; }
            }
          `}</style>
          <ShoppingBag size={60} color="#ffffff" strokeWidth={1.5} />
          <div style={{
            position: 'absolute', top: '-4px', right: '-4px',
            width: '28px', height: '28px',
            background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', fontWeight: '900', color: 'white',
            border: '3px solid white', boxShadow: '0 4px 12px rgba(245,158,11,0.5)',
            animation: 'shimmerGlow 2s ease-in-out infinite',
          }}>0</div>
        </div>

        <h2 style={{
          fontSize: '26px', fontWeight: '900',
          fontFamily: "'Outfit', sans-serif",
          color: '#090d16', marginBottom: '10px',
          letterSpacing: '-0.5px',
        }}>Your cart is empty</h2>

        <p style={{
          fontSize: '14px', color: '#64748b',
          textAlign: 'center', maxWidth: '280px',
          lineHeight: '1.6', marginBottom: '32px',
        }}>
          Discover thousands of VIP deals across Electronics, Fashion, and more — handpicked for you! 🎁
        </p>

        {/* CTA Buttons */}
        <button
          onClick={() => onNavigate('home')}
          style={{
            width: '100%', maxWidth: '320px',
            padding: '16px 24px',
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            color: 'white', border: 'none', borderRadius: '16px',
            fontSize: '15px', fontWeight: '800',
            fontFamily: "'Outfit', sans-serif",
            letterSpacing: '0.3px',
            boxShadow: '0 8px 24px rgba(79, 70, 229, 0.4)',
            cursor: 'pointer', marginBottom: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            transition: 'all 0.2s ease',
          }}
        >
          🛍️ Start Shopping Now
        </button>

        <button
          onClick={() => onNavigate('categories')}
          style={{
            width: '100%', maxWidth: '320px',
            padding: '14px 24px',
            background: 'transparent',
            color: '#4f46e5', border: '2px solid #e0e7ff', borderRadius: '16px',
            fontSize: '14px', fontWeight: '700',
            cursor: 'pointer', marginBottom: '32px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}
        >
          💎 Browse VIP Vault Deals
        </button>

        {/* Trust Mini-Badges */}
        <div style={{
          display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center',
          padding: '16px 20px',
          background: '#f8fafc', borderRadius: '16px',
          border: '1px solid #e2e8f0', maxWidth: '320px', width: '100%',
        }}>
          {[
            { icon: '🛡️', text: 'Cashfree Escrow Protected' },
            { icon: '⚡', text: 'Express Delivery' },
            { icon: '↩️', text: 'Easy 7-Day Returns' },
          ].map((badge, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              fontSize: '11px', fontWeight: '600', color: '#475569',
            }}>
              <span>{badge.icon}</span>
              <span>{badge.text}</span>
            </div>
          ))}
        </div>
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

  const totalItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="container cart-layout-grid animate-fade-in desktop-premium-cart">
      
      {/* Left side: Cart Items list */}
      <div className="cart-items-section">
        <div className="cart-header-title-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg, #1e1b4b 0%, #4f46e5 100%)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)' }}>
              <ShoppingBag size={20} color="#ffffff" />
            </div>
            <div>
              <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '20px', fontWeight: '900', color: '#090d16', margin: 0, lineHeight: 1.2 }}>
                Shopping Bag
              </h1>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'} in your cart
              </span>
            </div>
          </div>

          <button 
            onClick={() => onNavigate('categories')}
            style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: '12.5px', fontWeight: '800', cursor: 'pointer' }}
          >
            + Add More Items
          </button>
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
        {cart.map((item, idx) => {
          const prod = item?.product || {};
          const discountPercent = (prod.originalPrice || 0) > 0
            ? Math.round((((prod.originalPrice || 0) - (prod.price || 0)) / prod.originalPrice) * 100)
            : 0;
          return (
            <div key={prod.id || prod._id || idx} className="cart-item-card">
              <div className="cart-item-image">
                <img src={prod.image || ''} alt={prod.name || 'Product'} />
              </div>

              <div className="cart-item-details">
                <h3 className="cart-item-title">{prod.name || 'Product'}</h3>
                
                {(prod.selectedColor || prod.selectedVariant) && (
                  <span className="cart-item-category">
                    {prod.selectedColor && `Color: ${prod.selectedColor}`}
                    {prod.selectedColor && prod.selectedVariant && ' • '}
                    {prod.selectedVariant && `Variant: ${prod.selectedVariant}`}
                  </span>
                )}
                
                <div className="cart-item-prices">
                  <span className="cart-item-price">₹{(prod.price || 0).toLocaleString('en-IN')}</span>
                  {(prod.originalPrice || 0) > (prod.price || 0) && (
                    <span className="cart-item-original">₹{(prod.originalPrice || 0).toLocaleString('en-IN')}</span>
                  )}
                  {discountPercent > 0 && (
                    <span className="cart-item-discount">{discountPercent}% OFF</span>
                  )}
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
                      <Heart size={14} /> Save
                    </button>
                    <button 
                      className="item-action-btn"
                      onClick={() => removeFromCart(item.product.id)}
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Right side: Clean White Summary Details */}
      <div className="price-details-card">
        <div className="price-card-title">
          <span>🧾 Price Summary</span>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>({totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'})</span>
        </div>

        {/* AB Coin Wallet Redemption */}
        {currentUser && userCoins > 0 && (
          <div className="cart-coin-box">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)', color: 'white', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(245, 158, 11, 0.3)', flexShrink: 0 }}>
                <Coins size={18} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#92400e', marginBottom: '1px' }}>AB Coin Wallet</div>
                <div style={{ fontSize: '11.5px', color: '#b45309', fontWeight: '600' }}>Use {maxCoinsToRedeem} coins to save ₹{maxCoinsToRedeem.toLocaleString('en-IN')}</div>
              </div>
            </div>
            
            {/* Premium Toggle Switch */}
            <div 
              onClick={() => setUseCoinsDiscount(!useCoinsDiscount)}
              style={{
                width: '46px',
                height: '26px',
                borderRadius: '50px',
                background: useCoinsDiscount ? 'linear-gradient(135deg, #f59e0b, #ea580c)' : '#cbd5e1',
                position: 'relative',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                flexShrink: 0
              }}
            >
              <div style={{
                position: 'absolute',
                top: '2px',
                left: useCoinsDiscount ? '22px' : '2px',
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: 'white',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
              }} />
            </div>
          </div>
        )}

        {/* Breakdown List */}
        <div className="cart-price-summary-list">
          <div className="price-row-item">
            <span>Total MRP</span>
            <span style={{ fontWeight: '700', color: '#0f172a' }}>₹{originalItemsPrice.toLocaleString('en-IN')}</span>
          </div>
          
          {discountValue > 0 && (
            <div className="price-row-item">
              <span>Special Discount</span>
              <span className="cart-discount-value">- ₹{discountValue.toLocaleString('en-IN')}</span>
            </div>
          )}

          {coinsDiscount > 0 && (
            <div className="price-row-item">
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#b45309', fontWeight: '700' }}><Coins size={13} /> AB Coins</span>
              <span style={{ color: '#b45309', fontWeight: '800' }}>- ₹{coinsDiscount.toLocaleString('en-IN')}</span>
            </div>
          )}

          <div className="price-row-item">
            <span>Delivery Fee</span>
            <span>{deliveryCharge > 0 ? `₹${deliveryCharge}` : <span className="cart-delivery-free">FREE</span>}</span>
          </div>
        </div>

        {/* Total Amount Row */}
        <div className="price-total-row">
          <span>Total Amount</span>
          <span style={{ color: '#0f172a' }}>₹{finalAmount.toLocaleString('en-IN')}</span>
        </div>

        {/* Savings Badge */}
        {discountValue + coinsDiscount > 0 && (
          <div className="price-savings-notice">
            🎉 You will save ₹{(discountValue + coinsDiscount).toLocaleString('en-IN')} on this order
          </div>
        )}

        {/* Desktop Checkout Button (Hidden on Mobile) */}
        <button 
          className="premium-checkout-btn cart-checkout-btn-desktop" 
          onClick={() => onCheckout(useCoinsDiscount)}
        >
          <Lock size={16} /> Proceed to Checkout
        </button>

        {/* Trust Badges */}
        <div className="cart-safe-footer">
          <ShieldCheck size={16} color="#059669" className="cart-safe-icon" />
          <span>100% Secure Checkout • Cashfree Protected</span>
        </div>
      </div>

      {/* Mobile Sticky Checkout Bar */}
      <div className="mobile-cart-sticky-bar">
        <div className="mobile-cart-price-info">
          <div className="mobile-cart-amount">₹{finalAmount.toLocaleString('en-IN')}</div>
          <div className="mobile-cart-meta">
            🚚 Free Express Delivery
          </div>
        </div>
        <button 
          className="mobile-cart-checkout-btn"
          onClick={() => onCheckout(useCoinsDiscount)}
        >
          Place Order →
        </button>
      </div>

    </div>
  );
};

export default CartPage;
