"use client";
import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Checkout from '../../views/Checkout';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const coins = searchParams?.get('coins') === 'true';
  return (
    <Checkout 
      useCoinsDiscount={coins} 
      onNavigate={(p) => {
        if (!p || p === 'home') router.push('/');
        else if (p.startsWith('/')) router.push(p);
        else router.push('/' + p);
      }} 
    />
  );
}

export default function CheckoutClient() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>Loading Checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
