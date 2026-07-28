import LazyImage from '../components/LazyImage';
// eslint-disable-next-line
import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useApp } from '../context/AppContext';
import { 
  Star, 
  ShoppingCart, 
  Zap, 
  Award, 
  Share2, 
  Copy, 
  Send,
  // eslint-disable-next-line
  ShieldAlert,
  ShieldCheck,
  Check,
  // eslint-disable-next-line
  ChevronLeft,
  ChevronRight,
  Heart,
  Store,
  Sparkles,
  TrendingUp,
  Tag,
  Truck,
  Plus
} from 'lucide-react';
import '../assets/styles/product.css';
import CountdownTimer from '../components/CountdownTimer';
import ProductCard from '../components/ProductCard';


// eslint-disable-next-line
const ProductDetails = ({ productId, onNavigate, onBuyNow, promotions }) => {
  const { addToCart, currentUser, showToast, products, orders, wishlist, toggleWishlist, isLoadingProducts } = useApp();
  const [copied, setCopied] = useState(false);
  const [pincode, setPincode] = useState('560103');
  // Dynamic delivery estimate
  const getTomorrowDay = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });
  };
  const [deliveryEstimate] = useState(`Delivery by ${getTomorrowDay()} | Free Express Shipping`);

  React.useEffect(() => {
    document.body.classList.add('product-details-active');
    window.scrollTo(0, 0);

    const handleGlobalScroll = () => {
      // Show sticky CTA if scrolled past the main purchase buttons (approx 600px on mobile)
      if (window.scrollY > 600) {
        setShowStickyCTA(true);
      } else {
        setShowStickyCTA(false);
      }
    };
    window.addEventListener('scroll', handleGlobalScroll);

    return () => {
      document.body.classList.remove('product-details-active');
      window.removeEventListener('scroll', handleGlobalScroll);
    };
  }, [productId]);

  const [showStickyCTA, setShowStickyCTA] = useState(false);

  // --- Dynamic Customer Reviews hooks ---
  const [reviewsList, setReviewsList] = useState(() => {
    try {
      const saved = localStorage.getItem(`product_${productId}_reviews`);
      if (saved) return JSON.parse(saved);
    } catch { /* corrupted, fall through to defaults */ }
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
    order && order.status !== 'CANCELLED' && 
    order.items?.some(item => item && item.product && item.product.id === productId)
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
  const productFromContext = products.find(p => p.id === productId);

  // Fallback to individual fetch if not in the first 100 products loaded by AppContext
  const [fetchedProduct, setFetchedProduct] = useState(null);
  const [isFetchingLocal, setIsFetchingLocal] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  React.useEffect(() => {
    if (!productFromContext && !isLoadingProducts && !fetchedProduct && !isFetchingLocal && !fetchError) {
      setIsFetchingLocal(true);
      fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/products/${productId}`)
        .then(res => {
          if (!res.ok) throw new Error('Not found');
          return res.json();
        })
        .then(data => {
          if (data) setFetchedProduct(data);
          setIsFetchingLocal(false);
        })
        .catch(() => {
          setFetchError(true);
          setIsFetchingLocal(false);
        });
    }
  }, [productFromContext, isLoadingProducts, productId, fetchedProduct, isFetchingLocal, fetchError]);

  const product = productFromContext || fetchedProduct;

  const getProductColorModels = (prod) => {
    if (!prod) return [];
    if (prod.colorModels && prod.colorModels.length > 0) return prod.colorModels;
    
    // Default model if no color models exist
    const discount = prod.originalPrice > 0 ? Math.round(((prod.originalPrice - prod.price) / prod.originalPrice) * 100) : 0;
    return [
      {
        name: 'Standard Edition',
        primaryImage: prod.image,
        images: prod.images || [prod.image],
        variants: [
          { name: 'Standard Pack', price: prod.price, originalPrice: prod.originalPrice, discount, stock: prod.stock || 10 }
        ]
      }
    ];
  };

  const colorModels = product ? getProductColorModels(product) : [];

  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);

  const activeColor = selectedColor || colorModels[0];

  const imagesList = product?.colorModels && activeColor && activeColor.images && activeColor.images.length > 0 
    ? activeColor.images 
    : (product ? (product.images && product.images.length > 0 ? product.images : [product.image]) : []);

  const variantsList = activeColor && activeColor.variants ? activeColor.variants : [];

  const activeVariant = selectedVariant || variantsList[0];

  const isFlashSale = product?.flashSale?.isActive && new Date(product.flashSale.endTime) > new Date();
  
  const currentDisplayPrice = isFlashSale ? product.flashSale.price : (activeVariant ? activeVariant.price : (product ? product.price : 0));
  const currentDisplayOriginalPrice = activeVariant ? activeVariant.originalPrice : (product ? product.originalPrice : (isFlashSale ? product.price : 0));
  const currentDisplayDiscount = currentDisplayOriginalPrice > 0 ? Math.round(((currentDisplayOriginalPrice - currentDisplayPrice) / currentDisplayOriginalPrice) * 100) : 0;

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Sync state when color selection triggers
  React.useEffect(() => {
    // eslint-disable-next-line
    if (activeColor) {
      setActiveImageIndex(0);
      setSelectedVariant(activeColor.variants[0]);
    }
  }, [selectedColor]);

  // Sync product selection on initial mount or swap
  const [recommendations, setRecommendations] = useState([]);
  
  React.useEffect(() => {
    if (product) {
      const models = getProductColorModels(product);
      setSelectedColor(models[0]);
      setSelectedVariant(models[0].variants[0]);
      setActiveImageIndex(0);

      // Fetch AI Recommendations
      fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/products/${product.id}/recommendations`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setRecommendations(data);
        })
        .catch(err => console.error('Failed to load recommendations', err));
    }
  }, [productId, product]);

  const scrollRef = React.useRef(null);
  const handleScroll = (e) => {
    const scrollLeft = e.target.scrollLeft;
    const width = e.target.offsetWidth;
    const newIndex = Math.round(scrollLeft / width);
    if (newIndex !== activeImageIndex) {
      setActiveImageIndex(newIndex);
    }
  };

  const scrollToSlide = (index) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        left: index * scrollRef.current.offsetWidth,
        behavior: 'smooth'
      });
    }
  };

  const handlePrev = () => {
    const nextIndex = activeImageIndex > 0 ? activeImageIndex - 1 : imagesList.length - 1;
    scrollToSlide(nextIndex);
  };
  
  const handleNext = () => {
    const nextIndex = activeImageIndex < imagesList.length - 1 ? activeImageIndex + 1 : 0;
    scrollToSlide(nextIndex);
  };

  if (!product) {
    if (isLoadingProducts || isFetchingLocal) {
      return (
        <div className="container" style={{ textAlign: 'center', padding: '120px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div className="loading-spinner" style={{ 
            width: '40px', height: '40px', border: '3px solid #f3f3f3', 
            borderTop: '3px solid var(--primary-color)', borderRadius: '50%', 
            animation: 'spin 1s linear infinite', margin: '0 auto 20px' 
          }}></div>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <h3 style={{ color: 'var(--text-primary)' }}>Loading product...</h3>
        </div>
      );
    }
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

  // eslint-disable-next-line
  const discountPercent = product.originalPrice > 0
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const userCoins = Math.round((product.price || 0) * (product.userCommissionRate || 0.02));

  // Generate the unique referral tracking link
  const getReferralLink = () => {
    if (!currentUser) return '';
    const origin = window.location.origin;
    const trackingParam = `ref=${currentUser.referralCode || currentUser.username}`;
    return `${origin}/?prod=${product.id}&${trackingParam}`;
  };

  const handleCopyLink = () => {
    const link = getReferralLink();
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      showToast('Affiliate tracking link copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    // eslint-disable-next-line
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

  const handleSearchClick = () => {
    onNavigate('home');
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('focus-main-search'));
    }, 150);
  };

  return (
    <>
      <Helmet>
        <title>{product.seo?.metaTitle || `${product.name} | AbKharido`}</title>
        <meta name="description" content={product.seo?.metaDescription || product.description?.substring(0, 160)} />
        <meta property="og:title" content={product.seo?.metaTitle || product.name} />
        <meta property="og:description" content={product.seo?.metaDescription || product.description?.substring(0, 160)} />
        <meta property="og:image" content={product.image} />
        <meta property="og:type" content="product" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
    <div className="container animate-fade-in-only" style={{ paddingTop: '0', paddingBottom: '80px' }}>



      <div className="details-page-grid">
        {/* Left Column: Image and Purchase Actions */}
        <div className="image-showcase-column">
          <div style={{ position: 'relative', width: '100%' }}>
            <div 
              className="main-image-frame" 
              ref={scrollRef}
              onScroll={handleScroll}
              style={{ 
                display: 'flex', 
                overflowX: 'auto', 
                overflowY: 'hidden',
                scrollSnapType: 'x mandatory',
                scrollBehavior: 'smooth',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none', // Firefox
                msOverflowStyle: 'none' // IE
              }}
            >
              {/* Hide scrollbar for Chrome/Safari */}
              <style>{`.main-image-frame::-webkit-scrollbar { display: none; }`}</style>
              
              {/* Image Slides */}
              {imagesList.map((imgUrl, index) => {
                const isVideo = imgUrl.startsWith('data:video/') || imgUrl.endsWith('.mp4') || imgUrl.endsWith('.webm');
                return (
                  <div key={index} className="slider-item">
                    {isVideo ? (
                      <video className="slider-media" src={imgUrl} autoPlay loop muted playsInline />
                    ) : (
                      <img
                        className="slider-media"
                        src={imgUrl}
                        alt={`${product.name} View ${index + 1}`}
                        loading={index === 0 ? "eager" : "lazy"}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Wishlist Heart & Share Panel (Top-Right) */}
            <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 5, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button 
                onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); }}
                style={{ border: '1px solid rgba(255,255,255,0.4)', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.7)', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', cursor: 'pointer', transition: 'all 0.2s ease', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
              >
                {wishlist && wishlist.includes(product.id) ? (
                  <Heart size={20} fill="#ef4444" color="#ef4444" />
                ) : (
                  <Heart size={20} color="#475569" />
                )}
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleShareWhatsApp(); }}
                className="btn-icon"
                style={{ border: '1px solid rgba(255,255,255,0.4)', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.7)', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', cursor: 'pointer', transition: 'all 0.2s ease', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
              >
                <Share2 size={20} color="#475569" />
              </button>
            </div>

            {/* Removed redundant rating pill */}
          </div>

          {/* Centered Indicator Dots below image slider */}
          {imagesList.length > 1 && (
            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', margin: '12px 0 8px 0' }}>
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
                    backgroundColor: activeImageIndex === index ? '#2874f0' : '#cbd5e1',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease'
                  }}
                />
              ))}
            </div>
          )}

          {/* Multiple preview thumbnails (desktop layout style thumbnails below) */}
          {imagesList.length > 1 && (
            <div className="desktop-thumbnails-container" style={{ display: 'flex', gap: '8px', justifyContent: 'center', margin: '4px 0 12px 0', flexWrap: 'wrap' }}>
              {imagesList.map((imgUrl, index) => {
                const isVideo = imgUrl.startsWith('data:video/') || imgUrl.endsWith('.mp4') || imgUrl.endsWith('.webm');
                const baseStyle = {
                  width: '52px',
                  height: '52px',
                  objectFit: 'contain',
                  border: activeImageIndex === index ? '2px solid var(--primary-color)' : '1px solid #e0e0e0',
                  borderRadius: '4px',
                  padding: '2px',
                  cursor: 'pointer',
                  backgroundColor: 'white',
                  transition: 'all 0.1s'
                };
                
                return isVideo ? (
                  <video
                    key={index}
                    src={imgUrl}
                    onClick={() => setActiveImageIndex(index)}
                    style={{ ...baseStyle, objectFit: 'cover' }}
                    muted
                  />
                ) : (
                  <img
                    key={index}
                    src={imgUrl}
                    alt={`Preview ${index}`}
                    onClick={() => setActiveImageIndex(index)}
                    style={{ ...baseStyle, objectFit: 'contain' }}
                  />
                );
              })}
            </div>
          )}

          {/* Action Buttons Container */}
          <div className="action-buttons-container" style={{ marginTop: '24px' }}>
            {/* Price Preview (Mobile) */}
            <div className="mobile-price-preview" style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1, marginBottom: '8px' }}>
              <span style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>₹{(currentDisplayPrice || 0).toLocaleString('en-IN')}</span>
              <span style={{ fontSize: '11px', color: '#94a3b8', textDecoration: 'line-through' }}>₹{(currentDisplayOriginalPrice || 0).toLocaleString('en-IN')}</span>
            </div>
            
            <div className="action-buttons-row">
                <button
                  onClick={() => {
                    const customProduct = { ...product, price: currentDisplayPrice, originalPrice: currentDisplayOriginalPrice, selectedColor: activeColor ? activeColor.name : '', selectedVariant: activeVariant ? activeVariant.name : '' };
                    addToCart(customProduct);
                  }}
                  style={{
                    flex: 1,
                    height: '48px',
                    border: '2px solid #4f46e5',
                    borderRadius: '10px',
                    background: '#ffffff',
                    color: '#4f46e5',
                    fontWeight: '700',
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <ShoppingCart size={17} /> Add to Cart
                </button>
                <button
                  onClick={() => {
                    const customProduct = { ...product, price: currentDisplayPrice, originalPrice: currentDisplayOriginalPrice, selectedColor: activeColor ? activeColor.name : '', selectedVariant: activeVariant ? activeVariant.name : '' };
                    addToCart(customProduct, 1);
                    onBuyNow(customProduct);
                  }}
                  style={{
                    flex: 1,
                    height: '48px',
                    border: 'none',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                    color: '#ffffff',
                    fontWeight: '800',
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontFamily: 'inherit',
                    boxShadow: '0 4px 14px rgba(79,70,229,0.35)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Zap size={17} fill="white" /> Buy Now
                </button>
              </div>
            </div>
        </div>

        {/* Right Column: Details, Specifications and Affiliate Link */}
        <div className="details-info-column" style={{ padding: '0 4px' }}>
          <div style={{ marginBottom: '12px' }}>
            <h1 className="product-title-text" style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', lineHeight: '1.3', letterSpacing: '-0.3px', margin: 0 }}>{product.name}</h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.5px' }}>₹{currentDisplayPrice.toLocaleString('en-IN')}</span>
            <span style={{ fontSize: '16px', color: '#94a3b8', textDecoration: 'line-through', fontWeight: '500' }}>₹{currentDisplayOriginalPrice.toLocaleString('en-IN')}</span>
            <span style={{ fontSize: '13px', color: '#166534', fontWeight: '700', backgroundColor: '#dcfce7', padding: '4px 8px', borderRadius: '6px' }}>{currentDisplayDiscount}% OFF</span>
          </div>

          {isFlashSale && (
            <div style={{ marginTop: '8px', marginBottom: '8px' }}>
              <CountdownTimer endTime={product.flashSale.endTime} />
            </div>
          )}

          <div className="product-ratings-row" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px' }}>
            <span className="rating-tag" style={{ fontSize: '13px', padding: '4px 8px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#16a34a', color: 'white' }}>
              {product.rating} <Star size={12} fill="white" />
            </span>
            <span style={{ color: '#64748b', fontSize: '14px', fontWeight: '500' }}>{(product.reviewsCount || 0).toLocaleString()} Ratings & Reviews</span>
            
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

          {/* Color Variation Selection (AbKharido style) */}
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
                      position: 'relative',
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
                    <LazyImage src={c.primaryImage} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Variant Selection (AbKharido style) */}
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
                       <span style={{ fontSize: '11px', color: '#878787', textDecoration: 'line-through' }}>₹{(v.originalPrice || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#212121', marginTop: '2px' }}>₹{(v.price || 0).toLocaleString('en-IN')}</div>
                    
                    {/* Low stock tag */}
                    {v.stock <= 5 && (
                      <div style={{ fontSize: '10px', fontWeight: 'bold', color: 'white', backgroundColor: '#ef4444', padding: '2px 4px', borderRadius: '4px', marginTop: '6px', display: 'inline-block' }}>
                        Hurry! Only {v.stock} left
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}


          {/* Trust Badges */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600', color: '#475569', background: '#f8fafc', padding: '6px 10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <ShieldCheck size={16} color="#4f46e5" /> 100% Original
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600', color: '#475569', background: '#f8fafc', padding: '6px 10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <Zap size={16} color="#eab308" /> Fast Delivery
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600', color: '#475569', background: '#f8fafc', padding: '6px 10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <Check size={16} color="#10b981" /> Easy Returns
            </div>
          </div>

          {/* AbKharido-Style Available Offers */}
          <div style={{ paddingTop: '4px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#212121', marginBottom: '10px' }}>Available Offers</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '13px', color: '#212121' }}>
                <span style={{ color: '#388e3c', fontSize: '14px', lineHeight: '1.2' }}>🏷️</span>
                <span><strong>Partner Link Reward:</strong> Earn up to <strong style={{ color: '#e68f00' }}>{userCoins} Coins</strong> back on referral orders. <span style={{ color: 'var(--primary-color)', fontWeight: 'bold', cursor: 'pointer' }}>T&C</span></span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '13px', color: '#212121' }}>
                <span style={{ color: '#388e3c', fontSize: '14px', lineHeight: '1.2' }}>🏷️</span>
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

          {/* AI Recommendations Carousel */}
          {recommendations.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>Customers Also Bought</h4>
              <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px', msOverflowStyle: 'none', scrollbarWidth: 'none' }} className="hide-scrollbar">
                {recommendations.map(rec => (
                  <div key={rec.id} style={{ minWidth: '160px', width: '160px' }}>
                    <ProductCard product={rec} onNavigateProduct={onNavigate} />
                  </div>
                ))}
              </div>
            </div>
          )}

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

          {/* AbKharido Direct/Seller Guarantee */}
          <div style={{ display: 'flex', gap: '10px', backgroundColor: '#fafafa', border: '1px solid #e0e0e0', padding: '12px 16px', borderRadius: '4px' }}>
            <ShieldCheck size={28} color="var(--primary-color)" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '13px' }}>
              {product.sellerId && product.sellerId !== 'admin' ? (
                <>
                  <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>Sold by: {product.sellerName || 'Marketplace Seller'} (✓ Verified Merchant)</div>
                  <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                    This item is listed and fulfilled directly by {product.sellerName || 'Marketplace Seller'} under the AbKharido Trust Guarantee. 
                    10-day replacement policy, secure transit packing, and unified support.
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>AbKharido Fulfill Direct Guarantee</div>
                  <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                    This item is owned, warehoused, and directly shipped by AbKharido. We do not host third-party sellers. 
                    Guaranteed genuine brand, secure transit packing, and unified support.
                  </div>
                </>
              )}
            </div>
          </div>



          {/* Product Description */}
          <details className="pdp-accordion" open>
            <summary>Product Description</summary>
            <div className="accordion-content">
              <p style={{ fontSize: '14px', color: '#444444', lineHeight: '1.6', margin: 0 }}>
                {product.description}
              </p>
            </div>
          </details>

          {/* Technical Specifications */}
          <details className="pdp-accordion">
            <summary>Specifications</summary>
            <div className="accordion-content">
              <table className="specs-table">
                <tbody>
                  {(product.specifications || []).map((spec, index) => (
                    <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#f8fafc' : 'transparent' }}>
                      <td className="specs-key">{spec.key}</td>
                      <td className="specs-value">{spec.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>

          {/* Ratings & Reviews section */}
          <details className="pdp-accordion" id="reviews-section">
            <summary style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              Ratings & Reviews
              <span className="rating-tag" style={{ fontSize: '12px', padding: '2px 6px', display: 'inline-flex', alignItems: 'center', gap: '2px', fontWeight: 'bold' }}>
                {product.rating} <span style={{ color: 'white' }}>★</span>
              </span>
            </summary>
            <div className="accordion-content">
            
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
                          <LazyImage 
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
                    style={{ fontWeight: 'bold', width: '100%', marginTop: '8px' }}
                  >
                    {isSubmittingReview ? 'SUBMITTING...' : 'SUBMIT CUSTOMER REVIEW'}
                  </button>
                </form>
              )}
            </div>
            </div>
          </details>

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
                <div style={{ color: '#166534', fontWeight: '500' }}>Member Reward</div>
                <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#e68f00' }}>{userCoins} Coins</div>
                <div style={{ fontSize: '11px', color: '#15803d' }}>({Math.round((product.userCommissionRate || 0.02) * 100 * 10) / 10}% rate, credited on checkout)</div>
              </div>
            </div>

            {/* Custom Link Copy Section */}
            {currentUser ? (
               <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                 <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#166534' }}>
                   Your Unique Tracking Link:
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


          </div>

          {/* Frequently Bought Together (Recommendation Engine) */}
          <div style={{ marginTop: '32px', borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Sparkles size={20} color="#eab308" /> Frequently Bought Together
            </h3>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
              {/* Main Product */}
              <div style={{ flex: '1 1 auto', minWidth: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <img src={product.image} alt={product.name} style={{ width: '80px', height: '80px', objectFit: 'contain', borderRadius: '8px', background: 'white', padding: '4px', border: '1px solid #e2e8f0' }} />
                <span style={{ fontSize: '12px', fontWeight: '600', textAlign: 'center' }}>This Item</span>
                <span style={{ fontSize: '13px', fontWeight: 'bold' }}>₹{product.price?.toLocaleString()}</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '24px', fontWeight: 'bold' }}>+</div>
              
              {/* Recommended Product (Mock Data) */}
              <div style={{ flex: '1 1 auto', minWidth: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <img src="https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?q=80&w=200&auto=format&fit=crop" alt="Earphones" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', background: 'white', padding: '4px', border: '1px solid #e2e8f0' }} />
                <span style={{ fontSize: '12px', fontWeight: '600', textAlign: 'center' }}>Pro Earbuds</span>
                <span style={{ fontSize: '13px', fontWeight: 'bold' }}>₹999</span>
              </div>

              <div style={{ width: '100%', marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Total bundle price:</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a' }}>₹{((product.price || 0) + 999).toLocaleString()}</div>
                </div>
                <button 
                  onClick={() => {
                    addToCart(product, 1);
                    showToast('Bundle added to cart!', 'success');
                  }}
                  style={{ background: '#0f172a', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Add Both to Cart
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Sticky Mobile Add to Cart Bottom Bar */}
      <div 
        className={`sticky-bottom-bar ${showStickyCTA ? 'visible' : ''}`}
        style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid #e2e8f0',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 -4px 12px rgba(0,0,0,0.05)',
          zIndex: 1000,
          transform: showStickyCTA ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <img src={product.image} alt="Thumb" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8f0' }} />
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#0f172a' }}>₹{product.price?.toLocaleString()}</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => {
              if (selectedVariant && selectedVariant.stock === 0) {
                showToast('This variant is out of stock', 'error');
                return;
              }
              if (product.inStock === false) {
                showToast('This product is out of stock', 'error');
                return;
              }
              addToCart(product, 1, selectedVariant, selectedColorModel);
            }}
            style={{ padding: '10px 12px', background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px' }}
          >
            ADD
          </button>
          <button 
            onClick={() => {
              const customProduct = { ...product, price: currentDisplayPrice, originalPrice: currentDisplayOriginalPrice, selectedColor: activeColor ? activeColor.name : '', selectedVariant: activeVariant ? activeVariant.name : '' };
              addToCart(customProduct, 1);
              onBuyNow(customProduct);
            }}
            style={{ padding: '10px 16px', background: 'linear-gradient(90deg, #f59e0b, #ea580c)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px' }}
          >
            BUY NOW
          </button>
        </div>
      </div>

    </>
  );
};

export default ProductDetails;
