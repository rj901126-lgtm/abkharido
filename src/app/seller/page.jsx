import React from 'react';
import SellerClient from './SellerClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.abkharido.com';

export const metadata = {
  title: 'Merchant & Seller Hub | AbKharido',
  description: 'Sell on AbKharido. Direct access to high-converting buyers across Indian metros with express fulfillment and automated bank settlements.',
  alternates: {
    canonical: `${SITE_URL}/seller`,
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function Page() {
  return <SellerClient />;
}
