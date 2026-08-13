import crypto from 'crypto';
import Order from '../models/Order.js';
import User from '../models/User.js';

// @desc    Generate Cashfree Payment Session
// @access  Private
export const generatePaymentSession = async (req, res, next) => {
  try {
    const { amount, customerId, customerPhone, customerEmail } = req.body;

    const appId = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;
    const isProd = process.env.CASHFREE_PROD === 'true';

    if (!appId || !secretKey) {
      // Return a simulated success for local development without keys
      console.warn('Cashfree keys missing. Returning simulated session.');
      return res.json({ paymentSessionId: 'simulated_session_123', orderId: `cf_order_${Date.now()}`, simulated: true });
    }

    const url = isProd 
      ? 'https://api.cashfree.com/pg/orders' 
      : 'https://sandbox.cashfree.com/pg/orders';

    const orderId = `cf_order_${Date.now()}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': appId,
        'x-client-secret': secretKey,
        'x-api-version': '2023-08-01'
      },
      body: JSON.stringify({
        order_amount: Math.max(1, amount || 1),
        order_currency: 'INR',
        order_id: orderId,
        customer_details: {
          customer_id: (customerId && customerId.replace(/[^a-zA-Z0-9_-]/g, '')) || `guest_${Date.now()}`,
          customer_phone: (customerPhone && customerPhone.length >= 10) ? customerPhone : '9999999999',
          customer_email: customerEmail || 'customer@example.com'
        },
        order_meta: {
          return_url: `${req.headers.origin || (req.headers.referer ? new URL(req.headers.referer).origin : 'https://abkharido.vercel.app')}/checkout?order_id={order_id}`
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Cashfree order request failed:', errText);
      res.status(response.status);
      throw new Error('Payment gateway API error');
    }

    const data = await response.json();
    res.json({ paymentSessionId: data.payment_session_id, orderId: orderId, simulated: false });
  } catch (error) {
    console.error('Cashfree PG connection error:', error);
    next(error);
  }
};

// @desc    Verify Cashfree Payment Status
// @route   POST /api/payment/verify
// @access  Private
export const verifyPayment = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      res.status(400);
      throw new Error('orderId is required');
    }
    
    const appId = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;
    const isProd = process.env.CASHFREE_PROD === 'true';

    let orderStatus = 'PAID'; // Default to simulated success
    let amountPaid = 0;

    if (appId && secretKey) {
      const url = isProd 
        ? `https://api.cashfree.com/pg/orders/${orderId}`
        : `https://sandbox.cashfree.com/pg/orders/${orderId}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-client-id': appId,
          'x-client-secret': secretKey,
          'x-api-version': '2023-08-01'
        }
      });

      if (!response.ok) {
        res.status(response.status);
        throw new Error('Failed to verify payment with Cashfree');
      }

      const data = await response.json();
      orderStatus = data.order_status;
      amountPaid = data.order_amount;
    }

    if (orderStatus === 'PAID') {
      // Fetch the order first to verify the amount
      const pendingOrder = await Order.findOne({ cfOrderId: orderId, isPaid: false });

      if (!pendingOrder) {
        // Either order not found OR already paid by another concurrent request — both safe
        const alreadyPaid = await Order.findOne({ cfOrderId: orderId, isPaid: true });
        if (alreadyPaid) {
          return res.json({ success: true, status: 'PAID', alreadyProcessed: true });
        }
        res.status(404);
        throw new Error('Order not found for payment verification');
      }

      // ── CRITICAL PAYMENT AMOUNT VERIFICATION GUARD ──
      // Prevent arbitrary amount bypass (e.g. paying ₹1 for a ₹10,000 order)
      if (appId && secretKey && Math.abs(pendingOrder.totalPrice - amountPaid) > 0.1) {
        res.status(400);
        throw new Error(`Amount mismatch bypass attempt. Order total: ₹${pendingOrder.totalPrice}, Paid: ₹${amountPaid}`);
      }

      // ── ATOMIC IDEMPOTENCY GUARD (Bug 2: Webhook + Frontend Race Condition) ──
      // findOneAndUpdate with { isPaid: false } is a single atomic DB operation.
      const order = await Order.findOneAndUpdate(
        { _id: pendingOrder._id, isPaid: false }, // Condition: only match unpaid orders
        { $set: { isPaid: true, paidAt: new Date(), status: 'Processing' } },
        { new: true }
      );

      if (!order) {
        // Race condition lost to another concurrent request — safe to return early
        return res.json({ success: true, status: 'PAID', alreadyProcessed: true });
      }

      // Award cashback coins only once — atomic guard above prevents double-award.
      // Bug 4 fix: use walletCoins (not the ghost field `coins`)
      await User.updateOne(
        { _id: order.user },
        { $inc: { walletCoins: Math.floor(order.totalPrice * 0.05) } }
      );

      res.json({ success: true, status: orderStatus });
    } else {
      res.status(400);
      throw new Error(`Payment verification failed: ${orderStatus}`);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Process a Refund via Cashfree API
 * @param {string} cfOrderId - The Cashfree Order ID
 * @param {number} amount - The amount to refund
 * @returns {Promise<boolean>} - Returns true if refund was successfully initiated
 */
export const processCashfreeRefund = async (cfOrderId, amount) => {
  try {
    const appId = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;
    const isProd = process.env.CASHFREE_PROD === 'true';

    if (!appId || !secretKey) {
      console.warn('Cashfree keys missing. Simulating bank refund success for local dev.');
      return true; // Simulate success if keys are missing
    }

    const url = isProd 
      ? `https://api.cashfree.com/pg/orders/${cfOrderId}/refunds`
      : `https://sandbox.cashfree.com/pg/orders/${cfOrderId}/refunds`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': appId,
        'x-client-secret': secretKey,
        'x-api-version': '2023-08-01'
      },
      body: JSON.stringify({
        refund_amount: amount,
        refund_id: `refund_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        refund_note: 'Order Cancelled'
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Cashfree Refund API failed:', errText);
      return false;
    }

    return true; // Refund initiated successfully
  } catch (error) {
    console.error('Cashfree Refund API connection error:', error);
    return false;
  }
};


// @desc    Fetch Saved Cards (Token Vault) from Cashfree
// @route   GET /api/payment/saved-cards
// @access  Private
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

    const customerId = (req.user.username && req.user.username.replace(/[^a-zA-Z0-9_-]/g, "")) || `guest_${Date.now()}`;
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

    const customerId = (req.user.username && req.user.username.replace(/[^a-zA-Z0-9_-]/g, "")) || `guest_${Date.now()}`;
    const url = isProd 
      ? `https://api.cashfree.com/pg/customers/${customerId}/instruments/${instrumentId}`
      : `https://sandbox.cashfree.com/pg/customers/${customerId}/instruments/${instrumentId}`;

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
    const signature = req.headers['x-webhook-signature'];
    const timestamp = req.headers['x-webhook-timestamp'];
    
    if (!signature || !timestamp) {
      return res.status(400).json({ error: 'Missing webhook security headers' });
    }

    // 1. Replay Attack Prevention (5 minute window)
    const currentTime = Math.floor(Date.now() / 1000);
    const timeDiff = currentTime - parseInt(timestamp, 10) / 1000;
    if (timeDiff > 300 || timeDiff < -300) {
      return res.status(400).json({ error: 'Webhook timestamp invalid (possible replay attack)' });
    }

    // 2. Cryptographic Signature Verification
    const secretKey = process.env.CASHFREE_SECRET_KEY;
    if (!secretKey) {
      console.warn('Webhook received but CASHFREE_SECRET_KEY is not set');
      return res.status(200).send('OK'); // Return 200 so CF stops retrying
    }

    const payload = timestamp + req.rawBody; // Note: req.rawBody was captured in app.js
    const generatedSignature = crypto.createHmac('sha256', secretKey).update(payload).digest('base64');
    
    if (generatedSignature !== signature) {
      console.error('Webhook signature mismatch!');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Payload is cryptographically secure, now parse it
    const event = req.body;

    if (event.type === 'PAYMENT_SUCCESS_WEBHOOK') {
      const orderId = event.data?.order?.order_id;
      if (!orderId) return res.status(400).json({ error: 'Order ID missing in payload' });

      // Fetch absolute truth from Cashfree (Zero Trust — never trust webhook payload alone)
      const appId = process.env.CASHFREE_APP_ID;
      const isProd = process.env.CASHFREE_PROD === 'true';
      const url = isProd 
        ? `https://api.cashfree.com/pg/orders/${orderId}`
        : `https://sandbox.cashfree.com/pg/orders/${orderId}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-client-id': appId,
          'x-client-secret': secretKey,
          'x-api-version': '2023-08-01'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch real status from Cashfree');
      }
      const data = await response.json();
      
      if (data.order_status === 'PAID') {
        // ── ATOMIC IDEMPOTENCY GUARD (Bug 2: Webhook Replay / Race Condition) ──
        // This single atomic operation replaces the old 2-step read-then-write.
        // If Cashfree sends the webhook twice (network timeout retry), or if the
        // frontend's verifyPayment fires at the same time, only ONE request will
        // match { isPaid: false } and proceed. The other gets null and returns 200 safely.
        const order = await Order.findOneAndUpdate(
          { cfOrderId: orderId, isPaid: false }, // Condition: only match still-unpaid orders
          { $set: { isPaid: true, paidAt: new Date(), status: 'Processing' } },
          { new: true }
        );

        if (!order) {
          // Already processed by a previous webhook or verifyPayment — idempotent success
          return res.status(200).send('Already processed');
        }

        // Award cashback — atomic guard above ensures this runs exactly once.
        // Bug 4 fix: use walletCoins (not the ghost field `coins` which nobody reads)
        await User.updateOne(
          { _id: order.user },
          { $inc: { walletCoins: Math.floor(order.totalPrice * 0.05) } }
        );
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Cashfree Webhook error:', error);
    // Don't leak error stack to public webhook response
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};


