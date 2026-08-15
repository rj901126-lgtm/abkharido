"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import CategoriesPage from '../../views/CategoriesPage';
import { useApp } from '../../context/AppContext';

export default function CategoriesClient() {
  const router = useRouter();
  const { promotions } = useApp();
  
  return (
    <CategoriesPage 
      onNavigate={(p) => router.push(p === 'home' || p === '' ? '/' : '/' + p)} 
      onSelectCategory={(cat) => router.push('/catalog?category=' + cat)} 
      onNavigateProduct={(id) => router.push('/product/' + id)} 
      promotions={promotions} 
      onSearch={(query) => router.push('/catalog?search=' + encodeURIComponent(query))} 
    />
  );
}
