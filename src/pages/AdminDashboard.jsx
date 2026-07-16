import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  PlusCircle, 
  Trash2, 
  Settings, 
  Package, 
  Image, 
  Tag, 
  DollarSign, 
  Coins, 
  Layers,
  ArrowLeft,
  X,
  FileText,
  Users,
  ShieldAlert,
  Store
} from 'lucide-react';
import '../assets/styles/admin.css';

const AdminDashboard = ({ onNavigate, promotions, onUpdatePromotions }) => {
  const { products, addProduct, removeProduct, showToast } = useApp();
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'orders' | 'users' | 'promotions'
  const [adminOrders, setAdminOrders] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminSellers, setAdminSellers] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [sellerSearchQuery, setSellerSearchQuery] = useState('');
  const [inventorySearchQuery, setInventorySearchQuery] = useState('');

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

    if (file.size > 3 * 1024 * 1024) {
      showToast('Image file size must be under 3MB.', 'error');
      return;
    }

    setUploadingImage(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result;
      const token = sessionStorage.getItem('abkharido_admin_token') || '';
      try {
        const res = await fetch('/api/admin/upload-banner', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-token': token
          },
          body: JSON.stringify({
            base64Data,
            fileName: file.name
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.imageUrl) {
            setNewSlideImage(data.imageUrl);
            showToast('Banner image uploaded successfully!', 'success');
          }
        } else {
          showToast('Failed to upload banner file to server.', 'error');
        }
      } catch (err) {
        showToast('Network error during file upload.', 'error');
      } finally {
        setUploadingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Upload image for a category slide form
  const handleCatSlideImageUpload = async (catKey, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      showToast('Image must be under 3MB.', 'error');
      return;
    }
    setCatSlideForm(prev => ({ ...prev, [catKey]: { ...prev[catKey], uploading: true } }));
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result;
      const token = sessionStorage.getItem('abkharido_admin_token') || '';
      try {
        const res = await fetch('/api/admin/upload-banner', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
          body: JSON.stringify({ base64Data, fileName: `${catKey}-slide-${file.name}` })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.imageUrl) {
            setCatSlideForm(prev => ({ ...prev, [catKey]: { ...prev[catKey], image: data.imageUrl, uploading: false } }));
            showToast('Image uploaded!', 'success');
          }
        } else {
          showToast('Upload failed.', 'error');
          setCatSlideForm(prev => ({ ...prev, [catKey]: { ...prev[catKey], uploading: false } }));
        }
      } catch {
        showToast('Network error.', 'error');
        setCatSlideForm(prev => ({ ...prev, [catKey]: { ...prev[catKey], uploading: false } }));
      }
    };
    reader.readAsDataURL(file);
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
      const res = await fetch('/api/admin/verify', {
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
      const res = await fetch('/api/orders?email=admin', {
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

  const handleUpdateStatus = async (orderId, newStatus) => {
    const token = sessionStorage.getItem('abkharido_admin_token') || '';
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
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
      const res = await fetch('/api/sellers', {
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
      const res = await fetch('/api/users', {
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

  const handleToggleUserRole = async (userObj) => {
    const token = sessionStorage.getItem('abkharido_admin_token') || '';
    const isCurrentlyCreator = userObj.isInfluencer;
    const targetState = !isCurrentlyCreator;
    
    const cleanPhone = (userObj.phone || userObj.username).replace(/\D/g, '');
    const suffix = cleanPhone.substring(cleanPhone.length - 4) || Math.floor(1000 + Math.random() * 9000);
    const creatorCode = targetState ? `CREATOR-${suffix}` : '';
    const influencerId = targetState ? `INF-${suffix}` : '';

    try {
      const res = await fetch(`/api/users/${userObj.username}/update`, {
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

  const handleToggleSellerRole = async (sellerObj) => {
    const token = sessionStorage.getItem('abkharido_admin_token') || '';
    const isCurrentlySeller = sellerObj.isApproved;
    const targetState = !isCurrentlySeller;

    try {
      const res = await fetch(`/api/sellers/${sellerObj.email}/verify`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-token': token
        },
        body: JSON.stringify({
          isApproved: targetState
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
  const [image, setImage] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [description, setDescription] = useState('');
  const [inStock, setInStock] = useState(true);

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
  const [infCommission, setInfCommission] = useState('0.03'); // 3%
  const [userCommission, setUserCommission] = useState('0.012'); // 1.2%

  // Update commission presets automatically when changing category
  const handleCategoryChange = (cat) => {
    setCategory(cat);
    switch (cat) {
      case 'fashion':
        setInfCommission('0.07');
        setUserCommission('0.03');
        break;
      case 'home':
        setInfCommission('0.05');
        setUserCommission('0.02');
        break;
      case 'appliances':
        setInfCommission('0.04');
        setUserCommission('0.015');
        break;
      case 'electronics':
        setInfCommission('0.03');
        setUserCommission('0.012');
        break;
      case 'mobiles':
        setInfCommission('0.02');
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
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('Image size should be less than 2MB', 'error');
      e.target.value = '';
      return;
    }

    setIsUploadingImage(true);
    const token = sessionStorage.getItem('abkharido_admin_token') || '';

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result;
        
        const res = await fetch('/api/admin/upload-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-token': token
          },
          body: JSON.stringify({
            base64Data,
            fileName: file.name
          })
        });

        const data = await res.json();
        if (data.success && data.imageUrl) {
          setImage(data.imageUrl);
          showToast('Image uploaded successfully', 'success');
        } else {
          showToast(data.error || 'Failed to upload image', 'error');
        }
        setIsUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Image upload failed:', err);
      showToast('Error uploading image', 'error');
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!id || !name || !price || !originalPrice || !image || !description) {
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
      image,
      description,
      specifications: cleanSpecs,
      influencerCommissionRate: Number(infCommission),
      userCommissionRate: Number(userCommission),
      inStock,
      colorModels: cleanColorModels.length > 0 ? cleanColorModels : undefined
    };

    // Call context to append to products state list
    addProduct(newProduct);

    // Clear form
    setId('');
    setName('');
    setPrice('');
    setOriginalPrice('');
    setImage('');
    setDescription('');
    setSpecs([
      { key: 'Brand', value: '' },
      { key: 'Model', value: '' }
    ]);
    setColorModels([]);
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
    <div className="container admin-container animate-fade-in">
      
      {/* Header bar */}
      <div className="admin-header">
        <div className="admin-title-area">
          <h1 className="admin-title"><Settings size={22} color="var(--primary-color)" /> Backend Inventory Controller</h1>
          <span className="admin-subtitle">Direct Warehousing - Add, remove, and audit our products database.</span>
        </div>
        <button className="btn btn-outline" onClick={() => onNavigate('home')}>
          <ArrowLeft size={16} /> Back to Storefront
        </button>
      </div>

      {/* Admin Tab controls */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid #eaeaea', paddingBottom: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setActiveTab('inventory')}
          className={`btn ${activeTab === 'inventory' ? 'btn-primary' : 'btn-outline'}`}
          style={{ height: '36px', padding: '0 16px', fontSize: '13px', display: 'flex', gap: '6px', alignItems: 'center' }}
        >
          <Package size={16} /> Manage Inventory ({products.length})
        </button>
        <button 
          onClick={() => setActiveTab('orders')}
          className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-outline'}`}
          style={{ height: '36px', padding: '0 16px', fontSize: '13px', display: 'flex', gap: '6px', alignItems: 'center' }}
        >
          <FileText size={16} /> Manage Orders ({adminOrders.length})
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-outline'}`}
          style={{ height: '36px', padding: '0 16px', fontSize: '13px', display: 'flex', gap: '6px', alignItems: 'center' }}
        >
          <Users size={16} /> Referral & Users ({adminUsers.length})
        </button>
        <button 
          onClick={() => setActiveTab('promotions')}
          className={`btn ${activeTab === 'promotions' ? 'btn-primary' : 'btn-outline'}`}
          style={{ height: '36px', padding: '0 16px', fontSize: '13px', display: 'flex', gap: '6px', alignItems: 'center' }}
        >
          <Tag size={16} /> Banners & Offers ({banners.length})
        </button>
      </div>

      {/* CONDITIONAL RENDER: ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="admin-panel-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 className="admin-form-title"><FileText size={18} color="var(--primary-color)" /> Platform Orders List</h3>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer Email</th>
                  <th>Items Detail</th>
                  <th>Total Amount</th>
                  <th>Milestone Status</th>
                  <th>Payment Info</th>
                  <th>Referral Details</th>
                  <th>Quick Admin Actions</th>
                </tr>
              </thead>
              <tbody>
                {adminOrders.map(o => {
                  // Calculate dynamic commission for display
                  let commissionText = 'None';
                  if (o.referralApplied) {
                    const { type, referrerId } = o.referralApplied;
                    let totalCommission = 0;
                    (o.items || []).forEach(item => {
                      if (item && item.product) {
                        const rate = type === 'aff' 
                          ? (item.product.influencerCommissionRate || 0) 
                          : (item.product.userCommissionRate || 0);
                        totalCommission += (item.product.price || 0) * (item.quantity || 1) * rate;
                      }
                    });
                    
                    if (type === 'aff') {
                      commissionText = `Creator: ${referrerId} (Earned ₹${(Math.round(totalCommission * 100) / 100).toFixed(2)})`;
                    } else {
                      commissionText = `User: ${referrerId} (Earned ${Math.round(totalCommission)} Coins)`;
                    }
                  }

                  return (
                    <tr key={o.id}>
                      <td><code>{o.id}</code></td>
                      <td>
                        <div style={{ fontWeight: 'bold' }}>{o.customerUsername}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{o.date}</div>
                      </td>
                      <td>
                        {(o.items || []).map((item, idx) => (
                          <div key={item?.product?.id || idx} style={{ fontSize: '12px' }}>
                            • {item?.product?.name ? item.product.name.substring(0, 20) : 'Deleted Product'}... (x{item?.quantity || 1})
                          </div>
                        ))}
                      </td>
                      <td>
                        <div style={{ fontWeight: 'bold' }}>₹{o.finalAmount.toLocaleString('en-IN')}</div>
                        {o.coinsDiscountValue > 0 && <div style={{ fontSize: '11px', color: '#e68f00' }}>(-{o.coinsDiscountValue} Coins)</div>}
                      </td>
                      <td>
                        <span className={`badge ${
                          o.status === 'Delivered' ? 'badge-success' : 
                          o.status === 'CANCELLED' ? 'badge-danger' : 'badge-info'
                        }`} style={{ fontSize: '11px' }}>
                          {o.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '12px' }}>Mode: <strong>{o.paymentMethod}</strong></div>
                        <div style={{ fontSize: '11px', color: o.paymentStatus === 'SUCCESS' ? 'var(--success)' : 'var(--error)' }}>
                          {o.paymentStatus}
                        </div>
                      </td>
                      <td>
                        {o.referralApplied ? (
                          <div style={{ fontSize: '12px', lineHeight: '1.3' }}>
                            <div style={{ fontWeight: 'bold', color: o.referralApplied.type === 'aff' ? 'var(--success)' : '#e68f00' }}>
                              {o.referralApplied.type === 'aff' ? ' Verified Creator' : ' Regular Refer'}
                            </div>
                            <div style={{ color: '#555', fontSize: '11px' }}>{commissionText}</div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#888', fontStyle: 'italic' }}>Direct (No refer)</span>
                        )}
                      </td>
                      <td>
                        {o.status !== 'CANCELLED' && o.status !== 'Delivered' && (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <select 
                              value={o.status}
                              onChange={(e) => handleUpdateStatus(o.id, e.target.value)}
                              style={{ fontSize: '12px', padding: '4px', border: '1px solid #ddd', borderRadius: '4px' }}
                            >
                              <option value="Processing">Processing</option>
                              <option value="Packed">Packed</option>
                              <option value="In Transit">In Transit</option>
                              <option value="Delivered">Delivered</option>
                            </select>
                          </div>
                        )}
                        {(o.status === 'CANCELLED' || o.status === 'Delivered') && (
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Archived</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONDITIONAL RENDER: REFERRAL & USERS TAB */}
      {activeTab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Regular Users / Customer Accounts */}
          <div className="admin-panel-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <h3 className="admin-form-title" style={{ margin: 0 }}><Users size={18} color="var(--primary-color)" /> Platform Customer Accounts & Referral Data</h3>
              
              {/* Search Input */}
              <div style={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden', height: '34px', width: '260px' }}>
                <input 
                  type="text" 
                  placeholder="Search mobile number or name..." 
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  style={{ border: 'none', padding: '0 10px', fontSize: '13px', outline: 'none', width: '100%' }}
                />
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
                      const totalSalesVolume = referredOrdersList.reduce((sum, o) => sum + o.finalAmount, 0);

                      return (
                        <tr key={u.username}>
                          <td>
                            <div style={{ fontWeight: 'bold' }}>{u.username}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Joined platform</div>
                          </td>
                          <td>{u.fullName || 'Guest User'}</td>
                          <td>{u.email || <span style={{ color: '#888', fontStyle: 'italic' }}>Not provided</span>}</td>
                          <td>
                            <span className={`badge ${u.emailVerified ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '11px' }}>
                              {u.emailVerified ? 'Email Verified ✓' : 'Email Pending ✕'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <span className={`badge ${u.isInfluencer ? 'badge-success' : 'badge-info'}`} style={{ fontSize: '10px', backgroundColor: u.isInfluencer ? 'var(--success)' : '#eaeaea', color: u.isInfluencer ? 'white' : '#555' }}>
                                {u.isInfluencer ? ' Verified Creator' : 'Regular Customer'}
                              </span>
                            </div>
                          </td>
                          <td>
                            {u.isInfluencer && (
                              <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                                <div>Creator ID: <code>{u.influencerId || 'N/A'}</code></div>
                                <div style={{ fontWeight: 'bold', color: 'var(--success)' }}>Code: {u.creatorCode || 'N/A'}</div>
                              </div>
                            )}
                            {!u.isInfluencer && (
                              <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                                <div style={{ color: '#888' }}>Code: {u.referralCode || 'N/A'}</div>
                              </div>
                            )}
                          </td>
                          <td>
                            <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
                              <div style={{ color: '#e68f00', fontWeight: 'bold' }}>🪙 {u.walletCoins || 0} Coins</div>
                              <div style={{ color: 'var(--success)', fontWeight: 'bold' }}>💵 ₹{(u.walletCash || 0).toFixed(2)} Cash</div>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
                              <div style={{ fontWeight: 'bold', color: salesCount > 0 ? 'var(--success)' : '#777' }}>
                                📈 {salesCount} referred sales
                              </div>
                              {salesCount > 0 && (
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
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
                                  fontSize: '11px',
                                  padding: '4px 8px',
                                  borderColor: u.isInfluencer ? 'var(--error)' : 'var(--success)',
                                  color: u.isInfluencer ? 'var(--error)' : 'var(--success)',
                                  height: '28px'
                                }}
                                onClick={() => handleToggleUserRole(u)}
                              >
                                {u.isInfluencer ? 'Demote Creator' : 'Verify Creator'}
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

          {/* Decoupled Merchant Accounts Section */}
          <div className="admin-panel-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <h3 className="admin-form-title" style={{ margin: 0 }}><Store size={18} color="var(--primary-color)" /> Marketplace Merchant Shops (Decoupled Registry)</h3>
              <div style={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden', height: '34px', width: '260px' }}>
                <input 
                  type="text" 
                  placeholder="Search shop name or email..." 
                  value={sellerSearchQuery}
                  onChange={(e) => setSellerSearchQuery(e.target.value)}
                  style={{ border: 'none', padding: '0 10px', fontSize: '13px', outline: 'none', width: '100%' }}
                />
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
                            <span className={`badge ${s.isApproved ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '11px' }}>
                              {s.isApproved ? 'Approved Merchant' : 'Awaiting Audit'}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-outline"
                              style={{
                                fontSize: '11px',
                                padding: '4px 8px',
                                borderColor: s.isApproved ? 'var(--error)' : 'var(--primary-color)',
                                color: s.isApproved ? 'var(--error)' : 'var(--primary-color)',
                                height: '28px'
                              }}
                              onClick={() => handleToggleSellerRole(s)}
                            >
                              {s.isApproved ? 'Demote Merchant' : 'Approve Merchant'}
                            </button>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CONDITIONAL RENDER: INVENTORY TAB */}
      {activeTab === 'inventory' && (
        <div className="admin-grid">
        
        {/* LEFT COLUMN: PRODUCTS AUDIT LIST */}
        <div className="admin-panel-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 className="admin-form-title"><Package size={18} color="var(--primary-color)" /> Live Inventory ({products.length} Products)</h3>
          
          {/* Inventory Search Input */}
          <div style={{ marginBottom: '4px' }}>
            <input 
              type="text"
              className="admin-form-input"
              placeholder="Search by product name, ID, or category..."
              value={inventorySearchQuery}
              onChange={(e) => setInventorySearchQuery(e.target.value)}
              style={{ width: '100%', padding: '8px 14px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)' }}
            />
          </div>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Preview</th>
                  <th>ID / Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Creator Payout</th>
                  <th>User Payout</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const filtered = products.filter(prod => {
                    const query = inventorySearchQuery.toLowerCase().trim();
                    if (!query) return true;
                    const name = (prod.name || '').toLowerCase();
                    const id = (prod.id || '').toLowerCase();
                    const category = (prod.category || '').toLowerCase();
                    return name.includes(query) || id.includes(query) || category.includes(query);
                  });

                  if (filtered.length === 0) {
                    return (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                          No matching inventory products found.
                        </td>
                      </tr>
                    );
                  }

                  return filtered.map(prod => (
                  <tr key={prod.id}>
                    <td>
                      <img src={prod.image} alt={prod.name} className="admin-prod-thumb" />
                    </td>
                    <td>
                      <div style={{ fontWeight: 'bold' }}>{(prod.name || '').substring(0, 40)}...</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>ID: <code>{prod.id || ''}</code></div>
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>{prod.category || ''}</td>
                    <td>
                      <div style={{ fontWeight: 'bold' }}>₹{(prod.price || 0).toLocaleString('en-IN')}</div>
                      <div style={{ fontSize: '11px', textDecoration: 'line-through', color: 'var(--text-secondary)' }}>₹{(prod.originalPrice || 0).toLocaleString('en-IN')}</div>
                    </td>
                    <td style={{ color: 'var(--success)', fontWeight: 'bold' }}>{((prod.influencerCommissionRate || 0) * 100).toFixed(1)}%</td>
                    <td style={{ color: '#e68f00', fontWeight: 'bold' }}>{((prod.userCommissionRate || 0) * 100).toFixed(1)}%</td>
                    <td>
                      <button 
                        className="admin-action-btn-danger" 
                        onClick={() => removeProduct(prod.id)}
                        title="Remove product from store"
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    </td>
                  </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN: ADD NEW PRODUCT FORM */}
        <div className="admin-panel-card">
          <h3 className="admin-form-title"><PlusCircle size={18} color="var(--primary-color)" /> Add New Product</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
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
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label-txt">Influencer Cash rate*</label>
                <input 
                  type="number" 
                  step="0.005"
                  placeholder="e.g. 0.07" 
                  value={infCommission}
                  onChange={(e) => setInfCommission(e.target.value)}
                  className="form-input-field"
                  required
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label-txt">User Coins rate*</label>
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
              <label className="form-label-txt">Product Image*</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleProductImageUpload}
                  className="form-input-field"
                  style={{ flex: 1, padding: '6px' }}
                  required={!image}
                />
                {isUploadingImage && <span style={{ fontSize: '12px', color: 'var(--primary-color)' }}>Uploading...</span>}
              </div>
              {image && (
                <div style={{ marginTop: '8px', position: 'relative', display: 'inline-block' }}>
                  <img src={image} alt="Preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-light)' }} />
                  <button type="button" onClick={() => setImage('')} style={{ position: 'absolute', top: '-6px', right: '-6px', background: 'white', border: '1px solid #ccc', borderRadius: '50%', width: '20px', height: '20px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
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

            {/* Colors & Custom Variations Section */}
            <div className="form-group" style={{ border: '1px solid #e0e0e0', padding: '12px', borderRadius: '6px', backgroundColor: '#fdfdfd', marginTop: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className="form-label-txt" style={{ fontWeight: '700', color: '#212121', margin: 0 }}>Colors & Custom Variations</label>
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
                          <label style={{ display: 'block', fontSize: '11px', color: '#555', marginBottom: '4px' }}>Primary Image URL*</label>
                          <input
                            type="url"
                            placeholder="Primary image link"
                            value={cm.primaryImage}
                            onChange={(e) => handleColorModelChange(colorIdx, 'primaryImage', e.target.value)}
                            style={{ width: '100%', height: '32px', padding: '0 8px', border: '1px solid #dcdcdc', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box' }}
                            required
                          />
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
            </div>

            {/* Specifications editor list */}
            <div className="form-group">
              <label className="form-label-txt">Technical Specifications</label>
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

            <button type="submit" className="btn btn-accent" style={{ marginTop: '12px' }}>
              ADD PRODUCT TO STORE
            </button>
          </form>
        </div>

      </div>
      )}

      {/* CONDITIONAL RENDER: PROMOTIONS & OFFERS TAB */}
      {activeTab === 'promotions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Card 1: Announcement Bar */}
          <div className="admin-panel-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 className="admin-form-title"><Tag size={18} color="var(--primary-color)" /> Dynamic Announcement Bar</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input 
                type="checkbox" 
                id="show-announcement-chk"
                checked={announcementShow} 
                onChange={(e) => setAnnouncementShow(e.target.checked)} 
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label htmlFor="show-announcement-chk" style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', cursor: 'pointer' }}>
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
          </div>

          {/* Card 2: Flash Sale Countdown Timer & Budget Store */}
          <div className="admin-panel-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 className="admin-form-title"><Settings size={18} color="var(--primary-color)" /> Flash Sale & Budget Settings</h3>
            
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
          </div>

          {/* Card 3: Hero Carousel Banners */}
          <div className="admin-panel-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 className="admin-form-title"><Image size={18} color="var(--primary-color)" /> Homepage Slides / Banners ({banners.length})</h3>
            
            {/* Slide List */}
            {banners.length === 0 ? (
              <div style={{ padding: '16px', border: '1px dashed var(--border-light)', borderRadius: '6px', textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
                No custom slides configured. Default slides are currently being displayed.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {banners.map((slide, idx) => (
                  <div 
                    key={idx} 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      border: '1px solid var(--border-light)',
                      borderRadius: '6px',
                      background: slide.image ? `url(${slide.image}) no-repeat center center` : (slide.bg || 'var(--primary-color)'),
                      backgroundSize: 'cover',
                      color: 'white',
                      boxShadow: 'inset 0 0 100px rgba(0,0,0,0.4)',
                      textShadow: '0 1px 4px rgba(0,0,0,0.6)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {slide.image && (
                        <img 
                          src={slide.image} 
                          alt="preview" 
                          style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.4)' }} 
                        />
                      )}
                      <div>
                        <div style={{ fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', opacity: 0.9 }}>
                          {slide.tag || 'PROMOTION'} {slide.imageOnly && '• IMAGE ONLY'}
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: '700' }}>{slide.title || 'Custom Image Banner'}</div>
                        <div style={{ fontSize: '11px', opacity: 0.9 }}>{slide.desc || 'No text overlay'}</div>
                        <div style={{ fontSize: '10px', marginTop: '4px', fontWeight: 'bold' }}>Target: {slide.cat}</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        const updated = banners.filter((_, i) => i !== idx);
                        setBanners(updated);
                      }}
                      className="btn btn-sm btn-accent"
                      style={{ padding: '6px', height: '30px', width: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#d32f2f', border: 'none' }}
                      title="Delete Slide"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Slide Creator Form */}
            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px', marginTop: '10px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '12px', color: 'var(--text-primary)' }}>Create New Slide</h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                {/* Image Banner Mode Toggles */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', background: 'var(--bg-light)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
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
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <label htmlFor="use-custom-img-chk" style={{ fontSize: '12px', fontWeight: '600', cursor: 'pointer', color: 'var(--text-primary)' }}>
                      Use Custom Designed Image (Canva/Photoshop Banner)
                    </label>
                  </div>

                  {newSlideUseImage && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input 
                        type="checkbox" 
                        id="image-only-banner-chk"
                        checked={newSlideImageOnly}
                        onChange={(e) => setNewSlideImageOnly(e.target.checked)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <label htmlFor="image-only-banner-chk" style={{ fontSize: '12px', fontWeight: '600', cursor: 'pointer', color: 'var(--text-primary)' }}>
                        Image-Only Banner (Hide title/text/button overlays)
                      </label>
                    </div>
                  )}
                </div>

                {newSlideUseImage && (
                  <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', padding: '12px', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#4f46e5' }}>
                      👉 Recommended Banner Size: 1200 x 400 pixels (aspect ratio 3:1) for optimal high-resolution display on mobile and desktop.
                    </div>
                    
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <label className="form-label-txt">Upload Banner Image File (Max 3MB)</label>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={handleBannerFileUpload}
                          className="admin-form-input"
                          style={{ padding: '6px 12px' }}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <label className="form-label-txt">Or paste Image URL directly</label>
                        <input 
                          type="text" 
                          className="admin-form-input" 
                          placeholder="e.g. https://imgbb.com/my-banner.jpg"
                          value={newSlideImage} 
                          onChange={(e) => setNewSlideImage(e.target.value)} 
                        />
                      </div>
                    </div>
                    
                    {uploadingImage && (
                      <div style={{ fontSize: '11px', color: '#4f46e5', fontWeight: 'bold' }}>
                        Uploading image file... Please wait.
                      </div>
                    )}

                    {newSlideImage && (
                      <div style={{ marginTop: '4px' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Uploaded Image URL: <code>{newSlideImage}</code></div>
                        <img 
                          src={newSlideImage} 
                          alt="Uploaded Banner Preview" 
                          style={{ marginTop: '6px', width: '100%', maxHeight: '100px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-light)' }} 
                        />
                      </div>
                    )}
                  </div>
                )}

                {(!newSlideUseImage || !newSlideImageOnly) ? (
                  <>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <label className="form-label-txt">Slide Title*</label>
                        <input 
                          type="text" 
                          className="admin-form-input" 
                          value={newSlideTitle} 
                          onChange={(e) => setNewSlideTitle(e.target.value)} 
                          placeholder="e.g. Monsoon Sale Live!"
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label className="form-label-txt">Tag Ribbon text</label>
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
                      <label className="form-label-txt">Slide Description*</label>
                      <input 
                        type="text" 
                        className="admin-form-input" 
                        value={newSlideDesc} 
                        onChange={(e) => setNewSlideDesc(e.target.value)} 
                        placeholder="e.g. Get up to 60% cashback on fashion catalog today."
                      />
                    </div>
                  </>
                ) : null}

                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label className="form-label-txt">Click Target Category*</label>
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
                      <label className="form-label-txt">Background color/gradient*</label>
                      <select 
                        className="admin-form-input"
                        value={newSlideBg}
                        onChange={(e) => setNewSlideBg(e.target.value)}
                      >
                        <option value="linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)">Electric Indigo (Brand Primary)</option>
                        <option value="linear-gradient(135deg, #fda4af 0%, #f43f5e 100%)">Vivid Coral Rose (Accent Brand)</option>
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

                    // Reset form inputs
                    setNewSlideTitle('');
                    setNewSlideDesc('');
                    setNewSlideTag('');
                    setNewSlideImage('');
                    setNewSlideUseImage(false);
                    setNewSlideImageOnly(false);
                  }}
                  className="btn btn-outline btn-sm"
                  style={{ display: 'flex', gap: '6px', justifyContent: 'center', width: 'fit-content' }}
                >
                  <PlusCircle size={14} /> Add Slide to List
                </button>
              </div>
            </div>
          </div>

          {/* Card 4: Category Page Banners — Multi-Slide */}
          <div className="admin-panel-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 className="admin-form-title"><Layers size={18} color="var(--primary-color)" /> Category Page Banners</h3>
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

          {/* Save Promotions Button */}
          <button 
            disabled={isSaving}
            onClick={async () => {
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
                const res = await fetch('/api/promotions', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
                  body: JSON.stringify(payload)
                });
                if (res.ok) {
                  const data = await res.json();
                  if (data.success) {
                    showToast('✅ Saved! Banners are now live on the website.', 'success');
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
            }}
            className="btn btn-accent btn-lg"
            style={{ width: '100%', padding: '12px', display: 'flex', justifyContent: 'center', opacity: isSaving ? 0.7 : 1 }}
          >
            {isSaving ? 'Saving...' : 'SAVE ALL PROMOTIONS AND LIVE BROADCAST'}
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
