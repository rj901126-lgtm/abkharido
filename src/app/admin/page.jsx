import React from 'react';
import { redirect } from 'next/navigation';
import AdminClient from './AdminClient';
import { getAuthenticatedUser } from '../../lib/serverAuth.js';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.abkharido.com';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Executive Admin Control Center | AbKharido',
  description: 'Enterprise ERP, OMS, CRM, and catalog management for AbKharido.',
  alternates: {
    canonical: `${SITE_URL}/admin`,
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default async function Page() {
  const auth = await getAuthenticatedUser();

  // 1. Not logged in -> redirect 302 to /login?callbackUrl=/admin
  if (!auth || !auth.isAuthenticated) {
    redirect('/login?callbackUrl=/admin');
  }

  // 2. Logged in as regular customer -> 403 Forbidden
  if (!auth.isAdmin) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{ maxWidth: '480px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '40px 24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>403 - Forbidden</h1>
          <p style={{ fontSize: '15px', color: '#64748b', marginBottom: '24px', lineHeight: '1.5' }}>
            Access restricted to administrators. Log in with an admin account.
          </p>
          <a 
            href="/login?callbackUrl=/admin"
            style={{ display: 'inline-block', background: '#2563eb', color: '#fff', textDecoration: 'none', borderRadius: '8px', padding: '12px 24px', fontWeight: '600' }}
          >
            Log in with Admin Account
          </a>
        </div>
      </div>
    );
  }

  // 3. Logged in as admin -> render AdminClient
  return <AdminClient />;
}
