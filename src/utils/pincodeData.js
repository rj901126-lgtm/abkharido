// Fast In-Memory Indian Pincode Directory & SLA Estimator

const PINCODE_MAP = {
  // Delhi NCR
  '110': { city: 'New Delhi', state: 'Delhi', slaHours: 24, cod: true },
  '121': { city: 'Faridabad', state: 'Haryana', slaHours: 24, cod: true },
  '122': { city: 'Gurugram', state: 'Haryana', slaHours: 24, cod: true },
  '201': { city: 'Noida / Ghaziabad', state: 'Uttar Pradesh', slaHours: 24, cod: true },

  // Maharashtra
  '400': { city: 'Mumbai', state: 'Maharashtra', slaHours: 48, cod: true },
  '411': { city: 'Pune', state: 'Maharashtra', slaHours: 48, cod: true },
  '440': { city: 'Nagpur', state: 'Maharashtra', slaHours: 72, cod: true },

  // Karnataka
  '560': { city: 'Bengaluru', state: 'Karnataka', slaHours: 48, cod: true },
  '570': { city: 'Mysuru', state: 'Karnataka', slaHours: 72, cod: true },

  // Tamil Nadu
  '600': { city: 'Chennai', state: 'Tamil Nadu', slaHours: 48, cod: true },
  '641': { city: 'Coimbatore', state: 'Tamil Nadu', slaHours: 72, cod: true },

  // Telangana & AP
  '500': { city: 'Hyderabad', state: 'Telangana', slaHours: 48, cod: true },
  '530': { city: 'Visakhapatnam', state: 'Andhra Pradesh', slaHours: 72, cod: true },

  // West Bengal
  '700': { city: 'Kolkata', state: 'West Bengal', slaHours: 48, cod: true },

  // Gujarat
  '380': { city: 'Ahmedabad', state: 'Gujarat', slaHours: 48, cod: true },
  '395': { city: 'Surat', state: 'Gujarat', slaHours: 48, cod: true },

  // Rajasthan
  '302': { city: 'Jaipur', state: 'Rajasthan', slaHours: 48, cod: true },

  // Uttar Pradesh & Bihar
  '226': { city: 'Lucknow', state: 'Uttar Pradesh', slaHours: 48, cod: true },
  '208': { city: 'Kanpur', state: 'Uttar Pradesh', slaHours: 48, cod: true },
  '800': { city: 'Patna', state: 'Bihar', slaHours: 72, cod: true },

  // Punjab & Chandigarh
  '160': { city: 'Chandigarh', state: 'Punjab', slaHours: 48, cod: true },
  '141': { city: 'Ludhiana', state: 'Punjab', slaHours: 48, cod: true },

  // Kerala
  '682': { city: 'Kochi', state: 'Kerala', slaHours: 72, cod: true }
};

export function lookupPincode(pincode) {
  if (!pincode) return null;
  const cleanPin = pincode.toString().replace(/\D/g, '').slice(0, 6);
  if (cleanPin.length !== 6) return null;

  const prefix3 = cleanPin.slice(0, 3);
  const matched = PINCODE_MAP[prefix3];

  const now = new Date();
  let daysToAdd = 2; // default 2 days

  let city = 'Delhi NCR';
  let state = 'India';
  let isCodAvailable = true;

  if (matched) {
    city = matched.city;
    state = matched.state;
    daysToAdd = Math.ceil(matched.slaHours / 24);
    isCodAvailable = matched.cod;
  } else {
    // Standard tier-2 / tier-3 Indian estimate
    daysToAdd = 3;
    city = `Zone ${cleanPin.slice(0, 2)}`;
    state = 'India';
  }

  const deliveryDate = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
  const dateOptions = { weekday: 'short', month: 'short', day: 'numeric' };
  const formattedDate = deliveryDate.toLocaleDateString('en-IN', dateOptions);

  return {
    pincode: cleanPin,
    city,
    state,
    slaDays: daysToAdd,
    deliveryDateStr: formattedDate,
    isExpress: daysToAdd <= 2,
    isCodAvailable,
    displayText: `${city} ${cleanPin}`
  };
}
