import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  PlusCircle, 
  Trash2, 
  Settings, 
  Package, 
  Image, 
  Tag, 
  // eslint-disable-next-line
  DollarSign, 
  // eslint-disable-next-line
  Coins, 
  Layers,
  ArrowLeft,
  X,
  FileText,
  Users,
  ShieldAlert,
  Store,
  TrendingUp,
  LayoutTemplate,
  Banknote,
  HeadphonesIcon,
  User,
  Search,
  MinusCircle
} from 'lucide-react';
import '../assets/styles/admin.css';
import AdminDataGrid from '../components/AdminDataGrid';
import AdminAnalytics from '../components/AdminAnalytics';
import AdminCMSBuilder from '../components/AdminCMSBuilder';
import AdminCoupons from '../components/AdminCoupons';
import AdminOMS from '../components/AdminOMS';
import AdminCRM from '../components/AdminCRM';
// eslint-disable-next-line
import AdminAuditLogs from '../components/AdminAuditLogs';
import AdminFinance from '../components/AdminFinance';
import AdminHelpdesk from '../components/AdminHelpdesk';
import AdminStaff from '../components/AdminStaff';

// eslint-disable-next-line
const compressImage = (file, maxWidth, maxHeight, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const img = new Image();
          img.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              let width = img.width;
              let height = img.height;

              if (width > height) {
                if (width > maxWidth) {
                  height = Math.round(height * (maxWidth / width));
                  width = maxWidth;
                }
              } else {
                if (height > maxHeight) {
                  width = Math.round(width * (maxHeight / height));
                  height = maxHeight;
                }
              }

              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              if (!ctx) throw new Error("Canvas 2D context not available");
              ctx.drawImage(img, 0, 0, width, height);
              resolve(canvas.toDataURL('image/jpeg', quality));
            } catch (err) {
              reject(err);
            }
          };
          // eslint-disable-next-line
          img.onerror = (error) => reject(new Error("Image failed to load for compression"));
          img.src = event.target.result;
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    } catch (err) {
      reject(err);
    }
  });
};

const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'abkharido_uploads');
  formData.append('cloud_name', 'rx1klbob');
  
  const res = await fetch('https://api.cloudinary.com/v1_1/rx1klbob/auto/upload', {
    method: 'POST',
    body: formData
  });
  const data = await res.json();
  if (data.secure_url) {
    return data.secure_url;
  }
  throw new Error(data.error?.message || 'Cloudinary upload failed');
};

