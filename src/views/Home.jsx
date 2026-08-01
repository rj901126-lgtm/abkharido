import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import ProductCard from '../components/ProductCard';
import FlashDealBanner from '../components/FlashDealBanner';
import LiveSocialProof from '../components/LiveSocialProof';
import { ChevronLeft, ChevronRight, Timer, ArrowRight, Sparkles, Award, Zap, ShieldCheck, Truck } from 'lucide-react';
import '../assets/styles/home.css';

const vipCategories = [
  { id: 'all', label: 'All VIP Deals', icon: '💎', gradient: 'linear-gradient(135deg, #1e1b4b, #4338ca)', badge: 'HOT' },
  { id: 'mobiles', label: 'AI Smartphones & 5G', icon: '⚡', gradient: 'linear-gradient(135deg, #0284c7, #0369a1)', badge: 'NEW' },
  { id: 'electronics', label: 'Audiophile & Tech', icon: '🎧', gradient: 'linear-gradient(135deg, #7c3aed, #4f46e5)', badge: '-40%' },
  { id: 'fashion', label: 'Luxe Couture & Wear', icon: '👗', gradient: 'linear-gradient(135deg, #e11d48, #9f1239)', badge: 'TRENDING' },
  { id: 'home', label: 'Smart Home & AI', icon: '🏠', gradient: 'linear-gradient(135deg, #059669, #047857)', badge: 'TOP' },
  { id: 'beauty', label: 'Diamond Beauty & Spa', icon: '✨', gradient: 'linear-gradient(135deg, #d97706, #b45309)', badge: 'VIP' },
  { id: 'sports', label: 'Pro Fitness & Gear', icon: '🏃', gradient: 'linear-gradient(135deg, #090d16, #334155)', badge: 'FAST' },
];

