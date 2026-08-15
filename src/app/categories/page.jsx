import React from 'react';
import CategoriesClient from './CategoriesClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.abkharido.com';

export const metadata = {
  title: 'All Categories - Explore Collections | AbKharido',
  description: 'Browse all categories on AbKharido: Mobiles, Electronics, Designer Fashion, Home Decor, Appliances, and more with huge daily savings.',
  alternates: {
    canonical: `${SITE_URL}/categories`,
  },
  openGraph: {
    title: 'Explore Collections & Categories | AbKharido',
    description: 'Browse all departments on AbKharido with express doorstep delivery across India.',
    url: `${SITE_URL}/categories`,
    siteName: 'AbKharido',
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/logo.jpg`,
        width: 800,
        height: 800,
        alt: 'AbKharido Categories',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Explore Collections & Categories | AbKharido',
    description: 'Browse all departments on AbKharido with express doorstep delivery.',
    images: [`${SITE_URL}/logo.jpg`],
  },
};

export default function Page() {
  return <CategoriesClient />;
}
