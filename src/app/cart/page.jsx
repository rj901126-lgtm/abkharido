"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import CartPage from '../../views/CartPage';

export default function Page() {
  const router = useRouter();
  return <CartPage onNavigate={(p) => router.push('/' + p)} onCheckout={() => router.push('/checkout')} />;
}
