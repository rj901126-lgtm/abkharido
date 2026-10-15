import React, { forwardRef, useImperativeHandle } from 'react';

const WorldClassInvoice = forwardRef(({ order, seller = null, isVisible = false, onGenerated }, ref) => {
  if (!order) return null;

  // ─── CANCELLATION & CREDIT STATUS ──────────────────────────────────
  const isCancelled = ['CANCELLED', 'Cancelled', 'cancelled'].includes(String(order.status || '')) || Boolean(order.isCancelled) || Boolean(order.cancellationSettled);
  const cancellationDate = order.cancellationDate || order.trackingHistory?.find(t => ['CANCELLED', 'Cancelled', 'cancelled'].includes(t.status))?.timestamp || order.updatedAt;
  const cancellationReason = order.cancellationReason || order.trackingHistory?.find(t => ['CANCELLED', 'Cancelled', 'cancelled'].includes(t.status))?.comment || 'Order Cancelled';

  // ─── SELLER COMPLIANCE DETECTION: GST vs NON-GST (BILL OF SUPPLY) ─────
  const sellerInfo = seller || order.seller || {};
  const sellerGstin = sellerInfo.gstin || order.orderItems?.[0]?.sellerGstin || '';
  const sellerType = sellerInfo.sellerType || (sellerGstin ? 'gst' : 'non_gst');
  const isGstSeller = sellerType === 'gst' && Boolean(sellerGstin);
  const isBillOfSupply = !isGstSeller;

  useImperativeHandle(ref, () => ({
    generatePDF: async () => {
      if (!order) return;
      const elementId = `invoice-capture-area-${order.id || order._id || '0'}`;
      const element = document.getElementById(elementId);
      if (!element) return;

      const opt = {
        margin:       [8, 8, 8, 8],
        filename:     `${isCancelled ? 'Cancelled_' : ''}${isBillOfSupply ? 'BillOfSupply' : 'TaxInvoice'}_${order.cfOrderId || order.orderId || order.id || order._id || 'AK-2026'}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      const originalDisplay = element.style.display;
      element.style.display = 'block';
      try {
        const html2pdf = (await import('html2pdf.js')).default;
        await html2pdf().from(element).set(opt).save();
      } finally {
        element.style.display = originalDisplay;
        if (onGenerated) onGenerated();
      }
    }
  }));

  const itemsList = order.items || order.orderItems || [];
  const itemsPrice = order.itemsPrice || itemsList.reduce((acc, item) => acc + (item.product?.price || item.price || 0) * (item.quantity || item.qty || 1), 0);
  const coinsDiscount = order.coinsDiscountValue || order.coinsDiscount || order.coinsUsed || 0;
  const couponDiscountAmount = order.couponDiscountAmount || 0;
  const deliveryCharge = order.deliveryCharge || order.shippingPrice || (itemsPrice >= 499 ? 0 : 40);
  const finalAmount = order.finalAmount || order.totalPrice || (itemsPrice - coinsDiscount - couponDiscountAmount + deliveryCharge);
  const refundAmount = order.refundDetails?.amount || order.totalPrice || finalAmount;

  const is1PDirect = !order.orderItems?.[0]?.vendorId || order.orderItems?.[0]?.sellerShopName === 'AbKharido Direct' || order.orderItems?.[0]?.fulfillmentChannel === '1P';
  const sellerShopName = is1PDirect 
    ? 'AbKharido Direct Retail (Central Fulfillment Hub)' 
    : (sellerInfo.shopName || sellerInfo.legalBusinessName || order.orderItems?.[0]?.sellerShopName || 'AbKharido Verified Merchant');
  const sellerPan = is1PDirect 
    ? 'MSME / Udyam Platform Entity' 
    : (sellerInfo.pan || (sellerGstin ? sellerGstin.slice(2, 12) : (sellerInfo.enrolmentId || 'Registered on AbKharido')));
  const sellerState = is1PDirect ? 'Maharashtra' : (sellerInfo.pickupAddress?.state || 'Maharashtra');
  const sellerStreet = is1PDirect ? 'AbKharido Central Logistics Hub, Bhiwandi' : (sellerInfo.pickupAddress?.street || 'Registered Warehouse');
  const sellerCity = is1PDirect ? 'Thane / Mumbai' : (sellerInfo.pickupAddress?.city || 'City');
  const sellerPincode = is1PDirect ? '421302' : (sellerInfo.pickupAddress?.pincode || '400001');
  const buyerState = order.shippingAddress?.state || 'Maharashtra';
  const isIntraState = sellerState.trim().toLowerCase() === buyerState.trim().toLowerCase();

  const formatDate = (dateStr) => {
    if (!dateStr) return new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  // Compute Taxes
  let totalTaxableValue = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;

  const itemsWithTaxes = itemsList.map(item => {
    const name = item.product?.name || item.name || item.title || 'Product';
    const sku = item.product?.id || item.product || item.id || 'N/A';
    const qty = Number(item.quantity || item.qty || 1);
    const grossPrice = Number(item.product?.price || item.price || 0);
    const lineTotal = grossPrice * qty;
    const hsn = item.hsnCode || item.product?.hsnCode || (name.toLowerCase().includes('phone') ? '8517' : (name.toLowerCase().includes('shirt') ? '6109' : '8518'));
    
    // Tax Rate: If Non-GST, GST is strictly 0%
    const rate = isGstSeller ? (Number(item.gstRate || item.product?.gstRate || 18)) : 0;
    
    let taxable = lineTotal;
    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (isGstSeller && rate > 0) {
      // Inclusive GST formula: Base Price = Total / (1 + (Rate / 100))
      taxable = Math.round((lineTotal / (1 + rate / 100)) * 100) / 100;
      const totalTax = Math.round((lineTotal - taxable) * 100) / 100;
      if (isIntraState) {
        cgst = Math.round((totalTax / 2) * 100) / 100;
        sgst = Math.round((totalTax / 2) * 100) / 100;
      } else {
        igst = totalTax;
      }
    }

    totalTaxableValue += taxable;
    totalCgst += cgst;
    totalSgst += sgst;
    totalIgst += igst;

    return {
      name,
      sku,
      hsn,
      qty,
      grossPrice,
      lineTotal,
      rate,
      taxable,
      cgst,
      sgst,
      igst
    };
  });

  return (
    <div style={{ display: isVisible ? 'block' : 'none' }}>
      <div 
        id={`invoice-capture-area-${order.id || order._id || '0'}`} 
        style={{
          position: 'relative',
          overflow: 'hidden',
          width: '100%',
          maxWidth: '210mm',
          margin: '0 auto',
          padding: '16mm 14mm',
          backgroundColor: '#ffffff',
          color: '#0f172a',
          fontFamily: '"Outfit", "Inter", -apple-system, sans-serif',
          boxSizing: 'border-box',
          border: isVisible ? '1px solid #e2e8f0' : 'none',
          borderRadius: isVisible ? '16px' : '0'
        }}
      >
        {/* ─── Cancelled Watermark Stamp ─── */}
        {isCancelled && (
          <div style={{
            position: 'absolute',
            top: '40%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(-25deg)',
            fontSize: '56px',
            fontWeight: '900',
            color: 'rgba(220, 38, 38, 0.14)',
            border: '6px dashed rgba(220, 38, 38, 0.3)',
            padding: '14px 38px',
            borderRadius: '16px',
            pointerEvents: 'none',
            letterSpacing: '8px',
            textTransform: 'uppercase',
            zIndex: 10,
            whiteSpace: 'nowrap',
            fontFamily: '"Outfit", sans-serif'
          }}>
            ORDER CANCELLED
          </div>
        )}

        {/* ─── Top Header Ribbon ─────────────────────────────────────── */}
        <table style={{ width: '100%', borderBottom: '2.5px solid #0f172a', paddingBottom: '16px', marginBottom: '20px' }} cellPadding="0" cellSpacing="0">
          <tbody>
            <tr>
              <td style={{ verticalAlign: 'top', width: '58%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '26px', fontWeight: '900', color: '#1e3a8a', letterSpacing: '-0.5px' }}>
                    AbKharido<span style={{ color: '#2563eb' }}>.com</span>
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', lineHeight: '1.4' }}>
                  Marketplace Platform: <strong>AbKharido</strong> (Digital Intermediary under IT Act 2000)<br />
                  Platform Entity: <strong>Unregistered Enterprise</strong> (Exempt under Sec 22 CGST Act / MSME)<br />
                  Support: support@abkharido.com | Helplines: +91 9172600587
                </div>
              </td>
              <td style={{ textAlign: 'right', verticalAlign: 'top', width: '42%' }}>
                <div style={{
                  display: 'inline-block',
                  background: isCancelled ? '#fef2f2' : (isBillOfSupply ? '#fef3c7' : '#eff6ff'),
                  color: isCancelled ? '#dc2626' : (isBillOfSupply ? '#92400e' : '#1d4ed8'),
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontWeight: '900',
                  fontSize: '14px',
                  letterSpacing: '0.8px',
                  textTransform: 'uppercase',
                  border: isCancelled ? '1.5px solid #fca5a5' : (isBillOfSupply ? '1px solid #fde68a' : '1px solid #bfdbfe')
                }}>
                  {isCancelled 
                    ? (isBillOfSupply ? 'BILL OF SUPPLY (CANCELLED)' : 'TAX INVOICE (CANCELLED)')
                    : (isBillOfSupply ? 'BILL OF SUPPLY' : 'TAX INVOICE')}
                </div>
                <div style={{ fontSize: '12.5px', fontWeight: '800', marginTop: '6px', color: '#0f172a' }}>
                  {isBillOfSupply ? 'BOS' : 'INV'}-{(order.id || order._id || '0').toString().slice(-8).toUpperCase()}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  Order Date: <strong>{formatDate(order.date || order.createdAt)}</strong>
                </div>
                {isCancelled && (
                  <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '2px', fontWeight: '800' }}>
                    Cancelled: {formatDate(cancellationDate)}
                  </div>
                )}
                {order.awbNumber && !isCancelled && (
                  <div style={{ fontSize: '10.5px', color: '#059669', marginTop: '2px', fontWeight: '700' }}>
                    AWB: {order.awbNumber} ({order.courierPartner || 'NimbusPost'})
                  </div>
                )}
              </td>
            </tr>
          </tbody>
        </table>

        {/* ─── Official Cancellation Notice / Credit Memorandum ─── */}
        {isCancelled && (
          <div style={{
            background: '#fef2f2',
            border: '1.5px solid #fca5a5',
            borderRadius: '8px',
            padding: '12px 14px',
            marginBottom: '18px',
            color: '#991b1b',
            fontSize: '11px',
            lineHeight: '1.5'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', borderBottom: '1px solid #fecaca', paddingBottom: '6px' }}>
              <span style={{ fontSize: '12.5px', fontWeight: '900', color: '#b91c1c' }}>
                ❌ ORDER CANCELLED & VOID / CREDIT NOTE ADVICE
              </span>
              <span style={{ background: '#dc2626', color: '#ffffff', padding: '2px 8px', borderRadius: '4px', fontSize: '9.5px', fontWeight: '800', letterSpacing: '0.5px' }}>
                VOID FOR TAX PURPOSES
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <div><strong>Cancellation Date:</strong> {formatDate(cancellationDate)}</div>
              <div><strong>Cancellation Reason:</strong> {cancellationReason}</div>
              <div><strong>Refund Status:</strong> {order.isPaid ? '✅ 100% Refund Processed' : 'Cash on Delivery (No Collection)'}</div>
              <div><strong>Refund Amount:</strong> ₹{Number(refundAmount).toLocaleString('en-IN')}</div>
            </div>
            <div style={{ fontSize: '9.5px', color: '#b91c1c', marginTop: '6px', fontStyle: 'italic' }}>
              ⚖️ Statutory Declaration: This transaction was cancelled prior to fulfillment. The original tax/invoice liability is reversed to ₹0.00. This document acts as official proof of cancellation and refund and is strictly not valid for Input Tax Credit (ITC).
            </div>
          </div>
        )}

        {/* ─── Legal Entity Notice for Non-GST Sellers ─────────────────── */}
        {isBillOfSupply && (
          <div style={{
            background: '#fffbeb',
            border: '1px solid #fcd34d',
            borderRadius: '8px',
            padding: '8px 12px',
            marginBottom: '18px',
            fontSize: '10.5px',
            color: '#78350f',
            lineHeight: '1.4'
          }}>
            <strong>⚖️ Statutory Declaration under GST Law:</strong> Issued as per <strong>Section 31(3)(c) of CGST Act, 2017</strong> read with <strong>Notification No. 34/2023 - Central Tax</strong>. The supplier is an unregistered person / composition dealer eligible for intra-state supply through an e-commerce operator and is <strong>NOT entitled to collect tax on supplies</strong>. Tax Charged: <strong>₹0.00</strong>.
          </div>
        )}

        {/* ─── Seller & Buyer Addresses Table ─────────────────────────── */}
        <table style={{ width: '100%', marginBottom: '22px', borderCollapse: 'collapse' }} cellPadding="0" cellSpacing="0">
          <tbody>
            <tr>
              {/* Seller / Supplier Details */}
              <td style={{ width: '48%', verticalAlign: 'top', background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>
                  Sold By / Supplier Details
                </div>
                <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#0f172a' }}>{sellerShopName}</div>
                <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '4px', lineHeight: '1.5' }}>
                  {sellerStreet}<br />
                  {sellerCity}, {sellerState} - {sellerPincode}<br />
                  {isGstSeller ? (
                    <span style={{ color: '#1d4ed8', fontWeight: '800' }}>GSTIN: {sellerGstin}</span>
                  ) : (
                    <span style={{ color: '#d97706', fontWeight: '800' }}>
                      PAN / Enrolment ID: {sellerPan} (Non-GST Scheme)
                    </span>
                  )}
                </div>
              </td>

              <td style={{ width: '4%' }}></td>

              {/* Buyer / Shipping Details */}
              <td style={{ width: '48%', verticalAlign: 'top', background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>
                  Billed &amp; Delivered To (Customer)
                </div>
                <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#0f172a' }}>
                  {order.shippingAddress?.fullName || order.shippingAddress?.name || order.user?.fullName || 'Customer'}
                </div>
                <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '4px', lineHeight: '1.5' }}>
                  {order.shippingAddress?.address || order.shippingAddress?.streetAddress || 'Address on file'}<br />
                  {order.shippingAddress?.city || ''}, {buyerState} - {order.shippingAddress?.postalCode || order.shippingAddress?.pincode || ''}<br />
                  Phone: <strong>{order.shippingAddress?.phone || 'On File'}</strong> | State of Supply: <strong>{buyerState}</strong>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ─── Items Table with HSN & Taxes ────────────────────────────── */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '11.5px' }}>
          <thead>
            <tr style={{ background: '#0f172a', color: '#ffffff' }}>
              <th style={{ textAlign: 'left', padding: '8px 10px', borderRadius: '6px 0 0 6px', fontWeight: '800' }}>Item Description</th>
              <th style={{ textAlign: 'center', padding: '8px', fontWeight: '800' }}>HSN</th>
              <th style={{ textAlign: 'center', padding: '8px', fontWeight: '800' }}>Qty</th>
              <th style={{ textAlign: 'right', padding: '8px', fontWeight: '800' }}>Rate (₹)</th>
              {isGstSeller ? (
                <>
                  <th style={{ textAlign: 'right', padding: '8px', fontWeight: '800' }}>Taxable (₹)</th>
                  <th style={{ textAlign: 'right', padding: '8px', fontWeight: '800' }}>GST Rate</th>
                  <th style={{ textAlign: 'right', padding: '8px 10px', borderRadius: '0 6px 6px 0', fontWeight: '800' }}>Total (₹)</th>
                </>
              ) : (
                <>
                  <th style={{ textAlign: 'center', padding: '8px', fontWeight: '800' }}>GST Rate</th>
                  <th style={{ textAlign: 'right', padding: '8px 10px', borderRadius: '0 6px 6px 0', fontWeight: '800' }}>Total (₹)</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {itemsWithTaxes.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '10px', color: '#0f172a' }}>
                  <div style={{ fontWeight: '700', fontSize: '12px' }}>{item.name}</div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>SKU: {item.sku}</div>
                </td>
                <td style={{ padding: '10px', textAlign: 'center', color: '#475569', fontWeight: '600' }}>{item.hsn}</td>
                <td style={{ padding: '10px', textAlign: 'center', fontWeight: '700' }}>{item.qty}</td>
                <td style={{ padding: '10px', textAlign: 'right', color: '#334155' }}>₹{item.grossPrice.toLocaleString('en-IN')}</td>
                {isGstSeller ? (
                  <>
                    <td style={{ padding: '10px', textAlign: 'right', color: '#334155' }}>₹{item.taxable.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '10px', textAlign: 'right', color: '#1d4ed8', fontWeight: '700' }}>{item.rate}%</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: '800', color: '#0f172a' }}>₹{item.lineTotal.toLocaleString('en-IN')}</td>
                  </>
                ) : (
                  <>
                    <td style={{ padding: '10px', textAlign: 'center', color: '#059669', fontWeight: '800' }}>0% (Exempt)</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: '800', color: '#0f172a' }}>₹{item.lineTotal.toLocaleString('en-IN')}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {/* ─── Summary Totals Table ────────────────────────────────────── */}
        <table style={{ width: '100%', marginBottom: '24px', borderCollapse: 'collapse' }} cellPadding="0" cellSpacing="0">
          <tbody>
            <tr>
              <td style={{ width: '52%', verticalAlign: 'top', paddingRight: '20px' }}>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '11px', color: '#475569', lineHeight: '1.6' }}>
                  <div><strong>Payment Mode:</strong> {order.paymentMethod || 'Online'}</div>
                  <div><strong>Payment Status:</strong> {isCancelled ? '❌ ORDER CANCELLED (Transaction Voided & Settled)' : (order.isPaid ? '✅ PAID (Transaction Verified)' : '⏳ CASH ON DELIVERY (Collect on Doorstep)')}</div>
                  <div><strong>Place of Supply:</strong> {buyerState} ({isIntraState ? 'Intra-State Supply' : 'Inter-State Supply'})</div>
                  {isGstSeller && (
                    <div style={{ marginTop: '4px', borderTop: '1px dashed #cbd5e1', paddingTop: '4px' }}>
                      {isIntraState ? (
                        <span>CGST: ₹{totalCgst.toLocaleString('en-IN')} | SGST: ₹{totalSgst.toLocaleString('en-IN')}</span>
                      ) : (
                        <span>IGST: ₹{totalIgst.toLocaleString('en-IN')}</span>
                      )}
                    </div>
                  )}
                </div>
              </td>

              <td style={{ width: '48%', verticalAlign: 'top' }}>
                <table style={{ width: '100%', fontSize: '12px' }} cellPadding="4" cellSpacing="0">
                  <tbody>
                    <tr>
                      <td style={{ color: '#64748b' }}>Item Total (Gross):</td>
                      <td style={{ textAlign: 'right', fontWeight: '600' }}>₹{itemsPrice.toLocaleString('en-IN')}</td>
                    </tr>
                    {coinsDiscount > 0 && (
                      <tr style={{ color: '#16a34a' }}>
                        <td>AB Coins Redeemed:</td>
                        <td style={{ textAlign: 'right', fontWeight: '600' }}>- ₹{coinsDiscount.toLocaleString('en-IN')}</td>
                      </tr>
                    )}
                    {couponDiscountAmount > 0 && (
                      <tr style={{ color: '#16a34a' }}>
                        <td>Coupon Discount:</td>
                        <td style={{ textAlign: 'right', fontWeight: '600' }}>- ₹{couponDiscountAmount.toLocaleString('en-IN')}</td>
                      </tr>
                    )}
                    <tr>
                      <td style={{ color: '#64748b' }}>Shipping / Courier Charge:</td>
                      <td style={{ textAlign: 'right', fontWeight: '600' }}>{deliveryCharge > 0 ? `₹${deliveryCharge}` : 'FREE'}</td>
                    </tr>
                    {isGstSeller ? (
                      <tr>
                        <td style={{ color: '#64748b' }}>Total GST Included:</td>
                        <td style={{ textAlign: 'right', fontWeight: '600', color: '#1d4ed8' }}>₹{(totalCgst + totalSgst + totalIgst).toLocaleString('en-IN')}</td>
                      </tr>
                    ) : (
                      <tr>
                        <td style={{ color: '#64748b' }}>GST Charged:</td>
                        <td style={{ textAlign: 'right', fontWeight: '700', color: '#059669' }}>₹0.00 (Exempt)</td>
                      </tr>
                    )}
                    <tr style={{ borderTop: '1.5px solid #0f172a', borderBottom: isCancelled ? 'none' : '1.5px solid #0f172a' }}>
                      <td style={{ padding: '8px 0', fontSize: '15px', fontWeight: '900', color: '#0f172a' }}>
                        {isCancelled ? 'Original Amount:' : 'Grand Total:'}
                      </td>
                      <td style={{ padding: '8px 0', fontSize: '16px', fontWeight: '900', color: isCancelled ? '#64748b' : '#1e3a8a', textAlign: 'right', textDecoration: isCancelled ? 'line-through' : 'none' }}>
                        ₹{finalAmount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                    {isCancelled && (
                      <>
                        <tr style={{ color: '#dc2626' }}>
                          <td style={{ padding: '4px 0', fontSize: '12px', fontWeight: '800' }}>Refund / Cancellation Adjustment:</td>
                          <td style={{ padding: '4px 0', fontSize: '13px', fontWeight: '800', textAlign: 'right' }}>
                            - ₹{finalAmount.toLocaleString('en-IN')}
                          </td>
                        </tr>
                        <tr style={{ background: '#fef2f2', borderTop: '2px solid #dc2626', borderBottom: '2px solid #dc2626' }}>
                          <td style={{ padding: '8px', fontSize: '14px', fontWeight: '900', color: '#991b1b' }}>Net Invoice Value:</td>
                          <td style={{ padding: '8px', fontSize: '15px', fontWeight: '900', color: '#dc2626', textAlign: 'right' }}>
                            ₹0.00 (CANCELLED)
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ─── Footer & Signatures ─────────────────────────────────────── */}
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '10.5px', color: '#64748b' }}>
          <div>
            <div>This is a computer-generated official document under the Information Technology Act, 2000.</div>
            <div>For disputes or warranty assistance, contact <strong>support@abkharido.com</strong>.</div>
          </div>
          <div style={{ textAlign: 'center', width: '160px' }}>
            <div style={{ fontFamily: 'cursive', fontSize: '14px', color: '#1e3a8a', fontWeight: 'bold' }}>
              {sellerShopName.slice(0, 16)}
            </div>
            <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '2px', fontSize: '9.5px', marginTop: '4px' }}>
              Authorized Signatory
            </div>
          </div>
        </div>

      </div>
    </div>
  );
});

WorldClassInvoice.displayName = 'WorldClassInvoice';
export default WorldClassInvoice;
