import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  // --- Persistent & API States ---
  const [products, setProducts] = useState([]);
  
  const [currentUser, setCurrentUser] = useState({
    username: 'amit_kumar',
    fullName: 'Amit Kumar',
    email: 'amit.kumar@gmail.com',
    isInfluencer: false,
    influencerId: '',
    walletCoins: 0,
    walletCash: 0,
    ordersCount: 0,
    payoutDetails: { upi: '', bankAccount: '', bankIfsc: '' }
  });

  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('abkharido_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [orders, setOrders] = useState([]);
  
  const [partnerStats, setPartnerStats] = useState({
    clicks: 0,
    conversions: 0,
    history: [],
    payouts: []
  });

  const [activeReferral, setActiveReferral] = useState(() => {
    const saved = localStorage.getItem('abkharido_active_referral');
    return saved ? JSON.parse(saved) : null;
  });

  const [toast, setToast] = useState(null);

  // --- Fetch Data on Mount ---
  useEffect(() => {
    fetchProducts();
    fetchUser(currentUser.username);
    fetchOrders();
    fetchStats();
  }, []);

  // --- Sync Temporary Cart details ---
  useEffect(() => {
    localStorage.setItem('abkharido_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (activeReferral) {
      localStorage.setItem('abkharido_active_referral', JSON.stringify(activeReferral));
    } else {
      localStorage.removeItem('abkharido_active_referral');
    }
  }, [activeReferral]);

  // --- URL Referral Tracking ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refUser = params.get('ref');
    const affInfluencer = params.get('aff');
    const productIdParam = params.get('prod');

    if (refUser) {
      if (refUser === currentUser.username) {
        showToast('Self-referral links do not earn rewards.', 'warning');
      } else {
        incrementReferrerClicks();
        setActiveReferral({
          type: 'ref',
          referrerId: refUser,
          productId: productIdParam || null,
          timestamp: Date.now()
        });
        showToast(`Referral active: Shopping via link shared by ${refUser}!`, 'info');
      }
    } else if (affInfluencer) {
      if (currentUser.isInfluencer && currentUser.influencerId === affInfluencer) {
        showToast('Self-affiliate links do not earn commission.', 'warning');
      } else {
        incrementReferrerClicks();
        setActiveReferral({
          type: 'aff',
          referrerId: affInfluencer,
          productId: productIdParam || null,
          timestamp: Date.now()
        });
        showToast(`Affiliate link active: Support creator ${affInfluencer}!`, 'info');
      }
    }
  }, [currentUser.username]);

  // --- API Fetches ---
  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  };

  const fetchUser = async (username) => {
    try {
      const res = await fetch(`/api/users/${username}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data);
      }
    } catch (err) {
      console.error('Failed to sync user profile:', err);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('Failed to sync orders:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setPartnerStats(data);
      }
    } catch (err) {
      console.error('Failed to sync stats:', err);
    }
  };

  // --- Helper: Show Toast ---
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // --- Helper: Increment Referrer Clicks via API ---
  const incrementReferrerClicks = async () => {
    try {
      const res = await fetch('/api/stats/click', { method: 'POST' });
      if (res.ok) {
        fetchStats();
      }
    } catch (err) {
      console.error('Failed to update referred click:', err);
    }
  };

  // --- Cart Actions ---
  const addToCart = (product, qty = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        showToast(`${product.name.substring(0, 20)}... quantity updated!`);
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + qty } 
            : item
        );
      }
      showToast(`${product.name.substring(0, 20)}... added to cart!`);
      return [...prev, { product, quantity: qty }];
    });
  };

  const updateCartQty = (productId, qty) => {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => prev.map(item => 
      item.product.id === productId ? { ...item, quantity: qty } : item
    ));
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
    showToast('Item removed from cart.');
  };

  const clearCart = () => {
    setCart([]);
  };

  // --- Admin Panel API Actions ---
  const addProduct = async (newProduct) => {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      });
      if (!res.ok) {
        const err = await res.json();
        showToast(err.error || 'Failed to add product', 'error');
        return;
      }
      const data = await res.json();
      setProducts(prev => [...prev, data]);
      showToast(`Product "${data.name}" added successfully!`, 'success');
    } catch (err) {
      showToast('Failed to connect to backend server.', 'error');
    }
  };

  const removeProduct = async (productId) => {
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const err = await res.json();
        showToast(err.error || 'Failed to delete product', 'error');
        return;
      }
      setProducts(prev => prev.filter(p => p.id !== productId));
      removeFromCart(productId);
      showToast('Product removed successfully.', 'success');
    } catch (err) {
      showToast('Failed to connect to backend server.', 'error');
    }
  };

  // --- Creator & Wallet API Actions ---
  const registerAsInfluencer = async (influencerId, payoutDetails) => {
    try {
      const res = await fetch('/api/users/register-creator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: currentUser.username,
          influencerId,
          payoutDetails
        })
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data);
        showToast('Congratulations! You are now an approved AbKharido Creator.', 'success');
      } else {
        showToast('Failed to save creator data.', 'error');
      }
    } catch (err) {
      showToast('Backend server connection failure.', 'error');
    }
  };

  const requestPayout = async (amount, method) => {
    if (amount > currentUser.walletCash) {
      showToast('Insufficient withdrawable cash balance.', 'error');
      return false;
    }
    try {
      const res = await fetch('/api/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: currentUser.username,
          amount,
          method
        })
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        fetchStats(); // reload payouts transaction table
        showToast(`Payout request of ₹${amount} submitted successfully!`, 'success');
        return true;
      }
    } catch (err) {
      showToast('Failed to submit payout withdrawal request.', 'error');
    }
    return false;
  };

  // --- Place Order & Attributions API Checkout ---
  const placeOrder = async (shippingAddress, paymentMethod, useCoinsDiscount = false) => {
    if (cart.length === 0) {
      showToast('Cart is empty!', 'error');
      return null;
    }
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cart,
          username: currentUser.username,
          shippingAddress,
          paymentMethod,
          useCoinsDiscount,
          activeReferral
        })
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        clearCart();
        setActiveReferral(null);
        fetchOrders();
        fetchStats();
        return data.order;
      } else {
        showToast('Checkout transaction failed on server.', 'error');
      }
    } catch (err) {
      showToast('Failed to connect to checkout database.', 'error');
    }
    return null;
  };

  // --- Switch Profile & Reset Database API routes ---
  const switchUser = async (type) => {
    const targetUsername = type === 'buyer' ? 'amit_kumar' : 'ria_reviews';
    try {
      const res = await fetch(`/api/users/${targetUsername}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data);
        showToast(`Switched account to: ${data.fullName}`, 'info');
      }
    } catch (err) {
      showToast('Failed to switch profiles.', 'error');
    }
  };

  const resetDatabase = async () => {
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      if (res.ok) {
        showToast('Database files reset successfully.', 'info');
        fetchProducts();
        fetchUser(currentUser.username);
        fetchOrders();
        fetchStats();
        clearCart();
        setActiveReferral(null);
      }
    } catch (err) {
      showToast('Failed to communicate database reset.', 'error');
    }
  };

  return (
    <AppContext.Provider
      value={{
        products,
        currentUser,
        cart,
        orders,
        partnerStats,
        activeReferral,
        toast,
        showToast,
        addToCart,
        updateCartQty,
        removeFromCart,
        clearCart,
        registerAsInfluencer,
        requestPayout,
        placeOrder,
        switchUser,
        resetDatabase,
        addProduct,
        removeProduct
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
