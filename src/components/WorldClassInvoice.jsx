import React, { forwardRef, useImperativeHandle } from 'react';

const WorldClassInvoice = forwardRef(({ order, onGenerated }, ref) => {
  useImperativeHandle(ref, () => ({
    generatePDF: async () => {
      if (!order) return;
      const elementId = `invoice-capture-area-${order.id || order._id || '0'}`;
      const element = document.getElementById(elementId);
      if (!element) return;

      const opt = {
        margin:       [10, 10, 10, 10], // top, left, bottom, right
        filename:     `Invoice_${order.cfOrderId || order.orderId || order.id || order._id || 'AK-2026'}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      // Ensure the element is temporarily visible for rendering
      element.style.display = 'block';
      try {
        const html2pdf = (await import('html2pdf.js')).default;
        await html2pdf().from(element).set(opt).save();
      } finally {
        element.style.display = 'none'; // hide it back
        if (onGenerated) onGenerated();
      }
    }
  }));

  if (!order) return null;

  const itemsPrice = order.itemsPrice || (order.items || []).reduce((acc, item) => acc + (item.product?.price || item.price || 0) * (item.quantity || item.qty || 1), 0);
  const coinsDiscount = order.coinsDiscountValue || order.coinsDiscount || 0;
  const couponDiscountAmount = order.couponDiscountAmount || 0;
  const deliveryCharge = order.deliveryCharge || order.shippingPrice || (itemsPrice > 500 ? 0 : 40);
  const finalAmount = order.finalAmount || order.totalPrice || (itemsPrice - coinsDiscount - couponDiscountAmount + deliveryCharge);

  
  const formatDate = (dateStr) => {
    if (!dateStr) return new Date().toLocaleString('en-IN');
    return new Date(dateStr).toLocaleString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute:'2-digit'
    });
  };

  return (
    <div style={{ display: 'none' }}>
      <div 
        id={`invoice-capture-area-${order.id || order._id || '0'}`} 
        style={{
          width: '210mm',
          minHeight: '297mm',
          padding: '20mm',
          backgroundColor: '#ffffff',
          color: '#1e293b',
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          boxSizing: 'border-box'
        }}
      >
        {/* Header Table */}
        <table style={{ width: '100%', borderBottom: '2px solid #f1f5f9', paddingBottom: '20px', marginBottom: '30px' }} cellPadding="0" cellSpacing="0">
          <tbody>
            <tr>
              <td style={{ verticalAlign: 'top' }}>
                <div style={{ fontSize: '28px', fontWeight: '900', color: '#4f46e5', letterSpacing: '-0.5px' }}>AbKharido</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  Your Premium E-Commerce Partner<br />
                  GSTIN: 22AAAAA0000A1Z5<br />
                  support@abkharido.com
                </div>
              </td>
              <td style={{ textAlign: 'right', verticalAlign: 'top' }}>
                <div style={{ fontSize: '36px', fontWeight: '800', color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: '2px' }}>INVOICE</div>
                <div style={{ fontSize: '14px', fontWeight: '600', marginTop: '8px' }}>INV-{(order.id || order._id || '0').toString().padStart(8, '0').toUpperCase()}</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Date: {formatDate(order.date || order.createdAt)}</div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Addresses Table */}
        <table style={{ width: '100%', marginBottom: '40px' }} cellPadding="0" cellSpacing="0">
          <tbody>
            <tr>
              <td style={{ width: '50%', verticalAlign: 'top' }}>
                <div style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Billed To</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{order.shippingAddress?.name || order.customerUsername || order.user?.email || 'Guest User'}</div>
                <div style={{ fontSize: '13px', color: '#475569', marginTop: '4px', lineHeight: '1.5', maxWidth: '250px' }}>
                  {order.shippingAddress?.streetAddress || 'Address not provided'},<br />
                  {order.shippingAddress?.locality ? `${order.shippingAddress.locality}, ` : ''}{order.shippingAddress?.city || ''},<br />
                  {order.shippingAddress?.state || ''} {order.shippingAddress?.pincode ? `- ${order.shippingAddress.pincode}` : ''}<br />
                  Phone: {order.shippingAddress?.phone || order.user?.phone || 'N/A'}
                </div>
              </td>
              <td style={{ width: '50%', textAlign: 'right', verticalAlign: 'top' }}>
                <div style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Payment Status</div>
                {order.paymentMethod !== 'Cash on Delivery' ? (
                  <div style={{ display: 'inline-block', padding: '6px 12px', background: '#dcfce7', color: '#166534', borderRadius: '4px', fontWeight: '700', fontSize: '13px' }}>
                    PAID - {order.paymentMethod}
                  </div>
                ) : (
                  <div style={{ display: 'inline-block', padding: '6px 12px', background: '#fef3c7', color: '#92400e', borderRadius: '4px', fontWeight: '700', fontSize: '13px' }}>
                    PENDING (CASH ON DELIVERY)
                  </div>
                )}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Items Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '12px', background: '#f8fafc', color: '#475569', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', borderTopLeftRadius: '6px', borderBottomLeftRadius: '6px' }}>Item Description</th>
              <th style={{ textAlign: 'center', padding: '12px', background: '#f8fafc', color: '#475569', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Qty</th>
              <th style={{ textAlign: 'right', padding: '12px', background: '#f8fafc', color: '#475569', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Rate</th>
              <th style={{ textAlign: 'right', padding: '12px', background: '#f8fafc', color: '#475569', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', borderTopRightRadius: '6px', borderBottomRightRadius: '6px' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {(order.items || []).map((item, idx) => {
              const name = item.product?.name || item.name || 'Unknown Product';
              const sku = item.product?.id || item.product || item.id || 'N/A';
              const qty = item.quantity || item.qty || 1;
              const price = item.product?.price || item.price || 0;
              const total = price * qty;

              return (
                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px 12px', fontSize: '13px', color: '#1e293b' }}>
                    <div style={{ fontWeight: '600' }}>{name}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>SKU: {sku}</div>
                  </td>
                  <td style={{ padding: '16px 12px', fontSize: '13px', color: '#1e293b', textAlign: 'center' }}>{qty}</td>
                  <td style={{ padding: '16px 12px', fontSize: '13px', color: '#1e293b', textAlign: 'right' }}>₹{price.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '16px 12px', fontSize: '14px', color: '#0f172a', textAlign: 'right', fontWeight: '600' }}>
                    ₹{total.toLocaleString('en-IN')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Totals Section Table */}
        <table style={{ width: '100%', marginBottom: '50px' }} cellPadding="0" cellSpacing="0">
          <tbody>
            <tr>
              <td style={{ width: '50%' }}></td>
              <td style={{ width: '50%', verticalAlign: 'top' }}>
                <table style={{ width: '100%' }} cellPadding="0" cellSpacing="0">
                  <tbody>
                    <tr>
                      <td style={{ padding: '8px 0', fontSize: '13px', color: '#475569' }}>Subtotal</td>
                      <td style={{ padding: '8px 0', fontSize: '13px', color: '#475569', textAlign: 'right' }}>₹{itemsPrice.toLocaleString('en-IN')}</td>
                    </tr>
                    {coinsDiscount > 0 && (
                      <tr>
                        <td style={{ padding: '8px 0', fontSize: '13px', color: '#16a34a' }}>Coins Redeemed</td>
                        <td style={{ padding: '8px 0', fontSize: '13px', color: '#16a34a', textAlign: 'right' }}>- ₹{coinsDiscount.toLocaleString('en-IN')}</td>
                      </tr>
                    )}
                    {couponDiscountAmount > 0 && (
                      <tr>
                        <td style={{ padding: '8px 0', fontSize: '13px', color: '#16a34a' }}>Coupon Discount</td>
                        <td style={{ padding: '8px 0', fontSize: '13px', color: '#16a34a', textAlign: 'right' }}>- ₹{couponDiscountAmount.toLocaleString('en-IN')}</td>
                      </tr>
                    )}
                    <tr>
                      <td style={{ padding: '8px 0 12px 0', fontSize: '13px', color: '#475569', borderBottom: '1px solid #f1f5f9' }}>Delivery Charges</td>
                      <td style={{ padding: '8px 0 12px 0', fontSize: '13px', color: '#475569', textAlign: 'right', borderBottom: '1px solid #f1f5f9' }}>{deliveryCharge > 0 ? `₹${deliveryCharge}` : 'Free'}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px 0', fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>Total Payable</td>
                      <td style={{ padding: '8px 0', fontSize: '18px', fontWeight: '800', color: '#4f46e5', textAlign: 'right' }}>₹{finalAmount.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td colSpan="2" style={{ textAlign: 'right', fontSize: '10px', color: '#94a3b8', paddingTop: '4px' }}>Includes all applicable taxes</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
            Thank you for shopping with us!
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            If you have any questions concerning this invoice, please contact support@abkharido.com.
          </div>
        </div>

        {/* Authorized Signatory */}
        <div style={{ marginTop: '40px', textAlign: 'right', paddingRight: '20px' }}>
          <div style={{ fontSize: '16px', fontFamily: '"Dancing Script", cursive, serif', color: '#4f46e5', marginBottom: '4px' }}>
            AbKharido Auto
          </div>
          <div style={{ fontSize: '10px', color: '#94a3b8', borderTop: '1px solid #e2e8f0', display: 'inline-block', paddingTop: '4px', width: '150px', textAlign: 'center' }}>
            Authorized Signatory
          </div>
        </div>

      </div>
    </div>
  );
});

WorldClassInvoice.displayName = 'WorldClassInvoice';
export default WorldClassInvoice;
