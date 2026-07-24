import nodemailer from 'nodemailer';

// Configure nodemailer transporter
// eslint-disable-next-line
const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  auth: {
    user: 'testuser@ethereal.email',
    pass: 'testpass'
  }
});

/**
 * Generate a beautifully formatted HTML invoice matching WorldClassInvoice exactly
 */
const generateHTMLInvoice = (order, user) => {
  const orderIdStr = (order.id || order._id || '0').toString();
  const dateStr = order.date || order.createdAt || new Date().toISOString();
  
  const displayDate = new Date(dateStr).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute:'2-digit'
  });

  const address = order.shippingAddress || {};
  const customerName = address.name || order.customerUsername || user.fullName || user.username || 'Guest User';
  const phone = address.phone || user.phone || 'N/A';
  
  const paymentMethod = order.paymentMethod || 'N/A';
  const isCod = paymentMethod === 'Cash on Delivery';

  const itemsArr = order.items || order.orderItems || [];
  
  // eslint-disable-next-line
  const itemsHtml = itemsArr.map((item, idx) => {
    const name = item.product?.name || item.name || 'Unknown Product';
    const sku = item.product?.id || item.product || 'N/A';
    const qty = item.quantity || item.qty || 1;
    const price = item.product?.price || item.price || 0;
    const total = price * qty;
    
    return `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 16px 12px; font-size: 13px; color: #1e293b;">
          <div style="font-weight: 600;">${name}</div>
          <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">SKU: ${sku}</div>
        </td>
        <td style="padding: 16px 12px; font-size: 13px; color: #1e293b; text-align: center;">${qty}</td>
        <td style="padding: 16px 12px; font-size: 13px; color: #1e293b; text-align: right;">₹${price.toLocaleString('en-IN')}</td>
        <td style="padding: 16px 12px; font-size: 14px; color: #0f172a; text-align: right; font-weight: 600;">
          ₹${total.toLocaleString('en-IN')}
        </td>
      </tr>
    `;
  }).join('');

  let calcItemsPrice = order.itemsPrice || 0;
  if (calcItemsPrice === 0) {
    calcItemsPrice = itemsArr.reduce((acc, item) => {
      const price = item.product?.price || item.price || 0;
      const qty = item.quantity || item.qty || 1;
      return acc + (price * qty);
    }, 0);
  }
  
  const deliveryCharge = order.deliveryCharge || order.shippingPrice || (calcItemsPrice > 500 ? 0 : 40);
  const coinsDiscount = order.coinsDiscountValue || order.coinsDiscount || 0;
  const couponDiscountAmount = order.couponDiscountAmount || 0;
  const finalAmount = order.finalAmount || order.totalPrice || (calcItemsPrice - coinsDiscount - couponDiscountAmount + deliveryCharge);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice for Order #${orderIdStr}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Inter:wght@400;600;700;800;900&display=swap');
      </style>
    </head>
    <body style="margin: 0; padding: 40px 20px; background-color: #e2e8f0;">
      
      <div style="width: 210mm; min-height: 297mm; margin: 0 auto; padding: 20mm; background-color: #ffffff; color: #1e293b; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; box-sizing: border-box; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
        
        <!-- Header -->
        <table style="width: 100%; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 30px;" cellpadding="0" cellspacing="0">
          <tr>
            <td style="vertical-align: top;">
              <div style="font-size: 28px; font-weight: 900; color: #4f46e5; letter-spacing: -0.5px;">AbKharido</div>
              <div style="font-size: 12px; color: #64748b; margin-top: 4px;">
                Your Premium E-Commerce Partner<br />
                GSTIN: 22AAAAA0000A1Z5<br />
                support@abkharido.com
              </div>
            </td>
            <td style="text-align: right; vertical-align: top;">
              <div style="font-size: 36px; font-weight: 800; color: #e2e8f0; text-transform: uppercase; letter-spacing: 2px;">INVOICE</div>
              <div style="font-size: 14px; font-weight: 600; margin-top: 8px;">INV-${orderIdStr.padStart(8, '0').toUpperCase()}</div>
              <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Date: ${displayDate}</div>
            </td>
          </tr>
        </table>

        <!-- Addresses -->
        <table style="width: 100%; margin-bottom: 40px;" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width: 50%; vertical-align: top;">
              <div style="font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Billed To</div>
              <div style="font-size: 14px; font-weight: 700; color: #0f172a;">${customerName}</div>
              <div style="font-size: 13px; color: #475569; margin-top: 4px; line-height: 1.5; max-width: 250px;">
                ${address.streetAddress || 'Address not provided'},<br />
                ${address.locality ? address.locality + ', ' : ''}${address.city || ''},<br />
                ${address.state || ''} ${address.pincode ? '- ' + address.pincode : ''}<br />
                Phone: ${phone}
              </div>
            </td>
            <td style="width: 50%; text-align: right; vertical-align: top;">
              <div style="font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Payment Status</div>
              ${!isCod 
                ? `<div style="display: inline-block; padding: 6px 12px; background: #dcfce7; color: #166534; border-radius: 4px; font-weight: 700; font-size: 13px;">PAID - ${paymentMethod}</div>`
                : `<div style="display: inline-block; padding: 6px 12px; background: #fef3c7; color: #92400e; border-radius: 4px; font-weight: 700; font-size: 13px;">PENDING (CASH ON DELIVERY)</div>`
              }
            </td>
          </tr>
        </table>

        <!-- Items Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr>
              <th style="text-align: left; padding: 12px; background: #f8fafc; color: #475569; font-size: 12px; font-weight: 700; text-transform: uppercase; border-radius: 6px 0 0 6px;">Item Description</th>
              <th style="text-align: center; padding: 12px; background: #f8fafc; color: #475569; font-size: 12px; font-weight: 700; text-transform: uppercase;">Qty</th>
              <th style="text-align: right; padding: 12px; background: #f8fafc; color: #475569; font-size: 12px; font-weight: 700; text-transform: uppercase;">Rate</th>
              <th style="text-align: right; padding: 12px; background: #f8fafc; color: #475569; font-size: 12px; font-weight: 700; text-transform: uppercase; border-radius: 0 6px 6px 0;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <!-- Totals Section -->
        <table style="width: 100%; margin-bottom: 50px;" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width: 50%;"></td>
            <td style="width: 50%; vertical-align: top;">
              <table style="width: 100%;" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 8px 0; font-size: 13px; color: #475569;">Subtotal</td>
                  <td style="padding: 8px 0; font-size: 13px; color: #475569; text-align: right;">₹${calcItemsPrice.toLocaleString('en-IN')}</td>
                </tr>
                ${coinsDiscount > 0 ? `
                <tr>
                  <td style="padding: 8px 0; font-size: 13px; color: #16a34a;">Coins Redeemed</td>
                  <td style="padding: 8px 0; font-size: 13px; color: #16a34a; text-align: right;">- ₹${coinsDiscount.toLocaleString('en-IN')}</td>
                </tr>` : ''}
                ${couponDiscountAmount > 0 ? `
                <tr>
                  <td style="padding: 8px 0; font-size: 13px; color: #16a34a;">Coupon Discount</td>
                  <td style="padding: 8px 0; font-size: 13px; color: #16a34a; text-align: right;">- ₹${couponDiscountAmount.toLocaleString('en-IN')}</td>
                </tr>` : ''}
                <tr>
                  <td style="padding: 8px 0 12px 0; font-size: 13px; color: #475569; border-bottom: 1px solid #f1f5f9;">Delivery Charges</td>
                  <td style="padding: 8px 0 12px 0; font-size: 13px; color: #475569; text-align: right; border-bottom: 1px solid #f1f5f9;">${deliveryCharge > 0 ? '₹' + deliveryCharge : 'Free'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 18px; font-weight: 800; color: #0f172a;">Total Payable</td>
                  <td style="padding: 8px 0; font-size: 18px; font-weight: 800; color: #4f46e5; text-align: right;">₹${finalAmount.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td colspan="2" style="text-align: right; font-size: 10px; color: #94a3b8; padding-top: 4px;">Includes all applicable taxes</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <div style="border-top: 1px solid #f1f5f9; padding-top: 24px; text-align: center;">
          <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 8px;">
            Thank you for shopping with us!
          </div>
          <div style="font-size: 12px; color: #64748b;">
            If you have any questions concerning this invoice, please contact support@abkharido.com.
          </div>
        </div>

        <!-- Authorized Signatory -->
        <div style="margin-top: 40px; text-align: right; padding-right: 20px;">
          <div style="font-size: 16px; font-family: 'Dancing Script', cursive, serif; color: #4f46e5; margin-bottom: 4px;">
            AbKharido Auto
          </div>
          <div style="font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; display: inline-block; padding-top: 4px; width: 150px; text-align: center;">
            Authorized Signatory
          </div>
        </div>

      </div>
    </body>
    </html>
  `;
};

/**
 * Send invoice email
 */
export const sendInvoiceEmail = async (order, user) => {
  try {
    if (!user || !user.email) {
      console.log('No email address provided for user:', user?.username);
      return false;
    }

    if (!user.isEmailVerified) {
      console.log(`Skipping invoice email for ${user.email} because email is not verified.`);
      return false;
    }

    // eslint-disable-next-line
    const htmlContent = generateHTMLInvoice(order, user);

    console.log(`[Email Service] Simulating sending invoice to: ${user.email} for order #${order.id || order._id}`);
    
    // In a real environment with credentials, we would call:
    // await transporter.sendMail({
    //   from: '"AbKharido" <noreply@abkharido.com>',
    //   to: user.email,
    //   subject: `Invoice for your order #${order.id || order._id}`,
    //   html: htmlContent
    // });

    return true;
  } catch (error) {
    console.error('Error sending invoice email:', error);
    return false;
  }
};

/**
 * Generic send email wrapper
 */
export const sendEmail = async (to, subject, htmlContent) => {
  try {
    console.log(`[Email Service] Simulating sending email to: ${to} - Subject: ${subject}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

