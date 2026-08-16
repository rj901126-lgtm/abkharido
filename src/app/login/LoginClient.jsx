"use client";
import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Login from '../../views/Login';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get('callbackUrl') || searchParams?.get('redirect') || '/profile';

  return (
    <Login 
      onNavigate={(p) => {
        if (!p || p === 'home') router.push('/');
        else if (p.startsWith('/')) router.push(p);
        else router.push('/' + p);
      }} 
      callbackUrl={callbackUrl}
    />
  );
}

export default function LoginClient() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
