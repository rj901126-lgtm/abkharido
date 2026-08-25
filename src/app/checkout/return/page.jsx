"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '../../../context/AppContext';
import { CheckCircle2, XCircle, Clock, ArrowRight, Package, ShieldCheck, Home } from 'lucide-react';

function ReturnContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clearCart, showToast } = useApp();

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

    const verifyPayment = async () => {
      try {
        const res = await fetch(`/api/payments/cashfree/verify?order_id=${encodeURIComponent(orderId)}`, {
          method: 'GET'
        });
        const data = await res.json();

        if (res.ok && (data.success || data.order?.isPaid)) {
          setStatus('SUCCESS');
          setOrderDetails(data.order);
          if (clearCart) clearCart();
          if (showToast) showToast('🎉 Payment successful! Your order has been placed.', 'success');
        } else {
          setStatus('FAILED');
          setErrorMessage(data.message || data.error || 'Payment verification was not successful.');
        }
      } catch (err) {
        console.error('Verification request failed:', err);
        setStatus('FAILED');
        setErrorMessage('Network error while verifying payment status.');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [orderId]);

  return (
    <div style={{ maxWidth: '640px', margin: '40px auto', padding: '24px 20px', fontFamily: "'Outfit', sans-serif" }}>
      <div style={{ background: '#ffffff', borderRadius: '24px', padding: '36px 28px', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.06)', textAlign: 'center' }}>
        
        {loading && (
          <div>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', border: '4px solid #e0e7ff', borderTopColor: '#4f46e5', margin: '0 auto 20px', animation: 'spin 1s linear infinite' }}></div>
            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a', margin: '0 0 8px' }}>Verifying Payment Status...</h2>
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Please wait while we confirm your payment with Cashfree Escrow Gateway.</p>
          </div>
        )}

        {!loading && status === 'SUCCESS' && (
          <div>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '2px solid #a7f3d0' }}>
              <CheckCircle2 size={42} color="#059669" />
            </div>
            <span style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', color: '#059669', background: '#ecfdf5', padding: '4px 12px', borderRadius: '100px', display: 'inline-block', marginBottom: '12px' }}>
              100% Payment Confirmed
            </span>
            <h2 style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', margin: '0 0 8px' }}>Order Placed Successfully!</h2>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 24px' }}>
              Thank you for shopping with AbKharido. We’ve received your order and are preparing it for dispatch.
            </p>

            <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '20px', textAlign: 'left', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px' }}>
                <span style={{ color: '#64748b', fontWeight: '600' }}>Order Reference:</span>
                <span style={{ fontWeight: '800', color: '#0f172a', fontFamily: 'monospace' }}>{orderDetails?.cfOrderId || orderId}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px' }}>
                <span style={{ color: '#64748b', fontWeight: '600' }}>Payment Mode:</span>
                <span style={{ fontWeight: '800', color: '#059669' }}>Cashfree Escrow (Paid)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px' }}>
                <span style={{ color: '#64748b', fontWeight: '600' }}>Total Amount Paid:</span>
                <span style={{ fontWeight: '900', color: '#0f172a' }}>₹{(orderDetails?.totalPrice || 0).toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b', fontWeight: '600' }}>Estimated Delivery:</span>
                <span style={{ fontWeight: '800', color: '#3b82f6' }}>2-4 Business Days</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Link 
                href="/orders" 
                style={{ flex: '1 1 180px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#0f172a', color: '#ffffff', padding: '14px 20px', borderRadius: '14px', textDecoration: 'none', fontWeight: '800', fontSize: '14px', boxShadow: '0 4px 14px rgba(15,23,42,0.2)' }}
              >
                <Package size={18} />
                <span>Track My Order</span>
              </Link>
              <Link 
                href="/" 
                style={{ flex: '1 1 180px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#f1f5f9', color: '#0f172a', padding: '14px 20px', borderRadius: '14px', textDecoration: 'none', fontWeight: '800', fontSize: '14px' }}
              >
                <Home size={18} />
                <span>Continue Shopping</span>
              </Link>
            </div>
          </div>
        )}

        {!loading && status === 'FAILED' && (
          <div>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '2px solid #fecaca' }}>
              <XCircle size={42} color="#dc2626" />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', margin: '0 0 8px' }}>Payment Incomplete or Cancelled</h2>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 24px' }}>
              {errorMessage || 'Your payment could not be processed. No money was deducted from your account.'}
            </p>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Link 
                href="/checkout" 
                style={{ flex: '1 1 180px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#4f46e5', color: '#ffffff', padding: '14px 20px', borderRadius: '14px', textDecoration: 'none', fontWeight: '800', fontSize: '14px', boxShadow: '0 4px 14px rgba(79,70,229,0.3)' }}
              >
                <span>Retry Checkout</span>
                <ArrowRight size={18} />
              </Link>
              <Link 
                href="/cart" 
                style={{ flex: '1 1 180px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#f1f5f9', color: '#0f172a', padding: '14px 20px', borderRadius: '14px', textDecoration: 'none', fontWeight: '800', fontSize: '14px' }}
              >
                <span>Return to Bag</span>
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
    <Suspense fallback={<div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>Loading receipt...</div>}>
      <ReturnContent />
    </Suspense>
  );
}
