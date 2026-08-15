import React from 'react';
import AdminClient from './AdminClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.abkharido.com';

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

export default function Page() {
  return <AdminClient />;
}
