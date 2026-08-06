"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';

const AppContext = createContext();

// eslint-disable-next-line
export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  // Start with empty array, fetch from enterprise backend API
  const [products, setProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const loadPromotionsFromStorage = () => {
    try {
      const saved = localStorage.getItem('abkharido_promotions_v2');
      const savedBanners = localStorage.getItem('abkharido_banners');
      let parsedPromo = saved ? JSON.parse(saved) : {};
      if (savedBanners) {
        try { parsedPromo.banners = JSON.parse(savedBanners); } catch(e){}
      } else if (parsedPromo.heroBanners && Array.isArray(parsedPromo.heroBanners)) {
        parsedPromo.banners = parsedPromo.heroBanners;
      }
      return Object.keys(parsedPromo).length > 0 ? parsedPromo : null;
    } catch { return null; }
  };

  const [promotions, setPromotions] = useState(() => {
    if (typeof window !== 'undefined') return loadPromotionsFromStorage();
    return null;
  });

  useEffect(() => {
    const handlePromoSync = () => {
      const fresh = loadPromotionsFromStorage();
      if (fresh) setPromotions(fresh);
    };
    handlePromoSync();
    window.addEventListener('abkharido_promotions_updated', handlePromoSync);
    window.addEventListener('storage', handlePromoSync);
    return () => {
      window.removeEventListener('abkharido_promotions_updated', handlePromoSync);
      window.removeEventListener('storage', handlePromoSync);
    };
  }, []);
  
  const { data: session, status } = useSession();
  const [dbUser, setDbUser] = useState(() => {
    try {
      const cached = localStorage.getItem('abkharido_cached_profile');
      if (cached) {
        const parsed = JSON.parse(cached);
        // Use cache if it's less than 10 minutes old
        if (parsed._cachedAt && Date.now() - parsed._cachedAt < 10 * 60 * 1000) {
          return parsed;
        }
      }
    } catch (e) { /* ignore */ }
    return null;
  });
  const [localSession, setLocalSession] = useState(() => {
    try {
      const saved = localStorage.getItem('abkharido_user_session');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const currentUser = session ? { 
    ...session.user, 
    _id: session.user?.id || session.user?._id || session?.id || 'vip_user',
    token: session.accessToken, 
    username: session.user.name,
    phone: session.user.phone || session.user.name,  // phone from JWT session
    email: session.user.email || undefined,  // null-safe: don't show Google email if OTP login
    ...(dbUser || {}) 
  } : (localSession ? { _id: localSession._id || localSession.id || 'vip_user', ...localSession, ...(dbUser || {}) } : null);

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

  // --- Sync Temporary Wishlist details ---
  useEffect(() => {
    if (!currentUser?.token) {
      safeSetItem('abkharido_wishlist', JSON.stringify(wishlist));
    }
  }, [wishlist, currentUser?.token]);

  // --- Fetch Data on Mount ---
  useEffect(() => {
    fetchProducts();
    fetchStats();
  }, []);

  // --- Fetch User Data when Session Loads ---
  useEffect(() => {
    if (session?.user?.name) {
      // Try both username, phone, and ID to find the right user record
      const phone = session.user.phone || '';
      const id = session.user.id || session.user._id || '';
      fetchUser(session.user.name, phone, id);
      fetchOrders(session.user.email || phone);
    }
  }, [session?.user?.name, session?.user?.phone, session?.user?.id]);

  const initializedForUser = useRef(null);
  const wishlistInitializedForUser = useRef(null);

  // --- Sync Temporary Cart details ---
  useEffect(() => {
    if (!currentUser?.token) {
      safeSetItem('abkharido_cart', JSON.stringify(cart));
    }
  }, [cart, currentUser?.token]);

  // --- Initial Cross-Device Cart Merge ---
  useEffect(() => {
    const initBackendCart = async () => {
      if (currentUser?.token) {
        try {
          // If user had a local (guest) cart before logging in, merge it into their DB cart first
          const localCart = cart;
          if (localCart && localCart.length > 0) {
            await fetch(`/api/cart/sync`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUser.token}`
              },
              body: JSON.stringify({ cart: localCart, merge: true })
            }).then(() => {
              localStorage.removeItem('abkharido_cart');
            }).catch(err => console.error('Guest cart sync failed', err));
          }

          // Then fetch the final merged cart from DB as the source of truth
          const res = await fetch(`/api/cart`, {
            headers: { 'Authorization': `Bearer ${currentUser.token}` },
            cache: 'no-store'
          });
          if (res.status === 401) {
            logout();
            showToast('Session expired. Please log in again.', 'error');
            return;
          }
          if (res.ok) {
            const backendCart = await res.json();
            setCart(backendCart);
            safeSetItem('abkharido_cart', JSON.stringify(backendCart));
          }
        } catch (err) {
          console.error('Failed to fetch backend cart:', err);
        } finally {
          initializedForUser.current = currentUser.token;
        }
      } else {
        initializedForUser.current = null;
      }
    };
    
    // Only run this ONCE when user session initializes
    initBackendCart();
    // eslint-disable-next-line
  }, [currentUser?.token]);

  // --- Initial Cross-Device Wishlist Fetch ---
  useEffect(() => {
    const initBackendWishlist = async () => {
      if (currentUser?.token) {
        if (wishlistInitializedForUser.current === currentUser.token) return;
        try {
          // If user had a local (guest) wishlist before logging in, merge it into their DB wishlist first
          const localWishlist = wishlist;
          if (localWishlist && localWishlist.length > 0) {
            await fetch(`/api/wishlist/sync`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUser.token}`
              },
              body: JSON.stringify({ wishlist: localWishlist, merge: true })
            }).then(() => {
              localStorage.removeItem('abkharido_wishlist');
            }).catch(err => console.error('Guest wishlist sync failed', err));
          }

          const res = await fetch(`/api/wishlist`, {
            headers: { 'Authorization': `Bearer ${currentUser.token}` },
            cache: 'no-store'
          });
          if (res.status === 401) {
            logout();
            showToast('Session expired. Please log in again.', 'error');
            return;
          }
          if (res.ok) {
            const backendWishlist = await res.json();
            setWishlist(backendWishlist);
            safeSetItem('abkharido_wishlist', JSON.stringify(backendWishlist));
          }
        } catch (err) {
          console.error('Failed to fetch backend wishlist:', err);
        } finally {
          wishlistInitializedForUser.current = currentUser.token;
        }
      } else {
        wishlistInitializedForUser.current = null;
      }
    };
    
    initBackendWishlist();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only parse URL params once on mount, not on every user change

  // --- API Fetches ---
  const fetchProducts = async () => {
    // If SSR has already hydrated products, skip the client-side initial fetch
    if (products.length > 0) {
      setIsLoadingProducts(false);
      return;
    }
    try {
      const res = await fetch(`/api/products?limit=100`);
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

  const fetchUser = async (username, phone = '', id = '') => {
    try {
      const token = currentUser?.token || JSON.parse(localStorage.getItem('abkharido_user_session') || '{}')?.token;
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      let res;
      // Try reliable lookup by MongoDB ID first if available
      if (id && id !== 'vip_user') {
        res = await fetch(`/api/users/${id}`, { headers, cache: 'no-store' });
      }
      
      // Fallback to username
      if (!res || !res.ok) {
        res = await fetch(`/api/users/${username}`, { headers, cache: 'no-store' });
      }
      
      // If username lookup fails (404) and we have a phone, try phone-based lookup
      if ((!res || !res.ok) && phone && phone !== username) {
        res = await fetch(`/api/users/${phone}`, { headers, cache: 'no-store' });
      }

      if (res && res.ok) {
        const userData = await res.json();
        if (userData && !userData.error) {
          setDbUser(userData);
          // Cache in localStorage so profile loads instantly on next visit
          try {
            localStorage.setItem('abkharido_cached_profile', JSON.stringify({
              ...userData,
              _cachedAt: Date.now()
            }));
          } catch (e) { /* storage full */ }
        }
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('Failed to sync user profile:', err);
    }
  };

  const fetchUserSavedCards = async () => {
    const token = currentUser?.token || JSON.parse(localStorage.getItem('abkharido_user_session'))?.token;
    if (!token) return;
    try {
      const res = await fetch(`/api/payment/saved-cards`, {
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
      const res = await fetch(`/api/payment/saved-cards/${instrumentId}`, {
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
      
      const res = await fetch(`/api/orders/myorders?${queryParams.toString()}`, {
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
      const res = await fetch(`/api/orders/${orderId}/user-cancel`, { 
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
    
    dispatchDeltaSync('wishlist', { action: 'toggle', productId }, setWishlist);
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/stats`);
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
      const res = await fetch(`/api/stats/click`, { method: 'POST' });
      if (res.ok) {
        fetchStats();
      }
    } catch (err) {
      console.error('Failed to update referred click:', err);
    }
  };

  // --- Delta Sync Helper ---
  const dispatchDeltaSync = async (endpoint, payload, stateSetter) => {
    if (!currentUser?.token) return;
    try {
      const res = await fetch(`/api/${endpoint}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentUser.token}` },
        body: JSON.stringify(payload)
      });
      if (res.status === 401) {
        logout();
        showToast('Session expired. Please log in again.', 'error');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        if (data[endpoint]) stateSetter(data[endpoint]); // Updates with merged DB state
      }
    } catch (err) {
      console.error(`${endpoint} delta sync failed`, err);
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
    
    dispatchDeltaSync('cart', { action: 'add', item: { product: product._id || product.id, quantity: qty } }, setCart);
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
    
    dispatchDeltaSync('cart', { action: 'update', item: { product: productId, quantity: qty } }, setCart);
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
    showToast('Item removed from cart.');
    dispatchDeltaSync('cart', { action: 'remove', productId }, setCart);
  };

  const clearCart = () => {
    setCart([]);
    dispatchDeltaSync('cart', { action: 'clear' }, setCart);
  };

  // --- Logout Action ---
  const logout = async () => {
    initializedForUser.current = null;
    wishlistInitializedForUser.current = null;
    localStorage.removeItem('abkharido_user_session');
    localStorage.removeItem('abkharido_cart');
    localStorage.removeItem('abkharido_wishlist');
    setLocalSession(null);
    setOrders([]);
    setCart([]);
    setWishlist([]);
    await signOut({ redirect: false });
    showToast('Logged out successfully.', 'info');
  };

  // --- Update User Profile Action ---
  const updateUserProfile = async (details) => {
    if (!currentUser) return false;
    try {
      const token = currentUser.token;
      // ALWAYS use _id to update if available, otherwise fallback
      const targetIdentifier = (currentUser._id && currentUser._id !== 'vip_user') 
        ? currentUser._id 
        : (currentUser.username || currentUser.name);
        
      const res = await fetch(`/api/users/${targetIdentifier}/update`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(details)
      });
      if (res.ok) {
        fetchUser(currentUser.username || currentUser.name, currentUser.phone, currentUser._id);
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
      const res = await fetch(`/api/products`, {
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
    // eslint-disable-next-line
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
      const res = await fetch(`/api/users/register-seller`, {
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
      const res = await fetch(`/api/payouts`, {
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
      const res = await fetch(`/api/orders`, {
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
        // Handle expired/invalid JWT — force re-login
        if (res.status === 401) {
          showToast('Your session has expired. Please log in again.', 'error');
          logout();
          return null;
        }
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
      const res = await fetch(`/api/payment/verify`, {
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
      const res = await fetch(`/api/reset`, { method: 'POST' });
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
