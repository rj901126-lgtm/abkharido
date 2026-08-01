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
      showToast('Please enter a valid 6-digit Indian postal PIN code.', 'error');
      setDeliveryEstimate('❌ Invalid PIN code format. Please input a 6-digit number.');
      return;
    }

    const metroPrefixes = ['110', '400', '560', '700', '600', '500', '380', '411'];
    const isMetro = metroPrefixes.some(prefix => pincode.startsWith(prefix));

    if (isMetro) {
      showToast('🎉 Eligible for 10-Minute Rapid VIP Delivery!', 'success');
      setDeliveryEstimate('⚡ ELIGIBLE FOR 10-MIN RAPID METRO DELIVERY | Free VIP Shipping Unlocked!');
    } else {
      showToast('🚀 Priority Express Air-Shipping Available!', 'success');
      setDeliveryEstimate('🚀 Express Air Dispatch: Delivery in 24-48 Hours | 100% Cashfree Protected Escrow');
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
    <div className="container product-page-container animate-fade-in-only" style={{ paddingTop: '0', paddingBottom: '80px' }}>

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
        </div>

        {/* Right Column: Details, Specifications and Affiliate Link */}
        <div className="details-info-column" style={{ padding: '0 4px' }}>
          <div style={{ marginBottom: '12px' }}>
            <h1 className="product-title-text desktop-premium-title" style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', lineHeight: '1.3', letterSpacing: '-0.3px', margin: 0 }}>{product.name}</h1>
          </div>

          <div className="desktop-premium-price-row" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px', flexWrap: 'wrap' }}>
            <span className="desktop-premium-price" style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.5px' }}>₹{currentDisplayPrice.toLocaleString('en-IN')}</span>
            <span className="desktop-premium-original" style={{ fontSize: '16px', color: '#94a3b8', textDecoration: 'line-through', fontWeight: '500' }}>₹{currentDisplayOriginalPrice.toLocaleString('en-IN')}</span>
            <span className="desktop-premium-discount" style={{ fontSize: '13px', color: '#166534', fontWeight: '700', backgroundColor: '#dcfce7', padding: '4px 8px', borderRadius: '6px' }}>{currentDisplayDiscount}% OFF</span>
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

          {/* Color Variation Selection (Enterprise style) */}
          {colorModels.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '500', marginBottom: '12px' }}>
                Color: <span style={{ color: '#0f172a', fontWeight: '700' }}>{activeColor ? activeColor.name : ''}</span>
              </div>
              <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
                <style>{`.color-scroll::-webkit-scrollbar { display: none; }`}</style>
                <div className="color-scroll" style={{ display: 'flex', gap: '12px' }}>
                  {colorModels.map((c, i) => (
                    <button
                      key={i}
                      className="desktop-premium-color-btn"
                      onClick={() => setSelectedColor(c)}
                      style={{
                        position: 'relative',
                        border: activeColor && activeColor.name === c.name ? '2px solid var(--primary-color)' : '1px solid #e2e8f0',
                        borderRadius: '50%',
                        padding: '2px',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                        width: '56px',
                        height: '56px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxSizing: 'border-box',
                        boxShadow: activeColor && activeColor.name === c.name ? '0 4px 12px rgba(79, 70, 229, 0.2)' : 'none',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        transform: activeColor && activeColor.name === c.name ? 'scale(1.05)' : 'scale(1)'
                      }}
                    >
                      <LazyImage src={c.primaryImage} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%' }} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Variant Selection (Enterprise style) */}
          {variantsList.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '500', marginBottom: '12px' }}>
                Size/Variant: <span style={{ color: '#0f172a', fontWeight: '700' }}>{activeVariant ? activeVariant.name : ''}</span>
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {variantsList.map((v, i) => (
                  <button
                    key={i}
                    className="desktop-premium-variant-btn"
                    onClick={() => setSelectedVariant(v)}
                    style={{
                      border: activeVariant && activeVariant.name === v.name ? '2px solid var(--primary-color)' : '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      backgroundColor: activeVariant && activeVariant.name === v.name ? '#f5f7ff' : 'white',
                      cursor: 'pointer',
                      textAlign: 'left',
                      minWidth: '130px',
                      flex: '1 1 auto',
                      boxSizing: 'border-box',
                      boxShadow: activeVariant && activeVariant.name === v.name ? '0 4px 12px rgba(79, 70, 229, 0.1)' : '0 2px 4px rgba(0,0,0,0.02)',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative'
                    }}
                  >
                    <div style={{ fontSize: '14px', fontWeight: '700', color: activeVariant && activeVariant.name === v.name ? 'var(--primary-color)' : '#0f172a' }}>{v.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                       <span style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>₹{(v.price || 0).toLocaleString('en-IN')}</span>
                       {v.originalPrice > v.price && (
                         <span style={{ fontSize: '12px', color: '#94a3b8', textDecoration: 'line-through' }}>₹{(v.originalPrice || 0).toLocaleString('en-IN')}</span>
                       )}
                    </div>
                    
                    {/* Low stock tag */}
                    {v.stock <= 5 && (
                      <div style={{ fontSize: '11px', fontWeight: '700', color: '#dc2626', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#dc2626' }}></span>
                        Only {v.stock} left
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}


          {/* Trust Badges & VIP Assurance Citadel */}
          <div className="desktop-premium-trust-container" style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '800', color: '#059669', background: '#ecfdf5', padding: '8px 14px', borderRadius: '12px', border: '1px solid #a7f3d0' }}>
              <ShieldCheck size={16} color="#059669" /> 100% Genuine VIP Stock
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '800', color: '#0284c7', background: '#f0f9ff', padding: '8px 14px', borderRadius: '12px', border: '1px solid #bae6fd' }}>
              <Zap size={16} color="#0284c7" /> 10-Min Metro Express
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '800', color: '#7c3aed', background: '#f5f3ff', padding: '8px 14px', borderRadius: '12px', border: '1px solid #ddd6fe' }}>
              <Check size={16} color="#7c3aed" /> Easy 10-Day Exchange
            </div>
          </div>

          {/* AbKharido Platinum Member Offers */}
          <div style={{ marginTop: '24px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '18px', boxShadow: '0 4px 16px rgba(9, 13, 22, 0.03)' }}>
            <h4 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '16px', fontWeight: '900', color: '#090d16', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>💥</span> Available Platinum Bank & VIP Offers
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px', color: '#1e293b' }}>
                <span style={{ color: '#d97706', fontSize: '16px' }}>👑</span>
                <span><strong>VIP Partner Link Reward:</strong> Earn up to <strong style={{ color: '#d97706', fontWeight: '900' }}>{userCoins} Spendable Coins</strong> back on referral orders. <span style={{ color: '#4338ca', fontWeight: '800', cursor: 'pointer', textDecoration: 'underline' }}>View Benefits</span></span>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px', color: '#1e293b' }}>
                <span style={{ color: '#059669', fontSize: '16px' }}>⚡</span>
                <span><strong>Instant UPI & Bank Discount:</strong> Get ₹5,000 Instant Cashback via ICICI / HDFC / SBI Bank Cards or direct UPI QR verification. <span style={{ color: '#4338ca', fontWeight: '800', cursor: 'pointer', textDecoration: 'underline' }}>Apply Code</span></span>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px', color: '#1e293b' }}>
                <span style={{ color: '#3b82f6', fontSize: '16px' }}>🚀</span>
                <span><strong>Free VIP Air-Dispatch:</strong> Order immediately to unlock complimentary carbon-neutral express shipping across India.</span>
              </div>
            </div>
          </div>

          {/* Interactive Live PIN-Code Validator */}
          <div style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)', border: '1px solid #bfdbfe', borderRadius: '20px', padding: '20px', margin: '24px 0', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span style={{ fontSize: '18px' }}>📍</span>
              <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '15px', fontWeight: '800', color: '#1e3a8a' }}>Check India VIP Express Delivery Speed & Availability</span>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flex: '1', border: '2px solid #3b82f6', borderRadius: '14px', overflow: 'hidden', backgroundColor: 'white', minWidth: '220px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <input 
                  type="text" 
                  placeholder="Enter 6-digit Indian PIN code (e.g. 110001)" 
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                  maxLength="6"
                  style={{ border: 'none', padding: '12px 16px', fontSize: '14px', fontWeight: '700', outline: 'none', width: '100%', fontFamily: "'Outfit', sans-serif" }}
                />
                <button 
                  onClick={handlePincodeCheck}
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: 'white', border: 'none', padding: '0 24px', fontWeight: '800', fontSize: '14px', cursor: 'pointer', fontFamily: "'Outfit', sans-serif", transition: 'opacity 0.2s ease' }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  Verify Speed
                </button>
              </div>
            </div>
            <div style={{ fontSize: '13px', fontWeight: '800', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px', color: deliveryEstimate.includes('10-MIN') ? '#059669' : deliveryEstimate.includes('Invalid') ? '#e11d48' : '#1e3a8a' }}>
              {deliveryEstimate || "✨ Enter your postal code to see real-time dispatch countdowns."}
            </div>
          </div>

          {/* VIP Frequently Bought Together Combo Bundle */}
          {recommendations && recommendations.length >= 1 && (
            <div style={{ marginTop: '28px', background: 'linear-gradient(135deg, #ffffff 0%, #fef3c7 100%)', border: '2px solid #fde68a', borderRadius: '24px', padding: '24px', boxShadow: '0 10px 30px rgba(245, 158, 11, 0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '22px' }}>👑</span>
                  <h4 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '20px', fontWeight: '900', color: '#92400e', margin: 0, letterSpacing: '-0.3px' }}>
                    Frequently Bought Together VIP Combo
                  </h4>
                </div>
                <span style={{ background: '#e11d48', color: 'white', fontSize: '11px', fontWeight: '900', padding: '4px 10px', borderRadius: '10px' }}>
                  🔥 EXTRA COMBO DISCOUNT
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '20px' }}>
                {/* Item 1: This Product */}
                <div style={{ background: 'white', borderRadius: '16px', padding: '10px', width: '120px', textAlign: 'center', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <LazyImage src={product.image} alt={product.name} style={{ width: '80px', height: '80px', objectFit: 'contain', margin: '0 auto 6px auto' }} />
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#090d16', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</div>
                  <div style={{ fontSize: '13px', fontWeight: '900', color: '#059669' }}>₹{(currentDisplayPrice || 0).toLocaleString('en-IN')}</div>
                </div>

                <div style={{ fontSize: '24px', fontWeight: '900', color: '#d97706' }}>+</div>

                {/* Item 2: Recommended Product */}
                <div 
                  onClick={() => onNavigate(recommendations[0].id)}
                  style={{ background: 'white', borderRadius: '16px', padding: '10px', width: '120px', textAlign: 'center', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', cursor: 'pointer' }}
                >
                  <LazyImage src={recommendations[0].image} alt={recommendations[0].name} style={{ width: '80px', height: '80px', objectFit: 'contain', margin: '0 auto 6px auto' }} />
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#090d16', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{recommendations[0].name}</div>
                  <div style={{ fontSize: '13px', fontWeight: '900', color: '#059669' }}>₹{(recommendations[0].price || 0).toLocaleString('en-IN')}</div>
                </div>

                <div style={{ fontSize: '24px', fontWeight: '900', color: '#d97706' }}>=</div>

                {/* Combined Calculation */}
                <div style={{ flex: 1, minWidth: '180px' }}>
                  <div style={{ fontSize: '12px', color: '#92400e', fontWeight: '700' }}>Combined VIP Bundle Price:</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' }}>
                    <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '24px', fontWeight: '900', color: '#090d16' }}>
                      ₹{((currentDisplayPrice || 0) + (recommendations[0].price || 0) - Math.min(500, Math.round((currentDisplayPrice || 0)*0.05))).toLocaleString('en-IN')}
                    </span>
                    <span style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: '14px', fontWeight: '600' }}>
                      ₹{((currentDisplayPrice || 0) + (recommendations[0].price || 0)).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      addToCart({ ...product, price: currentDisplayPrice }, 1);
                      addToCart(recommendations[0], 1);
                      showToast('🎉 VIP Combo Bundle added to your shopping bag!', 'success');
                    }}
                    style={{
                      marginTop: '10px',
                      width: '100%',
                      background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '12px',
                      borderRadius: '14px',
                      fontFamily: "'Outfit', sans-serif",
                      fontWeight: '800',
                      fontSize: '14px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(217, 119, 6, 0.4)',
                      transition: 'transform 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    ⚡ Add Both to Cart & Save Extra
                  </button>
                </div>
              </div>
            </div>
          )}

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

    </>
  );
};

export default ProductDetails;
