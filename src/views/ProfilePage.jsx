import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
// eslint-disable-next-line
import { User, Phone, Mail, MapPin, Award, Coins, CheckCircle, ShieldAlert, ArrowLeft, LogOut, Edit2, Heart, Trash2, ShoppingBag, ArrowRight, CreditCard, ShieldCheck, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import CustomerTickets from '../components/CustomerTickets';
import { auth } from '../firebase';
import { updateEmail, sendEmailVerification } from 'firebase/auth';

const ProfilePage = ({ onNavigate, onNavigateProduct }) => {
  const { currentUser, updateUserProfile, logout, showToast, products, wishlist, toggleWishlist, isAuthLoading, savedCards, fetchUserSavedCards, removeSavedCard, addToCart } = useApp();
  const isMountedRef = useRef(true);
  React.useEffect(() => {
    isMountedRef.current = true;
    fetchUserSavedCards();
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab && ['overview', 'rewards', 'wishlist', 'savedcards', 'support'].includes(tab)) {
        setActiveTab(tab);
      }
    }
    return () => { isMountedRef.current = false; };
  }, []);
  
  // Helper for Avatar Initials
  const getInitials = (user) => {
    if (!user) return 'U';
    if (user.fullName) {
      const parts = user.fullName.trim().split(/\s+/);
      if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      if (parts[0].length >= 2) return parts[0].substring(0, 2).toUpperCase();
      return parts[0][0].toUpperCase();
    }
    if (user.firstName && user.lastName) return (user.firstName[0] + user.lastName[0]).toUpperCase();
    if (user.firstName) return user.firstName.substring(0, 2).toUpperCase();
    if (user.username && !/^\d/.test(user.username)) return user.username.substring(0, 2).toUpperCase();
    return 'VIP';
  };

  // State hooks
  const initialFirstName = currentUser?.firstName || (currentUser?.fullName ? currentUser.fullName.split(' ')[0] : '');
  const initialLastName = currentUser?.lastName || (currentUser?.fullName ? currentUser.fullName.split(' ').slice(1).join(' ') : '');
  
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [emailInput, setEmailInput] = useState(currentUser?.email || '');
  const [pincodeInput, setPincodeInput] = useState(currentUser?.pincode || '');
  const [houseFlatInput, setHouseFlatInput] = useState(currentUser?.houseNo || '');
  const [streetAreaInput, setStreetAreaInput] = useState(currentUser?.streetArea || currentUser?.address || '');
  const [cityInput, setCityInput] = useState(currentUser?.city || '');
  const [stateInput, setStateInput] = useState(currentUser?.state || '');
  const [addressType, setAddressType] = useState(currentUser?.addressType || 'Home');
  const [isDetectingPincode, setIsDetectingPincode] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);

  // Address Book Modal State (Dedicated)
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressModalData, setAddressModalData] = useState({
    name: '',
    phone: '',
    houseNo: '',
    streetArea: '',
    pincode: '',
    city: '',
    state: '',
    addressType: 'Home',
    isDefault: false
  });
  const [isModalPincodeLoading, setIsModalPincodeLoading] = useState(false);

  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'wishlist', 'support'

  // Sync Firebase email verification status to backend DB
  React.useEffect(() => {
    const checkEmailSync = async () => {
      if (auth?.currentUser?.emailVerified && currentUser && !currentUser.isEmailVerified) {
        // Firebase says verified, but backend says false. Time to sync.
        await updateUserProfile({
          email: auth.currentUser.email,
          isEmailVerified: true
        });
        showToast('Email successfully verified!', 'success');
      }
    };
    checkEmailSync();
  }, [currentUser, updateUserProfile, showToast]);

  // Sync state with currentUser when not editing or when currentUser updates
  React.useEffect(() => {
    if (!isEditing && currentUser) {
      setFirstName(currentUser.firstName || (currentUser.fullName ? currentUser.fullName.split(' ')[0] : ''));
      setLastName(currentUser.lastName || (currentUser.fullName ? currentUser.fullName.split(' ').slice(1).join(' ') : ''));
      setEmailInput(currentUser.email || '');
      setPincodeInput(currentUser.pincode || '');
      setHouseFlatInput(currentUser.houseNo || '');
      setStreetAreaInput(currentUser.streetArea || currentUser.address || '');
      setCityInput(currentUser.city || '');
      setStateInput(currentUser.state || '');
      setAddressType(currentUser.addressType || 'Home');
    }
  }, [isEditing, currentUser]);

  // Auto-detect city & state when user enters a 6-digit pincode
  React.useEffect(() => {
    if (pincodeInput && pincodeInput.trim().length === 6 && !isNaN(pincodeInput)) {
      const pinStr = pincodeInput.trim();
      const controller = new AbortController();
      setIsDetectingPincode(true);
      fetch(`https://api.postalpincode.in/pincode/${pinStr}`, { signal: controller.signal })
        .then(res => res.json())
        .then(data => {
          if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
            const po = data[0].PostOffice[0];
            setCityInput(po.District || po.Block || po.Name || '');
            setStateInput(po.State || '');
          }
        })
        .catch(() => {})
        .finally(() => setIsDetectingPincode(false));
      return () => controller.abort();
    }
  }, [pincodeInput]);

  if (isAuthLoading && !currentUser) {
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
      <div className="container animate-fade-in" style={{ padding: '20px', minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ background: 'white', padding: '40px 32px', borderRadius: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9', maxWidth: '420px', width: '100%', position: 'relative', overflow: 'hidden' }}>
          
          {/* Decorative glowing blobs */}
          <div style={{ position: 'absolute', top: '-50px', left: '-50px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(79,70,229,0.15) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%' }}></div>
          <div style={{ position: 'absolute', bottom: '-50px', right: '-50px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(236,72,153,0.1) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%' }}></div>
          
          <div style={{ position: 'relative', width: '90px', height: '90px', borderRadius: '50%', background: 'linear-gradient(135deg, #e0e7ff, #f3e8ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', boxShadow: '0 10px 25px -5px rgba(79,70,229,0.2)' }}>
            <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'linear-gradient(135deg, #4f46e5, #9333ea)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={34} color="white" strokeWidth={2.5} />
            </div>
            <div style={{ position: 'absolute', bottom: '-5px', right: '-5px', background: '#fff', padding: '4px', borderRadius: '50%', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
              <div style={{ background: '#10b981', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldAlert size={12} color="white" />
              </div>
            </div>
          </div>
          
          <h2 style={{ fontWeight: '900', fontSize: '26px', color: '#0f172a', marginBottom: '12px', letterSpacing: '-0.5px', position: 'relative', zIndex: 1 }}>
            Unlock Your Profile
          </h2>
          
          <p style={{ color: '#64748b', fontSize: '15px', lineHeight: '1.6', marginBottom: '32px', position: 'relative', zIndex: 1 }}>
            Sign in to access your dashboard, track orders, and redeem <span style={{ fontWeight: '700', color: '#f59e0b' }}>AB Coins</span>.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', marginBottom: '32px', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc', padding: '12px 16px', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
              <ShoppingBag size={18} color="#4f46e5" />
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>Track All Your Orders</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#fef3c7', padding: '12px 16px', borderRadius: '16px', border: '1px solid #fde68a' }}>
              <Coins size={18} color="#d97706" />
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#92400e' }}>Earn 5% Cashback in AB Coins</span>
            </div>
          </div>
          
          <button 
            className="btn btn-primary" 
            style={{ 
              width: '100%',
              padding: '16px 32px', 
              fontSize: '16px', 
              fontWeight: '700',
              borderRadius: '16px', 
              background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
              boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              border: 'none',
              cursor: 'pointer',
              position: 'relative', 
              zIndex: 1
            }} 
            onClick={() => onNavigate('login?callbackUrl=/profile')}
          >
            Sign In to Continue <ArrowRight size={18} />
          </button>
          
          <p style={{ marginTop: '20px', fontSize: '13px', color: '#94a3b8', position: 'relative', zIndex: 1 }}>
            New to AbKharido? <span onClick={() => onNavigate('login?callbackUrl=/profile')} style={{ color: '#4f46e5', fontWeight: '700', cursor: 'pointer' }}>Create an Account</span>
          </p>
        </div>
      </div>
    );
  }

  const wishlistProducts = products ? products.filter(p => wishlist?.includes(p.id)) : [];

  // Check if inputs differ from database values
  const hasChanges = firstName !== initialFirstName || 
                     lastName !== initialLastName || 
                     emailInput !== (currentUser?.email || '');

  // Auto-detect city & state when pincode changes in modal
  const handleModalPincodeChange = async (pin) => {
    setAddressModalData(prev => ({ ...prev, pincode: pin }));
    const pinClean = pin.trim();
    if (pinClean.length === 6 && !isNaN(pinClean)) {
      setIsModalPincodeLoading(true);
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${pinClean}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data[0]?.Status === 'Success' && data[0].PostOffice?.[0]) {
            const po = data[0].PostOffice[0];
            setAddressModalData(prev => ({
              ...prev,
              city: po.District || po.Block || po.Name || prev.city,
              state: po.State || prev.state
            }));
            showToast(`Resolved: ${po.District || po.Name}, ${po.State}`, 'success');
          }
        }
      } catch (e) {
        // network fallback
      } finally {
        setIsModalPincodeLoading(false);
      }
    }
  };

  const openAddAddressModal = () => {
    setEditingAddressId(null);
    setAddressModalData({
      name: currentUser?.fullName || (currentUser?.firstName ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim() : ''),
      phone: currentUser?.phone || currentUser?.username || '',
      houseNo: '',
      streetArea: '',
      pincode: '',
      city: '',
      state: '',
      addressType: 'Home',
      isDefault: !(currentUser?.addresses && currentUser.addresses.length > 0)
    });
    setIsAddressModalOpen(true);
  };

  const openEditAddressModal = (addr) => {
    if (!addr) return;
    setEditingAddressId(addr.id || addr._id);
    setAddressModalData({
      name: addr.name || currentUser?.fullName || '',
      phone: addr.phone || currentUser?.phone || currentUser?.username || '',
      houseNo: addr.houseNo || '',
      streetArea: addr.streetArea || addr.streetAddress || addr.address || '',
      pincode: addr.pincode || '',
      city: addr.city || '',
      state: addr.state || '',
      addressType: addr.addressType || 'Home',
      isDefault: !!addr.isDefault
    });
    setIsAddressModalOpen(true);
  };

  const handleSaveAddressModal = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const { name, phone, houseNo, streetArea, pincode, city, state, addressType: modalAddrType, isDefault } = addressModalData;

    if (!name?.trim()) {
      showToast('Please enter full name.', 'error');
      return;
    }
    const cleanPhone = String(phone || '').replace(/[^0-9]/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      showToast('Please enter a valid 10-digit Indian mobile number.', 'error');
      return;
    }
    if (!pincode?.trim() || pincode.trim().length !== 6 || isNaN(pincode.trim())) {
      showToast('Please enter a valid 6-digit Pincode.', 'error');
      return;
    }
    if (!streetArea?.trim()) {
      showToast('Please enter street address / area.', 'error');
      return;
    }
    if (!city?.trim() || !state?.trim()) {
      showToast('City and state are required.', 'error');
      return;
    }

    const fullStreetAddress = houseNo?.trim() ? `${houseNo.trim()}, ${streetArea.trim()}` : streetArea.trim();
    const currentAddresses = Array.isArray(currentUser?.addresses) ? [...currentUser.addresses] : [];

    const isTargetDefault = isDefault || currentAddresses.length === 0;
    let updatedAddresses = [];

    if (editingAddressId) {
      updatedAddresses = currentAddresses.map(addr => {
        const matches = (addr?.id && addr.id === editingAddressId) || (addr?._id && addr._id === editingAddressId);
        if (matches) {
          return {
            ...addr,
            id: editingAddressId,
            name: name.trim(),
            phone: cleanPhone,
            houseNo: houseNo.trim(),
            streetArea: streetArea.trim(),
            streetAddress: fullStreetAddress,
            pincode: pincode.trim(),
            city: city.trim(),
            state: state.trim(),
            addressType: modalAddrType || 'Home',
            isDefault: isTargetDefault
          };
        }
        return isTargetDefault ? { ...addr, isDefault: false } : addr;
      });
    } else {
      const newAddr = {
        id: 'addr_' + Date.now(),
        name: name.trim(),
        phone: cleanPhone,
        houseNo: houseNo.trim(),
        streetArea: streetArea.trim(),
        streetAddress: fullStreetAddress,
        pincode: pincode.trim(),
        city: city.trim(),
        state: state.trim(),
        addressType: modalAddrType || 'Home',
        isDefault: isTargetDefault
      };
      const cleanedExisting = isTargetDefault ? currentAddresses.map(a => ({ ...a, isDefault: false })) : currentAddresses;
      updatedAddresses = [...cleanedExisting, newAddr];
    }

    setIsUpdating(true);
    const success = await updateUserProfile({
      addresses: updatedAddresses
    });
    setIsUpdating(false);

    if (success) {
      setIsAddressModalOpen(false);
      showToast(editingAddressId ? 'Address updated successfully! 🎉' : 'New address saved! 🎉', 'success');
    }
  };

  const handleDeleteAddress = async (id) => {
    const currentAddresses = Array.isArray(currentUser?.addresses) ? [...currentUser.addresses] : [];
    let remaining = currentAddresses.filter(a => a && a.id !== id && a._id !== id);
    if (remaining.length > 0 && !remaining.some(a => a?.isDefault)) {
      remaining[0].isDefault = true;
    }
    setIsUpdating(true);
    const success = await updateUserProfile({ addresses: remaining });
    setIsUpdating(false);
    if (success) {
      showToast('🗑️ Address removed successfully.', 'info');
    }
  };


  const handleSetDefaultAddress = async (id) => {
    const currentAddresses = Array.isArray(currentUser?.addresses) ? [...currentUser.addresses] : [];
    const updated = currentAddresses.map(a => ({
      ...a,
      isDefault: (a?.id === id || a?._id === id)
    }));
    setIsUpdating(true);
    const success = await updateUserProfile({ addresses: updated });
    setIsUpdating(false);
    if (success) {
      showToast('Default delivery address updated! 🏠', 'success');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      showToast('First name and surname are required.', 'error');
      return;
    }
    if (!streetAreaInput.trim()) {
      showToast('Please enter your street address or locality.', 'error');
      return;
    }
    if (pincodeInput.trim().length !== 6 || isNaN(pincodeInput)) {
      showToast('Please enter a valid 6-digit Pincode.', 'error');
      return;
    }

    const fullMergedAddress = houseFlatInput.trim() 
      ? `${houseFlatInput.trim()}, ${streetAreaInput.trim()}` 
      : streetAreaInput.trim();

    setIsUpdating(true);
    const success = await updateUserProfile({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      pincode: pincodeInput.trim(),
      address: fullMergedAddress,
      houseNo: houseFlatInput.trim(),
      streetArea: streetAreaInput.trim(),
      city: cityInput.trim(),
      state: stateInput.trim(),
      addressType: addressType,
      email: emailInput.trim()
    });

    if (success) {
      showToast('Profile & delivery address updated successfully! 🎉', 'success');
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

    if (!auth.currentUser) {
      showToast('Authentication error. Please log in again.', 'error');
      return;
    }

    setIsVerifyingEmail(true);
    try {
      // First update email in Firebase
      await updateEmail(auth.currentUser, emailInput.trim());
      // Then send verification email
      await sendEmailVerification(auth.currentUser);
      
      showToast('Verification link sent! Please check your inbox.', 'success');
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
      
      // Update email in our DB but leave isEmailVerified false until they click the link
      await updateUserProfile({ email: emailInput.trim() });
    } catch (error) {
      console.error('Email verification error:', error);
      if (error.code === 'auth/requires-recent-login') {
        showToast('Please log out and log back in to update your email.', 'error');
      } else {
        showToast(error.message || 'Failed to send verification email.', 'error');
      }
    } finally {
      if (isMountedRef.current) {
        setIsVerifyingEmail(false);
      }
    }
  };

  const handleGeolocate = () => {
    if (navigator.geolocation) {
      showToast('Fetching geolocation coordinates...');
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`https://ominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
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
    <div className="profile-page-container animate-fade-in" style={{ padding: '0 0 130px 0', background: '#f8fafc', minHeight: '100vh' }}>
      
      {/* 1. VIP Luxury Dashboard Header (Unified Midnight Titanium & Gold Theme) */}
      <div className="profile-dashboard-header" style={{
        background: 'linear-gradient(135deg, #090d16 0%, #17153b 50%, #2e236c 100%)',
        boxShadow: '0 12px 32px -4px rgba(9, 13, 22, 0.35), inset 0 1px 0 rgba(255,255,255,0.1)',
        borderBottom: '1px solid rgba(251, 191, 36, 0.22)',
        paddingBottom: '54px'
      }}>
        <div className="profile-header-user">
          <div className="profile-header-avatar" style={{
            background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
            color: '#ffffff',
            border: '3px solid #fbbf24',
            boxShadow: '0 4px 18px rgba(251, 191, 36, 0.45)',
            fontWeight: '900',
            fontSize: '22px'
          }}>
            {getInitials(currentUser)}
          </div>
          <div className="profile-header-info">
            <h2 className="profile-header-name" style={{ color: '#ffffff', fontWeight: '900', letterSpacing: '-0.3px' }}>
              {(currentUser.firstName || currentUser.lastName)
                ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim()
                : currentUser.fullName || 'AbKharido Member'}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.22) 0%, rgba(217, 119, 6, 0.22) 100%)',
                border: '1px solid rgba(251, 191, 36, 0.45)',
                color: '#fbbf24',
                padding: '3px 10px',
                borderRadius: '100px',
                fontSize: '12px',
                fontWeight: '800',
                backdropFilter: 'blur(6px)'
              }}>
                👑 VIP Member
              </span>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: 'rgba(255, 255, 255, 0.12)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                padding: '3px 10px',
                borderRadius: '100px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                backdropFilter: 'blur(6px)'
              }} onClick={() => setActiveTab('rewards')}>
                🪙 {currentUser.walletCoins !== undefined ? currentUser.walletCoins : 100} Coins Active &gt;
              </span>
            </div>
          </div>
        </div>
      </div>


      <div style={{ padding: '0 16px', marginTop: '-34px', position: 'relative', zIndex: 10 }}>
        
        {/* 2. Upgraded Smart Quick Action Dashboard (Only on Overview) */}
        {activeTab === 'overview' ? (
          <div className="profile-quick-actions" style={{ marginTop: '4px' }}>
            <div className="quick-action-card" onClick={() => onNavigate('orders')} style={{ padding: '15px 14px', display: 'flex', alignItems: 'center', gap: '12px', border: '1.5px solid #f1f5f9', background: '#ffffff', borderRadius: '16px', boxShadow: '0 4px 14px rgba(0,0,0,0.02)', margin: 0, cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ShoppingBag size={22} color="#2563eb" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '14.5px', fontWeight: '800', color: '#0f172a' }}>My Orders</span>
                <small style={{ fontSize: '11.5px', color: '#64748b', fontWeight: '600', marginTop: '2px' }}>Track &amp; Reorder</small>
              </div>
            </div>

            <div className="quick-action-card" onClick={() => setActiveTab('wishlist')} style={{ padding: '15px 14px', display: 'flex', alignItems: 'center', gap: '12px', border: '1.5px solid #f1f5f9', background: '#ffffff', borderRadius: '16px', boxShadow: '0 4px 14px rgba(0,0,0,0.02)', margin: 0, cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Heart size={22} fill="#dc2626" color="#dc2626" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '14.5px', fontWeight: '800', color: '#0f172a' }}>Wishlist ({wishlistProducts.length})</span>
                <small style={{ fontSize: '11.5px', color: '#64748b', fontWeight: '600', marginTop: '2px' }}>Saved Deals</small>
              </div>
            </div>

            <div className="quick-action-card" onClick={() => setActiveTab('rewards')} style={{ padding: '15px 14px', display: 'flex', alignItems: 'center', gap: '12px', border: '1.5px solid #f1f5f9', background: '#ffffff', borderRadius: '16px', boxShadow: '0 4px 14px rgba(0,0,0,0.02)', margin: 0, cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '22px' }}>
                🪙
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '14.5px', fontWeight: '800', color: '#92400e' }}>{currentUser.walletCoins !== undefined ? currentUser.walletCoins : 100} Coins</span>
                <small style={{ fontSize: '11.5px', color: '#b45309', fontWeight: '700', marginTop: '2px' }}>Redeem Rewards</small>
              </div>
            </div>

            <div className="quick-action-card" onClick={() => setActiveTab('support')} style={{ padding: '15px 14px', display: 'flex', alignItems: 'center', gap: '12px', border: '1.5px solid #f1f5f9', background: '#ffffff', borderRadius: '16px', boxShadow: '0 4px 14px rgba(0,0,0,0.02)', margin: 0, cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ShieldCheck size={22} color="#16a34a" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '14.5px', fontWeight: '800', color: '#0f172a' }}>Help Center</span>
                <small style={{ fontSize: '11.5px', color: '#64748b', fontWeight: '600', marginTop: '2px' }}>Support Tickets</small>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '12px 0 20px 0', background: 'white', padding: '14px 18px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <button
              onClick={() => setActiveTab('overview')}
              style={{ background: '#f1f5f9', border: 'none', padding: '8px 16px', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontWeight: '800', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              <ArrowLeft size={16} /> Back to Overview
            </button>
            <span style={{ fontSize: '15px', fontWeight: '900', color: '#4f46e5' }}>
              {activeTab === 'rewards' ? '🪙 AB Rewards Hub' : activeTab === 'wishlist' ? `❤️ Wishlist (${wishlistProducts.length})` : activeTab === 'savedcards' ? '💳 Saved Wallets & Cards' : '🎧 Support Tickets'}
            </span>
          </div>
        )}

        {/* 3. Always Visible Settings Form */}
        {activeTab === 'overview' && (
        <>
        <form onSubmit={handleUpdateProfile} className="profile-form-card animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a', margin: 0 }}>Profile &amp; Personal Details</h3>
            <span style={{ background: '#ecfdf5', color: '#059669', fontSize: '11px', fontWeight: '800', padding: '3px 10px', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={13} /> 256-bit Encrypted
            </span>
          </div>

          <div className="profile-input-grid">
            <div>
              <label className="profile-input-label">FIRST NAME *</label>
              <input 
                type="text" 
                value={firstName} 
                onChange={(e) => setFirstName(e.target.value)} 
                placeholder="Enter first name"
                className="profile-input"
                required
              />
            </div>
            <div>
              <label className="profile-input-label">LAST NAME *</label>
              <input 
                type="text" 
                value={lastName} 
                onChange={(e) => setLastName(e.target.value)} 
                placeholder="Enter last name"
                className="profile-input"
                required
              />
            </div>
          </div>

          <div>
            <label className="profile-input-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span>MOBILE NUMBER</span>
              <span style={{ color: '#059669', background: '#d1fae5', padding: '1px 6px', borderRadius: '6px', fontSize: '10.5px', fontWeight: '800' }}>✔ OTP VERIFIED</span>
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '14px', top: '0', bottom: '0', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#64748b' }}>+91</span>
              </div>
              <input 
                type="text" 
                value={currentUser.phone || currentUser.username} 
                readOnly
                className="profile-input"
                style={{ paddingLeft: '48px', backgroundColor: '#f8fafc', fontWeight: '700', color: '#0f172a' }}
                disabled
              />
              <div style={{ position: 'absolute', right: '14px', top: '0', bottom: '0', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                <CheckCircle size={18} color="#10b981" />
              </div>
            </div>
          </div>

          {/* Email Settings Section */}
          <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '16px', marginTop: '2px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="profile-input-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <span>EMAIL ADDRESS</span>
                {currentUser.isEmailVerified && !isChangingEmail ? 
                  <span style={{ color: '#059669', background: '#d1fae5', padding: '1px 6px', borderRadius: '6px', fontSize: '10.5px', fontWeight: '800' }}>✔ VERIFIED</span> : 
                  <span style={{ color: '#ea580c', background: '#ffedd5', padding: '1px 6px', borderRadius: '6px', fontSize: '10.5px', fontWeight: '800' }}>⚠️ {emailInput ? 'PENDING' : 'NOT LINKED'}</span>
                }
              </label>
              {currentUser.isEmailVerified && !isChangingEmail && (
                <button 
                  type="button" 
                  onClick={() => setIsChangingEmail(true)} 
                  style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <span>✏️ Change Email</span>
                </button>
              )}
            </div>

            <div style={{ position: 'relative', width: '100%', display: 'flex' }}>
              <input 
                type="email" 
                value={emailInput} 
                onChange={(e) => setEmailInput(e.target.value)} 
                placeholder="Enter valid email address..."
                disabled={currentUser.isEmailVerified && !isChangingEmail}
                className="profile-input"
                style={{ paddingRight: (!currentUser.isEmailVerified || isChangingEmail) ? '115px' : '14px' }}
              />
              {(!currentUser.isEmailVerified || isChangingEmail) && (
                <button 
                  type="button" 
                  onClick={handleVerifyEmail}
                  disabled={isVerifyingEmail || !emailInput}
                  style={{ position: 'absolute', right: '5px', top: '50%', transform: 'translateY(-50%)', opacity: (isVerifyingEmail || !emailInput) ? 0.7 : 1, padding: '6px 12px', background: 'linear-gradient(135deg, #f97316, #ea580c)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '11.5px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(234,88,12,0.25)', whiteSpace: 'nowrap' }}
                >
                  {isVerifyingEmail ? 'Sending...' : 'Verify Now ⚡'}
                </button>
              )}
            </div>

            {isChangingEmail && (
              <div style={{ fontSize: '11.5px', color: '#4f46e5', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontWeight: '600' }}>
                <span>🔒</span>
                <span>Account secured via Mobile OTP (+91 {currentUser.phone || currentUser.username}). You can update your email address anytime.</span>
              </div>
            )}

            {!currentUser.isEmailVerified && !isChangingEmail && (
              <div style={{ fontSize: '11.5px', color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontWeight: '600' }}>
                <span>ℹ️</span>
                <span>Link email to receive invoice PDFs, dispatch tracking alerts &amp; coins.</span>
              </div>
            )}
          </div>

          {/* Address Book Section */}
          <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '18px', marginTop: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: '900', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>📍 Address Book</span>
                </h4>
                <p style={{ fontSize: '11.5px', color: '#64748b', margin: '2px 0 0', fontWeight: '500' }}>
                  Saved delivery addresses for seamless 1-click checkout.
                </p>
              </div>
              <button 
                type="button" 
                onClick={openAddAddressModal}
                style={{ background: '#4f46e5', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                + Add Address
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {Array.isArray(currentUser?.addresses) && currentUser.addresses.length > 0 ? currentUser.addresses.filter(Boolean).map((addr, addrIdx) => (
                <div key={addr?.id || `addr-${addrIdx}`} style={{ border: addr?.isDefault ? '1.5px solid #4f46e5' : '1px solid #e2e8f0', borderRadius: '14px', padding: '14px', background: addr?.isDefault ? '#f8faff' : '#ffffff', position: 'relative' }}>
                  {addr?.isDefault && (
                    <span style={{ position: 'absolute', top: '10px', right: '12px', background: '#4f46e5', color: 'white', fontSize: '9.5px', fontWeight: '900', padding: '2px 8px', borderRadius: '100px', letterSpacing: '0.3px' }}>
                      DEFAULT
                    </span>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '14px' }}>{addr?.addressType === 'Home' ? '🏠' : addr?.addressType === 'Work' ? '🏢' : '📍'}</span>
                    <strong style={{ fontSize: '14px', color: '#0f172a' }}>{addr?.addressType || 'Address'}</strong>
                  </div>
                  <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.4', marginBottom: '12px' }}>
                    <strong style={{ color: '#0f172a' }}>{addr?.name || currentUser?.fullName || 'User'}</strong><br/>
                    {addr?.houseNo ? addr.houseNo + ', ' : ''}{addr?.streetArea || addr?.streetAddress || addr?.address || ''}<br/>
                    {addr?.city || ''}{addr?.city && addr?.state ? ', ' : ''}{addr?.state || ''} {addr?.pincode ? `- ${addr.pincode}` : ''}<br/>
                    {addr?.phone ? <span style={{ color: '#64748b', fontSize: '12px' }}>Phone: {addr.phone}</span> : ''}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '14px', borderTop: '1px solid #f1f5f9', paddingTop: '10px', alignItems: 'center' }}>
                    <button type="button" onClick={() => openEditAddressModal(addr)} style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: '12.5px', fontWeight: '800', cursor: 'pointer', padding: 0 }}>Edit</button>
                    <button type="button" onClick={() => handleDeleteAddress(addr?.id)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '12.5px', fontWeight: '800', cursor: 'pointer', padding: 0 }}>Delete</button>
                    {!addr?.isDefault && (
                      <button type="button" onClick={() => handleSetDefaultAddress(addr?.id)} style={{ background: 'none', border: 'none', color: '#059669', fontSize: '12.5px', fontWeight: '800', cursor: 'pointer', padding: 0, marginLeft: 'auto' }}>Set Default</button>
                    )}
                  </div>
                </div>
              )) : (
                <div style={{ padding: '20px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                  <p style={{ color: '#64748b', fontSize: '13px', fontWeight: '600', margin: 0 }}>No addresses saved yet.</p>
                </div>
              )}
            </div>
          </div>

          {hasChanges && (
            <div style={{ marginTop: '12px' }}>
              <button 
                type="submit" 
                className="profile-submit-btn"
                disabled={isUpdating}
              >
                <span>💾</span>
                {isUpdating ? 'Saving to Server...' : 'Save Profile Changes'}
              </button>
            </div>
          )}
        </form>

        {/* 4. Account Quick Nav Links */}
        <div className="profile-menu-list">
          <div className="profile-menu-item" onClick={() => setActiveTab('savedcards')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                <CreditCard size={18} />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>Saved Wallets &amp; Cards</div>
                <div style={{ fontSize: '11.5px', color: '#64748b' }}>Manage faster payment checkout methods</div>
              </div>
            </div>
            <ArrowRight size={16} color="#94a3b8" />
          </div>

          <div className="profile-menu-item" onClick={() => onNavigate('partner')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
                <Award size={18} />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>Creator &amp; Partner Program</div>
                <div style={{ fontSize: '11.5px', color: '#64748b' }}>Earn commission by recommending products</div>
              </div>
            </div>
            <ArrowRight size={16} color="#94a3b8" />
          </div>

          <div className="profile-menu-item logout-item" onClick={logout}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
                <LogOut size={18} />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#dc2626' }}>Log Out from all devices</div>
                <div style={{ fontSize: '11.5px', color: '#ef4444' }}>Securely conclude your active session</div>
              </div>
            </div>
          </div>
        </div>
        </>
        )}

        {/* AB Rewards Hub Section */}
        {activeTab === 'rewards' && (
          <div className="animate-fade-in" style={{ padding: '0px', display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '32px' }}>
            <style>
              {`
                @keyframes holographic-shine {
                  0% { background-position: -200% 50%; }
                  100% { background-position: 200% 50%; }
                }
                @keyframes mesh-pulse {
                  0% { transform: scale(1) translate(0, 0); opacity: 0.15; }
                  50% { transform: scale(1.2) translate(10px, -10px); opacity: 0.25; }
                  100% { transform: scale(1) translate(0, 0); opacity: 0.15; }
                }
                .premium-wallet-card {
                  background: linear-gradient(135deg, #09090b 0%, #171717 100%);
                  position: relative;
                  overflow: hidden;
                  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255,255,255,0.1);
                  transition: transform 0.3s ease, box-shadow 0.3s ease;
                }
                .premium-wallet-card:hover {
                  transform: translateY(-5px);
                  box-shadow: 0 35px 60px -15px rgba(245, 158, 11, 0.2), inset 0 1px 1px rgba(255,255,255,0.15);
                }
                .wallet-shine-overlay {
                  position: absolute;
                  top: 0; left: 0; right: 0; bottom: 0;
                  background: linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.08) 25%, transparent 30%);
                  background-size: 200% auto;
                  animation: holographic-shine 6s linear infinite;
                  z-index: 2;
                  pointer-events: none;
                }
                .glass-action-card {
                  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
                  border: 1px solid rgba(255,255,255,0.8);
                  box-shadow: 0 10px 30px -5px rgba(0,0,0,0.05), inset 0 2px 5px rgba(255,255,255,1);
                  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
                  position: relative;
                  overflow: hidden;
                }
                .glass-action-card:hover {
                  transform: translateY(-8px);
                  box-shadow: 0 20px 40px -10px rgba(79, 70, 229, 0.15), inset 0 2px 5px rgba(255,255,255,1);
                  border-color: rgba(79, 70, 229, 0.2);
                }
                .action-arrow-btn {
                  transition: transform 0.2s ease;
                }
                .glass-action-card:hover .action-arrow-btn {
                  transform: translateX(4px);
                }
              `}
            </style>
            
            {/* Ultra Premium Obsidian Wallet Card */}
            <div className="premium-wallet-card" style={{ borderRadius: '28px', padding: '36px', color: 'white' }}>
              <div className="wallet-shine-overlay"></div>
              
              {/* Animated mesh gradients */}
              <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '350px', height: '350px', background: 'radial-gradient(circle, rgba(245,158,11,0.2) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%', animation: 'mesh-pulse 8s ease-in-out infinite alternate', zIndex: 1 }}></div>
              <div style={{ position: 'absolute', bottom: '-30%', left: '-10%', width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%', animation: 'mesh-pulse 10s ease-in-out infinite alternate-reverse', zIndex: 1 }}></div>
              
              <div style={{ position: 'relative', zIndex: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)', color: '#ffffff', padding: '10px', borderRadius: '12px', boxShadow: '0 8px 16px rgba(245, 158, 11, 0.3), inset 0 2px 4px rgba(255,255,255,0.4)' }}>
                      <Coins size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                      <span style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '1px', background: 'linear-gradient(to right, #fef3c7, #fde68a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'block' }}>AB Coin Wallet</span>
                      <span style={{ fontSize: '12px', color: '#a1a1aa', fontWeight: '500', letterSpacing: '2px', textTransform: 'uppercase' }}>Rewards Hub</span>
                    </div>
                  </div>
                  <div style={{ padding: '6px 16px', background: 'linear-gradient(135deg, rgba(251,191,36,0.2) 0%, rgba(180,83,9,0.2) 100%)', border: '1px solid rgba(251,191,36,0.4)', borderRadius: '100px', fontSize: '12px', fontWeight: '800', color: '#fde68a', boxShadow: '0 4px 15px rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={14} /> VIP MEMBER
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '32px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: '13px', color: '#a1a1aa', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>Available Balance</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span style={{ fontSize: '64px', fontWeight: '900', background: 'linear-gradient(to bottom, #ffffff, #cbd5e1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: '1', filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.5))' }}>
                      {currentUser.walletCoins?.toLocaleString('en-IN') || 0}
                    </span>
                    <span style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b', textShadow: '0 2px 10px rgba(245,158,11,0.4)' }}>Coins</span>
                  </div>
                </div>

                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ display: 'flex', gap: '32px' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Equivalent Value</div>
                      <div style={{ fontSize: '18px', fontWeight: '800', color: '#e4e4e7' }}>₹{currentUser.walletCoins?.toLocaleString('en-IN') || 0}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Lifetime Earned</div>
                      <div style={{ fontSize: '18px', fontWeight: '800', color: '#e4e4e7' }}>{((currentUser.walletCoins || 0) + (currentUser.totalSpent || 0) * 0.05).toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                  <button onClick={() => onNavigate('home')} style={{ background: 'white', color: '#09090b', border: 'none', padding: '12px 28px', borderRadius: '100px', fontSize: '14px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 15px rgba(255,255,255,0.2)', transition: 'transform 0.2s' }}>
                    Redeem Now
                  </button>
                </div>
              </div>
            </div>

            {/* Dynamic Gamification Section */}
            <div style={{ background: 'white', borderRadius: '24px', padding: '28px', border: '1px solid #f1f5f9', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award size={20} color="#4f46e5" /> Reward Milestone
                </h4>
                <span style={{ background: '#f5f3ff', color: '#6d28d9', padding: '6px 14px', borderRadius: '100px', fontSize: '12px', fontWeight: '800' }}>Silver Tier Unlocked</span>
              </div>
              <p style={{ margin: '0 0 24px 0', fontSize: '14.5px', color: '#64748b' }}>Earn <strong>{(500 - (currentUser.walletCoins || 0) % 500)}</strong> more coins to unlock the <strong>Gold Tier</strong> and receive a ₹500 mystery voucher!</p>
              
              <div style={{ width: '100%', height: '14px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
                <div style={{ 
                  height: '100%', 
                  width: `${Math.min(((currentUser.walletCoins || 0) % 500) / 500 * 100, 100)}%`, 
                  background: 'linear-gradient(90deg, #6366f1 0%, #a855f7 50%, #f59e0b 100%)',
                  borderRadius: '10px',
                  position: 'relative'
                }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)', animation: 'holographic-shine 2s linear infinite' }}></div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '13px', fontWeight: '800', color: '#94a3b8' }}>
                <span>0</span>
                <span>500 Coins</span>
              </div>
            </div>

            {/* Elevated How to Earn Action Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              
              <div className="glass-action-card" style={{ padding: '32px', borderRadius: '24px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ background: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)', width: '60px', height: '60px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5', marginBottom: '24px', boxShadow: '0 8px 16px rgba(79, 70, 229, 0.15)' }}>
                  <ShoppingBag size={28} />
                </div>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>Shop & Earn</h4>
                <p style={{ margin: '0 0 32px 0', color: '#64748b', fontSize: '14.5px', lineHeight: '1.6', flex: 1 }}>Earn up to <strong>5% cashback</strong> in AB Coins on every successful purchase you make across our entire store.</p>
                <button onClick={() => onNavigate('home')} style={{ alignSelf: 'flex-start', background: '#f8fafc', border: '1.5px solid #e2e8f0', padding: '12px 24px', borderRadius: '12px', color: '#334155', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Start Shopping <ArrowRight size={16} className="action-arrow-btn" />
                </button>
              </div>

              <div className="glass-action-card" style={{ padding: '32px', borderRadius: '24px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)', width: '60px', height: '60px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706', marginBottom: '24px', boxShadow: '0 8px 16px rgba(217, 119, 6, 0.15)' }}>
                  <Award size={28} />
                </div>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>Refer & Earn</h4>
                <p style={{ margin: '0 0 32px 0', color: '#64748b', fontSize: '14.5px', lineHeight: '1.6', flex: 1 }}>Share your influencer link to earn massive AB Coins bonuses whenever your friends sign up and make a purchase!</p>
                <button onClick={() => onNavigate('partner')} style={{ alignSelf: 'flex-start', background: '#f8fafc', border: '1.5px solid #e2e8f0', padding: '12px 24px', borderRadius: '12px', color: '#334155', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Get Referral Link <ArrowRight size={16} className="action-arrow-btn" />
                </button>
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

        {/* Saved Cards / Payment Security Section */}
        {activeTab === 'savedcards' && (
          <div className="animate-fade-in" style={{ background: 'white', padding: '32px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '24px', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShieldCheck size={20} color="#10b981" />
                  <span>Payment Security</span>
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Manage your securely vaulted cards via Cashfree tokenization network.</p>
              </div>
            </div>

            {savedCards && savedCards.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {savedCards.map(card => (
                  <div key={card.instrument_id} style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', borderRadius: '16px', padding: '24px', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)' }}>
                    <div style={{ position: 'absolute', top: -20, right: -20, width: '100px', height: '100px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', position: 'relative', zIndex: 2 }}>
                      <div style={{ fontWeight: '600', fontSize: '16px', letterSpacing: '1px', textTransform: 'uppercase' }}>{card.card_network}</div>
                      <CreditCard size={24} color="#94a3b8" />
                    </div>
                    <div style={{ fontSize: '20px', letterSpacing: '3px', fontFamily: 'monospace', marginBottom: '8px', position: 'relative', zIndex: 2 }}>
                      •••• •••• •••• {card.last4}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative', zIndex: 2 }}>
                      <div style={{ fontSize: '12px', color: '#cbd5e1', textTransform: 'uppercase' }}>{card.card_bank_name || 'Bank Card'}</div>
                      <button 
                        onClick={async () => {
                          const success = await removeSavedCard(card.instrument_id);
                          if (success) showToast('💳 Card removed safely from your account.', 'info');
                          else showToast('Failed to remove card.', 'error');
                        }}
                        style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
                      >
                        Remove
                      </button>

                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                <CreditCard size={48} color="#94a3b8" style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                <h4 style={{ margin: '0 0 8px', color: '#334155', fontSize: '16px' }}>No Saved Cards Found</h4>
                <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>Your saved cards will securely appear here after your next checkout via Cashfree.</p>
              </div>
            )}
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {/* Luxury Empty Banner */}
              <div style={{ textAlign: 'center', padding: '48px 24px', background: 'linear-gradient(135deg, #fff1f2 0%, #fef2f2 100%)', borderRadius: '24px', border: '1.5px dashed #fecdd3', boxShadow: '0 10px 25px -5px rgba(244,63,94,0.08)' }}>
                <div style={{ width: '76px', height: '76px', background: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 20px rgba(244,63,94,0.15)', fontSize: '36px' }}>
                  💖
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#881337', margin: '0 0 8px 0', letterSpacing: '-0.3px' }}>Your Wishlist is Empty</h3>
                <p style={{ fontSize: '14px', color: '#9f1239', margin: '0 auto 24px auto', maxWidth: '440px', lineHeight: '1.5', fontWeight: '500' }}>
                  Don&apos;t lose track of lightning deals and discounts! Save your favorite electronics, gadgets &amp; fashions here for instant price drop alerts.
                </p>
                <button 
                  onClick={() => onNavigate('home')}
                  style={{ background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)', color: 'white', border: 'none', padding: '12px 28px', borderRadius: '100px', fontSize: '14px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 6px 16px rgba(225,29,72,0.3)', transition: 'transform 0.2s', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  ✨ Explore Trending Deals Now
                </button>
              </div>

              {/* Recommended Products right in empty wishlist */}
              {products && products.length > 0 && (
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
                  <h4 style={{ fontSize: '17px', fontWeight: '900', color: '#0f172a', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🔥 Recommended For You</span>
                    <span style={{ fontSize: '11.5px', background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '100px', fontWeight: '700' }}>Cashback Eligible</span>
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
                    {products.slice(0, 4).map(p => {
                      const discount = p.originalPrice > p.price ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0;
                      return (
                        <div key={p.id} style={{ border: '1.5px solid #e2e8f0', borderRadius: '16px', background: 'white', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'all 0.2s', position: 'relative', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                          {discount > 0 && (
                            <div style={{ position: 'absolute', top: '8px', left: '8px', background: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '6px', fontSize: '10.5px', fontWeight: '800', zIndex: 3 }}>
                              {discount}% OFF
                            </div>
                          )}
                          <button 
                            onClick={(e) => { e.stopPropagation(); toggleWishlist(p.id); showToast('Added to Wishlist! ❤️', 'success'); }} 
                            style={{ position: 'absolute', top: '8px', right: '8px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 3, boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}
                            title="Save to Wishlist"
                          >
                            <Heart size={16} color="#dc2626" />
                          </button>
                          <div onClick={() => onNavigate(`product-${p.id}`)} style={{ height: '150px', padding: '12px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                          </div>
                          <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between', gap: '8px' }}>
                            <div>
                              <h5 onClick={() => onNavigate(`product-${p.id}`)} style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', margin: '0 0 6px 0', cursor: 'pointer', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.3' }}>
                                {p.name}
                              </h5>
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                                <span style={{ fontSize: '15px', fontWeight: '900', color: '#10b981' }}>₹{(p.price || 0).toLocaleString('en-IN')}</span>
                                {p.originalPrice > p.price && <span style={{ fontSize: '11px', color: '#94a3b8', textDecoration: 'line-through' }}>₹{p.originalPrice.toLocaleString('en-IN')}</span>}
                              </div>
                            </div>
                            <button 
                              onClick={() => { addToCart(p); showToast('Added to Bag! 🛍️', 'success'); }}
                              style={{ width: '100%', background: '#4f46e5', color: 'white', border: 'none', padding: '8px 0', borderRadius: '8px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}
                            >
                              🛍️ ADD TO BAG
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px', minWidth: 0 }}>
              {wishlistProducts.map(p => {
                const discount = p.originalPrice > p.price ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0;
                return (
                  <div 
                    key={p.id}
                    style={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      border: '1.5px solid #e2e8f0', 
                      borderRadius: '16px',
                      background: '#ffffff',
                      overflow: 'hidden',
                      position: 'relative',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                    }}
                    className="wishlist-product-card"
                  >
                    {/* Top Badges */}
                    {discount > 0 && (
                      <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)', color: 'white', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', zIndex: 5, boxShadow: '0 2px 6px rgba(239,68,68,0.3)' }}>
                        🔥 {discount}% OFF
                      </div>
                    )}
                    
                    <button 
                      onClick={() => toggleWishlist(p.id)}
                      style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(255, 255, 255, 0.9)', border: '1px solid #e2e8f0', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626', cursor: 'pointer', zIndex: 5, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                      title="Remove from Wishlist"
                    >
                      <Trash2 size={16} />
                    </button>

                    {/* Image */}
                    <div 
                      onClick={() => {
                        if (onNavigateProduct) onNavigateProduct(p.id);
                        else onNavigate(`product-${p.id}`);
                      }}
                      style={{ height: '160px', width: '100%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', cursor: 'pointer' }}
                    >
                      <img 
                        src={p.image} 
                        alt={p.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'contain', transition: 'transform 0.3s ease' }} 
                      />
                    </div>

                    {/* Content */}
                    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between', gap: '8px' }}>
                      <div>
                        <h4 
                          onClick={() => {
                            if (onNavigateProduct) onNavigateProduct(p.id);
                            else onNavigate(`product-${p.id}`);
                          }}
                          style={{ fontSize: '13.5px', fontWeight: '700', color: '#0f172a', cursor: 'pointer', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.3', minHeight: '35px', margin: '0 0 6px 0' }}
                        >
                          {p.name}
                        </h4>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '15px', fontWeight: '900', color: '#10b981' }}>₹{(p.price || 0).toLocaleString('en-IN')}</span>
                          {p.originalPrice > p.price && (
                            <span style={{ fontSize: '11.5px', color: '#94a3b8', textDecoration: 'line-through' }}>₹{(p.originalPrice || 0).toLocaleString('en-IN')}</span>
                          )}
                        </div>
                      </div>

                      <button 
                        onClick={() => {
                          addToCart(p);
                          showToast('Added to Bag! 🛍️', 'success');
                        }}
                        style={{ width: '100%', background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)', color: 'white', border: 'none', padding: '10px 0', borderRadius: '10px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 4px 10px rgba(79,70,229,0.2)' }}
                      >
                        <ShoppingBag size={15} /> ADD TO BAG
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        )}

      </div>

      {/* ── 5. Add / Edit Address Modal ── */}
      {isAddressModalOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            overflowY: 'auto',
            padding: '20px 16px 100px 16px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddressModalOpen(false);
          }}
        >
          <div 
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '500px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              padding: '22px',
              position: 'relative',
              margin: 'auto',
              animation: 'modalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <style>{`
              @keyframes modalSlideUp {
                from { opacity: 0; transform: translateY(16px) scale(0.98); }
                to { opacity: 1; transform: translateY(0) scale(1); }
              }
            `}</style>

            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '900', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>📍</span> {editingAddressId ? 'Edit Delivery Address' : 'Add New Delivery Address'}
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                  Enter delivery details for fast, accurate shipping.
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setIsAddressModalOpen(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', cursor: 'pointer', flexShrink: 0 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveAddressModal} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Full Name & Phone */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 200px' }}>
                  <label className="profile-label" style={{ fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '6px', display: 'block' }}>Full Name *</label>
                  <input 
                    type="text" 
                    value={addressModalData.name} 
                    onChange={(e) => setAddressModalData({ ...addressModalData, name: e.target.value })}
                    className="profile-input"
                    placeholder="e.g. Raj Chauhan"
                    required
                    style={{ height: '44px', fontSize: '13.5px' }}
                  />
                </div>
                <div style={{ flex: '1 1 200px' }}>
                  <label className="profile-label" style={{ fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '6px', display: 'block' }}>Mobile Number *</label>
                  <input 
                    type="tel" 
                    value={addressModalData.phone} 
                    onChange={(e) => setAddressModalData({ ...addressModalData, phone: e.target.value })}
                    className="profile-input"
                    placeholder="10-digit mobile"
                    maxLength={10}
                    required
                    style={{ height: '44px', fontSize: '13.5px' }}
                  />
                </div>
              </div>

              {/* Pincode & Locality */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 140px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="profile-label" style={{ fontSize: '12px', fontWeight: '800', color: '#475569', margin: 0 }}>Pincode *</label>
                    {isModalPincodeLoading && <span style={{ fontSize: '10.5px', color: '#4f46e5', fontWeight: '700' }}>Resolving...</span>}
                  </div>
                  <input 
                    type="text" 
                    value={addressModalData.pincode} 
                    onChange={(e) => handleModalPincodeChange(e.target.value)}
                    className="profile-input"
                    placeholder="6 digits"
                    maxLength={6}
                    inputMode="numeric"
                    required
                    style={{ height: '44px', fontSize: '13.5px' }}
                  />
                </div>
                <div style={{ flex: '1 1 200px' }}>
                  <label className="profile-label" style={{ fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '6px', display: 'block' }}>Locality / Area *</label>
                  <input 
                    type="text" 
                    value={addressModalData.streetArea} 
                    onChange={(e) => setAddressModalData({ ...addressModalData, streetArea: e.target.value })}
                    className="profile-input"
                    placeholder="e.g. Indiranagar 100ft Road"
                    required
                    style={{ height: '44px', fontSize: '13.5px' }}
                  />
                </div>
              </div>

              {/* Flat No / House */}
              <div>
                <label className="profile-label" style={{ fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '6px', display: 'block' }}>Flat / House No. / Building (Optional)</label>
                <input 
                  type="text" 
                  value={addressModalData.houseNo} 
                  onChange={(e) => setAddressModalData({ ...addressModalData, houseNo: e.target.value })}
                  className="profile-input"
                  placeholder="e.g. Flat 402, Sai Residency"
                  style={{ height: '44px', fontSize: '13.5px' }}
                />
              </div>

              {/* City & State */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 180px' }}>
                  <label className="profile-label" style={{ fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '6px', display: 'block' }}>City *</label>
                  <input 
                    type="text" 
                    value={addressModalData.city} 
                    onChange={(e) => setAddressModalData({ ...addressModalData, city: e.target.value })}
                    className="profile-input"
                    placeholder="e.g. Bengaluru"
                    required
                    style={{ height: '44px', fontSize: '13.5px' }}
                  />
                </div>
                <div style={{ flex: '1 1 180px' }}>
                  <label className="profile-label" style={{ fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '6px', display: 'block' }}>State *</label>
                  <input 
                    type="text" 
                    value={addressModalData.state} 
                    onChange={(e) => setAddressModalData({ ...addressModalData, state: e.target.value })}
                    className="profile-input"
                    placeholder="e.g. Karnataka"
                    required
                    style={{ height: '44px', fontSize: '13.5px' }}
                  />
                </div>
              </div>

              {/* Address Type Buttons */}
              <div>
                <label className="profile-label" style={{ fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '8px', display: 'block' }}>Address Type</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[
                    { type: 'Home', icon: '🏠', label: 'Home' },
                    { type: 'Work', icon: '🏢', label: 'Work' },
                    { type: 'Other', icon: '📍', label: 'Other' }
                  ].map(({ type, icon, label }) => {
                    const isSelected = addressModalData.addressType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setAddressModalData({ ...addressModalData, addressType: type })}
                        style={{
                          flex: 1,
                          height: '38px',
                          borderRadius: '10px',
                          border: isSelected ? '2px solid #4f46e5' : '1px solid #cbd5e1',
                          background: isSelected ? '#f5f3ff' : '#ffffff',
                          color: isSelected ? '#4f46e5' : '#475569',
                          fontWeight: '800',
                          fontSize: '12.5px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span>{icon}</span> {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Make Default Checkbox */}
              <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <input 
                  type="checkbox"
                  id="modal-default-address"
                  checked={addressModalData.isDefault}
                  onChange={(e) => setAddressModalData({ ...addressModalData, isDefault: e.target.checked })}
                  style={{ width: '16px', height: '16px', accentColor: '#4f46e5', cursor: 'pointer' }}
                />
                <label htmlFor="modal-default-address" style={{ fontSize: '12.5px', fontWeight: '700', color: '#0f172a', cursor: 'pointer', margin: 0 }}>
                  Make this my default delivery address
                </label>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  onClick={() => setIsAddressModalOpen(false)}
                  style={{ flex: 1, height: '44px', background: '#f1f5f9', border: 'none', color: '#475569', fontWeight: '800', fontSize: '13px', borderRadius: '10px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isUpdating}
                  style={{ flex: 2, height: '44px', background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', border: 'none', color: '#ffffff', fontWeight: '800', fontSize: '13.5px', borderRadius: '10px', cursor: isUpdating ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)' }}
                >
                  {isUpdating ? 'Saving Address...' : editingAddressId ? 'Update Address' : 'Save Address'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProfilePage;
