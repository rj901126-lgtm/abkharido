"use client";

import React from 'react';

/**
 * Modern Ultra-Crisp Vector Brand Logo for AbKharido.com
 * Perfectly scalable, retina-ready, with zero blur or pixelation.
 */
export default function BrandLogo({ variant = 'light', size = 'md', showTagline = true }) {
  const isDark = variant === 'dark';
  
  // Size presets
  const iconSize = size === 'sm' ? 28 : (size === 'lg' ? 42 : 36);
  const abSize = size === 'sm' ? '18px' : (size === 'lg' ? '25px' : '22px');
  const taglineSize = size === 'sm' ? '7.5px' : (size === 'lg' ? '9.5px' : '8.5px');

  return (
    <div className="brand-logo-root" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none', userSelect: 'none', lineHeight: 1 }}>
      {/* 🛍️ Premium Vector 3D Brand Symbol */}
      <div style={{ position: 'relative', width: `${iconSize}px`, height: `${iconSize}px`, flexShrink: 0 }}>
        <svg 
          width={iconSize} 
          height={iconSize} 
          viewBox="0 0 40 40" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg" 
          style={{ filter: 'drop-shadow(0 3px 6px rgba(37, 99, 235, 0.25))' }}
        >
          <defs>
            <linearGradient id={`abk-bg-grad-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="45%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
            <linearGradient id={`abk-gold-grad-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="40%" stopColor="#facc15" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
          </defs>

          {/* Squircle App Icon Container */}
          <rect width="40" height="40" rx="12" fill={`url(#abk-bg-grad-${variant})`} />
          
          {/* Subtle Gloss Top Overlay */}
          <path d="M0 12C0 5.37258 5.37258 0 12 0H28C34.6274 0 40 5.37258 40 12V18C28 20 12 18 0 16V12Z" fill="white" fillOpacity="0.18" />

          {/* Minimalist Modern Shopping Bag */}
          <path d="M11.5 15C11.5 13.8954 12.3954 13 13.5 13H26.5C27.6046 13 28.5 13.8954 28.5 15V29C28.5 30.1046 27.6046 31 26.5 31H13.5C12.3954 31 11.5 30.1046 11.5 29V15Z" fill="white" fillOpacity="0.22" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
          
          {/* Bag Handle */}
          <path d="M16 13V10.5C16 8.567 17.7909 7 20 7C22.2091 7 24 8.567 24 10.5V13" stroke="white" strokeWidth="2.2" strokeLinecap="round" />

          {/* Express Delivery Lightning Bolt in Golden Saffron */}
          <path d="M21.5 15L16.5 22.5H21L19 29.5L25.5 21H21L21.5 15Z" fill={`url(#abk-gold-grad-${variant})`} stroke="#ffffff" strokeWidth="0.6" strokeLinejoin="round" />
        </svg>
      </div>

      {/* 🏷️ Typography Wordmark */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', letterSpacing: '-0.5px', fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
          <span style={{ fontSize: abSize, fontWeight: '900', color: isDark ? '#ffffff' : '#1d4ed8' }}>
            Ab
          </span>
          <span style={{ fontSize: abSize, fontWeight: '900', color: isDark ? '#fb923c' : '#ea580c', marginLeft: '1px' }}>
            Kharido
          </span>
          <span style={{ fontSize: `calc(${abSize} * 0.52)`, fontWeight: '800', color: isDark ? '#94a3b8' : '#64748b', marginLeft: '2px' }}>
            .com
          </span>
        </div>
        {showTagline && (
          <span style={{ fontSize: taglineSize, fontWeight: '800', color: isDark ? '#94a3b8' : '#64748b', letterSpacing: '1px', textTransform: 'uppercase', marginTop: '2px' }}>
            Bharat Ka Store
          </span>
        )}
      </div>
    </div>
  );
}
