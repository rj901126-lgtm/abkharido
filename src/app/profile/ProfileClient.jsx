"use client";
import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProfilePage from '../../views/ProfilePage';

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams?.get('tab') || 'overview';

  return (
    <ProfilePage 
      initialTab={currentTab}
      onNavigate={(p) => {
        if (!p || p === 'home') router.push('/');
        else if (p.startsWith('/')) router.push(p);
        else router.push('/' + p);
      }} 
      onTabChange={(newTab) => {
        if (newTab === 'overview') {
          router.replace('/profile', { scroll: false });
        } else {
          router.replace(`/profile?tab=${newTab}`, { scroll: false });
        }
      }}
      onNavigateProduct={(id) => router.push(`/product/${id}`)}
    />
  );
}

export default function ProfileClient() {
  return (
    <Suspense fallback={<div style={{ minHeight: '60vh' }} />}>
      <ProfileContent />
    </Suspense>
  );
}
