import mongoose from 'mongoose';
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
    
    const appId = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;
    const isProd = process.env.CASHFREE_PROD === 'true';

    let orderStatus = 'PAID'; // Default to simulated success

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
    }

      if (orderStatus === 'PAID') {
        const query = { cfOrderId: orderId };
        if (mongoose.Types.ObjectId.isValid(orderId)) {
          query.$or = [{ _id: orderId }, { cfOrderId: orderId }];
        }

        const order = await Order.findOne(query);
        if (order) {
          order.isPaid = true;
          order.paidAt = new Date();
          order.status = 'Processing';
          await order.save();

          const user = await User.findById(order.user);
          if (user) {
            const cashback = Math.floor(order.totalPrice * 0.05);
            user.coins = (user.coins || 0) + cashback;
            await user.save();
          }
        }

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

