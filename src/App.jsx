import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
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
                style={{ width: '100%', height: '40px', padding: '0 10px', border: '1px solid #dcdcdc', borderRadius: '4px', fontSize: '13px' }}
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
                style={{ width: '100%', height: '40px', padding: '0 10px', border: '1px solid #dcdcdc', borderRadius: '4px', fontSize: '13px' }}
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
              style={{ width: '100%', height: '40px', padding: '0 10px', border: '1px solid #dcdcdc', borderRadius: '4px', fontSize: '13px', backgroundColor: loadingLoc ? '#f5f5f5' : 'white' }}
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
              style={{ width: '100%', height: '70px', padding: '10px', border: '1px solid #dcdcdc', borderRadius: '4px', fontSize: '13px', resize: 'none' }}
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

  // Parse details from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const prodId = params.get('prod');
    const isAdmin = params.get('admin');
    const cfOrderId = params.get('order_id');
    const isCreator = params.get('creator') === 'true' || params.get('partner') === 'true';

    if (cfOrderId) {
      // Clear URL parameter immediately to prevent duplicate runs
      window.history.replaceState({}, document.title, window.location.pathname);
      
      const runVerification = async () => {
        showToast('Verifying payment status with Cashfree...', 'info');
        const success = await verifyPayment(cfOrderId);
        if (success) {
          showToast('Online Payment Verified Successfully!', 'success');
          setActivePage('orders');
        } else {
          showToast('Payment verification failed or was cancelled.', 'error');
          setActivePage('cart');
        }
      };
      runVerification();
    } else if (prodId) {
      setActiveProductId(prodId);
      setActivePage('product');
    } else if (isCreator) {
      if (currentUser) {
        setActivePage('partner');
      } else {
        setActivePage('login');
        showToast('Please log in to access the Creator Hub.', 'warning');
      }
    } else if (isAdmin === 'true' || isAdmin === '1') {
      setActivePage('admin');
    }
  }, [verifyPayment, showToast, currentUser]);

  const handleNavigate = (page) => {
    // Route protection: login required for secure pages
    const protectedPages = ['checkout', 'partner', 'orders'];
    if (protectedPages.includes(page) && !currentUser) {
      showToast('Please sign in to access this page.', 'warning');
      setActivePage('login');
      window.scrollTo(0, 0);
      return;
    }

    setActivePage(page);
    window.scrollTo(0, 0);

    // Reset coin discount if leaving cart/checkout
    if (page !== 'cart' && page !== 'checkout') {
      setUseCoinsDiscount(false);
    }
  };

  const handleNavigateProduct = (productId) => {
    setActiveProductId(productId);
    handleNavigate('product');
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    handleNavigate('catalog');
  };

  const handleSelectCategory = (catId) => {
    setCurrentCategory(catId);
    setSearchQuery(''); 
    handleNavigate('catalog');
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
          />
        );
      case 'catalog':
        return (
          <ProductCatalog 
            currentCategory={currentCategory} 
            onSelectCategory={handleSelectCategory}
            searchQuery={searchQuery}
            onNavigateProduct={handleNavigateProduct}
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
      case 'orders':
        return <Orders onNavigate={handleNavigateProduct} />;
      case 'admin':
        return <AdminDashboard onNavigate={handleNavigate} />;
      case 'login':
        return <Login onNavigate={handleNavigate} />;
      case 'profile':
        return <ProfilePage onNavigate={handleNavigate} />;
      default:
        return <Home onNavigate={handleNavigate} onNavigateProduct={handleNavigateProduct} onSelectCategory={handleSelectCategory} />;
    }
  };

  return (
    <div className="app-container">
      {/* Navbar Header */}
      <Navbar 
        activePage={activePage} 
        onNavigate={handleNavigate} 
        onSearch={handleSearch}
        currentCategory={currentCategory}
        onSelectCategory={handleSelectCategory}
      />

      {/* Main Content Area */}
      <main className="main-content">
        {renderPage()}
      </main>

      {/* Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* Mobile Sticky Bottom Tab Bar */}
      <BottomNavigation activePage={activePage} onNavigate={handleNavigate} />

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
