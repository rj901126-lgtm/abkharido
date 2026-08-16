import React from 'react';
import CompareClient from './CompareClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.abkharido.com';

export const metadata = {
  title: 'Compare Products Side-by-Side | AbKharido',
  description: 'Compare prices, ratings, technical specifications, and key features of up to 4 products side-by-side on AbKharido.',
  alternates: {
    canonical: `${SITE_URL}/compare`,
  },
  openGraph: {
    title: 'Compare Products Side-by-Side | AbKharido',
    description: 'Compare prices, technical specifications, and customer ratings on AbKharido.',
    url: `${SITE_URL}/compare`,
    siteName: 'AbKharido',
    type: 'website',
    images: [`${SITE_URL}/logo.jpg`],
  },
};

export default async function Page({ searchParams }) {
  const params = await searchParams;
  const idsStr = params?.ids || '';
  const initialIds = idsStr ? idsStr.split(',').filter(Boolean) : [];

  return <CompareClient initialProductIds={initialIds} />;
}
