import React, { useState } from 'react';
import Image from 'next/image';

/**
 * LazyImage Component — Ultra-Simple Production Version
 *
 * Uses Next.js native <Image> component for automatic WebP optimization,
 * layout shifting prevention, and efficient CDN delivery at scale.
 */
const LazyImage = ({ src, alt, className, style, onClick, ...props }) => {
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

  // Remove manual Cloudinary optimizations as next/image handles resizing automatically
  const isExternal = src.startsWith('http');
  
  return (
    <Image
      src={src}
      alt={alt || 'Product Image'}
      className={className}
      onClick={onClick}
      fill={isExternal ? true : undefined}
      width={!isExternal ? 800 : undefined}
      height={!isExternal ? 800 : undefined}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      onError={() => setError(true)}
      style={{
        objectFit: style?.objectFit || 'contain',
        ...style,
      }}
      {...props}
    />
  );
};

export default LazyImage;
