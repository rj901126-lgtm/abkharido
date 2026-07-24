"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import Orders from '../../views/Orders';

export default function Page() {
  const router = useRouter();
  return <Orders onNavigateProduct={(id) => router.push('/product/' + id)} />;
}
