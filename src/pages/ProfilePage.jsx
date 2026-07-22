import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { User, Phone, Mail, MapPin, Award, Coins, CheckCircle, ShieldAlert, ArrowLeft, LogOut, Edit2, Heart, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import CustomerTickets from '../components/CustomerTickets';

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
            {/* Phone — primary contact (from phone field OR username if it's a number) */}
            <p className="profile-header-phone" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              📱 {currentUser.phone || currentUser.username || 'No phone'}
            </p>
            {/* Email — secondary contact, only show if set */}
            {currentUser.email && (
              <p className="profile-header-phone" style={{ marginTop: '2px', opacity: 0.75, fontSize: '12px' }}>
                ✉️ {currentUser.email}
              </p>
            )}
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
            const el = document.getElementById('wishlist-section');
            if(el) el.scrollIntoView({ behavior: 'smooth' });
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

        {/* 3. Settings Form (Hidden by default) */}
        {isEditing && (
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
            <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 16px 0' }}>Delivery Address</h4>
            
            <div style={{ marginBottom: '20px' }}>
              <label className="profile-input-label">PINCODE *</label>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <input 
                  type="text" 
                  maxLength="6"
                  value={pincodeInput} 
                  onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, ''))} 
                  placeholder="e.g. 400001"
                  disabled={!isEditing}
                  className="profile-input"
                  style={{ flex: '1 1 120px', letterSpacing: '2px' }}
                  required
                />
                <button 
                  type="button" 
                  onClick={handleGeolocate}
                  disabled={!isEditing}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: !isEditing ? '#f1f5f9' : '#eff6ff', color: !isEditing ? '#94a3b8' : '#3b82f6', border: !isEditing ? '1px solid #e2e8f0' : '1px solid #bfdbfe', padding: '0 20px', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: !isEditing ? 'not-allowed' : 'pointer', transition: 'all 0.2s', minHeight: '52px', flex: '1 1 150px' }}
                >
                  <MapPin size={18} /> Detect Location
                </button>
              </div>
            </div>

            <div>
              <label className="profile-input-label">STREET ADDRESS (MUST BE FILLED) *</label>
              <textarea 
                value={addressInput} 
                onChange={(e) => setAddressInput(e.target.value)} 
                placeholder="House No, Building Name, Street Area, City & State"
                disabled={!isEditing}
                className="profile-input"
                style={{ height: '100px', padding: '16px', resize: 'vertical', lineHeight: '1.5' }}
                required
              />
            </div>
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

        {/* Helpdesk / Customer Tickets Section */}
        <div style={{ background: 'white', padding: '32px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '24px', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', marginBottom: '24px' }}>
          <CustomerTickets />
        </div>

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
