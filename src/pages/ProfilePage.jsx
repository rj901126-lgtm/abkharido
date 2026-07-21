import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { User, Phone, Mail, MapPin, Award, Coins, CheckCircle, ShieldAlert, ArrowLeft, LogOut, Edit2, Heart, Trash2, ShoppingBag } from 'lucide-react';
import confetti from 'canvas-confetti';

const ProfilePage = ({ onNavigate, onNavigateProduct }) => {
  const { currentUser, updateUserProfile, logout, showToast, products, wishlist, toggleWishlist } = useApp();
  const isMountedRef = useRef(true);
  React.useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);
  
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

  // Helper for Avatar Initials
  const getInitials = (f, l, u) => {
    if (f && l) return (f[0] + l[0]).toUpperCase();
    if (f) return f.substring(0, 2).toUpperCase();
    if (u) return u.substring(0, 2).toUpperCase();
    return 'U';
  };

  // State hooks
  const [firstName, setFirstName] = useState(currentUser.firstName || '');
  const [lastName, setLastName] = useState(currentUser.lastName || '');
  const [emailInput, setEmailInput] = useState(currentUser.email || '');
  const [pincodeInput, setPincodeInput] = useState(currentUser.pincode || '');
  const [addressInput, setAddressInput] = useState(currentUser.address || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const wishlistProducts = products ? products.filter(p => wishlist?.includes(p.id)) : [];

  // Check if inputs differ from database values
  const hasChanges = 
    firstName !== (currentUser.firstName || '') ||
    lastName !== (currentUser.lastName || '') ||
    pincodeInput !== (currentUser.pincode || '') ||
    addressInput !== (currentUser.address || '');

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
      address: addressInput.trim()
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
    <div className="container animate-fade-in" style={{ padding: '32px 16px', maxWidth: '850px' }}>
      
      {/* Profile Header Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.5px' }}>
          My Account
        </h1>
        <button 
          onClick={logout} 
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'white', color: '#ef4444', border: '1px solid #fee2e2', padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.borderColor = '#fca5a5'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#fee2e2'; }}
        >
          <LogOut size={16} /> Log Out
        </button>
      </div>

      {/* Account Info Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '32px' }}>
        
        {/* Premium Profile Banner Card */}
        <div style={{ padding: '32px', borderRadius: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px', background: 'linear-gradient(135deg, #0f172a 0%, #3730a3 100%)', color: 'white', boxShadow: '0 20px 40px -10px rgba(55, 48, 163, 0.4)', position: 'relative', overflow: 'hidden' }}>
          {/* Decorative background elements */}
          <div style={{ position: 'absolute', top: '-50%', right: '-10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(99,102,241,0.4) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%', pointerEvents: 'none' }}></div>
          <div style={{ position: 'absolute', bottom: '-20%', left: '10%', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(168,85,247,0.3) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%', pointerEvents: 'none' }}></div>
          
          {/* User Info (Left) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', zIndex: 1 }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: '900', color: 'white', boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}>
              {getInitials(currentUser.firstName, currentUser.lastName, currentUser.username)}
            </div>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 4px 0', letterSpacing: '-0.5px', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                {currentUser.firstName || currentUser.lastName ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() : currentUser.username}
              </h2>
              <p style={{ margin: 0, fontSize: '14px', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
                <Mail size={14} /> {currentUser.email || 'No email provided'}
              </p>
            </div>
          </div>

          {/* Wallet / Loyalty Balance (Right) */}
          <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
            <div style={{ fontSize: '11px', backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', color: 'white', padding: '6px 12px', borderRadius: '20px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase', border: '1px solid rgba(255,255,255,0.1)' }}>
              {currentUser.isInfluencer ? 'Creator Mode Active' : 'User Rewards Active'}
            </div>
            <div style={{ background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(10px)', padding: '16px 24px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: '160px' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', letterSpacing: '0.5px', marginBottom: '4px' }}>AVAILABLE BALANCE</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {currentUser.isInfluencer ? (
                  <>
                    <Award size={24} color="#34d399" />
                    <span style={{ fontSize: '24px', fontWeight: '900', color: '#34d399', letterSpacing: '-0.5px' }}>₹{(currentUser.walletCash || 0).toFixed(2)}</span>
                  </>
                ) : (
                  <>
                    <Coins size={24} color="#fbbf24" />
                    <span style={{ fontSize: '24px', fontWeight: '900', color: '#fbbf24', letterSpacing: '-0.5px' }}>{currentUser.walletCoins}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details Edit Form */}
        <form onSubmit={handleUpdateProfile} style={{ background: 'white', padding: '32px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '28px', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Personal Details</h3>
            <button 
              type="button" 
              onClick={() => setIsEditing(!isEditing)} 
              style={{ background: isEditing ? '#fef2f2' : '#f0fdf4', border: 'none', color: isEditing ? '#ef4444' : '#16a34a', fontWeight: '700', fontSize: '13px', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}
            >
              <Edit2 size={14} /> {isEditing ? 'Cancel Edit' : 'Edit Profile'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '8px', letterSpacing: '0.5px' }}>FIRST NAME *</label>
              <input 
                type="text" 
                value={firstName} 
                onChange={(e) => setFirstName(e.target.value)} 
                placeholder="Enter first name"
                disabled={!isEditing}
                style={{ width: '100%', boxSizing: 'border-box', height: '52px', padding: '0 16px', border: isEditing ? '2px solid #6366f1' : '1px solid #e2e8f0', borderRadius: '12px', fontSize: '15px', fontWeight: '500', backgroundColor: !isEditing ? '#f8fafc' : 'white', outline: 'none', transition: 'all 0.2s', color: '#0f172a' }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '8px', letterSpacing: '0.5px' }}>SURNAME *</label>
              <input 
                type="text" 
                value={lastName} 
                onChange={(e) => setLastName(e.target.value)} 
                placeholder="Enter surname"
                disabled={!isEditing}
                style={{ width: '100%', boxSizing: 'border-box', height: '52px', padding: '0 16px', border: isEditing ? '2px solid #6366f1' : '1px solid #e2e8f0', borderRadius: '12px', fontSize: '15px', fontWeight: '500', backgroundColor: !isEditing ? '#f8fafc' : 'white', outline: 'none', transition: 'all 0.2s', color: '#0f172a' }}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '8px', letterSpacing: '0.5px' }}>MOBILE NUMBER (VERIFIED)</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '16px', top: '0', bottom: '0', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                <span style={{ fontSize: '15px', fontWeight: '700', color: '#94a3b8' }}>+91</span>
              </div>
              <input 
                type="text" 
                value={currentUser.phone || currentUser.username} 
                readOnly
                style={{ width: '100%', boxSizing: 'border-box', height: '52px', padding: '0 16px 0 54px', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '15px', fontWeight: '600', backgroundColor: '#f8fafc', color: '#475569', outline: 'none' }}
              />
              <div style={{ position: 'absolute', right: '16px', top: '0', bottom: '0', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                <CheckCircle size={20} color="#10b981" />
              </div>
            </div>
          </div>

          {/* Email Settings Section */}
          <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '8px', letterSpacing: '0.5px' }}>
              EMAIL ID 
              {currentUser.emailVerified ? 
                <span style={{ color: '#10b981', background: '#d1fae5', padding: '2px 8px', borderRadius: '10px', fontSize: '10px' }}>VERIFIED ✓</span> : 
                <span style={{ color: '#ea580c', background: '#ffedd5', padding: '2px 8px', borderRadius: '10px', fontSize: '10px' }}>PENDING</span>
              }
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input 
                type="email" 
                value={emailInput} 
                onChange={(e) => setEmailInput(e.target.value)} 
                placeholder="Enter your email address"
                readOnly={currentUser.emailVerified}
                style={{ flex: 1, boxSizing: 'border-box', height: '52px', padding: '0 16px', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '15px', fontWeight: '500', backgroundColor: currentUser.emailVerified ? '#f8fafc' : 'white', outline: 'none', color: '#0f172a' }}
              />
              {!currentUser.emailVerified && (
                <button 
                  type="button" 
                  onClick={handleVerifyEmail}
                  disabled={isVerifyingEmail || !emailInput}
                  style={{ background: '#0f172a', color: 'white', border: 'none', padding: '0 24px', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', opacity: (isVerifyingEmail || !emailInput) ? 0.7 : 1 }}
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
            <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 16px 0' }}>Delivery Address</h4>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '8px', letterSpacing: '0.5px' }}>PINCODE *</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input 
                  type="text" 
                  maxLength="6"
                  value={pincodeInput} 
                  onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, ''))} 
                  placeholder="e.g. 400001"
                  disabled={!isEditing}
                  style={{ width: '180px', boxSizing: 'border-box', height: '52px', padding: '0 16px', border: isEditing ? '2px solid #6366f1' : '1px solid #e2e8f0', borderRadius: '12px', fontSize: '16px', fontWeight: '600', backgroundColor: !isEditing ? '#f8fafc' : 'white', outline: 'none', color: '#0f172a', letterSpacing: '2px' }}
                  required
                />
                <button 
                  type="button" 
                  onClick={handleGeolocate}
                  disabled={!isEditing}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', background: !isEditing ? '#f1f5f9' : '#eff6ff', color: !isEditing ? '#94a3b8' : '#3b82f6', border: !isEditing ? '1px solid #e2e8f0' : '1px solid #bfdbfe', padding: '0 20px', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: !isEditing ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
                >
                  <MapPin size={18} /> Detect Location
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '8px', letterSpacing: '0.5px' }}>STREET ADDRESS (MUST BE FILLED) *</label>
              <textarea 
                value={addressInput} 
                onChange={(e) => setAddressInput(e.target.value)} 
                placeholder="House No, Building Name, Street Area, City & State"
                disabled={!isEditing}
                style={{ width: '100%', boxSizing: 'border-box', height: '100px', padding: '16px', border: isEditing ? '2px solid #6366f1' : '1px solid #e2e8f0', borderRadius: '12px', fontSize: '15px', fontWeight: '500', resize: 'vertical', backgroundColor: !isEditing ? '#f8fafc' : 'white', outline: 'none', color: '#0f172a', lineHeight: '1.5' }}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            style={{ 
              width: '100%', 
              height: '56px', 
              fontSize: '16px',
              fontWeight: '800', 
              letterSpacing: '0.5px',
              marginTop: '8px',
              borderRadius: '14px',
              backgroundColor: (!isEditing || !hasChanges) ? '#e2e8f0' : '#4f46e5',
              color: (!isEditing || !hasChanges) ? '#94a3b8' : 'white',
              border: 'none',
              cursor: (!isEditing || !hasChanges) ? 'not-allowed' : 'pointer',
              boxShadow: (!isEditing || !hasChanges) ? 'none' : '0 10px 20px rgba(79, 70, 229, 0.3)',
              transition: 'all 0.2s'
            }}
            disabled={isUpdating || !isEditing || !hasChanges}
          >
            {isUpdating ? 'SAVING CHANGES...' : 'SAVE & UPDATE DETAILS'}
          </button>
        </form>

        {/* Wishlist Section */}
        <div id="wishlist-section" style={{ background: 'white', padding: '32px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '24px', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
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
