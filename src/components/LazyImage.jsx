import React, { useState } from 'react';

/**
 * LazyImage Component — Production Robust Version
 *
 * Uses modern browser image lazy-loading and asynchronous decoding.
 * Prevents Next.js `<Image fill={true}>` absolute positioning leaks that caused
 * un-anchored images to break out of document flow and render beneath the search input.
 */
const LazyImage = ({ src, alt, className, style, onClick, loading = "lazy", ...props }) => {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div
        className={className}
        onClick={onClick}
        style={{
          backgroundColor: '#f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: '32px',
          minHeight: '32px',
          ...style,
        }}
      >
        <span style={{ fontSize: '20px', opacity: 0.3 }}>📦</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || 'Product Image'}
      className={className}
      onClick={onClick}
      loading={loading}
      decoding="async"
      onError={() => setError(true)}
      style={{
        display: 'block',
        objectFit: style?.objectFit || 'contain',
        ...style,
      }}
      {...props}
    />
  );
};

export default LazyImage;
