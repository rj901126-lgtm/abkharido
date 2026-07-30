import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
// eslint-disable-next-line
import { User, Phone, Mail, MapPin, Award, Coins, CheckCircle, ShieldAlert, ArrowLeft, LogOut, Edit2, Heart, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import CustomerTickets from '../components/CustomerTickets';

const ProfilePage = ({ onNavigate, onNavigateProduct }) => {
  const { currentUser, updateUserProfile, logout, showToast, products, wishlist, toggleWishlist, isAuthLoading } = useApp();
  const isMountedRef = useRef(true);
  React.useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);
  
  // Helper for Avatar Initials
  const getInitials = (f, l, u) => {
    if (f && l) return (f[0] + l[0]).toUpperCase();
    if (f) return f.substring(0, 2).toUpperCase();
    if (u) return u.substring(0, 2).toUpperCase();
    return 'U';
  };

  // State hooks
  const initialFirstName = currentUser?.firstName || (currentUser?.fullName ? currentUser.fullName.split(' ')[0] : '');
  const initialLastName = currentUser?.lastName || (currentUser?.fullName ? currentUser.fullName.split(' ').slice(1).join(' ') : '');
  
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [emailInput, setEmailInput] = useState(currentUser?.email || '');
  const [pincodeInput, setPincodeInput] = useState(currentUser?.pincode || '');
  const [addressInput, setAddressInput] = useState(currentUser?.address || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'wishlist', 'support'

  // Sync state with currentUser when not editing or when currentUser updates
  React.useEffect(() => {
    if (!isEditing && currentUser) {
      setFirstName(currentUser.firstName || (currentUser.fullName ? currentUser.fullName.split(' ')[0] : ''));
      setLastName(currentUser.lastName || (currentUser.fullName ? currentUser.fullName.split(' ').slice(1).join(' ') : ''));
      setEmailInput(currentUser.email || '');
      setPincodeInput(currentUser.pincode || '');
      setAddressInput(currentUser.address || '');
    }
  }, [isEditing, currentUser]);

  if (isAuthLoading) {
    return (
      <div className="container animate-fade-in" style={{ textAlign: 'center', padding: '100px 20px', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #e0e7ff', borderTop: '4px solid #4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '24px' }}></div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <h2 style={{ fontWeight: '700', fontSize: '20px', color: '#64748b' }}>Loading Profile...</h2>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="container animate-fade-in" style={{ textAlign: 'center', padding: '100px 20px', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '80px', height: '80px', backgroundColor: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
          <User size={40} color="#94a3b8" />
        </div>
        <h2 style={{ fontWeight: '800', fontSize: '28px', color: '#1e293b', marginBottom: '12px' }}>Please Log In</h2>
        <p style={{ color: '#64748b', fontSize: '15px', maxWidth: '400px', marginBottom: '32px' }}>Access your personalized profile, order history, and exclusive AbKharido rewards by logging in to your account.</p>
        <button className="btn btn-primary" style={{ padding: '14px 32px', fontSize: '16px', borderRadius: '12px', boxShadow: '0 8px 16px rgba(79, 70, 229, 0.2)' }} onClick={() => onNavigate('login')}>
          Sign In / Register
        </button>
      </div>
    );
  }

  const wishlistProducts = products ? products.filter(p => wishlist?.includes(p.id)) : [];

  // Check if inputs differ from database values
  const hasChanges = 
    firstName !== initialFirstName ||
    lastName !== initialLastName ||
    pincodeInput !== (currentUser.pincode || '') ||
    addressInput !== (currentUser.address || '') ||
    emailInput !== (currentUser.email || '');

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      showToast('First name and surname are required.', 'error');
      return;
    }
    if (!addressInput.trim()) {
      showToast('Address is required.', 'error');
      return;
    }
    if (pincodeInput.trim().length !== 6 || isNaN(pincodeInput)) {
      showToast('Please enter a valid 6-digit Pincode.', 'error');
      return;
    }

    setIsUpdating(true);
    const success = await updateUserProfile({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      pincode: pincodeInput.trim(),
      address: addressInput.trim(),
      email: emailInput.trim()
    });

    if (success) {
      showToast('Profile details updated successfully!', 'success');
      setIsEditing(false); // Disable editing mode once successfully updated
    }
    setIsUpdating(false);
  };

  const handleVerifyEmail = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput)) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }

    setIsVerifyingEmail(true);
    // Simulate SMTP delivery network delay
    setTimeout(async () => {
      if (!isMountedRef.current) return;
      const success = await updateUserProfile({
        email: emailInput.trim(),
        emailVerified: true
      });
      if (!isMountedRef.current) return;
      if (success) {
        showToast('Email verified successfully!', 'success');
        confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
      }
      setIsVerifyingEmail(false);
    }, 1500);
  };

  const handleGeolocate = () => {
    if (navigator.geolocation) {
      showToast('Fetching geolocation coordinates...');
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          if (res.ok) {
            const data = await res.json();
            const postCode = data.address?.postcode || '';
            if (postCode) {
              setPincodeInput(postCode);
              showToast(`Pincode set automatically to ${postCode}!`);
            } else {
              setPincodeInput('560001');
            }
          }
        // eslint-disable-next-line
        } catch (e) {
          setPincodeInput('400001');
        }
      }, () => {
        setPincodeInput('110001');
        showToast('Permission denied. Defaulted to city center pincode.', 'info');
      });
    } else {
      showToast('Geolocation is not supported by your browser.', 'error');
    }
  };

  return (
    <div className="profile-page-container animate-fade-in" style={{ padding: '0', background: '#f8fafc', minHeight: '100vh' }}>
      
      {/* 1. Clean Minimal Header */}
      <div className="profile-dashboard-header">
        <div className="profile-header-user">
          <div className="profile-header-avatar">
            {getInitials(currentUser.firstName, currentUser.lastName, currentUser.username)}
          </div>
          <div className="profile-header-info">
            <h2 className="profile-header-name">
              {(currentUser.firstName || currentUser.lastName)
                ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim()
                : currentUser.fullName || 'AbKharido User'}
            </h2>
            <p className="profile-header-phone">
              ⭐ AbKharido Member
            </p>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 16px', marginTop: '-20px', position: 'relative', zIndex: 10 }}>
        
        {/* 2. Quick Action Grid (2x2) */}
        <div className="profile-quick-actions">
          <div className="quick-action-card" onClick={() => onNavigate('orders')}>
            <ShoppingBag size={24} color="#4f46e5" /> 
            <span>My Orders</span>
          </div>
          <div className="quick-action-card" onClick={() => {
            setActiveTab('wishlist');
          }}>
            <Heart size={24} color="#ec4899" /> 
            <span>Wishlist</span>
          </div>
          <div className="quick-action-card" onClick={() => onNavigate('partner')}>
            <Award size={24} color="#f59e0b" /> 
            <span>Creator Hub</span>
          </div>
          <div className="quick-action-card" onClick={() => setIsEditing(!isEditing)}>
            <Edit2 size={24} color="#10b981" /> 
            <span>{isEditing ? 'Close Settings' : 'Settings'}</span>
          </div>
        </div>

        {/* Profile Tabs */}
        <div className="profile-tabs-container" style={{ display: 'flex', gap: '12px', overflowX: 'auto', margin: '24px 0', paddingBottom: '8px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <button 
            className={`profile-tab-btn ${activeTab === 'overview' ? 'active' : ''}`} 
            onClick={() => setActiveTab('overview')}
            style={{ padding: '8px 20px', borderRadius: '50px', border: 'none', background: activeTab === 'overview' ? '#4f46e5' : '#f1f5f9', color: activeTab === 'overview' ? 'white' : '#64748b', fontWeight: '700', fontSize: '14px', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s' }}
          >
            Overview
          </button>
          <button 
            className={`profile-tab-btn ${activeTab === 'rewards' ? 'active' : ''}`} 
            onClick={() => setActiveTab('rewards')}
            style={{ padding: '8px 20px', borderRadius: '50px', border: 'none', background: activeTab === 'rewards' ? 'linear-gradient(135deg, #f59e0b, #ea580c)' : '#f1f5f9', color: activeTab === 'rewards' ? 'white' : '#64748b', fontWeight: '700', fontSize: '14px', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Coins size={16} /> AB Rewards
          </button>
          <button 
            className={`profile-tab-btn ${activeTab === 'wishlist' ? 'active' : ''}`} 
            onClick={() => setActiveTab('wishlist')}
            style={{ padding: '8px 20px', borderRadius: '50px', border: 'none', background: activeTab === 'wishlist' ? '#4f46e5' : '#f1f5f9', color: activeTab === 'wishlist' ? 'white' : '#64748b', fontWeight: '700', fontSize: '14px', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s' }}
          >
            Wishlist ({wishlistProducts.length})
          </button>
          <button 
            className={`profile-tab-btn ${activeTab === 'support' ? 'active' : ''}`} 
            onClick={() => setActiveTab('support')}
            style={{ padding: '8px 20px', borderRadius: '50px', border: 'none', background: activeTab === 'support' ? '#4f46e5' : '#f1f5f9', color: activeTab === 'support' ? 'white' : '#64748b', fontWeight: '700', fontSize: '14px', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s' }}
          >
            Support Tickets
          </button>
        </div>

        {/* 3. Settings Form (Hidden by default) */}
        {activeTab === 'overview' && isEditing && (
        <form onSubmit={handleUpdateProfile} className="profile-form-card animate-fade-in" style={{ marginTop: '24px' }}>
          <div className="profile-form-header">
            <h3 className="profile-form-title">Account Settings</h3>
          </div>

          <div className="profile-input-grid">
            <div>
              <label className="profile-input-label">FIRST NAME *</label>
              <input 
                type="text" 
                value={firstName} 
                onChange={(e) => setFirstName(e.target.value)} 
                placeholder="Enter first name"
                disabled={!isEditing}
                className="profile-input"
                required
              />
            </div>
            <div>
              <label className="profile-input-label">SURNAME *</label>
              <input 
                type="text" 
                value={lastName} 
                onChange={(e) => setLastName(e.target.value)} 
                placeholder="Enter surname"
                disabled={!isEditing}
                className="profile-input"
                required
              />
            </div>
          </div>

          <div>
            <label className="profile-input-label">MOBILE NUMBER (VERIFIED)</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '16px', top: '0', bottom: '0', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                <span style={{ fontSize: '15px', fontWeight: '700', color: '#94a3b8' }}>+91</span>
              </div>
              <input 
                type="text" 
                value={currentUser.phone || currentUser.username} 
                readOnly
                className="profile-input"
                style={{ paddingLeft: '54px' }}
                disabled
              />
              <div style={{ position: 'absolute', right: '16px', top: '0', bottom: '0', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                <CheckCircle size={20} color="#10b981" />
              </div>
            </div>
          </div>

          {/* Email Settings Section */}
          <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '24px' }}>
            <label className="profile-input-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              EMAIL ID 
              {currentUser.emailVerified ? 
                <span style={{ color: '#10b981', background: '#d1fae5', padding: '2px 8px', borderRadius: '10px', fontSize: '10px' }}>VERIFIED ✓</span> : 
                <span style={{ color: '#ea580c', background: '#ffedd5', padding: '2px 8px', borderRadius: '10px', fontSize: '10px' }}>PENDING</span>
              }
            </label>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <input 
                type="email" 
                value={emailInput} 
                onChange={(e) => setEmailInput(e.target.value)} 
                placeholder="Enter your email address"
                disabled={currentUser.emailVerified}
                className="profile-input"
                style={{ flex: '1 1 200px' }}
              />
              {!currentUser.emailVerified && (
                <button 
                  type="button" 
                  onClick={handleVerifyEmail}
                  disabled={isVerifyingEmail || !emailInput}
                  className="profile-submit-btn"
                  style={{ opacity: (isVerifyingEmail || !emailInput) ? 0.7 : 1, padding: '0 24px', flex: '0 1 auto' }}
                >
                  {isVerifyingEmail ? 'Verifying...' : 'Verify Now'}
                </button>
              )}
            </div>
            {!currentUser.emailVerified && (
              <span style={{ fontSize: '13px', color: '#ea580c', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', fontWeight: '500' }}>
                <ShieldAlert size={16} /> Verify your email for important security alerts and order updates.
              </span>
            )}
          </div>

          {/* Address Settings Section */}
          <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0' }}>Address Book</h4>
              {isEditing && (
                <button type="button" onClick={() => showToast('Multiple addresses coming soon in v2.0!', 'info')} style={{ background: '#e0e7ff', color: '#4f46e5', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                  + Add New Address
                </button>
              )}
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              {/* Default Address Card */}
              <div style={{ border: '2px solid #4f46e5', borderRadius: '12px', padding: '16px', position: 'relative', background: '#f8fafc' }}>
                <span style={{ position: 'absolute', top: '-10px', right: '16px', background: '#4f46e5', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold' }}>DEFAULT</span>
                <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '4px', color: '#1e293b' }}>{firstName || 'User'} {lastName}</div>
                <div style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.5', marginBottom: '8px' }}>
                  {addressInput || 'No address provided'}<br/>
                  {pincodeInput ? `Pincode: ${pincodeInput}` : ''}
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="animate-fade-in" style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h5 style={{ fontSize: '14px', margin: '0 0 12px 0', color: '#334155' }}>Edit Default Address</h5>
                <div style={{ marginBottom: '16px' }}>
                  <label className="profile-input-label">PINCODE *</label>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <input 
                      type="text" 
                      maxLength="6"
                      value={pincodeInput} 
                      onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, ''))} 
                      placeholder="e.g. 400001"
                      className="profile-input"
                      style={{ flex: '1 1 120px', letterSpacing: '2px' }}
                      required
                    />
                    <button 
                      type="button" 
                      onClick={handleGeolocate}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', padding: '0 20px', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', minHeight: '52px', flex: '1 1 150px' }}
                    >
                      <MapPin size={18} /> Detect Location
                    </button>
                  </div>
                </div>

                <div>
                  <label className="profile-input-label">STREET ADDRESS *</label>
                  <textarea 
                    value={addressInput} 
                    onChange={(e) => setAddressInput(e.target.value)} 
                    placeholder="House No, Building Name, Street Area, City & State"
                    className="profile-input"
                    style={{ height: '80px', padding: '12px', resize: 'vertical', lineHeight: '1.5' }}
                    required
                  />
                </div>
              </div>
            )}
          </div>

          <button 
            type="submit" 
            className="profile-submit-btn"
            style={{ 
              marginTop: '8px',
              backgroundColor: (!isEditing || !hasChanges) ? '#e2e8f0' : '#4f46e5',
              color: (!isEditing || !hasChanges) ? '#94a3b8' : 'white',
              boxShadow: (!isEditing || !hasChanges) ? 'none' : '0 8px 16px rgba(79, 70, 229, 0.2)',
              pointerEvents: (!isEditing || !hasChanges) ? 'none' : 'auto'
            }}
            disabled={!isEditing || !hasChanges || isUpdating}
          >
            {isUpdating ? 'Saving Changes...' : (isEditing && hasChanges) ? 'Save Changes' : 'Update Details to Save'}
          </button>
        </form>
        )}

        {/* 4. Menu List */}
        {activeTab === 'overview' && (
        <div className="profile-menu-list">
          <div className="profile-menu-item" onClick={() => setIsEditing(!isEditing)}>
            <div className="menu-item-left">
              <MapPin size={20} color="#64748b" />
              <span>Saved Addresses</span>
            </div>
            <ArrowRight size={16} color="#cbd5e1" />
          </div>
          <div className="profile-menu-item" onClick={() => setIsEditing(!isEditing)}>
            <div className="menu-item-left">
              <ShieldAlert size={20} color="#64748b" />
              <span>Security & Passwords</span>
            </div>
            <ArrowRight size={16} color="#cbd5e1" />
          </div>
          <div className="profile-menu-item logout-item" onClick={logout}>
            <div className="menu-item-left">
              <LogOut size={20} color="#ef4444" />
              <span style={{ color: '#ef4444', fontWeight: 'bold' }}>Log Out</span>
            </div>
          </div>
        </div>
        )}

        {/* AB Rewards Hub Section */}
        {activeTab === 'rewards' && (
          <div className="animate-fade-in" style={{ background: 'white', padding: '32px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '24px', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', marginBottom: '24px' }}>
            
            {/* Digital Wallet Card */}
            <div style={{ background: 'linear-gradient(135deg, #27272a, #09090b)', borderRadius: '20px', padding: '32px', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)' }}>
              {/* Decorative background glows */}
              <div style={{ position: 'absolute', top: '-50%', right: '-20%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(245,158,11,0.15) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%' }}></div>
              <div style={{ position: 'absolute', bottom: '-50%', left: '-20%', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(234,88,12,0.15) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%' }}></div>
              
              <div style={{ position: 'relative', zIndex: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.9 }}>
                    <div style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)', color: '#b45309', padding: '6px', borderRadius: '50%' }}>
                      <Coins size={20} />
                    </div>
                    <span style={{ fontSize: '16px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase' }}>AB Coin Wallet</span>
                  </div>
                  <div style={{ padding: '4px 12px', background: 'rgba(255,255,255,0.1)', borderRadius: '20px', fontSize: '12px', fontWeight: '600', backdropFilter: 'blur(10px)' }}>
                    VIP MEMBER
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ fontSize: '14px', color: '#a1a1aa' }}>Available Balance</div>
                  <div style={{ fontSize: '48px', fontWeight: '900', background: 'linear-gradient(to right, #fde68a, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block' }}>
                    {currentUser.walletCoins?.toLocaleString('en-IN') || 0} <span style={{ fontSize: '24px', opacity: 0.8 }}>Coins</span>
                  </div>
                </div>

                <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#a1a1aa', marginBottom: '4px' }}>Equivalent Value</div>
                    <div style={{ fontSize: '16px', fontWeight: '700' }}>₹{currentUser.walletCoins?.toLocaleString('en-IN') || 0}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: '#a1a1aa', marginBottom: '4px' }}>Lifetime Earned</div>
                    <div style={{ fontSize: '16px', fontWeight: '700' }}>{((currentUser.walletCoins || 0) + (currentUser.totalSpent || 0) * 0.05).toLocaleString('en-IN')}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* How to Earn */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginTop: '16px' }}>
              <div style={{ padding: '24px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                <div style={{ background: '#e0e7ff', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5', marginBottom: '16px' }}>
                  <ShoppingBag size={24} />
                </div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#0f172a' }}>Shop & Earn</h4>
                <p style={{ margin: 0, color: '#64748b', fontSize: '14px', lineHeight: '1.5' }}>Earn up to 5% back in AB Coins on every successful purchase you make.</p>
              </div>
              <div style={{ padding: '24px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                <div style={{ background: '#fef3c7', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706', marginBottom: '16px' }}>
                  <Award size={24} />
                </div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#0f172a' }}>Refer & Earn</h4>
                <p style={{ margin: 0, color: '#64748b', fontSize: '14px', lineHeight: '1.5' }}>Share your influencer link to earn massive AB Coins when friends buy!</p>
              </div>
            </div>

          </div>
        )}

        {/* Helpdesk / Customer Tickets Section */}
        {activeTab === 'support' && (
          <div className="animate-fade-in" style={{ background: 'white', padding: '32px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '24px', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', marginBottom: '24px' }}>
            <CustomerTickets />
          </div>
        )}

        {/* Wishlist Section */}
        {activeTab === 'wishlist' && (
        <div id="wishlist-section" className="animate-fade-in" style={{ background: 'white', padding: '32px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '24px', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Heart size={20} fill="#ef4444" color="#ef4444" />
            <span>My Wishlist ({wishlistProducts.length})</span>
          </h3>

          {wishlistProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-secondary)' }}>
              <ShoppingBag size={36} color="#878787" style={{ margin: '0 auto 12px auto', opacity: 0.6 }} />
              <p style={{ fontSize: '13px' }}>Your wishlist is empty.</p>
              <button 
                onClick={() => onNavigate('home')}
                className="btn btn-outline" 
                style={{ marginTop: '12px', fontSize: '12px', padding: '6px 12px', width: '100%' }}
              >
                Explore Products
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 0 }}>
              {wishlistProducts.map(p => (
                <div 
                  key={p.id}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    borderBottom: '1px solid #f0f0f0', 
                    paddingBottom: '12px',
                    position: 'relative',
                    minWidth: 0
                  }}
                >
                  <img 
                    src={p.image} 
                    alt={p.name} 
                    style={{ width: '50px', height: '50px', objectFit: 'contain', border: '1px solid #f0f0f0', borderRadius: '4px', padding: '2px', backgroundColor: 'white' }} 
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 
                      onClick={() => {
                        if (onNavigateProduct) onNavigateProduct(p.id);
                        else onNavigate(`product-${p.id}`);
                      }}
                      style={{ fontSize: '13px', fontWeight: '600', color: '#212121', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {p.name}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#212121' }}>₹{(p.price || 0).toLocaleString('en-IN')}</span>
                      <span style={{ fontSize: '11px', color: '#878787', textDecoration: 'line-through' }}>₹{(p.originalPrice || p.price || 0).toLocaleString('en-IN')}</span>
                      <span style={{ fontSize: '11px', color: '#388e3c', fontWeight: 'bold' }}>
                        {p.originalPrice > p.price ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0}% off
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => toggleWishlist(p.id)}
                    style={{ background: 'none', border: 'none', color: '#c62828', cursor: 'pointer', padding: '6px' }}
                    title="Remove from Wishlist"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        )}

      </div>

      {/* Footer support links */}
      <div className="profile-footer-links" style={{ marginTop: '40px', borderTop: '1px solid #e0e0e0', paddingTop: '20px', textAlign: 'center', fontSize: '11px', display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', color: '#878787' }}>
        <a href="#about" onClick={(e) => { e.preventDefault(); onNavigate('info-about'); }} style={{ color: '#878787', textDecoration: 'none' }}>About Us</a>
        <span>|</span>
        <a href="#terms" onClick={(e) => { e.preventDefault(); onNavigate('info-terms'); }} style={{ color: '#878787', textDecoration: 'none' }}>Terms of Use</a>
        <span>|</span>
        <a href="#privacy" onClick={(e) => { e.preventDefault(); onNavigate('info-privacy'); }} style={{ color: '#878787', textDecoration: 'none' }}>Privacy Policy</a>
        <span>|</span>
        <a href="#returns" onClick={(e) => { e.preventDefault(); onNavigate('info-returns'); }} style={{ color: '#878787', textDecoration: 'none' }}>Return Policy</a>
        <span>|</span>
        <a href="#contact" onClick={(e) => { e.preventDefault(); onNavigate('info-contact'); }} style={{ color: '#878787', textDecoration: 'none' }}>Contact Support</a>
      </div>
    </div>
  );
};

export default ProfilePage;
