import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import ProductCard from '../components/ProductCard';
import FlashDealBanner from '../components/FlashDealBanner';
import { ChevronLeft, ChevronRight, Timer, ArrowRight, Sparkles, Award, Zap, ShieldCheck, Truck } from 'lucide-react';
import '../assets/styles/home.css';

const defaultVipCategories = [
  { 
    id: 'all', 
    label: 'All Deals', 
    icon: '🛍️', 
    color: '#4f46e5',
    bg: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)',
    badge: 'HOT' 
  },
  { 
    id: 'mobiles', 
    label: 'Mobiles', 
    icon: '📱', 
    color: '#0284c7',
    bg: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
    badge: 'NEW' 
  },
  { 
    id: 'electronics', 
    label: 'Electronics', 
    icon: '🎧', 
    color: '#7c3aed',
    bg: 'linear-gradient(135deg, #ede9fe 0%, #c4b5fd 100%)',
    badge: '-40%' 
  },
  { 
    id: 'fashion', 
    label: 'Fashion', 
    icon: '👗', 
    color: '#e11d48',
    bg: 'linear-gradient(135deg, #ffe4e6 0%, #fecdd3 100%)',
    badge: 'SALE' 
  },
  { 
    id: 'home', 
    label: 'Home', 
    icon: '🏠', 
    color: '#059669',
    bg: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
    badge: 'TOP' 
  },
  { 
    id: 'beauty', 
    label: 'Beauty', 
    icon: '💄', 
    color: '#d97706',
    bg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
    badge: 'VIP' 
  },
  { 
    id: 'sports', 
    label: 'Sports', 
    icon: '🏋️', 
    color: '#0f172a',
    bg: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
    badge: 'FIT' 
  },
];

