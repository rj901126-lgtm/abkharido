"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import ProductDetails from '../../../views/ProductDetails';
import { useApp } from '../../../context/AppContext';

export default function ProductClient({ id, initialProduct }) {
  const router = useRouter();
  const { promotions } = useApp();
  
  return (
    <ProductDetails 
      productId={id} 
      initialProduct={initialProduct}
      onNavigate={(p) => {
        if (p === 'home' || p === '') router.push('/');
        else if (p.startsWith('/')) router.push(p);
        else router.push('/' + p);
      }} 
      promotions={promotions} 
      onBuyNow={() => router.push('/cart')} 
    />
  );
}
