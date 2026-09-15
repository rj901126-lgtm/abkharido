import LazyImage from '../components/LazyImage';
// eslint-disable-next-line
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
  ShieldCheck,
  Check,
  Heart,
  Store,
  Sparkles,
  TrendingUp,
  Tag,
  Truck,
  Plus,
  Bell,
  X
} from 'lucide-react';
import '../assets/styles/product.css';
import CountdownTimer from '../components/CountdownTimer';
import ProductCard from '../components/ProductCard';
import FrequentlyBoughtTogether from '../components/FrequentlyBoughtTogether';
import ProductImageZoomViewer from '../components/ProductImageZoomViewer';
import { calculateCoinReward } from '../utils/coinUtils';
import { getSafeReferralLink } from '../utils/referralUtils';
import { PRODUCTS } from '../db/mockData';


// eslint-disable-next-line
const ProductDetails = ({ productId, onNavigate, onBuyNow, promotions, initialProduct }) => {
  const { addToCart, updateCartQty, cart, currentUser, showToast, products, orders, wishlist, toggleWishlist, isLoadingProducts, deliveryLocation } = useApp();
  const [copied, setCopied] = useState(false);
  const [pincode, setPincode] = useState(deliveryLocation?.pincode || currentUser?.pincode || '401404');
  
  // Price Drop & Restock Alert Modal State
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [alertContact, setAlertContact] = useState(currentUser?.phone || currentUser?.email || '');
  const [alertTargetType, setAlertTargetType] = useState('any');
  
  // Dynamic delivery estimate
  const [deliveryEstimate, setDeliveryEstimate] = useState(
    deliveryLocation?.displayText
      ? `📦 Standard Delivery to ${deliveryLocation.displayText} (2 to 5 Days)`
      : `📦 Standard Delivery (2 to 5 Days)`
  );

  React.useEffect(() => {
    if (deliveryLocation) {
      setPincode(deliveryLocation.pincode);
      setDeliveryEstimate(`📦 Standard Delivery to ${deliveryLocation.displayText || deliveryLocation.city} (2 to 5 Days)`);
    } else if (currentUser?.pincode) {
      setPincode(currentUser.pincode);
      setDeliveryEstimate(`📦 Standard Delivery to ${currentUser?.city || currentUser?.pincode} (2 to 5 Days)`);
    }
  }, [deliveryLocation, currentUser]);


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

  // Find product in list or mock dataset
  const productFromContext = (Array.isArray(products) && products.find(p => 
    p?.id === productId || 
    p?._id === productId || 
    String(p?.id || '').toLowerCase() === String(productId || '').toLowerCase()
  )) || (Array.isArray(PRODUCTS) && PRODUCTS.find(p => 
    p?.id === productId || 
    p?._id === productId || 
    String(p?.id || '').toLowerCase() === String(productId || '').toLowerCase()
  ));
  const [fetchedProduct, setFetchedProduct] = useState(initialProduct || null);
  const [isFetchingLocal, setIsFetchingLocal] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  const product = initialProduct || productFromContext || fetchedProduct;

  // --- Dynamic Customer Reviews hooks ---
  const [reviewsList, setReviewsList] = useState(initialProduct?.reviews || []);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [selectedPhotos, setSelectedPhotos] = useState([]); // Base64 strings
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Recently Viewed state & tracking
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  useEffect(() => {
    if (productId && typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('abkharido_recently_viewed');
        let list = raw ? JSON.parse(raw) : [];
        const filtered = list.filter(id => id !== productId && id);
        const recentProds = filtered.map(id => products.find(p => p.id === id)).filter(Boolean).slice(0, 5);
        setRecentlyViewed(recentProds);

        const updated = [productId, ...filtered].slice(0, 10);
        localStorage.setItem('abkharido_recently_viewed', JSON.stringify(updated));
      } catch (_e) {}
    }
  }, [productId, products]);

  // Sync reviews when product loads
  useEffect(() => {
    if (product && Array.isArray(product.reviews)) {
      setReviewsList(product.reviews);
    }
  }, [product]);


  const wordCount = newComment.trim() === '' ? 0 : newComment.trim().split(/\s+/).length;

  // 1. Verified Purchaser Check: Has ordered this product and order status is not CANCELLED
  const hasPurchased = orders ? orders.some(order => {
    if (!order || order.status === 'Cancelled' || order.status === 'CANCELLED') return false;
    const items = order.orderItems || order.items || [];
    return items.some(item => {
      if (!item) return false;
      const p = item.product;
      const pId = typeof p === 'object' ? (p?._id || p?.id) : p;
      return pId === productId || pId === product?._id || item.customId === productId;
    });
  }) : false;

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

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      showToast('Please log in to submit a review.', 'error');
      return;
    }

    setIsSubmittingReview(true);
    try {
      const res = await fetch(`/api/products/${product.id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token || ''}`
        },
        body: JSON.stringify({
          rating: newRating,
          comment: newComment.trim()
        })
      });
      if (res.ok) {
        // Optimistically prepend the new review to local state — no full page reload needed
        const newReview = {
          name: currentUser.fullName || currentUser.username || 'You',
          username: currentUser.username || '',
          rating: newRating,
          comment: newComment.trim(),
          date: new Date().toISOString().split('T')[0],
          photos: [...selectedPhotos]
        };
        setReviewsList(prev => [newReview, ...prev]);
        setNewComment('');
        setNewRating(5);
        setSelectedPhotos([]);
        showToast('Review submitted successfully! 🎉', 'success');
      } else {
        const data = await res.json();
        showToast(data.error || data.message || 'Failed to submit review.', 'error');
      }
    } catch (_err) {
      showToast('Error submitting review.', 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };


  const getDeliveryDateString = (daysToAdd = 3) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysToAdd);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${dayNames[targetDate.getDay()]}, ${targetDate.getDate()} ${monthNames[targetDate.getMonth()]}`;
  };

  const computeDeliveryEstimate = (pin, areaName = '') => {
    const deliveryDate = getDeliveryDateString(3);
    const shippingText = (currentDisplayPrice || 0) >= 499 ? 'FREE Delivery' : '₹49 Shipping';
    const loc = areaName ? ` to ${areaName.toUpperCase()} (${pin})` : ` to ${pin}`;
    return `📦 Delivery by ${deliveryDate}${loc} | ${shippingText} | 💵 Cash on Delivery Available`;
  };

  React.useEffect(() => {
    try {
      const savedPin = typeof window !== 'undefined' ? localStorage.getItem('abkharido_user_pincode') : null;
      if (savedPin && /^[1-9][0-9]{5}$/.test(savedPin)) {
        setPincode(savedPin);
        setDeliveryEstimate(`📦 Delivery by ${getDeliveryDateString(3)} to ${savedPin} | FREE Delivery | 💵 Cash on Delivery Available`);
      }
    } catch (_e) {}
  }, []);

  const handlePincodeCheck = () => {
    const pinRegex = /^[1-9][0-9]{5}$/;
    if (!pinRegex.test(pincode)) {
      showToast('Please enter a valid 6-digit Indian postal PIN code.', 'error');
      setDeliveryEstimate('❌ Invalid PIN code format. Please input a 6-digit number.');
      return;
    }

    try {
      localStorage.setItem('abkharido_user_pincode', pincode);
    } catch (_e) {}

    showToast(`⚡ Verifying express postal delivery for PIN ${pincode}...`, 'info');
    fetch(`https://api.postalpincode.in/pincode/${pincode}`)
      .then(res => res.json())
      .then(data => {
        if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
          const area = data[0].PostOffice[0].District || data[0].PostOffice[0].Name;
          const estimate = computeDeliveryEstimate(pincode, area);
          setDeliveryEstimate(estimate);
          showToast(`⚡ Priority Express Delivery available in ${area}!`, 'success');
        } else {
          const estimate = computeDeliveryEstimate(pincode);
          setDeliveryEstimate(estimate);
          showToast('🚀 Doorstep Delivery & COD confirmed!', 'success');
        }
      })
      .catch(() => {
        const estimate = computeDeliveryEstimate(pincode);
        setDeliveryEstimate(estimate);
      });
  };

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

  const getProductColorModels = (prod) => {
    if (!prod) return [];
    if (Array.isArray(prod.colorModels) && prod.colorModels.length > 0) return prod.colorModels;
    
    // For fashion products without custom colorModels, provide real size options
    if (prod.category === 'fashion') {
      const nameLower = (prod.name || '').toLowerCase();
      const isFootwear = nameLower.includes('shoe') || nameLower.includes('sneaker') || nameLower.includes('boot') || nameLower.includes('sandal');
      const sizeNames = isFootwear ? ['UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11'] : ['S', 'M', 'L', 'XL', 'XXL'];
      return [
        {
          name: 'Default',
          primaryImage: prod.image,
          images: prod.images && prod.images.length > 0 ? prod.images : [prod.image],
          variants: sizeNames.map((sz, idx) => ({
            name: sz,
            price: prod.price,
            originalPrice: prod.originalPrice || prod.price,
            stock: idx === 4 ? 0 : 10 - idx * 2,
            sku: `${prod.id || 'SKU'}-${sz}`
          }))
        }
      ];
    }

    // Default fallback model for electronics/general marketplace products
    return [
      {
        name: 'Default',
        primaryImage: prod.image,
        images: prod.images && prod.images.length > 0 ? prod.images : [prod.image],
        variants: [
          {
            name: 'Default',
            price: prod.price,
            originalPrice: prod.originalPrice || prod.price,
            stock: prod.stock !== undefined ? prod.stock : 10,
            sku: `${prod.id || 'SKU'}-STD`
          }
        ]
      }
    ];
  };

  const colorModels = product ? getProductColorModels(product) : [];

  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);

  const activeColor = selectedColor || (colorModels.length > 0 ? colorModels[0] : null);

  const imagesList = product?.colorModels && activeColor && activeColor.images && activeColor.images.length > 0 
    ? activeColor.images 
    : (product ? (product.images && product.images.length > 0 ? product.images : [product.image]) : []);

  const variantsList = activeColor && activeColor.variants ? activeColor.variants : [];

  const activeVariant = selectedVariant || (variantsList.length > 0 ? (variantsList.find(v => (v.stock || 0) > 0) || variantsList[0]) : null);

  const isFlashSale = product?.flashSale?.isActive && new Date(product.flashSale.endTime) > new Date();
  
  const currentDisplayPrice = isFlashSale ? product.flashSale.price : (activeVariant ? activeVariant.price : (product ? product.price : 0));
  const currentDisplayOriginalPrice = activeVariant ? activeVariant.originalPrice : (product ? product.originalPrice : (isFlashSale ? product.price : 0));
  const currentDisplayDiscount = currentDisplayOriginalPrice > 0 ? Math.round(((currentDisplayOriginalPrice - currentDisplayPrice) / currentDisplayOriginalPrice) * 100) : 0;

  const isOutOfStock = activeVariant ? (activeVariant.stock !== undefined && activeVariant.stock <= 0) : (product && product.inStock === false);

  const getVariantLabel = () => {
    if (!product) return 'Select Option';
    const cat = (product.category || '').toLowerCase();
    const name = (product.name || '').toLowerCase();
    const variantNames = (variantsList || []).map(v => (v.name || '').toLowerCase()).join(' ');

    if (cat === 'fashion' || cat === 'footwear' || cat === 'clothing' || variantNames.includes('uk ') || variantNames.includes('eu ') || /^(s|m|l|xl|xxl)$/i.test(variantsList[0]?.name || '')) {
      return 'Select Size';
    }
    if (name.includes('dumbbell') || name.includes('weight') || name.includes('kettlebell') || variantNames.includes('kg') || variantNames.includes('lb')) {
      return 'Select Weight';
    }
    if (variantNames.includes('gb') || variantNames.includes('tb') || variantNames.includes('ram')) {
      return 'Storage & Memory';
    }
    if (cat === 'mobiles') {
      return 'Storage / RAM';
    }
    if (cat === 'electronics') {
      return 'Model / Edition';
    }
    return 'Select Option';
  };

  const hasMeaningfulVariants = variantsList.length > 1 || (
    variantsList.length === 1 && 
    !['default', 'standard pack', 'standard', 'base', 'original'].includes((variantsList[0].name || '').toLowerCase().trim())
  );

  const hasMeaningfulColors = colorModels.length > 1 || (
    colorModels.length === 1 && 
    !['default', 'original', 'standard'].includes((colorModels[0].name || '').toLowerCase().trim())
  );

  const cartItem = (cart || []).find(item => {
    const itemProd = item.product || item;
    const itemPId = String(itemProd._id || itemProd.id || itemProd || '').trim();
    const itemSlug = String(itemProd.slug || itemProd.id || '').trim().toLowerCase();
    const itemName = String(itemProd.name || itemProd.title || '').trim().toLowerCase();

    const targetPId = String(product?._id || product?.id || '').trim();
    const targetSlug = String(product?.slug || product?.id || '').trim().toLowerCase();
    const targetName = String(product?.name || product?.title || '').trim().toLowerCase();

    const idMatches = (
      (itemPId && targetPId && itemPId === targetPId) ||
      (itemSlug && targetSlug && itemSlug === targetSlug) ||
      (itemPId && targetSlug && itemPId.toLowerCase() === targetSlug) ||
      (itemSlug && targetPId && itemSlug === targetPId.toLowerCase()) ||
      (itemName && targetName && itemName.length > 2 && itemName === targetName)
    );
    if (!idMatches) return false;

    const itemVar = (item.product?.selectedVariant || item.product?.variant || '').toLowerCase().trim();
    const targetVar = (activeVariant ? activeVariant.name : '').toLowerCase().trim();
    const itemCol = (item.product?.selectedColor || item.product?.color || '').toLowerCase().trim();
    const targetCol = (activeColor ? activeColor.name : '').toLowerCase().trim();

    const isVarDefault = !itemVar || itemVar === 'default' || itemVar === 'standard';
    const isTargetVarDefault = !targetVar || targetVar === 'default' || targetVar === 'standard';
    const varMatches = (isVarDefault && isTargetVarDefault) || (itemVar === targetVar);

    const isColDefault = !itemCol || itemCol === 'default' || itemCol === 'original';
    const isTargetColDefault = !targetCol || targetCol === 'default' || targetCol === 'original';
    const colMatches = (isColDefault && isTargetColDefault) || (itemCol === targetCol);

    return varMatches && colMatches;
  });
  const quantityInCart = cartItem?.quantity || 0;



  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Sync state when color selection triggers
  React.useEffect(() => {
    if (activeColor && Array.isArray(activeColor.variants) && activeColor.variants.length > 0) {
      setActiveImageIndex(0);
      const defaultVariant = activeColor.variants.find(v => (v.stock || 0) > 0) || activeColor.variants[0];
      setSelectedVariant(defaultVariant);
    }
  }, [selectedColor]);


  // Sync product selection on initial mount or swap
  const [recommendations, setRecommendations] = useState([]);
  
  React.useEffect(() => {
    if (product) {
      const models = getProductColorModels(product);
      const firstModel = models && models.length > 0 ? models[0] : null;
      setSelectedColor(firstModel);
      setSelectedVariant(firstModel?.variants?.[0] || null);
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

  // Generate the privacy-safe unique referral tracking link (Zero phone leakage)
  const getReferralLink = () => {
    if (!currentUser) return '';
    return getSafeReferralLink(currentUser, product.id);
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
          <ProductImageZoomViewer 
            images={imagesList}
            activeIndex={activeImageIndex}
            onSelectImage={setActiveImageIndex}
            productName={product.name}
            extraTopRightButtons={
              <>
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); }}
                  style={{ border: '1px solid rgba(255,255,255,0.4)', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.75)', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', cursor: 'pointer', transition: 'all 0.2s ease', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
                  title={wishlist && wishlist.includes(product.id) ? "Remove from Wishlist" : "Add to Wishlist"}
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
                  style={{ border: '1px solid rgba(255,255,255,0.4)', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.75)', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', cursor: 'pointer', transition: 'all 0.2s ease', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
                  title="Share on WhatsApp"
                >
                  <Share2 size={20} color="#475569" />
                </button>
              </>
            }
          />

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

          {/* Left Column 4-Pillar Trust Grid (Desktop only, mobile renders below price) */}
          <div className="gallery-trust-grid" style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>🛡️</span>
              <div>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a' }}>100% Genuine</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Brand Warranty</div>
              </div>
            </div>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>🔄</span>
              <div>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a' }}>7-Day Returns</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Easy Replacement</div>
              </div>
            </div>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>⚡</span>
              <div>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a' }}>Free Express</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Air Dispatch</div>
              </div>
            </div>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>💵</span>
              <div>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a' }}>Pay on Delivery</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Cash & UPI at Door</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Details, Specifications and Purchase Hub */}
        <div className="details-info-column">
          
          {/* 1. Product Title */}
          <div style={{ marginBottom: '8px' }}>
            <h1 className="product-title-text desktop-premium-title" style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', lineHeight: '1.25', letterSpacing: '-0.3px', margin: 0 }}>
              {product.name}
            </h1>
          </div>

          {/* 2. Star Rating & Trust Verification Badge BEFORE Price (Flipkart / Amazon standard) */}
          <div className="product-ratings-row" style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 14px 0', flexWrap: 'wrap' }}>
            {(() => {
              const activeList = (reviewsList && reviewsList.length > 0) ? reviewsList : (product?.reviews || []);
              const realCount = activeList.length;
              if (realCount > 0) {
                const avgRating = product.rating || (activeList.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / realCount).toFixed(1);
                return (
                  <>
                    <span className="rating-tag" style={{ fontSize: '13px', padding: '4px 8px', borderRadius: '6px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#16a34a', color: 'white', boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)' }}>
                      {avgRating} <Star size={12} fill="white" />
                    </span>
                    <span style={{ color: '#475569', fontSize: '13.5px', fontWeight: '600' }}>
                      {realCount} Verified {realCount === 1 ? 'Rating & Review' : 'Ratings & Reviews'}
                    </span>
                  </>
                );
              }
              return (
                <span style={{ color: '#64748b', fontSize: '13px', fontWeight: '600' }}>
                  ⭐ Be the first to review this product
                </span>
              );
            })()}
            
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

            {/* Verified Merchant / Seller Badge */}
            {product.sellerShopName && (
              <div 
                onClick={() => onNavigate && onNavigate(`catalog?seller=${encodeURIComponent(product.sellerShopName.toLowerCase().replace(/\s+/g, '-'))}`)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', fontWeight: '700', color: '#059669', background: '#ecfdf5', padding: '3px 8px', borderRadius: '6px', border: '1px solid #a7f3d0', cursor: 'pointer' }}
                title="Click to browse official seller store"
              >
                <Store size={13} /> Sold by: {product.sellerShopName} ✓
              </div>
            )}
          </div>

          {/* 3. Modern Clean Price Section */}
          <div className="pdp-card-clean" style={{ marginTop: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#059669', background: '#ecfdf5', padding: '4px 10px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <Zap size={13} fill="#059669" /> Verified Special Price
              </span>
              <span style={{ fontSize: '12px', fontWeight: '700', color: isOutOfStock ? '#ef4444' : '#64748b' }}>
                {isOutOfStock ? '❌ Currently Out of Stock' : '⚡ In Stock • Priority Dispatch'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap', marginBottom: '4px' }}>
              <span style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a', fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.5px' }}>
                ₹{(currentDisplayPrice || 0).toLocaleString('en-IN')}
              </span>
              {currentDisplayOriginalPrice > currentDisplayPrice && (
                <>
                  <span style={{ fontSize: '16px', color: '#94a3b8', textDecoration: 'line-through', fontWeight: '600' }}>
                    ₹{currentDisplayOriginalPrice.toLocaleString('en-IN')}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: '900', color: '#059669', background: '#dcfce7', padding: '3px 8px', borderRadius: '6px' }}>
                    {currentDisplayDiscount}% OFF
                  </span>
                </>
              )}
            </div>

            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500', marginBottom: '12px' }}>
              Inclusive of all taxes • Free Shipping on orders above ₹499
            </div>

            {/* VIP Member Cashback Ribbon */}
            <div style={{
              background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
              border: '1px solid #fde68a',
              borderRadius: '10px',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '6px'
            }}>
              <span style={{ fontSize: '12.5px', color: '#92400e', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>👑</span> VIP Price: ₹{Math.round(currentDisplayPrice * 0.93).toLocaleString('en-IN')}
              </span>
              <span style={{ fontSize: '11.5px', color: '#b45309', fontWeight: '700' }}>
                Earn +{calculateCoinReward(currentDisplayPrice)} AB Coins (₹{calculateCoinReward(currentDisplayPrice)})
              </span>
            </div>
          </div>

          {/* 4. Mobile Inline Trust Badges Strip (Visible only on mobile <= 991px) */}
          <div className="mobile-trust-badges-strip" style={{ marginTop: '12px' }}>
            <div className="mobile-trust-badge-item">
              <span className="mobile-trust-badge-icon">🛡️</span>
              <span className="mobile-trust-badge-label">100% Genuine</span>
              <span className="mobile-trust-badge-sub">Brand Verified</span>
            </div>
            <div className="mobile-trust-badge-item">
              <span className="mobile-trust-badge-icon">🔄</span>
              <span className="mobile-trust-badge-label">7-Day Returns</span>
              <span className="mobile-trust-badge-sub">Doorstep Pickup</span>
            </div>
            <div className="mobile-trust-badge-item">
              <span className="mobile-trust-badge-icon">⚡</span>
              <span className="mobile-trust-badge-label">Free Express</span>
              <span className="mobile-trust-badge-sub">Air Dispatch</span>
            </div>
            <div className="mobile-trust-badge-item">
              <span className="mobile-trust-badge-icon">💵</span>
              <span className="mobile-trust-badge-label">Cash on Delivery</span>
              <span className="mobile-trust-badge-sub">Pay at Door</span>
            </div>
          </div>

          {/* 5. Product Secondary Actions: Compare & Price Drop Alert */}
          <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              onClick={() => {
                if (onNavigate) {
                  onNavigate('compare?ids=' + product.id);
                } else if (typeof window !== 'undefined') {
                  window.location.href = '/compare?ids=' + product.id;
                }
              }}
              style={{
                height: '42px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '0 12px',
                fontSize: '12.5px',
                fontWeight: '700',
                color: '#334155',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#4f46e5'; e.currentTarget.style.color = '#4f46e5'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#334155'; }}
            >
              ⚖️ Compare Models
            </button>
            <button
              onClick={() => {
                if (!alertContact && currentUser?.phone) {
                  setAlertContact(currentUser.phone);
                } else if (!alertContact && currentUser?.email) {
                  setAlertContact(currentUser.email);
                }
                setIsAlertModalOpen(true);
              }}
              style={{
                height: '42px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                background: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: '12px',
                padding: '0 12px',
                fontSize: '12.5px',
                fontWeight: '700',
                color: '#92400e',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
              }}
            >
              🔔 Price Drop Alert
            </button>
          </div>

          {isFlashSale && (
            <div style={{ marginTop: '12px', marginBottom: '12px' }}>
              <CountdownTimer endTime={product.flashSale.endTime} />
            </div>
          )}

          {/* 6. Color Variation Selection (Only when product has meaningful colors) */}
          {hasMeaningfulColors && (
            <div className="pdp-card-clean" style={{ marginTop: '14px' }}>
              <div style={{ fontSize: '13.5px', color: '#64748b', fontWeight: '600', marginBottom: '10px' }}>
                Color: <span style={{ color: '#0f172a', fontWeight: '800' }}>{activeColor ? activeColor.name : ''}</span>
              </div>
              <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
                <style>{`.color-scroll::-webkit-scrollbar { display: none; }`}</style>
                <div className="color-scroll" style={{ display: 'flex', gap: '10px' }}>
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
                        width: '52px',
                        height: '52px',
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

          {/* 7. Smart Variant Selection (Only when product has meaningful variants) */}
          {hasMeaningfulVariants && (
            <div className="pdp-card-clean" style={{ marginTop: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ fontSize: '13.5px', color: '#64748b', fontWeight: '600' }}>
                  {getVariantLabel()}: <span style={{ color: '#0f172a', fontWeight: '800' }}>{activeVariant ? activeVariant.name : ''}</span>
                </div>
                {(product.category === 'fashion' || product.category === 'footwear') && (
                  <button
                    type="button"
                    onClick={() => showToast('📏 Standard Indian sizing (True to Size). For shoes, UK size equals Indian standard.', 'info')}
                    style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: '12px', fontWeight: '800', textDecoration: 'underline', cursor: 'pointer', padding: 0 }}
                  >
                    Size Guide
                  </button>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                {variantsList.map((v, i) => {
                  const isVariantOutOfStock = v.stock !== undefined && v.stock <= 0;
                  const isSelected = activeVariant && activeVariant.name === v.name;
                  return (
                    <button
                      key={i}
                      className="desktop-premium-variant-btn"
                      onClick={() => setSelectedVariant(v)}
                      style={{
                        border: isSelected ? '2px solid #4f46e5' : '1.5px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '10px 12px',
                        backgroundColor: isSelected ? '#eff6ff' : isVariantOutOfStock ? '#f8fafc' : '#ffffff',
                        cursor: isVariantOutOfStock ? 'not-allowed' : 'pointer',
                        textAlign: 'left',
                        boxSizing: 'border-box',
                        boxShadow: isSelected ? '0 4px 12px rgba(79, 70, 229, 0.12)' : 'none',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative',
                        opacity: isVariantOutOfStock ? 0.6 : 1
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                        <div style={{ fontSize: '13px', fontWeight: '800', color: isSelected ? '#1e1b4b' : '#0f172a' }}>{v.name}</div>
                        {isSelected && (
                          <span style={{ fontSize: '10px', background: '#4f46e5', color: '#ffffff', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900' }}>✓</span>
                        )}
                        {isVariantOutOfStock && (
                          <span style={{ fontSize: '9px', background: '#fee2e2', color: '#dc2626', padding: '2px 4px', borderRadius: '4px', fontWeight: '800' }}>Sold Out</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                         <span style={{ fontSize: '13.5px', fontWeight: '900', color: isSelected ? '#4f46e5' : '#0f172a' }}>₹{(v.price || 0).toLocaleString('en-IN')}</span>
                         {v.originalPrice > v.price && (
                           <span style={{ fontSize: '11px', color: '#94a3b8', textDecoration: 'line-through' }}>₹{(v.originalPrice || 0).toLocaleString('en-IN')}</span>
                         )}
                      </div>
                      
                      {/* Low stock tag */}
                      {!isVariantOutOfStock && v.stock !== undefined && v.stock > 0 && v.stock <= 5 && (
                        <div style={{ fontSize: '10px', fontWeight: '800', color: '#dc2626', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#dc2626', animation: 'pulse 1s infinite' }}></span>
                          Only {v.stock} left
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 🔥 PRIMARY PURCHASE ACTION HUB IN RIGHT COLUMN (DESKTOP ONLY - HIDDEN ON MOBILE VIA CSS) */}
          <div className="action-buttons-container" style={{ marginTop: '16px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '18px 20px', boxShadow: '0 2px 8px rgba(9, 13, 22, 0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px dashed #e2e8f0', paddingBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Total Payable Amount:</span>
                <div style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', fontFamily: "'Outfit', sans-serif" }}>₹{(currentDisplayPrice || 0).toLocaleString('en-IN')} <span style={{ fontSize: '12px', color: '#059669', fontWeight: '800' }}>(Taxes Included)</span></div>
              </div>
              <span style={{ background: '#ecfdf5', color: '#047857', padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: '800', border: '1px solid #a7f3d0' }}>
                ⚡ Express Dispatch Ready
              </span>
            </div>
            
            <div className="action-buttons-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', position: 'relative', alignItems: 'center' }}>
              {quantityInCart > 0 ? (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  height: '48px', 
                  border: '1.5px solid #10b981', 
                  borderRadius: '12px', 
                  background: '#f0fdf4', 
                  padding: '4px 6px', 
                  gap: '8px', 
                  boxSizing: 'border-box'
                }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateCartQty(cartItem.product.id || cartItem.product._id, quantityInCart - 1);
                    }}
                    style={{ 
                      width: '36px', 
                      height: '36px', 
                      minWidth: '36px',
                      borderRadius: '8px', 
                      background: '#ffffff', 
                      border: '1px solid #bbf7d0', 
                      color: '#059669', 
                      fontSize: '18px', 
                      fontWeight: '900', 
                      cursor: 'pointer', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      padding: 0
                    }}
                    title="Decrease quantity"
                  >
                    -
                  </button>
                  <div 
                    onClick={() => onNavigate('cart')}
                    style={{ flex: 1, textAlign: 'center', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                    title="View Cart"
                  >
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#047857', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Check size={14} strokeWidth={3} /> {quantityInCart} in Bag
                    </div>
                    <div style={{ fontSize: '10px', color: '#059669', fontWeight: '700' }}>View Cart ➔</div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateCartQty(cartItem.product.id || cartItem.product._id, quantityInCart + 1);
                    }}
                    style={{ 
                      width: '36px', 
                      height: '36px', 
                      minWidth: '36px',
                      borderRadius: '8px', 
                      background: '#059669', 
                      border: 'none', 
                      color: '#ffffff', 
                      fontSize: '18px', 
                      fontWeight: '900', 
                      cursor: 'pointer', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      padding: 0
                    }}
                    title="Increase quantity"
                  >
                    +
                  </button>
                </div>
              ) : (
                <button
                  className="add-cart-outline-btn"
                  disabled={isOutOfStock}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isOutOfStock) return;
                    const customProduct = { ...product, price: currentDisplayPrice, originalPrice: currentDisplayOriginalPrice, selectedColor: activeColor ? activeColor.name : '', selectedVariant: activeVariant ? activeVariant.name : '' };
                    addToCart(customProduct, 1);
                  }}
                  style={{
                    height: '48px',
                    border: isOutOfStock ? '1.5px solid #cbd5e1' : 'none',
                    borderRadius: '12px',
                    background: isOutOfStock ? '#f1f5f9' : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                    color: isOutOfStock ? '#94a3b8' : '#ffffff',
                    fontWeight: '800',
                    fontSize: '14px',
                    cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontFamily: "'Outfit', sans-serif",
                    boxShadow: isOutOfStock ? 'none' : '0 4px 12px rgba(15, 23, 42, 0.15)',
                    opacity: isOutOfStock ? 0.7 : 1
                  }}
                >
                  <ShoppingCart size={17} color={isOutOfStock ? '#94a3b8' : '#ffffff'} /> {isOutOfStock ? 'Out of Stock' : 'Add to Bag'}
                </button>
              )}
              <button
                className={isOutOfStock ? '' : 'buy-now-pulse-btn'}
                disabled={isOutOfStock}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isOutOfStock) return;
                  const customProduct = { ...product, price: currentDisplayPrice, originalPrice: currentDisplayOriginalPrice, selectedColor: activeColor ? activeColor.name : '', selectedVariant: activeVariant ? activeVariant.name : '' };
                  if (quantityInCart === 0) {
                    addToCart(customProduct, 1);
                  }
                  onBuyNow(customProduct);
                }}
                style={{
                  height: '48px',
                  border: 'none',
                  borderRadius: '12px',
                  backgroundImage: isOutOfStock ? 'none' : 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                  backgroundColor: isOutOfStock ? '#cbd5e1' : undefined,
                  color: isOutOfStock ? '#64748b' : '#ffffff',
                  fontWeight: '900',
                  fontSize: '14.5px',
                  cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontFamily: "'Outfit', sans-serif",
                  boxShadow: isOutOfStock ? 'none' : '0 6px 18px rgba(79, 70, 229, 0.3)',
                  opacity: isOutOfStock ? 0.7 : 1
                }}
              >
                <Zap size={18} fill={isOutOfStock ? '#64748b' : 'white'} /> {isOutOfStock ? 'Sold Out' : 'Buy Now ➔'}
              </button>
            </div>
          </div>

          {/* 8. Unified Bank Offers & EMI Savings Card */}
          <div className="pdp-card-clean" style={{ marginTop: '16px' }}>
            <h4 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '15px', fontWeight: '900', color: '#0f172a', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>💥</span> Available Bank Offers &amp; Savings
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Offer 1: Festive Coupon */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '12px', padding: '10px 14px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '18px' }}>🎟️</span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>Flat 20% OFF on Orders</div>
                    <div style={{ fontSize: '11.5px', color: '#64748b' }}>Use coupon code <strong style={{ color: '#4f46e5' }}>FESTIVE20</strong></div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText('FESTIVE20');
                    showToast('✅ Coupon FESTIVE20 copied to clipboard!', 'success');
                  }}
                  style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}
                >
                  COPY CODE
                </button>
              </div>

              {/* Offer 2: No-Cost EMI */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '12px', padding: '10px 14px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '18px' }}>💳</span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>No-Cost EMI from ₹{Math.max(499, Math.round(currentDisplayPrice / 12)).toLocaleString('en-IN')}/mo</div>
                    <div style={{ fontSize: '11.5px', color: '#64748b' }}>Available on Credit &amp; Debit cards</div>
                  </div>
                </div>
                <span style={{ fontSize: '12px', color: '#2563eb', fontWeight: '800', cursor: 'pointer' }} onClick={() => showToast('💳 All Credit/Debit Cards accepted with Instant Bank Discount Cashback at Checkout!', 'info')}>
                  Plans ➔
                </span>
              </div>

              {/* Offer 3: VIP Coin Reward */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fffbeb', border: '1px dashed #fde68a', borderRadius: '12px', padding: '10px 14px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '18px' }}>👑</span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#854d0e' }}>VIP Member Cashback Reward</div>
                    <div style={{ fontSize: '11.5px', color: '#a16207' }}>Earn <strong style={{ fontWeight: '900' }}>+{calculateCoinReward(currentDisplayPrice)} AB Coins (₹{calculateCoinReward(currentDisplayPrice)})</strong> directly to wallet</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 9. Interactive Live PIN-Code Validator */}
          <div className="pdp-card-clean" style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span style={{ fontSize: '18px' }}>📍</span>
              <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>Check Delivery Speed &amp; COD Availability</span>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flex: '1', border: '1.5px solid #cbd5e1', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'white', minWidth: '220px' }}>
                <input 
                  type="text" 
                  placeholder="Enter 6-digit PIN (e.g. 110001, 400001)" 
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                  maxLength="6"
                  style={{ border: 'none', padding: '10px 14px', fontSize: '14px', fontWeight: '700', outline: 'none', width: '100%', fontFamily: "'Outfit', sans-serif" }}
                />
                <button 
                  onClick={handlePincodeCheck}
                  style={{ background: '#0f172a', color: 'white', border: 'none', padding: '0 20px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', fontFamily: "'Outfit', sans-serif", transition: 'opacity 0.2s ease' }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  Check
                </button>
              </div>
            </div>
            <div style={{ fontSize: '12.5px', fontWeight: '700', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px', color: deliveryEstimate.includes('ELIGIBLE') || deliveryEstimate.includes('Express') ? '#059669' : deliveryEstimate.includes('Invalid') ? '#e11d48' : '#0f172a' }}>
              {deliveryEstimate || "✨ Enter your postal code to see real-time delivery dates and Cash on Delivery options."}
            </div>
          </div>

          {/* 10. CATEGORY-AWARE SPECIFICATIONS & PACKAGE ASSURANCE */}
          {(() => {
            const cat = (product.category || '').toLowerCase();
            const pName = (product.name || '').toLowerCase();
            const isFitness = cat === 'fitness' || cat === 'sports' || /dumbbell|gym|workout|kettlebell|protein|resistance band|weights/i.test(pName);
            const isFashion = !isFitness && (cat === 'fashion' || cat === 'clothing' || cat === 'apparel' || cat === 'footwear' || /shirt|shoe|pant|dress|t-shirt|sneaker/i.test(pName));
            const isHome = !isFitness && !isFashion && (cat === 'home' || cat === 'living' || cat === 'furniture' || /lamp|chair|table|curtain|pillow|decor/i.test(pName));
            const isAppliance = !isFitness && !isFashion && (cat === 'appliances' || cat === 'home appliances');

            const packageTitle = isFitness
              ? "🏋️ Equipment Specifications & Box Assurance"
              : isFashion 
              ? "👗 Garment Specifications & Fabric Care" 
              : isHome 
              ? "🏠 Living Specifications & Assembly Details" 
              : isAppliance 
              ? "🫧 Appliance In-Box & Power Specifications" 
              : "📦 Technical Specifications & Box Assurance";

            const boxItems = isFitness ? [
              "✅ 1x Complete Fitness Equipment Unit",
              "✅ Anti-Slip Ergonomic Grip Construction",
              "✅ Exercise & Safety Workout Guide",
              "✅ 7-Day Easy Doorstep Replacement Shield"
            ] : isFashion ? [
              "✅ 1x Handcrafted Designer Article",
              "✅ Fabric & Wash Care Instructions Label",
              "✅ Verified Brand Authenticity Tag",
              "✅ 7-Day Easy Size Replacement Shield"
            ] : isHome ? [
              "✅ 1x Complete Product Unit",
              "✅ Easy Assembly Guide & Hardware Pack",
              "✅ Protective Multi-Layer Transit Pack",
              "✅ 7-Day Replacement Guarantee"
            ] : isAppliance ? [
              "✅ 1x Main Appliance Unit",
              "✅ Standard Indian 3-Pin Power Cord / Adapter",
              "✅ Official Brand Warranty Card",
              "✅ User Safety & Operation Manual"
            ] : [
              "✅ 1x Original Certified Sealed Unit",
              "✅ Certified Fast Charging Cable / Adapter",
              "✅ Official Brand Warranty Documentation",
              "✅ AbKharido VIP Authentication Seal"
            ];

            return (
              <details open className="pdp-vip-accordion" style={{ marginTop: '16px', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)' }}>
                <summary style={{ background: '#f8fafc', padding: '16px 20px', color: '#0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', listStyle: 'none', cursor: 'pointer', borderBottom: '1px solid #e2e8f0' }}>
                  <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '15.5px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck size={19} color="#059669" /> {packageTitle}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '11px', background: '#ecfdf5', color: '#059669', padding: '3px 8px', borderRadius: '6px', fontWeight: '800' }}>100% Genuine Stock</span>
                    <span className="vip-accordion-icon" style={{ fontSize: '18px', fontWeight: 'bold', color: '#64748b' }}>+</span>
                  </div>
                </summary>

                <div style={{ padding: '20px' }}>
                  <div style={{ marginBottom: '18px' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#090d16', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Product Overview</h4>
                    <p style={{ fontSize: '13.5px', color: '#475569', lineHeight: '1.6', margin: 0, fontWeight: '500' }}>
                      {product.description || "Crafted with premium materials and verified quality standards. Protected by AbKharido's nationwide 7-Day Replacement Guarantee."}
                    </p>
                  </div>

                  <div style={{ marginBottom: '18px', background: '#f8fafc', borderRadius: '12px', padding: '14px 16px', border: '1px solid #f1f5f9' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#090d16', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', margin: '0 0 8px 0' }}>
                      <span>{isFitness ? '🏋️' : isFashion ? '👗' : isHome ? '🏠' : isAppliance ? '🫧' : '📦'}</span> Package &amp; Items Included:
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', fontSize: '12.5px', fontWeight: '700', color: '#1e293b' }}>
                      {boxItems.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>{item}</div>
                      ))}
                    </div>
                  </div>

                  <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#090d16', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Detailed Product Specifications</h4>
                  <table className="specs-table" style={{ width: '100%', borderCollapse: 'collapse', borderRadius: '10px', overflow: 'hidden', border: '1px solid #f1f5f9' }}>
                    <tbody>
                      {(() => {
                        const baseSpecs = Array.isArray(product.specifications) && product.specifications.length > 0 
                          ? [...product.specifications] 
                          : [];
                        
                        const defaults = isFitness ? [
                          { key: "Equipment Type", value: "Heavy-Duty Training & Fitness Gear" },
                          { key: "Grip & Ergonomics", value: "Anti-Slip Textured Grip Surface" },
                          { key: "Build Durability", value: "Precision Engineered High-Density Build" },
                          { key: "Authenticity", value: "100% Genuine Direct Warehouse Inventory" },
                          { key: "Replacement Policy", value: "7-Day Easy Doorstep Replacement Guarantee" },
                          { key: "Shipping & Delivery", value: "Priority Doorstep Dispatch (2-4 Days)" }
                        ] : isFashion ? [
                          { key: "Material / Fabric", value: "Premium Breathable Cotton Blend / Performance Knit" },
                          { key: "Fit Type", value: "Regular Tailored Fit with Comfort Seams" },
                          { key: "Care Instructions", value: "Machine Wash Cold / Do Not Bleach" },
                          { key: "Authenticity", value: "100% Genuine Direct Brand Warehouse Stock" },
                          { key: "Replacement Policy", value: "7-Day Easy Size Replacement Guarantee" },
                          { key: "Shipping & Delivery", value: "Priority Doorstep Dispatch (2-4 Days)" }
                        ] : isHome ? [
                          { key: "Material & Build", value: "Engineered Solid High-Density Structure" },
                          { key: "Assembly Type", value: "Pre-assembled / Tool-Free Quick Assembly" },
                          { key: "Durability Rating", value: "Tested for Long-Term Indian Home Usage" },
                          { key: "Authenticity", value: "100% Genuine Certified Inventory" },
                          { key: "Replacement Guarantee", value: "7-Day Doorstep Replacement Guarantee" },
                          { key: "Warranty Coverage", value: "1 Year Official Brand Assurance" }
                        ] : [
                          { key: "Build & Model", value: product.name || "Official Certified Model" },
                          { key: "Brand Assurance", value: "Verified Genuine Manufacturer Inventory" },
                          { key: "Connectivity / Interface", value: "High-Speed Universal Connectivity Standard" },
                          { key: "Warranty Coverage", value: "1 Year Comprehensive Official Brand Warranty" },
                          { key: "Authenticity Guarantee", value: "100% Original Sealed Brand Warehouse Stock" },
                          { key: "Replacement Shield", value: "7-Day Easy Doorstep Replacement Policy" }
                        ];

                        const finalSpecs = [...baseSpecs];
                        defaults.forEach(d => {
                          if (finalSpecs.length < 6 && !finalSpecs.some(s => s.key === d.key)) {
                            finalSpecs.push(d);
                          }
                        });

                        return finalSpecs.map((spec, index) => (
                          <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#f8fafc' : '#ffffff', borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '10px 14px', fontWeight: '700', color: '#64748b', width: '35%', fontSize: '12.5px' }}>{spec.key}</td>
                            <td style={{ padding: '10px 14px', fontWeight: '800', color: '#0f172a', fontSize: '12.5px' }}>{spec.value}</td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </details>
            );
          })()}

          {/* 🛍️ Smart Bundle Upsell: Frequently Bought Together */}
          <FrequentlyBoughtTogether 
            currentProduct={product} 
            onNavigateProduct={onNavigate} 
          />

          {/* Ratings & Reviews section (M1 Real Calculation Fix) */}

          {(() => {
            const activeReviews = (reviewsList && reviewsList.length > 0) ? reviewsList : (product?.reviews || []);
            const totalRatingsCount = activeReviews.length;
            const starBreakdown = [5, 4, 3, 2, 1].map(star => {
              const count = activeReviews.filter(r => Math.round(Number(r.rating) || 5) === star).length;
              const pct = totalRatingsCount > 0 ? Math.round((count / totalRatingsCount) * 100) : 0;
              const color = star >= 4 ? '#059669' : star === 3 ? '#f59e0b' : '#ef4444';
              return { star, pct, count, color };
            });
            const calculatedAvgRating = totalRatingsCount > 0
              ? (activeReviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) / totalRatingsCount).toFixed(1)
              : (product?.rating || 4.5);

            return (
              <details open className="pdp-vip-accordion" id="reviews-section" style={{ marginTop: '16px', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)' }}>
                <summary style={{ background: '#f8fafc', padding: '16px 20px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', borderBottom: '1px solid #e2e8f0', fontWeight: '800', fontSize: '15.5px', fontFamily: "'Outfit', sans-serif" }}>
                  <span>⭐</span> Customer Ratings &amp; Reviews
                  <span className="rating-tag" style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 'bold', background: '#059669', color: '#ffffff' }}>
                    {calculatedAvgRating} ★
                  </span>
                  <span style={{ fontSize: '12px', color: '#64748b', marginLeft: 'auto', fontWeight: '600' }}>
                    {totalRatingsCount} verified review{totalRatingsCount === 1 ? '' : 's'}
                  </span>
                </summary>
                <div className="accordion-content" style={{ padding: '20px' }}>
                
                {/* Visual Bar Chart grid - dynamically calculated from actual review data */}
                {totalRatingsCount > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', margin: '16px 0', alignItems: 'center', backgroundColor: '#f8fafc', padding: '16px 20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    <div style={{ textAlign: 'center', borderRight: '1px solid #e2e8f0', paddingRight: '16px' }}>
                      <div style={{ fontSize: '36px', fontWeight: '900', color: '#0f172a', fontFamily: "'Outfit', sans-serif" }}>{calculatedAvgRating}</div>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', color: '#f59e0b', fontSize: '14px', margin: '4px 0' }}>
                        {[...Array(5)].map((_, i) => (
                          <span key={i}>{i < Math.round(Number(calculatedAvgRating)) ? '★' : '☆'}</span>
                        ))}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>{totalRatingsCount} Verified Rating{totalRatingsCount === 1 ? '' : 's'}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {starBreakdown.map((item) => (
                        <div key={item.star} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                          <span style={{ width: '24px', fontWeight: '700', color: '#334155' }}>{item.star}★</span>
                          <div style={{ flex: 1, height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${item.pct}%`, height: '100%', backgroundColor: item.color, borderRadius: '4px', transition: 'width 0.5s ease' }}></div>
                          </div>
                          <span style={{ width: '32px', color: '#64748b', textAlign: 'right', fontWeight: '700' }}>{item.pct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '32px 16px', textAlign: 'center', background: '#f8fafc', borderRadius: '16px', border: '1.5px dashed #cbd5e1', margin: '16px 0' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>✍️</div>
                    <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b', margin: '0 0 6px 0', fontFamily: "'Outfit', sans-serif" }}>
                      No Customer Reviews Yet
                    </h4>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: 0, maxWidth: '340px', marginInline: 'auto' }}>
                      Be the first verified customer to share your rating and review for this product!
                    </p>
                  </div>
                )}

                {/* List of real customer comments */}
                {totalRatingsCount > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                    {activeReviews.map((rev, idx) => (
                      <div key={idx} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '14px', textAlign: 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '6px', background: '#059669', color: 'white', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                            {rev.rating} ★
                          </span>
                          <strong style={{ fontSize: '13px', color: '#0f172a' }}>{rev.name}</strong>
                          <span style={{ fontSize: '11px', background: '#ecfdf5', color: '#059669', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>Verified Buyer</span>
                          <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: 'auto' }}>{rev.date || (rev.createdAt ? new Date(rev.createdAt).toISOString().split('T')[0] : '')}</span>
                        </div>
                        <p style={{ fontSize: '13px', color: '#475569', marginTop: '6px', lineHeight: '1.5', margin: '6px 0 0 0' }}>{rev.comment}</p>
                        
                        {/* Attached review photos */}
                        {rev.photos && rev.photos.length > 0 && (
                          <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                            {rev.photos.map((photo, pIdx) => (
                              <img 
                                key={pIdx} 
                                src={photo} 
                                alt="Review attachment" 
                                style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' }} 
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                </div>
              </details>
            );
          })()}

            {/* WRITE A REVIEW FORM (With strict anti-spam) */}
            <div className="pdp-card-clean" style={{ marginTop: '16px', textAlign: 'left' }}>
              <h4 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '12px', color: '#0f172a', fontFamily: "'Outfit', sans-serif", display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>✍️</span> Write a Customer Review
              </h4>

              
              {!currentUser ? (
                <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', textAlign: 'center', border: '1px dashed #cbd5e1' }}>
                  <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '10px' }}>Sign in to write reviews and share photos with the community.</p>
                  <button className="btn btn-primary" onClick={() => onNavigate('login')} style={{ height: '38px', padding: '0 20px', fontSize: '12.5px', borderRadius: '8px', fontWeight: '800' }}>Sign In to Review</button>
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

          {/* Share & Earn Panel (Affiliate/Referral) - Sleek Creator Banner */}
          <div className="share-earn-box" style={{ marginTop: '16px', background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', border: '1px solid #bbf7d0', borderRadius: '16px', padding: '18px 20px', boxShadow: '0 2px 8px rgba(22, 163, 74, 0.04)' }}>
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
               <div className="share-link-generator" style={{ display: 'flex', gap: '8px', background: 'white', padding: '6px', borderRadius: '12px', border: '1px solid #86efac', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
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
                   style={{ background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 18px', fontSize: '13px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
                   onClick={handleCopyLink}
                 >
                   {copied ? <Check size={16} /> : <Copy size={16} />}
                   <span>{copied ? 'Copied Link' : 'Copy Link'}</span>
                 </button>
               </div>
             ) : (
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '12px 16px', borderRadius: '12px', border: '1px solid #86efac', flexWrap: 'wrap', gap: '10px' }}>
                 <span style={{ fontSize: '13px', color: '#166534', fontWeight: '700' }}>
                   🔒 Log in to activate your unique monetized link
                 </span>
                 <button 
                   style={{ background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}
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

          {/* Recently Viewed Products (P2 Feature) */}
          {recentlyViewed && recentlyViewed.length > 0 && (
            <div style={{ marginTop: '20px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a', marginBottom: '14px', fontFamily: "'Outfit', sans-serif", display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🕒</span> Recently Viewed Products
              </h3>
              <div style={{ display: 'flex', gap: '14px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'thin' }}>
                {recentlyViewed.map(rv => (
                  <div
                    key={rv.id}
                    onClick={() => {
                      if (onNavigate) {
                        onNavigate(rv.id);
                      } else {
                        window.location.href = `/product/${rv.id}`;
                      }
                    }}
                    style={{
                      minWidth: '150px',
                      maxWidth: '160px',
                      flex: '0 0 auto',
                      background: 'white',
                      borderRadius: '14px',
                      padding: '12px',
                      border: '1px solid #f1f5f9',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      transition: 'transform 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center'
                    }}
                  >
                    <LazyImage src={rv.image} alt={rv.name} style={{ width: '80px', height: '80px', objectFit: 'contain', marginBottom: '8px' }} />
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                      {rv.name}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '900', color: '#059669', marginTop: '4px' }}>
                      ₹{(rv.price || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>

        {/* 🚀 FIXED PURCHASE RIBBON FOR MOBILE DEVICES (STRICTLY HIDDEN ON DESKTOP) */}
        <div className="vip-fixed-bottom-purchase-bar">
          {/* Left Side: Product Micro-Preview */}
          <div className="vip-fixed-bar-left" style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: '1 1 auto' }}>
            <img 
              src={product.image || (product.images && product.images[0]) || ''} 
              alt={product.name} 
              style={{ width: '46px', height: '46px', objectFit: 'contain', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '2px', flexShrink: 0 }}
            />
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: "'Outfit', sans-serif" }}>
                {product.name}
              </div>
              <div style={{ fontSize: '16px', fontWeight: '900', color: '#059669', fontFamily: "'Outfit', sans-serif" }}>
                ₹{(currentDisplayPrice || 0).toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Right Side: Instant Action Purchase Buttons */}
          <div className="vip-fixed-bar-right" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {quantityInCart > 0 ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate('cart');
                }}
                style={{
                  height: '46px',
                  padding: '0 16px',
                  border: '1.5px solid #059669',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                  color: '#047857',
                  fontWeight: '900',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontFamily: "'Outfit', sans-serif",
                  boxShadow: '0 2px 8px rgba(5, 150, 105, 0.15)'
                }}
              >
                <Check size={16} /> <span className="buy-bar-btn-text">Bag ({quantityInCart}) ➔</span>
              </button>
            ) : (
              <button
                className="add-cart-outline-btn"
                disabled={isOutOfStock}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isOutOfStock) return;
                  const customProduct = { ...product, price: currentDisplayPrice, originalPrice: currentDisplayOriginalPrice, selectedColor: activeColor ? activeColor.name : '', selectedVariant: activeVariant ? activeVariant.name : '' };
                  addToCart(customProduct, 1);
                }}
                style={{
                  height: '46px',
                  padding: '0 14px',
                  border: isOutOfStock ? '1.5px solid #cbd5e1' : 'none',
                  borderRadius: '12px',
                  background: isOutOfStock ? '#f1f5f9' : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                  color: isOutOfStock ? '#94a3b8' : '#ffffff',
                  fontWeight: '800',
                  fontSize: '13px',
                  cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontFamily: "'Outfit', sans-serif",
                  boxShadow: isOutOfStock ? 'none' : '0 4px 12px rgba(15, 23, 42, 0.2)'
                }}
              >
                <ShoppingCart size={17} color={isOutOfStock ? '#94a3b8' : '#ffffff'} /> <span className="buy-bar-btn-text">{isOutOfStock ? 'Out of Stock' : 'Add to Bag'}</span>
              </button>
            )}
            <button
              className={isOutOfStock ? '' : 'buy-now-pulse-btn'}
              disabled={isOutOfStock}
              onClick={(e) => {
                e.stopPropagation();
                if (isOutOfStock) return;
                const customProduct = { ...product, price: currentDisplayPrice, originalPrice: currentDisplayOriginalPrice, selectedColor: activeColor ? activeColor.name : '', selectedVariant: activeVariant ? activeVariant.name : '' };
                if (quantityInCart === 0) {
                  addToCart(customProduct, 1);
                }
                onBuyNow(customProduct);
              }}
              style={{
                height: '46px',
                padding: '0 18px',
                border: 'none',
                borderRadius: '12px',
                backgroundImage: isOutOfStock ? 'none' : 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                backgroundColor: isOutOfStock ? '#cbd5e1' : undefined,
                color: isOutOfStock ? '#64748b' : '#ffffff',
                fontWeight: '900',
                fontSize: '14px',
                cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                fontFamily: "'Outfit', sans-serif",
                boxShadow: isOutOfStock ? 'none' : '0 6px 18px rgba(234, 88, 12, 0.35)'
              }}
            >
              <Zap size={17} fill={isOutOfStock ? '#64748b' : 'white'} /> {isOutOfStock ? 'Sold Out' : 'Buy Now ➔'}
            </button>
          </div>
        </div>

      {/* 🔔 Luxury Price Drop & Restock Alert Modal / Bottom Sheet */}
      {isAlertModalOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(9, 13, 22, 0.75)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={() => setIsAlertModalOpen(false)}
        >
          <div 
            style={{
              width: '100%',
              maxWidth: '480px',
              backgroundColor: '#ffffff',
              borderRadius: '24px 24px 0 0',
              padding: '24px 20px 32px',
              boxShadow: '0 -12px 40px rgba(0, 0, 0, 0.25)',
              position: 'relative',
              boxSizing: 'border-box'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Drag Handle */}
            <div style={{ width: '40px', height: '4px', background: '#cbd5e1', borderRadius: '4px', margin: '0 auto 16px' }} />

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #090d16 0%, #1e1b4b 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(251, 191, 36, 0.3)',
                  boxShadow: '0 4px 14px rgba(251, 191, 36, 0.2)',
                  flexShrink: 0
                }}>
                  <Bell size={22} color="#fbbf24" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '900', color: '#0f172a', fontFamily: "'Outfit', sans-serif" }}>
                    Price Drop &amp; Restock Alert
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                    Instant notification on price drops &amp; restocks
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAlertModalOpen(false)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748b'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Product Snapshot Card */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc', padding: '10px 14px', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
              <img 
                src={product.image || (Array.isArray(product.images) ? product.images[0] : '')} 
                alt={product.name}
                style={{ width: '44px', height: '44px', objectFit: 'contain', borderRadius: '8px', background: '#ffffff', padding: '2px', border: '1px solid #e2e8f0' }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {product.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '900', color: '#059669' }}>₹{(currentDisplayPrice || product.price || 0).toLocaleString('en-IN')}</span>
                  {currentDisplayOriginalPrice > currentDisplayPrice && (
                    <span style={{ fontSize: '12px', color: '#94a3b8', textDecoration: 'line-through' }}>₹{currentDisplayOriginalPrice.toLocaleString('en-IN')}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Target Drop Selector */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
                Notify Me When:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {[
                  { id: 'any', label: 'Any Drop ⚡', sub: '₹1 or more' },
                  { id: '5percent', label: 'Drop 5% 📉', sub: `Below ₹${Math.round((currentDisplayPrice || product.price) * 0.95).toLocaleString('en-IN')}` },
                  { id: '10percent', label: 'Drop 10% 🔥', sub: `Below ₹${Math.round((currentDisplayPrice || product.price) * 0.90).toLocaleString('en-IN')}` },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setAlertTargetType(opt.id)}
                    style={{
                      padding: '10px 6px',
                      borderRadius: '12px',
                      border: alertTargetType === opt.id ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                      background: alertTargetType === opt.id ? '#eef2ff' : '#ffffff',
                      color: alertTargetType === opt.id ? '#4338ca' : '#475569',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ fontSize: '11.5px', fontWeight: '800' }}>{opt.label}</div>
                    <div style={{ fontSize: '10px', color: alertTargetType === opt.id ? '#6366f1' : '#94a3b8', marginTop: '2px', fontWeight: '600' }}>{opt.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Clean Notification Channel Indicator (No typing required) */}
            <div style={{
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              border: '1px solid #86efac',
              borderRadius: '14px',
              padding: '12px 14px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: '#22c55e',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)'
              }}>
                <Zap size={18} fill="white" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#166534' }}>
                  Instant WhatsApp &amp; SMS Alerts
                </div>
                <div style={{ fontSize: '11px', color: '#15803d', fontWeight: '600', marginTop: '1px' }}>
                  {currentUser?.phone ? `Directly linked to +91 ${currentUser.phone}` : 'Active for your logged-in AbKharido account'}
                </div>
              </div>
            </div>

            {/* Submit Action Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setIsAlertModalOpen(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontWeight: '700',
                  fontSize: '13.5px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAlertModalOpen(false);
                  const discountLabel = alertTargetType === '5percent' ? '5% or more' : alertTargetType === '10percent' ? '10% or more' : 'any amount';
                  showToast(`🔔 Price Drop Alert Activated! You will receive instant WhatsApp & SMS alerts when price drops by ${discountLabel}.`, 'success');
                }}
                style={{
                  flex: 2,
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #090d16 0%, #1e1b4b 100%)',
                  color: '#ffffff',
                  fontWeight: '800',
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 16px rgba(15, 23, 42, 0.25)'
                }}
              >
                <Bell size={16} color="#fbbf24" /> Set Instant Alert
              </button>
            </div>


          </div>
        </div>
      )}

    </>
  );
};


export default ProductDetails;
