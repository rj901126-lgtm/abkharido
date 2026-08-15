"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import Orders from '../../views/Orders';

export default function OrdersClient() {
  const router = useRouter();
  return (
    <Orders 
      onNavigate={(path) => {
        if (path === 'home' || path === '') {
          router.push('/');
        } else if (!path.startsWith('/')) {
          router.push('/' + path);
        } else {
          router.push(path);
        }
      }}
      onNavigateProduct={(id) => router.push('/product/' + id)} 
    />
  );
}
