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
  Check,
  ChevronLeft,
  ChevronRight,
  Heart
} from 'lucide-react';
import '../assets/styles/product.css';

const ProductDetails = ({ productId, onNavigate, onBuyNow }) => {
  const { addToCart, currentUser, showToast, products, orders } = useApp();
  const [copied, setCopied] = useState(false);
  const [pincode, setPincode] = useState('560103');
  const [deliveryEstimate, setDeliveryEstimate] = useState('Delivery by Tomorrow, Monday | Free Express Shipping');

  // --- Dynamic Customer Reviews hooks ---
  const [reviewsList, setReviewsList] = useState(() => {
    const saved = localStorage.getItem(`product_${productId}_reviews`);
    if (saved) return JSON.parse(saved);
    return [
      { name: "Rajesh Kumar", username: "rajesh_k", rating: 5, comment: "Excellent build quality. Completely satisfied with the direct delivery. 100% original!", date: "2026-07-10", photos: [] },
      { name: "Ananya Sharma", username: "ananya_s", rating: 4, comment: "Very fast shipping to Bengaluru. Product works perfectly. Value for money.", date: "2026-07-09", photos: [] },
      { name: "Vikram Singh", username: "vikram_s", rating: 5, comment: "Superb product. The A-Assured badge is true to its word. High quality packaging.", date: "2026-07-08", photos: [] }
    ];
  });

  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [selectedPhotos, setSelectedPhotos] = useState([]); // Base64 strings
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  React.useEffect(() => {
    localStorage.setItem(`product_${productId}_reviews`, JSON.stringify(reviewsList));
  }, [reviewsList, productId]);

  const wordCount = newComment.trim() === '' ? 0 : newComment.trim().split(/\s+/).length;

  // 1. Verified Purchaser Check: Has ordered this product and order status is not CANCELLED
  const hasPurchased = orders ? orders.some(order => 
    order.status !== 'CANCELLED' && 
    order.items?.some(item => item.product.id === productId)
  ) : false;

  // 2. Review count check: Max 2 reviews per product per user
  const userReviewsCount = currentUser 
    ? reviewsList.filter(r => r.username === currentUser.username).length 
    : 0;

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    if (selectedPhotos.length + files.length > 5) {
      showToast('You can upload a maximum of 5 photos per review.', 'error');
      return;
    }

    const readers = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result);
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then(results => {
      setSelectedPhotos(prev => [...prev, ...results]);
    });
  };

  const handleRemovePhoto = (index) => {
    setSelectedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!currentUser) {
      showToast('Please log in to submit a review.', 'error');
      return;
    }
    if (!hasPurchased) {
      showToast('You can only review products you have purchased.', 'error');
      return;
    }
    if (userReviewsCount >= 2) {
      showToast('You cannot submit more than 2 reviews for this product.', 'error');
      return;
    }
    if (wordCount > 500) {
      showToast('Review comment cannot exceed 500 words.', 'error');
      return;
    }

    setIsSubmittingReview(true);
    setTimeout(() => {
      const reviewObj = {
        name: currentUser.fullName || 'Verified Buyer',
        username: currentUser.username,
        rating: newRating,
        comment: newComment.trim(),
        date: new Date().toISOString().split('T')[0],
        photos: selectedPhotos
      };

      setReviewsList(prev => [reviewObj, ...prev]);
      setNewComment('');
      setSelectedPhotos([]);
      setNewRating(5);
      setIsSubmittingReview(false);
      showToast('Review submitted successfully!', 'success');
    }, 800);
  };

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
  // Find product in list
  const product = products.find(p => p.id === productId);

  const getProductColorModels = (prod) => {
    if (!prod) return [];
    if (prod.colorModels) return prod.colorModels;
    
    // Dynamic models builder based on product category
    if (prod.category === 'mobiles') {
      const discount = Math.round(((prod.originalPrice - prod.price) / prod.originalPrice) * 100);
      return [
        {
          name: 'Titanium Gray',
          primaryImage: prod.images && prod.images[0] ? prod.images[0] : prod.image,
          images: [
            prod.images && prod.images[0] ? prod.images[0] : prod.image,
            prod.images && prod.images[2] ? prod.images[2] : prod.image
          ],
          variants: [
            { name: '128 GB + 6 GB', price: prod.price, originalPrice: prod.originalPrice, discount, stock: 8 },
            { name: '128 GB + 8 GB', price: Math.round(prod.price * 1.08), originalPrice: Math.round(prod.originalPrice * 1.08), discount, stock: 5 },
            { name: '256 GB + 8 GB', price: Math.round(prod.price * 1.20), originalPrice: Math.round(prod.originalPrice * 1.20), discount, stock: 1 }
          ]
        },
        {
          name: 'Titanium Blue',
          primaryImage: prod.images && prod.images[1] ? prod.images[1] : prod.image,
          images: [
            prod.images && prod.images[1] ? prod.images[1] : prod.image,
            prod.images && prod.images[3] ? prod.images[3] : prod.image
          ],
          variants: [
            { name: '128 GB + 6 GB', price: Math.round(prod.price * 1.03), originalPrice: Math.round(prod.originalPrice * 1.03), discount, stock: 4 },
            { name: '128 GB + 8 GB', price: Math.round(prod.price * 1.12), originalPrice: Math.round(prod.originalPrice * 1.12), discount, stock: 2 },
            { name: '256 GB + 8 GB', price: Math.round(prod.price * 1.26), originalPrice: Math.round(prod.originalPrice * 1.26), discount, stock: 0 }
          ]
        }
      ];
    } else if (prod.category === 'fashion') {
      const discount = Math.round(((prod.originalPrice - prod.price) / prod.originalPrice) * 100);
      return [
        {
          name: 'Pitch Black',
          primaryImage: prod.images && prod.images[0] ? prod.images[0] : prod.image,
          images: [
            prod.images && prod.images[0] ? prod.images[0] : prod.image,
            prod.images && prod.images[2] ? prod.images[2] : prod.image
          ],
          variants: [
            { name: 'Size M', price: prod.price, originalPrice: prod.originalPrice, discount, stock: 12 },
            { name: 'Size L', price: Math.round(prod.price * 1.05), originalPrice: Math.round(prod.originalPrice * 1.05), discount, stock: 2 },
            { name: 'Size XL', price: Math.round(prod.price * 1.10), originalPrice: Math.round(prod.originalPrice * 1.10), discount, stock: 6 }
          ]
        },
        {
          name: 'Vintage Brown',
          primaryImage: prod.images && prod.images[1] ? prod.images[1] : prod.image,
          images: [
            prod.images && prod.images[1] ? prod.images[1] : prod.image
          ],
          variants: [
            { name: 'Size M', price: Math.round(prod.price * 1.08), originalPrice: Math.round(prod.originalPrice * 1.08), discount, stock: 3 },
            { name: 'Size L', price: Math.round(prod.price * 1.14), originalPrice: Math.round(prod.originalPrice * 1.14), discount, stock: 1 }
          ]
        }
      ];
    } else if (prod.category === 'electronics') {
      const discount = Math.round(((prod.originalPrice - prod.price) / prod.originalPrice) * 100);
      return [
        {
          name: 'Carbon Gray',
          primaryImage: prod.images && prod.images[0] ? prod.images[0] : prod.image,
          images: [
            prod.images && prod.images[0] ? prod.images[0] : prod.image,
            prod.images && prod.images[2] ? prod.images[2] : prod.image
          ],
          variants: [
            { name: 'Base Edition', price: prod.price, originalPrice: prod.originalPrice, discount, stock: 15 },
            { name: 'Pro Edition', price: Math.round(prod.price * 1.25), originalPrice: Math.round(prod.originalPrice * 1.25), discount, stock: 3 }
          ]
        },
        {
          name: 'Platinum Silver',
          primaryImage: prod.images && prod.images[1] ? prod.images[1] : prod.image,
          images: [
            prod.images && prod.images[1] ? prod.images[1] : prod.image
          ],
          variants: [
            { name: 'Base Edition', price: Math.round(prod.price * 1.05), originalPrice: Math.round(prod.originalPrice * 1.05), discount, stock: 5 },
            { name: 'Pro Edition', price: Math.round(prod.price * 1.32), originalPrice: Math.round(prod.originalPrice * 1.32), discount, stock: 2 }
          ]
        }
      ];
    }
    // Default model if category is different
    const discount = Math.round(((prod.originalPrice - prod.price) / prod.originalPrice) * 100);
    return [
      {
        name: 'Standard Edition',
        primaryImage: prod.image,
        images: [prod.image],
        variants: [
          { name: 'Standard Pack', price: prod.price, originalPrice: prod.originalPrice, discount, stock: 10 }
        ]
      }
    ];
  };

  const colorModels = product ? getProductColorModels(product) : [];

  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);

  const activeColor = selectedColor || colorModels[0];

  const imagesList = activeColor && activeColor.images && activeColor.images.length > 0 
    ? activeColor.images 
    : (product ? [product.image] : []);

  const variantsList = activeColor && activeColor.variants ? activeColor.variants : [];

  const activeVariant = selectedVariant || variantsList[0];

  const currentDisplayPrice = activeVariant ? activeVariant.price : (product ? product.price : 0);
  const currentDisplayOriginalPrice = activeVariant ? activeVariant.originalPrice : (product ? product.originalPrice : 0);
  const currentDisplayDiscount = activeVariant ? activeVariant.discount : 0;

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Sync state when color selection triggers
  React.useEffect(() => {
    if (activeColor) {
      setActiveImageIndex(0);
      setSelectedVariant(activeColor.variants[0]);
    }
  }, [selectedColor]);

  // Sync product selection on initial mount or swap
  React.useEffect(() => {
    if (product) {
      const models = getProductColorModels(product);
      setSelectedColor(models[0]);
      setSelectedVariant(models[0].variants[0]);
      setActiveImageIndex(0);
    }
  }, [productId, product]);

  const handlePrev = () => {
    setActiveImageIndex(prev => (prev > 0 ? prev - 1 : imagesList.length - 1));
  };
  
  const handleNext = () => {
    setActiveImageIndex(prev => (prev < imagesList.length - 1 ? prev + 1 : 0));
  };

  const touchStartX = React.useRef(0);
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50) {
      handleNext();
    } else if (diff < -50) {
      handlePrev();
    }
  };

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
          <div 
            className="main-image-frame" 
            style={{ position: 'relative', overflow: 'hidden', cursor: 'grab', display: 'block', padding: 0 }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Sliding Track */}
            <div style={{ display: 'flex', width: '100%', height: '100%', transform: `translateX(-${activeImageIndex * 100}%)`, transition: 'transform 0.3s ease-out' }}>
              {imagesList.map((imgUrl, index) => (
                <div key={index} style={{ minWidth: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}>
                  <img src={imgUrl} alt={`${product.name} View ${index}`} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                </div>
              ))}
            </div>

            {/* Flipkart Floating Badges & Controls Overlay */}
            {/* Wishlist Heart & Share Panel (Top-Right) */}
            <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 5, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button 
                onClick={(e) => { e.stopPropagation(); showToast('Added to Wishlist!', 'success'); }}
                style={{ border: '1px solid #eaeaea', borderRadius: '50%', backgroundColor: 'white', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', cursor: 'pointer' }}
              >
                <Heart size={16} color="#777" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleShareWhatsApp(); }}
                style={{ border: '1px solid #eaeaea', borderRadius: '50%', backgroundColor: 'white', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', cursor: 'pointer' }}
              >
                <Share2 size={16} color="#777" />
              </button>
            </div>

            {/* Rating & Reviews Pill Badge (Bottom-Left) */}
            <div style={{ position: 'absolute', bottom: '12px', left: '12px', zIndex: 5, backgroundColor: 'rgba(0, 0, 0, 0.65)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '3px' }}>
              {product.rating} <Star size={10} fill="var(--success)" stroke="var(--success)" style={{ display: 'inline' }} /> <span style={{ color: 'rgba(255,255,255,0.7)', margin: '0 2px' }}>|</span> {product.reviewsCount > 999 ? `${(product.reviewsCount/1000).toFixed(1)}K` : product.reviewsCount}+
            </div>

            {/* Indicator Dots */}
            {imagesList.length > 1 && (
              <div style={{ position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '6px', zIndex: 5 }}>
                {imagesList.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => { e.stopPropagation(); setActiveImageIndex(index); }}
                    style={{
                      padding: 0,
                      border: 'none',
                      height: '6px',
                      width: activeImageIndex === index ? '16px' : '6px',
                      borderRadius: '3px',
                      backgroundColor: activeImageIndex === index ? 'var(--primary-color)' : '#cbd5e1',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease'
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Multiple preview thumbnails (desktop layout style thumbnails below) */}
          {imagesList.length > 1 && (
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', margin: '4px 0 12px 0', flexWrap: 'wrap' }}>
              {imagesList.map((imgUrl, index) => (
                <img
                  key={index}
                  src={imgUrl}
                  alt={`Preview ${index}`}
                  onClick={() => setActiveImageIndex(index)}
                  style={{
                    width: '52px',
                    height: '52px',
                    objectFit: 'contain',
                    border: activeImageIndex === index ? '2px solid var(--primary-color)' : '1px solid #e0e0e0',
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

          {/* Color Variation Selection (Flipkart style) */}
          {/* Color Variation Selection (Flipkart style) */}
          {colorModels.length > 0 && (
            <div style={{ marginTop: '16px', borderTop: '1px solid #f0f0f0', paddingTop: '16px' }}>
              <div style={{ fontSize: '13px', color: '#878787', fontWeight: '600', marginBottom: '8px' }}>
                Selected Color: <span style={{ color: '#212121', fontWeight: 'bold' }}>{activeColor ? activeColor.name : ''}</span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                {colorModels.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedColor(c)}
                    style={{
                      border: activeColor && activeColor.name === c.name ? '2px solid var(--primary-color)' : '1px solid #e0e0e0',
                      borderRadius: '4px',
                      padding: '2px',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      width: '60px',
                      height: '60px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxSizing: 'border-box',
                      boxShadow: activeColor && activeColor.name === c.name ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                      transition: 'all 0.1s'
                    }}
                  >
                    <img src={c.primaryImage} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Variant Selection (Flipkart style) */}
          {variantsList.length > 0 && (
            <div style={{ marginTop: '16px', borderTop: '1px solid #f0f0f0', paddingTop: '16px' }}>
              <div style={{ fontSize: '13px', color: '#878787', fontWeight: '600', marginBottom: '8px' }}>
                Variant: <span style={{ color: '#212121', fontWeight: 'bold' }}>{activeVariant ? activeVariant.name : ''}</span>
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {variantsList.map((v, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedVariant(v)}
                    style={{
                      border: activeVariant && activeVariant.name === v.name ? '2px solid #212121' : '1px solid #e0e0e0',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      textAlign: 'left',
                      minWidth: '120px',
                      boxSizing: 'border-box',
                      boxShadow: activeVariant && activeVariant.name === v.name ? '0 1px 5px rgba(0,0,0,0.05)' : 'none',
                      transition: 'all 0.1s',
                      position: 'relative'
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#212121' }}>{v.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                       <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#388e3c' }}>↓{v.discount}%</span>
                       <span style={{ fontSize: '11px', color: '#878787', textDecoration: 'line-through' }}>₹{v.originalPrice.toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#212121', marginTop: '2px' }}>₹{v.price.toLocaleString('en-IN')}</div>
                    
                    {/* Low stock tag */}
                    {v.stock <= 3 && (
                      <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#d32f2f', marginTop: '4px' }}>
                        {v.stock} left
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
          {/* Pricing Details */}
          <div className="price-box-details" style={{ backgroundColor: 'transparent', border: 'none', padding: 0, marginTop: '16px', borderTop: '1px solid #f0f0f0', paddingTop: '16px' }}>
            <div className="details-price-row" style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
              <span className="details-price" style={{ fontSize: '28px', fontWeight: 'bold', color: '#212121' }}>₹{currentDisplayPrice.toLocaleString('en-IN')}</span>
              <span className="details-original" style={{ fontSize: '14px', color: '#878787', textDecoration: 'line-through' }}>₹{currentDisplayOriginalPrice.toLocaleString('en-IN')}</span>
              <span className="details-discount" style={{ fontSize: '14px', fontWeight: 'bold', color: '#388e3c' }}>{currentDisplayDiscount}% off</span>
            </div>
          </div>

          {/* Flipkart Inline Action Buttons Row for Immediate Purchase */}
          <div className="action-buttons-row" style={{ margin: '16px 0', borderBottom: '1px solid #f0f0f0', paddingBottom: '16px' }}>
            {/* White Add to Cart Option */}
            <button 
              className="details-action-btn-secondary" 
              onClick={() => {
                const customProduct = {
                  ...product,
                  price: currentDisplayPrice,
                  originalPrice: currentDisplayOriginalPrice,
                  selectedColor: activeColor ? activeColor.name : '',
                  selectedVariant: activeVariant ? activeVariant.name : ''
                };
                addToCart(customProduct);
              }}
              style={{
                border: '1px solid #dcdcdc',
                borderRadius: '8px',
                backgroundColor: 'white',
                color: '#212121',
                height: '46px',
                cursor: 'pointer',
                width: '100%',
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '600',
                fontSize: '14px'
              }}
            >
              Add to cart
            </button>

            {/* Yellow Buy Now Option */}
            <button 
              className="details-action-btn-primary" 
              onClick={() => {
                const customProduct = {
                  ...product,
                  price: currentDisplayPrice,
                  originalPrice: currentDisplayOriginalPrice,
                  selectedColor: activeColor ? activeColor.name : '',
                  selectedVariant: activeVariant ? activeVariant.name : ''
                };
                addToCart(customProduct, 1);
                onBuyNow(customProduct);
              }}
              style={{
                border: 'none',
                borderRadius: '8px',
                backgroundColor: '#ffd203',
                color: '#212121',
                height: '46px',
                cursor: 'pointer',
                width: '100%',
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '14px'
              }}
            >
              Buy at ₹{currentDisplayPrice.toLocaleString('en-IN')}
            </button>
          </div>

          {/* Flipkart-Style Available Offers */}
          <div style={{ paddingTop: '4px' }}>
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
              {reviewsList.map((rev, idx) => (
                <div key={idx} style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: '12px', textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="rating-tag" style={{ fontSize: '10px', padding: '1px 5px', height: '16px', display: 'inline-flex', alignItems: 'center' }}>
                      {rev.rating} ★
                    </span>
                    <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{rev.name}</strong>
                    <span style={{ fontSize: '11px', color: '#888', marginLeft: 'auto' }}>{rev.date}</span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#555', marginTop: '6px', lineHeight: '1.4' }}>{rev.comment}</p>
                  
                  {/* Attached review photos */}
                  {rev.photos && rev.photos.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                      {rev.photos.map((photo, pIdx) => (
                        <img 
                          key={pIdx} 
                          src={photo} 
                          alt="Review attachment" 
                          style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #e0e0e0' }} 
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* WRITE A REVIEW FORM (With strict anti-spam) */}
            <div style={{ borderTop: '1px dashed #e0e0e0', marginTop: '24px', paddingTop: '20px', textAlign: 'left' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', color: '#212121' }}>Write a Customer Review</h4>
              
              {!currentUser ? (
                <div style={{ backgroundColor: '#f9f9f9', padding: '16px', borderRadius: '4px', textAlign: 'center' }}>
                  <p style={{ fontSize: '13px', color: '#666', marginBottom: '10px' }}>Sign in to write reviews and upload photos.</p>
                  <button className="btn btn-primary" onClick={() => onNavigate('login')} style={{ height: '36px', padding: '0 16px', fontSize: '12px' }}>Sign In</button>
                </div>
              ) : !hasPurchased ? (
                <div style={{ backgroundColor: '#fff9e6', border: '1px solid #ffe0b2', padding: '12px 16px', borderRadius: '4px', color: '#b78103', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>⚠️ Only verified customers who have bought this product can post reviews.</span>
                </div>
              ) : userReviewsCount >= 2 ? (
                <div style={{ backgroundColor: '#eef9ff', border: '1px solid #b3e5fc', padding: '12px 16px', borderRadius: '4px', color: '#0288d1', fontSize: '13px' }}>
                  <span>ℹ️ You have already posted 2 reviews for this product. Further submissions are locked.</span>
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Rating Selector */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Your Rating:</span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {[1, 2, 3, 4, 5].map(num => (
                        <button 
                          key={num} 
                          type="button" 
                          onClick={() => setNewRating(num)}
                          style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '22px',
                            cursor: 'pointer',
                            color: num <= newRating ? '#ff9f00' : '#dcdcdc',
                            padding: 0
                          }}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comment box */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#555', marginBottom: '6px' }}>
                      Review Comment *
                    </label>
                    <textarea 
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Share your experience (build quality, packaging, delivery etc.)"
                      required
                      style={{ width: '100%', height: '90px', padding: '10px', fontSize: '13px', border: '1px solid #ccc', borderRadius: '4px', resize: 'none', boxSizing: 'border-box' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '4px' }}>
                      <span style={{ color: wordCount > 500 ? 'var(--error)' : '#878787' }}>
                        {wordCount} / 500 words
                      </span>
                      {wordCount > 500 && <span style={{ color: 'var(--error)', fontWeight: 'bold' }}>Exceeded limit of 500 words!</span>}
                    </div>
                  </div>

                  {/* Photo Upload Box */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#555', marginBottom: '6px' }}>
                      Upload Photos (Max 5)
                    </label>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <label style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '70px',
                        height: '70px',
                        border: '2px dashed #ccc',
                        borderRadius: '4px',
                        cursor: selectedPhotos.length >= 5 ? 'not-allowed' : 'pointer',
                        backgroundColor: '#fbfbfb'
                      }}>
                        <input 
                          type="file" 
                          multiple 
                          accept="image/*" 
                          onChange={handlePhotoUpload}
                          disabled={selectedPhotos.length >= 5}
                          style={{ display: 'none' }}
                        />
                        <span style={{ fontSize: '24px', color: '#888' }}>+</span>
                      </label>

                      {/* Photo Previews */}
                      {selectedPhotos.map((photo, pIdx) => (
                        <div key={pIdx} style={{ position: 'relative', width: '70px', height: '70px' }}>
                          <img 
                            src={photo} 
                            alt="preview" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} 
                          />
                          <button 
                            type="button" 
                            onClick={() => handleRemovePhoto(pIdx)}
                            style={{
                              position: 'absolute',
                              top: '-6px',
                              right: '-6px',
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              backgroundColor: 'rgba(0,0,0,0.6)',
                              color: 'white',
                              border: 'none',
                              fontSize: '10px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer'
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button 
                    type="submit" 
                    className="btn btn-accent" 
                    disabled={isSubmittingReview || wordCount > 500}
                    style={{ height: '40px', fontWeight: 'bold', width: '100%', marginTop: '8px' }}
                  >
                    {isSubmittingReview ? 'SUBMITTING...' : 'SUBMIT CUSTOMER REVIEW'}
                  </button>
                </form>
              )}
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
            <div className="product-share-container">
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

          {/* Spacer to prevent floating buttons from blocking Share & Earn box */}
          <div className="mobile-only-spacer" />

        </div>

      </div>
    </div>
  );
};

export default ProductDetails;
