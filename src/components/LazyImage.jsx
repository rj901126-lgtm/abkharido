import React, { useState, useEffect, useRef } from 'react';

/**
 * LazyImage Component - Production Grade
 * 
 * Uses native <img> with IntersectionObserver for lazy loading.
 * Avoids Next.js Image `fill` which requires explicit parent dimensions
 * and causes images to be invisible when parent height is not explicitly set.
 * This approach is more robust across all layout contexts.
 */
const LazyImage = ({ src, alt, className, style, onClick, ...props }) => {
  const [imgSrc, setImgSrc] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (!src) return;

    let optimizedSrc = src;
    // Apply Cloudinary optimizations if applicable
    if (optimizedSrc.includes('res.cloudinary.com') && !optimizedSrc.includes('q_auto')) {
      const parts = optimizedSrc.split('/upload/');
      if (parts.length === 2) {
        optimizedSrc = `${parts[0]}/upload/f_auto,q_auto,w_800/${parts[1]}`;
      }
    }

    // Use IntersectionObserver for lazy loading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setImgSrc(optimizedSrc);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '200px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src]);

  const objectFit = style?.objectFit || 'cover';

  return (
    // eslint-disable-next-line
    <img
      ref={imgRef}
      src={imgSrc || undefined}
      alt={alt || 'Product Image'}
      className={className}
      onClick={onClick}
      onLoad={() => setLoaded(true)}
      style={{
        ...style,
        objectFit,
        display: 'block',
        opacity: loaded ? 1 : 0,
        transition: 'opacity 0.3s ease',
        backgroundColor: loaded ? 'transparent' : '#f1f5f9',
      }}
      {...props}
    />
  );
};

export default LazyImage;
