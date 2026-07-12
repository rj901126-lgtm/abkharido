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
  const [pincode, setPincode] = useState('560103');
  const [deliveryEstimate, setDeliveryEstimate] = useState('Delivery by Tomorrow, Monday | Free Express Shipping');

  const handlePincodeCheck = () => {
    const pinRegex = /^[1-9][0-9]{5}$/;
    if (!pinRegex.test(pincode)) {
      showToast('Please enter a valid 6-digit Indian PIN code.', 'error');
      setDeliveryEstimate('Invalid PIN code. Please recheck.');
      return;
    }

    if (pincode.startsWith('560')) {
      showToast('Express delivery available at Bengaluru hub!', 'success');
      setDeliveryEstimate('Delivery by Tomorrow, Monday | Free Express Shipping');
    } else {
      showToast('Standard shipping available at your location!', 'success');
      setDeliveryEstimate('Delivery in 3-5 days | Free Standard Shipping');
    }
  };

  // Find product in list
  const product = products.find(p => p.id === productId);

  const [activeImage, setActiveImage] = useState(product ? product.image : '');

  React.useEffect(() => {
    if (product) {
      setActiveImage(product.image);
    }
  }, [productId, product]);

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
      ? `aff=${currentUser.creatorCode || 'AFF-TEMP'}` 
      : `ref=${currentUser.referralCode || 'REF-TEMP'}`;
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
            <img src={activeImage || product.image} alt={product.name} />
          </div>

          {/* Multiple preview thumbnails (Flipkart Carousel style) */}
          {product.images && product.images.length > 1 && (
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', margin: '4px 0 12px 0', flexWrap: 'wrap' }}>
              {product.images.map((imgUrl, index) => (
                <img
                  key={index}
                  src={imgUrl}
                  alt={`Preview ${index}`}
                  onClick={() => setActiveImage(imgUrl)}
                  style={{
                    width: '52px',
                    height: '52px',
                    objectFit: 'contain',
                    border: activeImage === imgUrl ? '2px solid var(--primary-color)' : '1px solid #e0e0e0',
                    borderRadius: '4px',
                    padding: '2px',
                    cursor: 'pointer',
                    backgroundColor: 'white',
                    transition: 'all 0.1s'
                  }}
                />
              ))}
            </div>
          )}

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
              onClick={() => {
                addToCart(product, 1);
                onBuyNow(product);
              }}
            >
              <Zap size={18} /> BUY NOW
            </button>
          </div>
        </div>

        {/* Right Column: Details, Specifications and Affiliate Link */}
        <div className="details-info-column">
          <div>
            <h1 className="product-title-text" style={{ fontSize: '20px', fontWeight: 'normal', color: '#212121' }}>{product.name}</h1>
          </div>

          <div className="product-ratings-row" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="rating-tag" style={{ fontSize: '12px', padding: '2px 6px', borderRadius: '3px' }}>
              {product.rating} <Star size={10} fill="white" />
            </span>
            <span style={{ color: '#878787', fontSize: '13px', fontWeight: '600' }}>{product.reviewsCount.toLocaleString()} Ratings & Reviews</span>
            
            {/* Proprietary A-Assured Badge Graphic */}
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              marginLeft: '8px', 
              height: '20px', 
              background: 'linear-gradient(135deg, #1e3a8a 0%, #2874f0 100%)', 
              color: 'white', 
              borderRadius: '2px', 
              padding: '0 6px', 
              fontSize: '9px', 
              fontWeight: '900', 
              fontStyle: 'italic', 
              letterSpacing: '0.2px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
            }}>
              A-Assured <span style={{ color: '#ffe500', marginLeft: '3px' }}>★</span>
            </div>
          </div>

          {/* Pricing Details */}
          <div className="price-box-details" style={{ backgroundColor: 'transparent', border: 'none', padding: 0 }}>
            <div className="details-price-row" style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
              <span className="details-price" style={{ fontSize: '28px', fontWeight: 'bold', color: '#212121' }}>₹{product.price.toLocaleString('en-IN')}</span>
              <span className="details-original" style={{ fontSize: '14px', color: '#878787', textDecoration: 'line-through' }}>₹{product.originalPrice.toLocaleString('en-IN')}</span>
              <span className="details-discount" style={{ fontSize: '14px', fontWeight: 'bold', color: '#388e3c' }}>{discountPercent}% off</span>
            </div>
          </div>

          {/* Flipkart-Style Available Offers */}
          <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '16px', marginTop: '4px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#212121', marginBottom: '10px' }}>Available Offers</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '13px', color: '#212121' }}>
                <span style={{ color: '#388e3c', fontSize: '14px', lineHeight: '1.2' }}>🏷️</span>
                <span><strong>Partner Link Reward:</strong> Earn up to <strong style={{ color: '#e68f00' }}>{userCoins} Coins</strong> back on referral orders. <span style={{ color: 'var(--primary-color)', fontWeight: 'bold', cursor: 'pointer' }}>T&C</span></span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '13px', color: '#212121' }}>
                <span style={{ color: '#388e3c', fontSize: '14px', lineHeight: '1.2' }}>🏷️</span>
                <span><strong>Creator Payout:</strong> Earn up to <strong style={{ color: 'var(--success)' }}>₹{creatorCash} Cash</strong> commission on affiliate link sharing.</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '13px', color: '#212121' }}>
                <span style={{ color: '#388e3c', fontSize: '14px', lineHeight: '1.2' }}>🏷️</span>
                <span><strong>SBI Card Discount:</strong> 5% Instant Cash Back on SBI Bank Credit Cards. <span style={{ color: 'var(--primary-color)', fontWeight: 'bold', cursor: 'pointer' }}>T&C</span></span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '13px', color: '#212121' }}>
                <span style={{ color: '#388e3c', fontSize: '14px', lineHeight: '1.2' }}>🏷️</span>
                <span><strong>Express Shipping:</strong> Shop for more than ₹500 and get free express home shipping.</span>
              </div>
            </div>
          </div>

          {/* Delivery Pincode Checker */}
          <div style={{ borderTop: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0', padding: '16px 0', margin: '8px 0', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', color: '#878787', fontWeight: 'bold', width: '80px' }}>Delivery</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '200px' }}>
              <div style={{ display: 'flex', border: '1px solid #dcdcdc', borderRadius: '4px', overflow: 'hidden', maxWidth: '280px', height: '36px', backgroundColor: 'white' }}>
                <input 
                  type="text" 
                  placeholder="Enter Delivery Pincode" 
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                  maxLength="6"
                  style={{ border: 'none', padding: '0 12px', fontSize: '13px', outline: 'none', width: '100%' }}
                />
                <button 
                  onClick={handlePincodeCheck}
                  style={{ background: 'none', border: 'none', color: 'var(--primary-color)', padding: '0 16px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', borderLeft: '1px solid #e0e0e0' }}
                >
                  Check
                </button>
              </div>
              <span style={{ fontSize: '12px', color: '#212121', fontWeight: '600', marginTop: '4px' }}>
                {deliveryEstimate}
              </span>
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

          {/* Ratings & Reviews section */}
          <div style={{ marginTop: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Ratings & Reviews</span>
              <span className="rating-tag" style={{ fontSize: '13px', padding: '3px 8px', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                {product.rating} <span style={{ color: 'white' }}>★</span>
              </span>
            </h3>
            
            {/* Visual Bar Chart grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', margin: '16px 0', alignItems: 'center', backgroundColor: '#fafafa', padding: '16px', borderRadius: '4px' }}>
              <div style={{ textAlign: 'center', borderRight: '1px solid #eee', paddingRight: '16px' }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#212121' }}>{product.rating}</div>
                <div style={{ fontSize: '11px', color: '#878787' }}>{product.reviewsCount} Ratings & Reviews</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  { star: 5, pct: 72, color: 'var(--success)' },
                  { star: 4, pct: 18, color: 'var(--success)' },
                  { star: 3, pct: 6, color: '#ff9f00' },
                  { star: 2, pct: 2, color: '#ff9f00' },
                  { star: 1, pct: 2, color: 'var(--error)' }
                ].map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                    <span style={{ width: '20px', fontWeight: 'bold' }}>{item.star}★</span>
                    <div style={{ flex: 1, height: '6px', backgroundColor: '#eaeaea', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${item.pct}%`, height: '100%', backgroundColor: item.color }}></div>
                    </div>
                    <span style={{ width: '30px', color: '#878787', textAlign: 'right' }}>{item.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* List of customer comments */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              {[
                { name: "Rajesh Kumar", rating: 5, comment: "Excellent build quality. Completely satisfied with the direct delivery. 100% original!" },
                { name: "Ananya Sharma", rating: 4, comment: "Very fast shipping to Bengaluru. Product works perfectly. Value for money." },
                { name: "Vikram Singh", rating: 5, comment: "Superb product. The A-Assured badge is true to its word. High quality packaging." },
              ].map((rev, idx) => (
                <div key={idx} style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="rating-tag" style={{ fontSize: '10px', padding: '1px 5px', height: '16px', display: 'inline-flex', alignItems: 'center' }}>
                      {rev.rating} ★
                    </span>
                    <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{rev.name}</strong>
                  </div>
                  <p style={{ fontSize: '13px', color: '#555', marginTop: '6px', lineHeight: '1.4' }}>{rev.comment}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Share & Earn Panel (Affiliate/Referral) */}
          <div className="share-earn-box" style={{ marginTop: '24px' }}>
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

        </div>

      </div>
    </div>
  );
};

export default ProductDetails;
