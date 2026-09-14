"use client";
import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useApp } from '../../context/AppContext';

const AdminDashboard = dynamic(() => import('../../views/AdminDashboard'), { 
  ssr: false,
  loading: () => <div className="container" style={{ padding: '100px 20px', textAlign: 'center' }}>Loading Security Control Center...</div>
});

export default function AdminClient() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { promotions } = useApp();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/admin');
    } else if (session?.accessToken) {
      try {
        sessionStorage.setItem('abkharido_admin_token', session.accessToken);
      } catch (e) {}
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return <div className="container" style={{ padding: '100px 20px', textAlign: 'center' }}>Verifying Administrator Authorization...</div>;
  }

  const role = session?.user?.role;
  if (!role || (role !== 'admin' && role !== 'super_admin')) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <div style={{ maxWidth: '480px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '40px 24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>403 - Forbidden</h1>
          <p style={{ fontSize: '15px', color: '#64748b', marginBottom: '24px', lineHeight: '1.5' }}>
            Access restricted to administrators. Log in with an admin account.
          </p>
          <button 
            onClick={() => router.push('/login?callbackUrl=/admin')}
            style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px 24px', fontWeight: '600', cursor: 'pointer' }}
          >
            Switch to Admin Account
          </button>
        </div>
      </div>
    );
  }

  return <AdminDashboard onNavigate={(p) => router.push(p === 'home' || p === '' ? '/' : '/' + p)} promotions={promotions} onUpdatePromotions={() => window.location.reload()} />;
}
