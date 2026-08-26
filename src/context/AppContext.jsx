"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';

import { lookupPincode, lookupPincodeAsync } from '../utils/pincodeData';

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

  const [promotions, setPromotions] = useState(null);
  const { data: session, status } = useSession();
  const [dbUser, setDbUser] = useState(null);
  const [localSession, setLocalSession] = useState(null);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [hasMoreOrders, setHasMoreOrders] = useState(false);
  const [partnerStats, setPartnerStats] = useState({
    clicks: 0,
    conversions: 0,
    history: [],
    payouts: []
  });
  const [activeReferral, setActiveReferral] = useState(null);
  const [toast, setToast] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [savedCards, setSavedCards] = useState([]);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Default initial location: Palghar / Maharashtra (or user's saved location)
  const [deliveryLocation, setDeliveryLocation] = useState({
    pincode: '401404',
    city: 'Palghar',
    state: 'Maharashtra',
    slaDays: 2,
    deliveryDateStr: '2-3 Days',
    isExpress: true,
    isCodAvailable: true,
    displayText: 'Palghar 401404'
  });

  // Hydrate client-only storage states after initial SSR mount
  useEffect(() => {
    try {
      const freshPromo = loadPromotionsFromStorage();
      if (freshPromo) setPromotions(freshPromo);

      const savedUserSession = localStorage.getItem('abkharido_user_session');
      if (savedUserSession) setLocalSession(JSON.parse(savedUserSession));

      const cachedProfile = localStorage.getItem('abkharido_cached_profile');
      if (cachedProfile) {
        const parsed = JSON.parse(cachedProfile);
        if (parsed._cachedAt && Date.now() - parsed._cachedAt < 10 * 60 * 1000) {
          setDbUser(parsed);
        }
      }

      const isLoggedIn = !!savedUserSession;
      const savedCart = localStorage.getItem(isLoggedIn ? 'abkharido_cached_cart' : 'abkharido_cart');
      if (savedCart) setCart(JSON.parse(savedCart));

      const savedWishlist = localStorage.getItem(isLoggedIn ? 'abkharido_cached_wishlist' : 'abkharido_wishlist');
      if (savedWishlist) setWishlist(JSON.parse(savedWishlist));

      const savedReferral = localStorage.getItem('abkharido_active_referral');
      if (savedReferral) setActiveReferral(JSON.parse(savedReferral));

      const savedPin = localStorage.getItem('abkharido_delivery_pincode');
      if (savedPin) {
        try {
          const parsedPin = JSON.parse(savedPin);
          if (parsedPin && parsedPin.pincode) setDeliveryLocation(parsedPin);
        } catch(e) {}
      } else {
        // Auto-detect user's real location on first visit
        detectUserLocation(false);
      }
    } catch (err) {
      console.warn('[AppContext] Hydration from localStorage encountered non-fatal error:', err);
    }
  }, []);

  // Auto-detect user location via GPS or IP (Palghar / real Indian city)
  const detectUserLocation = async (manualTrigger = false) => {
    setIsDetectingLocation(true);
    try {
      // 1. If user has a default address in profile, use that
      if (currentUser?.addresses && currentUser.addresses.length > 0) {
        const def = currentUser.addresses.find(a => a?.isDefault) || currentUser.addresses[0];
        if (def && def.pincode) {
          const info = await lookupPincodeAsync(def.pincode);
          if (info) {
            setDeliveryLocation(info);
            safeSetItem('abkharido_delivery_pincode', JSON.stringify(info));
            if (manualTrigger) showToast(`📍 Delivery location set: ${info.displayText}`, 'success');
            setIsDetectingLocation(false);
            return info;
          }
        }
      }

      // 2. Try browser GPS Geolocation if available
      if (typeof window !== 'undefined' && navigator.geolocation) {
        try {
          const pos = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000, enableHighAccuracy: true });
          });
          const { latitude, longitude } = pos.coords;
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&countrycodes=in`);
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            const postal = geoData.address?.postcode || '';
            const detectedCity = geoData.address?.city || geoData.address?.state_district || geoData.address?.county || geoData.address?.town || 'Palghar';
            const detectedState = geoData.address?.state || 'Maharashtra';
            
            if (postal && postal.length === 6) {
              const info = await lookupPincodeAsync(postal);
              const finalInfo = info || {
                pincode: postal,
                city: detectedCity,
                state: detectedState,
                slaDays: 2,
                deliveryDateStr: '2-3 Days',
                isExpress: true,
                isCodAvailable: true,
                displayText: `${detectedCity} ${postal}`
              };
              setDeliveryLocation(finalInfo);
              safeSetItem('abkharido_delivery_pincode', JSON.stringify(finalInfo));
              if (manualTrigger) showToast(`📍 Location auto-detected: ${finalInfo.displayText}`, 'success');
              setIsDetectingLocation(false);
              return finalInfo;
            }
          }
        } catch (geoErr) {
          // GPS denied or timed out — fallback to fast IP geolocation
        }
      }

      // 3. Fast IP Location Auto-Detection
      const ipRes = await fetch('https://ipapi.co/json/').catch(() => null);
      if (ipRes && ipRes.ok) {
        const ipData = await ipRes.json();
        const postal = ipData.postal || '';
        const city = ipData.city || ipData.region || 'Palghar';
        const state = ipData.region || 'Maharashtra';
        
        if (postal && postal.length === 6) {
          const info = await lookupPincodeAsync(postal);
          const finalInfo = info || {
            pincode: postal,
            city,
            state,
            slaDays: 2,
            deliveryDateStr: '2-3 Days',
            isExpress: true,
            isCodAvailable: true,
            displayText: `${city} ${postal}`
          };
          setDeliveryLocation(finalInfo);
          safeSetItem('abkharido_delivery_pincode', JSON.stringify(finalInfo));
          if (manualTrigger) showToast(`📍 Location auto-detected: ${finalInfo.displayText}`, 'success');
          setIsDetectingLocation(false);
          return finalInfo;
        } else if (city) {
          const fallbackPin = city.toLowerCase().includes('palghar') ? '401404' : (city.toLowerCase().includes('mumbai') || city.toLowerCase().includes('thane') ? '400001' : '401404');
          const info = lookupPincode(fallbackPin);
          const finalInfo = {
            ...info,
            city: city || 'Palghar',
            displayText: `${city || 'Palghar'} ${fallbackPin}`
          };
          setDeliveryLocation(finalInfo);
          safeSetItem('abkharido_delivery_pincode', JSON.stringify(finalInfo));
          if (manualTrigger) showToast(`📍 Location set: ${finalInfo.displayText}`, 'success');
          setIsDetectingLocation(false);
          return finalInfo;
        }
      }
    } catch (e) {
      console.warn('[AppContext] Location detection error:', e);
    } finally {
      setIsDetectingLocation(false);
    }
    return null;
  };

  const currentUser = React.useMemo(() => {
    if (session && session.user) {
      const sessPhone = session.user.phone || (session.user.name && session.user.name.match(/\d{10}/) ? session.user.name.match(/\d{10}/)[0] : session.user.name);
      const sessId = session.user.id || session.user._id || session.id;

      // Only merge dbUser if it belongs to THIS exact user session
      const isMatchingDbUser = dbUser && (
        (dbUser._id && sessId && String(dbUser._id) === String(sessId)) ||
        (dbUser.phone && sessPhone && String(dbUser.phone).replace(/\D/g, '').slice(-10) === String(sessPhone).replace(/\D/g, '').slice(-10)) ||
        (dbUser.username && session.user.name && dbUser.username === session.user.name)
      );

      const safeDb = isMatchingDbUser ? dbUser : {};

      return {
        ...session.user,
        ...safeDb,
        _id: sessId || safeDb._id || 'user_' + Date.now(),
        token: session.accessToken || safeDb.token,
        username: session.user.name || safeDb.username || sessPhone,
        phone: sessPhone || safeDb.phone || '',
        email: session.user.email || safeDb.email || undefined,
      };
    }

    if (localSession) {
      const locPhone = localSession.phone || (localSession.username && localSession.username.match(/\d{10}/) ? localSession.username.match(/\d{10}/)[0] : localSession.username);
      const locId = localSession._id || localSession.id;

      const isMatchingDbUser = dbUser && (
        (dbUser._id && locId && String(dbUser._id) === String(locId)) ||
        (dbUser.phone && locPhone && String(dbUser.phone).replace(/\D/g, '').slice(-10) === String(locPhone).replace(/\D/g, '').slice(-10)) ||
        (dbUser.username && localSession.username && dbUser.username === localSession.username)
      );

      const safeDb = isMatchingDbUser ? dbUser : {};

      return {
        _id: locId || safeDb._id || 'user_' + Date.now(),
        ...localSession,
        ...safeDb,
        phone: locPhone || safeDb.phone || '',
      };
    }

    return null;
  }, [session, localSession, dbUser]);


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
    } else {
      safeSetItem('abkharido_cached_wishlist', JSON.stringify(wishlist));
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
  const lastVisibilitySyncAt = useRef(0);

  // --- Cross-Device Visibility Sync ---
  // When user switches back to this tab/app (from another device session or tab),
  // silently re-fetch cart and wishlist from backend without any page reload.
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState !== 'visible') return;

      const token = currentUser?.token;
      if (!token) return;

      // Throttle: don't sync more than once every 30 seconds
      const now = Date.now();
      if (now - lastVisibilitySyncAt.current < 30_000) return;
      lastVisibilitySyncAt.current = now;

      try {
        // Silently fetch fresh cart from backend
        const cartRes = await fetch('/api/cart', {
          headers: { 'Authorization': `Bearer ${token}` },
          cache: 'no-store'
        });
        if (cartRes.ok) {
          const freshCart = await cartRes.json();
          setCart(freshCart);
          safeSetItem('abkharido_cached_cart', JSON.stringify(freshCart));
        }
      } catch (e) { /* silent fail — user doesn't see anything */ }

      try {
        // Silently fetch fresh wishlist from backend
        const wlRes = await fetch('/api/wishlist', {
          headers: { 'Authorization': `Bearer ${token}` },
          cache: 'no-store'
        });
        if (wlRes.ok) {
          const freshWishlist = await wlRes.json();
          setWishlist(freshWishlist);
          safeSetItem('abkharido_cached_wishlist', JSON.stringify(freshWishlist));
        }
      } catch (e) { /* silent fail */ }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    // eslint-disable-next-line
  }, [currentUser?.token]);

  // --- Sync Temporary Cart details ---
  useEffect(() => {
    if (!currentUser?.token) {
      safeSetItem('abkharido_cart', JSON.stringify(cart));
    } else {
      safeSetItem('abkharido_cached_cart', JSON.stringify(cart));
    }
  }, [cart, currentUser?.token]);

  // --- Initial Cross-Device Cart Merge ---
  useEffect(() => {
    const initBackendCart = async () => {
      const token = currentUser?.token || JSON.parse(localStorage.getItem('abkharido_user_session') || '{}')?.token;
      if (token) {
        try {
          // If user had a local (guest) cart before logging in, merge it into their DB cart first
          let guestCart = null;
          try {
            const saved = localStorage.getItem('abkharido_cart');
            if (saved) guestCart = JSON.parse(saved);
          } catch(e) {}
          
          if (guestCart && guestCart.length > 0) {
            await fetch(`/api/cart/sync`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ cart: guestCart, merge: true })
            }).then(() => {
              localStorage.removeItem('abkharido_cart');
            }).catch(err => console.error('Guest cart sync failed', err));
          }

          // Then fetch the final merged cart from DB as the source of truth
          const res = await fetch(`/api/cart`, {
            headers: { 'Authorization': `Bearer ${token}` },

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
            safeSetItem('abkharido_cached_cart', JSON.stringify(backendCart));
          }
        } catch (err) {
          console.error('Failed to fetch backend cart:', err);
        } finally {
          initializedForUser.current = token;
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
      const token = currentUser?.token || JSON.parse(localStorage.getItem('abkharido_user_session') || '{}')?.token;
      if (token) {
        if (wishlistInitializedForUser.current === token) return;
        try {
          // If user had a local (guest) wishlist before logging in, merge it into their DB wishlist first
          let guestWishlist = null;
          try {
            const saved = localStorage.getItem('abkharido_wishlist');
            if (saved) guestWishlist = JSON.parse(saved);
          } catch(e) {}
          
          if (guestWishlist && guestWishlist.length > 0) {
            await fetch(`/api/wishlist/sync`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ wishlist: guestWishlist, merge: true })
            }).then(() => {
              localStorage.removeItem('abkharido_wishlist');
            }).catch(err => console.error('Guest wishlist sync failed', err));
          }

          const res = await fetch(`/api/wishlist`, {
            headers: { 'Authorization': `Bearer ${token}` },
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
            safeSetItem('abkharido_cached_wishlist', JSON.stringify(backendWishlist));
          }
        } catch (err) {
          console.error('Failed to fetch backend wishlist:', err);
        } finally {
          wishlistInitializedForUser.current = token;
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
      // Prefer /api/users/me when authenticated
      if (token) {
        res = await fetch(`/api/users/me`, { headers, cache: 'no-store' });
      }
      
      // Fallback to ID or username lookup
      if ((!res || !res.ok) && id && id !== 'vip_user') {
        res = await fetch(`/api/users/${id}`, { headers, cache: 'no-store' });
      }
      
      if ((!res || !res.ok) && username) {
        res = await fetch(`/api/users/${username}`, { headers, cache: 'no-store' });
      }
      
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
    const token = currentUser?.token || JSON.parse(localStorage.getItem('abkharido_user_session') || '{}')?.token;
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
    const token = currentUser?.token || JSON.parse(localStorage.getItem('abkharido_user_session') || '{}')?.token;
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
      const username = user ? (user.username || user.name || user.phone) : (emailOrUsername || '');
      const emailVal = user?.email || (emailOrUsername?.includes('@') ? emailOrUsername : '');
      const phoneVal = user?.phone || (emailOrUsername && !emailOrUsername.includes('@') ? emailOrUsername : '');
      const token = user?.token || JSON.parse(localStorage.getItem('abkharido_user_session') || '{}')?.token;
      
      const queryParams = new URLSearchParams({
        username: username || '',
        email: emailVal || '',
        phone: phoneVal || '',
        page,
        limit: 50,
        search,
        status,
        time
      });
      
      const res = await fetch(`/api/orders/myorders?${queryParams.toString()}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        const fetchedOrders = Array.isArray(data.orders) ? data.orders : (Array.isArray(data) ? data : []);
        
        if (page === 1) {
          if (fetchedOrders.length > 0) {
            setOrders(fetchedOrders);
            safeSetItem('abkharido_cached_orders', JSON.stringify(fetchedOrders));
          } else {
            const cached = localStorage.getItem('abkharido_cached_orders');
            if (cached) {
              try { setOrders(JSON.parse(cached)); } catch(e) { setOrders([]); }
            } else {
              setOrders([]);
            }
          }
        } else {
          setOrders(prev => [...prev, ...fetchedOrders]);
        }
        
        if (data.page && data.pages) {
          setHasMoreOrders(data.page < data.pages);
        } else {
          setHasMoreOrders(false);
        }
      } else {
        const cached = localStorage.getItem('abkharido_cached_orders');
        if (cached && page === 1) {
          try { setOrders(JSON.parse(cached)); } catch(e) {}
        }
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('Failed to sync orders:', err);
      const cached = localStorage.getItem('abkharido_cached_orders');
      if (cached && page === 1) {
        try { setOrders(JSON.parse(cached)); } catch(e) {}
      }
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
    setWishlist(prev => {
      // Handle both slug-based IDs and MongoDB ObjectIds for comparison
      const exists = prev.some(id => {
        const idStr = (id?.id || id?.toString() || id);
        return idStr === productId || idStr === productId?.toString();
      });
      if (exists) {
        showToast('Removed from Wishlist!', 'info');
        const updated = prev.filter(id => {
          const idStr = (id?.id || id?.toString() || id);
          return idStr !== productId && idStr !== productId?.toString();
        });
        if (!currentUser) {
          safeSetItem('abkharido_wishlist', JSON.stringify(updated));
        }
        return updated;
      } else {
        showToast('Added to Wishlist!', 'success');
        const updated = [...prev, productId];
        if (!currentUser) {
          safeSetItem('abkharido_wishlist', JSON.stringify(updated));
        }
        return updated;
      }
    });
    
    // If user is logged in, sync to backend delta
    if (currentUser) {
      dispatchDeltaSync('wishlist', { action: 'toggle', productId }, null);
    }
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
        console.warn('Background sync returned 401. Session might be expiring.');
        return;
      }
      if (res.ok && stateSetter && payload?.action === 'clear') {
        stateSetter([]);
      }
    } catch (err) {
      console.error(`${endpoint} delta sync failed network-wise`, err);
    }
  };

  const lastAddToCartTimestamp = useRef({});

  // --- Cart Actions ---
  const addToCart = (product, qty = 1) => {
    if (!product) return;
    const pId = String(product.id || product._id || '');
    if (!pId) {
      showToast('Error: Product ID is missing', 'error');
      return;
    }

    const selectedVar = product.selectedVariant || product.variant || '';
    const selectedCol = product.selectedColor || product.color || '';
    const dedupeKey = `${pId}_${selectedVar}_${selectedCol}`;
    const now = Date.now();
    if (lastAddToCartTimestamp.current[dedupeKey] && now - lastAddToCartTimestamp.current[dedupeKey] < 250) {
      return; // Prevent duplicate rapid touch/click events within 250ms
    }
    lastAddToCartTimestamp.current[dedupeKey] = now;

    setCart(prev => {
      const existingIndex = prev.findIndex(item => {
        const itemPId = String(item.product?.id || item.product?._id || '');
        const itemSlug = String(item.product?.id || '');
        const targetSlug = String(product?.id || '');
        
        const idMatches = (itemPId && pId && itemPId === pId) || (itemSlug && targetSlug && itemSlug === targetSlug);
        if (!idMatches) return false;

        const itemVar = item.product?.selectedVariant || item.product?.variant || '';
        const itemCol = item.product?.selectedColor || item.product?.color || '';

        return itemVar === selectedVar && itemCol === selectedCol;
      });

      const stock = (product.stock !== undefined && product.stock !== null && product.stock > 0) 
        ? product.stock 
        : (product.inStock !== false ? 99 : 0);
      
      let updatedCart;
      if (existingIndex > -1) {
        const existing = prev[existingIndex];
        const newQty = existing.quantity + qty;
        if (newQty > stock && stock > 0) {
          showToast(`Only ${stock} units available in stock.`, 'warning');
          return prev;
        }
        showToast(`Cart updated (${newQty} in cart)!`, 'info');
        updatedCart = [...prev];
        updatedCart[existingIndex] = { ...existing, quantity: newQty };
      } else {
        showToast(`${product.name?.substring(0, 24)}... added to bag!`, 'success');
        updatedCart = [...prev, { product, quantity: qty }];
      }

      // Immediate local cache update
      try {
        if (!currentUser?.token) {
          localStorage.setItem('abkharido_cart', JSON.stringify(updatedCart));
        } else {
          localStorage.setItem('abkharido_cached_cart', JSON.stringify(updatedCart));
        }
      } catch (e) {}

      // Backend sync
      dispatchDeltaSync('cart', { cart: updatedCart, action: 'add', item: { product: pId, quantity: qty } });

      return updatedCart;
    });
  };

  const updateCartQty = (productId, qty) => {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => {
      const updatedCart = prev.map(item => {
        const itemId = item.product?.id || item.product?._id;
        if (itemId === productId) {
          const stock = (item.product.stock !== undefined && item.product.stock !== null && item.product.stock > 0) 
            ? item.product.stock 
            : (item.product.inStock !== false ? 99 : 0);
          if (qty > stock && stock > 0) {
            showToast(`Only ${stock} units available in stock.`, 'warning');
            return item;
          }
          return { ...item, quantity: qty };
        }
        return item;
      });

      try {
        if (!currentUser?.token) {
          localStorage.setItem('abkharido_cart', JSON.stringify(updatedCart));
        } else {
          localStorage.setItem('abkharido_cached_cart', JSON.stringify(updatedCart));
        }
      } catch (e) {}

      dispatchDeltaSync('cart', { cart: updatedCart, action: 'update', item: { product: productId, quantity: qty } });
      return updatedCart;
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => {
      const updatedCart = prev.filter(item => {
        const itemId = item.product?.id || item.product?._id;
        return itemId !== productId;
      });

      try {
        if (!currentUser?.token) {
          localStorage.setItem('abkharido_cart', JSON.stringify(updatedCart));
        } else {
          localStorage.setItem('abkharido_cached_cart', JSON.stringify(updatedCart));
        }
      } catch (e) {}

      dispatchDeltaSync('cart', { cart: updatedCart, action: 'remove', productId });
      return updatedCart;
    });
    showToast('Item removed from cart.', 'info');
  };

  const clearCart = () => {
    setCart([]);
    try {
      localStorage.removeItem('abkharido_cart');
      localStorage.removeItem('abkharido_cached_cart');
    } catch (e) {}
    dispatchDeltaSync('cart', { action: 'clear' });
  };

  // --- Logout Action ---
  const logout = async () => {
    initializedForUser.current = null;
    wishlistInitializedForUser.current = null;
    localStorage.removeItem('abkharido_user_session');
    localStorage.removeItem('abkharido_cached_profile');
    localStorage.removeItem('abkharido_cart');
    localStorage.removeItem('abkharido_cached_cart');
    localStorage.removeItem('abkharido_wishlist');
    localStorage.removeItem('abkharido_cached_wishlist');
    setLocalSession(null);
    setDbUser(null);
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
        const updatedData = await res.json().catch(() => null);
        if (updatedData && !updatedData.error) {
          setDbUser(prev => ({
            ...(prev || {}),
            ...updatedData
          }));
          try {
            const currentCache = JSON.parse(localStorage.getItem('abkharido_cached_profile') || '{}');
            localStorage.setItem('abkharido_cached_profile', JSON.stringify({
              ...currentCache,
              ...updatedData,
              _cachedAt: Date.now()
            }));
          } catch (e) {}
        } else if (details) {
          setDbUser(prev => ({
            ...(prev || {}),
            ...details
          }));
        }
        fetchUser(currentUser.username || currentUser.name, currentUser.phone, currentUser._id);
        return true;
      } else {
        const err = await res.json().catch(() => ({}));
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

  // --- Place Order & Attributions API Checkout (Supports Logged-in & Guest) ---
  const placeOrder = async (shippingAddress, paymentMethod, useCoinsDiscount = false, cfOrderId = null, couponCode = null) => {
    if (cart.length === 0) {
      showToast('Cart is empty!', 'error');
      return null;
    }
    const orderUsername = currentUser ? (currentUser.username || currentUser.name || currentUser.phone) : (shippingAddress.phone || 'guest_user');
    try {
      const res = await fetch(`/api/orders`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(currentUser?.token ? { 'Authorization': `Bearer ${currentUser.token}` } : {})
        },
        body: JSON.stringify({
          cart,
          username: orderUsername,
          shippingAddress,
          paymentMethod,
          useCoinsDiscount: currentUser ? useCoinsDiscount : false,
          activeReferral,
          cfOrderId,
          couponCode
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (currentUser) {
          fetchUser(currentUser.username || currentUser.name);
          fetchOrders(currentUser.email || currentUser.phone);
        }
        clearCart();
        setActiveReferral(null);
        fetchStats();
        return data;
      } else {
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData.message || errData.error || `Server error (${res.status})`;
        console.error('Order API error:', res.status, errData);
        // Handle expired/invalid JWT — force re-login
        if (res.status === 401 && currentUser) {
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
        deliveryLocation,
        setDeliveryLocation,
        detectUserLocation,
        isDetectingLocation,
        currentPincode: deliveryLocation?.pincode || '401404',
        isAuthLoading: status === 'loading'
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
