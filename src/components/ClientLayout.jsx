"use client";

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Navbar from './Navbar';
import BottomNavigation from './BottomNavigation';
import CartDrawer from './CartDrawer';
import Toast from './Toast';
import Footer from './Footer';
import LivePurchasePopup from './LivePurchasePopup';
import SmartSupportBot from './SmartSupportBot';
import { useApp } from '../context/AppContext';
import { MessageCircle, Wrench, ShieldAlert, Mail, Phone, Lock, Clock, Sparkles } from 'lucide-react';

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast, promotions, verifyPayment, showToast } = useApp();
  
  const categoryParam = searchParams.get('category') || 'all';
  
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

  // Auto-close cart drawer on navigation/route change
  useEffect(() => {
    setIsCartDrawerOpen(false);
  }, [pathname]);
  
  // Global Store Configuration State
  const [globalConfig, setGlobalConfig] = useState({
    themeColor: '#2874f0',
    supportEmail: 'support@abkharido.com',
    supportPhone: '+91 9172600587',
    announcementBar: '🎉 FREE Express Delivery on all orders + 100% Genuine Brand Warranty!',
    freeShippingThreshold: '499',
    enableWhatsAppFloat: true,
    maintenanceMode: false
  });

  const isPortalPage = pathname?.startsWith('/admin') || pathname?.startsWith('/seller') || pathname?.startsWith('/login');
  
  // Load and subscribe to global admin configurations
  useEffect(() => {
    const loadConfig = () => {
      const saved = localStorage.getItem('abkharido_global_config');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setGlobalConfig(prev => ({ ...prev, ...parsed }));
          if (parsed.themeColor) {
            document.documentElement.style.setProperty('--primary-color', parsed.themeColor);
          }
        } catch (e) {}
      }
    };

    loadConfig();

    // Check periodically for real-time toggling across tabs without refresh
    const interval = setInterval(loadConfig, 2000);
    window.addEventListener('storage', loadConfig);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', loadConfig);
    };
  }, []);

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

  const promoAnnouncement = promotions?.announcement;
  const activeAnnouncementText = promoAnnouncement?.text !== undefined ? promoAnnouncement.text : globalConfig.announcementBar;
  const showAnnouncement = !isPortalPage && (promoAnnouncement?.show !== undefined ? (promoAnnouncement.show && Boolean(activeAnnouncementText?.trim())) : Boolean(globalConfig.announcementBar?.trim()));

  // 1. SYSTEM MAINTENANCE & SECURITY LOCK SCREEN ENFORCEMENT
  // If Maintenance Mode is active in Admin settings and user is NOT on Admin/Login portal, lock down storefront!
  if (globalConfig.maintenanceMode && !isPortalPage) {
    return (
      <div style={{
        minHeight: '100vh', width: '100%', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #064e3b 100%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '24px',
        color: '#ffffff', textAlign: 'center', position: 'relative', overflow: 'hidden'
      }}>
        {/* Background glow circle */}
        <div style={{ position: 'absolute', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(0,0,0,0) 70%)', top: '20%', pointerEvents: 'none' }}></div>
        
        <div style={{
          background: 'rgba(30, 41, 59, 0.7)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '28px', padding: '48px 36px', maxWidth: '560px', width: '100%', boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '22px', position: 'relative', zIndex: 10
        }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 10px 25px rgba(245, 158, 11, 0.4)', animation: 'pulse 2s infinite' }}>
            <Wrench size={42} color="#ffffff" />
          </div>
          <style>{`@keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.06); } }`}</style>

          <span style={{ fontSize: '11px', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', background: '#fef3c7', color: '#92400e', padding: '6px 16px', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #fde68a' }}>
            <Clock size={13} /> STOREFRONT TEMPORARILY OFFLINE
          </span>

          <div>
            <h1 style={{ margin: '0 0 12px 0', fontSize: '28px', fontWeight: '900', letterSpacing: '-0.5px', color: '#f8fafc' }}>
              System Upgrade & Maintenance
            </h1>
            <p style={{ margin: 0, fontSize: '15px', color: '#cbd5e1', lineHeight: '1.6', maxWidth: '440px' }}>
              We are actively upgrading our database security and restocking premium inventories on <strong>Ab Kharido</strong> to serve you better. We will return online shortly!
            </p>
          </div>

          <hr style={{ width: '100%', border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '4px 0' }} />

          {/* Support Information */}
          <div style={{ width: '100%', background: 'rgba(15, 23, 42, 0.6)', padding: '18px 20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' }}>
            <div style={{ fontSize: '12px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Need urgent customer support?</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: '700', color: '#38bdf8' }}>
              <Mail size={16} style={{ color: '#4ade80' }} /> <span>{globalConfig.supportEmail}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: '700', color: '#38bdf8' }}>
              <Phone size={16} style={{ color: '#fbbf24' }} /> <span>{globalConfig.supportPhone}</span>
            </div>
          </div>

          <div style={{ marginTop: '10px', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Lock size={13} /> AbKharido Protected Server
            </span>
            <a 
                href="#login" 
                className="nav-item-btn" 
                onClick={(e) => { e.preventDefault(); handleNavigate('login'); }}
                style={{ backgroundColor: 'var(--nav-login-bg, white)', color: 'var(--nav-login-color, var(--primary-color))', padding: '6px 20px', borderRadius: '2px', fontWeight: 'bold', fontSize: '14px', textDecoration: 'none' }}
              >
                Login
              </a>
          </div>
        </div>
      </div>
    );
  }

  // 2. REGULAR STOREFRONT VIEW WITH DYNAMIC BANNER & WHATSAPP SUPPORT
  const cleanPhone = (globalConfig.supportPhone || '919172600587').replace(/[^0-9]/g, '');
  const isProductPage = pathname?.startsWith('/product');
  const isHomePage = pathname === '/' || pathname === '';

  return (
    <div className="app-container">
      {/* Navbar Header */}
      {!isPortalPage && (
        <Navbar 
          activePage={pathname?.replace('/', '') || 'home'} 
          onNavigate={handleNavigate} 
          onNavigateProduct={handleNavigateProduct}
          onSearch={handleSearch}
          currentCategory={categoryParam}
          onSelectCategory={handleSelectCategory}
          onCartClick={() => setIsCartDrawerOpen(true)}
          style={{ top: 0 }}
        />
      )}

      <main 
        className={`main-content`}
        style={isPortalPage ? { marginTop: 0 } : undefined}
      >
        {children}
      </main>


      {/* VIP Corporate E-Commerce Footer (Home page only) */}
      {isHomePage && <Footer onNavigate={handleNavigate} />}

      {/* AI Smart Customer Support Assistant Bot */}
      {!isPortalPage && (
        <SmartSupportBot 
          supportPhone={globalConfig.supportPhone} 
          supportEmail={globalConfig.supportEmail} 
        />
      )}

      {/* Mobile Sticky Bottom Tab Bar - Strictly hidden on portal pages */}
      {!isPortalPage && !pathname?.startsWith('/product') && !pathname?.startsWith('/cart') && !pathname?.startsWith('/checkout') && (
        <BottomNavigation activePage={pathname?.replace('/', '') || 'home'} onNavigate={handleNavigate} />
      )}

      {/* Toast Messages */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
        />
      )}

      {/* Global Slide-Out Cart Drawer - Never rendered on admin/portal */}
      {!isPortalPage && (
        <CartDrawer 
          isOpen={isCartDrawerOpen} 
          onClose={() => setIsCartDrawerOpen(false)} 
          onNavigate={handleNavigate}
        />
      )}
    </div>
  );
}
