import { findOrder, startConversion, settleVerifiedPayment } from '../../src/app/api/orders/financialSecurity.js';
import { createCashfreePgOrder, createCashfreeRefund, verifyCashfreeWebhookSignature, getCashfreeConfig } from '../../src/lib/cashfree.js';
import crypto from 'crypto';
import Order from '../models/Order.js';
import User from '../models/User.js';

// @desc    Generate Cashfree Payment Session
// @access  Private
export const generatePaymentSession = async (req, res, next) => {
 try {
  const order = await findOrder(req.body.orderId || req.body.dbOrderId);
  if (!order || String(order.user) !== String(req.user._id || req.user.id)) { res.status(403); throw new Error('Order unavailable'); }
  if (order.isPaid || ['Cancelled','Returned','Delivered'].includes(order.status)) throw new Error('Order cannot be paid');
  if (/cod|cash on delivery/i.test(order.paymentMethod)) return res.json(await startConversion(order));
  const base = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (!base || !/^https?:\/\//.test(base)) throw new Error('Payment return URL is not configured');
  if (!order.cfOrderId) throw new Error('Gateway order binding missing');
  const gateway = await createCashfreePgOrder({ orderId: order.cfOrderId, orderAmount: Number(order.totalPrice), customer: { id: String(order.user), phone: req.user.phone, email: req.user.email, name: req.user.firstName }, returnUrl: `${base.replace(/\/$/, '')}/checkout/return?order_id={order_id}`, notifyUrl: `${base.replace(/\/$/, '')}/api/payments/cashfree/webhook` });
  return res.json({ ...gateway, environment: getCashfreeConfig().env });
 } catch (error) { next(error); }
};

export const verifyPayment = async (req, res, next) => {
 try { const order = await findOrder(req.body.orderId || req.body.cfOrderId); if (!order || String(order.user) !== String(req.user._id || req.user.id)) { res.status(403); throw new Error('Order unavailable'); } await settleVerifiedPayment(String(order._id)); return res.json({ success: true, status: 'PAID' }); }
 catch (error) { res.status(400); next(error); }
};

export const processCashfreeRefund = async (cfOrderId, amount, refundId) => {
 if (!refundId) throw new Error('Persistent refund claim ID required');
 const result = await createCashfreeRefund({ orderId: cfOrderId, refundAmount: amount, refundId });
 return result.refund_status === 'SUCCESS';
};

export const fetchSavedCards = async (req, res, next) => {
  try {
    const appId = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;
    const isProd = process.env.CASHFREE_PROD === "true";

    if (!appId || !secretKey) {
      // Return simulated saved cards for local development without keys
      return res.json([
        {
          instrument_id: "simulated_inst_1",
          card_network: "visa",
          card_type: "credit_card",
          last4: "4242",
          card_bank_name: "HDFC Bank"
        },
        {
          instrument_id: "simulated_inst_2",
          card_network: "mastercard",
          card_type: "debit_card",
          last4: "8888",
          card_bank_name: "SBI"
        }
      ]);
    }

    const customerId = String(req.user._id || req.user.id);
    const url = isProd 
      ? `https://api.cashfree.com/pg/customers/${customerId}/instruments`
      : `https://sandbox.cashfree.com/pg/customers/${customerId}/instruments`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-client-id": appId,
        "x-client-secret": secretKey,
        "x-api-version": "2023-08-01"
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        // Customer not found means no saved cards yet
        return res.json([]);
      }
      const errText = await response.text();
      console.error("Cashfree Instruments API failed:", errText);
      return res.json([]); // Return empty array on error so UI doesnt break
    }

    const data = await response.json();
    
    // Cashfree returns an array of instruments
    if (data && Array.isArray(data)) {
      const cards = data.map(inst => ({
        instrument_id: inst.instrument_id,
        card_network: inst.instrument_display?.card_network || "unknown",
        card_type: inst.instrument_display?.card_type || "card",
        last4: inst.instrument_display?.card_number?.slice(-4) || "****",
        card_bank_name: inst.instrument_display?.card_bank_name || ""
      }));
      return res.json(cards);
    }
    
    res.json([]);
  } catch (error) {
    console.error("Cashfree Fetch Cards error:", error);
    res.json([]); // Fail silently for UX
  }
};

// @desc    Delete Cashfree Saved Card (Instrument)
// @route   DELETE /api/payment/saved-cards/:instrumentId
// @access  Private
export const deleteSavedCard = async (req, res, next) => {
  try {
    const { instrumentId } = req.params;
    
    const appId = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;
    const isProd = process.env.CASHFREE_PROD === 'true';

    if (!appId || !secretKey) {
      return res.json({ success: true, message: 'Simulated card deletion successful' });
    }

    const customerId = String(req.user._id || req.user.id);
    const url = isProd 
      ? `https://api.cashfree.com/pg/customers/${customerId}/instruments/${encodeURIComponent(instrumentId)}`
      : `https://sandbox.cashfree.com/pg/customers/${customerId}/instruments/${encodeURIComponent(instrumentId)}`;

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "x-client-id": appId,
        "x-client-secret": secretKey,
        "x-api-version": "2023-08-01"
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Cashfree Delete Card error:", errText);
      res.status(response.status);
      throw new Error('Failed to delete saved card from payment gateway');
    }

    res.json({ success: true, message: 'Card deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Handle Cashfree Webhook
// @route   POST /api/payment/webhook
// @access  Public
export const cashfreeWebhook = async (req, res, next) => {
 try {
  const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : typeof req.body === 'string' ? req.body : req.rawBody?.toString('utf8');
  if (!verifyCashfreeWebhookSignature({ rawBody, timestamp: req.headers['x-webhook-timestamp'], signature: req.headers['x-webhook-signature'] })) return res.status(401).json({ error: 'Invalid signature' });
  const payload = JSON.parse(rawBody); const id = payload.data?.order?.order_id;
  if (typeof id !== 'string' || id.length > 128) return res.status(400).json({ error: 'Invalid order ID' });
  if (payload.type !== 'PAYMENT_SUCCESS_WEBHOOK' && payload.data?.payment?.payment_status !== 'SUCCESS') return res.json({ status: 'IGNORED' });
  await settleVerifiedPayment(id); return res.json({ status: 'PROCESSED_SUCCESS' });
 } catch (error) { res.status(503); next(error); }
};
