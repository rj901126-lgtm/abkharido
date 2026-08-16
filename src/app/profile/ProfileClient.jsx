"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import ProfilePage from '../../views/ProfilePage';

export default function ProfileClient() {
  const router = useRouter();
  return (
    <ProfilePage 
      onNavigate={(p) => {
        if (!p || p === 'home') router.push('/');
        else if (p.startsWith('/')) router.push(p);
        else router.push('/' + p);
      }} 
      onNavigateProduct={(id) => router.push(`/product/${id}`)}
    />
  );
}
