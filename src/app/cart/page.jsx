import React from 'react';
import CartClient from './CartClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.abkharido.com';

export const metadata = {
  title: 'Your Shopping Cart | AbKharido',
  description: 'View your selected items, apply promotional discount coupons, and checkout securely on AbKharido.',
  alternates: {
    canonical: `${SITE_URL}/cart`,
  },
  robots: {
    index: false, // Don't index user-specific cart pages
    follow: true,
  },
};

export default function Page() {
  return <CartClient />;
}
