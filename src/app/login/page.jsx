"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import Login from '../../views/Login';

export default function LoginPage() {
  const router = useRouter();
  return <Login onNavigate={(p) => router.push(p === 'home' || p === '' ? '/' : '/' + p)} />;
}
