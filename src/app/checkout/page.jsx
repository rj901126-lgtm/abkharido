"use client";
import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Checkout from '../../views/Checkout';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const coins = searchParams.get('coins') === 'true';
  return <Checkout useCoinsDiscount={coins} onNavigate={(p) => router.push('/' + p)} />;
}

export default function Page() {
  return <Suspense fallback={<div>Loading...</div>}><CheckoutContent /></Suspense>;
}
