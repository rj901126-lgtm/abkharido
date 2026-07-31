"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';

const AppContext = createContext();

// eslint-disable-next-line
export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  // Start with empty array, fetch from enterprise backend API
  const [products, setProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [promotions, setPromotions] = useState(null);
  
  const { data: session, status } = useSession();
  const [dbUser, setDbUser] = useState(null);
  const currentUser = session ? { 
    ...session.user, 
    token: session.accessToken, 
    username: session.user.name, 
    ...(dbUser || {}) 
  } : null;

  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('abkharido_cart');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [orders, setOrders] = useState([]);
  const [hasMoreOrders, setHasMoreOrders] = useState(false);
  
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

  const [savedCards, setSavedCards] = useState([]);

  // --- Secure Storage Helper (Prevent DOS via QuotaExceededError) ---
  const safeSetItem = (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`Storage error: Could not save ${key}.`);
    }
  };

  useEffect(() => {
    safeSetItem('abkharido_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  // --- Fetch Data on Mount ---
  useEffect(() => {
    fetchProducts();
    fetchStats();
  }, []);

  // --- Fetch User Data when Session Loads ---
  useEffect(() => {
    if (session?.user?.name) {
      fetchUser(session.user.name);
      fetchOrders(session.user.email);
    }
  }, [session?.user?.name, session?.user?.email]);

  // --- Sync Temporary Cart details ---
  useEffect(() => {
    safeSetItem('abkharido_cart', JSON.stringify(cart));
    
    // Background sync to database if logged in
    if (currentUser?.token) {
      const syncTimeout = setTimeout(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/cart/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentUser.token}`
          },
          body: JSON.stringify({ cart })
        }).catch(err => console.error('Cart background sync failed', err));
      }, 1000);
      return () => clearTimeout(syncTimeout);
    }
  }, [cart, currentUser]);

  // --- Initial Cross-Device Cart Merge ---
  useEffect(() => {
    const initBackendCart = async () => {
      if (currentUser?.token) {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/cart`, {
            headers: { 'Authorization': `Bearer ${currentUser.token}` }
          });
          if (res.ok) {
            const backendCart = await res.json();
            const localCart = JSON.parse(localStorage.getItem('abkharido_cart')) || [];
            
            if (backendCart.length > 0 || localCart.length > 0) {
              const mergedMap = new Map();
              
              // Load backend cart first
              backendCart.forEach(item => {
                if (item.product && item.product.id) {
                  mergedMap.set(item.product.id, item);
                }
              });
              
              // Load local cart (overwrites qty if local has more)
              localCart.forEach(item => {
                if (item.product && item.product.id) {
                  const existing = mergedMap.get(item.product.id);
                  if (existing) {
                    mergedMap.set(item.product.id, { ...existing, quantity: Math.max(existing.quantity, item.quantity) });
                  } else {
                    mergedMap.set(item.product.id, item);
                  }
                }
              });
              
              const finalCart = Array.from(mergedMap.values());
              setCart(finalCart); // This will trigger the background sync useEffect automatically
            }
          }
        } catch (err) {
          console.error('Failed to sync backend cart:', err);
        }
      }
    };
    
    // Only run this ONCE when user session initializes
    initBackendCart();
    // eslint-disable-next-line
  }, [currentUser?.token]);

  useEffect(() => {
    if (activeReferral) {
      safeSetItem('abkharido_active_referral', JSON.stringify(activeReferral));
    } else {
      localStorage.removeItem('abkharido_active_referral');
    }
  }, [activeReferral]);

  // --- URL Referral Tracking ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let refUser = params.get('ref');
    const productIdParam = params.get('prod');

    // Security Fix: Prevent DOS attacks via massive link-sharing payloads
    if (refUser && refUser.length > 50) {
      refUser = null;
    }

    if (refUser) {
      // eslint-disable-next-line
      if (currentUser && refUser === (currentUser.username || currentUser.name)) {
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
    }
  }, []); // Only parse URL params once on mount, not on every user change

  // --- API Fetches ---
  const fetchProducts = async () => {
    // If SSR has already hydrated products, skip the client-side initial fetch
    if (products.length > 0) {
      setIsLoadingProducts(false);
      return;
    }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/products?limit=100`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || data);
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('Failed to load products:', err);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const fetchUser = async (username) => {
    try {
      const token = currentUser?.token || JSON.parse(localStorage.getItem('abkharido_user_session'))?.token;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/users/${username}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const userData = await res.json();
        setDbUser(userData);
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('Failed to sync user profile:', err);
    }
  };

  const fetchUserSavedCards = async () => {
    const token = currentUser?.token || JSON.parse(localStorage.getItem('abkharido_user_session'))?.token;
    if (!token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/payment/saved-cards`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSavedCards(data);
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('Failed to fetch saved cards:', err);
    }
  };

  const removeSavedCard = async (instrumentId) => {
    const token = currentUser?.token || JSON.parse(localStorage.getItem('abkharido_user_session'))?.token;
    if (!token) return false;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/payment/saved-cards/${instrumentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSavedCards(prev => prev.filter(c => c.instrument_id !== instrumentId));
        return true;
      }
      return false;
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('Failed to remove saved card:', err);
      return false;
    }
  };

  const fetchOrders = async (emailOrUsername, page = 1, search = '', status = 'all', time = 'all') => {
    try {
      const user = currentUser;
      const username = user ? (user.username || user.name) : '';
      const emailVal = emailOrUsername || (user ? user.email : '');
      const token = user?.token;
      
      const queryParams = new URLSearchParams({
        username,
        email: emailVal || '',
        page,
        limit: 5,
        search,
        status,
        time
      });
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/orders/myorders?${queryParams.toString()}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        const fetchedOrders = data.orders ? data.orders : data;
        
        if (page === 1) {
          setOrders(fetchedOrders);
        } else {
          setOrders(prev => [...prev, ...fetchedOrders]);
        }
        
        if (data.page && data.pages) {
          setHasMoreOrders(data.page < data.pages);
        } else {
          setHasMoreOrders(false);
        }
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('Failed to sync orders:', err);
    }
  };

  const cancelOrder = async (orderId) => {
    try {
      const token = currentUser?.token;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/orders/${orderId}/user-cancel`, { 
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        // Successfully cancelled
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
      if (process.env.NODE_ENV !== 'production') console.error('Failed to cancel order:', err);
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/stats`);
      if (res.ok) {
        const data = await res.json();
        setPartnerStats({
          clicks: data.clicks || 0,
          conversions: data.conversions || 0,
          history: data.history || [],
          payouts: data.payouts || []
        });
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('Failed to sync stats:', err);
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/stats/click`, { method: 'POST' });
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
  const logout = async () => {
    localStorage.removeItem('abkharido_user_session');
    setOrders([]);
    await signOut({ redirect: false });
    showToast('Logged out successfully.', 'info');
  };

  // --- Update User Profile Action ---
  const updateUserProfile = async (details) => {
    if (!currentUser) return false;
    try {
      const token = currentUser.token;
      const targetUsername = currentUser.username || currentUser.name;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/users/${targetUsername}/update`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(details)
      });
      if (res.ok) {
        fetchUser(targetUsername);
        showToast('Profile updated successfully!', 'success');
        return true;
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to update profile.', 'error');
      }
    // eslint-disable-next-line
    } catch (e) {
      showToast('Network error updating profile.', 'error');
    }
    return false;
  };

  // --- Admin Panel API Actions ---
  const addProduct = async (newProduct) => {
    const adminToken = sessionStorage.getItem('abkharido_admin_token') || '';
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/products`, {
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
    // eslint-disable-next-line
    } catch (err) {
      showToast('Failed to connect to backend server.', 'error');
    }
  };

  const editProduct = async (productId, updates) => {
    const adminToken = sessionStorage.getItem('abkharido_admin_token') || '';
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/products/${productId}`, {
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
    // eslint-disable-next-line
    } catch (err) {
      showToast('Network error while updating product', 'error');
      return false;
    }
  };

  const removeProduct = async (productId) => {
    const adminToken = sessionStorage.getItem('abkharido_admin_token') || '';
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/products/${productId}`, {
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
    // eslint-disable-next-line
    } catch (err) {
      showToast('Failed to connect to backend server.', 'error');
    }
  };

  // --- Wallet API Actions ---

  const registerAsSeller = async (shopName, sellerAddress, payoutDetails) => {
    if (!currentUser) {
      showToast('Please log in to register as a seller.', 'error');
      return false;
    }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/users/register-seller`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: currentUser.username || currentUser.name,
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
      setDbUser(data);
      safeSetItem('abkharido_user_session', JSON.stringify(data));
      showToast('Shop registered! Awaiting admin approval.', 'success');
      return true;
    // eslint-disable-next-line
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/payouts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: currentUser.username || currentUser.name,
          amount,
          method
        })
      });
      if (res.ok) {
        const data = await res.json();
        setDbUser(data.user);
        safeSetItem('abkharido_user_session', JSON.stringify(data.user));
        fetchStats();
        
        const targetUsername = currentUser.username || currentUser.name;
        if (targetUsername) {
          fetchUser(targetUsername);
        }
        
        showToast(`Payout request of ₹${amount} submitted successfully!`, 'success');
        return true;
      }
    // eslint-disable-next-line
    } catch (err) {
      showToast('Failed to submit payout withdrawal request.', 'error');
    }
    return false;
  };

  // --- Place Order & Attributions API Checkout ---
  const placeOrder = async (shippingAddress, paymentMethod, useCoinsDiscount = false, cfOrderId = null, couponCode = null) => {
    if (!currentUser) {
      showToast('Please log in to place an order.', 'error');
      return null;
    }
    if (cart.length === 0) {
      showToast('Cart is empty!', 'error');
      return null;
    }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/orders`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(currentUser?.token ? { 'Authorization': `Bearer ${currentUser.token}` } : {})
        },
        body: JSON.stringify({
          cart,
          username: currentUser.username || currentUser.name,
          shippingAddress,
          paymentMethod,
          useCoinsDiscount,
          activeReferral,
          cfOrderId,
          couponCode
        })
      });
      if (res.ok) {
        const data = await res.json();
        fetchUser(currentUser.username || currentUser.name);
        clearCart();
        setActiveReferral(null);
        fetchOrders(currentUser.email);
        fetchStats();
        return data;
      } else {
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData.message || errData.error || `Server error (${res.status})`;
        console.error('Order API error:', res.status, errData);
        showToast(`Order failed: ${errMsg}`, 'error');
      }
    // eslint-disable-next-line
    } catch (err) {
      showToast('Failed to connect to checkout database.', 'error');
    }
    return null;
  };

  // --- Cashfree Payment Status verification ---
  const verifyPayment = async (orderId) => {
    try {
      const token = currentUser?.token;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/payment/verify`, {
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
          setDbUser(data.user);
          safeSetItem('abkharido_user_session', JSON.stringify(data.user));
          fetchOrders(currentUser.email);
          fetchStats();
          
          const targetUsername = currentUser.username || currentUser.name;
          if (targetUsername) {
            fetchUser(targetUsername);
          }
          
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/reset`, { method: 'POST' });
      if (res.ok) {
        showToast('Database files reset successfully.', 'info');
        fetchProducts();
        if (currentUser) {
          const targetUsername = currentUser.username || currentUser.name;
          if (targetUsername) {
            fetchUser(targetUsername);
          }
          fetchOrders(currentUser.email);
        }
        fetchStats();
        clearCart();
        setActiveReferral(null);
      }
    // eslint-disable-next-line
    } catch (err) {
      showToast('Failed to communicate database reset.', 'error');
    }
  };

  return (
    <AppContext.Provider
      value={{
        products,
        setProducts,
        isLoadingProducts,
        promotions,
        currentUser,
        cart,
        orders,
        hasMoreOrders,
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
        registerAsSeller,
        savedCards,
        fetchUserSavedCards,
        removeSavedCard,
        isAuthLoading: status === 'loading'
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
