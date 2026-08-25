// Fast In-Memory Indian Pincode Directory & SLA Estimator

const PINCODE_MAP = {
  // Delhi NCR
  '110': { city: 'New Delhi', state: 'Delhi', slaHours: 24, cod: true },
  '121': { city: 'Faridabad', state: 'Haryana', slaHours: 24, cod: true },
  '122': { city: 'Gurugram', state: 'Haryana', slaHours: 24, cod: true },
  '201': { city: 'Noida / Ghaziabad', state: 'Uttar Pradesh', slaHours: 24, cod: true },

  // Maharashtra — Western & Konkan
  '400': { city: 'Mumbai', state: 'Maharashtra', slaHours: 24, cod: true },
  '401': { city: 'Palghar / Vasai / Virar', state: 'Maharashtra', slaHours: 24, cod: true },
  '402': { city: 'Raigad / Alibag', state: 'Maharashtra', slaHours: 48, cod: true },
  '410': { city: 'Navi Mumbai / Panvel', state: 'Maharashtra', slaHours: 24, cod: true },
  '411': { city: 'Pune', state: 'Maharashtra', slaHours: 24, cod: true },
  '412': { city: 'Pune Rural', state: 'Maharashtra', slaHours: 48, cod: true },
  '413': { city: 'Solapur', state: 'Maharashtra', slaHours: 48, cod: true },
  '414': { city: 'Ahmednagar', state: 'Maharashtra', slaHours: 48, cod: true },
  '415': { city: 'Satara / Ratnagiri', state: 'Maharashtra', slaHours: 48, cod: true },
  '416': { city: 'Kolhapur / Sangli', state: 'Maharashtra', slaHours: 48, cod: true },
  '421': { city: 'Thane / Kalyan / Dombivli', state: 'Maharashtra', slaHours: 24, cod: true },
  '422': { city: 'Nashik', state: 'Maharashtra', slaHours: 48, cod: true },
  '423': { city: 'Malegaon', state: 'Maharashtra', slaHours: 48, cod: true },
  '424': { city: 'Dhule', state: 'Maharashtra', slaHours: 48, cod: true },
  '425': { city: 'Jalgaon', state: 'Maharashtra', slaHours: 48, cod: true },
  '431': { city: 'Chhatrapati Sambhajinagar', state: 'Maharashtra', slaHours: 48, cod: true },
  '440': { city: 'Nagpur', state: 'Maharashtra', slaHours: 48, cod: true },
  '444': { city: 'Amravati / Akola', state: 'Maharashtra', slaHours: 48, cod: true },

  // Karnataka
  '560': { city: 'Bengaluru', state: 'Karnataka', slaHours: 24, cod: true },
  '570': { city: 'Mysuru', state: 'Karnataka', slaHours: 48, cod: true },
  '580': { city: 'Hubballi-Dharwad', state: 'Karnataka', slaHours: 48, cod: true },
  '575': { city: 'Mangaluru', state: 'Karnataka', slaHours: 48, cod: true },

  // Tamil Nadu
  '600': { city: 'Chennai', state: 'Tamil Nadu', slaHours: 24, cod: true },
  '641': { city: 'Coimbatore', state: 'Tamil Nadu', slaHours: 48, cod: true },
  '625': { city: 'Madurai', state: 'Tamil Nadu', slaHours: 48, cod: true },

  // Telangana & AP
  '500': { city: 'Hyderabad', state: 'Telangana', slaHours: 24, cod: true },
  '530': { city: 'Visakhapatnam', state: 'Andhra Pradesh', slaHours: 48, cod: true },
  '520': { city: 'Vijayawada', state: 'Andhra Pradesh', slaHours: 48, cod: true },

  // West Bengal
  '700': { city: 'Kolkata', state: 'West Bengal', slaHours: 24, cod: true },
  '711': { city: 'Howrah', state: 'West Bengal', slaHours: 24, cod: true },

  // Gujarat
  '380': { city: 'Ahmedabad', state: 'Gujarat', slaHours: 24, cod: true },
  '395': { city: 'Surat', state: 'Gujarat', slaHours: 24, cod: true },
  '390': { city: 'Vadodara', state: 'Gujarat', slaHours: 48, cod: true },
  '360': { city: 'Rajkot', state: 'Gujarat', slaHours: 48, cod: true },

  // Rajasthan
  '302': { city: 'Jaipur', state: 'Rajasthan', slaHours: 24, cod: true },
  '342': { city: 'Jodhpur', state: 'Rajasthan', slaHours: 48, cod: true },

  // Uttar Pradesh & Bihar
  '226': { city: 'Lucknow', state: 'Uttar Pradesh', slaHours: 24, cod: true },
  '208': { city: 'Kanpur', state: 'Uttar Pradesh', slaHours: 48, cod: true },
  '221': { city: 'Varanasi', state: 'Uttar Pradesh', slaHours: 48, cod: true },
  '800': { city: 'Patna', state: 'Bihar', slaHours: 48, cod: true },

  // Punjab, Haryana & Chandigarh
  '160': { city: 'Chandigarh', state: 'Punjab', slaHours: 24, cod: true },
  '141': { city: 'Ludhiana', state: 'Punjab', slaHours: 48, cod: true },
  '143': { city: 'Amritsar', state: 'Punjab', slaHours: 48, cod: true },

  // Kerala
  '682': { city: 'Kochi', state: 'Kerala', slaHours: 48, cod: true },
  '695': { city: 'Thiruvananthapuram', state: 'Kerala', slaHours: 48, cod: true }
};

