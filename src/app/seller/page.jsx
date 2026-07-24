"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import SellerDashboard from '../../views/SellerDashboard';

export default function Page() {
  const router = useRouter();
  return <SellerDashboard onNavigate={(p) => router.push('/' + p)} />;
}
