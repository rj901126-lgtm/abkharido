const fs = require('fs');
let content = fs.readFileSync('src/views/ProfilePage.jsx', 'utf8');

// 1. Add new state hooks
content = content.replace(
  /const \[isEditing, setIsEditing\] = useState\(false\);/,
  `const [isEditing, setIsEditing] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);`
);

// 2. Add Address Handlers inside the component
content = content.replace(
  /const handleUpdateProfile = async \(e\) => {/,
  `const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!pincodeInput || !streetAreaInput) return;
    
    const addresses = currentUser.addresses && currentUser.addresses.length > 0 ? [...currentUser.addresses] : [];
    const newAddress = {
      id: editingAddressId || 'addr_' + Date.now(),
      name: currentUser.fullName || 'User',
      phone: currentUser.phone || '',
      houseNo: houseFlatInput,
      streetArea: streetAreaInput,
      streetAddress: streetAreaInput,
      city: cityInput,
      pincode: pincodeInput,
      state: stateInput,
      addressType: addressType,
      isDefault: editingAddressId ? undefined : (addresses.length === 0)
    };

    if (editingAddressId) {
      const idx = addresses.findIndex(a => a.id === editingAddressId);
      if (idx !== -1) {
        if (newAddress.isDefault === undefined) newAddress.isDefault = addresses[idx].isDefault;
        addresses[idx] = { ...addresses[idx], ...newAddress };
      }
    } else {
      addresses.push(newAddress);
    }

    setIsUpdating(true);
    const success = await updateUserProfile({ addresses });
    if (success) setIsAddressModalOpen(false);
    setIsUpdating(false);
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    const addresses = currentUser.addresses.filter(a => a.id !== id);
    if (addresses.length > 0 && !addresses.find(a => a.isDefault)) {
      addresses[0].isDefault = true;
    }
    await updateUserProfile({ addresses });
  };

  const handleSetDefaultAddress = async (id) => {
    const addresses = currentUser.addresses.map(a => ({
      ...a,
      isDefault: a.id === id
    }));
    await updateUserProfile({ addresses });
  };
  
  const openAddAddressModal = () => {
    setEditingAddressId(null);
    setPincodeInput('');
    setHouseFlatInput('');
    setStreetAreaInput('');
    setCityInput('');
    setStateInput('');
    setAddressType('Home');
    setIsAddressModalOpen(true);
  };
  
  const openEditAddressModal = (addr) => {
    setEditingAddressId(addr.id);
    setPincodeInput(addr.pincode || '');
    setHouseFlatInput(addr.houseNo || '');
    setStreetAreaInput(addr.streetArea || addr.streetAddress || addr.address || '');
    setCityInput(addr.city || '');
    setStateInput(addr.state || '');
    setAddressType(addr.addressType || 'Home');
    setIsAddressModalOpen(true);
  };

  const handleUpdateProfile = async (e) => {`
);

// 3. Update hasChanges
content = content.replace(
  /const hasChanges = [^;]+;/,
  `const hasChanges = firstName !== initialFirstName || 
                     lastName !== initialLastName || 
                     emailInput !== (currentUser?.email || '');`
);

// 4. Update the handleUpdateProfile payload
content = content.replace(
  /const success = await updateUserProfile\(\{[\s\S]*?\}\);/,
  `const success = await updateUserProfile({
        firstName,
        lastName,
        email: emailInput
      });`
);

// 5. Replace Address UI Section
const addressUIStart = `          {/* Address Settings Section - 100 Crore E-commerce Look */}`;
const addressUIEnd = `          <div style={{ marginTop: '24px' }}>`;

const startIndex = content.indexOf(addressUIStart);
const endIndex = content.indexOf(addressUIEnd);

if (startIndex !== -1 && endIndex !== -1) {
  const before = content.substring(0, startIndex);
  const after = content.substring(endIndex);
  
  const newAddressUI = `
          {/* Address Book Section */}
          <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '24px', marginTop: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h4 style={{ fontSize: '17px', fontWeight: '900', color: '#0f172a', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>📍 Address Book</span>
                </h4>
                <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0, fontWeight: '500' }}>
                  Manage your delivery addresses for seamless checkout.
                </p>
              </div>
              <button 
                type="button" 
                onClick={openAddAddressModal}
                style={{ background: '#4f46e5', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                + Add New Address
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {currentUser.addresses && currentUser.addresses.length > 0 ? currentUser.addresses.map((addr) => (
                <div key={addr.id} style={{ border: addr.isDefault ? '2px solid #4f46e5' : '1.5px solid #cbd5e1', borderRadius: '16px', padding: '16px', background: addr.isDefault ? '#f8fafc' : 'white', position: 'relative' }}>
                  {addr.isDefault && (
                    <span style={{ position: 'absolute', top: '-10px', right: '16px', background: '#4f46e5', color: 'white', fontSize: '11px', fontWeight: '800', padding: '4px 10px', borderRadius: '100px' }}>
                      DEFAULT
                    </span>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '16px' }}>{addr.addressType === 'Home' ? '🏠' : addr.addressType === 'Work' ? '🏢' : '📍'}</span>
                    <strong style={{ fontSize: '15px', color: '#0f172a' }}>{addr.addressType}</strong>
                  </div>
                  <div style={{ fontSize: '13.5px', color: '#475569', lineHeight: '1.5', marginBottom: '16px' }}>
                    <strong>{addr.name}</strong><br/>
                    {addr.houseNo ? addr.houseNo + ', ' : ''}{addr.streetArea || addr.streetAddress}<br/>
                    {addr.city}, {addr.state} - <strong>{addr.pincode}</strong><br/>
                    Phone: {addr.phone}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '12px', borderTop: '1px dashed #e2e8f0', paddingTop: '12px' }}>
                    <button type="button" onClick={() => openEditAddressModal(addr)} style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: '13px', fontWeight: '700', cursor: 'pointer', padding: 0 }}>Edit</button>
                    <button type="button" onClick={() => handleDeleteAddress(addr.id)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '13px', fontWeight: '700', cursor: 'pointer', padding: 0 }}>Delete</button>
                    {!addr.isDefault && (
                      <button type="button" onClick={() => handleSetDefaultAddress(addr.id)} style={{ background: 'none', border: 'none', color: '#10b981', fontSize: '13px', fontWeight: '700', cursor: 'pointer', padding: 0, marginLeft: 'auto' }}>Set Default</button>
                    )}
                  </div>
                </div>
              )) : (
                <div style={{ gridColumn: '1 / -1', padding: '30px', textAlign: 'center', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                  <p style={{ color: '#64748b', fontSize: '14px', fontWeight: '600' }}>No addresses saved yet.</p>
                </div>
              )}
            </div>
          </div>
`;
  
  content = before + newAddressUI + after;
}

// 6. Add the Modal UI at the bottom of the file (before final closing tag)
const modalUI = `
      {/* Address Modal */}
      {isAddressModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'white', width: '100%', maxWidth: '500px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>{editingAddressId ? 'Edit Address' : 'Add New Address'}</h3>
              <button onClick={() => setIsAddressModalOpen(false)} style={{ background: '#e2e8f0', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569', fontWeight: 'bold' }}>×</button>
            </div>
            
            <form onSubmit={handleSaveAddress} style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="profile-input-label" style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: '800', color: '#334155' }}>SAVE AS</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[{ id: 'Home', icon: '🏠', label: 'Home' }, { id: 'Work', icon: '🏢', label: 'Office' }, { id: 'Other', icon: '📍', label: 'Other' }].map(type => (
                    <button key={type.id} type="button" onClick={() => setAddressType(type.id)} style={{ flex: 1, padding: '10px', borderRadius: '12px', border: addressType === type.id ? '2px solid #4f46e5' : '1.5px solid #cbd5e1', background: addressType === type.id ? '#e0e7ff' : '#ffffff', color: addressType === type.id ? '#4f46e5' : '#64748b', fontWeight: '800', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' }}>
                      {type.icon} {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="profile-input-label" style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>DELIVERY PINCODE *</label>
                <input type="text" maxLength="6" value={pincodeInput} onChange={(e) => setPincodeInput(e.target.value.replace(/\\D/g, ''))} placeholder="e.g. 401404" className="profile-input" style={{ letterSpacing: '2px', fontWeight: '800', fontSize: '16px', background: 'white', border: '1.5px solid #cbd5e1' }} required />
              </div>

              {(cityInput || stateInput) && (
                <div style={{ display: 'flex', alignItems: 'center', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '10px 14px', borderRadius: '10px', color: '#166534', fontSize: '13px', fontWeight: '700' }}>
                  <span>🇮🇳 Area: {cityInput}{cityInput && stateInput ? ', ' : ''}{stateInput}</span>
                </div>
              )}

              <div>
                <label className="profile-input-label" style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>HOUSE / FLAT NO., BUILDING</label>
                <input type="text" value={houseFlatInput} onChange={(e) => setHouseFlatInput(e.target.value)} placeholder="e.g. Flat 204, Shiv Kripa Building" className="profile-input" style={{ background: 'white', fontSize: '15px', fontWeight: '600', border: '1.5px solid #cbd5e1' }} />
              </div>

              <div>
                <label className="profile-input-label" style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>STREET, AREA & LANDMARK *</label>
                <input type="text" value={streetAreaInput} onChange={(e) => setStreetAreaInput(e.target.value)} placeholder="e.g. Station Road, Near Shiv Sena Office" className="profile-input" style={{ background: 'white', fontSize: '15px', fontWeight: '600', border: '1.5px solid #cbd5e1' }} required />
              </div>

              <div style={{ marginTop: '8px' }}>
                <button type="submit" disabled={isUpdating} style={{ width: '100%', padding: '16px', background: isUpdating ? '#94a3b8' : '#0f172a', color: 'white', borderRadius: '16px', fontWeight: '800', fontSize: '15px', border: 'none', cursor: isUpdating ? 'not-allowed' : 'pointer', boxShadow: isUpdating ? 'none' : '0 10px 20px -5px rgba(15,23,42,0.3)' }}>
                  {isUpdating ? 'Saving...' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
`;

content = content.replace(/(?=\n    <\/div>\n  \);\n};\n\nexport default ProfilePage;)/, modalUI);

fs.writeFileSync('src/views/ProfilePage.jsx', content, 'utf8');
console.log('Modified ProfilePage successfully.');
