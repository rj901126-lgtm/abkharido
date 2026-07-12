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
import BottomNavigation from './components/BottomNavigation';
import InfoPage from './pages/InfoPage';

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
      {!activePage.startsWith('product') && activePage !== 'checkout' && activePage !== 'cart' && activePage !== 'catalog' && (
        <BottomNavigation activePage={activePage} onNavigate={handleNavigate} />
      )}

      {/* Toast Messages */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
        />
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