const Home = ({ onNavigate, onNavigateProduct, onSelectCategory, promotions, initialProducts }) => {
  const { products: contextProducts } = useApp();
  const products = initialProducts || contextProducts || [];
  const [activeSlide, setActiveSlide] = useState(0);
  const [selectedCatPill, setSelectedCatPill] = useState('all');
  
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
      <FlashDealBanner />
      <LiveSocialProof />

      <section style={{ margin: '8px 0 12px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '16px', fontWeight: '900', color: '#090d16', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={16} style={{ color: '#d97706' }} /> INDIA'S VIP SHOPPING VAULTS
          </span>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '700' }}>⚡ Free Priority Express Delivery</span>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
          {vipCategories.map((cat) => {
            const isSelected = selectedCatPill === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                style={{
                  flexShrink: 0,
                  background: isSelected ? cat.gradient : '#ffffff',
                  color: isSelected ? '#ffffff' : '#090d16',
                  border: isSelected ? 'none' : '1px solid #e2e8f0',
                  borderRadius: '20px',
                  padding: '12px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: isSelected ? '0 10px 25px -5px rgba(67, 56, 202, 0.45)' : '0 2px 8px rgba(9, 13, 22, 0.04)',
                  transform: isSelected ? 'translateY(-2px)' : 'translateY(0)'
                }}
              >
                <span style={{ fontSize: '20px' }}>{cat.icon}</span>
                <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: '800', fontSize: '14px', letterSpacing: '-0.2px' }}>{cat.label}</span>
                <span style={{
                  background: isSelected ? 'rgba(255, 255, 255, 0.2)' : '#f1f5f9',
                  color: isSelected ? '#ffffff' : '#e11d48',
                  fontSize: '10px',
                  fontWeight: '900',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  letterSpacing: '0.3px'
                }}>
                  {cat.badge}
                </span>
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
                  
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <button 
                      className="btn animate-fade-in" 
                      style={{ 
                        background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)',
                        color: 'white',
                        borderRadius: '30px', 
                        padding: '16px 36px', 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '10px', 
                        border: '1px solid rgba(255, 255, 255, 0.3)', 
                        fontFamily: "'Outfit', sans-serif",
                        fontWeight: '800', 
                        fontSize: '16px',
                        boxShadow: '0 14px 32px -5px rgba(99, 102, 241, 0.6)',
                        cursor: 'pointer'
                      }}
                      onClick={() => onSelectCategory(slideCat)}
                    >
                      ⚡ Grab Deal Now <ArrowRight size={18} />
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', margin: '12px 0 24px 0' }}>
        {[
          { icon: <Zap size={26} color="#0284c7" />, title: "Priority Express Dispatch", sub: "Fast 24-48 hr doorstep drop", bg: "#f0f9ff", border: "#bae6fd" },
          { icon: <ShieldCheck size={26} color="#059669" />, title: "100% Cashfree Escrow", sub: "Bank-grade protection", bg: "#ecfdf5", border: "#a7f3d0" },
          { icon: <Truck size={26} color="#7c3aed" />, title: "Easy 7-Day Return", sub: "7 days replacement policy", bg: "#f5f3ff", border: "#ddd6fe" },
          { icon: <Award size={26} color="#d97706" />, title: "Platinum Club Rebates", sub: "Earn up to 12% in coins", bg: "#fffbeb", border: "#fde68a" },
        ].map((item, idx) => (
          <div key={idx} style={{
            background: item.bg, border: `1px solid ${item.border}`, borderRadius: '20px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px'
          }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {item.icon}
            </div>
            <div>
              <h4 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '16px', fontWeight: '800', color: '#090d16', margin: '0 0 4px 0' }}>{item.title}</h4>
              <p style={{ fontSize: '12px', color: '#475569', margin: 0, fontWeight: '600' }}>{item.sub}</p>
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
              <section key={comp.id} style={{ backgroundColor: '#ffffff', borderRadius: '32px', padding: '28px', border: '1px solid #e2e8f0', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <span style={{ fontSize: '26px', fontWeight: '900', letterSpacing: '-0.5px' }}>{comp.title || '⚡ VIP Lightning Doorbusters'}</span>
                  <DealsCountdown targetDate={targetDate} />
                </div>
                <div className="home-carousel-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '24px' }}>
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
      <section style={{ marginTop: '28px', backgroundColor: '#ffffff', borderRadius: '32px', padding: '32px', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(9, 13, 22, 0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '24px', fontWeight: '900', color: '#090d16', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <span>🏛️</span> Official Authorised Brand Pavilions
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Direct inventory shipped directly from licensed national brand distributors</p>
          </div>
          <span style={{ fontSize: '12px', color: '#059669', fontWeight: '800', background: '#ecfdf5', padding: '6px 14px', borderRadius: '20px', border: '1px solid #a7f3d0' }}>
            ✓ 100% Genuine Brand Warranty
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
          {[
            { name: "APPLE", desc: "Flagship Mac & iPhone", icon: "🍎", bg: "linear-gradient(135deg, #1e293b, #0f172a)", tag: "DIRECT PARTNER" },
            { name: "SAMSUNG", desc: "Galaxy AI & Ultra 5G", icon: "✨", bg: "linear-gradient(135deg, #1d4ed8, #1e40af)", tag: "FLUSH STOCK" },
            { name: "SONY AUDIO", desc: "Noise Cancel & Studio", icon: "🎧", bg: "linear-gradient(135deg, #4338ca, #3730a3)", tag: "AUDIOPHILE" },
            { name: "NIKE SPORT", desc: "VaporFly & Air Max", icon: "⚡", bg: "linear-gradient(135deg, #b91c1c, #991b1b)", tag: "AUTHORIZED" },
            { name: "BOSE LUXE", desc: "Acoustic QuietComfort", icon: "🎼", bg: "linear-gradient(135deg, #047857, #065f46)", tag: "PREMIUM" },
            { name: "ROLEX / TAG", desc: "Titanium Swiss Couture", icon: "⌚", bg: "linear-gradient(135deg, #b45309, #92400e)", tag: "HERITAGE" }
          ].map((brand, bIdx) => (
            <div 
              key={bIdx}
              onClick={() => onNavigate('catalog')}
              style={{
                background: brand.bg,
                borderRadius: '24px',
                padding: '22px 18px',
                color: 'white',
                cursor: 'pointer',
                transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), boxShadow 0.25s',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '140px',
                boxShadow: '0 10px 20px rgba(9, 13, 22, 0.1)'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 32px rgba(9, 13, 22, 0.2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(9, 13, 22, 0.1)'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '28px' }}>{brand.icon}</span>
                <span style={{ fontSize: '10px', fontWeight: '900', letterSpacing: '0.5px', background: 'rgba(255,255,255,0.2)', padding: '3px 8px', borderRadius: '8px' }}>
                  {brand.tag}
                </span>
              </div>
              <div>
                <h4 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '17px', fontWeight: '900', margin: '12px 0 2px 0', letterSpacing: '0.5px' }}>{brand.name}</h4>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', margin: 0, fontWeight: '500' }}>{brand.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 🔥 TRENDING IN INDIAN METROS - HIGH INTENT DISCOVERY */}
      <section style={{ marginTop: '28px', backgroundColor: '#ffffff', borderRadius: '32px', padding: '32px', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(9, 13, 22, 0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '24px', fontWeight: '900', color: '#090d16', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <span>🔥</span> Trending High-Velocity Picks by Indian Metro Cities
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Real-time demand analytics across Mumbai, Delhi NCR, Bengaluru & Hyderabad</p>
          </div>
          <span style={{ fontSize: '13px', color: '#4338ca', fontWeight: '800', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => onNavigate('catalog')}>
            Explore All 5,000+ Verified Stock Products →
          </span>
        </div>
        <div className="home-carousel-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '24px' }}>
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
  const [timerString, setTimerString] = useState('00:00:00');
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();
      if (diff <= 0) { setTimerString('00:00:00'); return; }
      const hrs = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      setTimerString(`${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: '900', fontSize: '15px' }}>{timerString}</span>;
};

export default React.memo(Home);
