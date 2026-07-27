"use client";
import React from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

// Disable SSR for SellerDashboard to prevent hydration issues and split bundle
const SellerDashboard = dynamic(() => import('../../views/SellerDashboard'), { ssr: false });

export default function Page() {
  const router = useRouter();
  return <SellerDashboard onNavigate={(p) => router.push(p === 'home' || p === '' ? '/' : '/' + p)} />;
}
