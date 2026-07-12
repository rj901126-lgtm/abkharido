import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Star, 
  ShoppingCart, 
  Zap, 
  Award, 
  Share2, 
  Copy, 
  Send,
  ShieldAlert,
  ShieldCheck,
  Check
} from 'lucide-react';
import '../assets/styles/product.css';

const ProductDetails = ({ productId, onNavigate, onBuyNow }) => {
  const { addToCart, currentUser, showToast, products } = useApp();
  const [copied, setCopied] = useState(false);

  // Find product in list
  const product = products.find(p => p.id === productId);

  if (!product) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <h2>Product Not Found</h2>
        <p>The product you are looking for does not exist in our catalog.</p>
        <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => onNavigate('home')}>
          Back to Home
        </button>
      </div>
    );
  }

  const discountPercent = Math.round(
    ((product.originalPrice - product.price) / product.originalPrice) * 100
  );

  const userCoins = Math.round(product.price * product.userCommissionRate);
  const creatorCash = Math.round(product.price * product.influencerCommissionRate);

  // Generate the unique referral tracking link
  const getReferralLink = () => {
    if (!currentUser) return '';
    const origin = window.location.origin;
    const trackingParam = currentUser.isInfluencer 
      ? `aff=${currentUser.influencerId}` 
      : `ref=${currentUser.username}`;
    return `${origin}/?prod=${product.id}&${trackingParam}`;
  };

  const handleCopyLink = () => {
    const link = getReferralLink();
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      showToast('Affiliate tracking link copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      showToast('Failed to copy link.', 'error');
    });
  };

  const handleShareWhatsApp = () => {
    const text = `Hey! Check out this awesome ${product.name} on AbKharido: ${getReferralLink()}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleShareTwitter = () => {
    const text = `Check out this product on AbKharido.com: ${product.name}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(getReferralLink())}`;
    window.open(url, '_blank');
  };

  return (
    <div className="container animate-fade-in">
      <div className="details-page-grid">
        
        {/* Left Column: Image and Purchase Actions */}
        <div className="image-showcase-column">
          <div className="main-image-frame">
            <img src={product.image} alt={product.name} />
          </div>

          <div className="action-buttons-row">
            <button 
              className="btn btn-secondary btn-lg" 
              style={{ display: 'flex', gap: '8px', fontSize: '15px' }}
              onClick={() => addToCart(product)}
            >
              <ShoppingCart size={18} /> ADD TO CART
            </button>
            <button 
              className="btn btn-accent btn-lg" 
              style={{ display: 'flex', gap: '8px', fontSize: '15px' }}
              onClick={() => onBuyNow(product)}
            >
              <Zap size={18} /> BUY NOW
            </button>
          </div>
        </div>

        {/* Right Column: Details, Specifications and Affiliate Link */}
        <div className="details-info-column">
          <div>
            <h1 className="product-title-text">{product.name}</h1>
          </div>

          <div className="product-ratings-row">
            <span className="rating-tag" style={{ fontSize: '13px' }}>
              {product.rating} <Star size={11} fill="white" />
            </span>
            <span>{product.reviewsCount.toLocaleString()} Ratings & Reviews</span>
            <span style={{ color: 'var(--success)', fontWeight: '600' }}>Direct Stock</span>
          </div>

          {/* Pricing Details */}
          <div className="price-box-details">
            <div className="details-price-row">
              <span className="details-price">₹{product.price.toLocaleString('en-IN')}</span>
              <span className="details-original">₹{product.originalPrice.toLocaleString('en-IN')}</span>
              <span className="details-discount">{discountPercent}% off</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Inclusive of all taxes + Free Delivery on orders above ₹500
            </div>
          </div>

          {/* AbKharido Direct Sales Guarantee */}
          <div style={{ display: 'flex', gap: '10px', backgroundColor: '#fafafa', border: '1px solid #e0e0e0', padding: '12px 16px', borderRadius: '4px' }}>
            <ShieldCheck size={28} color="var(--primary-color)" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '13px' }}>
              <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>AbKharido Fulfill Direct Guarantee</div>
              <div style={{ color: 'var(--text-secondary)' }}>
                This item is owned, warehoused, and directly shipped by AbKharido. We do not host third-party sellers. 
                Guaranteed genuine brand, secure transit packing, and unified support.
              </div>
            </div>
          </div>

          {/* Share & Earn Panel (Affiliate/Referral) */}
          <div className="share-earn-box">
            <div className="share-earn-header">
              <Award size={20} />
              <span>Share & Earn Program (Active)</span>
            </div>
            
            <p className="share-earn-desc">
              Promote this product to friends, followers, or family. If they buy using your custom tracking link, 
              you get credited immediately!
            </p>

            {/* Commissions Rates info */}
            <div style={{ display: 'flex', gap: '16px', borderBottom: '1px dashed #bbf7d0', paddingBottom: '12px', marginBottom: '4px' }}>
              <div style={{ flex: 1, fontSize: '13px' }}>
                <div style={{ color: '#166534', fontWeight: '500' }}>Regular User Reward</div>
                <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#e68f00' }}>{userCoins} AbKharido Coins</div>
                <div style={{ fontSize: '11px', color: '#15803d' }}>({Math.round(product.userCommissionRate * 100 * 10) / 10}% rate, credited on checkout)</div>
              </div>
              <div style={{ flex: 1, fontSize: '13px', borderLeft: '1px solid #bbf7d0', paddingLeft: '16px' }}>
                <div style={{ color: '#166534', fontWeight: '500' }}>Verified Creator Commission</div>
                <div style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--success)' }}>₹{creatorCash} Cash Payout</div>
                <div style={{ fontSize: '11px', color: '#15803d' }}>({Math.round(product.influencerCommissionRate * 100 * 10) / 10}% rate, withdrawable)</div>
              </div>
            </div>

            {/* Custom Link Copy Section */}
            {currentUser ? (
               <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                 <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#166534' }}>
                   Your Unique Tracking Link ({currentUser.isInfluencer ? 'Creator Mode' : 'User Mode'}):
                 </label>
                 <div className="share-link-generator">
                   <input 
                     type="text" 
                     className="share-link-input" 
                     readOnly 
                     value={getReferralLink()} 
                     onClick={(e) => e.target.select()}
                   />
                   <button 
                     className="btn btn-primary" 
                     style={{ backgroundColor: '#15803d', display: 'flex', gap: '4px', padding: '0 16px' }}
                     onClick={handleCopyLink}
                   >
                     {copied ? <Check size={16} /> : <Copy size={16} />}
                     <span>{copied ? 'Copied' : 'Copy'}</span>
                   </button>
                 </div>
               </div>
             ) : (
               <div style={{ textAlign: 'center', padding: '12px 0', borderTop: '1px dashed #bbf7d0', marginTop: '6px' }}>
                 <p style={{ fontSize: '13px', color: '#166534', fontWeight: '500', marginBottom: '8px' }}>
                   Want to earn rewards? Log in to get your tracking link!
                 </p>
                 <button 
                   className="btn btn-primary animate-fade-in" 
                   style={{ backgroundColor: '#15803d', height: '36px', fontSize: '13px', padding: '0 20px', fontWeight: '600' }}
                   onClick={() => onNavigate('login')}
                 >
                   Log In & Start Earning
                 </button>
               </div>
             )}

            {/* Social Sharing */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
              <span style={{ fontSize: '12px', color: '#166534', fontWeight: '600' }}>Quick Share:</span>
              <div className="social-share-row">
                <button className="social-share-btn social-wa" onClick={handleShareWhatsApp}>
                  <Send size={12} fill="white" /> WhatsApp
                </button>
                <button className="social-share-btn social-tw" onClick={handleShareTwitter}>
                  <Share2 size={12} /> Twitter / X
                </button>
              </div>
            </div>
          </div>

          {/* Product Description */}
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>
              Product Description
            </h3>
            <p style={{ fontSize: '14px', color: '#444444', marginTop: '8px', lineHeight: '1.6' }}>
              {product.description}
            </p>
          </div>

          {/* Technical Specifications */}
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>
              Specifications
            </h3>
            <table className="specs-table">
              <tbody>
                {product.specifications.map((spec, index) => (
                  <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fafafa' : 'transparent' }}>
                    <td className="specs-key">{spec.key}</td>
                    <td className="specs-value">{spec.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

      </div>
    </div>
  );
};

export default ProductDetails;
