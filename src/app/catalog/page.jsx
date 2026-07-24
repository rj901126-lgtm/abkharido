"use client";
import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProductCatalog from '../../views/ProductCatalog';
import { useApp } from '../../context/AppContext';

function CatalogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { promotions } = useApp();
  const category = searchParams.get('category') || 'all';
  const search = searchParams.get('search') || '';
  
  return <ProductCatalog currentCategory={category} onSelectCategory={(cat) => router.push('/catalog?category=' + cat)} searchQuery={search} onNavigateProduct={(id) => router.push('/product/' + id)} promotions={promotions} />;
}

export default function Page() {
  return <Suspense fallback={<div>Loading...</div>}><CatalogContent /></Suspense>;
}
