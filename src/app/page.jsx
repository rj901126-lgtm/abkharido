"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import Home from '../views/Home';
import { useApp } from '../context/AppContext';

export default function Page() {
  const router = useRouter();
  const { promotions } = useApp();
  return <Home onNavigate={(p) => router.push(p === 'home' || p === '' ? '/' : '/' + p)} onNavigateProduct={(id) => router.push('/product/' + id)} onSelectCategory={(cat) => router.push('/catalog?category=' + cat)} promotions={promotions} />;
}
