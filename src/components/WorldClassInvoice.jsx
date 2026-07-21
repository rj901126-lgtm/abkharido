import React, { forwardRef, useImperativeHandle } from 'react';
import html2pdf from 'html2pdf.js';

const WorldClassInvoice = forwardRef(({ order, onGenerated }, ref) => {
  useImperativeHandle(ref, () => ({
    generatePDF: async () => {
      if (!order) return;
      const element = document.getElementById(`invoice-capture-area-${order.id}`);
      if (!element) return;

      const opt = {
        margin:       [10, 10, 10, 10], // top, left, bottom, right
        filename:     `Invoice_${order.id}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      // Ensure the element is temporarily visible for rendering
      element.style.display = 'block';
      try {
        await html2pdf().from(element).set(opt).save();
      } finally {
        element.style.display = 'none'; // hide it back
        if (onGenerated) onGenerated();
      }
    }
  }));

  if (!order) return null;

  const itemsPrice = order.items.reduce((acc, item) => acc + (item.product?.price || 0) * (item.quantity || 1), 0);
  const coinsDiscount = order.coinsDiscount || 0;
  const couponDiscountAmount = order.couponDiscountAmount || 0;
  const deliveryCharge = order.deliveryCharge || (itemsPrice > 500 ? 0 : 40);
  const finalAmount = order.finalAmount || (itemsPrice - coinsDiscount - couponDiscountAmount + deliveryCharge);
  
  const formatDate = (dateStr) => {
    if (!dateStr) return new Date().toLocaleDateString('en-IN');
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute:'2-digit'
    });
  };

  return (
    <div style={{ display: 'none' }}>
      <div 
        id={`invoice-capture-area-${order.id}`} 
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
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #f1f5f9', paddingBottom: '20px', marginBottom: '30px' }}>
          <div>
            <div style={{ fontSize: '28px', fontWeight: '900', color: '#4f46e5', letterSpacing: '-0.5px' }}>
              AbKharido
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              Your Premium E-Commerce Partner<br />
              GSTIN: 22AAAAA0000A1Z5<br />
              support@abkharido.com
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '36px', fontWeight: '800', color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: '2px' }}>
              INVOICE
            </div>
            <div style={{ fontSize: '14px', fontWeight: '600', marginTop: '8px' }}>
              INV-{order.id.toString().padStart(8, '0').toUpperCase()}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              Date: {formatDate(order.createdAt)}
            </div>
          </div>
        </div>

        {/* Addresses */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
              Billed To
            </div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{order.shippingAddress.name}</div>
            <div style={{ fontSize: '13px', color: '#475569', marginTop: '4px', lineHeight: '1.5', maxWidth: '250px' }}>
              {order.shippingAddress.streetAddress},<br />
              {order.shippingAddress.locality}, {order.shippingAddress.city},<br />
              {order.shippingAddress.state} - {order.shippingAddress.pincode}<br />
              Phone: {order.shippingAddress.phone}
            </div>
          </div>
          
          <div style={{ flex: 1, textAlign: 'right' }}>
            <div style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
              Payment Status
            </div>
            {order.paymentMethod !== 'Cash on Delivery' ? (
              <div style={{ display: 'inline-block', padding: '6px 12px', background: '#dcfce7', color: '#166534', borderRadius: '4px', fontWeight: '700', fontSize: '13px' }}>
                PAID - {order.paymentMethod}
              </div>
            ) : (
              <div style={{ display: 'inline-block', padding: '6px 12px', background: '#fef3c7', color: '#92400e', borderRadius: '4px', fontWeight: '700', fontSize: '13px' }}>
                PENDING (CASH ON DELIVERY)
              </div>
            )}
          </div>
        </div>

        {/* Table */}
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
            {order.items.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '16px 12px', fontSize: '13px', color: '#1e293b' }}>
                  <div style={{ fontWeight: '600' }}>{item.product?.name || 'Unknown Product'}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>SKU: {item.product?.id || 'N/A'}</div>
                </td>
                <td style={{ padding: '16px 12px', fontSize: '13px', color: '#1e293b', textAlign: 'center' }}>{item.quantity}</td>
                <td style={{ padding: '16px 12px', fontSize: '13px', color: '#1e293b', textAlign: 'right' }}>₹{(item.product?.price || 0).toLocaleString('en-IN')}</td>
                <td style={{ padding: '16px 12px', fontSize: '14px', color: '#0f172a', textAlign: 'right', fontWeight: '600' }}>
                  ₹{((item.product?.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals Section */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '50px' }}>
          <div style={{ width: '300px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '13px', color: '#475569' }}>
              <span>Subtotal</span>
              <span>₹{itemsPrice.toLocaleString('en-IN')}</span>
            </div>
            
            {coinsDiscount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '13px', color: '#16a34a' }}>
                <span>Coins Redeemed</span>
                <span>- ₹{coinsDiscount.toLocaleString('en-IN')}</span>
              </div>
            )}
            
            {couponDiscountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '13px', color: '#16a34a' }}>
                <span>Coupon Discount</span>
                <span>- ₹{couponDiscountAmount.toLocaleString('en-IN')}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '13px', color: '#475569', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '12px' }}>
              <span>Delivery Charges</span>
              <span>{deliveryCharge > 0 ? `₹${deliveryCharge}` : 'Free'}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
              <span>Total Payable</span>
              <span style={{ color: '#4f46e5' }}>₹{finalAmount.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ textAlign: 'right', fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
              Includes all applicable taxes
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
            Thank you for shopping with us!
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            If you have any questions concerning this invoice, please contact support@abkharido.com.
          </div>
        </div>

        {/* Authorized Signatory (Optional UI element to make it look official) */}
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
