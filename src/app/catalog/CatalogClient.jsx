"use client";
import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProductCatalog from '../../views/ProductCatalog';
import { useApp } from '../../context/AppContext';

function CatalogContent({ initialCategory, initialSearch }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { promotions } = useApp();
  const category = searchParams.get('category') || initialCategory || 'all';
  const search = searchParams.get('search') || initialSearch || '';
  
  return (
    <ProductCatalog 
      currentCategory={category} 
      onSelectCategory={(cat) => router.push('/catalog?category=' + cat)} 
      searchQuery={search} 
      onNavigateProduct={(id) => router.push('/product/' + id)} 
      promotions={promotions} 
    />
  );
}

export default function CatalogClient({ initialCategory, initialSearch }) {
  return (
    <Suspense fallback={<div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>Loading Catalog...</div>}>
      <CatalogContent initialCategory={initialCategory} initialSearch={initialSearch} />
    </Suspense>
  );
}
