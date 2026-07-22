import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  // --- Persistent & API States ---
  const [products, setProducts] = useState([]);
  
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('abkharido_user_session');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('abkharido_cart');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [orders, setOrders] = useState([]);
  
  const [partnerStats, setPartnerStats] = useState({
    clicks: 0,
    conversions: 0,
    history: [],
    payouts: []
  });

  const [activeReferral, setActiveReferral] = useState(() => {
    try {
      const saved = localStorage.getItem('abkharido_active_referral');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [toast, setToast] = useState(null);

  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem('abkharido_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('abkharido_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  // --- Fetch Data on Mount ---
  useEffect(() => {
    fetchProducts();
    if (currentUser) {
      fetchUser(currentUser.username);
      fetchOrders(currentUser.email);
    }
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
      if (currentUser && refUser === currentUser.username) {
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
      if (currentUser && currentUser.isInfluencer && currentUser.influencerId === affInfluencer) {
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
  }, []); // Only parse URL params once on mount, not on every user change

  // --- API Fetches ---
  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products?limit=100');
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || data);
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error('Failed to load products:', err);
    }
  };

  const fetchUser = async (username) => {
    try {
      const token = currentUser?.token || JSON.parse(localStorage.getItem('abkharido_user_session'))?.token;
      const res = await fetch(`/api/users/${username}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        // Preserve the token in the session since the profile endpoint might not return it
        data.token = token;
        setCurrentUser(data);
        localStorage.setItem('abkharido_user_session', JSON.stringify(data));
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error('Failed to sync user profile:', err);
    }
  };

  const fetchOrders = async (emailOrUsername) => {
    try {
      const user = currentUser;
      const username = user ? user.username : '';
      const emailVal = emailOrUsername || (user ? user.email : '');
      const token = user?.token;
      
      const res = await fetch(`/api/orders?username=${username}&email=${emailVal || ''}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error('Failed to sync orders:', err);
    }
  };

  const cancelOrder = async (orderId) => {
    try {
      const token = currentUser?.token;
      const res = await fetch(`/api/orders/${orderId}/cancel`, { 
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          data.user.token = token;
          setCurrentUser(data.user);
          localStorage.setItem('abkharido_user_session', JSON.stringify(data.user));
        }
        if (currentUser) {
          fetchOrders(currentUser.email);
        }
        showToast('Order cancelled successfully! Refund processed.', 'success');
        return true;
      } else {
        const errData = await res.json();
        showToast(errData.error || 'Failed to cancel order.', 'error');
        return false;
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error('Failed to cancel order:', err);
      showToast('Connection error. Please try again.', 'error');
      return false;
    }
  };

  const toggleWishlist = (productId) => {
    if (!currentUser) {
      showToast('Please sign in to add items to your wishlist.', 'warning');
      return;
    }
    setWishlist(prev => {
      const exists = prev.includes(productId);
      if (exists) {
        showToast('Removed from Wishlist!', 'info');
        return prev.filter(id => id !== productId);
      } else {
        showToast('Added to Wishlist!', 'success');
        return [...prev, productId];
      }
    });
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setPartnerStats(data);
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error('Failed to sync stats:', err);
    }
  };

  // --- Helper: Show Toast ---
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
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
      const stock = product.stock ?? 99;
      if (existing) {
        const newQty = existing.quantity + qty;
        if (newQty > stock) {
          showToast(`Only ${stock} units available in stock.`, 'warning');
          return prev;
        }
        showToast(`${product.name.substring(0, 20)}... quantity updated!`);
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: newQty }
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
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const stock = item.product.stock ?? 99;
        if (qty > stock) {
          showToast(`Only ${stock} units available in stock.`, 'warning');
          return item; // don't update
        }
        return { ...item, quantity: qty };
      }
      return item;
    }));
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
    showToast('Item removed from cart.');
  };

  const clearCart = () => {
    setCart([]);
  };

  // --- Logout Action ---
  const logout = () => {
    localStorage.removeItem('abkharido_user_session');
    setCurrentUser(null);
    setOrders([]);
    showToast('Logged out successfully.', 'info');
  };

  // --- Update User Profile Action ---
  const updateUserProfile = async (details) => {
    if (!currentUser) return false;
    try {
      const token = currentUser.token;
      const res = await fetch(`/api/users/${currentUser.username}/update`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(details)
      });
      if (res.ok) {
        const updatedUser = await res.json();
        // Preserve the JWT token since profile update endpoint doesn't return it
        updatedUser.token = token;
        setCurrentUser(updatedUser);
        localStorage.setItem('abkharido_user_session', JSON.stringify(updatedUser));
        return true;
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to update profile.', 'error');
      }
    } catch (e) {
      showToast('Network error updating profile.', 'error');
    }
    return false;
  };

  // --- Admin Panel API Actions ---
  const addProduct = async (newProduct) => {
    const adminToken = sessionStorage.getItem('abkharido_admin_token') || '';
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-token': adminToken
        },
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

  const editProduct = async (productId, updates) => {
    const adminToken = sessionStorage.getItem('abkharido_admin_token') || '';
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-token': adminToken
        },
        body: JSON.stringify(updates)
      });
      if (!res.ok) {
        const err = await res.json();
        showToast(err.error || 'Failed to update product', 'error');
        return false;
      }
      
      // Update local state for storefront
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, ...updates } : p));
      showToast('Product updated successfully', 'success');
      return true;
    } catch (err) {
      showToast('Network error while updating product', 'error');
      return false;
    }
  };

  const removeProduct = async (productId) => {
    const adminToken = sessionStorage.getItem('abkharido_admin_token') || '';
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'x-admin-token': adminToken
        }
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
    if (!currentUser) {
      showToast('Please log in to register as a creator.', 'error');
      return;
    }
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
        localStorage.setItem('abkharido_user_session', JSON.stringify(data));
        showToast('Congratulations! You are now an approved AbKharido Creator.', 'success');
      } else {
        showToast('Failed to save creator data.', 'error');
      }
    } catch (err) {
      showToast('Backend server connection failure.', 'error');
    }
  };

  const registerAsSeller = async (shopName, sellerAddress, payoutDetails) => {
    if (!currentUser) {
      showToast('Please log in to register as a seller.', 'error');
      return false;
    }
    try {
      const res = await fetch('/api/users/register-seller', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: currentUser.username,
          shopName,
          sellerAddress,
          payoutDetails
        })
      });
      if (!res.ok) {
        const err = await res.json();
        showToast(err.error || 'Registration failed.', 'error');
        return false;
      }
      const data = await res.json();
      setCurrentUser(data);
      localStorage.setItem('abkharido_user_session', JSON.stringify(data));
      showToast('Shop registered! Awaiting admin approval.', 'success');
      return true;
    } catch (err) {
      showToast('Failed to connect to backend server.', 'error');
      return false;
    }
  };

  const requestPayout = async (amount, method) => {
    if (!currentUser) {
      showToast('Please log in to request a payout.', 'error');
      return false;
    }
    if (amount > (currentUser.walletCash || 0)) {
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
        localStorage.setItem('abkharido_user_session', JSON.stringify(data.user));
        fetchStats();
        showToast(`Payout request of ₹${amount} submitted successfully!`, 'success');
        return true;
      }
    } catch (err) {
      showToast('Failed to submit payout withdrawal request.', 'error');
    }
    return false;
  };

  // --- Place Order & Attributions API Checkout ---
  const placeOrder = async (shippingAddress, paymentMethod, useCoinsDiscount = false, cfOrderId = null) => {
    if (!currentUser) {
      showToast('Please log in to place an order.', 'error');
      return null;
    }
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
          activeReferral,
          cfOrderId
        })
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        localStorage.setItem('abkharido_user_session', JSON.stringify(data.user));
        clearCart();
        setActiveReferral(null);
        fetchOrders(currentUser.email);
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

  // --- Cashfree Payment Status verification ---
  const verifyPayment = async (orderId) => {
    try {
      const token = currentUser?.token;
      const res = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ orderId })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setCurrentUser(data.user);
          localStorage.setItem('abkharido_user_session', JSON.stringify(data.user));
          fetchOrders(currentUser.email);
          fetchStats();
          return true;
        }
      }
    } catch (err) {
      console.error('Failed to verify payment status:', err);
    }
    return false;
  };

  const resetDatabase = async () => {
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      if (res.ok) {
        showToast('Database files reset successfully.', 'info');
        fetchProducts();
        if (currentUser) {
          fetchUser(currentUser.username);
          fetchOrders(currentUser.email);
        }
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
        logout,
        updateUserProfile,
        registerAsInfluencer,
        requestPayout,
        placeOrder,
        fetchOrders,
        verifyPayment,
        resetDatabase,
        addProduct,
        editProduct,
        removeProduct,
        cancelOrder,
        wishlist,
        toggleWishlist,
        registerAsSeller
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
