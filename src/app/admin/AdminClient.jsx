"use client";
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useApp } from '../../context/AppContext';

const AdminDashboard = dynamic(() => import('../../views/AdminDashboard'), { 
  ssr: false,
  loading: () => <div className="container" style={{ padding: '100px 20px', textAlign: 'center' }}>Loading Security Control Center...</div>
});

export default function AdminClient({ serverIsAdmin = false, serverUser = null }) {
  const router = useRouter();
  const { data: session } = useSession();
  const { promotions, currentUser } = useApp();

  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = sessionStorage.getItem('abkharido_admin_token') || localStorage.getItem('adminToken');
      if (token) {
        setHasToken(true);
      } else if (session?.accessToken) {
        try {
          sessionStorage.setItem('abkharido_admin_token', session.accessToken);
        } catch (e) {}
      }
    }
  }, [session]);

  const cleanPhone = String(session?.user?.phone || session?.user?.name || currentUser?.phone || serverUser?.phone || '').replace(/\D/g, '').slice(-10);
  const cleanEmail = String(session?.user?.email || currentUser?.email || serverUser?.email || '').toLowerCase().trim();
  const isOwner = cleanPhone === '9172600587' || cleanEmail === 'rj901126@gmail.com' || cleanEmail === 'admin@abkharido.com';
  const isSessionAdmin = session?.user?.role === 'admin' || session?.user?.role === 'super_admin' || currentUser?.role === 'super_admin' || currentUser?.role === 'admin';

  const isAuthorized = Boolean(serverIsAdmin || isSessionAdmin || isOwner || hasToken);

  return (
    <AdminDashboard 
      onNavigate={(p) => router.push(p === 'home' || p === '' ? '/' : '/' + p)} 
      promotions={promotions} 
      onUpdatePromotions={() => window.location.reload()} 
      initialAuthorized={isAuthorized}
    />
  );
}
