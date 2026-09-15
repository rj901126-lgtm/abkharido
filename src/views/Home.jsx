import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import ProductCard from '../components/ProductCard';
import { ChevronLeft, ChevronRight, ArrowRight, Zap, ShieldCheck, Truck, Award, Sparkles, Filter, Store, ArrowUp } from 'lucide-react';
import '../assets/styles/home.css';


const defaultVipCategories = [
  { id: 'mobiles', label: 'Mobiles', icon: '📱', bg: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)', activeBg: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)', color: '#0369a1' },
  { id: 'electronics', label: 'Audio', icon: '🎧', bg: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)', activeBg: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)', color: '#6d28d9' },
  { id: 'fashion', label: 'Fashion', icon: '👗', bg: 'linear-gradient(135deg, #ffe4e6 0%, #fecdd3 100%)', activeBg: 'linear-gradient(135deg, #e11d48 0%, #fb7185 100%)', color: '#be123c' },
  { id: 'home', label: 'Home', icon: '🏠', bg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', activeBg: 'linear-gradient(135deg, #d97706 0%, #fbbf24 100%)', color: '#b45309' },
  { id: 'beauty', label: 'Beauty', icon: '💄', bg: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)', activeBg: 'linear-gradient(135deg, #db2777 0%, #f472b6 100%)', color: '#be185d' },
  { id: 'sports', label: 'Fitness', icon: '🏋️', bg: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)', activeBg: 'linear-gradient(135deg, #059669 0%, #34d399 100%)', color: '#15803d' },
  { id: 'appliances', label: 'Appliances', icon: '🍳', bg: 'linear-gradient(135deg, #cffafe 0%, #a5f3fc 100%)', activeBg: 'linear-gradient(135deg, #0891b2 0%, #22d3ee 100%)', color: '#0e7490' },
];

const Home = ({ onNavigate, onNavigateProduct, onSelectCategory, promotions, initialProducts }) => {
  const { products: contextProducts, currentUser } = useApp();
  const products = initialProducts || contextProducts || [];
  const [activeSlide, setActiveSlide] = useState(0);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);
  const [activeCuratedTab, setActiveCuratedTab] = useState('bestsellers');
  const targetDate = useRef((() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
  })()).current;

  const activeVipCategories = (promotions && promotions.vipCategories && Array.isArray(promotions.vipCategories) && promotions.vipCategories.length > 0)
    ? promotions.vipCategories
    : defaultVipCategories;

  const defaultSlides = [
    {
      isSignature: true,
      productId: 'signature-wireless-earphone',
      title: 'Signature Sigboom 21',
      subTitle: 'RGB Wireless Bluetooth Speaker',
      tag: '🔥 ABKHARIDO ORIGINAL • FLAT 50% OFF',
      price: 379,
      originalPrice: 758,
      discount: '50% OFF',
      rating: 4.5,
      reviewsCount: 10,
      image: 'https://res.cloudinary.com/rx1klbob/image/upload/v1784995324/abkharido/products/r687it063mcwcn507c9w.jpg',
      features: [
        '🔊 360° High Bass Sound',
        '🌈 Dynamic RGB Lights',
        '📱 Mobile Stand Mount',
        '🔋 12hr Battery & FM/BT/TF'
      ],
      cat: 'electronics'
    },
    {
      title: 'Titanium AI Sound. Studio Perfected.',
      desc: 'Experience our flagship spatial noise-cancelling headphones. Up to 60 hours of hyper-battery and quantum acoustics.',
      bg: 'url(https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?q=80&w=1400&auto=format&fit=crop) center/cover no-repeat',
      tag: '🇮🇳 AUDIO CHAMPION DEAL',
      cat: 'electronics'
    },
    {
      title: 'The Platinum Standard in Indian Couture',
      desc: 'Elevate your aesthetic with our direct-from-designer runway collection. Uncompromising luxury at revolutionary member prices.',
      bg: 'url(https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1400&auto=format&fit=crop) center/cover no-repeat',
      tag: '✨ VIP SUMMER COLLECTION',
      cat: 'fashion'
    },
    {
      title: 'Next-Gen 5G AI Smartphones',
      desc: 'Ultra-speed flagships with cinematic camera sensors and hyper-fast wireless charging. 100% Genuine brand warranty.',
      bg: 'url(https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=1400&auto=format&fit=crop) center/cover no-repeat',
      tag: '📱 5G MEGA LAUNCH',
      cat: 'mobiles'
    }
  ];

  const baseSlides = (promotions && Array.isArray(promotions.banners) && promotions.banners.length > 0)
    ? promotions.banners
    : defaultSlides;

  // Ensure Signature Sigboom 21 flagship slide is always featured at Slide 0
  const slides = React.useMemo(() => {
    const signatureSlide = defaultSlides[0];
    if (baseSlides.some(s => s.isSignature || s.productId === 'signature-wireless-earphone')) {
      return baseSlides;
    }
    return [signatureSlide, ...baseSlides];
  }, [baseSlides]);


  const handleNextSlide = () => setActiveSlide((prev) => (prev + 1) % (slides.length || 1));
  const handlePrevSlide = () => setActiveSlide((prev) => (prev - 1 + slides.length) % (slides.length || 1));

  // Hero carousel auto-timer (pauses on hover/touch)
  useEffect(() => {
    if (slides.length <= 1 || isCarouselPaused) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [slides.length, isCarouselPaused]);

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleTouchStart = (e) => {
    setIsCarouselPaused(true);
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = () => {
    setIsCarouselPaused(false);
    if (touchStartX.current - touchEndX.current > 50) handleNextSlide();
    if (touchStartX.current - touchEndX.current < -50) handlePrevSlide();
  };

  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      setShowBackToTop(scrollY > 400);
      setIsScrolled(scrollY > 70);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategoryClick = (catId) => {
    if (catId === 'mobiles') {
      if (onNavigate) onNavigate('mobiles');
      else if (onSelectCategory) onSelectCategory('mobiles');
    } else if (catId === 'electronics') {
      if (onNavigate) onNavigate('electronics');
      else if (onSelectCategory) onSelectCategory('electronics');
    } else if (catId === 'fashion') {
      if (onNavigate) onNavigate('fashion');
      else if (onSelectCategory) onSelectCategory('fashion');
    } else if (onSelectCategory) {
      onSelectCategory(catId);
    } else if (onNavigate) {
      onNavigate(catId === 'all' ? 'catalog' : `catalog?category=${catId}`);
    }
  };

  const displayList = Array.isArray(products) && products.length > 0 ? products : [];



  // Distinct SKUs partitioned across rails so each rail is unique
  const flashDeals = React.useMemo(() => {
    if (!Array.isArray(displayList)) return [];
    return [...displayList]
      .filter(p => p && Number(p.originalPrice || 0) > Number(p.price || 0))
      .sort((a, b) => {
        const discA = ((Number(a.originalPrice || 0) - Number(a.price || 0)) / (Number(a.originalPrice) || 1));
        const discB = ((Number(b.originalPrice || 0) - Number(b.price || 0)) / (Number(b.originalPrice) || 1));
        return discB - discA;
      })
      .slice(0, 4);
  }, [displayList]);

  const bestSellers = React.useMemo(() => {
    if (!Array.isArray(displayList)) return [];
    const flashIds = new Set(flashDeals.map(p => p?.id || p?._id).filter(Boolean));
    const candidates = displayList.filter(p => p && !flashIds.has(p.id || p._id));
    return [...candidates]
      .sort((a, b) => (Number(b?.reviewsCount || 0) - Number(a?.reviewsCount || 0)) || (Number(b?.rating || 0) - Number(a?.rating || 0)))
      .slice(0, 4);
  }, [displayList, flashDeals]);

  const newArrivals = React.useMemo(() => {
    if (!Array.isArray(displayList)) return [];
    const flashIds = new Set(flashDeals.map(p => p?.id || p?._id).filter(Boolean));
    const bestSellerIds = new Set(bestSellers.map(p => p?.id || p?._id).filter(Boolean));
    const candidates = displayList.filter(p => p && !flashIds.has(p.id || p._id) && !bestSellerIds.has(p.id || p._id));
    if (candidates.length >= 4) return candidates.slice(0, 4);
    const remainder = displayList.filter(p => p && !candidates.some(c => c && (c.id || c._id) === (p.id || p._id)));
    return [...candidates, ...remainder].slice(0, 4);
  }, [displayList, flashDeals, bestSellers]);

  const topRated = React.useMemo(() => {
    if (!Array.isArray(displayList)) return [];
    const flashIds = new Set(flashDeals.map(p => p?.id || p?._id).filter(Boolean));
    const candidates = displayList.filter(p => p && !flashIds.has(p.id || p._id) && Number(p.rating || 0) >= 4);
    if (candidates.length >= 4) {
      return [...candidates]
        .sort((a, b) => (Number(b?.rating || 0) - Number(a?.rating || 0)) || (Number(b?.reviewsCount || 0) - Number(a?.reviewsCount || 0)))
        .slice(0, 4);
    }
    return [...displayList]
      .sort((a, b) => (Number(b?.rating || 0) - Number(a?.rating || 0)) || (Number(b?.reviewsCount || 0) - Number(a?.reviewsCount || 0)))
      .slice(0, 4);
  }, [displayList, flashDeals]);


  return (
    <div className="home-page-layout-container" style={{ paddingBottom: '70px', maxWidth: '1280px', margin: '0 auto', paddingTop: 0 }}>
      
      {/* ── 1. Category Strip (Full mode at top, compact sticky pill bar on scroll) ── */}
      <section className={`home-category-strip ${isScrolled ? 'is-scrolled' : ''}`}>
        <div className="home-category-pills-row">
          {isScrolled ? (
            activeVipCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className="category-scroll-pill"
                type="button"
                aria-label={`Filter by ${cat.label}`}
              >
                <span className="pill-icon">{cat.icon}</span>
                <span className="pill-label">{cat.label}</span>
              </button>
            ))
          ) : (
            activeVipCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className="category-avatar-btn"
                type="button"
                aria-label={`Filter by ${cat.label}`}
              >
                <div 
                  className="category-avatar-circle"
                  style={{ background: cat.bg || '#f1f5f9' }}
                >
                  <span className="avatar-icon">{cat.icon}</span>
                </div>
                <span className="avatar-label">
                  {cat.label}
                </span>
              </button>
            ))
          )}
        </div>
      </section>









      {/* ── 2. VIP Member Ribbon (Compact single-line on mobile, sleek on desktop) ── */}
      {currentUser && (
        <div className="home-member-ribbon-container">
          <div className="home-member-ribbon">
            <div className="home-member-ribbon-left">
              <span className="home-member-coin-pill">
                🪙 {currentUser.walletCoins !== undefined ? currentUser.walletCoins : 100} Coins
              </span>
              <span className="home-member-name-text">
                Hi, {((typeof currentUser?.fullName === 'string' && currentUser.fullName.trim().split(' ')[0]) || (typeof currentUser?.name === 'string' && currentUser.name.trim().split(' ')[0]) || 'Member')}! 👋
              </span>
            </div>
            <div className="home-member-ribbon-actions">
              <button 
                onClick={() => onNavigate('orders')}
                className="home-member-ribbon-btn"
              >
                📦 Track
              </button>
              <button 
                onClick={() => onNavigate('wishlist')}
                className="home-member-ribbon-btn"
              >
                ❤️ Wishlist
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ── 3. Hero / Banner Carousel (With Dot Indicators & Auto-Rotate) ── */}
      {slides.length > 0 && (
        <div style={{ position: 'relative', margin: '0 12px' }}>
          <section 
            className="hero-carousel"
            style={{ margin: 0, borderRadius: '20px' }}
            onMouseEnter={() => setIsCarouselPaused(true)}
            onMouseLeave={() => setIsCarouselPaused(false)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {slides.map((slide, idx) => {
              if (slide.isSignature) {
                return (
                  <div 
                    key={slide.id || idx} 
                    className={`carousel-slide signature-hero-slide ${idx === activeSlide ? 'active' : ''}`}
                    onClick={() => {
                      if (onNavigateProduct) onNavigateProduct(slide.productId || 'signature-wireless-earphone');
                      else if (onNavigate) onNavigate(`product/${slide.productId || 'signature-wireless-earphone'}`);
                    }}
                  >
                    <div className="signature-hero-container">
                      {/* Left: Product Info & Mega Pricing */}
                      <div className="signature-hero-left">
                        <span className="signature-hero-badge">
                          {slide.tag || '🔥 ABKHARIDO ORIGINAL • FLAT 50% OFF'}
                        </span>
                        
                        <h2 className="signature-hero-title">
                          {slide.title}
                          <span className="signature-hero-subtitle-block">{slide.subTitle}</span>
                        </h2>

                        {/* Feature Badges Row */}
                        <div className="signature-hero-chips">
                          {slide.features && slide.features.map((feat, fIdx) => (
                            <span key={fIdx} className="signature-hero-chip">
                              {feat}
                            </span>
                          ))}
                        </div>

                        {/* Pricing Box */}
                        <div className="signature-hero-price-row">
                          <span className="sig-price-main">₹{slide.price}</span>
                          <span className="sig-price-mrp">M.R.P. ₹{slide.originalPrice}</span>
                          <span className="sig-discount-pill">{slide.discount || '50% OFF'}</span>
                        </div>

                        {/* CTA Button */}
                        <div className="signature-hero-cta-wrap">
                          <button 
                            type="button"
                            className="btn signature-hero-cta"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onNavigateProduct) onNavigateProduct(slide.productId || 'signature-wireless-earphone');
                              else if (onNavigate) onNavigate(`product/${slide.productId || 'signature-wireless-earphone'}`);
                            }}
                          >
                            ⚡ BUY NOW FOR ₹{slide.price} <ArrowRight size={15} />
                          </button>
                          <span className="sig-guarantee-note">✓ 100% Original • COD Available</span>
                        </div>
                      </div>

                      {/* Right: Floating Product Image Showcase with Glowing Halo */}
                      <div className="signature-hero-right">
                        <div className="sig-image-glow-aura"></div>
                        <img 
                          src={slide.image} 
                          alt={slide.title} 
                          className="signature-hero-img"
                        />
                        <div className="sig-verified-stamp">
                          <span className="sig-stamp-icon">✓</span>
                          <span className="sig-stamp-text">ORIGINAL</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              const slideBg = slide.imageUrl ? `url(${slide.imageUrl}) center/cover no-repeat` : (slide.bg || slide.bgGradient || 'var(--primary-color)');
              const slideTag = slide.badge || slide.tag || '🇮🇳 Shop India — Direct to You';
              const slideTitle = slide.title || 'Grand Store Exclusive';
              const slideDesc = slide.subTitle || slide.desc || 'Experience authentic brand inventory, verified bank cash protection, and instant creator commission incentives.';
              const slideCat = slide.link ? slide.link.split('/').pop().replace('category=', '').replace('?','') : (slide.cat || 'all');

              return (
                <div 
                  key={slide.id || idx} 
                  className={`carousel-slide ${idx === activeSlide ? 'active' : ''}`}
                  style={{ background: slideBg }}
                >
                  <div className="carousel-slide-overlay"></div>
                  
                  <div className="slide-content-box" style={{ maxWidth: '520px' }}>
                    <span className="slide-tag" style={{ background: '#fde047', color: '#0f172a', fontWeight: '900', padding: '3px 10px', borderRadius: '100px', fontSize: '10px', textTransform: 'uppercase', display: 'inline-block', marginBottom: '8px' }}>
                      {slideTag}
                    </span>
                    <h1 className="slide-title" style={{ fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: '900', lineHeight: '1.2', marginBottom: '8px', letterSpacing: '-0.3px' }}>
                      {slideTitle}
                    </h1>
                    <p className="slide-desc" style={{ fontSize: 'clamp(12px, 1.6vw, 13.5px)', color: '#e2e8f0', lineHeight: '1.45', marginBottom: '14px', fontWeight: '500' }}>
                      {slideDesc}
                    </p>
                    
                    <div>
                      <button 
                        className="btn hero-cta-btn" 
                        style={{ 
                          background: 'linear-gradient(135deg, #4338ca 0%, #6366f1 100%)',
                          color: 'white',
                          borderRadius: '24px', 
                          padding: '9px 18px', 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '6px', 
                          border: '1px solid rgba(255, 255, 255, 0.4)', 
                          fontFamily: "'Outfit', sans-serif",
                          fontWeight: '800', 
                          fontSize: '12.5px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.4px',
                          cursor: 'pointer',
                          boxShadow: '0 6px 16px rgba(79, 70, 229, 0.35)'
                        }}
                        onClick={() => onSelectCategory(slideCat)}
                      >
                        ⚡ Claim Deal Now <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            <button className="carousel-nav-btn carousel-nav-left" onClick={handlePrevSlide} aria-label="Previous Slide">
              <ChevronLeft size={20} />
            </button>
            <button className="carousel-nav-btn carousel-nav-right" onClick={handleNextSlide} aria-label="Next Slide">
              <ChevronRight size={20} />
            </button>
          </section>

          {/* Dots Indicator */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '8px' }}>
            {slides.map((_, dotIdx) => (
              <div 
                key={dotIdx} 
                onClick={() => setActiveSlide(dotIdx)}
                style={{
                  width: dotIdx === activeSlide ? '22px' : '7px',
                  height: '7px',
                  borderRadius: '4px',
                  backgroundColor: dotIdx === activeSlide ? '#4f46e5' : '#cbd5e1',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── 4. Flash Deals / Deal of the Day (Live Countdown Timer) ── */}
      <section className="home-section-card" style={{ backgroundColor: '#ffffff', borderRadius: '24px', padding: '22px 20px', border: '1px solid #e2e8f0', margin: '0 12px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 className="home-section-heading" style={{ fontFamily: "'Outfit', sans-serif", fontSize: '19px', fontWeight: '900', color: '#090d16', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <span>⚡</span> Deal of the Day
            </h3>
            <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Limited lightning deals with extra discount coupons</p>
          </div>
          <DealsCountdown targetDate={targetDate} />
        </div>

        {/* Product Grid / Row */}
        {products.length === 0 ? (
          <div className="product-responsive-row">
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ height: '280px', backgroundColor: '#f1f5f9', borderRadius: '18px' }} />
            ))}
          </div>
        ) : (
          <div className="product-responsive-row">
            {(flashDeals.length > 0 ? flashDeals : displayList.slice(0, 4)).map((product, idx) => (
              product ? <ProductCard key={product?.id || product?._id || `flash-${idx}`} product={product} onNavigateProduct={onNavigateProduct} /> : null
            ))}
          </div>
        )}
      </section>

      {/* ── 5. 4-Pillar Trust Signals USP Row ── */}
      <div className="home-trust-grid" style={{ margin: '14px 12px 6px' }}>
        {[
          { icon: <Zap size={18} color="#0284c7" />, title: "Priority Express Dispatch", sub: "Fast 24-48 hr doorstep drop", bg: "linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)", border: "#e0f2fe" },
          { icon: <ShieldCheck size={18} color="#059669" />, title: "100% Cashfree Escrow", sub: "Bank-grade payment security", bg: "linear-gradient(135deg, #ffffff 0%, #ecfdf5 100%)", border: "#d1fae5" },
          { icon: <Truck size={18} color="#7c3aed" />, title: "Easy 7-Day Replacement", sub: "Hassle-free doorstep returns", bg: "linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%)", border: "#ede9fe" },
          { icon: <Award size={18} color="#d97706" />, title: "Cash on Delivery (COD)", sub: "Pay at doorstep at 27K+ PINs", bg: "linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)", border: "#fef3c7" },
        ].map((item, idx) => (
          <div key={idx} style={{
            background: item.bg, 
            border: `1px solid ${item.border}`, 
            borderRadius: '14px', 
            padding: '10px 14px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
          }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'white', border: `1px solid ${item.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
              {item.icon}
            </div>
            <div>
              <h4 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '12.5px', fontWeight: '800', color: '#090d16', margin: '0 0 1px 0' }}>{item.title}</h4>
              <p style={{ fontSize: '10.5px', color: '#64748b', margin: 0, fontWeight: '600' }}>{item.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── 6. Segmented Intent-Driven Category Collection Cards ── */}
      <div style={{ margin: '12px 12px 16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
        {[
          { title: "Smartphones & Audio", tag: "UP TO 40% OFF", cat: "mobiles", bg: "linear-gradient(135deg, #0c192c 0%, #1e3a8a 100%)", icon: "📱", badgeColor: "#38bdf8" },
          { title: "Designer Runway Fashion", tag: "NEW SUMMER STYLES", cat: "fashion", bg: "linear-gradient(135deg, #2b091f 0%, #831843 100%)", icon: "👗", badgeColor: "#f472b6" },
          { title: "Smart Home & Living", tag: "INSTANT COIN REWARDS", cat: "appliances", bg: "linear-gradient(135deg, #062b20 0%, #065f46 100%)", icon: "🏠", badgeColor: "#34d399" },
          { title: "VIP Flash Clearance", tag: "LIMITED TIME DEALS", cat: "electronics", bg: "linear-gradient(135deg, #2d1804 0%, #7c2d12 100%)", icon: "⚡", badgeColor: "#fbbf24" }
        ].map((card, idx) => (
          <div 
            key={idx}
            onClick={() => handleCategoryClick(card.cat)}
            style={{
              background: card.bg,
              borderRadius: '14px',
              padding: '14px 16px',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              transition: 'transform 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div>
              <span style={{ fontSize: '9.5px', fontWeight: '900', color: card.badgeColor, letterSpacing: '0.5px' }}>
                {card.tag}
              </span>
              <h4 style={{ margin: '2px 0 0', fontSize: '14px', fontWeight: '800', fontFamily: "'Outfit', sans-serif" }}>
                {card.title}
              </h4>
              <span style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.7)', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '3px', marginTop: '3px' }}>
                Shop Collection →
              </span>
            </div>
            <div style={{ fontSize: '24px', background: 'rgba(255,255,255,0.12)', width: '42px', height: '42px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      {/* ── 7. Curated Marketplace Highlights (Interactive Category Tabs) ── */}
      <section className="home-section-card" style={{ backgroundColor: '#ffffff', borderRadius: '24px', padding: '22px 20px', border: '1px solid #e2e8f0', margin: '14px 12px 0 12px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 className="home-section-heading" style={{ fontFamily: "'Outfit', sans-serif", fontSize: '19px', fontWeight: '900', color: '#090d16', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <span>🛍️</span> Curated For You
            </h3>
            <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
              {activeCuratedTab === 'bestsellers' && "India's highest selling products with verified 5-star customer ratings"}
              {activeCuratedTab === 'newarrivals' && "Freshly restocked premium styles and trending direct-to-consumer tech"}
              {activeCuratedTab === 'toprated' && "Top rated buyer choices verified by 100% genuine reviews"}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '3px', borderRadius: '12px' }}>
              {[
                { id: 'bestsellers', label: '🔥 Best Sellers' },
                { id: 'newarrivals', label: '✨ New Arrivals' },
                { id: 'toprated', label: '⭐ Top Rated' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCuratedTab(tab.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: activeCuratedTab === tab.id ? '800' : '600',
                    background: activeCuratedTab === tab.id ? '#ffffff' : 'transparent',
                    color: activeCuratedTab === tab.id ? '#0f172a' : '#64748b',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: activeCuratedTab === tab.id ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <span 
              style={{ fontSize: '12.5px', color: '#4f46e5', fontWeight: '800', cursor: 'pointer', whiteSpace: 'nowrap' }} 
              onClick={() => onNavigate('catalog')}
            >
              Explore All →
            </span>
          </div>
        </div>

        <div className="product-responsive-row">
          {(activeCuratedTab === 'bestsellers'
            ? (bestSellers.length > 0 ? bestSellers : displayList.slice(0, 4))
            : activeCuratedTab === 'newarrivals'
              ? (newArrivals.length > 0 ? newArrivals : displayList.slice(0, 4))
              : (topRated.length > 0 ? topRated : displayList.slice(0, 4))
          ).map((product, idx) => (
            product ? <ProductCard key={product?.id || product?._id || `curated-${activeCuratedTab}-${idx}`} product={product} onNavigateProduct={onNavigateProduct} /> : null
          ))}
        </div>
      </section>


      {/* ── 8. Official Brand Partners ── */}
      <section className="home-section-card" style={{ backgroundColor: '#ffffff', borderRadius: '24px', padding: '22px 20px', border: '1px solid #e2e8f0', margin: '0 12px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 className="home-section-heading" style={{ fontFamily: "'Outfit', sans-serif", fontSize: '19px', fontWeight: '900', color: '#090d16', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <span>🏛️</span> Official Brand Partners
            </h3>
            <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Direct authorized brand distribution & warranty</p>
          </div>
          <span style={{ fontSize: '11px', color: '#059669', fontWeight: '800', background: '#ecfdf5', padding: '4px 10px', borderRadius: '20px', border: '1px solid #a7f3d0' }}>
            ✓ 100% Genuine
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
          {[
            { name: "APPLE", desc: "iPhone & Mac", icon: "🍏", query: "Apple" },
            { name: "SAMSUNG", desc: "Galaxy AI & 5G", icon: "🌌", query: "Samsung" },
            { name: "SONY", desc: "Studio Audio", icon: "🎧", query: "Sony" },
            { name: "NIKE", desc: "Athletic & Air", icon: "👟", query: "Nike" },
            { name: "BOSE", desc: "QuietComfort", icon: "🔊", query: "Bose" },
            { name: "TITAN", desc: "Smart & Analog", icon: "⌚", query: "Titan" }
          ].map((brand, bIdx) => (
            <div 
              key={bIdx}
              onClick={() => onNavigate('catalog?search=' + encodeURIComponent(brand.query))}
              style={{
                background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '16px 12px',
                color: '#0f172a',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '26px', marginBottom: '6px' }}>{brand.icon}</div>
              <h4 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '14px', fontWeight: '900', margin: '0 0 2px 0', color: '#0f172a' }}>{brand.name}</h4>
              <p style={{ fontSize: '11px', color: '#64748b', margin: 0, fontWeight: '600' }}>{brand.desc}</p>
            </div>
          ))}
        </div>
      </section>




      {/* ── 9.5 Verified Merchant Stores Spotlight ── */}
      <section className="home-section-card" style={{ backgroundColor: '#ffffff', borderRadius: '24px', padding: '22px 20px', border: '1px solid #e2e8f0', margin: '14px 12px 0 12px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 className="home-section-heading" style={{ fontFamily: "'Outfit', sans-serif", fontSize: '19px', fontWeight: '900', color: '#090d16', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Store size={20} color="#059669" /> Verified Merchant Stores
            </h3>
            <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Direct manufacturer & certified brand storefronts</p>
          </div>

          <button 
            onClick={() => onNavigate && onNavigate('seller')}
            style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '6px 14px', borderRadius: '20px', fontWeight: '800', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            🏪 Open Your Store on AbKharido &rarr;
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          {[
            {
              name: 'AbKharido Premier Store',
              slug: 'abkharido-premier-store',
              category: 'Flagship Electronics & Mobiles',
              rating: '4.9',
              sales: '1.2k+ Orders',
              badge: 'OFFICIAL'
            },
            {
              name: 'Apex Audio Labs',
              slug: 'apex-audio-labs',
              category: 'Spatial Headphones & Audio',
              rating: '4.8',
              sales: '850+ Orders',
              badge: 'VERIFIED'
            },
            {
              name: 'AbKharido Couture',
              slug: 'abkharido-couture',
              category: 'Designer Apparel & Footwear',
              rating: '4.9',
              sales: '2.1k+ Orders',
              badge: 'TRENDING'
            },
            {
              name: 'Milton Living Official',
              slug: 'milton-living-official',
              category: 'Home & Kitchen Essentials',
              rating: '4.8',
              sales: '980+ Orders',
              badge: 'CERTIFIED'
            }
          ].map((merchant, mIdx) => (
            <div 
              key={mIdx}
              onClick={() => onNavigate && onNavigate(`catalog?seller=${merchant.slug}`)}
              style={{
                background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '10px'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(15, 23, 42, 0.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '10px', background: '#ecfdf5', color: '#059669', padding: '2px 6px', borderRadius: '4px', fontWeight: '800', border: '1px solid #a7f3d0' }}>
                    ✓ {merchant.badge}
                  </span>
                  <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#f59e0b' }}>★ {merchant.rating}</span>
                </div>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', marginBottom: '2px' }}>{merchant.name}</div>
                <div style={{ fontSize: '11.5px', color: '#64748b' }}>{merchant.category}</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>{merchant.sales}</span>
                <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#4f46e5' }}>Visit Store &rarr;</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 10. Direct Buy & Earn / Creator Economy Hub ── */}
      <section style={{ margin: '14px 12px 0 12px' }}>
        <div style={{ background: 'linear-gradient(135deg, #090d16 0%, #1e1b4b 60%, #312e81 100%)', borderRadius: '24px', padding: '24px 20px', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 30px rgba(9, 13, 22, 0.12)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <span style={{ background: '#fde047', color: '#090d16', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '900', display: 'inline-block', marginBottom: '8px' }}>
                👑 DIRECT BUY & EARN REWARDS
              </span>
              <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: '900', marginBottom: '8px', letterSpacing: '-0.3px' }}>
                Monetize Your Influence & Earn Coins
              </h3>
              <p style={{ color: '#cbd5e1', margin: 0, fontSize: '13px', maxWidth: '520px', lineHeight: '1.5', fontWeight: '500' }}>
                Share genuine product deals on WhatsApp and Instagram to earn up to 12% cash rewards, plus redeem AB Coins for flat discounts on every order.
              </p>
            </div>
            <button 
              style={{ background: 'linear-gradient(135deg, #fde047, #f59e0b)', color: '#090d16', padding: '12px 26px', borderRadius: '30px', fontWeight: '900', fontSize: '13.5px', cursor: 'pointer', border: 'none', boxShadow: '0 8px 20px rgba(245, 158, 11, 0.3)', flexShrink: 0 }} 
              onClick={() => onNavigate && onNavigate('partner')}
            >
              Join Partner Hub →
            </button>
          </div>
        </div>
      </section>

      {/* ── Floating Back to Top Action ── */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          aria-label="Scroll to top"
          style={{
            position: 'fixed',
            bottom: '92px',
            left: '20px',
            zIndex: 1040,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            color: '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '99px',
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: '800',
            cursor: 'pointer',
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.25)',
            animation: 'fadeIn 0.2s ease-out',
            transition: 'transform 0.15s ease',
          }}
        >
          <ArrowUp size={15} color="#38bdf8" />
          <span>Top</span>
        </button>
      )}

    </div>
  );
};



const DealsCountdown = ({ targetDate }) => {
  const getMidnightTarget = () => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
  };
  const effectiveTarget = targetDate || getMidnightTarget();

  const calculateRemaining = () => {
    const now = new Date();
    const diff = Math.max(0, effectiveTarget.getTime() - now.getTime());
    const hrs = Math.floor(diff / (1000 * 60 * 60)).toString().padStart(2, '0');
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
    const secs = Math.floor((diff % (1000 * 60)) / 1000).toString().padStart(2, '0');
    return { hrs, mins, secs };
  };

  const [timer, setTimer] = useState({ hrs: '00', mins: '00', secs: '00' });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTimer(calculateRemaining());
    const interval = setInterval(() => {
      setTimer(calculateRemaining());
    }, 1000);
    return () => clearInterval(interval);
  }, [effectiveTarget]);


  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }} suppressHydrationWarning>
      <span style={{ fontSize: '11.5px', fontWeight: '900', color: '#ef4444', letterSpacing: '0.5px', textTransform: 'uppercase', marginRight: '4px' }}>Ends In</span>
      {[
        { val: timer.hrs, label: 'H' },
        { val: timer.mins, label: 'M' },
        { val: timer.secs, label: 'S' }
      ].map((unit, uIdx) => (
        <React.Fragment key={uIdx}>
          <div style={{ background: '#090d16', color: '#fde047', borderRadius: '8px', padding: '3px 7px', fontSize: '12px', fontWeight: '900', fontFamily: "'Outfit', monospace", boxShadow: '0 2px 6px rgba(0,0,0,0.15)', border: '1px solid #334155' }} suppressHydrationWarning>
            {unit.val}<span style={{ fontSize: '9px', color: '#94a3b8', marginLeft: '2px' }}>{unit.label}</span>
          </div>
          {uIdx < 2 && <span style={{ fontWeight: '900', color: '#090d16' }}>:</span>}
        </React.Fragment>
      ))}
    </div>
  );
};

export default React.memo(Home);
