import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import ProductCard from '../components/ProductCard';
import { ChevronLeft, ChevronRight, Timer, ArrowRight, Sparkles, Award } from 'lucide-react';
import '../assets/styles/home.css';

const Home = ({ onNavigate, onNavigateProduct, onSelectCategory, promotions }) => {
  const { products } = useApp();
  const [activeSlide, setActiveSlide] = useState(0);
  const [timerString, setTimerString] = useState('00:00:00');
  
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

  // Deals of the day countdown timer
  useEffect(() => {
    const targetDate = promotions && promotions.dealsTimer 
      ? new Date(promotions.dealsTimer)
      : (() => {
          const tomorrow = new Date();
          tomorrow.setHours(24, 0, 0, 0);
          return tomorrow;
        })();

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
  }, [promotions]);

  // Fetch CMS Layout
  useEffect(() => {
    const fetchLayout = async () => {
      try {
        const res = await fetch('/api/v2/cms/layout/home_page');
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
    <div className="home-container">
      {/* 0. Promotion Announcement Strip */}
      {promotions && promotions.announcement && promotions.announcement.show && (
        <div className="global-promo-strip" style={{
          background: promotions.announcement.bgColor || '#ffeb3b',
          color: promotions.announcement.textColor || '#000'
        }}>
          {promotions.announcement.text || '🌟 Use Code NEW100 for Flat ₹100 Off on your first order! 🌟'}
        </div>
      )}

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
                  className="btn btn-primary animate-fade-in" 
                  style={{ borderRadius: '24px', padding: '12px 28px', display: 'inline-flex', alignItems: 'center', gap: '8px', border: 'none', fontWeight: '700', fontSize: '15px' }}
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

      {/* DYNAMIC CMS SECTIONS */}
      {loadingLayout ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '20px' }}>
          <div style={{ width: '48px', height: '48px', border: '5px solid #f3f4f6', borderTop: '5px solid #4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', letterSpacing: '0.5px' }}>Loading AbKharido Storefront...</div>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '-10px' }}>Fetching the best deals for you</p>
        </div>
      ) : (
        layoutComponents.map((comp) => {
          if (comp.type === 'deals_row') {
            const dealsProducts = products
              .filter(p => promotions && promotions.dealsProducts ? promotions.dealsProducts.includes(p.id) : p.mrp > p.price)
              .sort((a,b) => ((b.mrp - b.price)/b.mrp) - ((a.mrp - a.price)/a.mrp))
              .slice(0, 5);
            
            return (
              <section key={comp.id} className="deals-container">
                <div className="deals-header">
                  <div className="deals-title-area">
                    <span className="deals-title">{comp.title || 'Deals of the Day'}</span>
                    <div className="deals-timer">
                      <Timer size={18} color="#d32f2f" />
                      <span>Ends In: </span>
                      <span className="timer-box">{timerString}</span>
                    </div>
                  </div>
                  <button className="btn btn-primary btn-outline btn-sm" onClick={() => onSelectCategory('all')}>
                    View All
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
            
            return (
              <section key={comp.id} className="deals-container">
                <div className="deals-header">
                  <span className="deals-title">{comp.title || 'Category'}</span>
                  <button className="btn btn-outline btn-sm" onClick={() => onSelectCategory(comp.data)}>
                    Explore
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
      <section style={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginBottom: '40px' }}>
        <div className="premium-affiliate-banner" onClick={() => onNavigate('info')}>
          {/* Decorative background elements */}
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '150px', height: '150px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>
          <div style={{ position: 'absolute', bottom: '-40px', left: '20%', width: '100px', height: '100px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>
          
          <div className="premium-affiliate-content">
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '20px', borderRadius: '20px', backdropFilter: 'blur(10px)' }}>
              <Award size={40} color="#fff" strokeWidth={2} />
            </div>
            <div className="premium-affiliate-text">
              <h3 style={{ margin: '0 0 10px 0', fontSize: '28px', fontWeight: '800', letterSpacing: '1px' }}>Start Earning With Us</h3>
              <p style={{ margin: 0, fontSize: '16px', color: '#e0e7ff', lineHeight: '1.5' }}>Join the exclusive AbKharido Creator Program. Share links and earn up to <strong style={{ color: '#fef08a' }}>7% instant cash</strong> on every sale you refer.</p>
            </div>
          </div>
          <button className="premium-affiliate-btn">
            Learn More
          </button>
        </div>
      </section>

    </div>
  );
};

export default Home;
