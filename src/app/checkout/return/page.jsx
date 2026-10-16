"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '../../../context/AppContext';
import { CheckCircle2, XCircle, ArrowRight, Package, ShieldCheck, Home } from 'lucide-react';

function ReturnContent() {
  const searchParams = useSearchParams();
  const { clearCart, showToast, currentUser } = useApp();

  const orderId = searchParams.get('order_id') || searchParams.get('orderId');
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('VERIFYING'); // 'SUCCESS', 'FAILED', 'VERIFYING'
  const [orderDetails, setOrderDetails] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      setStatus('FAILED');
      setErrorMessage('No Order ID found in return URL.');
      return;
    }

    let cancelled = false;

    const verifyPaymentWithRetry = async () => {
      const token =
        currentUser?.token ||
        (typeof window !== 'undefined'
          ? localStorage.getItem('abkharido_token') || localStorage.getItem('abkharido_user_session')
          : null);
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

      const markSuccess = (orderObj) => {
        if (cancelled) return;
        setStatus('SUCCESS');
        setOrderDetails(orderObj || null);
        setLoading(false);
        if (clearCart) clearCart();
        try {
          localStorage.removeItem('abkharido_cart');
          localStorage.removeItem('abkharido_cached_cart');
          sessionStorage.removeItem('abkharido_cart');
        } catch (_) {}
        if (showToast) showToast('Payment verified! Your order is confirmed.', 'success');
      };

      // Step 1: Actively attempt POST verification against Cashfree PG
      try {
        const postRes = await fetch('/api/payments/cashfree/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders
          },
          body: JSON.stringify({ orderId })
        });
        const postData = await postRes.json().catch(() => ({}));
        if (postRes.ok && (postData.success || postData.order?.isPaid)) {
          markSuccess(postData.order);
          return;
        }
      } catch (_) {}

      // Step 2: Poll GET up to 3 times (every 1.5s) in case webhook is arriving
      for (let attempt = 0; attempt < 3; attempt++) {
        if (cancelled) return;
        if (attempt > 0) {
          await new Promise((r) => setTimeout(r, 1500));
        }
        try {
          const res = await fetch(`/api/payments/cashfree/verify?order_id=${encodeURIComponent(orderId)}`, {
            method: 'GET',
            headers: authHeaders
          });
          const data = await res.json().catch(() => ({}));
          if (res.ok && (data.success || data.order?.isPaid)) {
            markSuccess(data.order);
            return;
          }
          if (attempt === 2) {
            if (!cancelled) {
              setStatus('FAILED');
              setErrorMessage(data.message || data.error || 'Payment could not be verified yet.');
              setLoading(false);
            }
          }
        } catch (err) {
          if (attempt === 2 && !cancelled) {
            setStatus('FAILED');
            setErrorMessage('Network error while verifying payment status.');
            setLoading(false);
          }
        }
      }
    };

    verifyPaymentWithRetry();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  return (
    <div style={{ maxWidth: '520px', margin: '32px auto', padding: '20px 16px', fontFamily: "'Plus Jakarta Sans', 'Outfit', sans-serif" }}>
      <div style={{ background: '#ffffff', borderRadius: '20px', padding: '32px 24px', border: '1px solid #e2e8f0', boxShadow: '0 8px 30px rgba(15,23,42,0.05)', textAlign: 'center' }}>
        {loading && (
          <div>
            <div style={{ width: '52px', height: '52px', borderRadius: '50%', border: '3.5px solid #dbeafe', borderTopColor: '#2563eb', margin: '0 auto 18px', animation: 'spin 0.9s linear infinite' }} />
            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px' }}>Verifying Payment...</h2>
            <p style={{ color: '#64748b', fontSize: '13.5px', margin: 0 }}>Confirming your transaction with Cashfree Escrow Gateway.</p>
          </div>
        )}

        {!loading && status === 'SUCCESS' && (
          <div>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1.5px solid #a7f3d0' }}>
              <CheckCircle2 size={34} color="#059669" />
            </div>
            <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#059669', background: '#ecfdf5', padding: '4px 12px', borderRadius: '999px', display: 'inline-block', marginBottom: '10px', border: '1px solid #a7f3d0' }}>
              100% Escrow Payment Verified
            </span>
            <h2 style={{ fontSize: '23px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px', letterSpacing: '-0.4px' }}>Order Confirmed!</h2>
            <p style={{ color: '#64748b', fontSize: '13.5px', margin: '0 0 20px', lineHeight: 1.5 }}>
              Thank you for shopping with AbKharido. Your payment is safely held in escrow until doorstep delivery.
            </p>

            <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '16px', textAlign: 'left', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' }}>
                <span style={{ color: '#64748b', fontWeight: '600' }}>Order Reference</span>
                <span style={{ fontWeight: '800', color: '#0f172a', fontFamily: 'monospace' }}>{orderDetails?.cfOrderId || orderId}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' }}>
                <span style={{ color: '#64748b', fontWeight: '600' }}>Payment Status</span>
                <span style={{ fontWeight: '800', color: '#059669' }}>Prepaid Escrow (Verified)</span>
              </div>
              {orderDetails?.totalPrice > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' }}>
                  <span style={{ color: '#64748b', fontWeight: '600' }}>Amount Paid</span>
                  <span style={{ fontWeight: '900', color: '#0f172a' }}>₹{Number(orderDetails.totalPrice).toLocaleString('en-IN')}</span>
                </div>
              )}
              {orderDetails?.paymentRewardsAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' }}>
                  <span style={{ color: '#64748b', fontWeight: '600' }}>AB Coins Credited</span>
                  <span style={{ fontWeight: '800', color: '#b45309' }}>🪙 +{orderDetails.paymentRewardsAmount} Coins</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b', fontWeight: '600' }}>Estimated Dispatch</span>
                <span style={{ fontWeight: '800', color: '#2563eb' }}>Within 24 Hours (2–4 Days Delivery)</span>
              </div>
            </div>

            {orderDetails?.deliveryPin && (
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '14px', padding: '14px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ShieldCheck size={14} /> Doorstep Delivery PIN
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '2px', fontWeight: '500' }}>
                    Share this PIN with the courier agent only upon receiving your package.
                  </div>
                </div>
                <div style={{ background: '#ffffff', border: '1.5px solid #93c5fd', borderRadius: '10px', padding: '8px 12px', fontFamily: 'monospace', fontSize: '17px', fontWeight: '900', color: '#1e3a8a', letterSpacing: '2px', flexShrink: 0 }}>
                  {orderDetails.deliveryPin}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <Link
                href="/orders"
                style={{ flex: '1 1 160px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#0f172a', color: '#ffffff', padding: '13px 18px', borderRadius: '12px', textDecoration: 'none', fontWeight: '800', fontSize: '13.5px' }}
              >
                <Package size={16} />
                <span>Track My Order</span>
              </Link>
              <Link
                href="/"
                style={{ flex: '1 1 160px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#f1f5f9', color: '#0f172a', padding: '13px 18px', borderRadius: '12px', textDecoration: 'none', fontWeight: '800', fontSize: '13.5px', border: '1px solid #e2e8f0' }}
              >
                <Home size={16} />
                <span>Continue Shopping</span>
              </Link>
            </div>
          </div>
        )}

        {!loading && status === 'FAILED' && (
          <div>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1.5px solid #fecaca' }}>
              <XCircle size={34} color="#dc2626" />
            </div>
            <h2 style={{ fontSize: '21px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px' }}>Payment Pending or Cancelled</h2>
            <p style={{ color: '#64748b', fontSize: '13.5px', margin: '0 0 22px', lineHeight: 1.5 }}>
              {errorMessage || 'Your payment was not completed. If any amount was debited, it will be automatically reconciled or refunded.'}
            </p>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <Link
                href="/orders"
                style={{ flex: '1 1 160px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#2563eb', color: '#ffffff', padding: '13px 18px', borderRadius: '12px', textDecoration: 'none', fontWeight: '800', fontSize: '13.5px' }}
              >
                <span>Check My Orders</span>
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/checkout"
                style={{ flex: '1 1 160px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#f1f5f9', color: '#0f172a', padding: '13px 18px', borderRadius: '12px', textDecoration: 'none', fontWeight: '800', fontSize: '13.5px', border: '1px solid #e2e8f0' }}
              >
                <span>Retry Checkout</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReturnPage() {
  return (
    <Suspense fallback={<div style={{ padding: '60px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>Verifying payment receipt...</div>}>
      <ReturnContent />
    </Suspense>
  );
}
