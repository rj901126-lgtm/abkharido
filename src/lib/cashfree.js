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

  if (!config.isConfigured) throw new Error('Cashfree Gateway credentials missing.');

  if (!Number.isFinite(Number(orderAmount)) || Number(orderAmount) <= 0 || typeof orderId !== 'string') throw new Error('Invalid gateway order');
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

  if (data.order_id !== orderId || typeof data.payment_session_id !== 'string' || !data.payment_session_id) throw new Error('Invalid gateway session response');
  return {
    orderId: data.order_id,
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

  if (!config.isConfigured) throw new Error('Cashfree Gateway credentials missing.');

  const response = await fetch(`${config.baseUrl}/orders/${encodeURIComponent(orderId)}`, {
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
  const rawTime = Number(timestamp);
  const webhookTime = rawTime > 1e12 ? rawTime / 1000 : rawTime;
  if (!Number.isFinite(webhookTime) || Math.abs(currentTime - webhookTime) > 300) {
    console.warn('[SECURITY] Cashfree Webhook timestamp skew exceeded 300s');
    return false;
  }

  try {
    const payload = `${timestamp}${rawBody}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('base64');

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSignature);
    if (sigBuf.length !== expBuf.length) return false;

    return crypto.timingSafeEqual(sigBuf, expBuf);
  } catch (err) {
    console.error('[Cashfree Webhook Signature Verification Error]:', err);
    return false;
  }
}

/**
 * Initiate an Instant/Standard Refund via Cashfree Payment Gateway
 */
export async function createCashfreeRefund({ orderId, refundAmount, refundId, refundNote = 'Customer Return Refund' }) {
  const config = getCashfreeConfig();

  if (!config.isConfigured) throw new Error('Cashfree Gateway credentials missing.');

  const payload = {
    refund_amount: Number(refundAmount.toFixed(2)),
    refund_id: refundId || `ref_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    refund_note: refundNote,
    refund_speed: 'STANDARD'
  };

  const response = await fetch(`${config.baseUrl}/orders/${encodeURIComponent(orderId)}/refunds`, {
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
    console.error('[Cashfree Refund Error]:', response.status, data);
    throw new Error(data.message || data.error || 'Failed to initiate Cashfree refund');
  }

  return data;
}
