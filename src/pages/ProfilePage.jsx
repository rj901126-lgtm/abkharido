import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User, Phone, Mail, MapPin, Award, Coins, CheckCircle, ShieldAlert, ArrowLeft, LogOut, Edit2, Heart, Trash2, ShoppingBag } from 'lucide-react';
import confetti from 'canvas-confetti';

const ProfilePage = ({ onNavigate }) => {
  const { currentUser, updateUserProfile, logout, showToast, products, wishlist, toggleWishlist } = useApp();
  
  if (!currentUser) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <h2 style={{ fontWeight: 'bold' }}>Please Log In</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Log in to view and manage your profile details.</p>
        <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={() => onNavigate('login')}>
          Go to Login
        </button>
      </div>
    );
  }

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
      const success = await updateUserProfile({
        email: emailInput.trim(),
        emailVerified: true
      });
      if (success) {
        showToast('Email verified successfully!', 'success');
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 }
        });
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
    <div className="container animate-fade-in" style={{ padding: '20px 16px', maxWidth: '650px' }}>
      {/* Profile Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f0f0f0', paddingBottom: '12px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#212121', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <User size={22} color="var(--primary-color)" /> My Profile
        </h1>
        <button 
          onClick={logout} 
          style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#ffebee', color: '#c62828', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          <LogOut size={14} /> Log Out
        </button>
      </div>

      {/* Account Info Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', marginBottom: '24px' }}>
        
        {/* Wallet & Coins Card */}
        <div className="card" style={{ padding: '16px', border: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg, #f5f8ff 0%, #eef3ff 100%)' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#666', fontWeight: '500' }}>ACCOUNT BALANCE</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
              {currentUser.isInfluencer ? (
                <>
                  <Award size={20} color="var(--success)" />
                  <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--success)' }}>₹{currentUser.walletCash.toFixed(2)} Cash</span>
                </>
              ) : (
                <>
                  <Coins size={20} color="#e68f00" />
                  <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#e68f00' }}>{currentUser.walletCoins} Coins</span>
                </>
              )}
            </div>
          </div>
          <div style={{ fontSize: '11px', backgroundColor: '#e2edff', color: 'var(--primary-color)', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
            {currentUser.isInfluencer ? 'Creator Mode Active' : 'User Rewards Active'}
          </div>
        </div>

        {/* Profile Details Edit Form */}
        <form className="card" onSubmit={handleUpdateProfile} style={{ padding: '20px', border: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#212121', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px', marginBottom: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Personal Details</span>
            <button 
              type="button" 
              onClick={() => setIsEditing(!isEditing)} 
              style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Edit2 size={12} /> {isEditing ? 'Cancel Edit' : 'Edit Profile'}
            </button>
          </h3>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ flex: '1 1 240px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#666', marginBottom: '6px' }}>FIRST NAME *</label>
              <input 
                type="text" 
                value={firstName} 
                onChange={(e) => setFirstName(e.target.value)} 
                placeholder="First name"
                disabled={!isEditing}
                style={{ width: '100%', height: '40px', padding: '0 10px', border: '1px solid #dcdcdc', borderRadius: '4px', fontSize: '13px', backgroundColor: !isEditing ? '#f9f9f9' : 'white' }}
                required
              />
            </div>
            <div style={{ flex: '1 1 240px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#666', marginBottom: '6px' }}>SURNAME *</label>
              <input 
                type="text" 
                value={lastName} 
                onChange={(e) => setLastName(e.target.value)} 
                placeholder="Surname"
                disabled={!isEditing}
                style={{ width: '100%', height: '40px', padding: '0 10px', border: '1px solid #dcdcdc', borderRadius: '4px', fontSize: '13px', backgroundColor: !isEditing ? '#f9f9f9' : 'white' }}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#666', marginBottom: '6px' }}>MOBILE NUMBER (VERIFIED)</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                value={currentUser.phone || currentUser.username} 
                readOnly
                style={{ width: '100%', height: '40px', padding: '0 10px 0 45px', border: '1px solid #eaeaea', borderRadius: '4px', fontSize: '13px', backgroundColor: '#f9f9f9', color: '#666' }}
              />
              <span style={{ position: 'absolute', left: '12px', top: '11px', fontSize: '13px', fontWeight: 'bold', color: '#888' }}>+91</span>
            </div>
          </div>

          {/* Email Settings Section */}
          <div style={{ borderTop: '1px dashed #eee', paddingTop: '16px', marginTop: '4px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#666', marginBottom: '6px' }}>
              EMAIL ID {currentUser.emailVerified ? <span style={{ color: 'var(--success)' }}>(VERIFIED ✓)</span> : <span style={{ color: '#d84315' }}>(PENDING)</span>}
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="email" 
                value={emailInput} 
                onChange={(e) => setEmailInput(e.target.value)} 
                placeholder="Add your email ID"
                readOnly={currentUser.emailVerified}
                style={{ flex: 1, height: '40px', padding: '0 10px', border: '1px solid #dcdcdc', borderRadius: '4px', fontSize: '13px', backgroundColor: currentUser.emailVerified ? '#f9f9f9' : 'white' }}
              />
              {!currentUser.emailVerified && (
                <button 
                  type="button" 
                  onClick={handleVerifyEmail}
                  disabled={isVerifyingEmail || !emailInput}
                  style={{ background: 'var(--primary-color)', color: 'white', border: 'none', padding: '0 16px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  {isVerifyingEmail ? 'Verifying...' : 'Verify'}
                </button>
              )}
            </div>
            {!currentUser.emailVerified && (
              <span style={{ fontSize: '11px', color: '#888', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
                <ShieldAlert size={12} color="#d84315" /> Verify your email to complete safety checkpoints.
              </span>
            )}
          </div>

          {/* Address Settings Section */}
          <div style={{ borderTop: '1px dashed #eee', paddingTop: '16px', marginTop: '4px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '12px' }}>Delivery Address</h4>
            
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#666', marginBottom: '6px' }}>PINCODE *</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  maxLength="6"
                  value={pincodeInput} 
                  onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, ''))} 
                  placeholder="6-digit pincode"
                  disabled={!isEditing}
                  style={{ width: '150px', height: '40px', padding: '0 10px', border: '1px solid #dcdcdc', borderRadius: '4px', fontSize: '13px', backgroundColor: !isEditing ? '#f9f9f9' : 'white' }}
                  required
                />
                <button 
                  type="button" 
                  onClick={handleGeolocate}
                  disabled={!isEditing}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', background: !isEditing ? '#eaeaea' : '#f5f5f5', color: !isEditing ? '#888' : '#333', border: '1px solid #ccc', padding: '0 12px', borderRadius: '4px', fontSize: '12px', fontWeight: '500', cursor: !isEditing ? 'not-allowed' : 'pointer' }}
                >
                  <MapPin size={14} color={!isEditing ? '#888' : 'var(--primary-color)'} /> Detect Location
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#666', marginBottom: '6px' }}>STREET ADDRESS (MUST BE FILLED) *</label>
              <textarea 
                value={addressInput} 
                onChange={(e) => setAddressInput(e.target.value)} 
                placeholder="House No, Building Name, Street Area, City & State"
                disabled={!isEditing}
                style={{ width: '100%', height: '80px', padding: '10px', border: '1px solid #dcdcdc', borderRadius: '4px', fontSize: '13px', resize: 'vertical', backgroundColor: !isEditing ? '#f9f9f9' : 'white' }}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-accent" 
            style={{ 
              width: '100%', 
              height: '44px', 
              fontWeight: 'bold', 
              marginTop: '10px',
              backgroundColor: (!isEditing || !hasChanges) ? '#cccccc' : 'var(--accent-color)',
              color: (!isEditing || !hasChanges) ? '#666666' : 'white',
              border: 'none',
              cursor: (!isEditing || !hasChanges) ? 'not-allowed' : 'pointer'
            }}
            disabled={isUpdating || !isEditing || !hasChanges}
          >
            {isUpdating ? 'SAVING DETAILS...' : 'SAVE & UPDATE DETAILS'}
          </button>
        </form>

        {/* Wishlist Section */}
        <div id="wishlist-section" className="card" style={{ padding: '20px', border: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#212121', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Heart size={16} fill="#d32f2f" color="#d32f2f" />
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
                        window.location.hash = `#product-${p.id}`;
                      }}
                      style={{ fontSize: '13px', fontWeight: '600', color: '#212121', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {p.name}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#212121' }}>₹{p.price.toLocaleString('en-IN')}</span>
                      <span style={{ fontSize: '11px', color: '#878787', textDecoration: 'line-through' }}>₹{p.originalPrice.toLocaleString('en-IN')}</span>
                      <span style={{ fontSize: '11px', color: '#388e3c', fontWeight: 'bold' }}>
                        {Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)}% off
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
    </div>
  );
};

export default ProfilePage;
