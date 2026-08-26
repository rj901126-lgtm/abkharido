"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Sparkles,
  Move
} from 'lucide-react';

export default function ProductImageZoomViewer({
  images = [],
  activeIndex = 0,
  onSelectImage,
  productName = 'Product',
  extraTopRightButtons
}) {
  const [activeIdx, setActiveIdx] = useState(activeIndex);
  const [isHovering, setIsHovering] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0, percentX: 0, percentY: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalZoom, setModalZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOrigin, setDragOrigin] = useState({ x: 0, y: 0 });

  const imageContainerRef = useRef(null);
  const modalImgRef = useRef(null);

  // Sync external index changes
  useEffect(() => {
    setActiveIdx(activeIndex);
  }, [activeIndex]);

  const currentImage = images[activeIdx] || images[0] || '';
  const isVideo = currentImage.startsWith('data:video/') || currentImage.endsWith('.mp4') || currentImage.endsWith('.webm');

  // Handle Desktop Hover Coordinates for 2.5x Lens & Panel
  const handleMouseMove = (e) => {
    if (isVideo || !imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const percentX = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const percentY = Math.max(0, Math.min(100, (y / rect.height) * 100));

    setZoomPos({ x, y, percentX, percentY });
  };

  const handleMouseEnter = () => {
    if (!isVideo && window.innerWidth >= 1024) {
      setIsHovering(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  // Lightbox Modal Keyboard Navigation & Android Back Button
  useEffect(() => {
    if (!isModalOpen) return;

    // Push history state so Android / Mobile back button closes modal cleanly
    try {
      window.history.pushState({ imageModal: true }, '');
    } catch {}

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleCloseModal();
      else if (e.key === 'ArrowRight') handleNextImage();
      else if (e.key === 'ArrowLeft') handlePrevImage();
      else if (e.key === '+' || e.key === '=') handleZoomIn();
      else if (e.key === '-') handleZoomOut();
    };

    const handlePopState = () => {
      setIsModalOpen(false);
      setModalZoom(1);
      setPanOffset({ x: 0, y: 0 });
      document.body.style.overflow = 'auto';
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isModalOpen, activeIdx, images.length]);

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setModalZoom(1);
    setPanOffset({ x: 0, y: 0 });
    document.body.style.overflow = 'hidden';
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalZoom(1);
    setPanOffset({ x: 0, y: 0 });
    document.body.style.overflow = 'auto';
  };

  const handleZoomIn = () => {
    setModalZoom(prev => Math.min(prev + 0.5, 3.5));
  };

  const handleZoomOut = () => {
    setModalZoom(prev => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPanOffset({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setModalZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleNextImage = () => {
    const nextIdx = (activeIdx + 1) % images.length;
    setActiveIdx(nextIdx);
    if (onSelectImage) onSelectImage(nextIdx);
    setPanOffset({ x: 0, y: 0 });
  };

  const handlePrevImage = () => {
    const prevIdx = (activeIdx - 1 + images.length) % images.length;
    setActiveIdx(prevIdx);
    if (onSelectImage) onSelectImage(prevIdx);
    setPanOffset({ x: 0, y: 0 });
  };

  // Drag & Pan handlers for zoomed modal
  const handleMouseDown = (e) => {
    if (modalZoom <= 1) return;
    setIsDragging(true);
    setDragOrigin({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleModalMouseMove = (e) => {
    if (!isDragging || modalZoom <= 1) return;
    setPanOffset({
      x: e.clientX - dragOrigin.x,
      y: e.clientY - dragOrigin.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Mobile Double Tap to Zoom
  const lastTapRef = useRef(0);
  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      setModalZoom(prev => prev > 1 ? 1 : 2);
      setPanOffset({ x: 0, y: 0 });
    }
    lastTapRef.current = now;
  };

  return (
    <div className="product-image-zoom-showcase" style={{ position: 'relative', width: '100%' }}>
      
      {/* 🖼️ Main Active Image Display Stage */}
      <div 
        ref={imageContainerRef}
        className="main-image-frame zoom-interactive-frame"
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleOpenModal}
        style={{
          position: 'relative',
          width: '100%',
          height: '460px',
          background: 'radial-gradient(circle at center, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '24px',
          border: '1.5px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isVideo ? 'default' : 'crosshair',
          overflow: 'hidden',
          boxShadow: '0 8px 30px rgba(15, 23, 42, 0.06)',
          transition: 'border-color 0.2s ease'
        }}
      >
        {isVideo ? (
          <video 
            src={currentImage} 
            autoPlay 
            loop 
            muted 
            playsInline 
            style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
          />
        ) : (
          <img 
            src={currentImage} 
            alt={productName}
            style={{
              maxWidth: '88%',
              maxHeight: '88%',
              objectFit: 'contain',
              transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              userSelect: 'none'
            }}
          />
        )}

        {/* 🔍 Desktop Hover Tracking Lens */}
        {isHovering && !isVideo && (
          <div 
            className="zoom-lens-overlay"
            style={{
              position: 'absolute',
              top: `${zoomPos.y - 70}px`,
              left: `${zoomPos.x - 70}px`,
              width: '140px',
              height: '140px',
              border: '2px solid #4f46e5',
              borderRadius: '16px',
              backgroundColor: 'rgba(79, 70, 229, 0.15)',
              backdropFilter: 'blur(2px)',
              pointerEvents: 'none',
              boxShadow: '0 0 20px rgba(79, 70, 229, 0.35)',
              zIndex: 10
            }}
          />
        )}

        {/* 🔍 "Tap to Zoom" Floating Pill Button */}
        {!isVideo && (
          <button
            type="button"
            className="zoom-trigger-badge"
            onClick={(e) => { e.stopPropagation(); handleOpenModal(); }}
            style={{
              position: 'absolute',
              bottom: '16px',
              right: '16px',
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '99px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
              transition: 'all 0.2s ease',
              zIndex: 12
            }}
          >
            <Maximize2 size={13} strokeWidth={2.5} />
            <span>Tap to Zoom HD</span>
          </button>
        )}

        {/* Extra Top Right Wishlist & Share buttons */}
        {extraTopRightButtons && (
          <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 15, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {extraTopRightButtons}
          </div>
        )}
      </div>

      {/* 🔎 Floating Desktop 2.5x Magnified Preview Panel */}
      {isHovering && !isVideo && (
        <div 
          className="desktop-zoom-magnifier-window"
          style={{
            position: 'absolute',
            top: 0,
            left: 'calc(100% + 20px)',
            width: '460px',
            height: '460px',
            borderRadius: '24px',
            border: '2px solid #4f46e5',
            backgroundColor: '#ffffff',
            backgroundImage: `url(${currentImage})`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: `${zoomPos.percentX}% ${zoomPos.percentY}%`,
            backgroundSize: '280%',
            boxShadow: '0 25px 60px -10px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(79, 70, 229, 0.1)',
            zIndex: 900,
            overflow: 'hidden',
            pointerEvents: 'none'
          }}
        >
          <div style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            background: 'rgba(15, 23, 42, 0.8)',
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: '800',
            padding: '3px 10px',
            borderRadius: '8px',
            letterSpacing: '0.5px'
          }}>
            2.8x Ultra-HD Zoom
          </div>
        </div>
      )}

      {/* 🌟 FULLSCREEN HD LIGHTBOX MODAL */}
      {isModalOpen && (
        <div 
          className="lightbox-modal-backdrop"
          onClick={handleCloseModal}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(5, 8, 15, 0.98)',
            backdropFilter: 'blur(25px)',
            WebkitBackdropFilter: 'blur(25px)',
            zIndex: 999999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px calc(16px + env(safe-area-inset-bottom)) 20px',
            boxSizing: 'border-box',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          {/* Fixed Floating Top-Right Close Button */}
          <button 
            type="button" 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleCloseModal(); }}
            onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); handleCloseModal(); }}
            onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); handleCloseModal(); }}
            className="lightbox-close-btn"
            title="Close (Esc)"
            style={{
              position: 'fixed',
              top: '18px',
              right: '18px',
              background: '#ef4444',
              border: '2px solid #ffffff',
              color: '#ffffff',
              borderRadius: '24px',
              padding: '8px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              fontWeight: '900',
              fontSize: '13.5px',
              boxShadow: '0 6px 20px rgba(239, 68, 68, 0.6)',
              zIndex: 10000010,
              touchAction: 'manipulation'
            }}
          >
            <X size={18} strokeWidth={3} />
            <span>Close</span>
          </button>

          {/* Top Info Bar */}
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '1200px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              color: '#ffffff',
              padding: '6px 0 12px 0',
              zIndex: 1000001
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '14px', fontWeight: '800', fontFamily: "'Outfit', sans-serif", maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {productName}
              </span>
              <span style={{ fontSize: '11.5px', color: '#94a3b8', background: 'rgba(255,255,255,0.12)', padding: '2px 8px', borderRadius: '6px', fontWeight: '700' }}>
                {activeIdx + 1} / {images.length}
              </span>
            </div>
          </div>

          {/* Main Zoomed Stage - Tap outside image closes modal */}
          <div 
            onClick={handleCloseModal}
            onMouseDown={handleMouseDown}
            onMouseMove={handleModalMouseMove}
            onMouseUp={handleMouseUp}
            onTouchEnd={handleDoubleTap}
            style={{
              position: 'relative',
              flex: 1,
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              cursor: modalZoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
            }}
          >
            {/* Left Nav Arrow */}
            {images.length > 1 && (
              <button 
                type="button" 
                onClick={handlePrevImage}
                style={{
                  position: 'absolute',
                  left: '20px',
                  zIndex: 20,
                  background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  color: 'white',
                  borderRadius: '50%',
                  width: '46px',
                  height: '46px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <ChevronLeft size={24} />
              </button>
            )}

            {/* Main Interactive Zoom Image */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                setModalZoom(prev => {
                  const next = prev > 1 ? 1 : 2;
                  if (next === 1) setPanOffset({ x: 0, y: 0 });
                  return next;
                });
              }}
              style={{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${modalZoom})`,
                transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                maxWidth: '90%',
                maxHeight: '80vh',
                cursor: modalZoom > 1 ? 'zoom-out' : 'zoom-in'
              }}
            >
              <img 
                ref={modalImgRef}
                src={currentImage} 
                alt={productName}
                style={{
                  maxWidth: '85vw',
                  maxHeight: '75vh',
                  objectFit: 'contain',
                  userSelect: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
                }}
                draggable={false}
              />
            </div>

            {/* Right Nav Arrow */}
            {images.length > 1 && (
              <button 
                type="button" 
                onClick={handleNextImage}
                style={{
                  position: 'absolute',
                  right: '20px',
                  zIndex: 20,
                  background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  color: 'white',
                  borderRadius: '50%',
                  width: '46px',
                  height: '46px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <ChevronRight size={24} />
              </button>
            )}
          </div>

          {/* Bottom Filmstrip Thumbnails */}
          {images.length > 1 && (
            <div 
              onClick={(e) => e.stopPropagation()}
              style={{
                display: 'flex',
                gap: '10px',
                padding: '12px 20px',
                background: 'rgba(15, 23, 42, 0.8)',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.15)',
                overflowX: 'auto',
                maxWidth: '90vw'
              }}
            >
              {images.map((imgUrl, idx) => (
                <img
                  key={idx}
                  src={imgUrl}
                  alt={`Thumbnail ${idx + 1}`}
                  onClick={() => {
                    setActiveIdx(idx);
                    if (onSelectImage) onSelectImage(idx);
                    setPanOffset({ x: 0, y: 0 });
                  }}
                  style={{
                    width: '48px',
                    height: '48px',
                    objectFit: 'contain',
                    borderRadius: '8px',
                    border: activeIdx === idx ? '2px solid #4f46e5' : '1px solid rgba(255,255,255,0.2)',
                    background: '#ffffff',
                    padding: '2px',
                    cursor: 'pointer',
                    opacity: activeIdx === idx ? 1 : 0.6,
                    transition: 'all 0.15s ease'
                  }}
                />
              ))}
            </div>
          )}

          {/* Floating Bottom Exit Pill on Mobile */}
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleCloseModal(); }}
            onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); handleCloseModal(); }}
            onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); handleCloseModal(); }}
            style={{
              position: 'fixed',
              bottom: 'calc(14px + env(safe-area-inset-bottom))',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              borderRadius: '30px',
              padding: '6px 18px',
              fontSize: '12px',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              zIndex: 10000008,
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
              whiteSpace: 'nowrap',
              touchAction: 'manipulation'
            }}
          >
            <X size={14} strokeWidth={2.5} /> Tap to Exit Zoom
          </button>

        </div>
      )}

    </div>
  );
}
