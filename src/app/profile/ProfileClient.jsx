"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import ProfilePage from '../../views/ProfilePage';

export default function ProfileClient() {
  const router = useRouter();
  return <ProfilePage onNavigate={(p) => router.push(p === 'home' || p === '' ? '/' : '/' + p)} />;
}
