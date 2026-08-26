"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Search, ArrowLeft } from 'lucide-react';
import { ALL_CATEGORY_SECTIONS } from '../utils/categoryData';

const CategoriesPage = ({ onNavigate, onSelectCategory, onSearch }) => {
  const router = useRouter();

  const handleItemClick = (item) => {
    if (onSelectCategory) {
      onSelectCategory(item.category);
    }
    if (onSearch) {
      onSearch(item.query);
    } else if (onNavigate) {
      onNavigate(`catalog?category=${item.category}&search=${encodeURIComponent(item.query)}`);
    } else {
      router.push(`/catalog?category=${item.category}&search=${encodeURIComponent(item.query)}`);
    }
  };

  const handleHeartClick = () => {
    if (onNavigate) onNavigate('wishlist');
    else router.push('/wishlist');
  };

  const handleSearchClick = () => {
    if (onNavigate) onNavigate('catalog');
    else router.push('/catalog');
  };

  const handleBackClick = () => {
    if (onNavigate) onNavigate('home');
    else router.push('/');
  };

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '16px 14px 100px',
      fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif",
      backgroundColor: '#ffffff',
      minHeight: '100vh',
      boxSizing: 'border-box'
    }}>
      {/* ── Top Header Navigation Bar ── */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '16px',
        borderBottom: '1px solid #f1f5f9',
        marginBottom: '20px',
        position: 'sticky',
        top: 0,
        backgroundColor: '#ffffff',
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleBackClick}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0f172a',
              padding: '4px'
            }}
            title="Go to Home"
          >
            <ArrowLeft size={22} />
          </button>
          <h1 style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: '800',
            color: '#0f172a',
            letterSpacing: '-0.3px'
          }}>
            All Categories
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={handleHeartClick}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0f172a',
              padding: '4px'
            }}
            title="Wishlist"
          >
            <Heart size={21} strokeWidth={2} />
          </button>
          <button
            onClick={handleSearchClick}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0f172a',
              padding: '4px'
            }}
            title="Search Store"
          >
            <Search size={21} strokeWidth={2} />
          </button>
        </div>
      </header>

      {/* ── Category Section Groups ── */}
      <main style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {ALL_CATEGORY_SECTIONS.map((section, sIdx) => (
          <section key={section.slug || sIdx}>
            {/* Group Section Title */}
            <h2 style={{
              margin: '0 0 14px 0',
              fontSize: '17px',
              fontWeight: '800',
              color: '#0f172a',
              letterSpacing: '-0.3px',
              fontFamily: "'Outfit', sans-serif"
            }}>
              {section.title}
            </h2>

            {/* 4-Column Responsive Grid (Pixel-Match to Blinkit & Reference UI) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '14px 10px',
              boxSizing: 'border-box'
            }}
            className="category-items-grid"
            >
              {section.items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: 'pointer',
                    userSelect: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    transition: 'transform 0.15s ease'
                  }}
                  onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.96)'; }}
                  onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                  onTouchStart={(e) => { e.currentTarget.style.transform = 'scale(0.96)'; }}
                  onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  {/* Soft Rounded Stage / Tile */}
                  <div style={{
                    width: '100%',
                    aspectRatio: '1 / 1',
                    maxHeight: '94px',
                    backgroundColor: '#ffffff',
                    backgroundImage: 'radial-gradient(circle at center, #ffffff 0%, #f8fafc 100%)',
                    border: '1px solid rgba(226, 232, 240, 0.85)',
                    borderRadius: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '6px',
                    boxSizing: 'border-box',
                    boxShadow: '0 3px 10px rgba(15, 23, 42, 0.04)',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    <img
                      src={item.img}
                      alt={item.name.replace('\n', ' ')}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&q=80';
                      }}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        filter: 'drop-shadow(0 4px 10px rgba(0, 0, 0, 0.08))',
                        transition: 'transform 0.25s ease'
                      }}
                    />
                  </div>


                  {/* Multi-Line Centered Label Underneath Tile */}
                  <span style={{
                    marginTop: '6px',
                    fontSize: '11.5px',
                    fontWeight: '700',
                    color: '#1e293b',
                    lineHeight: 1.25,
                    textAlign: 'center',
                    whiteSpace: 'pre-line',
                    letterSpacing: '-0.1px',
                    fontFamily: "'Outfit', sans-serif",
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>

      {/* Responsive Styles for Desktop / Tablet */}
      <style>{`
        @media (min-width: 640px) {
          .category-items-grid {
            grid-template-columns: repeat(6, 1fr) !important;
            gap: 18px 14px !important;
          }
        }
        @media (min-width: 1024px) {
          .category-items-grid {
            grid-template-columns: repeat(8, 1fr) !important;
            gap: 22px 18px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CategoriesPage;
