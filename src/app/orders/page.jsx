import React from 'react';
import OrdersClient from './OrdersClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.abkharido.com';

export const metadata = {
  title: 'My Orders & Live Tracking | AbKharido',
  description: 'Track your packages, view past purchase invoices, and request easy 7-day returns on AbKharido.',
  alternates: {
    canonical: `${SITE_URL}/orders`,
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function Page() {
  return <OrdersClient />;
}
