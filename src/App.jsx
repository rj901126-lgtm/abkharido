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

const AppContent = () => {
  const { toast } = useApp();
  const [activePage, setActivePage] = useState('home');
  const [currentCategory, setCurrentCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeProductId, setActiveProductId] = useState(null);
  const [useCoinsDiscount, setUseCoinsDiscount] = useState(false);

  // Parse product details directly from URL on mount (simulates direct link loading)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const prodId = params.get('prod');
    const isAdmin = params.get('admin');
    if (prodId) {
      setActiveProductId(prodId);
      setActivePage('product');
    } else if (isAdmin === 'true' || isAdmin === '1') {
      setActivePage('admin');
    }
  }, []);

  const handleNavigate = (page) => {
    setActivePage(page);
    window.scrollTo(0, 0);

    // If leaving checkout or cart, reset coin discount checkbox state
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
    setSearchQuery(''); // Clear search when selecting category quickbar
    handleNavigate('catalog');
  };

  const handleBuyNow = (product) => {
    // Add product to cart, then navigate directly to cart
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
