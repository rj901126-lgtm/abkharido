import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import ProductCard from '../components/ProductCard';
import FlashDealBanner from '../components/FlashDealBanner';
import LiveSocialProof from '../components/LiveSocialProof';
import { ChevronLeft, ChevronRight, Timer, ArrowRight, Sparkles, Award } from 'lucide-react';
import '../assets/styles/home.css';

const Home = ({ onNavigate, onNavigateProduct, onSelectCategory, promotions, initialProducts }) => {
  const { products: contextProducts, showToast } = useApp();
  const products = initialProducts || contextProducts || [];
  const [activeSlide, setActiveSlide] = useState(0);
  
  // CMS State
  const [layoutComponents, setLayoutComponents] = useState([]);
  const [loadingLayout, setLoadingLayout] = useState(true);

  // Dynamic Carousel slides with fallback
  const slides = promotions && Array.isArray(promotions.banners) && promotions.banners.length > 0
    ? promotions.banners
    : [
        {
          title: 'Premium Sound. Zero Distractions.',
          desc: 'Experience our best noise-cancelling headphones yet. Up to 40 hours of battery life and studio-quality sound.',
          bg: 'url(https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?q=80&w=1200&auto=format&fit=crop) center/cover no-repeat',
          tag: 'AUDIO WEEK DEAL',
          cat: 'electronics'
        },
        {
          title: 'The New Standard in Fashion',
          desc: 'Elevate your wardrobe with our latest direct-from-manufacturer collection. Uncompromising quality at unbeatable prices.',
          bg: 'url(https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop) center/cover no-repeat',
          tag: 'SUMMER COLLECTION',
          cat: 'fashion'
        }
      ];

  const handleNextSlide = () => setActiveSlide((prev) => (prev + 1) % slides.length);
  const handlePrevSlide = () => setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length);

  useEffect(() => {
    const slideTimer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(slideTimer);
  }, [slides.length]);

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  
  const handleTouchStart = (e) => { touchStartX.current = e.targetTouches[0].clientX; };
  const handleTouchMove = (e) => { touchEndX.current = e.targetTouches[0].clientX; };
  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 50) {
      handleNextSlide();
    } else if (diff < -50) {
      handlePrevSlide();
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  const targetDate = React.useMemo(() => {
    return promotions && promotions.dealsTimer 
      ? new Date(promotions.dealsTimer)
      : (() => {
          const tomorrow = new Date();
          tomorrow.setHours(24, 0, 0, 0);
          return tomorrow;
        })();
  }, [promotions]);

  // Fetch CMS Layout
  useEffect(() => {
    const fetchLayout = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/cms/layout/home_page`);
        if (res.ok) {
          const data = await res.json();
          // Sort components by order
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
  }, []);

  return (
    <div className="home-container animate-fade-in" style={{ paddingBottom: '80px', position: 'relative' }}>
      
      {/* 1. Urgency / FOMO Driver */}
      <FlashDealBanner />
      
      {/* 2. Trust Builder / Social Proof */}
      <LiveSocialProof />

      {/* Hero Carousel */}
      <section 
        className="hero-carousel"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {slides.map((slide, idx) => (
          <div 
            key={idx} 
            className={`carousel-slide ${idx === activeSlide ? 'active' : ''}`}
            style={{ background: slide.bg }}
          >
            {/* Dark overlay for text readability if needed, though glass box helps */}
            <div className="carousel-slide-overlay"></div>
            
            <div className="slide-content-box">
              {slide.tag && <span className="slide-tag"><Sparkles size={14} /> {slide.tag}</span>}
              <h1 className="slide-title">{slide.title}</h1>
              <p className="slide-desc">{slide.desc}</p>
              {slide.cat && (
                <button 
                  className="btn animate-fade-in" 
                  style={{ 
                    background: 'linear-gradient(90deg, var(--primary-color) 0%, #6366f1 100%)',
                    color: 'white',
                    borderRadius: '30px', 
                    padding: '14px 32px', 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '10px', 
                    border: 'none', 
                    fontWeight: '800', 
                    fontSize: '15px',
                    boxShadow: '0 10px 20px -5px rgba(79, 70, 229, 0.4)',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 25px -5px rgba(79, 70, 229, 0.5)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 20px -5px rgba(79, 70, 229, 0.4)'; }}
                  onClick={() => onSelectCategory(slide.cat)}
                >
                  Explore Now <ArrowRight size={18} />
                </button>
              )}
            </div>
          </div>
        ))}

        <button className="carousel-nav-btn carousel-nav-left" onClick={handlePrevSlide}>
          <ChevronLeft size={24} />
        </button>
        <button className="carousel-nav-btn carousel-nav-right" onClick={handleNextSlide}>
          <ChevronRight size={24} />
        </button>

        <div className="carousel-indicators">
          {slides.map((_, idx) => (
            <div
              key={idx}
              className={`carousel-indicator-dot ${idx === activeSlide ? 'active' : ''}`}
              onClick={() => setActiveSlide(idx)}
            />
          ))}
        </div>
      </section>

      {/* Premium Trust Strip */}
      <div className="trust-strip">
        <div className="trust-item">
          <Award size={20} />
          <span className="trust-text">100% Genuine<br/>Products</span>
        </div>
        <div className="trust-item">
          <Sparkles size={20} />
          <span className="trust-text">Free Express<br/>Delivery</span>
        </div>
        <div className="trust-item">
          <Timer size={20} />
          <span className="trust-text">Easy 10-Day<br/>Returns</span>
        </div>
      </div>

      {/* DYNAMIC CMS SECTIONS */}
      {loadingLayout ? (
        <div className="skeleton-container" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {/* Title Skeleton */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="skeleton-pulse" style={{ width: '200px', height: '30px', borderRadius: '8px' }}></div>
            <div className="skeleton-pulse" style={{ width: '80px', height: '30px', borderRadius: '20px' }}></div>
          </div>
          {/* Product Cards Skeleton */}
          <div style={{ display: 'flex', gap: '16px', overflow: 'hidden' }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton-pulse" style={{ width: '220px', height: '340px', borderRadius: '16px', flexShrink: 0 }}></div>
            ))}
          </div>
        </div>
      ) : (
        layoutComponents.map((comp) => {
          if (comp.type === 'deals_row') {
            const dealsProducts = products
              .filter(p => promotions && promotions.dealsProducts ? promotions.dealsProducts.includes(p.id) : p.originalPrice > p.price)
              .sort((a,b) => ((b.originalPrice - b.price)/b.originalPrice) - ((a.originalPrice - a.price)/a.originalPrice))
              .slice(0, 5);
            
            return (
              <section key={comp.id} className="deals-container">
                <div className="deals-header">
                  <div className="deals-title-area">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', borderRadius: '10px', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(239,68,68,0.35)' }}>
                        <Timer size={18} color="white" />
                      </div>
                      <span className="deals-title">{comp.title || 'Deals of the Day'}</span>
                    </div>
                    <div className="deals-timer">
                      <span style={{ color: '#94a3b8', fontSize: '13px' }}>Ends In:</span>
                      <DealsCountdown targetDate={targetDate} />
                    </div>
                  </div>
                  <button className="btn-glass-light" onClick={() => onSelectCategory('all')}>
                    View All <ArrowRight size={14} />
                  </button>
                </div>
                <div className="home-carousel-row">
                  {dealsProducts.map(product => (
                    <ProductCard key={product.id} product={product} onNavigateProduct={onNavigateProduct} />
                  ))}
                </div>
              </section>
            );
          }

          if (comp.type === 'category_row') {
            const catProducts = products.filter(p => p.category === comp.data).slice(0, 5);
            const catEmojis = { electronics: '⚡', fashion: '👗', sports: '🏃', home: '🏠', beauty: '✨', toys: '🎮' };
            const emoji = catEmojis[comp.data] || '🛍️';
            return (
              <section key={comp.id} className="deals-container">
                <div className="deals-header">
                  <div className="deals-title-area">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', borderRadius: '10px', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', boxShadow: '0 4px 12px rgba(79,70,229,0.3)' }}>
                        {emoji}
                      </div>
                      <span className="deals-title">{comp.title || 'Category'}</span>
                    </div>
                  </div>
                  <button className="btn-glass-light" onClick={() => onSelectCategory(comp.data)}>
                    Explore <ArrowRight size={14} />
                  </button>
                </div>
                <div className="home-carousel-row">
                  {catProducts.map(product => (
                    <ProductCard key={product.id} product={product} onNavigateProduct={onNavigateProduct} />
                  ))}
                </div>
              </section>
            );
          }

          if (comp.type === 'banner') {
            return (
              <section key={comp.id} style={{ margin: '20px', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ background: '#2874f0', color: 'white', padding: '30px', textAlign: 'center' }}>
                  <h2>{comp.title || 'Special Promotion'}</h2>
                  <p>{comp.data || 'Check out our latest offers!'}</p>
                </div>
              </section>
            );
          }

          return null;
        })
      )}

      {/* Affiliate Promo Banner */}
      {/* Affiliate Promo Banner */}
      <section style={{ padding: '0 20px', marginBottom: '40px' }}>
        <div className="premium-affiliate-banner" onClick={() => onNavigate('info')}>
          {/* Decorative background elements */}
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '150px', height: '150px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>
          <div style={{ position: 'absolute', bottom: '-40px', left: '20%', width: '100px', height: '100px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>
          
          <div className="premium-affiliate-content" style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '12px', backdropFilter: 'blur(10px)', flexShrink: 0 }}>
              <Award size={20} color="#fff" strokeWidth={2} />
            </div>
            <div className="premium-affiliate-text" style={{ textAlign: 'left' }}>
              <h3 style={{ margin: '0 0 2px 0', fontSize: '16px', fontWeight: '800', letterSpacing: '0.5px' }}>Start Earning With Us</h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#e0e7ff', lineHeight: '1.3' }}>Join Creator Program & Earn 7% cash.</p>
            </div>
          </div>
          <button className="btn-glass-light banner-action-btn" style={{ padding: '8px 16px', fontSize: '13px', whiteSpace: 'nowrap' }}>
            Learn More <ArrowRight size={14} />
          </button>
        </div>
      </section>

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
      if (diff <= 0) {
        setTimerString('00:00:00');
        return;
      }
      const hrs = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      setTimerString(`${hrs.toString().padStart(2,'0')}:${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`);
    };
    const timerInt = setInterval(updateTimer, 1000);
    updateTimer();
    return () => clearInterval(timerInt);
  }, [targetDate]);

  return <span className="timer-box">{timerString}</span>;
};

export default Home;
