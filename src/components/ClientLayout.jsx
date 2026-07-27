"use client";

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Navbar from './Navbar';
import BottomNavigation from './BottomNavigation';
import CartDrawer from './CartDrawer';
import Toast from './Toast';
import { useApp } from '../context/AppContext';

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast, promotions, verifyPayment, showToast } = useApp();
  
  const categoryParam = searchParams.get('category') || 'all';
  
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  
  const showAnnouncement = promotions && promotions.announcement && promotions.announcement.show;
  const isAdminPage = pathname?.startsWith('/admin');
  
  const handleNavigate = (path) => {
    if (path === 'home' || path === '') {
      router.push('/');
    } else if (!path.startsWith('/')) {
      router.push('/' + path);
    } else {
      router.push(path);
    }
  };
  
  const handleNavigateProduct = (id) => {
    router.push(`/product/${id}`);
  };

  const handleSearch = (query) => {
    router.push(`/catalog?search=${encodeURIComponent(query)}`);
  };

  const handleSelectCategory = (catId) => {
    router.push(`/catalog?category=${catId}`);
  };

  // Verify Cashfree Payment if params exist in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cfOrderId = params.get('order_id');
    if (cfOrderId) {
      window.history.replaceState({}, document.title, window.location.pathname);
      showToast('Verifying payment status with Cashfree...', 'info');
      verifyPayment(cfOrderId).then(success => {
        if (success) {
          showToast('Online Payment Verified Successfully!', 'success');
          router.push('/orders');
        } else {
          showToast('Payment verification failed or was cancelled.', 'error');
          router.push('/cart');
        }
      });
    }
  }, [verifyPayment, showToast, router]);

  return (
    <div className="app-container">
      {/* Dynamic Announcement Ticker Ribbon */}
      {showAnnouncement && (
        <div 
          className="promo-announcement-ticker" 
          onClick={() => {
            if (promotions.announcement.link) {
              router.push(promotions.announcement.link);
            }
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: '30px',
            backgroundColor: 'var(--accent-color)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: '600',
            cursor: promotions.announcement.link ? 'pointer' : 'default',
            zIndex: 1100,
            padding: '0 16px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
          }}
        >
          {promotions.announcement.text}
        </div>
      )}

      {/* Navbar Header */}
      {!isAdminPage && (
        <Navbar 
          activePage={pathname?.replace('/', '') || 'home'} 
          onNavigate={handleNavigate} 
          onNavigateProduct={handleNavigateProduct}
          onSearch={handleSearch}
          currentCategory={categoryParam}
          onSelectCategory={handleSelectCategory}
          onCartClick={() => setIsCartDrawerOpen(true)}
          style={{ top: showAnnouncement ? '30px' : '0' }}
        />
      )}

      <main 
        className={`main-content`}
        style={{ marginTop: isAdminPage ? (showAnnouncement ? '30px' : '0') : (showAnnouncement ? '86px' : '56px') }}
      >
        {children}
      </main>

      {/* Mobile Sticky Bottom Tab Bar */}
      {!pathname?.startsWith('/product') && (
        <BottomNavigation activePage={pathname?.replace('/', '') || 'home'} onNavigate={handleNavigate} />
      )}

      {/* Toast Messages */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
        />
      )}

      {/* Global Slide-Out Cart Drawer */}
      <CartDrawer 
        isOpen={isCartDrawerOpen} 
        onClose={() => setIsCartDrawerOpen(false)} 
        onNavigate={handleNavigate}
      />
    </div>
  );
}
