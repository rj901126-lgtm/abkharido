import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import ProductCard from '../components/ProductCard';
import { 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight, 
  Zap, 
  ShieldCheck, 
  Truck, 
  Award, 
  Sparkles, 
  Filter, 
  Store, 
  ArrowUp,
  Headphones,
  Smartphone,
  Shirt,
  Home as HomeIcon,
  CheckCircle2,
  LayoutGrid
} from 'lucide-react';
import '../assets/styles/home.css';

const defaultVipCategories = [
  { id: 'all', label: 'All Categories', icon: LayoutGrid, bg: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', color: '#334155' },
  { id: 'electronics', label: 'Audio & Tech', icon: Headphones, bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', color: '#1d4ed8' },
  { id: 'mobiles', label: 'Mobiles & 5G', icon: Smartphone, bg: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', color: '#15803d' },
  { id: 'fashion', label: 'Fashion', icon: Shirt, bg: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)', color: '#be185d' },
  { id: 'appliances', label: 'Appliances', icon: HomeIcon, bg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', color: '#b45309' },
  { id: 'beauty', label: 'Beauty & Care', icon: Sparkles, bg: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)', color: '#7e22ce' },
  { id: 'sports', label: 'Sports & Fitness', icon: Award, bg: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', color: '#047857' },
];

const Home = ({ onNavigate, onNavigateProduct, onSelectCategory, promotions, initialProducts }) => {
  const { products: contextProducts, currentUser } = useApp();
  const products = initialProducts?.length ? initialProducts : (contextProducts || []);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);
  const [activeCuratedTab, setActiveCuratedTab] = useState('bestsellers');
  const targetDate = useRef((() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
  })()).current;

  // Derive categories: Always display full department suite so catalog is accessible for future and current stock
  const activeVipCategories = React.useMemo(() => {
    const inStockCats = new Set(
      (Array.isArray(products) ? products : [])
        .filter(p => p && (Number(p.stock) > 0 || p.inStock) && (p.status === 'published' || p.status === 'active') && !p.isArchived)
        .map(p => (p.category || '').toLowerCase().trim())
        .filter(Boolean)
    );
    return defaultVipCategories.map(cat => ({
      ...cat,
      hasStock: inStockCats.has(cat.id.toLowerCase())
    }));
  }, [products]);

  const defaultSlides = [
    {
      isSignature: true,
      productId: 'signature-wireless-earphone',
      title: 'Signature Sigboom 21',
      subTitle: 'RGB Wireless Bluetooth Speaker',
      tag: 'ABKHARIDO ORIGINAL • FLAT 50% OFF',
      price: 379,
      originalPrice: 758,
      discount: '50% OFF',
      rating: 0,
      reviewsCount: 0,
      image: 'https://res.cloudinary.com/rx1klbob/image/upload/v1784995324/abkharido/products/r687it063mcwcn507c9w.jpg',
      features: [
        '360° High Bass Sound',
        'Dynamic RGB Lights',
        'Mobile Stand Mount',
        '12hr Battery & FM/BT/TF'
      ],
      cat: 'electronics'
    },
    {
      title: 'Direct From Certified Indian Warehouses',
      desc: 'Quality checked consumer electronics and direct-to-consumer goods. Reliable courier dispatch across Indian PIN codes.',
      bg: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
      tag: 'VERIFIED DISPATCH',
      cat: 'electronics'
    },
    {
      title: 'Shop With Complete Confidence',
      desc: 'Cash on Delivery available on eligible orders up to ₹15,000. Easy 7-day doorstep replacement guarantee.',
      bg: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)',
      tag: 'BUYER PROTECTION',
      cat: 'electronics'
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

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      setShowBackToTop(scrollY > 400);
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
    } else if (catId === 'appliances') {
      if (onNavigate) onNavigate('appliances');
      else if (onSelectCategory) onSelectCategory('appliances');
    } else if (catId === 'home') {
      if (onNavigate) onNavigate('appliances');
      else if (onSelectCategory) onSelectCategory('home');
    } else if (catId === 'all') {
      if (onNavigate) onNavigate('categories');
      else if (onSelectCategory) onSelectCategory('all');
    } else if (onSelectCategory) {
      onSelectCategory(catId);
    } else if (onNavigate) {
      onNavigate(`catalog?category=${catId}`);
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
      
      {/* ── 1. Hero / Banner Carousel (With Dot Indicators & Auto-Rotate) ── */}
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

                      {/* Right: Clean Studio Product Showcase Frame */}
                      <div className="signature-hero-right">
                        <div className="sig-studio-card">
                          <img 
                            src={slide.image} 
                            alt={slide.title} 
                            className="signature-hero-img"
                          />
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
                          background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
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
                          boxShadow: '0 6px 16px rgba(37, 99, 235, 0.35)'
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
                  backgroundColor: dotIdx === activeSlide ? 'var(--brand-accent)' : '#cbd5e1',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── 2. 4-Pillar Trust Signals USP Bar (Instant Reassurance) ── */}
      <div className="home-trust-grid" style={{ margin: '4px 12px 6px' }}>
        {[
          { icon: <Truck size={18} color="#0284c7" />, title: "Standard Courier Dispatch", sub: "Reliable 2-5 business days", bg: "linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)", border: "#e0f2fe" },
          { icon: <ShieldCheck size={18} color="#059669" />, title: "Secure Cashfree Checkout", sub: "Encrypted payment gateway", bg: "linear-gradient(135deg, #ffffff 0%, #ecfdf5 100%)", border: "#d1fae5" },
          { icon: <CheckCircle2 size={18} color="var(--brand-accent)" />, title: "Easy 7-Day Replacement", sub: "Hassle-free doorstep returns", bg: "linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)", border: "#dbeafe" },
          { icon: <Award size={18} color="#d97706" />, title: "Cash on Delivery (COD)", sub: "Eligible orders up to ₹15,000", bg: "linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)", border: "#fef3c7" },
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

      {/* ── 3. Category Strip (Smooth, jitter-free department navigation) ── */}
      <section className="home-category-strip">
        <div className="home-category-pills-row">
          {activeVipCategories.map((cat) => {
            const CatIcon = cat.icon || Sparkles;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className="home-category-pill-btn"
                type="button"
                aria-label={`Filter by ${cat.label}`}
              >
                <div 
                  className="category-pill-icon-wrap"
                  style={{ background: cat.bg || '#f1f5f9' }}
                >
                  <CatIcon size={18} color={cat.color || 'var(--brand-accent)'} />
                </div>
                <span className="category-pill-name">
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

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

      {/* ── 6. Category Highlights (Active In-Stock Categories) ── */}
      {activeVipCategories.some(c => c.hasStock && c.id !== 'all') && (
        <div style={{ margin: '12px 12px 16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          {activeVipCategories.filter(c => c.hasStock && c.id !== 'all').map((cat, idx) => {
            const CatIcon = cat.icon || Sparkles;
            return (
              <div 
                key={idx}
                onClick={() => handleCategoryClick(cat.id)}
                style={{
                  background: 'linear-gradient(135deg, #090d16 0%, #1e293b 100%)',
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
                  <span style={{ fontSize: '9.5px', fontWeight: '900', color: '#38bdf8', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    IN-STOCK INVENTORY
                  </span>
                  <h4 style={{ margin: '2px 0 0', fontSize: '14px', fontWeight: '800', fontFamily: "'Outfit', sans-serif" }}>
                    {cat.label}
                  </h4>
                  <span style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.7)', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '3px', marginTop: '3px' }}>
                    Shop Collection →
                  </span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.12)', width: '42px', height: '42px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CatIcon size={20} color="#ffffff" />
                </div>
              </div>
            );
          })}
        </div>
      )}

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
              {activeCuratedTab === 'toprated' && "Top rated buyer choices and customer favorites"}
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
              style={{ fontSize: '12.5px', color: 'var(--brand-accent)', fontWeight: '800', cursor: 'pointer', whiteSpace: 'nowrap' }} 
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


      {/* ── 8. Featured Shopping Collections ── */}
      <section className="home-section-card" style={{ backgroundColor: '#ffffff', borderRadius: '24px', padding: '22px 20px', border: '1px solid #e2e8f0', margin: '0 12px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 className="home-section-heading" style={{ fontFamily: "'Outfit', sans-serif", fontSize: '19px', fontWeight: '900', color: '#090d16', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <span>🛍️</span> Popular Shopping Collections
            </h3>
            <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Curated lifestyle, electronics &amp; everyday fashion</p>
          </div>
          <span style={{ fontSize: '11px', color: '#059669', fontWeight: '800', background: '#ecfdf5', padding: '4px 10px', borderRadius: '20px', border: '1px solid #a7f3d0' }}>
            ✓ Verified Store
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
          {[
            { name: "AUDIO & SOUND", desc: "Bluetooth Speakers & ANC", icon: "🔊", query: "electronics" },
            { name: "SMART GADGETS", desc: "Wearables & Accessories", icon: "⌚", query: "electronics" },
            { name: "HOME LIVING", desc: "Decor & Lighting", icon: "🏠", query: "home" },
            { name: "CASUAL FASHION", desc: "Everyday Wear & Essentials", icon: "👕", query: "fashion" },
            { name: "KITCHEN & CARE", desc: "Appliances & Tools", icon: "🍳", query: "appliances" },
            { name: "TRENDING DEALS", desc: "Best Offers & Savings", icon: "⚡", query: "all" }
          ].map((catItem, bIdx) => (
            <div 
              key={bIdx}
              onClick={() => onNavigate(catItem.query === 'all' ? 'catalog' : 'catalog?category=' + encodeURIComponent(catItem.query))}
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
              <div style={{ fontSize: '26px', marginBottom: '6px' }}>{catItem.icon}</div>
              <h4 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '14px', fontWeight: '900', margin: '0 0 2px 0', color: '#0f172a' }}>{catItem.name}</h4>
              <p style={{ fontSize: '11px', color: '#64748b', margin: 0, fontWeight: '600' }}>{catItem.desc}</p>
            </div>
          ))}
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
