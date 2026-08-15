"use client";
import React from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useApp } from '../../context/AppContext';

const AdminDashboard = dynamic(() => import('../../views/AdminDashboard'), { 
  ssr: false,
  loading: () => <div className="container" style={{ padding: '100px 20px', textAlign: 'center' }}>Loading Security Control Center...</div>
});

export default function AdminClient() {
  const router = useRouter();
  const { promotions } = useApp();
  return <AdminDashboard onNavigate={(p) => router.push(p === 'home' || p === '' ? '/' : '/' + p)} promotions={promotions} onUpdatePromotions={() => window.location.reload()} />;
}
