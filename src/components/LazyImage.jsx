import React, { useState, useEffect } from 'react';
import Image from 'next/image';

/**
 * LazyImage Component
 * 
 * Replaces legacy <img> with Next.js <Image> component.
 * Uses layout="fill" to automatically adapt to the parent container's size,
 * preventing Cumulative Layout Shift and auto-generating WebP formats.
 */
const LazyImage = ({ src, alt, className, style, onClick, ...props }) => {
  const [imgSrc, setImgSrc] = useState('');
  
  useEffect(() => {
    if (!src) return;
    
    let optimizedSrc = src;
    // Apply Cloudinary optimizations if applicable
    if (optimizedSrc.includes('res.cloudinary.com') && !optimizedSrc.includes('q_auto')) {
      const parts = optimizedSrc.split('/upload/');
      if (parts.length === 2) {
        optimizedSrc = `${parts[0]}/upload/f_auto,q_auto/${parts[1]}`;
      }
    }
    
    setImgSrc(optimizedSrc);
  }, [src]);

  // If there's no src yet, return a placeholder block
  if (!imgSrc && !src) return <div style={{ ...style, backgroundColor: '#f1f5f9' }} className={className} />;

  return (
    <div 
      className={className} 
      style={{ 
        position: 'relative', 
        overflow: 'hidden', 
        ...style 
      }} 
      onClick={onClick}
    >
      <Image 
        src={imgSrc || src} 
        alt={alt || 'Product Image'} 
        fill
        style={{ objectFit: style?.objectFit || 'cover' }}
        unoptimized={true} // True to prevent Next.js from throwing errors for unconfigured external domains
        {...props}
      />
    </div>
  );
};

export default LazyImage;
