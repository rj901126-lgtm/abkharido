"use client";
import React from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

const SellerDashboard = dynamic(() => import('../../views/SellerDashboard'), { 
  ssr: false,
  loading: () => <div className="container" style={{ padding: '100px 20px', textAlign: 'center' }}>Loading Merchant Center...</div>
});

export default function SellerClient() {
  const router = useRouter();
  return <SellerDashboard onNavigate={(p) => router.push(p === 'home' || p === '' ? '/' : '/' + p)} />;
}
