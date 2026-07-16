import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import Toast from './components/Toast';

// Pages
import Home from './pages/Home';
import ProductCatalog from './pages/ProductCatalog';
import ProductDetails from './pages/ProductDetails';
import CartPage from './pages/CartPage';
import Checkout from './pages/Checkout';
import PartnerCenter from './pages/PartnerCenter';
import Orders from './pages/Orders';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import ProfilePage from './pages/ProfilePage';
import BottomNavigation from './components/BottomNavigation';
import InfoPage from './pages/InfoPage';
import SellerDashboard from './pages/SellerDashboard';
import CategoriesPage from './pages/CategoriesPage';
const OnboardingModal = () => {
  const { currentUser, updateUserProfile, showToast } = useApp();
  const [fName, setFName] = React.useState('');
  const [sName, setSName] = React.useState('');
  const [pCode, setPCode] = React.useState('');
  const [addr, setAddr] = React.useState('');
  const [loadingLoc, setLoadingLoc] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Auto Geolocate on mount
  React.useEffect(() => {
    const fetchLocation = async () => {
      if (navigator.geolocation) {
        setLoadingLoc(true);
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const { latitude, longitude } = position.coords;
              const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
              if (res.ok) {
                const data = await res.json();
                const code = data.address?.postcode || '';
                if (code) {
                  setPCode(code);
                  showToast(`Location detected! Pincode ${code} set.`);
                } else {
                  setPCode('560001'); // Fallback Bangalore
                }
              } else {
                setPCode('110001'); // Fallback Delhi
              }
            } catch (e) {
              setPCode('400001'); // Fallback Mumbai
            } finally {
              setLoadingLoc(false);
            }
          },
          () => {
            setPCode('110001'); // Fallback Delhi
            setLoadingLoc(false);
            showToast('Location access denied. Please enter pincode manually.', 'info');
          }
        );
      } else {
        setPCode('110001');
      }
    };
    fetchLocation();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fName.trim() || !sName.trim()) {
      showToast('First name and surname are required.', 'error');
      return;
    }
    if (!addr.trim()) {
      showToast('Street address is mandatory.', 'error');
      return;
    }
    if (pCode.trim().length !== 6 || isNaN(pCode)) {
      showToast('Please enter a valid 6-digit Pincode.', 'error');
      return;
    }

    setIsSubmitting(true);
    await updateUserProfile({
      firstName: fName.trim(),
      lastName: sName.trim(),
      pincode: pCode.trim(),
      address: addr.trim()
    });
    setIsSubmitting(false);
    showToast('Onboarding complete! Welcome to AbKharido.');
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(4px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div className="animate-fade-in" style={{
        backgroundColor: 'white',
        width: '100%',
        maxWidth: '450px',
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--primary-color)' }}>Complete Your Profile</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Please fill in your name and delivery address to start shopping.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#666', marginBottom: '4px' }}>FIRST NAME *</label>
              <input 
                type="text" 
                value={fName} 
                onChange={(e) => setFName(e.target.value)} 
                placeholder="e.g. Rajesh"
                 style={{ width: '100%', height: '40px', padding: '0 10px', border: '1px solid #dcdcdc', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box' }}
                required 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#666', marginBottom: '4px' }}>SURNAME *</label>
              <input 
                type="text" 
                value={sName} 
                onChange={(e) => setSName(e.target.value)} 
                placeholder="e.g. Kumar"
                style={{ width: '100%', height: '40px', padding: '0 10px', border: '1px solid #dcdcdc', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box' }}
                required 
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#666', marginBottom: '4px' }}>PINCODE *</label>
            <input 
              type="text" 
              maxLength="6"
              value={pCode} 
              onChange={(e) => setPCode(e.target.value.replace(/\D/g, ''))} 
              placeholder={loadingLoc ? "Detecting Pincode..." : "6-digit code"}
              style={{ width: '100%', height: '40px', padding: '0 10px', border: '1px solid #dcdcdc', borderRadius: '4px', fontSize: '13px', backgroundColor: loadingLoc ? '#f5f5f5' : 'white', boxSizing: 'border-box' }}
              disabled={loadingLoc}
              required 
            />
            {loadingLoc && <span style={{ fontSize: '11px', color: 'var(--primary-color)', marginTop: '2px', display: 'block' }}>Fetching GPS location...</span>}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#666', marginBottom: '4px' }}>STREET ADDRESS (MANDATORY) *</label>
            <textarea 
              value={addr} 
              onChange={(e) => setAddr(e.target.value)} 
              placeholder="House No, Flat, Street Name, Land Mark, City & State"
              style={{ width: '100%', height: '70px', padding: '10px', border: '1px solid #dcdcdc', borderRadius: '4px', fontSize: '13px', resize: 'none', boxSizing: 'border-box' }}
              required 
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-accent" 
            style={{ width: '100%', height: '44px', fontWeight: 'bold', marginTop: '6px' }}
            disabled={isSubmitting || loadingLoc}
          >
            {isSubmitting ? 'SAVING PROFILE...' : 'SAVE & PROCEED'}
          </button>
        </form>
      </div>
    </div>
  );
};

const AppContent = () => {
  const { toast, currentUser, verifyPayment, showToast } = useApp();
  const [activePage, setActivePage] = useState('home');
  const [currentCategory, setCurrentCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeProductId, setActiveProductId] = useState(null);
  const [useCoinsDiscount, setUseCoinsDiscount] = useState(false);
  const [promotions, setPromotions] = useState(null);

  const fetchPromotions = async () => {
    try {
      const res = await fetch('/api/promotions');
      if (res.ok) {
        const data = await res.json();
        setPromotions(data);
      }
    } catch (err) {
      console.warn('Failed to fetch promotions config:', err);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const handleUpdatePromotions = (newPromos) => {
    setPromotions(newPromos);
  };

  // Parse details from URL and hash on mount/hashchange
  useEffect(() => {
    const handleHashChange = async () => {
      // Check search parameters first (e.g. for Cashfree redirects or creator parameters)
      const params = new URLSearchParams(window.location.search);
      const cfOrderId = params.get('order_id');
      const prodId = params.get('prod');
      const isAdmin = params.get('admin') === 'true' || params.get('admin') === '1';
      const isCreator = params.get('creator') === 'true' || params.get('partner') === 'true';

      if (cfOrderId) {
        // Clear search parameters immediately to prevent duplicate verification runs
        window.history.replaceState({}, document.title, window.location.pathname);
        showToast('Verifying payment status with Cashfree...', 'info');
        const success = await verifyPayment(cfOrderId);
        if (success) {
          showToast('Online Payment Verified Successfully!', 'success');
          window.location.hash = '#orders';
        } else {
          showToast('Payment verification failed or was cancelled.', 'error');
          window.location.hash = '#cart';
        }
        return;
      }

      if (prodId) {
        // Clear search parameter so it transitions to hash routing
        window.history.replaceState({}, document.title, window.location.pathname);
        setActiveProductId(prodId);
        window.location.hash = `#product-${prodId}`;
        return;
      }

      if (isAdmin) {
        window.history.replaceState({}, document.title, window.location.pathname);
        window.location.hash = '#admin';
        return;
      }

      if (isCreator) {
        window.history.replaceState({}, document.title, window.location.pathname);
        if (currentUser) {
          window.location.hash = '#partner';
        } else {
          window.location.hash = '#login';
          showToast('Please log in to access the Creator Hub.', 'warning');
        }
        return;
      }

      // Read from hash
      const hash = window.location.hash;
      let targetPage = 'home';
      let targetProdId = null;
      let targetCategory = 'all';

      if (hash && hash !== '#home') {
        if (hash === '#cart') targetPage = 'cart';
        else if (hash === '#checkout') targetPage = 'checkout';
        else if (hash === '#orders') targetPage = 'orders';
        else if (hash === '#profile') targetPage = 'profile';
        else if (hash === '#partner') targetPage = 'partner';
        else if (hash === '#seller') targetPage = 'seller';
        else if (hash === '#admin') targetPage = 'admin';
        else if (hash === '#login') targetPage = 'login';
        else if (hash === '#categories') targetPage = 'categories';
        else if (hash === '#catalog') {
          targetPage = 'catalog';
          targetCategory = 'all';
        } else if (hash.startsWith('#catalog-')) {
          targetPage = 'catalog';
          targetCategory = hash.replace('#catalog-', '');
        } else if (hash.startsWith('#product-')) {
          targetPage = 'product';
          targetProdId = hash.replace('#product-', '');
        }
      }

      // Route protection check: login required for secure pages
      const protectedPages = ['checkout', 'partner', 'seller', 'orders', 'profile'];
      if (protectedPages.includes(targetPage) && !currentUser) {
        showToast('Please sign in to access this page.', 'warning');
        window.location.hash = '#login';
        return;
      }

      if (targetPage === 'product' && targetProdId) {
        setActiveProductId(targetProdId);
      }
      if (targetPage === 'catalog') {
        setCurrentCategory(targetCategory);
      }
      setActivePage(targetPage);
    };

    // Run initial parsing on load
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentUser, verifyPayment, showToast]);

  const handleNavigate = (page) => {
    // Route protection check: login required for secure pages
    const protectedPages = ['checkout', 'partner', 'orders', 'profile'];
    if (protectedPages.includes(page) && !currentUser) {
      showToast('Please sign in to access this page.', 'warning');
      window.location.hash = '#login';
      return;
    }

    if (page === 'product' && activeProductId) {
      window.location.hash = `#product-${activeProductId}`;
    } else if (page === 'catalog') {
      window.location.hash = `#catalog-${currentCategory || 'all'}`;
    } else {
      window.location.hash = `#${page}`;
    }
    window.scrollTo(0, 0);

    // Reset coin discount if leaving cart/checkout
    if (page !== 'cart' && page !== 'checkout') {
      setUseCoinsDiscount(false);
    }
  };

  const handleNavigateProduct = (productId) => {
    setActiveProductId(productId);
    window.location.hash = `#product-${productId}`;
    window.scrollTo(0, 0);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    handleNavigate('catalog');
  };

  const handleSelectCategory = (catId) => {
    setCurrentCategory(catId);
    setSearchQuery(''); 
    window.location.hash = `#catalog-${catId}`;
  };

  const handleBuyNow = (product) => {
    handleNavigate('cart');
  };

  const handleProceedToCheckout = (redeemCoins) => {
    setUseCoinsDiscount(redeemCoins);
    handleNavigate('checkout');
  };

  const renderPage = () => {
    if (activePage.startsWith('product') && activeProductId) {
      return (
        <ProductDetails 
          productId={activeProductId} 
          onNavigate={handleNavigate}
          onBuyNow={(prod) => {
            handleBuyNow(prod);
          }}
        />
      );
    }

    if (activePage.startsWith('info-')) {
      const type = activePage.split('-')[1];
      return <InfoPage infoType={type} />;
    }

    switch (activePage) {
      case 'home':
        return (
          <Home 
            onNavigate={handleNavigate} 
            onNavigateProduct={handleNavigateProduct}
            onSelectCategory={handleSelectCategory}
            promotions={promotions}
          />
        );
      case 'catalog':
        return (
          <ProductCatalog 
            currentCategory={currentCategory} 
            onSelectCategory={handleSelectCategory}
            searchQuery={searchQuery}
            onNavigateProduct={handleNavigateProduct}
            promotions={promotions}
          />
        );
      case 'categories':
        return (
          <CategoriesPage 
            onNavigate={handleNavigate}
            onSelectCategory={handleSelectCategory}
            onNavigateProduct={handleNavigateProduct}
            promotions={promotions}
          />
        );
      case 'cart':
        return (
          <CartPage 
            onNavigate={handleNavigate} 
            onCheckout={handleProceedToCheckout}
          />
        );
      case 'checkout':
        return (
          <Checkout 
            useCoinsDiscount={useCoinsDiscount}
            onNavigate={handleNavigate}
          />
        );
      case 'partner':
        return <PartnerCenter />;
      case 'seller':
        return <SellerDashboard onNavigate={handleNavigate} />;
      case 'orders':
        return <Orders onNavigate={handleNavigateProduct} />;
      case 'admin':
        return <AdminDashboard onNavigate={handleNavigate} promotions={promotions} onUpdatePromotions={handleUpdatePromotions} />;
      case 'login':
        return <Login onNavigate={handleNavigate} />;
      case 'profile':
        return <ProfilePage onNavigate={handleNavigate} />;
      default:
        return <Home onNavigate={handleNavigate} onNavigateProduct={handleNavigateProduct} onSelectCategory={handleSelectCategory} promotions={promotions} />;
    }
  };

  const showAnnouncement = promotions && promotions.announcement && promotions.announcement.show;
  const isAdminPage = activePage === 'admin';

  return (
    <div className="app-container">
      {/* Dynamic Announcement Ticker Ribbon */}
      {showAnnouncement && (
        <div 
          className="promo-announcement-ticker" 
          onClick={() => {
            if (promotions.announcement.link) {
              handleNavigate(promotions.announcement.link);
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

      {/* Navbar Header - Hidden on Admin Dashboard to prevent storefront header clutter */}
      {!isAdminPage && (
        <Navbar 
          activePage={activePage} 
          onNavigate={handleNavigate} 
          onNavigateProduct={handleNavigateProduct}
          onSearch={handleSearch}
          currentCategory={currentCategory}
          onSelectCategory={handleSelectCategory}
          style={{ top: showAnnouncement ? '30px' : '0' }}
        />
      )}

      {/* Main Content Area */}
      <main 
        className={`main-content ${activePage === 'categories' ? 'no-padding-bottom' : ''}`}
        style={{ marginTop: isAdminPage ? (showAnnouncement ? '30px' : '0') : (showAnnouncement ? '86px' : '56px') }}
      >
        {renderPage()}
      </main>

      {/* Mobile Sticky Bottom Tab Bar */}
      {activePage && !activePage.startsWith('product') && (
        <BottomNavigation activePage={activePage} onNavigate={handleNavigate} />
      )}

      {/* Toast Messages */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
        />
      )}

      {/* Onboarding Overlay Modal for incomplete names/addresses */}
      {currentUser && (!currentUser.firstName || !currentUser.lastName || !currentUser.address) && (
        <OnboardingModal />
      )}
    </div>
  );
};

const App = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
