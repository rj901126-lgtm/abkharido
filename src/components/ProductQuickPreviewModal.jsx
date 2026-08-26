import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Heart, Share2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

const ProductQuickPreviewModal = ({ 
  product, 
  isOpen, 
  onClose, 
  onNavigateProduct 
}) => {
  const { wishlist, toggleWishlist, showToast } = useApp();

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen || !product || typeof window === 'undefined') return null;

  const isInWishlist = Array.isArray(wishlist) && wishlist.some(id => id === product.id || id.id === product.id);
  const isFlashSale = product.flashSale?.isActive && new Date(product.flashSale.endTime) > new Date();
  const price = isFlashSale ? product.flashSale.price : (product.price || 0);
  const originalPrice = product.originalPrice || (isFlashSale ? product.price : price);
  const discountPercent = originalPrice > 0 ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  const handleShare = async (e) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/product/${product.id || product._id}`;
    const shareData = {
      title: `${product.name} | AbKharido`,
      text: `Check out ${product.name} for only ₹${price.toLocaleString('en-IN')} on AbKharido!`,
      url: shareUrl
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (_) {}
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        showToast('🔗 Product link copied to clipboard!', 'success');
      } catch (_) {
        showToast('Link: ' + shareUrl, 'info');
      }
    }
  };

  const handleWishlist = (e) => {
    e.stopPropagation();
    if (toggleWishlist) toggleWishlist(product.id || product._id);
  };

  const handleCardClick = () => {
    onClose();
    if (onNavigateProduct) {
      onNavigateProduct(product.id || product._id);
    }
  };

  return createPortal(
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(9, 13, 22, 0.72)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        boxSizing: 'border-box',
        animation: 'quickPreviewFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
      onClick={onClose}
    >
      <style>{`
        @keyframes quickPreviewFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes quickPreviewScaleUp {
          from { opacity: 0; transform: scale(0.85) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      {/* Center Preview Card Container */}
      <div 
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '330px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Main Floating Card */}
        <div 
          onClick={handleCardClick}
          style={{
            width: '100%',
            backgroundColor: '#ffffff',
            borderRadius: '26px',
            overflow: 'hidden',
            boxShadow: '0 24px 60px -10px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.2)',
            cursor: 'pointer',
            animation: 'quickPreviewScaleUp 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)',
            boxSizing: 'border-box'
          }}
        >
          {/* Image Stage with Soft Background */}
          <div 
            style={{
              position: 'relative',
              width: '100%',
              height: '270px',
              backgroundColor: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              boxSizing: 'border-box',
              borderBottom: '1px solid #f1f5f9'
            }}
          >
            {/* Top Right Wishlist Pill Button */}
            <button
              onClick={handleWishlist}
              style={{
                position: 'absolute',
                top: '14px',
                right: '14px',
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                border: '1px solid #f1f5f9',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 10,
                transition: 'transform 0.15s ease'
              }}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Heart 
                size={20} 
                fill={isInWishlist ? '#f43f5e' : 'none'} 
                color={isInWishlist ? '#f43f5e' : '#f43f5e'} 
                strokeWidth={2.2} 
              />
            </button>

            {/* Product Image */}
            <img 
              src={product.image || (Array.isArray(product.images) ? product.images[0] : '')} 
              alt={product.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                filter: 'drop-shadow(0 10px 20px rgba(0, 0, 0, 0.08))'
              }}
            />
          </div>

          {/* Product Details Section */}
          <div style={{ padding: '18px 20px 20px' }}>
            <h3 
              style={{
                margin: '0 0 8px 0',
                fontSize: '15px',
                fontWeight: '700',
                color: '#0f172a',
                fontFamily: "'Outfit', sans-serif",
                lineHeight: 1.4,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
            >
              {product.name}
            </h3>

            {/* Price & Rating Row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>
                  ₹{price.toLocaleString('en-IN')}
                </span>
                {discountPercent > 0 && (
                  <>
                    <span style={{ fontSize: '13px', color: '#94a3b8', textDecoration: 'line-through' }}>
                      ₹{originalPrice.toLocaleString('en-IN')}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#059669' }}>
                      {discountPercent}% OFF
                    </span>
                  </>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', background: '#ecfdf5', padding: '3px 8px', borderRadius: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#059669' }}>{product.rating || '4.8'}</span>
                <span style={{ fontSize: '11px', color: '#059669' }}>★</span>
              </div>
            </div>

            {/* Tap to view prompt hint */}
            <div style={{ marginTop: '10px', fontSize: '11px', color: '#64748b', textAlign: 'center', fontWeight: '600' }}>
              Tap card to view details ➔
            </div>
          </div>
        </div>

        {/* Floating Circular Share Button Below Card (Pixel-match Blinkit / User Reference) */}
        <button
          onClick={handleShare}
          style={{
            marginTop: '18px',
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            border: '2px solid #f43f5e',
            boxShadow: '0 8px 24px rgba(244, 63, 94, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
            WebkitTapHighlightColor: 'transparent'
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          title="Share Product"
        >
          <Share2 size={22} color="#f43f5e" strokeWidth={2.2} />
        </button>
      </div>
    </div>,
    document.body
  );
};

export default ProductQuickPreviewModal;
