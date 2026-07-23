import React, { useState, useEffect, useRef } from 'react';

/**
 * LazyImage Component
 * 
 * Automatically lazy loads images using the native `loading="lazy"` attribute.
 * Also automatically applies Cloudinary performance optimizations (q_auto, f_auto) 
 * if the image is hosted on Cloudinary, drastically reducing bandwidth and improving Core Web Vitals.
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

  return (
    <img 
      src={imgSrc || src} 
      alt={alt || 'Product Image'} 
      loading="lazy"
      className={className}
      style={{ ...style, opacity: imgSrc ? 1 : 0.5, transition: 'opacity 0.3s' }}
      onClick={onClick}
      {...props}
    />
  );
};

export default LazyImage;
