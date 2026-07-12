import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import ProductCard from '../components/ProductCard';
import { ChevronLeft, ChevronRight, Timer, ArrowRight, Sparkles, Award } from 'lucide-react';
import '../assets/styles/home.css';

const Home = ({ onNavigate, onNavigateProduct, onSelectCategory }) => {
  const { products } = useApp();
  const [activeSlide, setActiveSlide] = useState(0);
  const [timerString, setTimerString] = useState('00:00:00');

  // Hero carousel content
  const slides = [
    {
      title: 'Fashion Trendsetters - Min 50% Off',
      desc: 'Top styles directly from manufacturers. Share links & earn the highest 7% cash or 3% coins reward!',
      bg: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
      tag: 'HOT FASHION AFFILIATE DEALS',
      cat: 'fashion'
    },
    {
      title: 'Mega Electronics Extravaganza',
      desc: 'Exclusive laptops, mechanical keyboards, and headphones in stock. Up to 3% cash commissions for creators.',
      bg: 'linear-gradient(135deg, #093129 0%, #00796b 100%)',
      tag: 'TECH ZONE REWARDS',
      cat: 'electronics'
    },
    {
      title: 'Direct-to-Consumer Guarantee',
      desc: 'No middle sellers, no markups. Just pure authentic inventory backed by AbKharido.com direct shipping.',
      bg: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)',
      tag: 'ABKHARIDO TRUST',
      cat: 'all'
    }
  ];

  // Carousel transition timer
  useEffect(() => {
    const slideTimer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(slideTimer);
  }, []);

  // Deals of the day countdown timer
  useEffect(() => {
    // Generate constant target for today's end
    const tomorrow = new Date();
    tomorrow.setHours(24, 0, 0, 0);

    const updateTimer = () => {
      const now = new Date();
      const diff = tomorrow.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimerString('00:00:00');
        return;
      }

      const hrs = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      const fHrs = hrs < 10 ? `0${hrs}` : hrs;
      const fMins = mins < 10 ? `0${mins}` : mins;
      const fSecs = secs < 10 ? `0${secs}` : secs;

      setTimerString(`${fHrs}h : ${fMins}m : ${fSecs}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleNextSlide = () => {
    setActiveSlide(prev => (prev + 1) % slides.length);
  };

  const handlePrevSlide = () => {
    setActiveSlide(prev => (prev - 1 + slides.length) % slides.length);
  };

  // Filter products for Deals section
  const dealsProducts = products.slice(0, 5);

  // Filter products for Electronics section
  const electronicsProducts = products.filter(p => p.category === 'electronics').slice(0, 4);

  // Filter products for Fashion section
  const fashionProducts = products.filter(p => p.category === 'fashion').slice(0, 4);

  return (
    <div className="container home-container animate-fade-in">
      {/* Hero Carousel */}
      <section className="hero-carousel">
        {slides.map((slide, idx) => (
          <div
            key={idx}
            className={`carousel-slide ${idx === activeSlide ? 'active' : ''}`}
            style={{ backgroundImage: slide.bg }}
          >
            <div className="slide-content">
              <span className="slide-tag">{slide.tag}</span>
              <h2 className="slide-title">{slide.title}</h2>
              <p className="slide-desc">{slide.desc}</p>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  if (slide.cat !== 'all') {
                    onSelectCategory(slide.cat);
                  }
                  onNavigate('catalog');
                }}
              >
                Explore Sale <ArrowRight size={16} />
              </button>
            </div>
            {/* Visual element on right of slide */}
            <div className="slide-visual-icon" style={{ marginRight: '40px', opacity: 0.15 }}>
              <Award size={180} color="white" />
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

      {/* Deals of the Day (With Timer) */}
      <section className="deals-container">
        <div className="deals-header">
          <div className="deals-title-area">
            <span className="deals-title">Deals of the Day</span>
            <div className="deals-timer">
              <Timer size={18} color="#d32f2f" />
              <span>Ends In: </span>
              <span className="timer-box">{timerString}</span>
            </div>
          </div>
          <button 
            className="btn btn-primary btn-outline btn-sm"
            onClick={() => {
              onSelectCategory('all');
              onNavigate('catalog');
            }}
          >
            View All
          </button>
        </div>

        <div className="deals-grid">
          {dealsProducts.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onNavigateProduct={onNavigateProduct} 
            />
          ))}
        </div>
      </section>

      {/* Partner Program Banner */}
      <section className="affiliate-promo-panel">
        <div className="promo-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Sparkles size={20} color="var(--secondary-color)" />
            <h3 className="promo-heading">AbKharido Share & Earn Program</h3>
          </div>
          <p className="promo-subheading">
            You don't need to be a seller to earn! Share dynamic tracking links for any of our high-quality products. 
            Normal customers earn shopping discount coins (up to 3%), and verified influencers earn cash withdrawals (up to 7% payout) on every purchase made.
          </p>
        </div>
        <div className="promo-right">
          <span className="promo-badge-tag">Earn Up To 7% Commissions</span>
          <button 
            className="btn btn-secondary"
            onClick={() => onNavigate('partner')}
          >
            Visit Partner Center
          </button>
        </div>
      </section>

      {/* Tech Spotlight Grid */}
      <section className="deals-container">
        <div className="deals-header">
          <span className="deals-title">Best of Tech & Electronics</span>
          <button 
            className="btn btn-outline"
            onClick={() => {
              onSelectCategory('electronics');
              onNavigate('catalog');
            }}
          >
            Explore
          </button>
        </div>
        <div className="grid-cols-4">
          {electronicsProducts.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onNavigateProduct={onNavigateProduct} 
            />
          ))}
        </div>
      </section>

      {/* Fashion Spotlight Grid */}
      <section className="deals-container">
        <div className="deals-header">
          <span className="deals-title">Top Trends in Fashion</span>
          <button 
            className="btn btn-outline"
            onClick={() => {
              onSelectCategory('fashion');
              onNavigate('catalog');
            }}
          >
            Explore
          </button>
        </div>
        <div className="grid-cols-4">
          {fashionProducts.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onNavigateProduct={onNavigateProduct} 
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
