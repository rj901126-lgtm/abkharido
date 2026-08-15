"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import CartPage from '../../views/CartPage';
import { useApp } from '../../context/AppContext';

export default function CartClient() {
  const router = useRouter();
  const { currentUser, showToast } = useApp();

  const handleCheckout = (useCoinsDiscount) => {
    const checkoutUrl = useCoinsDiscount ? '/checkout?coins=true' : '/checkout';
    if (!currentUser) {
      showToast('Please login to proceed to checkout', 'info');
      router.push('/login?redirect=' + encodeURIComponent(checkoutUrl));
    } else {
      router.push(checkoutUrl);
    }
  };

  return <CartPage onNavigate={(p) => router.push(p === 'home' || p === '' ? '/' : '/' + p)} onCheckout={handleCheckout} />;
}
