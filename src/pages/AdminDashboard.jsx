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

const AdminDashboard = ({ onNavigate }) => {
  const { products, addProduct, removeProduct, showToast } = useApp();
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'orders' | 'users'
  const [adminOrders, setAdminOrders] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminSellers, setAdminSellers] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [sellerSearchQuery, setSellerSearchQuery] = useState('');

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
                {products.map(prod => (
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
                ))}
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
              <label className="form-label-txt">Image URL*</label>
              <input 
                type="url" 
                placeholder="https://images.unsplash.com/..." 
                value={image}
                onChange={(e) => setImage(e.target.value)}
                className="form-input-field"
                required
              />
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
    </div>
  );
};

export default AdminDashboard;