const pincodeCache = new Map();

export function lookupPincode(pincode) {
  if (!pincode) return null;
  const cleanPin = pincode.toString().replace(/\D/g, '').slice(0, 6);
  if (cleanPin.length !== 6) return null;

  if (pincodeCache.has(cleanPin)) {
    return pincodeCache.get(cleanPin);
  }

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
    const zoneMap = {
      '11': { city: 'Delhi NCR', state: 'Delhi' },
      '12': { city: 'Haryana', state: 'Haryana' },
      '13': { city: 'Haryana', state: 'Haryana' },
      '14': { city: 'Punjab', state: 'Punjab' },
      '15': { city: 'Punjab', state: 'Punjab' },
      '16': { city: 'Chandigarh', state: 'Punjab' },
      '17': { city: 'Himachal Pradesh', state: 'Himachal Pradesh' },
      '18': { city: 'Jammu & Kashmir', state: 'Jammu and Kashmir' },
      '19': { city: 'Srinagar / Kashmir', state: 'Jammu and Kashmir' },
      '20': { city: 'Western UP', state: 'Uttar Pradesh' },
      '22': { city: 'Central UP', state: 'Uttar Pradesh' },
      '24': { city: 'Uttarakhand', state: 'Uttarakhand' },
      '26': { city: 'UP Eastern', state: 'Uttar Pradesh' },
      '27': { city: 'UP Eastern', state: 'Uttar Pradesh' },
      '28': { city: 'Agra Zone', state: 'Uttar Pradesh' },
      '30': { city: 'Jaipur Region', state: 'Rajasthan' },
      '31': { city: 'Udaipur Region', state: 'Rajasthan' },
      '32': { city: 'Kota Region', state: 'Rajasthan' },
      '33': { city: 'Bikaner Region', state: 'Rajasthan' },
      '34': { city: 'Jodhpur Region', state: 'Rajasthan' },
      '36': { city: 'Saurashtra', state: 'Gujarat' },
      '37': { city: 'Kutch', state: 'Gujarat' },
      '38': { city: 'Ahmedabad Region', state: 'Gujarat' },
      '39': { city: 'Surat / South Gujarat', state: 'Gujarat' },
      '40': { city: 'Mumbai / Konkan / Palghar', state: 'Maharashtra' },
      '41': { city: 'Pune / Western MH', state: 'Maharashtra' },
      '42': { city: 'Nashik / North MH', state: 'Maharashtra' },
      '43': { city: 'Marathwada', state: 'Maharashtra' },
      '44': { city: 'Vidarbha / Nagpur', state: 'Maharashtra' },
      '50': { city: 'Hyderabad Region', state: 'Telangana' },
      '51': { city: 'Rayalaseema', state: 'Andhra Pradesh' },
      '52': { city: 'Coastal Andhra', state: 'Andhra Pradesh' },
      '53': { city: 'Visakhapatnam Region', state: 'Andhra Pradesh' },
      '56': { city: 'Bengaluru Region', state: 'Karnataka' },
      '57': { city: 'Mysuru / Coastal KA', state: 'Karnataka' },
      '58': { city: 'North Karnataka', state: 'Karnataka' },
      '59': { city: 'Belagavi Region', state: 'Karnataka' },
      '60': { city: 'Chennai Region', state: 'Tamil Nadu' },
      '61': { city: 'Central TN', state: 'Tamil Nadu' },
      '62': { city: 'Madurai Region', state: 'Tamil Nadu' },
      '63': { city: 'North TN', state: 'Tamil Nadu' },
      '64': { city: 'Coimbatore Region', state: 'Tamil Nadu' },
      '67': { city: 'Malabar Region', state: 'Kerala' },
      '68': { city: 'Cochin Region', state: 'Kerala' },
      '69': { city: 'South Kerala', state: 'Kerala' },
      '70': { city: 'Kolkata Region', state: 'West Bengal' },
      '71': { city: 'Howrah / Hooghly', state: 'West Bengal' },
      '72': { city: 'Medinipur', state: 'West Bengal' },
      '73': { city: 'North Bengal', state: 'West Bengal' },
      '75': { city: 'Bhubaneswar Region', state: 'Odisha' },
      '78': { city: 'Guwahati / Assam', state: 'Assam' },
      '79': { city: 'North East India', state: 'North East' },
      '80': { city: 'Patna Region', state: 'Bihar' },
      '82': { city: 'Dhanbad Region', state: 'Jharkhand' },
      '83': { city: 'Ranchi Region', state: 'Jharkhand' }
    };
    const prefix2 = cleanPin.slice(0, 2);
    const zMatch = zoneMap[prefix2];
    daysToAdd = 2;
    city = zMatch ? zMatch.city : `Zone ${prefix2}`;
    state = zMatch ? zMatch.state : 'India';
  }

  const deliveryDate = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
  const dateOptions = { weekday: 'short', month: 'short', day: 'numeric' };
  const formattedDate = deliveryDate.toLocaleDateString('en-IN', dateOptions);

  const result = {
    pincode: cleanPin,
    city,
    state,
    slaDays: daysToAdd,
    deliveryDateStr: formattedDate,
    isExpress: daysToAdd <= 2,
    isCodAvailable,
    displayText: `${city} ${cleanPin}`
  };

  pincodeCache.set(cleanPin, result);
  return result;
}

/**
 * Real-time Indian Postal API async lookup for 100% pinpoint district resolution (e.g. Palghar)
 */
export async function lookupPincodeAsync(pincode) {
  if (!pincode) return null;
  const cleanPin = pincode.toString().replace(/\D/g, '').slice(0, 6);
  if (cleanPin.length !== 6) return null;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`, { signal: controller.signal });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      if (data && data[0]?.Status === 'Success' && data[0].PostOffice?.[0]) {
        const po = data[0].PostOffice[0];
        const city = po.District || po.Block || po.Name || po.Circle;
        const state = po.State || 'India';
        const now = new Date();
        const daysToAdd = 2;
        const deliveryDate = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
        const formattedDate = deliveryDate.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });

        const result = {
          pincode: cleanPin,
          city,
          state,
          slaDays: daysToAdd,
          deliveryDateStr: formattedDate,
          isExpress: true,
          isCodAvailable: true,
          displayText: `${city} ${cleanPin}`
        };
        pincodeCache.set(cleanPin, result);
        return result;
      }
    }
  } catch (e) {
    // fallback to in-memory lookup
  }
  return lookupPincode(cleanPin);
}
