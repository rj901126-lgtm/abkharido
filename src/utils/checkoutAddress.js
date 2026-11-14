const text = value => String(value || '').trim();

export function checkoutAddressLine(address = {}) {
  const street = text(address.streetAddress || address.address);
  const locality = text(address.locality);
  if (!locality || street.toLowerCase().endsWith(locality.toLowerCase())) return street;
  return [street, locality].filter(Boolean).join(', ');
}

export function savedAddressToCheckout(saved = {}, user = {}) {
  const streetAddress = saved.houseNo
    ? checkoutAddressLine({ streetAddress: saved.houseNo, locality: saved.streetArea })
    : checkoutAddressLine({ streetAddress: saved.streetAddress || saved.address || saved.streetArea, locality: (saved.streetAddress || saved.address) ? saved.streetArea : '' });
  return {
    name: saved.name || user.fullName || '',
    phone: saved.phone || user.phone || user.username || '',
    pincode: saved.pincode || '',
    locality: '',
    streetAddress,
    city: saved.city || '',
    state: saved.state || ''
  };
}

export function checkoutAddressToSaved(address, { id, phone, isDefault = false }) {
  return {
    id,
    name: text(address.name),
    phone: phone || text(address.phone),
    // These are the address fields persisted by the User address-book schema.
    houseNo: text(address.streetAddress),
    streetArea: text(address.locality),
    city: text(address.city),
    state: text(address.state),
    pincode: text(address.pincode),
    addressType: 'Home',
    isDefault
  };
}

export function createCheckoutAddressState(user) {
  const buyerId = text(user?._id || user?.id || user?.username || user?.phone || user?.email);
  const addresses = Array.isArray(user?.addresses) ? user.addresses.filter(Boolean) : [];
  const saved = addresses.find(item => item.isDefault) || addresses[0];
  return {
    buyerId,
    selected: false,
    address: saved ? savedAddressToCheckout(saved, user) : {
      name: user?.fullName || '',
      phone: user?.phone || user?.username || '',
      pincode: user?.pincode || '',
      locality: '',
      streetAddress: user?.address || checkoutAddressLine({ streetAddress: user?.houseNo, locality: user?.streetArea }),
      city: user?.city || '',
      state: user?.state || ''
    }
  };
}

export function checkoutAddressReducer(state, action) {
  if (action.type === 'hydrate') {
    const next = createCheckoutAddressState(action.user);
    return next.buyerId === state.buyerId && state.selected ? state : next;
  }
  if (action.type === 'select' || action.type === 'resolve') {
    return {
      ...state,
      selected: state.selected || action.type === 'select',
      address: typeof action.address === 'function' ? action.address(state.address) : action.address
    };
  }
  return state;
}
