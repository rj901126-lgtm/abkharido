import React from 'react';
import AdminClient from './AdminClient';
import { getAuthenticatedUser } from '../../lib/serverAuth.js';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.abkharido.com';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Executive Admin Control Center',
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
  const auth = await getAuthenticatedUser().catch(() => null);
  const isAdmin = Boolean(auth?.isAdmin);

  return <AdminClient serverIsAdmin={isAdmin} serverUser={auth?.user || null} />;
}
