"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import CartPage from '../../views/CartPage';

import { useApp } from '../../context/AppContext';

export default function Page() {
  const router = useRouter();
  const { currentUser, showToast } = useApp();

  const handleCheckout = () => {
    if (!currentUser) {
      showToast('Please login to proceed to checkout', 'info');
      router.push('/login?redirect=/checkout');
    } else {
      router.push('/checkout');
    }
  };

  return <CartPage onNavigate={(p) => router.push('/' + p)} onCheckout={handleCheckout} />;
}
