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
  const { products: contextProducts } = useApp();
  const products = initialProducts || contextProducts || [];
  const [activeSlide, setActiveSlide] = useState(0);
  const [selectedCatPill, setSelectedCatPill] = useState('all');

  const activeVipCategories = (promotions && promotions.vipCategories && Array.isArray(promotions.vipCategories) && promotions.vipCategories.length > 0)
    ? promotions.vipCategories
    : defaultVipCategories;
  
  const [layoutComponents, setLayoutComponents] = useState([]);
  const [loadingLayout, setLoadingLayout] = useState(true);

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
          desc: 'Elevate your aesthetic with our direct-from-designer runway collection. Uncompromising titanium luxury at revolutionary member prices.',
          bg: 'url(https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1400&auto=format&fit=crop) center/cover no-repeat',
          tag: '✨ VIP SUMMER COLLECTION',
          cat: 'fashion'
        }
      ];

  const handleNextSlide = () => setActiveSlide((prev) => (prev + 1) % (slides.length || 1));
  const handlePrevSlide = () => setActiveSlide((prev) => (prev - 1 + slides.length) % (slides.length || 1));

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  
  const handleTouchStart = (e) => { touchStartX.current = e.targetTouches[0].clientX; };
  const handleTouchMove = (e) => { touchEndX.current = e.targetTouches[0].clientX; };
  const handleTouchEnd = () => {
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
          setLoadingLayout(false);
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
      } finally {
        setLoadingLayout(false);
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

  return (
    <div className="home-page-layout-container" style={{ paddingBottom: '80px' }}>
      {/* ── Category Strip ── Flipkart-style circular icons ── */}
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
          gap: '0',
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
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 10px',
                  transition: 'all 0.2s ease',
                  minWidth: '64px',
                }}
              >
                {/* Circular icon */}
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: isSelected ? cat.bg || 'linear-gradient(135deg, #ede9fe, #ddd6fe)' : cat.bg || '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  border: isSelected 
                    ? `2.5px solid ${cat.color || '#4f46e5'}` 
                    : '2px solid rgba(226, 232, 240, 0.8)',
                  boxShadow: isSelected 
                    ? `0 6px 18px -4px ${cat.color || '#4f46e5'}55` 
                    : '0 2px 8px rgba(0,0,0,0.06)',
                  transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                  transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}>
                  {cat.icon}
                </div>

                {/* Label */}
                <span style={{
                  fontSize: '10.5px',
                  fontWeight: isSelected ? '800' : '600',
                  color: isSelected ? (cat.color || '#4f46e5') : '#475569',
                  fontFamily: "'Outfit', sans-serif",
                  letterSpacing: '-0.1px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                }}>
                  {cat.label}
                </span>

                {/* Active dot indicator */}
                {isSelected && (
                  <div style={{
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    background: cat.color || '#4f46e5',
                    marginTop: '-2px',
                  }} />
                )}
              </button>
            );
          })}
        </div>
      </section>


      {slides.length > 0 && (
        <section 
          className="hero-carousel"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {slides.map((slide, idx) => {
            const slideBg = slide.imageUrl ? `url(${slide.imageUrl}) center/cover no-repeat` : (slide.bg || slide.bgGradient || 'var(--primary-color)');
            const slideTag = slide.badge || slide.tag || '🇮🇳 PROUDLY INDIA #1 MEGASTORE';
            const slideTitle = slide.title || 'Grand Store Exclusive';
            const slideDesc = slide.subTitle || slide.desc || 'Experience hyper-luxury delivery, verified bank cash protection, and instant creator commission incentives.';
            const slideCat = slide.link ? slide.link.split('/').pop().replace('category=', '').replace('?','') : (slide.cat || 'all');

            return (
              <div 
                key={slide.id || idx} 
                className={`carousel-slide ${idx === activeSlide ? 'active' : ''}`}
                style={{ background: slideBg }}
              >
                <div className="carousel-slide-overlay"></div>
                
                <div className="slide-content-box" style={{ maxWidth: '620px' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(12px)', padding: '6px 14px', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.3)', marginBottom: '16px' }}>
                    <Sparkles size={14} style={{ color: '#fde047' }} />
                    <span style={{ fontSize: '12px', fontWeight: '900', letterSpacing: '0.5px', color: '#ffffff', textTransform: 'uppercase' }}>{slideTag}</span>
                  </div>
                  
                  <h1 className="slide-title" style={{ fontFamily: "'Outfit', sans-serif", fontSize: '42px', fontWeight: '900', lineHeight: '1.1', marginBottom: '16px', letterSpacing: '-1px' }}>
                    {slideTitle}
                  </h1>
                  <p className="slide-desc" style={{ fontSize: '16px', color: '#e2e8f0', lineHeight: '1.6', marginBottom: '28px', fontWeight: '500' }}>
                    {slideDesc}
                  </p>
                  
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button 
                      className="btn animate-fade-in" 
                      style={{ 
                        background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)',
                        color: 'white',
                        borderRadius: '30px', 
                        padding: '12px 24px', 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        border: '1px solid rgba(255, 255, 255, 0.3)', 
                        fontFamily: "'Outfit', sans-serif",
                        fontWeight: '800', 
                        fontSize: '14px',
                        boxShadow: '0 8px 20px -4px rgba(99, 102, 241, 0.5)',
                        cursor: 'pointer'
                      }}
                      onClick={() => onSelectCategory(slideCat)}
                    >
                      ⚡ Grab Deal Now <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          <button className="carousel-nav-btn carousel-nav-left" onClick={handlePrevSlide}>
            <ChevronLeft size={26} />
          </button>
          <button className="carousel-nav-btn carousel-nav-right" onClick={handleNextSlide}>
            <ChevronRight size={26} />
          </button>
        </section>
      )}

      {/* ⚡ Flash Deal Strip — compact, below hero */}
      <FlashDealBanner />

      <div className="home-trust-grid" style={{ margin: '8px 0 16px 0' }}>
        {[
          { icon: <Zap size={24} color="#0284c7" />, title: "Priority Express Dispatch", sub: "Fast 24-48 hr doorstep drop", bg: "linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)", border: "#e0f2fe", accent: "#0284c7" },
          { icon: <ShieldCheck size={24} color="#059669" />, title: "100% Cashfree Escrow", sub: "Bank-grade escrow security", bg: "linear-gradient(135deg, #ffffff 0%, #ecfdf5 100%)", border: "#d1fae5", accent: "#059669" },
          { icon: <Truck size={24} color="#7c3aed" />, title: "Easy 7-Day Return", sub: "Hassle-free replacement policy", bg: "linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%)", border: "#ede9fe", accent: "#7c3aed" },
          { icon: <Award size={24} color="#d97706" />, title: "Platinum Club Rebates", sub: "Earn up to 12% in coins", bg: "linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)", border: "#fef3c7", accent: "#d97706" },
        ].map((item, idx) => (
          <div key={idx} style={{
            background: item.bg, 
            border: `1px solid ${item.border}`, 
            borderRadius: '20px', 
            padding: '18px 20px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '16px',
            boxShadow: '0 4px 16px -2px rgba(9, 13, 22, 0.04)',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            cursor: 'default'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 24px -4px rgba(9, 13, 22, 0.08)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 16px -2px rgba(9, 13, 22, 0.04)'; }}
          >
            <div style={{ width: '50px', height: '50px', borderRadius: '14px', backgroundColor: 'white', border: `1px solid ${item.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              {item.icon}
            </div>
            <div>
              <h4 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '15px', fontWeight: '800', color: '#090d16', margin: '0 0 3px 0' }}>{item.title}</h4>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0, fontWeight: '600' }}>{item.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {loadingLayout ? (
        <div className="skeleton-container" style={{ padding: '20px' }}>
          <div className="skeleton-pulse" style={{ width: '220px', height: '36px', borderRadius: '10px' }}></div>
        </div>
      ) : (
        layoutComponents.map((comp) => {
          if (comp.type === 'deals_row') {
            const dealsProducts = products
              .filter(p => promotions && promotions.dealsProducts ? promotions.dealsProducts.includes(p.id) : p.originalPrice > p.price)
              .slice(0, 6);
            
            return (
              <section key={comp.id} className="home-section-card" style={{ backgroundColor: '#ffffff', borderRadius: '24px', padding: '20px 16px', border: '1px solid #e2e8f0', marginBottom: '12px', margin: '0 12px 0 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                  <span className="home-section-heading" style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: '6px' }}>⚡ {comp.title || 'VIP Lightning Deals'}</span>
                  <DealsCountdown targetDate={targetDate} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  {dealsProducts.map(product => (
                    <ProductCard key={product.id} product={product} onNavigateProduct={onNavigateProduct} />
                  ))}
                </div>
              </section>
            );
          }
          return null;
        })
      )}

      {/* 🏛️ OFFICIAL BRAND PAVILIONS & AUTHORISED BOUTIQUES */}
      <section className="home-section-card" style={{ backgroundColor: '#ffffff', borderRadius: '24px', padding: '20px 16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(9, 13, 22, 0.04)', margin: '0 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 className="home-section-heading" style={{ fontFamily: "'Outfit', sans-serif", fontSize: '20px', fontWeight: '900', color: '#090d16', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <span>🏛️</span> Top Brand Partners
            </h3>
            <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Direct from licensed brand distributors</p>
          </div>
          <span style={{ fontSize: '11px', color: '#059669', fontWeight: '800', background: '#ecfdf5', padding: '5px 12px', borderRadius: '20px', border: '1px solid #a7f3d0', whiteSpace: 'nowrap' }}>
            ✓ 100% Genuine
          </span>
        </div>
        <div className="home-brand-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
          {[
            { name: "APPLE", desc: "Flagship Mac & iPhone", icon: "🍏", accent: "#38bdf8", border: "rgba(56, 189, 248, 0.25)", tag: "DIRECT PARTNER" },
            { name: "SAMSUNG", desc: "Galaxy AI & Ultra 5G", icon: "✨", accent: "#818cf8", border: "rgba(129, 140, 248, 0.25)", tag: "FLUSH STOCK" },
            { name: "SONY AUDIO", desc: "Noise Cancel & Studio", icon: "🎧", accent: "#a78bfa", border: "rgba(167, 139, 250, 0.25)", tag: "AUDIOPHILE" },
            { name: "NIKE SPORT", desc: "VaporFly & Air Max", icon: "⚡", accent: "#f43f5e", border: "rgba(244, 63, 94, 0.25)", tag: "AUTHORIZED" },
            { name: "BOSE LUXE", desc: "Acoustic QuietComfort", icon: "🎼", accent: "#34d399", border: "rgba(52, 211, 153, 0.25)", tag: "PREMIUM" },
            { name: "ROLEX / TAG", desc: "Titanium Swiss Couture", icon: "⌚", accent: "#fde047", border: "rgba(253, 224, 71, 0.25)", tag: "HERITAGE" }
          ].map((brand, bIdx) => (
            <div 
              key={bIdx}
              onClick={() => onNavigate('catalog')}
              style={{
                background: 'linear-gradient(145deg, #0f172a 0%, #090d16 100%)',
                border: `1px solid ${brand.border}`,
                borderRadius: '24px',
                padding: '22px 18px',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '144px',
                boxShadow: '0 10px 20px rgba(9, 13, 22, 0.15)'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = `0 16px 32px -8px ${brand.accent}35`; e.currentTarget.style.borderColor = brand.accent; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(9, 13, 22, 0.15)'; e.currentTarget.style.borderColor = brand.border; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '30px', filter: 'drop-shadow(0 4px 8px rgba(255,255,255,0.15))' }}>{brand.icon}</span>
                <span style={{ fontSize: '10px', fontWeight: '900', letterSpacing: '0.5px', background: 'rgba(255,255,255,0.06)', color: brand.accent, border: `1px solid ${brand.accent}50`, padding: '3px 9px', borderRadius: '12px', textTransform: 'uppercase' }}>
                  {brand.tag}
                </span>
              </div>
              <div style={{ marginTop: '16px' }}>
                <h4 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '18px', fontWeight: '900', margin: '0 0 4px 0', color: '#ffffff', letterSpacing: '0.4px' }}>{brand.name}</h4>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, fontWeight: '600' }}>{brand.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 🔥 TRENDING IN INDIAN METROS - HIGH INTENT DISCOVERY */}
      <section className="home-section-card" style={{ backgroundColor: '#ffffff', borderRadius: '24px', padding: '20px 16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(9, 13, 22, 0.04)', margin: '0 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 className="home-section-heading" style={{ fontFamily: "'Outfit', sans-serif", fontSize: '18px', fontWeight: '900', color: '#090d16', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <span>🔥</span> Trending Picks
            </h3>
            <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Top selling across Indian metros right now</p>
          </div>
          <span style={{ fontSize: '12px', color: '#4338ca', fontWeight: '800', cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={() => onNavigate('catalog')}>
            View All →
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {products.slice(0, 4).map((product, pIdx) => (
            <div key={`metro-${product.id || pIdx}`} style={{ position: 'relative' }}>
              <ProductCard product={product} onNavigateProduct={onNavigateProduct} />
            </div>
          ))}
        </div>
      </section>

      <section style={{ margin: '28px 0 16px 0' }}>
        <div style={{ background: 'linear-gradient(135deg, #090d16 0%, #1e293b 60%, #312e81 100%)', borderRadius: '32px', padding: '44px', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 40px rgba(9, 13, 22, 0.15)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <span style={{ background: '#fde047', color: '#090d16', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '900', display: 'inline-block', marginBottom: '12px' }}>
                👑 INFLUENCER & CREATOR HUB
              </span>
              <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '32px', fontWeight: '900', marginBottom: '10px', letterSpacing: '-0.5px' }}>Monetize Your Digital Influence</h3>
              <p style={{ color: '#cbd5e1', marginBottom: '0', fontSize: '15px', maxWidth: '560px', lineHeight: '1.6', fontWeight: '500' }}>Join India's most disruptive Creator Economy. Generate personalized shopping affiliate links, share across WhatsApp/Instagram & earn automated weekly bank payouts up to 12%.</p>
            </div>
            <button 
              style={{ background: 'linear-gradient(135deg, #fde047, #f59e0b)', color: '#090d16', padding: '16px 36px', borderRadius: '30px', fontWeight: '900', fontSize: '16px', cursor: 'pointer', border: 'none', boxShadow: '0 10px 25px rgba(245, 158, 11, 0.35)', transition: 'transform 0.2s', flexShrink: 0 }} 
              onClick={() => onNavigate && onNavigate('partner')}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
            >
              Launch Creator Console →
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