const Home = ({ onNavigate, onNavigateProduct, onSelectCategory, promotions, initialProducts }) => {
  const { products: contextProducts, currentUser } = useApp();
  const products = initialProducts || contextProducts || [];
  const [activeSlide, setActiveSlide] = useState(0);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);
  const [selectedCatPill, setSelectedCatPill] = useState('all');

  const activeVipCategories = (promotions && promotions.vipCategories && Array.isArray(promotions.vipCategories) && promotions.vipCategories.length > 0)
    ? promotions.vipCategories
    : defaultVipCategories;
  
  const [layoutComponents, setLayoutComponents] = useState([]);
  const [loadingLayout, setLoadingLayout] = useState(false);

  const slides = (promotions && Array.isArray(promotions.banners))
    ? promotions.banners
    : [
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

  const handleNextSlide = () => setActiveSlide((prev) => (prev + 1) % (slides.length || 1));
  const handlePrevSlide = () => setActiveSlide((prev) => (prev - 1 + slides.length) % (slides.length || 1));

  // Hero carousel auto-timer (pauses on hover/touch)
  useEffect(() => {
    if (slides.length <= 1 || isCarouselPaused) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length, isCarouselPaused]);

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  
  const handleTouchStart = (e) => { 
    setIsCarouselPaused(true);
    touchStartX.current = e.targetTouches[0].clientX; 
  };
  const handleTouchMove = (e) => { touchEndX.current = e.targetTouches[0].clientX; };
  const handleTouchEnd = () => {
    setIsCarouselPaused(false);
    if (touchStartX.current - touchEndX.current > 50) handleNextSlide();
    if (touchStartX.current - touchEndX.current < -50) handlePrevSlide();
  };

  const targetDate = useRef(new Date(Date.now() + 14 * 3600 * 1000 + 42 * 60 * 1000)).current;

  useEffect(() => {
    const fetchLayout = async () => {
      try {
        const savedCms = localStorage.getItem('abkharido_cms_storefront_v2');
        if (savedCms) {
          const parsed = JSON.parse(savedCms);
          const sorted = (parsed.components || parsed || []).sort((a, b) => (a.order || 0) - (b.order || 0));
          setLayoutComponents(Array.isArray(sorted) ? sorted : []);
          return;
        }
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/cms/layout/home_page`);
        if (res.ok) {
          const data = await res.json();
          const sorted = (data.components || []).sort((a, b) => (a.order || 0) - (b.order || 0));
          setLayoutComponents(sorted);
        }
      } catch (err) {
        console.error('Failed to load CMS layout', err);
      }
    };
    fetchLayout();
    window.addEventListener('abkharido_promotions_updated', fetchLayout);
    window.addEventListener('storage', fetchLayout);
    return () => {
      window.removeEventListener('abkharido_promotions_updated', fetchLayout);
      window.removeEventListener('storage', fetchLayout);
    };
  }, []);

  const handleCategoryClick = (catId) => {
    setSelectedCatPill(catId);
    onSelectCategory(catId);
  };

  // Curated product slices
  const flashDeals = products.filter(p => p.originalPrice > p.price).slice(0, 6);
  const bestSellers = products.filter(p => p.rating >= 4.5).slice(0, 6);
  const newArrivals = products.slice(0, 6);

  return (
    <div className="home-page-layout-container" style={{ paddingBottom: '60px' }}>
      
      {/* ── 1. Category Strip / Quick-Links ── */}
      <section
        className="home-category-strip"
        style={{
          position: 'sticky',
          top: '64px',
          zIndex: 90,
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(226, 232, 240, 0.7)',
          boxShadow: '0 4px 16px -4px rgba(9, 13, 22, 0.06)',
          padding: '10px 0 8px 0',
          margin: 0,
        }}
      >
        <div style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingLeft: '12px',
          paddingRight: '12px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}>
          {activeVipCategories.map((cat) => {
            const isSelected = selectedCatPill === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                style={{
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: '8px',
                  background: isSelected ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' : '#ffffff',
                  border: isSelected ? '1px solid transparent' : '1px solid #e2e8f0',
                  cursor: 'pointer',
                  padding: '8px 18px',
                  borderRadius: '99px',
                  boxShadow: isSelected ? '0 4px 16px rgba(124, 58, 237, 0.35)' : '0 2px 6px rgba(0,0,0,0.03)',
                  transition: 'all 0.25s ease',
                  height: '42px',
                }}
              >
                <span style={{ fontSize: '16px' }}>{cat.icon}</span>
                <span style={{
                  fontSize: '13px',
                  fontWeight: '700',
                  color: isSelected ? '#ffffff' : '#334155',
                  fontFamily: "'Outfit', sans-serif",
                  whiteSpace: 'nowrap',
                }}>
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── 2. Personalized VIP Member Bar (When Logged In) ── */}
      {currentUser && (
        <div style={{ maxWidth: '1240px', margin: '0 auto', width: '100%', padding: '0 12px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4f46e5 100%)',
            borderRadius: '20px',
            padding: '16px 20px',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 8px 24px rgba(30, 27, 75, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#fbbf24', color: '#1e1b4b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '900', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '800', fontFamily: "'Outfit', sans-serif" }}>
                  Welcome back, {currentUser.fullName || currentUser.username || 'Member'}! 👋
                </div>
                <div style={{ fontSize: '12.5px', color: '#e0e7ff', marginTop: '2px', fontWeight: '500' }}>
                  🪙 <strong style={{ color: '#fde047', fontWeight: '800' }}>{currentUser.walletCoins !== undefined ? currentUser.walletCoins : 100} AB Coins</strong> ready to redeem at checkout
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button 
                onClick={() => onNavigate('orders')}
                style={{ background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.25)', color: '#ffffff', padding: '8px 14px', borderRadius: '10px', fontSize: '12.5px', fontWeight: '700', cursor: 'pointer' }}
              >
                📦 Track Orders
              </button>
              <button 
                onClick={() => onNavigate('wishlist')}
                style={{ background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.25)', color: '#ffffff', padding: '8px 14px', borderRadius: '10px', fontSize: '12.5px', fontWeight: '700', cursor: 'pointer' }}
              >
                ❤️ Saved Items
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. Hero / Banner Carousel (Auto-Pauses on Hover/Touch, Eager First Image) ── */}
      {slides.length > 0 && (
        <section 
          className="hero-carousel"
          onMouseEnter={() => setIsCarouselPaused(true)}
          onMouseLeave={() => setIsCarouselPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {slides.map((slide, idx) => {
            const slideBg = slide.imageUrl ? `url(${slide.imageUrl}) center/cover no-repeat` : (slide.bg || slide.bgGradient || 'var(--primary-color)');
            const slideTag = slide.badge || slide.tag || '🇮🇳 PROUDLY INDIA #1 MEGASTORE';
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
                
                <div className="slide-content-box" style={{ maxWidth: '620px' }}>
                  <span className="slide-tag" style={{ background: '#fde047', color: '#0f172a', fontWeight: '900', padding: '4px 12px', borderRadius: '100px', fontSize: '11px', textTransform: 'uppercase', display: 'inline-block', marginBottom: '12px' }}>
                    {slideTag}
                  </span>
                  <h1 className="slide-title" style={{ fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: '900', lineHeight: '1.15', marginBottom: '12px', letterSpacing: '-0.5px' }}>
                    {slideTitle}
                  </h1>
                  <p className="slide-desc" style={{ fontSize: 'clamp(13px, 2vw, 15px)', color: '#e2e8f0', lineHeight: '1.5', marginBottom: '20px', fontWeight: '500' }}>
                    {slideDesc}
                  </p>
                  
                  <div>
                    <button 
                      className="btn hero-cta-btn" 
                      style={{ 
                        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                        color: 'white',
                        borderRadius: '30px', 
                        padding: '12px 26px', 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        border: '1px solid rgba(255, 255, 255, 0.4)', 
                        fontFamily: "'Outfit', sans-serif",
                        fontWeight: '900', 
                        fontSize: '14px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        cursor: 'pointer'
                      }}
                      onClick={() => onSelectCategory(slideCat)}
                    >
                      ⚡ Claim Deal Now <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          <button className="carousel-nav-btn carousel-nav-left" onClick={handlePrevSlide} aria-label="Previous Slide">
            <ChevronLeft size={24} />
          </button>
          <button className="carousel-nav-btn carousel-nav-right" onClick={handleNextSlide} aria-label="Next Slide">
            <ChevronRight size={24} />
          </button>
        </section>
      )}

      {/* ── 4. 4-Pillar Trust Signals USP Row ── */}
      <div className="home-trust-grid" style={{ margin: '4px 0 12px 0' }}>
        {[
          { icon: <Zap size={22} color="#0284c7" />, title: "Priority Express Dispatch", sub: "Fast 24-48 hr doorstep drop", bg: "linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)", border: "#e0f2fe" },
          { icon: <ShieldCheck size={22} color="#059669" />, title: "100% Cashfree Escrow", sub: "Bank-grade payment security", bg: "linear-gradient(135deg, #ffffff 0%, #ecfdf5 100%)", border: "#d1fae5" },
          { icon: <Truck size={22} color="#7c3aed" />, title: "Easy 7-Day Replacement", sub: "Hassle-free doorstep returns", bg: "linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%)", border: "#ede9fe" },
          { icon: <Award size={22} color="#d97706" />, title: "Cash on Delivery (COD)", sub: "Pay at doorstep at 27K+ PINs", bg: "linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)", border: "#fef3c7" },
        ].map((item, idx) => (
          <div key={idx} style={{
            background: item.bg, 
            border: `1px solid ${item.border}`, 
            borderRadius: '18px', 
            padding: '14px 18px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '14px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
          }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'white', border: `1px solid ${item.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
              {item.icon}
            </div>
            <div>
              <h4 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '14px', fontWeight: '800', color: '#090d16', margin: '0 0 2px 0' }}>{item.title}</h4>
              <p style={{ fontSize: '11.5px', color: '#64748b', margin: 0, fontWeight: '600' }}>{item.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── 5. Flash Deals / Deal of the Day (Live Countdown Timer) ── */}
      <section className="home-section-card" style={{ backgroundColor: '#ffffff', borderRadius: '24px', padding: '20px 16px', border: '1px solid #e2e8f0', margin: '0 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 className="home-section-heading" style={{ fontFamily: "'Outfit', sans-serif", fontSize: '19px', fontWeight: '900', color: '#090d16', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <span>⚡</span> Deal of the Day
            </h3>
            <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Limited lightning deals with extra discount coupons</p>
          </div>
          <DealsCountdown targetDate={targetDate} />
        </div>

        {/* Product responsive row (Horizontal swipe on mobile, grid on desktop) */}
        {products.length === 0 ? (
          <div className="product-responsive-row">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} style={{ height: '280px', backgroundColor: '#f1f5f9', borderRadius: '18px' }} />
            ))}
          </div>
        ) : (
          <div className="product-responsive-row">
            {(flashDeals.length > 0 ? flashDeals : products.slice(0, 6)).map(product => (
              <ProductCard key={product.id} product={product} onNavigateProduct={onNavigateProduct} />
            ))}
          </div>
        )}
      </section>

      {/* ── 6. Best Sellers in India ── */}
      <section className="home-section-card" style={{ backgroundColor: '#ffffff', borderRadius: '24px', padding: '20px 16px', border: '1px solid #e2e8f0', margin: '0 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 className="home-section-heading" style={{ fontFamily: "'Outfit', sans-serif", fontSize: '19px', fontWeight: '900', color: '#090d16', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <span>🔥</span> Best Sellers in India
            </h3>
            <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Highest customer satisfaction ratings across all categories</p>
          </div>
          <span style={{ fontSize: '13px', color: '#4f46e5', fontWeight: '800', cursor: 'pointer' }} onClick={() => onNavigate('catalog')}>
            Explore All →
          </span>
        </div>

        <div className="product-responsive-row">
          {(bestSellers.length > 0 ? bestSellers : products.slice(0, 6)).map(product => (
            <ProductCard key={product.id} product={product} onNavigateProduct={onNavigateProduct} />
          ))}
        </div>
      </section>

      {/* ── 7. New Arrivals & Trending Picks ── */}
      <section className="home-section-card" style={{ backgroundColor: '#ffffff', borderRadius: '24px', padding: '20px 16px', border: '1px solid #e2e8f0', margin: '0 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 className="home-section-heading" style={{ fontFamily: "'Outfit', sans-serif", fontSize: '19px', fontWeight: '900', color: '#090d16', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <span>✨</span> New Arrivals & Trending Picks
            </h3>
            <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Freshly restocked premium styles and high-demand electronics</p>
          </div>
          <span style={{ fontSize: '13px', color: '#4f46e5', fontWeight: '800', cursor: 'pointer' }} onClick={() => onNavigate('catalog')}>
            View All →
          </span>
        </div>

        <div className="product-responsive-row">
          {(newArrivals.length > 0 ? newArrivals : products.slice(0, 6)).map(product => (
            <ProductCard key={product.id} product={product} onNavigateProduct={onNavigateProduct} />
          ))}
        </div>
      </section>

      {/* ── 8. Official Brand Partners ── */}
      <section className="home-section-card" style={{ backgroundColor: '#ffffff', borderRadius: '24px', padding: '20px 16px', border: '1px solid #e2e8f0', margin: '0 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
          {[
            { name: "APPLE", desc: "iPhone & Mac", icon: "🍏", accent: "#38bdf8", query: "Apple" },
            { name: "SAMSUNG", desc: "Galaxy AI & 5G", icon: "🌌", accent: "#818cf8", query: "Samsung" },
            { name: "SONY", desc: "Studio Audio", icon: "🎧", accent: "#a78bfa", query: "Sony" },
            { name: "NIKE", desc: "Athletic & Air", icon: "👟", accent: "#f43f5e", query: "Nike" },
            { name: "BOSE", desc: "QuietComfort", icon: "🔊", accent: "#34d399", query: "Bose" },
            { name: "ROLEX", desc: "Swiss Couture", icon: "⌚", accent: "#fde047", query: "Rolex" }
          ].map((brand, bIdx) => (
            <div 
              key={bIdx}
              onClick={() => onNavigate('catalog?search=' + encodeURIComponent(brand.query))}
              style={{
                background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                border: '1px solid #e2e8f0',
                borderRadius: '18px',
                padding: '16px 14px',
                color: '#0f172a',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>{brand.icon}</div>
              <h4 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '15px', fontWeight: '900', margin: '0 0 2px 0', color: '#0f172a' }}>{brand.name}</h4>
              <p style={{ fontSize: '11px', color: '#64748b', margin: 0, fontWeight: '600' }}>{brand.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 9. Verified Customer Testimonials Carousel / Grid ── */}
      <section className="home-section-card" style={{ backgroundColor: '#ffffff', borderRadius: '24px', padding: '22px 18px', border: '1px solid #e2e8f0', margin: '0 12px' }}>
        <div style={{ marginBottom: '16px' }}>
          <h3 className="home-section-heading" style={{ fontFamily: "'Outfit', sans-serif", fontSize: '19px', fontWeight: '900', color: '#090d16', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <span>⭐</span> Verified Customer Reviews
          </h3>
          <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Real feedback from shoppers across India</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
          {[
            {
              name: "Rajesh Sharma",
              city: "New Delhi",
              comment: "Ordered iPhone 16 Pro on Sunday, delivered to Delhi in 24 hours with sealed packaging. Super genuine!",
              rating: 5,
              item: "Apple iPhone 16 Pro 5G"
            },
            {
              name: "Ananya Roy",
              city: "Bengaluru",
              comment: "Loved the return policy! Exchanged my footwear size seamlessly at doorstep without even having to call support.",
              rating: 5,
              item: "Nike Air Max Pulse"
            },
            {
              name: "Vikram Patil",
              city: "Pune",
              comment: "Cashfree escrow security and instant 50 AB Coins cashback on UPI made checkout so rewarding. Best e-commerce site!",
              rating: 5,
              item: "Sony Spatial Noise-Cancelling Headphones"
            },
            {
              name: "Priya Mehra",
              city: "Mumbai",
              comment: "Quality is top notch! The designer dress arrived in luxury box packaging with genuine tag verification.",
              rating: 5,
              item: "Luxe Couture Silk Ensemble"
            }
          ].map((review, rIdx) => (
            <div 
              key={rIdx} 
              style={{
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '10px'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {[...Array(review.rating)].map((_, i) => (
                      <span key={i} style={{ color: '#f59e0b', fontSize: '13px' }}>★</span>
                    ))}
                  </div>
                  <span style={{ fontSize: '10.5px', background: '#ecfdf5', color: '#059669', padding: '2px 6px', borderRadius: '4px', fontWeight: '800', border: '1px solid #a7f3d0' }}>
                    ✓ Verified Buyer
                  </span>
                </div>
                <p style={{ fontSize: '12.5px', color: '#334155', lineHeight: '1.5', margin: 0, fontStyle: 'italic' }}>
                  &ldquo;{review.comment}&rdquo;
                </p>
              </div>
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a' }}>{review.name} ({review.city})</span>
                <span style={{ fontSize: '10.5px', color: '#64748b' }}>{review.item}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 10. Direct Buy & Earn / Creator Economy Hub ── */}
      <section style={{ margin: '16px 12px 0 12px' }}>
        <div style={{ background: 'linear-gradient(135deg, #090d16 0%, #1e1b4b 60%, #312e81 100%)', borderRadius: '24px', padding: '24px 20px', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 30px rgba(9, 13, 22, 0.12)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <span style={{ background: '#fde047', color: '#090d16', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '900', display: 'inline-block', marginBottom: '8px' }}>
                👑 DIRECT BUY & EARN REWARDS
              </span>
              <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: '900', marginBottom: '8px', letterSpacing: '-0.3px' }}>
                Monetize Your Influence & Earn Coins
              </h3>
              <p style={{ color: '#cbd5e1', margin: 0, fontSize: '13.5px', maxWidth: '520px', lineHeight: '1.5', fontWeight: '500' }}>
                Share genuine product deals on WhatsApp and Instagram to earn up to 12% cash rewards, plus redeem AB Coins for flat discounts on every order.
              </p>
            </div>
            <button 
              style={{ background: 'linear-gradient(135deg, #fde047, #f59e0b)', color: '#090d16', padding: '12px 28px', borderRadius: '30px', fontWeight: '900', fontSize: '14px', cursor: 'pointer', border: 'none', boxShadow: '0 8px 20px rgba(245, 158, 11, 0.3)', flexShrink: 0 }} 
              onClick={() => onNavigate && onNavigate('partner')}
            >
              Join Partner Hub →
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};

const DealsCountdown = ({ targetDate }) => {
  const [timer, setTimer] = useState({ hrs: '00', mins: '00', secs: '00' });
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();
      if (diff <= 0) { setTimer({ hrs: '00', mins: '00', secs: '00' }); return; }
      const hrs = Math.floor(diff / (1000 * 60 * 60)).toString().padStart(2, '0');
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
      const secs = Math.floor((diff % (1000 * 60)) / 1000).toString().padStart(2, '0');
      setTimer({ hrs, mins, secs });
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span style={{ fontSize: '12px', fontWeight: '900', color: '#ef4444', letterSpacing: '0.5px', textTransform: 'uppercase', marginRight: '4px' }}>Ends In</span>
      {[
        { val: timer.hrs, label: 'H' },
        { val: timer.mins, label: 'M' },
        { val: timer.secs, label: 'S' }
      ].map((unit, uIdx) => (
        <React.Fragment key={uIdx}>
          <div style={{ background: '#090d16', color: '#fde047', borderRadius: '8px', padding: '4px 8px', fontSize: '13px', fontWeight: '900', fontFamily: "'Outfit', monospace", boxShadow: '0 2px 6px rgba(0,0,0,0.15)', border: '1px solid #334155' }}>
            {unit.val}<span style={{ fontSize: '10px', color: '#94a3b8', marginLeft: '2px' }}>{unit.label}</span>
          </div>
          {uIdx < 2 && <span style={{ fontWeight: '900', color: '#090d16' }}>:</span>}
        </React.Fragment>
      ))}
    </div>
  );
};

export default React.memo(Home);
