const fs = require('fs');
let content = fs.readFileSync('src/views/Checkout.jsx', 'utf8');

// The replacement logic:
const addressUIStart = `      {/* STEP 1: Address Details */}`;
const addressUIEnd = `      {/* STEP 2: Order Summary */}`;

const startIndex = content.indexOf(addressUIStart);
const endIndex = content.indexOf(addressUIEnd);

if (startIndex !== -1 && endIndex !== -1) {
  const before = content.substring(0, startIndex);
  const after = content.substring(endIndex);
  
  const newAddressUI = `      {/* STEP 1: Address Details */}
      {step === 1 ? (
        <div className="card checkout-card">
          <h2 className="checkout-step-header"><MapPin size={20} /> Select Delivery Address</h2>
          
          {currentUser?.addresses && currentUser.addresses.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'grid', gap: '12px' }}>
                {currentUser.addresses.map((addr) => {
                  const isSelected = address.streetAddress === (addr.streetAddress || addr.streetArea) && address.pincode === addr.pincode;
                  return (
                    <div 
                      key={addr.id}
                      onClick={() => {
                        setAddress({
                          name: addr.name || currentUser.fullName,
                          phone: addr.phone || currentUser.phone,
                          pincode: addr.pincode,
                          locality: addr.streetArea || '',
                          streetAddress: addr.houseNo ? addr.houseNo + ', ' + (addr.streetArea || addr.streetAddress) : (addr.streetArea || addr.streetAddress),
                          city: addr.city,
                          state: addr.state
                        });
                      }}
                      style={{
                        padding: '16px',
                        border: isSelected ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                        borderRadius: '12px',
                        background: isSelected ? '#eff6ff' : '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: '700', fontSize: '15px' }}>
                          {addr.addressType === 'Home' ? '🏠 ' : addr.addressType === 'Work' ? '🏢 ' : '📍 '} 
                          {addr.addressType} {addr.isDefault && <span style={{fontSize: '11px', background: '#4f46e5', color: 'white', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px'}}>DEFAULT</span>}
                        </div>
                        {isSelected && <CheckCircle2 size={18} color="#4f46e5" />}
                      </div>
                      <div style={{ fontSize: '13.5px', color: '#475569', lineHeight: '1.4' }}>
                        {addr.name}<br/>
                        {addr.houseNo ? addr.houseNo + ', ' : ''}{addr.streetArea || addr.streetAddress}<br/>
                        {addr.city}, {addr.state} - <strong>{addr.pincode}</strong><br/>
                        Phone: {addr.phone}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
                <button 
                  onClick={() => setAddress({ name: currentUser?.fullName||'', phone: currentUser?.phone||'', pincode: '', locality: '', streetAddress: '', city: '', state: '' })}
                  style={{ background: 'none', border: '1px dashed #94a3b8', color: '#475569', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                >
                  + Enter New Address
                </button>
              </div>
            </div>
          )}

          {(!currentUser?.addresses || currentUser.addresses.length === 0 || !address.pincode) && (
            <form onSubmit={handleAddressSubmit} className="checkout-form">
              <div className="checkout-form-row">
                <div style={{ flex: 1 }}>
                  <label className="checkout-label">Full Name*</label>
                  <input type="text" value={address.name} onChange={(e) => setAddress({...address, name: e.target.value})} className="checkout-input" required />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="checkout-label">Mobile Number*</label>
                  <input type="tel" value={address.phone} onChange={(e) => setAddress({...address, phone: e.target.value})} className="checkout-input" required />
                </div>
              </div>

              <div className="checkout-form-row">
                <div style={{ flex: 1 }}>
                  <label className="checkout-label">Pincode*</label>
                  <input type="text" value={address.pincode} onChange={(e) => setAddress({...address, pincode: e.target.value})} className="checkout-input" maxLength="6" inputMode="numeric" pattern="[0-9]{6}" placeholder="6-digit pincode" required />
                  
                  {isCheckingShipping && <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>Checking shipping serviceability...</div>}
                  {shippingServiceability && !isCheckingShipping && (
                    <div style={{ fontSize: '11px', marginTop: '4px', fontWeight: '500' }}>
                      {shippingServiceability.serviceable ? (
                        <span style={{ color: '#2e7d32' }}>✓ Deliverable by {shippingServiceability.courier} in {shippingServiceability.estimatedDays || 4-5} days.</span>
                      ) : (
                        <span style={{ color: '#c62828' }}>✗ Delivery unavailable for this pin code.</span>
                      )}
                    </div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <label className="checkout-label">Locality/Area*</label>
                  <input type="text" value={address.locality} onChange={(e) => setAddress({...address, locality: e.target.value})} className="checkout-input" required />
                </div>
              </div>

              <div>
                <label className="checkout-label">Street Address/Flat No.*</label>
                <textarea value={address.streetAddress} onChange={(e) => setAddress({...address, streetAddress: e.target.value})} className="checkout-input" required />
              </div>

              <div className="checkout-form-row">
                <div style={{ flex: 1 }}>
                  <label className="checkout-label">City*</label>
                  <input type="text" value={address.city} onChange={(e) => setAddress({...address, city: e.target.value})} className="checkout-input" required />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="checkout-label">State*</label>
                  <input type="text" value={address.state} onChange={(e) => setAddress({...address, state: e.target.value})} className="checkout-input" required />
                </div>
              </div>
            </form>
          )}

          <div className="checkout-actions">
            <button 
              type="button" 
              onClick={handleAddressSubmit}
              disabled={!address.name || !address.phone || !address.pincode || !address.streetAddress || isCheckingShipping || (shippingServiceability && !shippingServiceability.serviceable)} 
              className="btn btn-primary"
            >
              DELIVER HERE <ArrowRight size={18} />
            </button>
          </div>
        </div>
      ) : null}

`;
  
  content = before + newAddressUI + after;
  fs.writeFileSync('src/views/Checkout.jsx', content, 'utf8');
  console.log('Modified Checkout.jsx successfully.');
} else {
  console.log('Could not find start or end index in Checkout.jsx');
}
