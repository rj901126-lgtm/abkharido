import React, { useState } from 'react';

/**
 * LazyImage Component — Ultra-Simple Production Version
 *
 * Uses a native <img> tag with a skeleton placeholder that fades to the real image.
 * No IntersectionObserver complexity — the browser handles lazy loading natively
 * via loading="lazy". This is the most reliable approach for all layout contexts.
 */
const LazyImage = ({ src, alt, className, style, onClick, ...props }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div
        className={className}
        onClick={onClick}
        style={{
          ...style,
          backgroundColor: '#f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ fontSize: '32px', opacity: 0.3 }}>📦</span>
      </div>
    );
  }

  // Apply Cloudinary optimizations if applicable
  let optimizedSrc = src;
  if (optimizedSrc.includes('res.cloudinary.com') && !optimizedSrc.includes('q_auto')) {
    const parts = optimizedSrc.split('/upload/');
    if (parts.length === 2) {
      optimizedSrc = `${parts[0]}/upload/f_auto,q_auto,w_800/${parts[1]}`;
    }
  }

  return (
    <img
      src={optimizedSrc}
      alt={alt || 'Product Image'}
      className={className}
      onClick={onClick}
      loading="lazy"
      onLoad={() => setLoaded(true)}
      onError={() => setError(true)}
      style={{
        ...style,
        opacity: loaded ? 1 : 0,
        transition: 'opacity 0.25s ease',
      }}
      {...props}
    />
  );
};

export default LazyImage;
