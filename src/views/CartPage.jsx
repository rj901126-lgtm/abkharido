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

  return (
    <div className="container cart-layout-grid animate-fade-in desktop-premium-cart">
      
      {/* Left side: Cart Items list */}
      <div className="cart-items-section">
        <div className="cart-card-header cart-card-header-flex" style={{ borderBottom: 'none', paddingBottom: '0' }}>
          <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '24px', fontWeight: '900', color: '#090d16' }}>
            🛍️ My VIP Shopping Bag ({cart.reduce((acc, item) => acc + item.quantity, 0)} Items)
          </span>
        </div>

        {/* 3-Tier VIP Reward Progress Meter */}
        <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', borderRadius: '24px', padding: '24px', color: 'white', margin: '16px 0 24px 0', boxShadow: '0 10px 30px rgba(30, 27, 75, 0.25)', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '24px' }}>🎁</span>
              <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '18px', fontWeight: '900', letterSpacing: '-0.2px' }}>
                {itemsPrice >= 2999 ? "🎉 All 3 VIP Tiers & Free Mystery Gift Bag Unlocked!" : itemsPrice >= 1499 ? "⚡ Tier 2 Unlocked! Add ₹" + (2999 - itemsPrice) + " more for a Free Mystery Designer Gift!" : itemsPrice >= 500 ? "🚀 Free Priority Shipping Unlocked! Add ₹" + (1499 - itemsPrice) + " more for +100 Bonus Coins!" : "✨ Add ₹" + (500 - itemsPrice) + " more to unlock FREE Priority Express Shipping!"}
              </span>
            </div>
            <span style={{ background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(10px)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '800', color: '#fde047', border: '1px solid rgba(255, 255, 255, 0.25)' }}>
              💎 VIP CLUB STATUS
            </span>
          </div>

          <div style={{ height: '12px', width: '100%', background: 'rgba(255, 255, 255, 0.15)', borderRadius: '10px', overflow: 'hidden', position: 'relative', margin: '16px 0' }}>
            <div 
              style={{ 
                height: '100%', 
                width: `${Math.min((itemsPrice / 2999) * 100, 100)}%`, 
                background: 'linear-gradient(90deg, #38bdf8 0%, #a855f7 50%, #f59e0b 100%)', 
                borderRadius: '10px',
                transition: 'width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                boxShadow: '0 0 12px rgba(245, 158, 11, 0.8)'
              }} 
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '800' }}>
            <span style={{ color: itemsPrice >= 500 ? '#4ade80' : '#cbd5e1', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {itemsPrice >= 500 ? '✅' : '🔒'} ₹500 (Free Shipping)
            </span>
            <span style={{ color: itemsPrice >= 1499 ? '#4ade80' : '#cbd5e1', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {itemsPrice >= 1499 ? '✅' : '🔒'} ₹1,499 (+100 Coins)
            </span>
            <span style={{ color: itemsPrice >= 2999 ? '#4ade80' : '#cbd5e1', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {itemsPrice >= 2999 ? '✅' : '🔒'} ₹2,999 (Mystery Gift)
            </span>
          </div>
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
      <div className="price-details-card" style={{ background: 'linear-gradient(135deg, #090d16 0%, #1e1b4b 60%, #312e81 100%)', color: '#ffffff', borderRadius: '24px', padding: '24px', boxShadow: '0 12px 40px rgba(30, 27, 75, 0.3)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="price-card-title" style={{ color: '#ffffff', fontSize: '20px', fontWeight: '900', fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.3px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px', marginBottom: '16px' }}>Price Summary</div>
        
        {/* Urgency Trigger */}
        <div className="cart-urgent-banner" style={{ background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '12px', padding: '12px' }}>
          <span className="cart-urgent-icon">🔥</span>
          <div className="cart-urgent-text" style={{ color: '#e2e8f0' }}>
            <span className="cart-urgent-bold" style={{ color: '#ffffff' }}>High Demand!</span> Checkout now to avoid stockouts.
          </div>
        </div>

        {currentUser && userCoins > 0 && (
          <div style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(234, 88, 12, 0.15))', border: '1px solid rgba(253, 230, 138, 0.2)', borderRadius: '16px', padding: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)', color: 'white', padding: '10px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(245, 158, 11, 0.3)' }}>
                <Coins size={24} />
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#fde68a', marginBottom: '2px' }}>AB Coin Wallet</div>
                <div style={{ fontSize: '13px', color: '#fcd34d', fontWeight: '500' }}>Save ₹{maxCoinsToRedeem.toLocaleString('en-IN')} instantly</div>
              </div>
            </div>
            
            {/* Custom Premium Toggle Switch */}
            <div 
              onClick={() => setUseCoinsDiscount(!useCoinsDiscount)}
              style={{
                width: '50px',
                height: '28px',
                borderRadius: '50px',
                background: useCoinsDiscount ? 'linear-gradient(135deg, #f59e0b, #ea580c)' : 'rgba(255,255,255,0.2)',
                position: 'relative',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
            >
              <div style={{
                position: 'absolute',
                top: '2px',
                left: useCoinsDiscount ? '24px' : '2px',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'white',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
              }} />
            </div>
          </div>
        )}

        <div className="cart-price-summary-list" style={{ color: '#e2e8f0', fontSize: '15px' }}>
          <div className="price-row-item" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span>Price ({cart.length} items)</span>
            <span style={{ fontWeight: '600', color: '#ffffff' }}>₹{originalItemsPrice.toLocaleString('en-IN')}</span>
          </div>
          
          {discountValue > 0 && (
            <div className="price-row-item" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span>Discount</span>
              <span className="cart-discount-value" style={{ color: '#34d399', fontWeight: '700' }}>- ₹{discountValue.toLocaleString('en-IN')}</span>
            </div>
          )}

          {coinsDiscount > 0 && (
            <div className="price-row-item" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fcd34d', fontWeight: '600' }}><Coins size={14} /> AB Coins</span>
              <span style={{ color: '#fcd34d', fontWeight: '700' }}>- ₹{coinsDiscount.toLocaleString('en-IN')}</span>
            </div>
          )}

          <div className="price-row-item" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px dashed rgba(255,255,255,0.15)', paddingBottom: '16px' }}>
            <span>Delivery Charges</span>
            <span>{deliveryCharge > 0 ? `₹${deliveryCharge}` : <span className="cart-delivery-free" style={{ color: '#34d399', fontWeight: '800' }}>FREE</span>}</span>
          </div>
        </div>

        <div className="price-total-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: '900', color: '#ffffff', marginBottom: '16px', fontFamily: "'Outfit', sans-serif" }}>
          <span>Total Amount</span>
          <span>₹{finalAmount.toLocaleString('en-IN')}</span>
        </div>

        {discountValue + coinsDiscount > 0 && (
          <div className="price-savings-notice" style={{ color: '#34d399', fontSize: '14px', fontWeight: '800', marginBottom: '24px', background: 'rgba(52, 211, 153, 0.1)', padding: '10px 14px', borderRadius: '10px' }}>
            You will save ₹{(discountValue + coinsDiscount).toLocaleString('en-IN')} on this order
          </div>
        )}

        {/* Desktop Checkout Button */}
        <style>{`
          .premium-checkout-btn {
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            box-shadow: 0 8px 25px rgba(79, 70, 229, 0.4);
            color: #ffffff;
            border: none;
            width: 100%;
            padding: 16px;
            border-radius: 16px;
            font-size: 16px;
            font-weight: 900;
            cursor: pointer;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 8px;
            font-family: 'Outfit', sans-serif;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            animation: pulse-glow 2s infinite;
          }
          .premium-checkout-btn:hover {
            transform: translateY(-2px);
            filter: brightness(1.1);
          }
        `}</style>
        <button 
          className="premium-checkout-btn cart-checkout-btn-desktop" 
          onClick={() => onCheckout(useCoinsDiscount)}
        >
          {/* eslint-disable-next-line */}
          <Lock size={18} /> PLACE ORDER
        </button>

        {/* Trust Badges */}
        <div className="cart-safe-footer" style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>
          <ShieldCheck size={16} color="#34d399" className="cart-safe-icon" />
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
