"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Home from '../views/Home';
import { useApp } from '../context/AppContext';
export default function HomeClientWrapper({ serverProducts }) {
  const router = useRouter();
  const { promotions, setProducts, products } = useApp();
  const safeProducts = Array.isArray(serverProducts) ? serverProducts : [];

  useEffect(() => {
    try {
      if (safeProducts && safeProducts.length > 0 && (!products || products.length === 0)) {
        setProducts(safeProducts);
      }
    } catch(e) {}
  }, [safeProducts, setProducts, products?.length]);

  return (
    <Home 
      onNavigate={(p) => router.push(p === 'home' || p === '' ? '/' : '/' + p)} 
      onNavigateProduct={(id) => router.push('/product/' + id)} 
      onSelectCategory={(cat) => router.push('/catalog?category=' + cat)} 
      promotions={promotions}
      initialProducts={safeProducts}
    />
  );
}

