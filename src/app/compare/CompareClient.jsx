"use client";

import React, { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import ComparePage from '../../views/ComparePage';

export default function CompareClient({ initialProductIds }) {
  const router = useRouter();

  return (
    <Suspense fallback={<div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>Loading Comparison...</div>}>
      <ComparePage
        initialProductIds={initialProductIds}
        onNavigate={(route) => router.push(route === 'home' || route === '' ? '/' : `/${route}`)}
        onNavigateProduct={(id) => router.push(`/product/${id}`)}
      />
    </Suspense>
  );
}
