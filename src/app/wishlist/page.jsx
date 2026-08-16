import React from 'react';
import WishlistClient from './WishlistClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.abkharido.com';

export const metadata = {
  title: 'My Wishlist | AbKharido',
  description: 'View and manage items saved to your AbKharido wishlist.',
  alternates: {
    canonical: `${SITE_URL}/wishlist`,
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function WishlistPage() {
  return <WishlistClient />;
}
