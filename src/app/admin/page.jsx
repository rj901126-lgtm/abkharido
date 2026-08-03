"use client";
import React from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useApp } from '../../context/AppContext';

/ Disable SSR for AdminDashboard to avoid sessionStorage/window errors during build
const AdminDashboard = dynamic(() => import('../../views/AdminDashboard'), { ssr: false });

export default function Page() {
  const router = useRouter();
  const { promotions } = useApp();
  return <AdminDashboard onNavigate={(p) => router.push(p === 'home' || p === '' ? '/' : '/' + p)} promotions={promotions} onUpdatePromotions={() => window.location.reload()} />;
}
