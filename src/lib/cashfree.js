import crypto from 'crypto';

/**
 * Server-only Cashfree Payment Gateway Configuration & Helper
 */
export function getCashfreeConfig() {
  const appId = process.env.CASHFREE_APP_ID || process.env.NEXT_PUBLIC_CASHFREE_APP_ID || '';
  const secretKey = process.env.CASHFREE_SECRET_KEY || '';
  const webhookSecret = process.env.CASHFREE_WEBHOOK_SECRET || secretKey;
  const env = (process.env.CASHFREE_ENV || (process.env.NODE_ENV === 'production' && process.env.CASHFREE_PROD === 'true' ? 'production' : 'sandbox')).toLowerCase();
  const apiVersion = process.env.CASHFREE_API_VERSION || '2023-08-01';

  const baseUrl = env === 'production' 
    ? 'https://api.cashfree.com/pg' 
    : 'https://sandbox.cashfree.com/pg';

  return {
    appId,
    secretKey,
    webhookSecret,
    env,
    apiVersion,
    baseUrl,
    isConfigured: Boolean(appId && secretKey)
  };
}

/**
 * Create a new Order in Cashfree Payment Gateway
 */
export async function createCashfreePgOrder({ orderId, orderAmount, customer, returnUrl, notifyUrl }) {
  const config = getCashfreeConfig();

  if (!config.isConfigured) {
    // Return sandbox simulation if keys are pending in development
    if (config.env === 'sandbox' || process.env.NODE_ENV !== 'production') {
      return {
        orderId,
        paymentSessionId: `session_sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        simulated: true
      };
    }
    throw new Error('Cashfree Payment Gateway is not configured. Please set CASHFREE_APP_ID and CASHFREE_SECRET_KEY.');
  }

  const payload = {
    order_id: orderId,
    order_amount: Number(orderAmount.toFixed(2)),
    order_currency: 'INR',
    customer_details: {
      customer_id: customer.id ? String(customer.id).replace(/[^a-zA-Z0-9_-]/g, '') : `cust_${Date.now()}`,
      customer_phone: customer.phone ? customer.phone.replace(/\D/g, '').slice(-10) : '9999999999',
      customer_email: customer.email || 'care@abkharido.com',
      customer_name: customer.name || 'Valued Customer'
    },
    order_meta: {
      return_url: returnUrl,
      notify_url: notifyUrl
    }
  };

  const response = await fetch(`${config.baseUrl}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-client-id': config.appId,
      'x-client-secret': config.secretKey,
      'x-api-version': config.apiVersion
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error('[Cashfree Order Creation Error]:', response.status, data);
    throw new Error(data.message || data.error || 'Failed to create order on Cashfree Gateway');
  }

  return {
    orderId: data.order_id || orderId,
    paymentSessionId: data.payment_session_id,
    cfOrderId: data.cf_order_id,
    simulated: false
  };
}

/**
 * Fetch Order Status directly from Cashfree API
 */
export async function getCashfreeOrderStatus(orderId) {
  const config = getCashfreeConfig();

  if (!config.isConfigured) {
    if (config.env === 'sandbox' || process.env.NODE_ENV !== 'production') {
      return { order_status: 'PAID', order_id: orderId, simulated: true };
    }
    throw new Error('Cashfree Gateway credentials missing.');
  }

  const response = await fetch(`${config.baseUrl}/orders/${orderId}`, {
    method: 'GET',
    headers: {
      'x-client-id': config.appId,
      'x-client-secret': config.secretKey,
      'x-api-version': config.apiVersion
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error('[Cashfree Order Fetch Error]:', response.status, data);
    throw new Error(data.message || 'Failed to fetch order status from Cashfree');
  }

  return data;
}

/**
 * Verify Webhook Signature using HMAC-SHA256
 */
export function verifyCashfreeWebhookSignature({ rawBody, timestamp, signature }) {
  const config = getCashfreeConfig();
  const secret = config.webhookSecret || config.secretKey;

  if (!secret) return false;
  if (!timestamp || !signature || !rawBody) return false;

  // Timestamp freshness check: reject if older than 5 minutes
  const currentTime = Math.floor(Date.now() / 1000);
  const webhookTime = Number(timestamp);
  if (Math.abs(currentTime - webhookTime) > 300) {
    console.warn('[SECURITY] Cashfree Webhook timestamp skew exceeded 300s');
    return false;
  }

  try {
    const payload = `${timestamp}${rawBody}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('base64');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (err) {
    console.error('[Cashfree Webhook Signature Verification Error]:', err);
    return false;
  }
}
