"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Home from '../views/Home';
import { useApp } from '../context/AppContext';

export default function HomeClientWrapper({ serverProducts }) {
  const router = useRouter();
  const { promotions, setProducts, products } = useApp();

  useEffect(() => {
    // Sync the server-fetched products into the AppContext so other components can use them
    if (serverProducts && serverProducts.length > 0 && products.length === 0) {
      setProducts(serverProducts);
    }
  }, [serverProducts, setProducts, products.length]);

  return (
    <Home 
      onNavigate={(p) => router.push(p === 'home' || p === '' ? '/' : '/' + p)} 
      onNavigateProduct={(id) => router.push('/product/' + id)} 
      onSelectCategory={(cat) => router.push('/catalog?category=' + cat)} 
      promotions={promotions}
      // Pass serverProducts directly to Home for instant initial render
      initialProducts={serverProducts}
    />
  );
}
