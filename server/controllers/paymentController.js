// @desc    Generate Cashfree Payment Session
// @route   POST /api/payment/session
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
        order_amount: amount,
        order_currency: 'INR',
        order_id: orderId,
        customer_details: {
          customer_id: customerId,
          customer_phone: customerPhone,
          customer_email: customerEmail || 'customer@example.com'
        },
        order_meta: {
          return_url: `${req.headers.origin}/checkout?order_id={order_id}`
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
      res.json({ success: true, status: orderStatus });
    } else {
      res.status(400);
      throw new Error(`Payment verification failed: ${orderStatus}`);
    }
  } catch (error) {
    next(error);
  }
};
