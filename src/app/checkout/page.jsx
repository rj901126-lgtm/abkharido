import React from 'react';
import CheckoutClient from './CheckoutClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.abkharido.com';

export const metadata = {
  title: 'Secure Express Checkout | AbKharido',
  description: 'Complete your order securely with Cash on Delivery, UPI, Cards, and Net Banking on AbKharido.',
  alternates: {
    canonical: `${SITE_URL}/checkout`,
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function Page() {
  return <CheckoutClient />;
}