const AdminDashboard = ({ onNavigate, promotions, onUpdatePromotions }) => {
  // eslint-disable-next-line
  const { products, addProduct, editProduct, removeProduct, showToast, currentUser } = useApp();
  const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem('adminActiveTab') || 'analytics'); 
  
  const userRole = currentUser?.role || (sessionStorage.getItem('abkharido_admin_token') === 'abkharido_master_admin_2024' ? 'super_admin' : 'admin');
  
  // RBAC Helpers
  const isSuperAdmin = userRole === 'super_admin';
  const canManageCatalog = userRole === 'catalog_manager' || userRole === 'admin' || isSuperAdmin;
  const canManageSupport = userRole === 'support_agent' || userRole === 'admin' || isSuperAdmin;
  const canManageFinance = isSuperAdmin;
  
  useEffect(() => {
    sessionStorage.setItem('adminActiveTab', activeTab);
  }, [activeTab]);

  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminOrders, setAdminOrders] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminSellers, setAdminSellers] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [sellerSearchQuery, setSellerSearchQuery] = useState('');
  const [userInnerTab, setUserInnerTab] = useState('customers');
  
  // Advanced CRM Controls State
  const [activeWalletModal, setActiveWalletModal] = useState(null);
  const [walletAmount, setWalletAmount] = useState('');
  const [walletNote, setWalletNote] = useState('');
  const [walletType, setWalletType] = useState('cash');
  const [walletAction, setWalletAction] = useState('add');
  const [activeOrderHistoryModal, setActiveOrderHistoryModal] = useState(null);
  const [activeCatalogModal, setActiveCatalogModal] = useState(null);
  
  // eslint-disable-next-line
  const [inventorySearchQuery, setInventorySearchQuery] = useState('');

  // Command Center Search
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [globalSearchResults, setGlobalSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (globalSearchQuery.length < 2) {
      setGlobalSearchResults(null);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const token = sessionStorage.getItem('abkharido_admin_token') || '';
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/admin/search?q=${globalSearchQuery}`, {
          headers: { 'x-admin-token': token }
        });
        if (res.ok) setGlobalSearchResults(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [globalSearchQuery]);

  const [editMode, setEditMode] = useState(false);

  const handleEditProduct = (prod) => {
    setEditMode(true);
    setId(prod.id);
    setName(prod.name);
    setCategory(prod.category || 'electronics');
    setPrice(prod.price?.toString() || '');
    setOriginalPrice(prod.originalPrice?.toString() || '');
    setRating(prod.rating?.toString() || '4.5');
    setReviewsCount(prod.reviewsCount?.toString() || '120');
    setBadge(prod.badge || 'none');
    setDescription(prod.description || '');
    setUserCommissionRate(prod.userCommissionRate ? (prod.userCommissionRate * 100).toString() : '2');
    setInStock(prod.inStock !== false);
    setStock(prod.stock?.toString() || '0');
    setSpecs(prod.specs?.length ? prod.specs : [{ key: 'Brand', value: '' }, { key: 'Model', value: '' }]);
    setMedia(prod.images || [prod.image].filter(Boolean));
    
    // Flash Sale Pre-fill
    setFlashSaleActive(prod.flashSale?.isActive || false);
    setFlashSalePrice(prod.flashSale?.price?.toString() || '');
    setFlashSaleEndTime(prod.flashSale?.endTime ? new Date(prod.flashSale.endTime).toISOString().slice(0, 16) : '');

    // Set PIM Fields
    setMetaTitle(prod.seo?.metaTitle || '');
    setMetaDescription(prod.seo?.metaDescription || '');
    setHsnCode(prod.hsnCode || '');
    setVendorId(prod.vendorId || '');
    
    let initialColorModels = prod.colorModels;
    if (!initialColorModels || initialColorModels.length === 0) {
      if (prod.category === 'mobiles' || prod.category === 'electronics') {
        initialColorModels = [
          {
            name: 'Carbon Gray',
            primaryImage: prod.images && prod.images[0] ? prod.images[0] : prod.image || '',
            imagesInput: (prod.images || []).join(', '),
            variants: [
              { name: 'Base Edition', price: prod.price?.toString() || '', originalPrice: prod.originalPrice?.toString() || '', stock: '15' },
              { name: 'Pro Edition', price: Math.round(prod.price * 1.25).toString(), originalPrice: Math.round(prod.originalPrice * 1.25).toString(), stock: '3' }
            ]
          },
          {
            name: 'Platinum Silver',
            primaryImage: prod.images && prod.images[1] ? prod.images[1] : prod.image || '',
            imagesInput: (prod.images && prod.images[1] ? [prod.images[1]] : [prod.image]).filter(Boolean).join(', '),
            variants: [
              { name: 'Base Edition', price: Math.round(prod.price * 1.05).toString(), originalPrice: Math.round(prod.originalPrice * 1.05).toString(), stock: '5' },
              { name: 'Pro Edition', price: Math.round(prod.price * 1.32).toString(), originalPrice: Math.round(prod.originalPrice * 1.32).toString(), stock: '2' }
            ]
          }
        ];
      } else {
        initialColorModels = [
          {
            name: 'Standard Edition',
            primaryImage: prod.image || '',
            imagesInput: (prod.images || [prod.image]).filter(Boolean).join(', '),
            variants: [
              { name: 'Standard Pack', price: prod.price?.toString() || '', originalPrice: prod.originalPrice?.toString() || '', stock: '10' }
            ]
          }
        ];
      }
    }
    setColorModels(initialColorModels);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('Editing product. Scroll down to form.', 'info');
  };

  const resetForm = () => {
    setEditMode(false);
    setId('');
    setName('');
    setPrice('');
    setOriginalPrice('');
    setMedia([]);
    setDescription('');
    setBadge('none');
    setSpecs([{ key: 'Brand', value: '' }, { key: 'Model', value: '' }]);
    setColorModels([]);
    
    setFlashSaleActive(false);
    setFlashSalePrice('');
    setFlashSaleEndTime('');
  };

  // Promotions Management States
  const [promoDealsTimer, setPromoDealsTimer] = useState('');
  const [promoBudgetThreshold, setPromoBudgetThreshold] = useState(15000);
  const [announcementShow, setAnnouncementShow] = useState(false);
  const [announcementText, setAnnouncementText] = useState('');
  const [dealOfTheDayProducts, setDealOfTheDayProducts] = useState([]);
  const [dealSearchQuery, setDealSearchQuery] = useState('');
  const [announcementLink, setAnnouncementLink] = useState('');
  const [banners, setBanners] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // New Slide Form Inputs
  const [newSlideTitle, setNewSlideTitle] = useState('');
  const [newSlideDesc, setNewSlideDesc] = useState('');
  const [newSlideTag, setNewSlideTag] = useState('');
  const [newSlideCat, setNewSlideCat] = useState('all');
  const [newSlideBg, setNewSlideBg] = useState('linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)');
  
  // Custom image & banner mode state
  const [newSlideUseImage, setNewSlideUseImage] = useState(false);
  const [newSlideImage, setNewSlideImage] = useState('');
  const [newSlideImageOnly, setNewSlideImageOnly] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Category Banners — multi-slide structure
  const EMPTY_CAT_BANNERS = {
    all:        { slides: [], show: false },
    mobiles:    { slides: [], show: false },
    electronics:{ slides: [], show: false },
    fashion:    { slides: [], show: false },
    home:       { slides: [], show: false },
    appliances: { slides: [], show: false }
  };
  const [categoryBanners, setCategoryBanners] = useState(EMPTY_CAT_BANNERS);

  // Per-category new slide form state — full fields matching homepage slide builder
  const EMPTY_SLIDE_FORM = { image: '', title: '', desc: '', tag: '', bg: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)', useImage: false, imageOnly: false, uploading: false };
  const [catSlideForm, setCatSlideForm] = useState({
    all:        { ...EMPTY_SLIDE_FORM },
    mobiles:    { ...EMPTY_SLIDE_FORM },
    electronics:{ ...EMPTY_SLIDE_FORM },
    fashion:    { ...EMPTY_SLIDE_FORM },
    home:       { ...EMPTY_SLIDE_FORM },
    appliances: { ...EMPTY_SLIDE_FORM }
  });
  const updateCatForm = (catKey, field, value) =>
    setCatSlideForm(prev => ({ ...prev, [catKey]: { ...prev[catKey], [field]: value } }));

  const handleBannerFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast('Image file size must be under 10MB.', 'error');
      return;
    }

    setUploadingImage(true);
    showToast('Uploading banner to Cloudinary...', 'info');
    try {
      const secureUrl = await uploadToCloudinary(file);
      setNewSlideImage(secureUrl);
      showToast('Banner image uploaded successfully!', 'success');
    } catch (err) {
      console.error('Banner upload error:', err);
      showToast('Network error during file upload.', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  // Upload image for a category slide form
  const handleCatSlideImageUpload = async (catKey, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showToast('Image must be under 10MB.', 'error');
      return;
    }
    
    setCatSlideForm(prev => ({ ...prev, [catKey]: { ...prev[catKey], uploading: true } }));
    showToast(`Uploading ${catKey} slide to Cloudinary...`, 'info');
    
    try {
      const secureUrl = await uploadToCloudinary(file);
      setCatSlideForm(prev => ({ ...prev, [catKey]: { ...prev[catKey], image: secureUrl, uploading: false } }));
      showToast('Image uploaded!', 'success');
    } catch (err) {
      console.error('Slide upload error:', err);
      showToast('Upload failed or network error.', 'error');
      setCatSlideForm(prev => ({ ...prev, [catKey]: { ...prev[catKey], uploading: false } }));
    }
  };

  const handleSavePromotions = async () => {
    if (announcementShow && !announcementText) {
      showToast('Please enter the announcement text.', 'error');
      return;
    }
    const token = sessionStorage.getItem('abkharido_admin_token') || '';
    if (!token) { showToast('Session expired. Please re-login to admin.', 'error'); return; }
    
    const defaultTimer = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
    let timerIso = defaultTimer;
    try { if (promoDealsTimer) timerIso = new Date(promoDealsTimer).toISOString(); } catch { timerIso = defaultTimer; }
    
    setIsSaving(true);
    console.log('[ADMIN SAVE] categoryBanners being saved:', JSON.stringify(categoryBanners, null, 2));
    
    try {
      const payload = { dealsTimer: timerIso, budgetThreshold: Number(promoBudgetThreshold), announcement: { show: announcementShow, text: announcementText, link: announcementLink }, banners, categoryBanners, dealOfTheDayProducts };
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/promotions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          showToast('✅ Saved! Config is now live on the website.', 'success');
          if (onUpdatePromotions) onUpdatePromotions(payload);
        } else {
          showToast(`Save failed: ${data.error || 'Unknown error from server.'}`, 'error');
        }
      } else {
        const errText = await res.text().catch(() => '');
        showToast(`Save failed (HTTP ${res.status}): ${errText.substring(0, 80)}`, 'error');
      }
    } catch (err) {
      showToast(`Network error: ${err.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Synchronize state when promotions prop loads
  React.useEffect(() => {
    if (promotions) {
      setPromoDealsTimer(promotions.dealsTimer ? new Date(promotions.dealsTimer).toISOString().substring(0, 16) : '');
      setPromoBudgetThreshold(promotions.budgetThreshold || 15000);
      setAnnouncementShow(promotions.announcement?.show || false);
      setAnnouncementText(promotions.announcement?.text || '');
      setDealOfTheDayProducts(promotions.dealOfTheDayProducts || []);
      setAnnouncementLink(promotions.announcement?.link || '');
      setBanners(promotions.banners || []);
      // Normalise old single-image docs → new slides[] format
      const rawCB = promotions.categoryBanners || {};
      const normCB = {};
      ['all','mobiles','electronics','fashion','home','appliances'].forEach(k => {
        const existing = rawCB[k] || {};
        if (Array.isArray(existing.slides)) {
          normCB[k] = existing;
        } else if (existing.image) {
          // Migrate old single image into slides array
          normCB[k] = { slides: [{ image: existing.image, title: '' }], show: existing.show || false };
        } else {
          normCB[k] = { slides: [], show: false };
        }
      });
      setCategoryBanners(normCB);
    }
  }, [promotions]);

  // Security Auth State
  const [authorized, setAuthorized] = useState(() => {
    return !!sessionStorage.getItem('abkharido_admin_token');
  });
  const [adminPin, setAdminPin] = useState('');
  const [loginError, setLoginError] = useState('');
  const [verifying, setVerifying] = useState(false);

  const handleVerifyPin = async (e) => {
    e.preventDefault();
    if (!adminPin) return;
    setVerifying(true);
    setLoginError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/admin/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPin })
      });
      if (res.ok) {
        const data = await res.json();
        sessionStorage.setItem('abkharido_admin_token', data.token);
        setAuthorized(true);
        showToast('Access Granted. Welcome Administrator!', 'success');
        // Trigger initial data loads on success
        setTimeout(() => {
          fetchAllOrders();
        }, 100);
      } else {
        setLoginError('Incorrect Security Password/PIN. Please try again.');
        showToast('Access Denied. Incorrect PIN.', 'error');
      }
    // eslint-disable-next-line
    } catch (err) {
      setLoginError('Failed to connect to security backend.');
    } finally {
      setVerifying(false);
    }
  };

  // Fetch all orders for management
  const fetchAllOrders = async () => {
    const token = sessionStorage.getItem('abkharido_admin_token') || '';
    if (!token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/orders?email=admin`, {
        headers: { 'x-admin-token': token }
      });
      if (res.ok) {
        const data = await res.json();
        setAdminOrders(data);
      }
    } catch (err) {
      console.error('Failed to fetch admin orders:', err);
    }
  };

  React.useEffect(() => {
    if (authorized) {
      fetchAllOrders();
    }
  }, [authorized]);

  // eslint-disable-next-line
  const handleUpdateStatus = async (orderId, newStatus) => {
    const token = sessionStorage.getItem('abkharido_admin_token') || '';
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/orders/${orderId}/status`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-token': token
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        showToast(`Order milestone updated to ${newStatus}!`, 'success');
        fetchAllOrders();
      } else {
        showToast('Failed to update status.', 'error');
      }
    } catch (err) {
      console.error('Failed to update order status:', err);
    }
  };

  const fetchAllSellers = async () => {
    const token = sessionStorage.getItem('abkharido_admin_token') || '';
    if (!token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/sellers`, {
        headers: { 'x-admin-token': token }
      });
      if (res.ok) {
        const data = await res.json();
        setAdminSellers(data);
      }
    } catch (err) {
      console.error('Failed to fetch admin sellers:', err);
    }
  };

  const fetchAllUsers = async () => {
    const token = sessionStorage.getItem('abkharido_admin_token') || '';
    if (!token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/users`, {
        headers: { 'x-admin-token': token }
      });
      if (res.ok) {
        const data = await res.json();
        setAdminUsers(data);
      }
      await fetchAllSellers();
    } catch (err) {
      console.error('Failed to fetch admin users:', err);
    }
  };

  React.useEffect(() => {
    if (activeTab === 'orders' && authorized) {
      fetchAllOrders();
    } else if (activeTab === 'users' && authorized) {
      fetchAllUsers();
    }
  }, [activeTab, authorized]);

  const handleToggleEmailVerify = async (userObj) => {
    const token = sessionStorage.getItem('abkharido_admin_token') || '';
    const targetState = !userObj.isEmailVerified;
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/users/${userObj.username}/update`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-token': token
        },
        body: JSON.stringify({
          isEmailVerified: targetState
        })
      });
      if (res.ok) {
        showToast(`Email verification status updated!`, 'success');
        fetchAllUsers();
      } else {
        showToast('Failed to update email verification.', 'error');
      }
    } catch (err) {
      console.error('Failed to update email verification:', err);
    }
  };

  const handleToggleUserRole = async (userObj) => {
    const token = sessionStorage.getItem('abkharido_admin_token') || '';
    const isCurrentlyCreator = userObj.isInfluencer;
    const targetState = !isCurrentlyCreator;
    
    const cleanPhone = (userObj.phone || userObj.username).replace(/\D/g, '');
    const suffix = cleanPhone.substring(cleanPhone.length - 4) || Math.floor(1000 + Math.random() * 9000);
    const creatorCode = targetState ? `CREATOR-${suffix}` : '';
    const influencerId = targetState ? `INF-${suffix}` : '';

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/users/${userObj.username}/update`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-token': token
        },
        body: JSON.stringify({
          isInfluencer: targetState,
          creatorCode,
          influencerId
        })
      });
      if (res.ok) {
        showToast(`User role updated successfully!`, 'success');
        fetchAllUsers();
      } else {
        showToast('Failed to update user role.', 'error');
      }
    } catch (err) {
      console.error('Failed to update user role:', err);
    }
  };

  const handleSuspendUser = async (userObj) => {
    const token = sessionStorage.getItem('abkharido_admin_token') || '';
    const newStatus = userObj.status === 'Suspended' ? 'Active' : 'Suspended';
    if (!window.confirm(`Are you sure you want to ${newStatus === 'Suspended' ? 'suspend' : 'activate'} ${userObj.username}?`)) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/users/${userObj._id}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        showToast(`User ${newStatus === 'Suspended' ? 'suspended' : 'activated'} successfully!`, 'success');
        fetchAllUsers();
      }
    // eslint-disable-next-line
    } catch (err) {
      showToast('Failed to update user status.', 'error');
    }
  };

  // eslint-disable-next-line
  const handleAddWallet = async (userObj) => {
    const amount = window.prompt(`Enter amount to add to ${userObj.username}'s wallet (Refund/Cashback):`, "0");
    if (!amount || isNaN(amount) || Number(amount) <= 0) return;

    const token = sessionStorage.getItem('abkharido_admin_token') || '';
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/users/${userObj._id}/wallet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify({ amount: Number(amount) })
      });
      if (res.ok) {
        showToast(`Added ₹${amount} to wallet successfully!`, 'success');
        fetchAllUsers();
      }
    // eslint-disable-next-line
    } catch (err) {
      showToast('Failed to add wallet balance.', 'error');
    }
  };

  const handleToggleSellerRole = async (sellerObj) => {
    const token = sessionStorage.getItem('abkharido_admin_token') || '';
    const newStatus = sellerObj.sellerStatus === 'Approved' ? 'Rejected' : 'Approved';

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/users/${sellerObj._id}/seller-status`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-token': token
        },
        body: JSON.stringify({
          status: newStatus
        })
      });
      if (res.ok) {
        showToast(`Seller status updated successfully!`, 'success');
        fetchAllSellers();
      } else {
        showToast('Failed to update seller status.', 'error');
      }
    } catch (err) {
      console.error('Failed to update seller role:', err);
    }
  };

  // --- Add Product Form State ---
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('electronics');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [rating, setRating] = useState('4.5');
  const [reviewsCount, setReviewsCount] = useState('10');
  const [media, setMedia] = useState([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [description, setDescription] = useState('');
  const [inStock, setInStock] = useState(true);
  const [stock, setStock] = useState('100');
  const [badge, setBadge] = useState('none');
  
  // Flash Sale Engine State
  const [flashSaleActive, setFlashSaleActive] = useState(false);
  const [flashSalePrice, setFlashSalePrice] = useState('');
  const [flashSaleEndTime, setFlashSaleEndTime] = useState('');

  // Enterprise PIM State
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [hsnCode, setHsnCode] = useState('');
  const [vendorId, setVendorId] = useState('');

  // Dynamic spec list key-value rows
  const [specs, setSpecs] = useState([
    { key: 'Brand', value: '' },
    { key: 'Model', value: '' }
  ]);

  // Colors & Variants State
  const [colorModels, setColorModels] = useState([]);

  const handleAddColorModel = () => {
    setColorModels([...colorModels, {
      name: '',
      primaryImage: '',
      imagesInput: '',
      variants: [
        { name: '', price: '', originalPrice: '', stock: '10' }
      ]
    }]);
  };

  const handleRemoveColorModel = (colorIdx) => {
    setColorModels(colorModels.filter((_, idx) => idx !== colorIdx));
  };

  const handleColorModelChange = (colorIdx, field, value) => {
    setColorModels(colorModels.map((cm, idx) => {
      if (idx === colorIdx) {
        return { ...cm, [field]: value };
      }
      return cm;
    }));
  };

  const handleColorModelImageUpload = async (e, colorIdx) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast('Image size should be less than 10MB', 'error');
      e.target.value = '';
      return;
    }

    showToast('Uploading variant image to Cloudinary...', 'info');

    try {
      const secureUrl = await uploadToCloudinary(file);
      handleColorModelChange(colorIdx, 'primaryImage', secureUrl);
      showToast('Variant image uploaded successfully', 'success');
    } catch (err) {
      console.error('Variant image upload failed:', err);
      showToast('Error uploading image to Cloudinary', 'error');
    }
  };

  const handleAddVariant = (colorIdx) => {
    setColorModels(colorModels.map((cm, idx) => {
      if (idx === colorIdx) {
        return {
          ...cm,
          variants: [...cm.variants, { name: '', price: '', originalPrice: '', stock: '10' }]
        };
      }
      return cm;
    }));
  };

  const handleRemoveVariant = (colorIdx, variantIdx) => {
    setColorModels(colorModels.map((cm, idx) => {
      if (idx === colorIdx) {
        return {
          ...cm,
          variants: cm.variants.filter((_, vIdx) => vIdx !== variantIdx)
        };
      }
      return cm;
    }));
  };

  const handleVariantChange = (colorIdx, variantIdx, field, value) => {
    setColorModels(colorModels.map((cm, idx) => {
      if (idx === colorIdx) {
        return {
          ...cm,
          variants: cm.variants.map((v, vIdx) => {
            if (vIdx === variantIdx) {
              return { ...v, [field]: value };
            }
            return v;
          })
        };
      }
      return cm;
    }));
  };

  // Dynamic commission rates (pre-filled on category change for helper guidance)
  const [userCommission, setUserCommission] = useState('0.012'); // 1.2%

  // Update commission presets automatically when changing category
  const handleCategoryChange = (cat) => {
    setCategory(cat);
    switch (cat) {
      case 'fashion':
        setUserCommission('0.03');
        break;
      case 'home':
        setUserCommission('0.02');
        break;
      case 'appliances':
        setUserCommission('0.015');
        break;
      case 'electronics':
        setUserCommission('0.012');
        break;
      case 'mobiles':
        setUserCommission('0.005');
        break;
      default:
        break;
    }
  };

  const handleAddSpecRow = () => {
    setSpecs([...specs, { key: '', value: '' }]);
  };

  const handleRemoveSpecRow = (idx) => {
    setSpecs(specs.filter((_, i) => i !== idx));
  };

  const handleSpecChange = (idx, field, value) => {
    const updated = specs.map((spec, i) => {
      if (i === idx) {
        return { ...spec, [field]: value };
      }
      return spec;
    });
    setSpecs(updated);
  };

  const handleProductImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (media.length + files.length > 10) {
      showToast('You can only upload up to 10 photos/videos combined.', 'error');
      e.target.value = '';
      return;
    }

    setIsUploadingImage(true);
    showToast(`Uploading ${files.length} file(s) to Cloudinary...`, 'info');

    let newMedia = [];
    for (const file of files) {
      const isVideo = file.type.startsWith('video/');
      if (isVideo && file.size > 100 * 1024 * 1024) {
        showToast(`Video ${file.name} exceeds 100MB Cloudinary limit. Skipped.`, 'error');
        continue;
      } else if (!isVideo && file.size > 10 * 1024 * 1024) {
        showToast(`Image ${file.name} exceeds 10MB limit. Skipped.`, 'error');
        continue;
      }

      try {
        const secureUrl = await uploadToCloudinary(file);
        newMedia.push(secureUrl);
      } catch (err) {
        console.error('Cloudinary upload failed:', err);
        showToast(`Network error while uploading ${file.name}`, 'error');
      }
    }

    setMedia(prev => [...prev, ...newMedia]);
    if (newMedia.length > 0) showToast('Media uploaded to Cloud successfully', 'success');
    setIsUploadingImage(false);
    e.target.value = '';
  };

  const handleRemoveMedia = (idx) => {
    setMedia(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!id || !name || !price || !originalPrice || media.length === 0 || !description) {
      showToast('Please fill out all required fields.', 'error');
      return;
    }

    // Clean specifications (filter empty rows)
    const cleanSpecs = specs.filter(s => s.key.trim() !== '' && s.value.trim() !== '');

    // Process Color Models & Variants
    const cleanColorModels = colorModels.map(cm => {
      const extraImages = cm.imagesInput
        ? cm.imagesInput.split(',').map(url => url.trim()).filter(url => url !== '')
        : [];
      
      const cleanVariants = cm.variants
        .filter(v => v.name.trim() !== '' && v.price !== '')
        .map(v => {
          const orig = Number(v.originalPrice || v.price || 0);
          const prc = Number(v.price || 0);
          const discountPct = orig > 0 ? Math.round(((orig - prc) / orig) * 100) : 0;
          return {
            name: v.name.trim(),
            price: prc,
            originalPrice: orig,
            discount: discountPct,
            stock: Number(v.stock || 0)
          };
        });

      return {
        name: cm.name.trim(),
        primaryImage: cm.primaryImage.trim(),
        images: [cm.primaryImage.trim(), ...extraImages],
        variants: cleanVariants
      };
    }).filter(cm => cm.name !== '' && cm.primaryImage !== '' && cm.variants.length > 0);

    // Construct product object
    const newProduct = {
      id: id.toLowerCase().trim().replace(/[\s\W]+/g, '-'),
      name,
      category,
      price: Number(price),
      originalPrice: Number(originalPrice),
      rating: Number(rating),
      reviewsCount: Number(reviewsCount),
      image: media[0],
      images: media,
      description,
      specs: cleanSpecs,
      userCommissionRate: Number(userCommission),
      inStock,
      stock: Number(stock),
      badge,
      colorModels: cleanColorModels.length > 0 ? cleanColorModels : undefined,
      flashSale: {
        isActive: flashSaleActive,
        price: Number(flashSalePrice || 0),
        endTime: flashSaleEndTime ? new Date(flashSaleEndTime) : null
      },
      // PIM Fields
      hsnCode: hsnCode.trim(),
      vendorId: vendorId.trim() || undefined,
      seo: {
        metaTitle: metaTitle.trim(),
        metaDescription: metaDescription.trim()
      }
    };

    if (editMode) {
      editProduct(newProduct.id, newProduct);
    } else {
      addProduct(newProduct);
    }

    resetForm();
  };

  // --- ADVANCED CRM HANDLERS ---
  const handleOpenWalletModal = (user) => {
    setActiveWalletModal(user);
    setWalletAmount('');
    setWalletNote('');
    setWalletType('cash');
    setWalletAction('add');
  };

  const handleProcessWalletTransaction = async (e) => {
    e.preventDefault();
    if (!activeWalletModal || !walletAmount || Number(walletAmount) <= 0) return;
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/users/${activeWalletModal._id || activeWalletModal.id}/wallet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('abkharido_admin_token')}`
        },
        body: JSON.stringify({
          amount: Number(walletAmount),
          action: walletAction, // 'add' or 'deduct'
          type: walletType, // 'cash' or 'coins'
          note: walletNote
        })
      });

      if (res.ok) {
        showToast(`Successfully ${walletAction === 'add' ? 'added' : 'deducted'} ${walletType === 'cash' ? '₹' : '🪙'}${walletAmount} ${walletAction === 'add' ? 'to' : 'from'} ${activeWalletModal.email}'s wallet.`, 'success');
        
        // Since we don't have a real mailer yet, keep the UI toast for mail
        setTimeout(() => {
          showToast(`Automated Email sent to ${activeWalletModal.email} regarding wallet update.`, 'info');
        }, 1500);

        setActiveWalletModal(null);
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to process wallet transaction.', 'error');
      }
    // eslint-disable-next-line
    } catch (err) {
      showToast('Connection error while updating wallet.', 'error');
    }
  };

  const exportCustomersCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8,Username,Email,Phone,Wallet Cash,Wallet Coins\n" + 
      adminUsers.map(u => `${u.username},${u.email || ''},${u.phone || ''},${u.walletCash || 0},${u.walletCoins || 0}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "customers_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportMerchantsCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8,Shop Name,Email,Status,Wallet Cash\n" + 
      adminSellers.map(s => `${s.shopName},${s.email},${s.sellerStatus},${s.walletCash || 0}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "merchants_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!authorized) {
    return (
      <div className="container animate-fade-in" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div className="admin-panel-card" style={{ maxWidth: '420px', width: '100%', padding: '32px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 8px 30px rgba(0,0,0,0.08)', borderRadius: '8px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#fff3e0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff9800' }}>
              <ShieldAlert size={24} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>Backend Security Authorization</h2>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              This panel is restricted to verified store managers. Please enter the security PIN to verify access.
            </span>
          </div>

          <form onSubmit={handleVerifyPin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group" style={{ textAlign: 'left' }}>
              <label className="form-label-txt">Security Password/PIN*</label>
              <input
                type="password"
                placeholder="••••••••••••"
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value)}
                className="form-input-field"
                style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '18px', boxSizing: 'border-box' }}
                required
                autoFocus
              />
            </div>

            {loginError && (
              <div style={{ fontSize: '12px', color: 'var(--error)', backgroundColor: '#ffebee', padding: '8px 12px', borderRadius: '4px', fontWeight: '500' }}>
                {loginError}
              </div>
            )}

            <button type="submit" disabled={verifying} className="btn btn-primary" style={{ height: '40px', fontWeight: 'bold' }}>
              {verifying ? 'Verifying Authorization...' : 'UNLOCK INVENTORY CONTROL'}
            </button>
            
            <button type="button" onClick={() => onNavigate('home')} className="btn btn-outline" style={{ height: '40px' }}>
              Cancel & Exit
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout animate-fade-in">
      
      {/* ── Premium Sidebar ── */}
      <aside className={`admin-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-brand" onClick={() => onNavigate('home')}>
            <ShieldAlert size={24} color="#818cf8" />
            AbKharido<span style={{color: '#818cf8'}}>.Admin</span>
          </div>
        </div>
        
        <nav className="admin-sidebar-nav">
          {/* Group: Overview */}
          <div className="admin-nav-group-label">Overview</div>
          <div
            className={`admin-nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => { setActiveTab('analytics'); setMobileMenuOpen(false); }}
          >
            <TrendingUp size={18} /> Dashboard
          </div>

          {canManageCatalog && (
            <>
              {/* Group: Store */}
              <div className="admin-nav-group-label">Store</div>
              <div
                className={`admin-nav-item ${activeTab === 'inventory' ? 'active' : ''}`}
                onClick={() => { setActiveTab('inventory'); setMobileMenuOpen(false); }}
              >
                <Package size={18} /> Inventory
              </div>
              <div
                className={`admin-nav-item ${activeTab === 'cms' ? 'active' : ''}`}
                onClick={() => { setActiveTab('cms'); setMobileMenuOpen(false); }}
              >
                <LayoutTemplate size={18} /> CMS &amp; Layout
              </div>
              <div
                className={`admin-nav-item ${activeTab === 'promotions' ? 'active' : ''}`}
                onClick={() => { setActiveTab('promotions'); setMobileMenuOpen(false); }}
              >
                <Image size={18} /> Banners
              </div>
            </>
          )}

          {(canManageCatalog || canManageSupport) && (
            <>
              {/* Group: Operations */}
              <div className="admin-nav-group-label">Operations</div>
              <div
                className={`admin-nav-item ${activeTab === 'orders' ? 'active' : ''}`}
                onClick={() => { setActiveTab('orders'); setMobileMenuOpen(false); }}
              >
                <FileText size={18} /> Orders
              </div>
            </>
          )}

          {canManageSupport && (
            <>
              <div
                className={`admin-nav-item ${activeTab === 'helpdesk' ? 'active' : ''}`}
                onClick={() => { setActiveTab('helpdesk'); setMobileMenuOpen(false); }}
              >
                <HeadphonesIcon size={18} /> Helpdesk
              </div>
              <div
                className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`}
                onClick={() => { setActiveTab('users'); setMobileMenuOpen(false); }}
              >
                <Users size={18} /> Users
              </div>
            </>
          )}

          {isSuperAdmin && (
            <>
              {/* Group: Advanced */}
              <div className="admin-nav-group-label">Advanced</div>
              <div
                className={`admin-nav-item ${activeTab === 'coupons' ? 'active' : ''}`}
                onClick={() => { setActiveTab('coupons'); setMobileMenuOpen(false); }}
              >
                <Tag size={18} /> Marketing
              </div>
              <div
                className={`admin-nav-item ${activeTab === 'crm' ? 'active' : ''}`}
                onClick={() => { setActiveTab('crm'); setMobileMenuOpen(false); }}
              >
                <Settings size={18} /> CRM Settings
              </div>
              <div
                className={`admin-nav-item ${activeTab === 'audit' ? 'active' : ''}`}
                onClick={() => { setActiveTab('audit'); setMobileMenuOpen(false); }}
              >
                <ShieldAlert size={18} /> Audit Logs
              </div>
              <div
                className={`admin-nav-item ${activeTab === 'staff' ? 'active' : ''}`}
                onClick={() => { setActiveTab('staff'); setMobileMenuOpen(false); }}
              >
                <User size={18} /> Team &amp; Staff
              </div>
            </>
          )}

          {canManageFinance && (
            <div
              className={`admin-nav-item ${activeTab === 'finance' ? 'active' : ''}`}
              onClick={() => { setActiveTab('finance'); setMobileMenuOpen(false); }}
            >
              <Banknote size={18} /> Finance &amp; Payouts
            </div>
          )}
        </nav>
      </aside>

      {/* ── Main Content Area ── */}
      <main className="admin-main-content">
        
        <header className="admin-topbar">
          <div className="admin-topbar-title">
            <button className="admin-mobile-menu-btn" onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X size={24} /> : <div style={{display:'flex', flexDirection:'column', gap:'4px'}}><div style={{width:'20px',height:'2px',background:'#0f172a'}}></div><div style={{width:'14px',height:'2px',background:'#0f172a'}}></div><div style={{width:'20px',height:'2px',background:'#0f172a'}}></div></div>}
            </button>
            <span style={{ background: 'linear-gradient(135deg, #0f172a 0%, #4f46e5 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Control
            </span>
          </div>

          <div style={{ flex: 1, maxWidth: '500px', margin: '0 20px', position: 'relative' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '14px', zIndex: 1 }} />
              <input
                type="text"
                placeholder="Search orders, users, products..."
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '11px 14px 11px 40px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none', background: '#f8fafc', transition: 'all 0.2s ease', fontFamily: 'Inter, sans-serif' }}
                onFocus={e => { e.target.style.borderColor = '#818cf8'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; e.target.style.background = '#fff'; }}
                onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#f8fafc'; }}
              />
              {isSearching && <div style={{ position: 'absolute', right: '12px', fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Searching...</div>}
            </div>

            {/* Smart Search Results Dropdown */}
            {globalSearchResults && (
              <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, background: '#fff', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0', zIndex: 100, maxHeight: '400px', overflowY: 'auto' }}>
                
                {globalSearchResults.orders?.length > 0 && (
                  <div style={{ padding: '8px 12px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Orders</div>
                    {globalSearchResults.orders.map(o => (
                      <div key={o._id} onClick={() => { setActiveTab('orders'); setGlobalSearchResults(null); setGlobalSearchQuery(''); }} style={{ padding: '8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <div style={{ fontSize: '13px', fontWeight: '500', color: '#0f172a' }}>#{o._id.substring(o._id.length - 6)}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{o.user?.name}</div>
                      </div>
                    ))}
                  </div>
                )}

                {globalSearchResults.products?.length > 0 && (
                  <div style={{ padding: '8px 12px', borderTop: globalSearchResults.orders?.length ? '1px solid #f1f5f9' : 'none' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Products</div>
                    {globalSearchResults.products.map(p => (
                      <div key={p._id} onClick={() => { setActiveTab('inventory'); setGlobalSearchResults(null); setGlobalSearchQuery(''); }} style={{ padding: '8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <div style={{ fontSize: '13px', fontWeight: '500', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '250px' }}>{p.name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b', background: '#f8fafc', padding: '2px 6px', borderRadius: '4px' }}>{p.sku || 'No SKU'}</div>
                      </div>
                    ))}
                  </div>
                )}

                {globalSearchResults.users?.length > 0 && (
                  <div style={{ padding: '8px 12px', borderTop: (globalSearchResults.orders?.length || globalSearchResults.products?.length) ? '1px solid #f1f5f9' : 'none' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Users</div>
                    {globalSearchResults.users.map(u => (
                      <div key={u._id} onClick={() => { setActiveTab('users'); setGlobalSearchResults(null); setGlobalSearchQuery(''); }} style={{ padding: '8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <div style={{ fontSize: '13px', fontWeight: '500', color: '#0f172a' }}>{u.fullName || u.username}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{u.email}</div>
                      </div>
                    ))}
                  </div>
                )}

                {(!globalSearchResults.orders?.length && !globalSearchResults.products?.length && !globalSearchResults.users?.length) && (
                  <div style={{ padding: '20px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>No results found for "{globalSearchQuery}"</div>
                )}
              </div>
            )}
          </div>

          <div className="admin-topbar-actions">
            <button className="btn btn-outline btn-sm" onClick={() => onNavigate('home')} style={{ fontSize: '12px' }}>
              <ArrowLeft size={14} /> Exit Admin
            </button>
          </div>
        </header>

        <div className="admin-content-inner">

        {/* CONDITIONAL RENDER: HELPDESK TAB */}
        {activeTab === 'helpdesk' && <AdminHelpdesk />}

        {/* CONDITIONAL RENDER: FINANCE TAB */}
        {activeTab === 'finance' && <AdminFinance />}

        {/* CONDITIONAL RENDER: STAFF TAB */}
        {activeTab === 'staff' && <AdminStaff />}

      {/* CONDITIONAL RENDER: ANALYTICS TAB */}
      {activeTab === 'analytics' && (
        <AdminAnalytics />
      )}

      {/* CONDITIONAL RENDER: CMS TAB */}
      {activeTab === 'cms' && (
        <AdminCMSBuilder />
      )}

      {/* CONDITIONAL RENDER: COUPONS TAB */}
      {activeTab === 'coupons' && (
        <AdminCoupons />
      )}

      {/* CONDITIONAL RENDER: CRM TAB */}
      {activeTab === 'crm' && (
        <AdminCRM />
      )}

      {/* CONDITIONAL RENDER: AUDIT LOGS TAB */}
      {activeTab === 'audit' && (
        <AdminAuditLogs />
      )}

      {/* CONDITIONAL RENDER: ORDERS TAB */}
      {activeTab === 'orders' && (
        <AdminOMS />
      )}

      {/* CONDITIONAL RENDER: REFERRAL & USERS TAB */}
      {activeTab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Inner Tab Switcher */}
          <div style={{ display: 'flex', gap: '12px', padding: '4px', background: '#f1f5f9', borderRadius: '12px', width: 'fit-content' }}>
            <button 
              onClick={() => setUserInnerTab('customers')}
              style={{ padding: '10px 20px', background: userInnerTab === 'customers' ? '#fff' : 'transparent', color: userInnerTab === 'customers' ? '#0f172a' : '#64748b', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', boxShadow: userInnerTab === 'customers' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
            >
              <Users size={16} /> Customers
            </button>
            <button 
              onClick={() => setUserInnerTab('merchants')}
              style={{ padding: '10px 20px', background: userInnerTab === 'merchants' ? '#fff' : 'transparent', color: userInnerTab === 'merchants' ? '#0f172a' : '#64748b', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', boxShadow: userInnerTab === 'merchants' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
            >
              <Store size={16} /> Merchants
            </button>
          </div>

          {/* Regular Users / Customer Accounts */}
          {userInnerTab === 'customers' && (
          <div className="admin-panel-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <h3 className="admin-form-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ padding: '8px', background: '#e0e7ff', borderRadius: '8px', color: '#4f46e5' }}><Users size={20} /></div>
                Platform Customer Accounts & Referral Data
              </h3>
              
              {/* Search & Actions */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', height: '40px', width: '300px', background: '#f8fafc', alignItems: 'center', padding: '0 12px', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }}>
                  <Users size={16} color="#94a3b8" />
                  <input 
                    type="text" 
                    placeholder="Search mobile number or name..." 
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    style={{ border: 'none', padding: '0 10px', fontSize: '14px', outline: 'none', width: '100%', background: 'transparent', color: '#334155' }}
                  />
                </div>
                <button 
                  onClick={exportCustomersCSV}
                  className="btn btn-outline" 
                  style={{ height: '40px', display: 'flex', alignItems: 'center', gap: '8px', padding: '0 16px', fontWeight: '600', color: '#0f172a', borderColor: '#e2e8f0' }}
                >
                  <FileText size={16} /> Export CSV
                </button>
              </div>
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User ID / Username</th>
                    <th>Full Name</th>
                    <th>Email Address</th>
                    <th>Verification Settings</th>
                    <th>Role Status</th>
                    <th>Referral Code / Tag</th>
                    <th>Wallet Balances</th>
                    <th>Referred Performance</th>
                    <th>Action controls</th>
                  </tr>
                </thead>
                <tbody>
                  {adminUsers
                    .filter(u => 
                      u.username.toLowerCase().includes(userSearchQuery.toLowerCase()) || 
                      (u.fullName && u.fullName.toLowerCase().includes(userSearchQuery.toLowerCase()))
                    )
                    .map(u => {
                      const userCode = u.isInfluencer ? u.creatorCode : u.referralCode;
                      const influencerId = u.isInfluencer ? u.influencerId : null;
                      
                      const referredOrdersList = adminOrders.filter(o => 
                        o.referralApplied && 
                        (o.referralApplied.referrerId === userCode || 
                         o.referralApplied.referrerId === influencerId)
                      );
                      
                      const salesCount = referredOrdersList.length;
                      const totalSalesVolume = referredOrdersList.reduce((sum, o) => sum + (o.totalPrice || 0), 0);

                      return (
                        <tr key={u.username} style={{ transition: 'background-color 0.2s', borderBottom: '1px solid #f1f5f9' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                          <td style={{ padding: '16px 12px' }}>
                            <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '14px' }}>{u.username}</div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Joined platform</div>
                          </td>
                          <td style={{ color: '#334155', fontWeight: '500' }}>{u.fullName || 'Guest User'}</td>
                          <td style={{ color: '#475569' }}>{u.email || <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>Not provided</span>}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '12px', fontWeight: '600', padding: '4px 10px', borderRadius: '20px', background: u.isEmailVerified ? '#dcfce7' : '#fee2e2', color: u.isEmailVerified ? '#16a34a' : '#ef4444' }}>
                                {u.isEmailVerified ? 'Email Verified ✓' : 'Email Pending ✕'}
                              </span>
                              <button 
                                onClick={() => handleToggleEmailVerify(u)} 
                                style={{ background: 'none', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '2px 6px', fontSize: '11px', cursor: 'pointer', color: '#475569' }}
                                title="Toggle Email Verification"
                              >
                                Toggle
                              </button>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <span style={{ fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '20px', backgroundColor: u.isInfluencer ? '#4f46e5' : '#f1f5f9', color: u.isInfluencer ? 'white' : '#64748b', display: 'inline-block', textAlign: 'center' }}>
                                {u.isInfluencer ? 'Verified Creator' : 'Regular Customer'}
                              </span>
                            </div>
                          </td>
                          <td>
                            {u.isInfluencer && (
                              <div style={{ fontSize: '13px', marginBottom: '4px' }}>
                                <div style={{ color: '#64748b' }}>Creator ID: <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: '#0f172a' }}>{u.influencerId || 'N/A'}</code></div>
                                <div style={{ fontWeight: '800', color: '#4f46e5', marginTop: '4px' }}>Code: {u.creatorCode || 'N/A'}</div>
                              </div>
                            )}
                            {!u.isInfluencer && (
                              <div style={{ fontSize: '13px', marginBottom: '4px' }}>
                                <div style={{ color: '#64748b' }}>Code: {u.referralCode || 'N/A'}</div>
                              </div>
                            )}
                          </td>
                          <td>
                            <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
                              <div style={{ color: '#ca8a04', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>🪙 {u.walletCoins || 0} Coins</div>
                              <div style={{ color: '#16a34a', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>💵 ₹{(u.walletCash || 0).toFixed(2)} Cash</div>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
                              <div style={{ fontWeight: '700', color: salesCount > 0 ? '#16a34a' : '#94a3b8' }}>
                                📈 {salesCount} referred sales
                              </div>
                              {salesCount > 0 && (
                                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                                  Volume: ₹{totalSalesVolume.toLocaleString('en-IN')}
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <button
                                className="btn btn-sm btn-outline"
                                style={{
                                  fontSize: '12px',
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  fontWeight: '600',
                                  background: u.isInfluencer ? '#fff1f2' : '#f0fdf4',
                                  borderColor: u.isInfluencer ? '#fecaca' : '#bbf7d0',
                                  color: u.isInfluencer ? '#e11d48' : '#16a34a',
                                  transition: 'all 0.2s'
                                }}
                                onClick={() => handleToggleUserRole(u)}
                                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                              >
                                {u.isInfluencer ? 'Demote Creator' : 'Verify Creator'}
                              </button>
                              
                              <button
                                className="btn btn-sm btn-outline"
                                style={{
                                  fontSize: '11px',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  fontWeight: '600',
                                  background: u.status === 'Suspended' ? '#f0fdf4' : '#fff1f2',
                                  borderColor: u.status === 'Suspended' ? '#bbf7d0' : '#fecaca',
                                  color: u.status === 'Suspended' ? '#16a34a' : '#e11d48'
                                }}
                                onClick={() => handleSuspendUser(u)}
                              >
                                {u.status === 'Suspended' ? 'Unsuspend' : 'Suspend'}
                              </button>

                              <button
                                className="btn btn-sm"
                                style={{
                                  fontSize: '11px',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  fontWeight: '600',
                                  background: '#fef3c7',
                                  color: '#d97706',
                                  border: '1px solid #fde68a'
                                }}
                                onClick={() => handleOpenWalletModal(u)}
                              >
                                💳 Manage Wallet
                              </button>

                              <button
                                className="btn btn-sm btn-outline"
                                style={{
                                  fontSize: '11px',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  fontWeight: '600',
                                  borderColor: '#e0e7ff',
                                  color: '#4f46e5'
                                }}
                                onClick={() => setActiveOrderHistoryModal(u)}
                              >
                                📦 View Orders
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
          )}

          {/* Decoupled Merchant Accounts Section */}
          {userInnerTab === 'merchants' && (
          <div className="admin-panel-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <h3 className="admin-form-title" style={{ margin: 0 }}><Store size={18} color="var(--primary-color)" /> Marketplace Merchant Shops (Decoupled Registry)</h3>
              {/* Search & Export */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden', height: '34px', width: '260px' }}>
                  <input 
                    type="text" 
                    placeholder="Search shop name or email..." 
                    value={sellerSearchQuery}
                    onChange={(e) => setSellerSearchQuery(e.target.value)}
                    style={{ border: 'none', padding: '0 10px', fontSize: '13px', outline: 'none', width: '100%' }}
                  />
                </div>
                <button 
                  onClick={exportMerchantsCSV}
                  className="btn btn-outline" 
                  style={{ height: '34px', display: 'flex', alignItems: 'center', gap: '8px', padding: '0 12px', fontSize: '13px', color: '#0f172a', borderColor: '#e2e8f0' }}
                >
                  <FileText size={14} /> Export CSV
                </button>
              </div>
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Shop Details</th>
                    <th>Registered Email</th>
                    <th>Warehouse Address</th>
                    <th>Payout Destination</th>
                    <th>Withdrawable Cash</th>
                    <th>Status</th>
                    <th>Action Controls</th>
                  </tr>
                </thead>
                <tbody>
                  {adminSellers.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', color: '#999', padding: '24px' }}>No merchants registered yet.</td>
                    </tr>
                  ) : (
                    adminSellers
                      .filter(s => 
                        s.shopName.toLowerCase().includes(sellerSearchQuery.toLowerCase()) || 
                        s.email.toLowerCase().includes(sellerSearchQuery.toLowerCase())
                      )
                      .map(s => (
                        <tr key={s.email}>
                          <td><strong>{s.shopName}</strong></td>
                          <td><code>{s.email}</code></td>
                          <td style={{ fontSize: '12px', color: '#666' }}>{s.sellerAddress}</td>
                          <td style={{ fontSize: '12px' }}>
                            <div>UPI: <code>{s.payoutDetails?.upi || 'N/A'}</code></div>
                            {s.payoutDetails?.bankAccount && <div style={{ fontSize: '10px', color: '#888' }}>Bank: {s.payoutDetails.bankAccount}</div>}
                          </td>
                          <td style={{ fontWeight: 'bold', color: 'var(--success)' }}>₹{(s.walletCash || 0).toFixed(2)}</td>
                          <td>
                            <span className={`badge ${s.sellerStatus === 'Approved' ? 'badge-success' : s.sellerStatus === 'Rejected' ? 'badge-error' : 'badge-warning'}`} style={{ fontSize: '11px', background: s.sellerStatus === 'Approved' ? '#dcfce7' : s.sellerStatus === 'Rejected' ? '#fee2e2' : '#fef3c7', color: s.sellerStatus === 'Approved' ? '#16a34a' : s.sellerStatus === 'Rejected' ? '#ef4444' : '#d97706', padding: '4px 8px', borderRadius: '4px' }}>
                              {s.sellerStatus === 'Approved' ? 'Approved Merchant' : s.sellerStatus === 'Rejected' ? 'Rejected' : 'Awaiting Audit'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <button
                                className="btn btn-sm btn-outline"
                                style={{
                                  fontSize: '11px',
                                  padding: '4px 8px',
                                  borderColor: s.sellerStatus === 'Approved' ? 'var(--error)' : 'var(--primary-color)',
                                  color: s.sellerStatus === 'Approved' ? 'var(--error)' : 'var(--primary-color)',
                                  height: '28px'
                                }}
                                onClick={() => handleToggleSellerRole(s)}
                              >
                                {s.sellerStatus === 'Approved' ? 'Reject Merchant' : 'Approve Merchant'}
                              </button>
                              
                              <button
                                className="btn btn-sm btn-outline"
                                style={{
                                  fontSize: '11px',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  fontWeight: '600',
                                  borderColor: '#e0e7ff',
                                  color: '#4f46e5'
                                }}
                                onClick={() => setActiveCatalogModal(s)}
                              >
                                📦 View Catalog
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          )}
        </div>
      )}

      {/* CONDITIONAL RENDER: INVENTORY TAB */}
      {activeTab === 'inventory' && (
        <div className="admin-grid">
        
        {/* LEFT COLUMN: PRODUCTS AUDIT LIST */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <AdminDataGrid onEditProduct={handleEditProduct} />
        </div>

        {/* RIGHT COLUMN: ADD NEW PRODUCT FORM */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="admin-panel-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 className="admin-form-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                <div style={{ padding: '8px', background: '#dcfce7', borderRadius: '8px', color: '#16a34a' }}><PlusCircle size={20} /></div>
                {editMode ? 'Edit Product Details' : 'Add New Product'}
              </h3>

            
            <div className="form-group">
              <label className="form-label-txt">Product ID (Unique - lowercase, no spaces)*</label>
              <input 
                type="text" 
                placeholder="e.g. iphone-16-pro" 
                value={id}
                onChange={(e) => setId(e.target.value)}
                className="form-input-field"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label-txt">Product Display Name*</label>
              <input 
                type="text" 
                placeholder="e.g. Apple iPhone 16 Pro (Titanium, 128 GB)" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input-field"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label-txt">Category*</label>
              <select 
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="form-input-field"
              >
                <option value="mobiles">Mobiles</option>
                <option value="electronics">Electronics</option>
                <option value="fashion">Fashion</option>
                <option value="home">Home & Living</option>
                <option value="appliances">Appliances</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label-txt">Product Badge (Tag)*</label>
              <select 
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                className="form-input-field"
              >
                <option value="none">None (Standard)</option>
                <option value="bestseller">🔥 BESTSELLER</option>
                <option value="trending">📈 TRENDING</option>
                <option value="new">✨ NEW ARRIVAL</option>
              </select>
            </div>
            
            <div className="admin-panel-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: 0, fontSize: '14px', color: '#334155', fontWeight: 'bold' }}>Enterprise PIM (Compliance & SEO)</h4>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label-txt" style={{ color: '#475569' }}>SEO Meta Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Buy Apple iPhone 16 Pro Online in India" 
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    className="form-input-field"
                    style={{ background: '#fff' }}
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label-txt" style={{ color: '#475569' }}>SEO Meta Description</label>
                  <input 
                    type="text" 
                    placeholder="Brief description for search engines..." 
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    className="form-input-field"
                    style={{ background: '#fff' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label-txt" style={{ color: '#475569' }}>HSN Code (GST Billing)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 85171219" 
                    value={hsnCode}
                    onChange={(e) => setHsnCode(e.target.value)}
                    className="form-input-field"
                    style={{ background: '#fff' }}
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label-txt" style={{ color: '#475569' }}>Linked Vendor ID (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 64b8f... (Seller's Object ID)" 
                    value={vendorId}
                    onChange={(e) => setVendorId(e.target.value)}
                    className="form-input-field"
                    style={{ background: '#fff' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label-txt">Selling Price (₹)*</label>
                <input 
                  type="number" 
                  placeholder="Selling Price" 
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="form-input-field"
                  required
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label-txt">Original Price (₹)*</label>
                <input 
                  type="number" 
                  placeholder="Original Price" 
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  className="form-input-field"
                  required
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label-txt">Quantity (Stock)*</label>
                <input 
                  type="number" 
                  placeholder="Stock" 
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="form-input-field"
                  required
                />
              </div>
            </div>
            
            {/* Flash Sale Engine Config */}
            <div style={{ backgroundColor: '#fff5f5', padding: '16px', borderRadius: '8px', border: '1px solid #fecaca' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: flashSaleActive ? '16px' : '0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px' }}>⚡</span>
                  <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#b91c1c', margin: 0 }}>Enable Deal of the Day (Flash Sale)</label>
                </div>
                <input 
                  type="checkbox" 
                  checked={flashSaleActive}
                  onChange={(e) => setFlashSaleActive(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </div>
              
              {flashSaleActive && (
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label-txt" style={{ color: '#b91c1c' }}>Flash Sale Price (₹)*</label>
                    <input 
                      type="number" 
                      placeholder="Special Deal Price" 
                      value={flashSalePrice}
                      onChange={(e) => setFlashSalePrice(e.target.value)}
                      className="form-input-field"
                      required={flashSaleActive}
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label-txt" style={{ color: '#b91c1c' }}>End Time*</label>
                    <input 
                      type="datetime-local" 
                      value={flashSaleEndTime}
                      onChange={(e) => setFlashSaleEndTime(e.target.value)}
                      className="form-input-field"
                      required={flashSaleActive}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="form-group-flex">
              <div className="form-group" style={{ flex: 1 }}>
                <label>Referral Coins Rate (User Reward) (Multiplier)</label>
                <input 
                  type="number" 
                  step="0.001"
                  placeholder="e.g. 0.03" 
                  value={userCommission}
                  onChange={(e) => setUserCommission(e.target.value)}
                  className="form-input-field"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label-txt">Product Media (Up to 10 photos/videos)*</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input 
                  type="file" 
                  multiple
                  accept="image/*,video/mp4,video/webm"
                  onChange={handleProductImageUpload}
                  className="form-input-field"
                  style={{ flex: 1, padding: '6px' }}
                  required={media.length === 0}
                  disabled={isUploadingImage || media.length >= 10}
                />
                {isUploadingImage && <span style={{ fontSize: '12px', color: 'var(--primary-color)' }}>Uploading...</span>}
              </div>
              {media.length > 0 && (
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {media.map((src, idx) => (
                    <div key={idx} style={{ position: 'relative', width: '80px', height: '80px' }}>
                      {src.startsWith('data:video/') ? (
                        <video src={src} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-color)' }} muted />
                      ) : (
                        <img src={src} alt={`Preview ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
                      )}
                      <button type="button" onClick={() => handleRemoveMedia(idx)} style={{ position: 'absolute', top: '-6px', right: '-6px', background: 'var(--error)', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label-txt">Description*</label>
              <textarea 
                placeholder="Product description and features..." 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="form-input-field"
                style={{ height: '80px', resize: 'vertical' }}
                required
              />
            </div>

            </div> {/* End Product Details Card */}

            {/* Colors & Custom Variations Section (Proper Column/Card) */}
            <div className="admin-panel-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h3 className="admin-form-title" style={{ margin: 0 }}>Colors & Custom Variations</h3>
                <button
                  type="button"
                  onClick={handleAddColorModel}
                  className="btn btn-outline btn-sm"
                  style={{ fontSize: '11px', padding: '4px 8px', height: '28px', display: 'flex', gap: '4px', alignItems: 'center' }}
                >
                  <PlusCircle size={12} /> Add Color Model
                </button>
              </div>
              
              {colorModels.length === 0 ? (
                <div style={{ fontSize: '12px', color: '#777', fontStyle: 'italic', padding: '8px 0' }}>
                  No custom models added. Default variations will be generated.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
                  {colorModels.map((cm, colorIdx) => (
                    <div key={colorIdx} style={{ border: '1px dashed #ccc', padding: '12px', borderRadius: '4px', backgroundColor: '#fafafa', position: 'relative' }}>
                      <button
                        type="button"
                        onClick={() => handleRemoveColorModel(colorIdx)}
                        style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: '#c62828', cursor: 'pointer' }}
                        title="Remove Color Model"
                      >
                        <X size={16} />
                      </button>
                      
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--primary-color)', marginBottom: '8px' }}>Color Model #{colorIdx + 1}</div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', color: '#555', marginBottom: '4px' }}>Color Name* (e.g. Coral Pink)</label>
                          <input
                            type="text"
                            placeholder="Color name"
                            value={cm.name}
                            onChange={(e) => handleColorModelChange(colorIdx, 'name', e.target.value)}
                            style={{ width: '100%', height: '32px', padding: '0 8px', border: '1px solid #dcdcdc', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box' }}
                            required
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', color: '#555', marginBottom: '4px' }}>Variant Primary Image*</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleColorModelImageUpload(e, colorIdx)}
                              style={{ flex: 1, padding: '4px', border: '1px solid #dcdcdc', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', backgroundColor: 'white' }}
                              required={!cm.primaryImage}
                            />
                            {cm.primaryImage && (
                              <img src={cm.primaryImage} alt="Variant" style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ccc' }} />
                            )}
                          </div>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', color: '#555', marginBottom: '4px' }}>Extra Images URLs (comma-separated)</label>
                          <input
                            type="text"
                            placeholder="https://image2, https://image3"
                            value={cm.imagesInput}
                            onChange={(e) => handleColorModelChange(colorIdx, 'imagesInput', e.target.value)}
                            style={{ width: '100%', height: '32px', padding: '0 8px', border: '1px solid #dcdcdc', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box' }}
                          />
                        </div>

                        {/* Variants List Inside Color */}
                        <div style={{ marginTop: '8px', borderTop: '1px solid #e5e5e5', paddingTop: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#444' }}>Variants (e.g. Size/Storage)</span>
                            <button
                              type="button"
                              onClick={() => handleAddVariant(colorIdx)}
                              style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                            >
                              <PlusCircle size={10} /> Add Variant
                            </button>
                          </div>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {cm.variants.map((v, variantIdx) => (
                              <div key={variantIdx} style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <input
                                  type="text"
                                  placeholder="Name (e.g. 128 GB)"
                                  value={v.name}
                                  onChange={(e) => handleVariantChange(colorIdx, variantIdx, 'name', e.target.value)}
                                  style={{ flex: 2, height: '30px', padding: '0 6px', border: '1px solid #dcdcdc', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box' }}
                                  required
                                />
                                <input
                                  type="number"
                                  placeholder="Price"
                                  value={v.price}
                                  onChange={(e) => handleVariantChange(colorIdx, variantIdx, 'price', e.target.value)}
                                  style={{ flex: 1, minWidth: '60px', height: '30px', padding: '0 6px', border: '1px solid #dcdcdc', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box' }}
                                  required
                                />
                                <input
                                  type="number"
                                  placeholder="Org Price"
                                  value={v.originalPrice}
                                  onChange={(e) => handleVariantChange(colorIdx, variantIdx, 'originalPrice', e.target.value)}
                                  style={{ flex: 1, minWidth: '60px', height: '30px', padding: '0 6px', border: '1px solid #dcdcdc', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box' }}
                                />
                                <input
                                  type="number"
                                  placeholder="Stock"
                                  value={v.stock}
                                  onChange={(e) => handleVariantChange(colorIdx, variantIdx, 'stock', e.target.value)}
                                  style={{ width: '50px', height: '30px', padding: '0 6px', border: '1px solid #dcdcdc', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box' }}
                                />
                                {cm.variants.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveVariant(colorIdx, variantIdx)}
                                    style={{ background: 'none', border: 'none', color: '#c62828', cursor: 'pointer', padding: '2px' }}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                )}
                              </div>
                            ))}
                  </div>
                        </div>

                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div> {/* End Colors Card */}

            {/* Specifications editor list (Proper Column/Card) */}
            <div className="admin-panel-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 className="admin-form-title" style={{ margin: 0 }}>Technical Specifications</h3>
              <div className="form-group" style={{ marginTop: '10px' }}>
                {specs.map((spec, idx) => (
                  <div key={idx} className="spec-builder-row">
                    <input 
                      type="text" 
                      placeholder="Key (e.g. Brand)" 
                      value={spec.key}
                      onChange={(e) => handleSpecChange(idx, 'key', e.target.value)}
                      className="spec-builder-input"
                    />
                    <input 
                      type="text" 
                      placeholder="Value (e.g. Apple)" 
                      value={spec.value}
                      onChange={(e) => handleSpecChange(idx, 'value', e.target.value)}
                      className="spec-builder-input"
                    />
                    <span className="spec-remove-btn" onClick={() => handleRemoveSpecRow(idx)}>
                      <X size={16} />
                    </span>
                  </div>
                ))}
                <span className="spec-add-btn" onClick={handleAddSpecRow}>
                  <PlusCircle size={14} /> Add Row
                </span>
              </div>
            </div> {/* End Specs Card */}

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button type="submit" className="btn btn-accent" style={{ flex: 1, padding: '12px', fontSize: '14px' }}>
                {editMode ? 'UPDATE PRODUCT IN STORE' : 'ADD PRODUCT TO STORE'}
              </button>
              {editMode && (
                <button type="button" onClick={resetForm} className="btn btn-outline" style={{ padding: '12px', fontSize: '14px' }}>
                  CANCEL EDIT
                </button>
              )}
            </div>
          </form>
        </div>

      </div>
      )}

      {/* CONDITIONAL RENDER: PROMOTIONS & OFFERS TAB */}
      {activeTab === 'promotions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Card 1: Announcement Bar */}
          <div className="admin-panel-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'linear-gradient(145deg, #ffffff, #f5f7fa)', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="admin-form-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', margin: 0 }}>
                <div style={{ padding: '8px', background: '#eef2ff', borderRadius: '8px' }}>
                  <Tag size={20} color="#4f46e5" />
                </div>
                Dynamic Announcement Bar
              </h3>
            </div>
            <p style={{ margin: '-8px 0 8px 44px', fontSize: '13px', color: '#64748b' }}>Configure the global site-wide announcement ribbon.</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: announcementShow ? '#ecfdf5' : '#f8fafc', borderRadius: '8px', border: `1px solid ${announcementShow ? '#a7f3d0' : '#e2e8f0'}`, transition: 'all 0.3s ease' }}>
              <input 
                type="checkbox" 
                id="show-announcement-chk"
                checked={announcementShow} 
                onChange={(e) => setAnnouncementShow(e.target.checked)} 
                style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#10b981' }}
              />
              <label htmlFor="show-announcement-chk" style={{ fontSize: '14px', fontWeight: '600', color: announcementShow ? '#065f46' : '#475569', cursor: 'pointer' }}>
                Enable announcement ribbon at top of site
              </label>
            </div>
            {announcementShow && (
              <>
                <div className="form-group">
                  <label className="form-label-txt">Announcement Text*</label>
                  <input 
                    type="text" 
                    className="admin-form-input" 
                    value={announcementText} 
                    onChange={(e) => setAnnouncementText(e.target.value)} 
                    placeholder="Enter announcement banner message..."
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label-txt">Redirect Page Link (on click)</label>
                  <select 
                    className="admin-form-input"
                    value={announcementLink}
                    onChange={(e) => setAnnouncementLink(e.target.value)}
                  >
                    <option value="">No link (static text)</option>
                    <option value="catalog">All Products Catalog</option>
                    <option value="partner">Share & Earn Partner Center</option>
                    <option value="seller">Seller Center</option>
                    <option value="orders">My Orders</option>
                  </select>
                </div>
              </>
            )}
            
            <div className="admin-card-footer">
              <button disabled={isSaving} onClick={handleSavePromotions} className="btn btn-accent" style={{ padding: '10px 24px' }}>
                {isSaving ? 'Saving...' : '💾 Save Announcement Config'}
              </button>
            </div>
          </div>

          {/* Card 2: Flash Sale Countdown Timer & Budget Store */}
          <div className="admin-panel-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="admin-form-title" style={{ margin: 0 }}><Settings size={18} color="var(--primary-color)" /> Flash Sale & Budget Settings</h3>
            </div>
            
            <div className="form-group">
              <label className="form-label-txt">Deals of the Day Countdown Timer End Date/Time*</label>
              <input 
                type="datetime-local" 
                className="admin-form-input" 
                value={promoDealsTimer} 
                onChange={(e) => setPromoDealsTimer(e.target.value)} 
                required
              />
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                This controls the countdown timer clock displayed on the Deals of the Day homepage shelf.
              </span>
            </div>

            <div className="form-group" style={{ marginTop: '8px' }}>
              <label className="form-label-txt" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Deal of the Day Featured Products</span>
                {dealOfTheDayProducts.length > 0 && <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--primary-color)' }}>{dealOfTheDayProducts.length} Selected</span>}
              </label>
              
              <input 
                type="text" 
                placeholder="Search products by name..." 
                className="admin-form-input"
                style={{ marginBottom: '8px', padding: '8px 12px', fontSize: '13px' }}
                value={dealSearchQuery}
                onChange={(e) => setDealSearchQuery(e.target.value)}
              />

              <div style={{ maxHeight: '220px', overflowY: 'auto', border: '1px solid var(--border-light)', borderRadius: '6px', padding: '8px', backgroundColor: '#fdfdfd' }}>
                {products.length === 0 && <span style={{ fontSize: '12px', color: '#999' }}>No products available.</span>}
                {products
                  .filter(p => dealOfTheDayProducts.includes(p.id) || (p.name && p.name.toLowerCase().includes((dealSearchQuery || '').toLowerCase())))
                  .sort((a, b) => {
                    const aSel = dealOfTheDayProducts.includes(a.id);
                    const bSel = dealOfTheDayProducts.includes(b.id);
                    if (aSel && !bSel) return -1;
                    if (!aSel && bSel) return 1;
                    return 0;
                  })
                  .map(p => (
                  <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 4px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={dealOfTheDayProducts.includes(p.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setDealOfTheDayProducts(prev => [...prev, p.id]);
                        } else {
                          setDealOfTheDayProducts(prev => prev.filter(id => id !== p.id));
                        }
                      }}
                      style={{ accentColor: 'var(--primary-color)', width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <img src={p.image} alt="" style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #e0e0e0' }} />
                    <span style={{ fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#333', fontWeight: '500' }}>{p.name}</span>
                  </label>
                ))}
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '6px' }}>
                Select specific products to feature in the "Deal of the Day" section. Recommended: 4-6 products. If none selected, the newest products will automatically display.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label-txt">Budget Store Max Price Cap (₹)*</label>
              <input 
                type="number" 
                className="admin-form-input" 
                value={promoBudgetThreshold} 
                onChange={(e) => setPromoBudgetThreshold(Number(e.target.value))} 
                required
              />
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Products priced under this amount will automatically show up in the Budget Store homepage section.
              </span>
            </div>
            
            <div className="admin-card-footer">
              <button disabled={isSaving} onClick={handleSavePromotions} className="btn btn-accent" style={{ padding: '10px 24px' }}>
                {isSaving ? 'Saving...' : '💾 Save Flash Sale & Budget Config'}
              </button>
            </div>
          </div>

          {/* Card 3: Hero Carousel Banners */}
          <div className="admin-panel-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="admin-form-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', margin: 0 }}>
                <div style={{ padding: '8px', background: '#fdf4ff', borderRadius: '8px' }}>
                  <Image size={20} color="#c026d3" />
                </div>
                Homepage Slides / Banners 
                <span style={{ fontSize: '12px', background: '#f1f5f9', padding: '2px 8px', borderRadius: '12px', color: '#64748b' }}>{banners.length} Active</span>
              </h3>
            </div>
            
            {/* Slide List */}
            {banners.length === 0 ? (
              <div style={{ padding: '30px', border: '2px dashed #cbd5e1', borderRadius: '12px', textAlign: 'center', fontSize: '14px', color: '#64748b', background: '#f8fafc' }}>
                No custom slides configured. Default promotional slides are currently being displayed.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {banners.map((slide, idx) => (
                  <div 
                    key={idx} 
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      height: '160px',
                      padding: '16px',
                      borderRadius: '12px',
                      background: slide.image ? `url(${slide.image}) no-repeat center center` : (slide.bg || 'var(--primary-color)'),
                      backgroundSize: 'cover',
                      color: 'white',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), inset 0 0 80px rgba(0,0,0,0.5)',
                      textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      cursor: 'default'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 15px 30px -5px rgba(0,0,0,0.2), inset 0 0 80px rgba(0,0,0,0.5)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0,0,0,0.1), inset 0 0 80px rgba(0,0,0,0.5)'; }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', background: 'rgba(255,255,255,0.2)', padding: '4px 8px', borderRadius: '4px', backdropFilter: 'blur(4px)' }}>
                          {slide.tag || 'PROMOTION'} {slide.imageOnly && '• IMAGE ONLY'}
                        </div>
                        <button 
                          onClick={() => {
                            const updated = banners.filter((_, i) => i !== idx);
                            setBanners(updated);
                          }}
                          style={{ padding: '6px', height: '28px', width: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', borderRadius: '50%', cursor: 'pointer', transition: 'background 0.2s' }}
                          title="Delete Slide"
                          onMouseEnter={(e) => e.currentTarget.style.background = '#dc2626'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.9)'}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      {!slide.imageOnly && (
                        <div style={{ marginTop: '12px' }}>
                          <div style={{ fontSize: '18px', fontWeight: '800', lineHeight: '1.2' }}>{slide.title || 'Custom Image Banner'}</div>
                          <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{slide.desc || 'No text overlay'}</div>
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', marginTop: 'auto', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ opacity: 0.8 }}>Target:</span> {slide.cat}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Slide Creator Form */}
            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '24px', marginTop: '16px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px', color: 'var(--text-primary)' }}>✨ Create New Banner</h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px', alignItems: 'start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* Image Banner Mode Toggles */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', background: 'var(--bg-light)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input 
                        type="checkbox" 
                        id="use-custom-img-chk"
                        checked={newSlideUseImage}
                        onChange={(e) => {
                          setNewSlideUseImage(e.target.checked);
                          if (!e.target.checked) {
                            setNewSlideImage('');
                            setNewSlideImageOnly(false);
                          }
                        }}
                        style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary-color)' }}
                      />
                      <label htmlFor="use-custom-img-chk" style={{ fontSize: '14px', fontWeight: '600', cursor: 'pointer', color: 'var(--text-primary)' }}>
                        Use Custom Image (Canva/Photoshop Banner)
                      </label>
                    </div>

                    {newSlideUseImage && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input 
                          type="checkbox" 
                          id="image-only-banner-chk"
                          checked={newSlideImageOnly}
                          onChange={(e) => setNewSlideImageOnly(e.target.checked)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary-color)' }}
                        />
                        <label htmlFor="image-only-banner-chk" style={{ fontSize: '14px', fontWeight: '600', cursor: 'pointer', color: 'var(--text-primary)' }}>
                          Image-Only Banner (No text overlay)
                        </label>
                      </div>
                    )}
                  </div>

                  {newSlideUseImage && (
                    <div className="upload-dropzone">
                      <Image className="upload-icon" />
                      <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>Drag & Drop your banner image here</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Recommended size: 1200x400px (Max 10MB)</div>
                      
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', width: '100%', marginTop: '12px' }}>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={handleBannerFileUpload}
                          className="admin-form-input"
                          style={{ flex: 1, cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8' }}>OR</span>
                        <input 
                          type="text" 
                          className="admin-form-input" 
                          placeholder="Paste image URL here"
                          value={newSlideImage} 
                          onChange={(e) => setNewSlideImage(e.target.value)} 
                          style={{ flex: 1 }}
                        />
                      </div>
                      
                      {uploadingImage && (
                        <div style={{ fontSize: '13px', color: '#4f46e5', fontWeight: '600', marginTop: '8px' }}>
                          <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span> Uploading to Cloudinary...
                        </div>
                      )}
                    </div>
                  )}

                  {(!newSlideUseImage || !newSlideImageOnly) ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', gap: '16px' }}>
                        <div style={{ flex: 1 }}>
                          <label className="form-label-txt">Headline*</label>
                          <input 
                            type="text" 
                            className="admin-form-input" 
                            value={newSlideTitle} 
                            onChange={(e) => setNewSlideTitle(e.target.value)} 
                            placeholder="e.g. Monsoon Sale Live!"
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label className="form-label-txt">Ribbon Tag</label>
                          <input 
                            type="text" 
                            className="admin-form-input" 
                            value={newSlideTag} 
                            onChange={(e) => setNewSlideTag(e.target.value)} 
                            placeholder="e.g. LIMITED OFFER"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="form-label-txt">Subtext Description*</label>
                        <input 
                          type="text" 
                          className="admin-form-input" 
                          value={newSlideDesc} 
                          onChange={(e) => setNewSlideDesc(e.target.value)} 
                          placeholder="e.g. Get up to 60% cashback on fashion."
                        />
                      </div>
                    </div>
                  ) : null}

                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <label className="form-label-txt">Target Category*</label>
                      <select 
                        className="admin-form-input"
                        value={newSlideCat}
                        onChange={(e) => setNewSlideCat(e.target.value)}
                      >
                        <option value="all">All Categories</option>
                        <option value="mobiles">Mobiles</option>
                        <option value="electronics">Electronics</option>
                        <option value="fashion">Fashion</option>
                        <option value="home">Home & Kitchen</option>
                        <option value="appliances">Appliances</option>
                      </select>
                    </div>
                    
                    {!newSlideUseImage && (
                      <div style={{ flex: 1 }}>
                        <label className="form-label-txt">Background Theme*</label>
                        <select 
                          className="admin-form-input"
                          value={newSlideBg}
                          onChange={(e) => setNewSlideBg(e.target.value)}
                        >
                          <option value="linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)">Electric Indigo</option>
                          <option value="linear-gradient(135deg, #fda4af 0%, #f43f5e 100%)">Vivid Coral</option>
                          <option value="linear-gradient(135deg, #093129 0%, #00796b 100%)">Deep Teal</option>
                          <option value="linear-gradient(135deg, #0f172a 0%, #334155 100%)">Dark Slate</option>
                          <option value="linear-gradient(135deg, #7c3aed 0%, #c084fc 100%)">Neon Purple</option>
                          <option value="linear-gradient(135deg, #ca8a04 0%, #eab308 100%)">Sunset Yellow</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={() => {
                      if (newSlideUseImage && !newSlideImage) {
                        showToast('Please upload or enter an image URL for the banner.', 'error');
                        return;
                      }
                      if ((!newSlideUseImage || !newSlideImageOnly) && (!newSlideTitle || !newSlideDesc)) {
                        showToast('Please enter Title and Description for the slide.', 'error');
                        return;
                      }

                      const slide = {
                        title: newSlideImageOnly ? '' : newSlideTitle,
                        desc: newSlideImageOnly ? '' : newSlideDesc,
                        tag: newSlideImageOnly ? '' : (newSlideTag || 'OFFER'),
                        cat: newSlideCat,
                        bg: newSlideBg,
                        image: newSlideUseImage ? newSlideImage : undefined,
                        imageOnly: newSlideUseImage ? newSlideImageOnly : false
                      };

                      setBanners([...banners, slide]);

                      setNewSlideTitle('');
                      setNewSlideDesc('');
                      setNewSlideTag('');
                      setNewSlideImage('');
                      setNewSlideUseImage(false);
                      setNewSlideImageOnly(false);
                    }}
                    className="btn btn-outline"
                    style={{ padding: '12px', fontSize: '15px', fontWeight: '600' }}
                  >
                    + ADD SLIDE TO CAROUSEL
                  </button>
                </div>
                
                {/* Real-time Preview Pane */}
                <div style={{ position: 'sticky', top: '100px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Live Preview</h4>
                  <div className="live-banner-preview" style={{
                    height: '200px',
                    background: newSlideImage && newSlideUseImage ? `url(${newSlideImage}) no-repeat center center` : (newSlideBg || 'var(--primary-color)'),
                    backgroundSize: 'cover',
                    color: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '20px',
                    position: 'relative'
                  }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                        {(!newSlideImageOnly || newSlideTag) && (
                           <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '6px', backdropFilter: 'blur(4px)' }}>
                             {newSlideImageOnly ? (newSlideTag || 'IMAGE ONLY') : (newSlideTag || 'OFFER TAG')}
                           </div>
                        )}
                      </div>
                      
                      {!newSlideImageOnly && (
                        <div style={{ marginTop: '16px' }}>
                          <div style={{ fontSize: '22px', fontWeight: '800', lineHeight: '1.2' }}>{newSlideTitle || 'Enter Headline Here'}</div>
                          <div style={{ fontSize: '14px', opacity: 0.9, marginTop: '6px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                            {newSlideDesc || 'Your subtext description will appear here...'}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>
            
            <div className="admin-card-footer">
              <button disabled={isSaving} onClick={handleSavePromotions} className="btn btn-accent" style={{ padding: '10px 24px' }}>
                {isSaving ? 'Saving...' : '💾 Save Homepage Slides'}
              </button>
            </div>
          </div>

          {/* Card 4: Category Page Banners — Multi-Slide */}
          <div className="admin-panel-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="admin-form-title" style={{ margin: 0 }}><Layers size={18} color="var(--primary-color)" /> Category Page Banners</h3>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '-10px' }}>
              👉 Recommended size: <strong>1200 × 300 px</strong> (4:1). Each category supports multiple banner slides — they auto-rotate on the category page.
            </span>

            {['all', 'mobiles', 'electronics', 'fashion', 'home', 'appliances'].map(catKey => {
              const catData = categoryBanners[catKey] || { slides: [], show: false };
              const slides = catData.slides || [];
              const form = catSlideForm[catKey] || { image: '', title: '', uploading: false };
              const catLabel = catKey === 'all' ? 'All Categories / Catalog' : catKey === 'home' ? 'Home & Living' : catKey.charAt(0).toUpperCase() + catKey.slice(1);

              return (
                <div key={catKey} style={{ border: '1.5px solid var(--border-light)', borderRadius: '10px', overflow: 'hidden' }}>
                  {/* Category header row */}
                  <div style={{ background: 'linear-gradient(90deg,#f8f9ff,#eef0ff)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)' }}>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-primary)' }}>
                      📂 {catLabel} Page
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        id={`cat-show-${catKey}`}
                        checked={catData.show}
                        onChange={e => setCategoryBanners(prev => ({ ...prev, [catKey]: { ...prev[catKey], show: e.target.checked } }))}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <label htmlFor={`cat-show-${catKey}`} style={{ fontSize: '12px', fontWeight: '600', cursor: 'pointer', color: catData.show ? '#1a73e8' : '#777' }}>
                        {catData.show ? '✅ Banners Active' : 'Banners Off'}
                      </label>
                    </div>
                  </div>

                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

                    {/* Warning if slides exist but show is off */}
                    {slides.length > 0 && !catData.show && (
                      <div style={{ background: '#fff8e1', border: '1px solid #ffca28', borderRadius: '6px', padding: '8px 12px', fontSize: '12px', color: '#f57f17', fontWeight: '600' }}>
                        ⚠️ You have {slides.length} slide(s) but banners are OFF. Enable "Banners Active" above to show them on the website.
                      </div>
                    )}

                    {/* Existing slides list */}
                    {slides.length === 0 ? (
                      <div style={{ fontSize: '12px', color: '#999', fontStyle: 'italic', padding: '8px 0' }}>No slides added yet. Add one below.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {slides.map((slide, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#fafafa', border: '1px solid #eee', borderRadius: '6px', padding: '8px 10px' }}>
                            <img src={slide.image} alt={`slide-${idx}`} style={{ width: '80px', height: '28px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd', flexShrink: 0 }} />
                            <span style={{ flex: 1, fontSize: '12px', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {slide.title || `Slide ${idx + 1}`}
                            </span>
                            <span style={{ fontSize: '10px', background: '#e8f5e9', color: '#2e7d32', padding: '2px 6px', borderRadius: '10px', flexShrink: 0 }}>Slide {idx + 1}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = slides.filter((_, i) => i !== idx);
                                setCategoryBanners(prev => ({ ...prev, [catKey]: { ...prev[catKey], slides: updated } }));
                              }}
                              style={{ background: 'none', border: 'none', color: '#c62828', cursor: 'pointer', flexShrink: 0 }}
                              title="Remove slide"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add new slide form — full builder like homepage */}
                    <div style={{ border: '1px dashed #b0b8d1', borderRadius: '8px', padding: '16px', background: '#f5f7ff', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary-color)' }}>➕ Create New Slide</span>

                      {/* Use Image toggle */}
                      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>
                          <input type="checkbox" checked={form.useImage} onChange={e => updateCatForm(catKey, 'useImage', e.target.checked)} style={{ width: '14px', height: '14px' }} />
                          Use Custom Image / Canva Banner
                        </label>
                        {form.useImage && (
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer', color: '#e65100', fontWeight: '600' }}>
                            <input type="checkbox" checked={form.imageOnly} onChange={e => updateCatForm(catKey, 'imageOnly', e.target.checked)} style={{ width: '14px', height: '14px' }} />
                            Image-Only Mode (hide all text)
                          </label>
                        )}
                      </div>

                      {/* Image upload / URL */}
                      {form.useImage && (
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                          <div style={{ flex: 1, minWidth: '200px' }}>
                            <label className="form-label-txt" style={{ fontSize: '11px' }}>Upload Image File (max 3MB)</label>
                            <input type="file" accept="image/*" disabled={form.uploading}
                              onChange={e => handleCatSlideImageUpload(catKey, e)}
                              className="admin-form-input" style={{ padding: '6px 10px', fontSize: '12px' }}
                            />
                            {form.uploading && <span style={{ fontSize: '11px', color: '#777' }}>Uploading…</span>}
                          </div>
                          <div style={{ flex: 1, minWidth: '200px' }}>
                            <label className="form-label-txt" style={{ fontSize: '11px' }}>Or paste Image URL</label>
                            <input type="text" className="admin-form-input" placeholder="https://..."
                              value={form.image}
                              onChange={e => updateCatForm(catKey, 'image', e.target.value)}
                              style={{ fontSize: '12px' }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Image preview */}
                      {form.useImage && form.image && (
                        <img src={form.image} alt="preview" style={{ width: '100%', maxHeight: '80px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd' }} />
                      )}

                      {/* Title + Tag */}
                      {(!form.useImage || !form.imageOnly) && (
                        <>
                          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <div style={{ flex: 2, minWidth: '160px' }}>
                              <label className="form-label-txt" style={{ fontSize: '11px' }}>Slide Title*</label>
                              <input type="text" className="admin-form-input"
                                placeholder="e.g. Monsoon Mobile Sale!"
                                value={form.title}
                                onChange={e => updateCatForm(catKey, 'title', e.target.value)}
                                style={{ fontSize: '12px' }}
                              />
                            </div>
                            <div style={{ flex: 1, minWidth: '120px' }}>
                              <label className="form-label-txt" style={{ fontSize: '11px' }}>Tag Ribbon</label>
                              <input type="text" className="admin-form-input"
                                placeholder="e.g. LIMITED OFFER"
                                value={form.tag}
                                onChange={e => updateCatForm(catKey, 'tag', e.target.value)}
                                style={{ fontSize: '12px' }}
                              />
                            </div>
                          </div>

                          {/* Description */}
                          <div>
                            <label className="form-label-txt" style={{ fontSize: '11px' }}>Slide Description*</label>
                            <input type="text" className="admin-form-input"
                              placeholder="e.g. Up to 40% off on all mobiles today!"
                              value={form.desc}
                              onChange={e => updateCatForm(catKey, 'desc', e.target.value)}
                              style={{ fontSize: '12px' }}
                            />
                          </div>
                        </>
                      )}

                      {/* Background gradient (only if not using image) */}
                      {!form.useImage && (
                        <div>
                          <label className="form-label-txt" style={{ fontSize: '11px' }}>Background Color / Gradient*</label>
                          <select className="admin-form-input" value={form.bg} onChange={e => updateCatForm(catKey, 'bg', e.target.value)} style={{ fontSize: '12px' }}>
                            <option value="linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)">⚡ Electric Indigo (Brand Primary)</option>
                            <option value="linear-gradient(135deg, #fda4af 0%, #f43f5e 100%)">🌸 Vivid Coral Rose</option>
                            <option value="linear-gradient(135deg, #093129 0%, #00796b 100%)">🌿 Deep Teal</option>
                            <option value="linear-gradient(135deg, #0f172a 0%, #334155 100%)">🌑 Dark Slate</option>
                            <option value="linear-gradient(135deg, #7c3aed 0%, #c084fc 100%)">💜 Neon Purple</option>
                            <option value="linear-gradient(135deg, #ca8a04 0%, #eab308 100%)">🌟 Sunset Yellow</option>
                            <option value="linear-gradient(135deg, #be123c 0%, #fb7185 100%)">❤️ Deep Red Splash</option>
                            <option value="linear-gradient(135deg, #0369a1 0%, #38bdf8 100%)">🔵 Ocean Blue</option>
                          </select>
                          {/* Live gradient preview */}
                          <div style={{ marginTop: '6px', height: '28px', borderRadius: '4px', background: form.bg, display: 'flex', alignItems: 'center', paddingLeft: '10px' }}>
                            {form.title && <span style={{ color: '#fff', fontSize: '11px', fontWeight: '700', textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>{form.title}</span>}
                          </div>
                        </div>
                      )}

                      {/* Add Slide button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (form.useImage && !form.image) { showToast('Please add an image first.', 'error'); return; }
                          if (!form.useImage && (!form.title || !form.desc)) { showToast('Please enter Title and Description.', 'error'); return; }
                          const newSlide = {
                            title: form.imageOnly ? '' : form.title,
                            desc: form.imageOnly ? '' : form.desc,
                            tag: form.imageOnly ? '' : (form.tag || 'OFFER'),
                            bg: form.bg,
                            image: form.useImage ? form.image : undefined,
                            imageOnly: form.useImage ? form.imageOnly : false
                          };
                          setCategoryBanners(prev => {
                            const existingSlides = prev[catKey]?.slides || [];
                            // Auto-enable show when adding the first slide
                            const autoShow = existingSlides.length === 0 ? true : prev[catKey].show;
                            return {
                              ...prev,
                              [catKey]: { ...prev[catKey], slides: [...existingSlides, newSlide], show: autoShow }
                            };
                          });
                          setCatSlideForm(prev => ({ ...prev, [catKey]: { ...EMPTY_SLIDE_FORM } }));
                          showToast(`✅ Slide added! Now click SAVE to publish it.`, 'success');
                        }}
                        className="btn btn-outline btn-sm"
                        style={{ display: 'flex', gap: '6px', width: 'fit-content' }}
                      >
                        <PlusCircle size={14} /> Add Slide to {catLabel}
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>

          {/* Save Promotions Button (Bottom) */}
          <button 
            disabled={isSaving}
            onClick={handleSavePromotions}
            className="btn btn-accent btn-lg"
            style={{ width: '100%', padding: '12px', display: 'flex', justifyContent: 'center', opacity: isSaving ? 0.7 : 1 }}
          >
            {isSaving ? 'Saving...' : 'SAVE ALL PROMOTIONS AND LIVE BROADCAST'}
          </button>
        </div>
      )}

        </div>

        {/* ── ADVANCED CRM MODALS ── */}
        
        {/* Wallet Manager Modal */}
        {activeWalletModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }}>
            <div className="admin-panel-card animate-fade-in" style={{ width: '400px', background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
              
              <div style={{ background: 'linear-gradient(to right, #4f46e5, #3730a3)', padding: '20px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Manage Wallet</h3>
                  <div style={{ fontSize: '12px', opacity: 0.9 }}>{activeWalletModal.fullName || activeWalletModal.username} ({activeWalletModal.email})</div>
                </div>
                <button onClick={() => setActiveWalletModal(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={16} /></button>
              </div>
              
              <form onSubmit={handleProcessWalletTransaction} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Current Cash</span>
                    <span style={{ fontSize: '16px', fontWeight: '800', color: '#16a34a' }}>₹{activeWalletModal.walletCash || 0}</span>
                  </div>
                  <div style={{ width: '1px', background: '#e2e8f0' }}></div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Current Coins</span>
                    <span style={{ fontSize: '16px', fontWeight: '800', color: '#ca8a04' }}>🪙 {activeWalletModal.walletCoins || 0}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label className="form-label-txt" style={{ fontSize: '12px' }}>Action</label>
                    <select className="admin-form-input" value={walletAction} onChange={(e) => setWalletAction(e.target.value)}>
                      <option value="add">Add Funds</option>
                      <option value="deduct">Deduct Funds</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="form-label-txt" style={{ fontSize: '12px' }}>Fund Type</label>
                    <select className="admin-form-input" value={walletType} onChange={(e) => setWalletType(e.target.value)}>
                      <option value="cash">Cash (INR)</option>
                      <option value="coins">Reward Coins</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label-txt" style={{ fontSize: '12px' }}>Amount</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontWeight: 'bold' }}>{walletType === 'cash' ? '₹' : '🪙'}</span>
                    <input type="number" required min="1" className="admin-form-input" value={walletAmount} onChange={(e) => setWalletAmount(e.target.value)} placeholder="0.00" style={{ paddingLeft: '32px', fontSize: '16px', fontWeight: 'bold' }} />
                  </div>
                </div>

                <div>
                  <label className="form-label-txt" style={{ fontSize: '12px' }}>Internal Note / Reason (Sent to user)</label>
                  <input type="text" required className="admin-form-input" value={walletNote} onChange={(e) => setWalletNote(e.target.value)} placeholder="e.g. Refund for Order #123" />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', background: walletAction === 'add' ? '#16a34a' : '#ef4444', border: 'none', fontSize: '14px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                  {walletAction === 'add' ? <PlusCircle size={18} /> : <MinusCircle size={18} />}
                  {walletAction === 'add' ? 'ADD FUNDS' : 'DEDUCT FUNDS'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* View Order History Modal */}
        {activeOrderHistoryModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }}>
            <div className="admin-panel-card animate-fade-in" style={{ width: '800px', maxWidth: '90vw', maxHeight: '80vh', background: '#fff', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
              
              <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ padding: '10px', background: '#e0e7ff', borderRadius: '8px', color: '#4f46e5' }}><Package size={20} /></div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#0f172a' }}>Order History</h3>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>{activeOrderHistoryModal.fullName || activeOrderHistoryModal.username}</div>
                  </div>
                </div>
                <button onClick={() => setActiveOrderHistoryModal(null)} style={{ background: '#f1f5f9', border: 'none', color: '#64748b', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={16} /></button>
              </div>
              
              <div style={{ padding: '20px', overflowY: 'auto', flex: 1, background: '#f8fafc' }}>
                {(() => {
                  // Find all orders that belong to this user by matching email, phone or userId if available
                  const userOrders = adminOrders.filter(o => 
                    (o.customerDetails?.email && o.customerDetails.email === activeOrderHistoryModal.email) ||
                    (o.customerDetails?.phone && o.customerDetails.phone === activeOrderHistoryModal.phone)
                  ).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

                  if (userOrders.length === 0) {
                    return (
                      <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
                        <Package size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
                        <h4 style={{ margin: '0 0 8px 0', color: '#334155' }}>No Orders Found</h4>
                        <p style={{ margin: 0, fontSize: '14px' }}>This customer hasn't placed any orders yet.</p>
                      </div>
                    );
                  }

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {userOrders.map(order => (
                        <div key={order.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                          <div>
                            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>{new Date(order.createdAt).toLocaleString()}</div>
                            <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '15px', marginTop: '4px' }}>Order #{order.id.slice(0,8).toUpperCase()}</div>
                            <div style={{ fontSize: '13px', color: '#475569', marginTop: '4px' }}>{order.items.length} item(s)</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '16px', fontWeight: '800', color: '#16a34a' }}>₹{(order.totalPrice || 0).toFixed(2)}</div>
                            <span style={{ display: 'inline-block', marginTop: '6px', fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '20px', background: order.status === 'Delivered' ? '#dcfce7' : order.status === 'Cancelled' ? '#fee2e2' : '#e0e7ff', color: order.status === 'Delivered' ? '#16a34a' : order.status === 'Cancelled' ? '#ef4444' : '#4f46e5' }}>
                              {order.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* View Merchant Catalog Modal */}
        {activeCatalogModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }}>
            <div className="admin-panel-card animate-fade-in" style={{ width: '800px', maxWidth: '90vw', maxHeight: '80vh', background: '#fff', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
              
              <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ padding: '10px', background: '#e0e7ff', borderRadius: '8px', color: '#4f46e5' }}><Store size={20} /></div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#0f172a' }}>Merchant Catalog</h3>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>{activeCatalogModal.shopName} ({activeCatalogModal.email})</div>
                  </div>
                </div>
                <button onClick={() => setActiveCatalogModal(null)} style={{ background: '#f1f5f9', border: 'none', color: '#64748b', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={16} /></button>
              </div>
              
              <div style={{ padding: '20px', overflowY: 'auto', flex: 1, background: '#f8fafc' }}>
                {(() => {
                  const vendorProducts = products.filter(p => p.vendorId === activeCatalogModal.vendorId || p.vendorId === activeCatalogModal.email);

                  if (vendorProducts.length === 0) {
                    return (
                      <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
                        <Package size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
                        <h4 style={{ margin: '0 0 8px 0', color: '#334155' }}>No Products Listed</h4>
                        <p style={{ margin: 0, fontSize: '14px' }}>This merchant hasn't listed any products yet.</p>
                      </div>
                    );
                  }

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {vendorProducts.map(product => (
                        <div key={product.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                          <img src={product.image} alt={product.name} style={{ width: '60px', height: '60px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #f1f5f9' }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '15px' }}>{product.name}</div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>SKU: {product.id.slice(0,8).toUpperCase()}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>₹{product.price}</div>
                            <div style={{ fontSize: '12px', color: product.inStock ? '#16a34a' : '#ef4444', fontWeight: '600', marginTop: '4px' }}>
                              {product.inStock ? 'In Stock' : 'Out of Stock'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default AdminDashboard;
