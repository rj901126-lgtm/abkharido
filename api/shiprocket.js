import dotenv from 'dotenv';
dotenv.config();

const EMAIL = process.env.SHIPROCKET_EMAIL || "api-rj901126@gmail.com";
const PASSWORD = process.env.SHIPROCKET_PASSWORD || "u32r*GOmwT%yXVEyhOQFwByCTBIR#9Av";
const PICKUP_PINCODE = process.env.SHIPROCKET_PICKUP_PINCODE || "401404";

let cachedToken = null;
let tokenExpiry = 0; // Timestamp in ms

/**
 * Authenticates with Shiprocket API and returns a cached token.
 */
export async function getShiprocketToken() {
  const now = Date.now();
  // Token is valid for 10 days; we refresh it if it is close to expiry (e.g. within 1 day)
  if (cachedToken && tokenExpiry > now + 24 * 60 * 60 * 1000) {
    return cachedToken;
  }

  try {
    console.log('[SHIPROCKET] Authenticating...');
    const res = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || `Auth failed with status ${res.status}`);
    }

    const data = await res.json();
    cachedToken = data.token;
    // Set expiry to 9 days from now to be safe
    tokenExpiry = now + 9 * 24 * 60 * 60 * 1000;
    console.log('[SHIPROCKET] Authenticated successfully. Token cached.');
    return cachedToken;
  } catch (err) {
    console.error('[SHIPROCKET] Authentication error:', err.message);
    return null;
  }
}

/**
 * Checks serviceability for a delivery pincode.
 */
export async function checkServiceability(deliveryPincode, weight = 0.5, isCod = false) {
  try {
    const token = await getShiprocketToken();
    if (!token) throw new Error('No auth token available');

    const codParam = isCod ? 1 : 0;
    const url = `https://apiv2.shiprocket.in/v1/external/courier/serviceability/?pickup_postcode=${PICKUP_PINCODE}&delivery_postcode=${deliveryPincode}&weight=${weight}&cod=${codParam}`;
    
    console.log(`[SHIPROCKET] Checking serviceability from ${PICKUP_PINCODE} to ${deliveryPincode}...`);
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || `Serviceability request failed with status ${res.status}`);
    }

    const data = await res.json();
    // Verify if there are available couriers
    if (data.status === 200 && data.data && data.data.available_courier_companies) {
      const companies = data.data.available_courier_companies;
      if (companies.length > 0) {
        // Return the first available courier as the recommended one, along with rate and delivery days
        const recommended = companies[0];
        return {
          serviceable: true,
          courier: recommended.courier_name,
          rate: recommended.rate,
          etd: recommended.etd,
          estimatedDays: recommended.estimated_delivery_days
        };
      }
    }
    return { serviceable: false, reason: 'No courier partners available for this pin code.' };
  } catch (err) {
    console.warn('[SHIPROCKET] Serviceability check failed:', err.message);
    return { serviceable: false, error: err.message };
  }
}

/**
 * Places a custom adhoc shipment order in Shiprocket.
 */
export async function createShiprocketOrder(orderId, customerDetails, items, finalAmount, isCod) {
  try {
    const token = await getShiprocketToken();
    if (!token) throw new Error('No auth token available');

    // Format current date: YYYY-MM-DD HH:MM
    const dateObj = new Date();
    const formattedDate = dateObj.toISOString().split('T')[0] + ' ' + 
                          String(dateObj.getHours()).padStart(2, '0') + ':' + 
                          String(dateObj.getMinutes()).padStart(2, '0');

    // Build Shiprocket order payload
    const orderPayload = {
      order_id: orderId,
      order_date: formattedDate,
      pickup_location: "Primary", // Assumed default pickup location name set in dashboard
      billing_customer_name: customerDetails.fullName.split(' ')[0] || 'Customer',
      billing_last_name: customerDetails.fullName.split(' ').slice(1).join(' ') || 'User',
      billing_address: customerDetails.addressLine || 'Address details',
      billing_address_2: '',
      billing_city: customerDetails.city || 'City',
      billing_pincode: customerDetails.pincode,
      billing_state: customerDetails.state || 'State',
      billing_country: 'India',
      billing_email: customerDetails.email || 'customer@abkharido.com',
      billing_phone: customerDetails.phone,
      shipping_is_billing: true,
      order_items: items.map(item => ({
        name: item.product.name,
        sku: item.product.id || `SKU-${item.product.name.replace(/\s+/g, '-').substring(0, 8)}`,
        units: item.quantity,
        selling_price: item.product.price,
        discount: 0,
        tax: 0,
        hsn: 0
      })),
      payment_method: isCod ? 'COD' : 'Prepaid',
      shipping_charges: 0,
      giftwrap_charges: 0,
      transaction_charges: 0,
      total_discount: 0,
      sub_total: finalAmount,
      length: 15,
      width: 15,
      height: 10,
      weight: 0.5
    };

    console.log(`[SHIPROCKET] Creating shipment for order ${orderId}...`);
    const res = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(orderPayload)
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || `Order creation failed with status ${res.status}`);
    }

    const data = await res.json();
    if (data.order_id && data.shipment_id) {
      return {
        success: true,
        shipmentId: data.shipment_id,
        orderId: data.order_id,
        awbCode: data.awb_code || null,
        courier: data.courier_name || 'Shiprocket'
      };
    }
    throw new Error(data.message || 'Unexpected response format from Shiprocket');
  } catch (err) {
    console.error('[SHIPROCKET] Order sync failed:', err.message);
    return { success: false, error: err.message };
  }
}
