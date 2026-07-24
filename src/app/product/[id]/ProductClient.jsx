"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import ProductDetails from '../../../views/ProductDetails';
import { useApp } from '../../../context/AppContext';

export default function ProductClient({ id }) {
  const router = useRouter();
  const { promotions } = useApp();
  
  return (
    <ProductDetails 
      productId={id} 
      onNavigate={(p) => router.push('/' + p)} 
      promotions={promotions} 
      onBuyNow={() => router.push('/cart')} 
    />
  );
}
