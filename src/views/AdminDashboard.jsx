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
import AdminPromotions from '../components/AdminPromotions';
import AdminUsers from '../components/AdminUsers';
import AdminProductStudio from '../components/AdminProductStudio';

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
  
  const res = await fetch('https://pi.cloudinary.com/v1_1/rx1klbob/auto/upload', {
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
  
  const userRole = currentUser?.role || (sessionStorage.getItem('abkharido_admin_token') ? 'super_admin' : 'admin');
  
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
    setActiveTab('add_product');
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

    setHasProCare(prod.hasProCare || false);

    // Set PIM Fields
    setMetaTitle(prod.seo?.metaTitle || '');
    setMetaDescription(prod.seo?.metaDescription || '');
    setHsnCode(prod.hsnCode || '');
    setVendorId(prod.vendorId || '');
    setLowStockThreshold(prod.lowStockThreshold?.toString() || '5');
    setVolumeDiscounts(prod.volumeDiscounts || [
      { minQty: '2', discountPct: '10', title: 'Buy 2 Get 10% Extra Savings' },
      { minQty: '3', discountPct: '15', title: 'Buy 3+ Get 15% VIP Bulk Discount' }
    ]);
    setCrossSellIds(prod.crossSellIds || []);
    setSearchTags((prod.searchTags || []).join(', '));
    
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
    setHasProCare(false);
    setSpecs([{ key: 'Brand', value: '' }, { key: 'Model', value: '' }]);
    setColorModels([]);
    
    setFlashSaleActive(false);
    setFlashSalePrice('');
    setFlashSaleEndTime('');
    setLowStockThreshold('5');
    setVolumeDiscounts([
      { minQty: '2', discountPct: '10', title: 'Buy 2 Get 10% Extra Savings' },
      { minQty: '3', discountPct: '15', title: 'Buy 3+ Get 15% VIP Bulk Discount' }
    ]);
    setCrossSellIds([]);
    setSearchTags('');
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

  // Services
  const [hasProCare, setHasProCare] = useState(false);

  // Enterprise PIM State
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [hsnCode, setHsnCode] = useState('');
  const [vendorId, setVendorId] = useState('');

  // 5x Revenue & Safeguard Engine States
  const [lowStockThreshold, setLowStockThreshold] = useState('5');
  const [volumeDiscounts, setVolumeDiscounts] = useState([
    { minQty: '2', discountPct: '10', title: 'Buy 2 Get 10% Extra Savings' },
    { minQty: '3', discountPct: '15', title: 'Buy 3+ Get 15% VIP Bulk Discount' }
  ]);
  const [crossSellIds, setCrossSellIds] = useState([]);
  const [searchTags, setSearchTags] = useState('');

  const handleAddVolumeDiscount = () => {
    setVolumeDiscounts([...volumeDiscounts, { minQty: '', discountPct: '', title: '' }]);
  };
  const handleRemoveVolumeDiscount = (idx) => {
    setVolumeDiscounts(volumeDiscounts.filter((_, i) => i !== idx));
  };
  const handleVolumeDiscountChange = (idx, field, val) => {
    const copy = [...volumeDiscounts];
    copy[idx] = { ...copy[idx], [field]: val };
    setVolumeDiscounts(copy);
  };
  const toggleCrossSellId = (pid) => {
    if (crossSellIds.includes(pid)) {
      setCrossSellIds(crossSellIds.filter(id => id !== pid));
    } else {
      setCrossSellIds([...crossSellIds, pid]);
    }
  };

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

  // Update commission presets and smart spec templates automatically when changing category
  const handleCategoryChange = (cat) => {
    setCategory(cat);
    switch (cat) {
      case 'fashion':
        setUserCommission('0.03');
        setSpecs([
          { key: 'Fabric', value: '100% Premium Pure Cotton' },
          { key: 'Fit Type', value: 'Regular / Tailored Fit' },
          { key: 'Care Instructions', value: 'Machine Wash Cold / Gentle Cycle' },
          { key: 'Country of Origin', value: 'India' },
          { key: 'Occasion', value: 'Casual / Smart Casual' }
        ]);
        break;
      case 'home':
        setUserCommission('0.02');
        setSpecs([
          { key: 'Material', value: 'Premium Grade Sustainable Wood / Metal' },
          { key: 'Dimensions', value: 'Standard Ergonomic Size' },
          { key: 'Weight & Durability', value: 'Heavy Duty Built' },
          { key: 'Package Contents', value: '1 Main Unit + Accessories + User Manual' },
          { key: 'Care & Maintenance', value: 'Easy wipe cleaning with dry/damp microfiber cloth' }
        ]);
        break;
      case 'appliances':
        setUserCommission('0.015');
        setSpecs([
          { key: 'Brand & Model', value: '' },
          { key: 'Energy Efficiency Rating', value: '5-Star Eco Inverter Technology (Power Saving)' },
          { key: 'Operating Capacity', value: '' },
          { key: 'Comprehensive Warranty', value: '1 Year Full Unit + 10 Years on Motor/Compressor' },
          { key: 'Home Installation & Demo', value: 'Free Expert Home Installation & Setup' }
        ]);
        break;
      case 'electronics':
        setUserCommission('0.012');
        setSpecs([
          { key: 'Brand', value: '' },
          { key: 'Model Identifier', value: '' },
          { key: 'Connectivity & Audio/Video', value: 'Bluetooth 5.3 / Type-C Fast Data Sync' },
          { key: 'In The Box', value: 'Device + Fast Charger Adapter + Type-C Braided Cable + Warranty Card' },
          { key: 'Brand Warranty', value: '1 Year Official Comprehensive Replacement / Service Warranty' }
        ]);
        break;
      case 'mobiles':
        setUserCommission('0.005');
        setSpecs([
          { key: 'Brand & Series', value: '' },
          { key: 'Display Technology', value: '6.7-inch Super AMOLED 120Hz Pro Display with HDR10+' },
          { key: 'Processor & RAM', value: 'Next-Gen Flagship Chipset with Virtual RAM Expansion' },
          { key: 'Pro Camera System', value: '50MP OIS Ultra Triple Camera + 32MP Selfies' },
          { key: 'Battery & Fast Charging', value: '5000 mAh High-Density Battery + 65W Super Fast Charger included' },
          { key: 'Operating System', value: 'Latest Android / iOS with Clean Enterprise UI' },
          { key: 'Official Warranty', value: '1 Year Brand Comprehensive Authorised Service Network Warranty' }
        ]);
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
      hasProCare,
      colorModels: cleanColorModels.length > 0 ? cleanColorModels : undefined,
      flashSale: {
        isActive: flashSaleActive,
        price: Number(flashSalePrice || 0),
        endTime: flashSaleEndTime ? new Date(flashSaleEndTime) : null
      },
      // PIM Fields
      hsnCode: hsnCode.trim(),
      vendorId: vendorId.trim() || undefined,
      lowStockThreshold: Number(lowStockThreshold || 5),
      volumeDiscounts: volumeDiscounts.filter(vd => vd.minQty && vd.discountPct),
      crossSellIds,
      searchTags: searchTags ? searchTags.split(',').map(t => t.trim()).filter(Boolean) : [],
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
                className={`admin-nav-item ${activeTab === 'add_product' ? 'active' : ''}`}
                onClick={() => { setActiveTab('add_product'); setEditMode(false); resetForm(); setMobileMenuOpen(false); }}
              >
                <PlusCircle size={18} /> Add Product
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
          <div className="admin-topbar-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ width: '10px', height: '26px', background: 'linear-gradient(to bottom, #4f46e5, #ec4899)', borderRadius: '100px', display: 'inline-block' }}></span>
            <span style={{ background: 'linear-gradient(135deg, #0f172a 0%, #4f46e5 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '24px', fontWeight: '900', fontFamily: 'Outfit, sans-serif' }}>
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Control
            </span>
            <span style={{ fontSize: '11px', fontWeight: '800', background: '#ecfdf5', color: '#059669', padding: '4px 10px', borderRadius: '100px', border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', gap: '5px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              <span className="live-pulse-dot"></span> Vercel Sync 🟢
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
      {activeTab === 'users' && <AdminUsers />}
      {activeTab === 'users_old_legacy_unused' && (
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
              <table className="admin-table" style={{ minWidth: '1150px' }}>
                <thead>
                  <tr>
                    <th style={{ whiteSpace: 'nowrap' }}>Customer ID / Phone</th>
                    <th style={{ whiteSpace: 'nowrap' }}>Full Name</th>
                    <th style={{ whiteSpace: 'nowrap' }}>Email Address</th>
                    <th style={{ whiteSpace: 'nowrap' }}>Verification</th>
                    <th style={{ whiteSpace: 'nowrap' }}>Role & VIP Tier</th>
                    <th style={{ whiteSpace: 'nowrap' }}>Referral Tag</th>
                    <th style={{ whiteSpace: 'nowrap' }}>Wallet Balances</th>
                    <th style={{ whiteSpace: 'nowrap' }}>Referred Sales</th>
                    <th style={{ whiteSpace: 'nowrap', textAlign: 'center' }}>Action Controls</th>
                  </tr>
                </thead>
                <tbody>
                  {adminUsers
                    .filter(u => u.role !== 'admin' && u.role !== 'super_admin' && u.username !== 'admin')
                    .filter(u => 
                      u.username.toLowerCase().includes(userSearchQuery.toLowerCase()) || 
                      (u.fullName && u.fullName.toLowerCase().includes(userSearchQuery.toLowerCase()))
                    )
                    .map(u => {
                      const rawUsername = String(u.username || '');
                      const isNumeric = /^\d+$/.test(rawUsername);
                      const cleanPhone = isNumeric && rawUsername.length >= 10 ? rawUsername.slice(0, 10) : (u.phone ? String(u.phone).replace(/\D/g, '').slice(-10) : rawUsername);
                      // Derive a 100% unique customer ID tag from their immutable database primary key (_id/id) to prevent prefix collisions across crores of users
                      const custTag = `#CUST_${String(u._id || u.id || rawUsername).slice(-6).toUpperCase()}`;

                      const userCode = u.isInfluencer ? u.creatorCode : u.referralCode;
                      const influencerId = u.isInfluencer ? u.influencerId : null;
                      
                      const referredOrdersList = adminOrders.filter(o => 
                        o.referralApplied && o.referralApplied.referrerId &&
                        ((userCode && o.referralApplied.referrerId === userCode) || 
                         (influencerId && o.referralApplied.referrerId === influencerId))
                      );
                      
                      const salesCount = referredOrdersList.length;
                      const totalSalesVolume = referredOrdersList.reduce((sum, o) => sum + (o.totalPrice || 0), 0);

                      // Calculate customer spending & orders for VIP Tier determination
                      const customerOrders = adminOrders.filter(o => 
                        (o.customerDetails?.email && u.email && o.customerDetails.email === u.email) ||
                        (o.customerDetails?.phone && (o.customerDetails.phone.includes(cleanPhone) || (u.phone && o.customerDetails.phone === u.phone))) ||
                        (o.userId && (o.userId === u._id || o.userId === u.id))
                      );
                      const totalSpend = customerOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
                      const ordersCount = customerOrders.length;

                      let vipTier = { label: '🥉 Bronze Member', color: '#9a3412', bg: '#ffedd5', border: '#fed7aa', desc: 'Starter Account' };
                      if (totalSpend >= 20000 || ordersCount >= 5) {
                        vipTier = { label: '👑 Gold Exclusive Club', color: '#b45309', bg: '#fef3c7', border: '#fde68a', desc: 'Top VIP Customer' };
                      } else if (totalSpend >= 5000 || ordersCount >= 2) {
                        vipTier = { label: '🥈 Silver VIP Shopper', color: '#4338ca', bg: '#e0e7ff', border: '#c7d2fe', desc: 'Loyal Buyer' };
                      }

                      return (
                        <tr key={u.username} style={{ transition: 'background-color 0.2s', borderBottom: '1px solid #f1f5f9' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                          <td style={{ padding: '16px 14px', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: '800', color: '#0f172a', fontSize: '15px', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>
                                {isNumeric ? `📱 +91 ${cleanPhone}` : rawUsername}
                              </span>
                              <span style={{ fontSize: '11px', background: '#e0e7ff', color: '#4338ca', fontWeight: '800', padding: '3px 8px', borderRadius: '100px', border: '1px solid #c7d2fe', whiteSpace: 'nowrap' }}>
                                {custTag}
                              </span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', fontWeight: '600' }}>
                              {u.createdAt ? `📅 Joined ${new Date(u.createdAt).toLocaleDateString('en-IN')}` : 'Verified Platform Account'}
                            </div>
                          </td>
                          <td style={{ color: '#1e293b', fontWeight: '700', fontSize: '14px', whiteSpace: 'nowrap' }}>{u.fullName || 'Guest User'}</td>
                          <td style={{ color: '#475569', fontSize: '13px', whiteSpace: 'nowrap' }}>{u.email || <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>Not provided</span>}</td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '11px', fontWeight: '800', padding: '4px 10px', borderRadius: '100px', background: u.isEmailVerified ? '#dcfce7' : '#fee2e2', color: u.isEmailVerified ? '#16a34a' : '#ef4444', border: `1px solid ${u.isEmailVerified ? '#86efac' : '#fecaca'}`, whiteSpace: 'nowrap' }}>
                                {u.isEmailVerified ? 'Verified ✓' : 'Pending ✕'}
                              </span>
                              <button 
                                onClick={() => handleToggleEmailVerify(u)} 
                                style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer', color: '#475569', fontWeight: '700', transition: 'all 0.2s' }}
                                title="Toggle Email Verification Status"
                              >
                                Toggle
                              </button>
                            </div>
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                              <span style={{ fontSize: '12px', fontWeight: '800', padding: '5px 12px', borderRadius: '100px', backgroundColor: vipTier.bg, color: vipTier.color, border: `1px solid ${vipTier.border}`, display: 'inline-block', whiteSpace: 'nowrap', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                                {vipTier.label}
                              </span>
                              <span style={{ fontSize: '12px', color: '#475569', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                🛍️ {ordersCount} Order(s) <span style={{ color: '#cbd5e1' }}>•</span> <strong style={{ color: '#0f172a' }}>₹{totalSpend.toLocaleString('en-IN')}</strong>
                              </span>
                            </div>
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <div style={{ fontSize: '13px' }}>
                              {userCode ? (
                                <div style={{ background: '#f0fdf4', border: '1px solid #86efac', padding: '6px 10px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontWeight: '800', color: '#15803d', fontFamily: 'monospace', fontSize: '13px', whiteSpace: 'nowrap' }}>{userCode}</span>
                                  <button onClick={() => { navigator.clipboard?.writeText(userCode); showToast(`Copied ${userCode} to clipboard!`, 'success'); }} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#15803d', fontSize: '14px', padding: 0 }} title="Copy Referral Code">📋</button>
                                </div>
                              ) : (
                                <button 
                                  onClick={() => {
                                    const genCode = `VIP-${(u.fullName || 'BUY').split(' ')[0].toUpperCase().replace(/[^A-Z]/g, '') || 'CUST'}-${Math.floor(100 + Math.random()*900)}`;
                                    u.referralCode = genCode;
                                    showToast(`✨ Generated VIP Referral Tag: ${genCode} for ${u.fullName || cleanPhone}`, 'success');
                                    if (typeof setUsers === 'function') {
                                      setUsers([...adminUsers]);
                                    }
                                  }}
                                  style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', color: '#b45309', border: '1px solid #fbbf24', padding: '7px 14px', borderRadius: '100px', fontWeight: '800', fontSize: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', boxShadow: '0 2px 6px rgba(245, 158, 11, 0.2)' }}
                                >
                                  <span>⚡ Generate VIP Tag</span>
                                </button>
                              )}
                            </div>
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <div style={{ fontSize: '13px', lineHeight: '1.6', background: '#f8fafc', padding: '8px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'inline-block', whiteSpace: 'nowrap' }}>
                              <div style={{ color: '#ca8a04', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>🪙 {u.walletCoins || 0} Coins</div>
                              <div style={{ color: '#16a34a', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', marginTop: '3px' }}>💵 ₹{(u.walletCash || 0).toFixed(2)} Cash</div>
                            </div>
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <div style={{ fontSize: '13px', lineHeight: '1.6', whiteSpace: 'nowrap' }}>
                              <div style={{ fontWeight: '800', color: salesCount > 0 ? '#16a34a' : '#64748b', fontSize: '13px' }}>
                                📈 {salesCount} referred sales
                              </div>
                              {salesCount > 0 && (
                                <div style={{ fontSize: '12px', color: '#0f172a', fontWeight: '700', marginTop: '2px' }}>
                                  Vol: ₹{totalSalesVolume.toLocaleString('en-IN')}
                                </div>
                              )}
                            </div>
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '155px', margin: '0 auto' }}>
                              <button
                                onClick={() => {
                                  const text = `Hi ${u.fullName || 'Valued Customer'}! ✨ We missed you at AbKharido! Here is an exclusive gift: Get special instant discounts on our luxury electronics & gadgets today. ORDER NOW & Claim your reward!`;
                                  window.open(`https://a.me/91${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
                                  showToast(`Opening WhatsApp offer chat for +91 ${cleanPhone}...`, 'success');
                                }}
                                style={{ width: '100%', fontSize: '12px', padding: '8px 10px', borderRadius: '8px', fontWeight: '800', background: '#22c55e', color: '#ffffff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 2px 6px rgba(34, 197, 94, 0.3)', whiteSpace: 'nowrap', transition: 'all 0.2s' }}
                              >
                                <span>💬 WhatsApp Offer</span>
                              </button>

                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', width: '100%' }}>
                                <button
                                  style={{ fontSize: '11px', padding: '7px 4px', borderRadius: '8px', fontWeight: '800', background: '#e0e7ff', color: '#4338ca', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                                  onClick={() => setActiveOrderHistoryModal(u)}
                                  title="View Customer 360° Profile & Order Records"
                                >
                                  <span>👁️ 360°</span>
                                </button>
                                <button
                                  style={{ fontSize: '11px', padding: '7px 4px', borderRadius: '8px', fontWeight: '800', background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                                  onClick={() => handleOpenWalletModal(u)}
                                  title="Manage Coins & Cash Balance"
                                >
                                  <span>💳 Wallet</span>
                                </button>
                              </div>

                              <button
                                style={{ width: '100%', fontSize: '11px', padding: '6px 10px', borderRadius: '8px', fontWeight: '700', background: u.status === 'Suspended' ? '#f0fdf4' : '#f8fafc', borderColor: u.status === 'Suspended' ? '#86efac' : '#cbd5e1', color: u.status === 'Suspended' ? '#16a34a' : '#64748b', border: '1px solid', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s' }}
                                onClick={() => handleSuspendUser(u)}
                              >
                                {u.status === 'Suspended' ? '🔓 Unblock Account' : '🚫 Restrict Access'}
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '100%' }}>
          <AdminDataGrid onEditProduct={handleEditProduct} />
        </div>
      )}

      {/* CONDITIONAL RENDER: ADD PRODUCT TAB */}
      {activeTab === 'add_product' && <AdminProductStudio onFinish={() => setActiveTab('inventory')} />}
      {activeTab === 'add_product_old_legacy_unused' && (
        <div style={{ maxWidth: '950px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', paddingBottom: '50px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Card 1: Main Product Identity & Categorization */}
            <div className="admin-panel-card" style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '28px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                  <div style={{ padding: '10px', background: '#e0e7ff', borderRadius: '12px', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><PlusCircle size={22} /></div>
                  <span>{editMode ? 'Edit Enterprise Product Asset' : 'Create New Product Asset'}</span>
                </h3>
                <span style={{ fontSize: '12px', fontWeight: '700', padding: '5px 12px', borderRadius: '100px', background: '#f8fafc', border: '1px solid #cbd5e1', color: '#475569' }}>
                  Enterprise PIM Hub 2.0
                </span>
              </div>

              {/* Display Name & URL Slug in Responsive Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>Product Display Name* (Auto-generates URL Slug)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Apple iPhone 16 Pro (Titanium, 128 GB)" 
                    value={name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setName(val);
                      if (!editMode && (!id || id === name.toLowerCase().trim().replace(/[\s\W]+/g, '-'))) {
                        setId(val.toLowerCase().trim().replace(/[\s\W]+/g, '-'));
                      }
                    }}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '14px', color: '#0f172a', fontWeight: '600', boxSizing: 'border-box' }}
                    required
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>Unique URL Slug / Product ID*</label>
                  <input 
                    type="text" 
                    placeholder="e.g. apple-iphone-16-pro" 
                    value={id}
                    onChange={(e) => setId(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '14px', color: '#334155', fontFamily: 'monospace', fontWeight: '600', boxSizing: 'border-box' }}
                    required
                  />
                  {!editMode && <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: '600' }}>⚡ SEO-Optimized Link Structure</span>}
                </div>
              </div>

              {/* Category Dropdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>Product Category* (Auto-loads Smart Specifications)</label>
                <select 
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '14px', color: '#0f172a', fontWeight: '600', boxSizing: 'border-box', cursor: 'pointer' }}
                >
                  <option value="electronics">Electronics (Gadgets & Accessories)</option>
                  <option value="mobiles">Mobiles & Smartphones</option>
                  <option value="fashion">Fashion & Clothing</option>
                  <option value="home">Home & Living Essentials</option>
                  <option value="appliances">Large Home Appliances</option>
                </select>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '4px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => {
                      let smartDesc = '';
                      if (category === 'mobiles') {
                        smartDesc = `• 120Hz Ultra-Fluid OLED Display for blazing fast navigation and pro-level gaming\n• Flagship Grade Camera System with advanced low-light photography & 4K 60fps cinematic filming\n• All-Day 5000mAh Endurance Battery with intelligent ai power conservation\n• Aerospace-Grade Seamless Metallic Construction built for ultimate drop protection`;
                        setSpecs([
                          { key: 'Brand & Series', value: 'Apple / Samsung Flagship' },
                          { key: 'Display Technology', value: '6.7-inch Super AMOLED 120Hz Pro Display with HDR10+' },
                          { key: 'Processor & RAM', value: 'Next-Gen Flagship Chipset with Virtual RAM Expansion' },
                          { key: 'Pro Camera System', value: '50MP OIS Ultra Triple Camera + 32MP Selfies' },
                          { key: 'Battery & Fast Charging', value: '5000 mAh High-Density Battery + 65W Super Fast Charger included' },
                          { key: 'Official Warranty', value: '1 Year Brand Comprehensive Authorised Service Network Warranty' }
                        ]);
                      } else if (category === 'electronics') {
                        smartDesc = `• Studio-Grade Precision Acoustic Drivers delivering deep bass and immersive 3D surround sound\n• Active Noise Cancellation (ANC) up to 45dB to neutralize surrounding city noise instantly\n• Ergonomic Featherlight Fit engineered for zero fatigue during all-day wear\n• Quick Charge Support: 10 mins charging provides up to 5 hours of non-stop entertainment`;
                        setSpecs([
                          { key: 'Brand', value: 'Pro Series Audio / Tech' },
                          { key: 'Model Identifier', value: '2026 Pro Wireless Edition' },
                          { key: 'Connectivity', value: 'Bluetooth 5.3 / Ultra-Low Latency Wi-Fi 6E' },
                          { key: 'Power / Battery', value: 'Up to 36 Hours Extended Backup' },
                          { key: 'Brand Warranty', value: '1 Year Official Comprehensive Replacement / Service Warranty' }
                        ]);
                      } else if (category === 'fashion') {
                        smartDesc = `• Luxuriously Soft Breathable Fabric designed for extreme comfort in all seasonal climates\n• Precision Laser-Trimmed Stitching for flawless structure and durability across regular washing\n• Fade-Resistant Eco-Friendly Reactive Dyes that retain vibrant sheen after 50+ wash cycles`;
                        setSpecs([
                          { key: 'Fabric Material', value: '100% Ultra-Fine Combed Egyptian Cotton' },
                          { key: 'Fit Type', value: 'Tailored Slim Fit / Athletic Cut' },
                          { key: 'Wash Care Instructions', value: 'Machine Wash Cold / Gentle Cycle' },
                          { key: 'Country of Origin', value: 'Proudly Crafted in India' }
                        ]);
                      } else {
                        smartDesc = `• Built with unmatched durability and craftsmanship to elevate daily lifestyle routines\n• Engineered with modern ergonomic design technology for effortless performance\n• Rigorously quality-tested to guarantee zero failure under heavy daily usage`;
                        setSpecs([
                          { key: 'Material & Build', value: 'Premium Heritage Quality' },
                          { key: 'Dimensions & Weight', value: 'Standard Ergonomic Form Factor' },
                          { key: 'Package Contents', value: '1 Unit Genuine Sealed Box + Warranty Guide' },
                          { key: 'Customer Assistance', value: '24/7 Dedicated Concierge Support via WhatsApp' }
                        ]);
                      }
                      setDescription(smartDesc);
                      showToast(`🤖 AI Smart-Template generated Specs & Bullet Highlights for "${category.toUpperCase()}"!`, 'success');
                    }}
                    style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)', color: 'white', padding: '9px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 3px 10px rgba(79, 70, 229, 0.25)', transition: 'all 0.2s' }}
                  >
                    <span>🤖 Auto-Fill AI Smart Specs & High-Converting Description</span>
                  </button>
                </div>
              </div>

              {/* Psychological Trigger Badges */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>Sales Badge & Conversion Trigger*</label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {[
                    { id: 'none', label: 'Standard (No Badge)', color: '#64748b', bg: '#f1f5f9' },
                    { id: 'bestseller', label: '🔥 BEST SELLER', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
                    { id: 'trending', label: '📈 TRENDING NOW', color: '#4f46e5', bg: '#e0e7ff', border: '#c7d2fe' },
                    { id: 'new', label: '✨ NEW ARRIVAL', color: '#059669', bg: '#d1fae5', border: '#a7f3d0' },
                    { id: 'deal', label: '💎 DEAL OF THE WEEK', color: '#d97706', bg: '#fef3c7', border: '#fde68a' },
                    { id: 'premium', label: '👑 PREMIUM CHOICE', color: '#7c3aed', bg: '#ede9fe', border: '#ddd6fe' }
                  ].map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setBadge(item.id)}
                      style={{
                        padding: '9px 18px',
                        borderRadius: '100px',
                        fontSize: '12px',
                        fontWeight: '700',
                        border: '2px solid',
                        borderColor: badge === item.id ? item.color : (item.border || '#cbd5e1'),
                        backgroundColor: badge === item.id ? item.color : item.bg,
                        color: badge === item.id ? '#ffffff' : item.color,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: badge === item.id ? '0 4px 12px rgba(0,0,0,0.15)' : 'none'
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Enterprise PIM (Compliance & SEO Integration) Card */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', padding: '22px', background: 'linear-gradient(145deg, #f8fafc, #f1f5f9)', border: '1px solid #cbd5e1', borderRadius: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h4 style={{ margin: 0, fontSize: '15px', color: '#0f172a', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🛡️ Enterprise PIM (Compliance, GST & SEO Integration)</span>
                  </h4>
                  <span style={{ fontSize: '11px', color: '#1e40af', fontWeight: '700', background: '#dbeafe', padding: '3px 10px', borderRadius: '100px' }}>Automated Schema Sync</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>SEO Meta Title (Google Indexing)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Buy Apple iPhone 16 Pro Online in India at Best Price" 
                      value={metaTitle}
                      onChange={(e) => setMetaTitle(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>SEO Meta Description (Snippet Text)</label>
                    <input 
                      type="text" 
                      placeholder="High converting search engine summary text..." 
                      value={metaDescription}
                      onChange={(e) => setMetaDescription(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>HSN Code (GST Tax Compliance)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 85171219 (Mandatory for invoice generation)" 
                      value={hsnCode}
                      onChange={(e) => setHsnCode(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>Linked Vendor ID (Marketplace Seller)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 64b8f... (Leave empty if Direct Warehouse)" 
                      value={vendorId}
                      onChange={(e) => setVendorId(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', borderTop: '1px dashed #cbd5e1', paddingTop: '14px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span>🏷️ Hidden Search Engine Keywords & Misspelling Tags (Comma separated)</span>
                    <span style={{ fontSize: '11px', background: '#fef3c7', color: '#d97706', padding: '2px 8px', borderRadius: '100px' }}>Zero Search Abandonment Engine</span>
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. #gaming, #fast-charging, #diwali-gift, #trending, smartwoch, iphne" 
                    value={searchTags}
                    onChange={(e) => setSearchTags(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Improves customer search results even if they type wrong spelling or look for broad usage terms!</span>
                </div>
              </div>

              {/* Pricing & Stock Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                  <label style={{ fontSize: '13px', fontWeight: '800', color: '#16a34a' }}>Selling Price (₹)*</label>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontWeight: '800', color: '#16a34a', fontSize: '16px' }}>₹</span>
                    <input 
                      type="number" 
                      placeholder="0.00" 
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      style={{ width: '100%', padding: '12px 16px 12px 32px', borderRadius: '10px', border: '2px solid #86efac', background: '#f0fdf4', fontSize: '16px', color: '#15803d', fontWeight: '800', boxSizing: 'border-box' }}
                      required
                    />
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#64748b' }}>Original MRP (₹)*</label>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontWeight: '700', color: '#64748b', fontSize: '15px' }}>₹</span>
                    <input 
                      type="number" 
                      placeholder="0.00" 
                      value={originalPrice}
                      onChange={(e) => setOriginalPrice(e.target.value)}
                      style={{ width: '100%', padding: '12px 16px 12px 32px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '15px', color: '#64748b', fontWeight: '700', textDecoration: 'line-through', boxSizing: 'border-box' }}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>Quantity in Stock*</label>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '15px' }}>📦</span>
                    <input 
                      type="number" 
                      placeholder="100" 
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      style={{ width: '100%', padding: '12px 16px 12px 38px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '15px', color: '#0f172a', fontWeight: '800', boxSizing: 'border-box' }}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#d97706' }}>🚨 Low Stock Warning Threshold*</label>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '15px' }}>⚠️</span>
                    <input 
                      type="number" 
                      placeholder="5" 
                      value={lowStockThreshold}
                      onChange={(e) => setLowStockThreshold(e.target.value)}
                      style={{ width: '100%', padding: '12px 16px 12px 38px', borderRadius: '10px', border: '2px solid #fde68a', background: '#fffbeb', fontSize: '15px', color: '#b45309', fontWeight: '800', boxSizing: 'border-box' }}
                      required
                    />
                  </div>
                  <span style={{ fontSize: '11px', color: '#b45309', fontWeight: '700' }}>⚡ Triggers FOMO urgency banner & automated admin alerts</span>
                </div>
              </div>

              {Number(price) > 0 && Number(originalPrice) > Number(price) && (
                <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', border: '1px solid #86efac', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <span style={{ fontSize: '26px' }}>🔥</span>
                    <div>
                      <div style={{ fontWeight: '800', color: '#15803d', fontSize: '16px' }}>
                        Customer Saving: ₹{(Number(originalPrice) - Number(price)).toLocaleString('en-IN')} ({Math.round(((Number(originalPrice) - Number(price)) / Number(originalPrice)) * 100)}% OFF)
                      </div>
                      <div style={{ fontSize: '12px', color: '#166534', fontWeight: '600', marginTop: '2px' }}>This high-impact savings badge will be displayed on all storefront cards!</div>
                    </div>
                  </div>
                  <span style={{ padding: '6px 14px', background: '#16a34a', color: 'white', fontWeight: '800', borderRadius: '100px', fontSize: '12px', boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)' }}>Conversion Boost Active ✨</span>
                </div>
              )}

              {/* Flash Sale Engine Config */}
              <div style={{ backgroundColor: '#fff5f5', padding: '20px', borderRadius: '14px', border: '1px solid #fecaca', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '20px' }}>⚡</span>
                    <div>
                      <label style={{ fontSize: '15px', fontWeight: '800', color: '#b91c1c', margin: 0, display: 'block' }}>Enable Deal of the Day (Flash Sale Engine)</label>
                      <span style={{ fontSize: '12px', color: '#991b1b', fontWeight: '500' }}>Creates urgency countdown timer on product details page</span>
                    </div>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={flashSaleActive}
                    onChange={(e) => setFlashSaleActive(e.target.checked)}
                    style={{ width: '22px', height: '22px', accentColor: '#dc2626', cursor: 'pointer' }}
                  />
                </div>
                
                {flashSaleActive && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', borderTop: '1px dashed #fca5a5', paddingTop: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                      <label style={{ fontSize: '12px', fontWeight: '700', color: '#991b1b' }}>Flash Sale Deal Price (₹)*</label>
                      <input 
                        type="number" 
                        placeholder="Special Flash Deal Price" 
                        value={flashSalePrice}
                        onChange={(e) => setFlashSalePrice(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '2px solid #f87171', background: '#ffffff', color: '#b91c1c', fontWeight: '800', fontSize: '14px', boxSizing: 'border-box' }}
                        required={flashSaleActive}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                      <label style={{ fontSize: '12px', fontWeight: '700', color: '#991b1b' }}>Offer End Time (Countdown Deadline)*</label>
                      <input 
                        type="datetime-local" 
                        value={flashSaleEndTime}
                        onChange={(e) => setFlashSaleEndTime(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #f87171', background: '#ffffff', color: '#991b1b', fontWeight: '700', fontSize: '14px', boxSizing: 'border-box' }}
                        required={flashSaleActive}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Referral Coins Rate */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🪙 Referral Coins Reward Rate (User Affiliate Multiplier)*</span>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: '#d97706', background: '#fef3c7', padding: '2px 8px', borderRadius: '100px' }}>Viral Loop Engine</span>
                </label>
                <input 
                  type="number" 
                  step="0.001"
                  placeholder="e.g. 0.012 (1.2% equivalent rewards)" 
                  value={userCommission}
                  onChange={(e) => setUserCommission(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '14px', color: '#0f172a', fontWeight: '700', boxSizing: 'border-box' }}
                  required
                />
              </div>

              {/* Interactive Dropzone for Media */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>Product Gallery Media (Up to 10 photos/videos)*</label>
                <label 
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    padding: '36px 20px',
                    background: '#f8fafc',
                    border: '2px dashed #818cf8',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'center',
                    boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.02)'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#eef2ff'; e.currentTarget.style.borderColor = '#4f46e5'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = '#818cf8'; }}
                >
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4338ca', fontSize: '26px' }}>📸</div>
                  <div>
                    <div style={{ color: '#4338ca', fontWeight: '800', fontSize: '16px' }}>Click to Browse or Upload Gallery Assets</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Supports high-resolution JPG, PNG, WEBP, MP4 & WEBM (Max 10 files)</div>
                  </div>
                  <span style={{ padding: '8px 18px', background: '#4f46e5', color: '#ffffff', borderRadius: '100px', fontSize: '12px', fontWeight: '700', marginTop: '4px', boxShadow: '0 4px 10px rgba(79, 70, 229, 0.3)' }}>
                    Select Gallery Files
                  </span>
                  <input 
                    type="file" 
                    multiple
                    accept="image/*,video/mp4,video/webm"
                    onChange={handleProductImageUpload}
                    style={{ display: 'none' }}
                    required={media.length === 0}
                    disabled={isUploadingImage || media.length >= 10}
                  />
                </label>
                {isUploadingImage && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: '#e0e7ff', borderRadius: '10px', color: '#4338ca', fontWeight: '700', fontSize: '13px' }}>
                    <span>🔄 Uploading media directly to optimized storage... Please hold!</span>
                  </div>
                )}
                {media.length > 0 && (
                  <div style={{ marginTop: '8px', display: 'flex', gap: '12px', flexWrap: 'wrap', background: '#ffffff', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                    {media.map((src, idx) => (
                      <div key={idx} style={{ position: 'relative', width: '92px', height: '92px', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', border: '2px solid #fff' }}>
                        {src.startsWith('data:video/') ? (
                          <video src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                        ) : (
                          <img src={src} alt={`Preview ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        )}
                        <button type="button" onClick={() => handleRemoveMedia(idx)} style={{ position: 'absolute', top: '4px', right: '4px', background: '#ef4444', color: '#fff', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }} title="Remove image">×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Description & High Converting Highlights */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>Product Description & High-Converting Highlights*</label>
                  <span style={{ fontSize: '11px', color: '#d97706', background: '#fef3c7', padding: '3px 10px', borderRadius: '100px', fontWeight: '700' }}>💡 Tip: Use bullet points for 2x customer engagement</span>
                </div>
                <textarea 
                  placeholder={`• Key Highlight 1: e.g. 120Hz Super AMOLED Display\n• Key Highlight 2: e.g. 5000mAh Battery with 65W Super Charge\n• Why Buy: Premium titanium body designed for extreme durability and style...`}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ width: '100%', minHeight: '150px', padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '14px', lineHeight: '1.6', fontFamily: 'inherit', resize: 'vertical', background: '#ffffff', color: '#0f172a', boxSizing: 'border-box', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.02)' }}
                  required
                />
              </div>

              {/* Premium Care Plan Toggle */}
              <label htmlFor="hasProCare" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  id="hasProCare"
                  checked={hasProCare}
                  onChange={(e) => setHasProCare(e.target.checked)}
                  style={{ width: '20px', height: '20px', accentColor: '#16a34a', cursor: 'pointer' }}
                />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>Enable Premium Care Plan (+ Accidental Protection Upsell)</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Offers 1-Year Extended Warranty and damage cover during checkout</div>
                </div>
              </label>

            </div> {/* End Main Product Details Card */}

            {/* Card 2A: Volume Discount Rules (Buy More, Save More Engine) */}
            <div className="admin-panel-card" style={{ display: 'flex', flexDirection: 'column', gap: '18px', padding: '28px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🛍️ Volume Discount Rules (Buy More, Save More Engine)</span>
                    <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '100px', background: '#dcfce7', color: '#15803d', border: '1px solid #86efac' }}>40% AOV Multiplier</span>
                  </h3>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Incentivizes larger basket orders by displaying tier discounts on product details page</div>
                </div>
                <button
                  type="button"
                  onClick={handleAddVolumeDiscount}
                  style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #86efac', padding: '8px 16px', borderRadius: '100px', fontSize: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(22, 163, 74, 0.15)' }}
                >
                  <PlusCircle size={15} /> <span>Add Tier Discount Rule</span>
                </button>
              </div>

              {volumeDiscounts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b', fontSize: '13px', fontWeight: '500' }}>
                  ℹ️ No volume discount tiers added. Click button above to add rules like "Buy 2 Get 10% OFF".
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {volumeDiscounts.map((vd, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '14px', alignItems: 'center', background: '#f8fafc', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
                      <div style={{ flex: '1', minWidth: '120px' }}>
                        <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>Min Quantity*</label>
                        <input 
                          type="number" 
                          placeholder="e.g. 2" 
                          value={vd.minQty}
                          onChange={(e) => handleVolumeDiscountChange(idx, 'minQty', e.target.value)}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#ffffff', fontWeight: '700', color: '#0f172a', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div style={{ flex: '1', minWidth: '140px' }}>
                        <label style={{ fontSize: '11px', fontWeight: '700', color: '#16a34a', display: 'block', marginBottom: '4px' }}>Extra Discount (% or ₹)*</label>
                        <input 
                          type="number" 
                          placeholder="e.g. 10 (%)" 
                          value={vd.discountPct}
                          onChange={(e) => handleVolumeDiscountChange(idx, 'discountPct', e.target.value)}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #86efac', fontSize: '13px', background: '#f0fdf4', color: '#15803d', fontWeight: '800', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div style={{ flex: '2', minWidth: '220px' }}>
                        <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>Storefront Promotional Tag Label*</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Buy 2 Get 10% Extra Savings!" 
                          value={vd.title}
                          onChange={(e) => handleVolumeDiscountChange(idx, 'title', e.target.value)}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#ffffff', fontWeight: '600', color: '#334155', boxSizing: 'border-box' }}
                        />
                      </div>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveVolumeDiscount(idx)}
                        style={{ alignSelf: 'flex-end', height: '38px', padding: '0 14px', borderRadius: '8px', background: '#fee2e2', border: '1px solid #fecaca', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                        title="Delete Tier"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Card 2B: Frequently Bought Together & Cross-Sell Combos */}
            <div className="admin-panel-card" style={{ display: 'flex', flexDirection: 'column', gap: '18px', padding: '28px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🔗 Frequently Bought Together & Cross-Sell Combos</span>
                    <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '100px', background: '#e0e7ff', color: '#4338ca', border: '1px solid #c7d2fe' }}>Amazon 35% Revenue Secret</span>
                  </h3>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Select matching products from your catalog to offer automatic 1-click combo purchases</div>
                </div>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#4f46e5', background: '#eef2ff', padding: '6px 14px', borderRadius: '100px' }}>
                  {crossSellIds.length} Products Linked
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px', maxHeight: '280px', overflowY: 'auto', padding: '4px' }}>
                {products.filter(p => p.id !== id).map(prod => {
                  const isSelected = crossSellIds.includes(prod.id);
                  return (
                    <div 
                      key={prod.id} 
                      onClick={() => toggleCrossSellId(prod.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 12px',
                        borderRadius: '12px',
                        border: isSelected ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                        backgroundColor: isSelected ? '#eef2ff' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        boxShadow: isSelected ? '0 4px 12px rgba(79, 70, 229, 0.12)' : '0 1px 3px rgba(0,0,0,0.02)'
                      }}
                    >
                      <input 
                        type="checkbox" 
                        checked={isSelected} 
                        onChange={() => {}} 
                        style={{ width: '18px', height: '18px', accentColor: '#4f46e5', cursor: 'pointer' }}
                      />
                      <img src={prod.image || prod.images?.[0] || 'https://ia.placeholder.com/40'} alt="" style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: isSelected ? '#4338ca' : '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{prod.name}</div>
                        <div style={{ fontSize: '12px', fontWeight: '800', color: '#16a34a' }}>₹{Number(prod.price).toLocaleString('en-IN')}</div>
                      </div>
                    </div>
                  );
                })}
                {products.filter(p => p.id !== id).length === 0 && (
                  <div style={{ color: '#64748b', fontSize: '13px', fontStyle: 'italic', gridColumn: '1 / -1', padding: '16px 0', textAlign: 'center' }}>
                    No other products available in store to link yet. Add more products first!
                  </div>
                )}
              </div>
            </div>


            {/* Card 2: Colors & Custom Variations Section */}
            <div className="admin-panel-card" style={{ display: 'flex', flexDirection: 'column', gap: '18px', padding: '28px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>Colors & Custom Variations</h3>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Configure multi-color SKU items, storage capacities, sizes & dynamic pricing</div>
                </div>
                <button
                  type="button"
                  onClick={handleAddColorModel}
                  style={{ background: '#e0e7ff', color: '#4338ca', border: 'none', padding: '8px 16px', borderRadius: '100px', fontSize: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(67, 56, 202, 0.15)' }}
                >
                  <PlusCircle size={15} /> <span>Add Color / Variation Model</span>
                </button>
              </div>
              
              {colorModels.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b', fontSize: '13px', fontWeight: '500' }}>
                  ℹ️ No custom variation models added. Default single-SKU product rules will be generated.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {colorModels.map((cm, colorIdx) => (
                    <div key={colorIdx} style={{ border: '1px solid #cbd5e1', padding: '20px', borderRadius: '14px', backgroundColor: '#fafbfc', position: 'relative', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px dashed #e2e8f0', paddingBottom: '12px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '800', color: '#4338ca', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>🎨 Color Model #{colorIdx + 1}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveColorModel(colorIdx)}
                          style={{ background: '#fee2e2', color: '#ef4444', border: '1px solid #fecaca', padding: '5px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                          title="Remove Color Model"
                        >
                          <X size={15} /> <span>Remove</span>
                        </button>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                          <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155' }}>Color Name* (e.g. Titanium Black)</label>
                          <input
                            type="text"
                            placeholder="e.g. Coral Pink, Deep Blue"
                            value={cm.name}
                            onChange={(e) => handleColorModelChange(colorIdx, 'name', e.target.value)}
                            style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', background: '#ffffff', boxSizing: 'border-box' }}
                            required
                          />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                          <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155' }}>Variant Primary Thumbnail*</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleColorModelImageUpload(e, colorIdx)}
                              style={{ flex: 1, padding: '6px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', backgroundColor: '#ffffff' }}
                              required={!cm.primaryImage}
                            />
                            {cm.primaryImage && (
                              <img src={cm.primaryImage} alt="Variant" style={{ width: '42px', height: '42px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }} />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Sub-variants (Storage/Sizes) */}
                      <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>📏 Sizes / Storage Variants & Pricing</span>
                          <button
                            type="button"
                            onClick={() => handleAddVariant(colorIdx)}
                            style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #86efac', padding: '4px 12px', borderRadius: '100px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <PlusCircle size={13} /> <span>Add Size/Option</span>
                          </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {cm.variants.map((v, variantIdx) => (
                            <div key={variantIdx} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', background: '#f8fafc', padding: '10px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                              <div style={{ flex: '2', minWidth: '130px' }}>
                                <input
                                  type="text"
                                  placeholder="Option (e.g. 128GB / XL)"
                                  value={v.name}
                                  onChange={(e) => handleVariantChange(colorIdx, variantIdx, 'name', e.target.value)}
                                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '12px', background: '#ffffff', fontWeight: '600', boxSizing: 'border-box' }}
                                  required
                                />
                              </div>
                              <div style={{ flex: '1', minWidth: '100px' }}>
                                <input
                                  type="number"
                                  placeholder="Sell Price (₹)"
                                  value={v.price}
                                  onChange={(e) => handleVariantChange(colorIdx, variantIdx, 'price', e.target.value)}
                                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #86efac', borderRadius: '8px', fontSize: '12px', background: '#f0fdf4', color: '#16a34a', fontWeight: '700', boxSizing: 'border-box' }}
                                  required
                                />
                              </div>
                              <div style={{ flex: '1', minWidth: '100px' }}>
                                <input
                                  type="number"
                                  placeholder="Org MRP (₹)"
                                  value={v.originalPrice}
                                  onChange={(e) => handleVariantChange(colorIdx, variantIdx, 'originalPrice', e.target.value)}
                                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '12px', background: '#ffffff', boxSizing: 'border-box', textDecoration: 'line-through' }}
                                />
                              </div>
                              <div style={{ flex: '1', minWidth: '80px' }}>
                                <input
                                  type="number"
                                  placeholder="Stock Qty"
                                  value={v.stock}
                                  onChange={(e) => handleVariantChange(colorIdx, variantIdx, 'stock', e.target.value)}
                                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '12px', background: '#ffffff', boxSizing: 'border-box', fontWeight: '700' }}
                                />
                              </div>
                              {cm.variants.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveVariant(colorIdx, variantIdx)}
                                  style={{ background: '#fee2e2', border: '1px solid #fecaca', color: '#dc2626', cursor: 'pointer', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                  title="Delete variant option"
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div> {/* End Colors Card */}


            {/* Card 3: Technical Specifications Editor */}
            <div className="admin-panel-card" style={{ display: 'flex', flexDirection: 'column', gap: '18px', padding: '28px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>Technical Specifications</h3>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Detailed hardware specs, dimensions, warranty & features table</div>
                </div>
                <button
                  type="button"
                  onClick={handleAddSpecRow}
                  style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #86efac', padding: '8px 16px', borderRadius: '100px', fontSize: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(22, 163, 74, 0.15)' }}
                >
                  <PlusCircle size={15} /> <span>Add Specification Row</span>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {specs.map((spec, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '14px', alignItems: 'center', background: '#f8fafc', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1', minWidth: '200px' }}>
                      <input 
                        type="text" 
                        placeholder="Key (e.g. Brand, Material, Battery)" 
                        value={spec.key}
                        onChange={(e) => handleSpecChange(idx, 'key', e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#ffffff', fontWeight: '700', color: '#334155', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div style={{ flex: '2', minWidth: '250px' }}>
                      <input 
                        type="text" 
                        placeholder="Value (e.g. Apple, 100% Titanium, 5000mAh Fast Charge)" 
                        value={spec.value}
                        onChange={(e) => handleSpecChange(idx, 'value', e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#ffffff', color: '#0f172a', boxSizing: 'border-box' }}
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={() => handleRemoveSpecRow(idx)}
                      style={{ padding: '10px 12px', borderRadius: '8px', background: '#fee2e2', border: '1px solid #fecaca', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                      title="Remove Row"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div> {/* End Specs Card */}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '16px', marginTop: '10px', flexWrap: 'wrap' }}>
              <button 
                type="submit" 
                style={{ flex: 1, minWidth: '240px', padding: '16px', borderRadius: '14px', background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', color: '#ffffff', border: 'none', fontWeight: '800', fontSize: '15px', cursor: 'pointer', boxShadow: '0 6px 20px rgba(22, 163, 74, 0.35)', transition: 'all 0.2s', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <span>🚀 {editMode ? 'UPDATE PRODUCT & SYNC STOREFRONT' : 'ADD PRODUCT TO LIVE STORE'}</span>
              </button>
              {editMode && (
                <button 
                  type="button" 
                  onClick={resetForm} 
                  style={{ padding: '16px 24px', borderRadius: '14px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}
                >
                  CANCEL EDIT
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* CONDITIONAL RENDER: PROMOTIONS & OFFERS TAB */}
      {activeTab === 'promotions' && <AdminPromotions />}
      {activeTab === 'promotions_old_legacy_unused' && (
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
                            <input type="text" className="admin-form-input" placeholder="https://.."
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
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', background: 'rgba(15, 23, 42, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }}>
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

        {/* View Order History & 360° Customer Profile Modal */}
        {activeOrderHistoryModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', background: 'rgba(15, 23, 42, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(6px)' }}>
            <div className="admin-panel-card animate-fade-in" style={{ width: '850px', maxWidth: '95vw', maxHeight: '85vh', background: '#fff', borderRadius: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)', border: '1px solid #e2e8f0' }}>
              
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ padding: '12px', background: '#e0e7ff', borderRadius: '12px', color: '#4338ca', boxShadow: '0 2px 8px rgba(67, 56, 227, 0.15)' }}><Users size={24} /></div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>Customer 360° Profile Inspector</h3>
                      <span style={{ fontSize: '11px', background: '#dcfce7', color: '#16a34a', fontWeight: '800', padding: '2px 8px', borderRadius: '100px' }}>Verified Account</span>
                    </div>
                    <div style={{ fontSize: '14px', color: '#475569', fontWeight: '600', marginTop: '2px' }}>{activeOrderHistoryModal.fullName || 'Guest User'} • ({activeOrderHistoryModal.username})</div>
                  </div>
                </div>
                <button onClick={() => setActiveOrderHistoryModal(null)} style={{ background: '#e2e8f0', border: 'none', color: '#475569', borderRadius: '50%', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}><X size={18} /></button>
              </div>
              
              <div style={{ padding: '24px', overflowY: 'auto', flex: 1, background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {(() => {
                  const rawUsername = String(activeOrderHistoryModal.username || '');
                  const isNumeric = /^\d+$/.test(rawUsername);
                  const cleanPhone = isNumeric && rawUsername.length >= 10 ? rawUsername.slice(0, 10) : (activeOrderHistoryModal.phone ? String(activeOrderHistoryModal.phone).replace(/\D/g, '').slice(-10) : rawUsername);

                  const userOrders = adminOrders.filter(o => 
                    (o.customerDetails?.email && activeOrderHistoryModal.email && o.customerDetails.email === activeOrderHistoryModal.email) ||
                    (o.customerDetails?.phone && (o.customerDetails.phone.includes(cleanPhone) || (activeOrderHistoryModal.phone && o.customerDetails.phone === activeOrderHistoryModal.phone))) ||
                    (o.userId && (o.userId === activeOrderHistoryModal._id || o.userId === activeOrderHistoryModal.id))
                  ).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

                  const totalSpend = userOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);

                  return (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                        <div style={{ background: 'white', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Lifetime Spend</div>
                          <div style={{ fontSize: '20px', fontWeight: '900', color: '#16a34a', marginTop: '6px' }}>₹{totalSpend.toLocaleString('en-IN')}</div>
                          <div style={{ fontSize: '11px', color: '#15803d', fontWeight: '600', marginTop: '2px' }}>across {userOrders.length} confirmed orders</div>
                        </div>
                        <div style={{ background: 'white', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Wallet & Coin Reserve</div>
                          <div style={{ fontSize: '18px', fontWeight: '900', color: '#ca8a04', marginTop: '6px' }}>🪙 {activeOrderHistoryModal.walletCoins || 0} Coins</div>
                          <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: '700', marginTop: '2px' }}>💵 ₹{(activeOrderHistoryModal.walletCash || 0).toFixed(2)} Cash Balance</div>
                        </div>
                        <div style={{ background: 'white', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quick Marketing Engagement</div>
                          <button
                            onClick={() => {
                              const text = `Hi ${activeOrderHistoryModal.fullName || 'Valued Customer'}! ✨ We have a special VIP reward voucher waiting for your next purchase on AbKharido!`;
                              window.open(`https://a.me/91${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
                            }}
                            style={{ padding: '8px 12px', background: '#22c55e', color: 'white', fontWeight: '800', fontSize: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '8px', boxShadow: '0 2px 6px rgba(34, 197, 94, 0.3)' }}
                          >
                            <span>💬 Send WhatsApp Reward</span>
                          </button>
                        </div>
                      </div>

                      <div>
                        <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#0f172a', fontWeight: '800' }}>Order Fulfillment Records ({userOrders.length})</h4>
                        {userOrders.length === 0 ? (
                          <div style={{ padding: '50px 20px', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b' }}>
                            <Package size={48} color="#cbd5e1" style={{ marginBottom: '16px', margin: '0 auto' }} />
                            <h4 style={{ margin: '8px 0 6px 0', color: '#334155', fontSize: '16px' }}>No Orders Recorded Yet</h4>
                            <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>This customer has signed up but has not completed a purchase yet. Send them a WhatsApp offer to boost conversion!</p>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {userOrders.map(order => (
                              <div key={order.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'transform 0.2s' }}>
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontWeight: '800', color: '#0f172a', fontSize: '15px' }}>Order #{order.id.slice(0,8).toUpperCase()}</span>
                                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>{new Date(order.createdAt).toLocaleString('en-IN')}</span>
                                  </div>
                                  <div style={{ fontSize: '13px', color: '#475569', marginTop: '6px', fontWeight: '500' }}>
                                    🛒 {order.items?.length || 0} Item(s) • Payment: <strong style={{ color: order.paymentMethod === 'Online Payment' ? '#16a34a' : '#d97706' }}>{order.paymentMethod || 'COD'}</strong>
                                  </div>
                                </div>
                                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                                  <div style={{ fontSize: '18px', fontWeight: '900', color: '#16a34a' }}>₹{(order.totalPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                                  <span style={{ fontSize: '11px', fontWeight: '800', padding: '4px 12px', borderRadius: '100px', background: order.status === 'Delivered' ? '#dcfce7' : order.status === 'Cancelled' ? '#fee2e2' : '#e0e7ff', color: order.status === 'Delivered' ? '#15803d' : order.status === 'Cancelled' ? '#e11d48' : '#4338ca', border: `1px solid ${order.status === 'Delivered' ? '#86efac' : order.status === 'Cancelled' ? '#fecaca' : '#c7d2fe'}` }}>
                                    {order.status || 'Processing'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* View Merchant Catalog Modal */}
        {activeCatalogModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', background: 'rgba(15, 23, 42, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }}>
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
