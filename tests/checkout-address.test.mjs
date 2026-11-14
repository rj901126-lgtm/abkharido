import assert from 'node:assert/strict';
import { test } from 'node:test';
import { checkoutAddressLine, checkoutAddressReducer, checkoutAddressToSaved, createCheckoutAddressState, savedAddressToCheckout } from '../src/utils/checkoutAddress.js';

const original = { id: 'home', name: 'Buyer', phone: '9876543210', houseNo: '10 Old Road', streetArea: 'Fort', city: 'Mumbai', state: 'Maharashtra', pincode: '400001', isDefault: true };
const buyer = { _id: 'buyer-a', fullName: 'Buyer', phone: '9876543210', addresses: [original] };
const newAddress = { name: 'Buyer', phone: '9876543210', streetAddress: 'Flat 12, Rose Tower', locality: 'Andheri', city: 'Mumbai', state: 'Maharashtra', pincode: '400069' };

test('checkout address survives an address-book round trip using persisted fields', () => {
  const saved = checkoutAddressToSaved(newAddress, { id: 'work', phone: '9876543210' });
  assert.equal(saved.houseNo, 'Flat 12, Rose Tower');
  assert.equal(saved.streetArea, 'Andheri');
  assert.equal(Object.hasOwn(saved, 'streetAddress'), false);
  const restored = savedAddressToCheckout(saved, buyer);
  assert.equal(checkoutAddressLine(restored), 'Flat 12, Rose Tower, Andheri');
  assert.equal(restored.pincode, '400069');
  assert.equal(restored.locality, '');
});

test('saving a second address preserves the selected delivery address after profile refresh', () => {
  let state = createCheckoutAddressState(buyer);
  state = checkoutAddressReducer(state, { type: 'select', address: newAddress });
  const saved = checkoutAddressToSaved(newAddress, { id: 'work' });
  state = checkoutAddressReducer(state, { type: 'hydrate', user: { ...buyer, addresses: [original, saved] } });
  assert.deepEqual(state.address, newAddress);
  assert.equal(state.selected, true);
});

test('saved address selection and in-progress edits survive same-buyer refreshes', () => {
  let state = createCheckoutAddressState(buyer);
  const selected = savedAddressToCheckout({ ...original, id: 'office', houseNo: '22 New Road', isDefault: false }, buyer);
  state = checkoutAddressReducer(state, { type: 'select', address: selected });
  state = checkoutAddressReducer(state, { type: 'hydrate', user: { ...buyer, walletCoins: 50 } });
  assert.deepEqual(state.address, selected);
  state = checkoutAddressReducer(state, { type: 'select', address: { ...selected, streetAddress: 'Flat 3' } });
  state = checkoutAddressReducer(state, { type: 'hydrate', user: buyer });
  assert.equal(state.address.streetAddress, 'Flat 3');
});

test('late profile defaults hydrate untouched forms while buyer changes reset prior edits', () => {
  let state = createCheckoutAddressState({ _id: buyer._id });
  state = checkoutAddressReducer(state, { type: 'resolve', address: previous => ({ ...previous, city: 'Mumbai' }) });
  state = checkoutAddressReducer(state, { type: 'hydrate', user: buyer });
  assert.equal(state.address.streetAddress, '10 Old Road, Fort');
  state = checkoutAddressReducer(state, { type: 'select', address: newAddress });
  state = checkoutAddressReducer(state, { type: 'hydrate', user: { _id: 'buyer-b', fullName: 'Other', address: '50 New Street' } });
  assert.equal(state.address.streetAddress, '50 New Street');
  assert.equal(state.address.name, 'Other');
  assert.equal(state.selected, false);
  state = checkoutAddressReducer(state, { type: 'hydrate', user: null });
  assert.equal(state.address.streetAddress, '');
});

test('legacy full addresses and checkout locality reach the shipping line without duplicates', () => {
  assert.equal(checkoutAddressLine(newAddress), 'Flat 12, Rose Tower, Andheri');
  assert.equal(savedAddressToCheckout({ streetAddress: 'Flat 12, Andheri', streetArea: 'Andheri' }).streetAddress, 'Flat 12, Andheri');
  assert.equal(savedAddressToCheckout({ streetArea: '10 Old Road, Fort' }).streetAddress, '10 Old Road, Fort');
});
