import React from 'react';
import CatalogClient from './CatalogClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.abkharido.com';

export async function generateMetadata({ searchParams }) {
  const params = await searchParams;
  const category = params?.category;
  const search = params?.search;

  let title = 'Explore All Products | AbKharido';
  let description = 'Shop thousands of genuine verified products across Electronics, Mobiles, Fashion, and Home appliances with express shipping across India.';

  if (search) {
    title = `Search results for "${search}" | AbKharido`;
    description = `Explore top deals and verified items matching "${search}" on AbKharido.`;
  } else if (category && category !== 'all') {
    const formattedCat = category.charAt(0).toUpperCase() + category.slice(1);
    title = `${formattedCat} Store - Best Deals Online | AbKharido`;
    description = `Shop the latest ${formattedCat} online with exclusive discounts, express delivery, and cash on delivery on AbKharido.`;
  }

  const canonicalUrl = `${SITE_URL}/catalog${category ? `?category=${category}` : ''}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'AbKharido',
      type: 'website',
      images: [
        {
          url: `${SITE_URL}/logo.jpg`,
          width: 800,
          height: 800,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${SITE_URL}/logo.jpg`],
    },
  };
}

export default async function Page({ searchParams }) {
  const params = await searchParams;
  const category = params?.category || 'all';
  const search = params?.search || '';

  return <CatalogClient initialCategory={category} initialSearch={search} />;
}
