import LazyImage from '../components/LazyImage';
/ eslint-disable-next-line
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Star, 
  ShoppingCart, 
  Zap, 
  Award, 
  Share2, 
  Copy, 
  Send,
  / eslint-disable-next-line
  ShieldAlert,
  ShieldCheck,
  Check,
  / eslint-disable-next-line
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


/ eslint-disable-next-line
const ProductDetails = ({ productId, onNavigate, onBuyNow, promotions }) => {
  const { addToCart, currentUser, showToast, products, orders, wishlist, toggleWishlist, isLoadingProducts } = useApp();
  const [copied, setCopied] = useState(false);
  const [pincode, setPincode] = useState(currentUser?.pincode || '400001');
  / Dynamic delivery estimate
  const getTomorrowDay = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });
  };
  const [deliveryEstimate, setDeliveryEstimate] = useState(
    currentUser?.pincode 
      ? `⚡ Fast Express Delivery to ${currentUser?.city || currentUser?.pincode} by ${getTomorrowDay()}` 
      : `Delivery by ${getTomorrowDay()} | Free Express Shipping`
  );

  React.useEffect(() => {
    if (currentUser?.pincode) {
      setPincode(currentUser.pincode);
      setDeliveryEstimate(`⚡ Fast Express Delivery to ${currentUser?.city || currentUser?.pincode} by ${getTomorrowDay()}`);
    }
  }, [currentUser]);

  React.useEffect(() => {
    document.body.classList.add('product-details-active');
    window.scrollTo(0, 0);

    const handleGlobalScroll = () => {
      / Show sticky CTA if scrolled past the main purchase buttons (approx 600px on mobile)
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

  / --- Dynamic Customer Reviews hooks ---
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
  const [selectedPhotos, setSelectedPhotos] = useState([]); / Base64 strings
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  React.useEffect(() => {
    localStorage.setItem(`product_${productId}_reviews`, JSON.stringify(reviewsList));
  }, [reviewsList, productId]);

  const wordCount = newComment.trim() === '' ? 0 : newComment.trim().split(/\s+/).length;

  / 1. Verified Purchaser Check: Has ordered this product and order status is not CANCELLED
  const hasPurchased = orders ? orders.some(order => 
    order && order.status !== 'CANCELLED' && 
    order.items?.some(item => item && item.product && item.product.id === productId)
  ) : false;

  / 2. Review count check: Max 2 reviews per product per user
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

    showToast(`⚡ Verifying express postal service for ${pincode}...`, 'info');
    fetch(`https://pi.postalpincode.in/pincode/${pincode}`)
      .then(res => res.json())
      .then(data => {
        if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
          const area = data[0].PostOffice[0].District || data[0].PostOffice[0].Name;
          setDeliveryEstimate(`⚡ ELIGIBLE FOR PRIORITY EXPRESS DELIVERY TO ${area.toUpperCase()} (${pincode}) by ${getTomorrowDay()}`);
          showToast(`⚡ Priority Express Delivery available in ${area}!`, 'success');
        } else {
          setDeliveryEstimate(`🚀 Standard Fast Dispatch Available for ${pincode} | Delivery by ${getTomorrowDay()}`);
          showToast('🚀 Doorstep Delivery confirmed!', 'success');
        }
      })
      .catch(() => {
        setDeliveryEstimate(`⚡ Guaranteed Express Delivery to ${pincode} by ${getTomorrowDay()}`);
      });
  };

  / Find product in list
  / Find product in list
  const productFromContext = products.find(p => p.id === productId);

  / Fallback to individual fetch if not in the first 100 products loaded by AppContext
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
    
    / Default model if no color models exist
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

  / Sync state when color selection triggers
  React.useEffect(() => {
    / eslint-disable-next-line
    if (activeColor) {
      setActiveImageIndex(0);
      setSelectedVariant(activeColor.variants[0]);
    }
  }, [selectedColor]);

  / Sync product selection on initial mount or swap
  const [recommendations, setRecommendations] = useState([]);
  
  React.useEffect(() => {
    if (product) {
      const models = getProductColorModels(product);
      setSelectedColor(models[0]);
      setSelectedVariant(models[0].variants[0]);
      setActiveImageIndex(0);

      / Fetch AI Recommendations
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

  / eslint-disable-next-line
  const discountPercent = product.originalPrice > 0
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const userCoins = Math.round((product.price || 0) * (product.userCommissionRate || 0.02));

  / Generate the unique referral tracking link
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
    / eslint-disable-next-line
    }).catch(err => {
      showToast('Failed to copy link.', 'error');
    });
  };

  const handleShareWhatsApp = () => {
    const text = `Hey! Check out this awesome ${product.name} on AbKharido: ${getReferralLink()}`;
    const url = `https://pi.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleShareTwitter = () => {
    const text = `Check out this product on AbKharido.com: ${product.name}`;
    const url = `https://witter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(getReferralLink())}`;
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
    <div className="container product-page-container animate-fade-in-only" style={{ paddingTop: '0', paddingBottom: '130px' }}>

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
                scrollbarWidth: 'none', / Firefox
                msOverflowStyle: 'none' / IE
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

          <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '14px', border: '1px solid #e2e8f0', textAlign: 'center', fontSize: '12px', color: '#64748b', fontWeight: '700', marginTop: '4px' }}>
            ✨ Tip: Touch or click thumbnails to inspect real studio angles & packaging
          </div>

          {/* 🔥 1-CLICK VIP ENTERPRISE ACTION HUB IN LEFT COLUMN (FLIPKART/APPLE STUDIO STYLE) */}
          <div className="action-buttons-container" style={{ marginTop: '16px', background: '#ffffff', border: '2px solid #e2e8f0', borderRadius: '24px', padding: '20px', boxShadow: '0 12px 32px rgba(9, 13, 22, 0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px dashed #e2e8f0', paddingBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Total Payable Amount:</span>
                <div style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', fontFamily: "'Outfit', sans-serif" }}>₹{(currentDisplayPrice || 0).toLocaleString('en-IN')} <span style={{ fontSize: '13px', color: '#059669', fontWeight: '700' }}>(Taxes Included)</span></div>
              </div>
              <span style={{ background: '#ecfdf5', color: '#047857', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '800', border: '1px solid #a7f3d0' }}>
                ✓ Express Dispatch Ready
              </span>
            </div>
            
            <div className="action-buttons-row" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  const customProduct = { ...product, price: currentDisplayPrice, originalPrice: currentDisplayOriginalPrice, selectedColor: activeColor ? activeColor.name : '', selectedVariant: activeVariant ? activeVariant.name : '' };
                  addToCart(customProduct);
                }}
                style={{
                  flex: '1 1 180px',
                  height: '52px',
                  border: '2px solid #4f46e5',
                  borderRadius: '16px',
                  background: '#ffffff',
                  color: '#4f46e5',
                  fontWeight: '900',
                  fontSize: '15px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontFamily: "'Outfit', sans-serif",
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: '0 4px 12px rgba(79, 70, 229, 0.1)'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#f5f3ff'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.transform = 'none'; }}
              >
                <ShoppingCart size={20} /> Add to Cart
              </button>
              <button
                onClick={() => {
                  const customProduct = { ...product, price: currentDisplayPrice, originalPrice: currentDisplayOriginalPrice, selectedColor: activeColor ? activeColor.name : '', selectedVariant: activeVariant ? activeVariant.name : '' };
                  addToCart(customProduct, 1);
                  onBuyNow(customProduct);
                }}
                style={{
                  flex: '1 1 180px',
                  height: '52px',
                  border: 'none',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
                  color: '#ffffff',
                  fontWeight: '900',
                  fontSize: '15px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontFamily: "'Outfit', sans-serif",
                  boxShadow: '0 10px 25px rgba(79, 70, 229, 0.4)',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 15px 32px rgba(79, 70, 229, 0.55)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(79, 70, 229, 0.4)'; }}
              >
                <Zap size={20} fill="white" /> Buy Now
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Details, Specifications and Affiliate Link */}
        <div className="details-info-column" style={{ padding: '0 4px' }}>
          
          {/* 1. Product Title */}
          <div style={{ marginBottom: '8px' }}>
            <h1 className="product-title-text desktop-premium-title" style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', lineHeight: '1.25', letterSpacing: '-0.3px', margin: 0 }}>
              {product.name}
            </h1>
          </div>

          {/* 2. Star Rating & Trust Verification Badge BEFORE Price (Flipkart / Amazon standard) */}
          <div className="product-ratings-row" style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 14px 0', flexWrap: 'wrap' }}>
            <span className="rating-tag" style={{ fontSize: '13px', padding: '4px 8px', borderRadius: '6px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#16a34a', color: 'white', boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)' }}>
              {product.rating} <Star size={12} fill="white" />
            </span>
            <span style={{ color: '#475569', fontSize: '13.5px', fontWeight: '600' }}>
              {(product.reviewsCount || 0).toLocaleString()} Verified Ratings &amp; Reviews
            </span>
            
            {/* Proprietary A-Assured Badge Graphic */}
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              height: '22px', 
              background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)', 
              color: 'white', 
              borderRadius: '4px', 
              padding: '0 8px', 
              fontSize: '10px', 
              fontWeight: '900', 
              fontStyle: 'italic', 
              letterSpacing: '0.3px',
              boxShadow: '0 2px 6px rgba(37,99,235,0.2)'
            }}>
              A-Assured <span style={{ color: '#ffe500', marginLeft: '3px', fontStyle: 'normal' }}>★</span>
            </div>
          </div>

          {/* 3. VIP Premium Price Card */}
          <div style={{ marginTop: '4px', padding: '16px', background: 'linear-gradient(135deg, #090d16 0%, #1e293b 100%)', borderRadius: '20px', color: 'white', boxShadow: '0 8px 24px rgba(9, 13, 22, 0.12)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', color: '#38bdf8' }}>💎 VIP Direct Manufacturer Offer</span>
              <span style={{ fontSize: '12px', color: '#16a34a', background: '#dcfce7', padding: '3px 10px', borderRadius: '20px', fontWeight: '900' }}>Save {currentDisplayDiscount}% Today</span>
            </div>
            
            <div className="desktop-premium-price-row" style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
              <span className="desktop-premium-price" style={{ fontSize: '32px', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.5px' }}>₹{currentDisplayPrice.toLocaleString('en-IN')}</span>
              <span className="desktop-premium-original" style={{ fontSize: '18px', color: '#94a3b8', textDecoration: 'line-through', fontWeight: '600' }}>₹{currentDisplayOriginalPrice.toLocaleString('en-IN')}</span>
            </div>

            <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', fontSize: '12.5px' }}>
              <span style={{ color: '#fde047', fontWeight: '800' }}>👑 VIP Member Price: ₹{Math.round(currentDisplayPrice * 0.93).toLocaleString('en-IN')} <span style={{ color: '#94a3b8', fontWeight: '500', fontSize: '11px' }}>(Extra 7% OFF via UPI)</span></span>
              <span style={{ background: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>In-Stock</span>
            </div>
          </div>

          {/* Smart EMI & Bank Savings Strip */}
          <div style={{ marginTop: '14px', background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)', border: '1px solid #bfdbfe', borderRadius: '16px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '22px' }}>💡</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#1e3a8a' }}>No-Cost EMI starting at ₹{Math.max(499, Math.round(currentDisplayPrice / 12)).toLocaleString('en-IN')}/mo</div>
                <div style={{ fontSize: '11.5px', color: '#475569', fontWeight: '600' }}>Instant cashback &amp; escrow savings on all bank cards</div>
              </div>
            </div>
            <span style={{ fontSize: '12px', color: '#2563eb', fontWeight: '800', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => showToast('💳 All Credit/Debit Cards accepted with Instant Bank Discount Cashback at Checkout!', 'success')}>
              View Plans
            </span>
          </div>

          {/* Real-time High-Demand Social Proof & Urgency Bar */}
          <div style={{ marginTop: '14px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '12px 16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#334155', fontWeight: '700' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444', display: 'inline-block', boxShadow: '0 0 6px #ef4444' }}></span>
              <span><strong>{(product._id?.charCodeAt(0) || 28) % 25 + 18} shoppers</strong> viewing right now</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#334155', fontWeight: '700' }}>
              <span style={{ fontSize: '16px' }}>⚡</span>
              <span><strong>{(product.reviewsCount || 15) * 2 + 24} orders</strong> shipped in last 24h</span>
            </div>
          </div>

          {isFlashSale && (
            <div style={{ marginTop: '12px', marginBottom: '12px' }}>
              <CountdownTimer endTime={product.flashSale.endTime} />
            </div>
          )}

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
              <Zap size={16} color="#0284c7" /> Priority Express Shipping
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '800', color: '#7c3aed', background: '#f5f3ff', padding: '8px 14px', borderRadius: '12px', border: '1px solid #ddd6fe' }}>
              <Check size={16} color="#7c3aed" /> Easy 7-Day Exchange
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
            <div style={{ fontSize: '13px', fontWeight: '800', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px', color: deliveryEstimate.includes('ELIGIBLE') ? '#059669' : deliveryEstimate.includes('Invalid') ? '#e11d48' : '#1e3a8a' }}>
              {deliveryEstimate || "✨ Enter your postal code to see real-time express dispatch countdowns."}
            </div>
          </div>

          {/* VIP Frequently Bought Together Combo Bundle */}
          {recommendations && recommendations.length >= 1 && (
            <div style={{ marginTop: '24px', background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', border: '1.5px solid #fde68a', borderRadius: '20px', padding: '20px', boxShadow: '0 6px 20px rgba(245, 158, 11, 0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px' }}>👑</span>
                  <h4 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '18px', fontWeight: '900', color: '#92400e', margin: 0 }}>
                    Frequently Bought Together Deal
                  </h4>
                </div>
                <span style={{ background: '#e11d48', color: 'white', fontSize: '11px', fontWeight: '800', padding: '4px 10px', borderRadius: '8px' }}>
                  ⚡ BUNDLE DISCOUNT ACTIVE
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', alignItems: 'stretch', marginBottom: '16px' }}>
                {/* Item 1: This Product */}
                <div style={{ background: 'white', borderRadius: '16px', padding: '12px', border: '1.5px solid #f3f4f6', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', justifyContent: 'center' }}>
                  <LazyImage src={product.image} alt={product.name} style={{ width: '70px', height: '70px', objectFit: 'contain', marginBottom: '8px' }} />
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{product.name}</div>
                  <div style={{ fontSize: '14px', fontWeight: '900', color: '#059669', marginTop: '4px' }}>₹{(currentDisplayPrice || 0).toLocaleString('en-IN')}</div>
                </div>

                {/* Item 2: Recommended Product */}
                <div 
                  onClick={() => onNavigate(recommendations[0].id)}
                  style={{ background: 'white', borderRadius: '16px', padding: '12px', border: '1.5px solid #f3f4f6', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', justifyContent: 'center', position: 'relative' }}
                >
                  <div style={{ position: 'absolute', top: '8px', right: '8px', background: '#d97706', color: 'white', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '13px', boxShadow: '0 2px 6px rgba(217,119,6,0.3)' }}>+</div>
                  <LazyImage src={recommendations[0].image} alt={recommendations[0].name} style={{ width: '70px', height: '70px', objectFit: 'contain', marginBottom: '8px' }} />
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{recommendations[0].name}</div>
                  <div style={{ fontSize: '14px', fontWeight: '900', color: '#059669', marginTop: '4px' }}>₹{(recommendations[0].price || 0).toLocaleString('en-IN')}</div>
                </div>
              </div>

              {/* Combined Calculation & CTA */}
              <div style={{ background: '#ffffff', padding: '14px 16px', borderRadius: '16px', border: '1px solid #fde68a', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontSize: '13px', color: '#92400e', fontWeight: '700' }}>Combined Bundle Savings:</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '22px', fontWeight: '900', color: '#0f172a' }}>
                      ₹{((currentDisplayPrice || 0) + (recommendations[0].price || 0) - Math.min(500, Math.round((currentDisplayPrice || 0)*0.05))).toLocaleString('en-IN')}
                    </span>
                    <span style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: '14px', fontWeight: '600' }}>
                      ₹{((currentDisplayPrice || 0) + (recommendations[0].price || 0)).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    addToCart({ ...product, price: currentDisplayPrice }, 1);
                    addToCart(recommendations[0], 1);
                    showToast('🎉 VIP Combo Bundle added to your shopping bag!', 'success');
                  }}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '14px',
                    borderRadius: '12px',
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: '800',
                    fontSize: '15px',
                    cursor: 'pointer',
                    boxShadow: '0 6px 18px rgba(217, 119, 6, 0.35)',
                    transition: 'transform 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  ⚡ Add Both to Cart &amp; Save ₹{Math.min(500, Math.round((currentDisplayPrice || 0)*0.05))} Extra
                </button>
              </div>
            </div>
          )}

          {/* 4-Pillars of India's Best E-Commerce Guarantee */}
          <div style={{ marginTop: '28px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '20px', boxShadow: '0 6px 24px rgba(9, 13, 22, 0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <ShieldCheck size={22} color="#2563eb" />
              <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '16px', fontWeight: '900', color: '#0f172a' }}>
                AbKharido Platinum Buyer Assurance Guarantee
              </span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '14px', border: '1px solid #f1f5f9', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '20px' }}>🛡️</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>Cashfree Escrow Protected</div>
                  <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px', lineHeight: 1.4 }}>Funds are held securely in bank escrow until delivery is verified.</div>
                </div>
              </div>

              <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '14px', border: '1px solid #f1f5f9', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '20px' }}>⚡</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>Direct Manufacturer Deal</div>
                  <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px', lineHeight: 1.4 }}>100% genuine brand stock shipped without middleman markup.</div>
                </div>
              </div>

              <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '14px', border: '1px solid #f1f5f9', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '20px' }}>🚚</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>All-India Air-Dispatch</div>
                  <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px', lineHeight: 1.4 }}>Express transit across India with live SMS order tracking.</div>
                </div>
              </div>

              <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '14px', border: '1px solid #f1f5f9', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '20px' }}>🔄</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>7-Day Replacement Policy</div>
                  <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px', lineHeight: 1.4 }}>Hassle-free replacement guarantee under warranty protection.</div>
                </div>
              </div>
            </div>
          </div>



          {/* 📦 TITANIUM SPECIFICATION SHIELD & WHAT'S IN THE BOX */}
          <details className="pdp-vip-accordion" style={{ marginTop: '28px', background: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 16px rgba(9, 13, 22, 0.03)' }}>
            <summary style={{ background: 'linear-gradient(135deg, #090d16 0%, #1e293b 100%)', padding: '18px 24px', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', listStyle: 'none', cursor: 'pointer' }}>
              <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '18px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} color="#fde047" /> Technical Specifications & Box Assurance
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: '12px', fontWeight: '700' }}>Verified Original Stock</span>
                <span className="vip-accordion-icon" style={{ fontSize: '20px', fontWeight: 'bold', color: '#fde047' }}>+</span>
              </div>
            </summary>

            <div style={{ padding: '24px', borderTop: '1px solid #e2e8f0' }}>
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#090d16', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Product Overview</h4>
                <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.7', margin: 0, fontWeight: '500' }}>
                  {product.description || "Designed with cutting-edge craftsmanship and flagship engineering. Built for uncompromising endurance, speed, and premium feel. Protected by AbKharido's nationwide 7-Day Replacement Guarantee."}
                </p>
              </div>

              <div style={{ marginBottom: '20px', background: '#f8fafc', borderRadius: '16px', padding: '16px', border: '1px solid #f1f5f9' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#090d16', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px', margin: '0 0 10px 0' }}>
                  <span>📦</span> What's Inside The Certified Sealed Box:
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>✅ 1x Original Sealed Unit</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>✅ Certified Brand Adapter / Accessory</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>✅ Official Brand Warranty Documentation</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>✅ AbKharido VIP Club Authentication Seal</div>
                </div>
              </div>

              <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#090d16', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Detailed Technical Specifications</h4>
              <table className="specs-table" style={{ width: '100%', borderCollapse: 'collapse', borderRadius: '12px', overflow: 'hidden' }}>
                <tbody>
                  {(product.specifications && product.specifications.length > 0 ? product.specifications : [
                    { key: "Brand Assurance", value: "100% Genuine Direct Warehouse Inventory" },
                    { key: "Replacement Guarantee", value: "7-Day Easy Hassle-Free Replacement Policy" },
                    { key: "Shipping Speed", value: "Priority Express Dispatch via Air / Surface" },
                    { key: "Customer Support", value: "24/7 Toll-Free (1800-888-9999) & Live WhatsApp VIP Chat" }
                  ]).map((spec, index) => (
                    <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#f8fafc' : '#ffffff', borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', fontWeight: '700', color: '#64748b', width: '35%', fontSize: '13px' }}>{spec.key}</td>
                      <td style={{ padding: '12px 16px', fontWeight: '800', color: '#0f172a', fontSize: '13px' }}>{spec.value}</td>
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

          {/* Share & Earn Panel (Affiliate/Referral) - Sleek Creator Banner */}
          <div className="share-earn-box" style={{ marginTop: '24px', background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', border: '1.5px solid #bbf7d0', borderRadius: '20px', padding: '18px', boxShadow: '0 4px 14px rgba(22, 163, 74, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Award size={18} color="white" />
                </div>
                <span style={{ fontSize: '16px', fontWeight: '900', color: '#166534' }}>Creator &amp; Partner Reward</span>
              </div>
              <div style={{ background: '#ffffff', border: '1px solid #86efac', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '800', color: '#15803d' }}>
                Earn <strong>{userCoins} AB Coins</strong> per sale
              </div>
            </div>
            
            <p style={{ fontSize: '13px', color: '#15803d', margin: '0 0 14px 0', fontWeight: '500', lineHeight: '1.4' }}>
              Share your verified affiliate link with friends or on social media. Earn instant reward cashback when anyone checks out!
            </p>

            {/* Custom Link Copy Section */}
            {currentUser ? (
               <div className="share-link-generator" style={{ display: 'flex', gap: '8px', background: 'white', padding: '6px', borderRadius: '14px', border: '1px solid #86efac', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                 <input 
                   type="text" 
                   className="share-link-input" 
                   readOnly 
                   value={getReferralLink()} 
                   onClick={(e) => e.target.select()}
                   style={{ flex: 1, border: 'none', background: 'transparent', padding: '0 10px', fontSize: '13px', fontWeight: '600', color: '#334155', outline: 'none' }}
                 />
                 <button 
                   type="button"
                   style={{ background: '#16a34a', color: 'white', border: 'none', borderRadius: '10px', padding: '10px 18px', fontSize: '13px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
                   onClick={handleCopyLink}
                 >
                   {copied ? <Check size={16} /> : <Copy size={16} />}
                   <span>{copied ? 'Copied Link' : 'Copy Link'}</span>
                 </button>
               </div>
             ) : (
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '12px 16px', borderRadius: '14px', border: '1px solid #86efac', flexWrap: 'wrap', gap: '10px' }}>
                 <span style={{ fontSize: '13px', color: '#166534', fontWeight: '700' }}>
                   🔒 Log in to activate your unique monetized link
                 </span>
                 <button 
                   style={{ background: '#16a34a', color: 'white', border: 'none', borderRadius: '10px', padding: '8px 16px', fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}
                   onClick={() => onNavigate('login')}
                 >
                   Activate &amp; Earn
                 </button>
               </div>
             )}

            {/* Social Sharing */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed #bbf7d0', flexWrap: 'wrap', gap: '10px' }}>
              <span style={{ fontSize: '12.5px', color: '#166534', fontWeight: '700' }}>⚡ One-Tap Social Sharing:</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" onClick={handleShareWhatsApp} style={{ background: '#25D366', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <Send size={14} fill="white" /> WhatsApp
                </button>
                <button type="button" onClick={handleShareTwitter} style={{ background: '#000000', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <Share2 size={14} /> Twitter / X
                </button>
              </div>
            </div>
          </div>


          </div>

          </div>

        </div>

        {/* 🚀 GLOBAL FIXED VIP ENTERPRISE PURCHASE RIBBON (STICKY BUY BAR FOR INSTANT 1-CLICK BUY) */}
        <div className="vip-fixed-bottom-purchase-bar" style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'rgba(255, 255, 255, 0.97)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '2px solid #e2e8f0',
          boxShadow: '0 -10px 40px rgba(9, 13, 22, 0.14)',
          zIndex: 1400,
          padding: '12px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          {/* Left Side: Product Micro-Preview */}
          <div className="vip-fixed-bar-left" style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0, flex: '1 1 auto' }}>
            <img 
              src={product.image || (product.images && product.images[0]) || ''} 
              alt={product.name} 
              style={{ width: '52px', height: '52px', objectFit: 'contain', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '2px', flexShrink: 0 }}
            />
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: "'Outfit', sans-serif" }}>
                {product.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '20px', fontWeight: '900', color: '#059669', fontFamily: "'Outfit', sans-serif" }}>
                  ₹{(currentDisplayPrice || 0).toLocaleString('en-IN')}
                </span>
                <span style={{ fontSize: '11px', background: '#ecfdf5', color: '#047857', padding: '2px 8px', borderRadius: '6px', fontWeight: '800', border: '1px solid #a7f3d0' }}>
                  ✓ Express Dispatch Ready
                </span>
              </div>
            </div>
          </div>

          {/* Right Side: Instant Action Purchase Buttons (Fixed & Easily Accessible on ALL Devices) */}
          <div className="vip-fixed-bar-right" style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
            <button
              onClick={() => {
                const customProduct = { ...product, price: currentDisplayPrice, originalPrice: currentDisplayOriginalPrice, selectedColor: activeColor ? activeColor.name : '', selectedVariant: activeVariant ? activeVariant.name : '' };
                addToCart(customProduct);
              }}
              style={{
                height: '50px',
                padding: '0 26px',
                border: '2px solid #4f46e5',
                borderRadius: '16px',
                background: '#ffffff',
                color: '#4f46e5',
                fontWeight: '900',
                fontSize: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontFamily: "'Outfit', sans-serif",
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(79, 70, 229, 0.1)',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f5f3ff'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.transform = 'none'; }}
            >
              <ShoppingCart size={20} /> <span className="buy-bar-btn-text">Add to Cart</span>
            </button>
            <button
              onClick={() => {
                const customProduct = { ...product, price: currentDisplayPrice, originalPrice: currentDisplayOriginalPrice, selectedColor: activeColor ? activeColor.name : '', selectedVariant: activeVariant ? activeVariant.name : '' };
                addToCart(customProduct, 1);
                onBuyNow(customProduct);
              }}
              style={{
                height: '50px',
                padding: '0 32px',
                border: 'none',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
                color: '#ffffff',
                fontWeight: '900',
                fontSize: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontFamily: "'Outfit', sans-serif",
                boxShadow: '0 8px 25px rgba(79, 70, 229, 0.4)',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 14px 30px rgba(79, 70, 229, 0.55)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(79, 70, 229, 0.4)'; }}
            >
              <Zap size={20} fill="white" /> <span>Buy Now</span>
            </button>
          </div>
        </div>

    </>
  );
};

export default ProductDetails;
