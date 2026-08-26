import React from 'react';
import Link from 'next/link';
import CatalogClient from '../catalog/CatalogClient';
import { PRODUCTS } from '../../db/mockData.js';
import connectDB from '../../../server/config/db.js';
import Product from '../../../server/models/Product.js';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.abkharido.com';

export const revalidate = 300;

async function getMobilesProducts() {
  try {
    await connectDB();
    const products = await Product.find({ category: 'mobiles' }).limit(60).lean();
    if (products && products.length > 0) return JSON.parse(JSON.stringify(products));
  } catch (_e) {}
  return JSON.parse(JSON.stringify(PRODUCTS.filter(p => p.category === 'mobiles')));
}

export const metadata = {
  title: 'Buy Mobile Phones Online India — Best Smartphones 2026 | AbKharido',
  description: 'Buy the latest smartphones online in India. iPhone, Samsung, OnePlus, realme — compare prices, read reviews, free delivery & 7-day returns at AbKharido.',
  metadataBase: new URL(SITE_URL),
  keywords: ['buy mobile phones online india', 'best smartphones india 2026', 'latest mobile phones india', 'iphone india price', 'samsung phone online india', 'mobile phones free delivery'],
  alternates: { canonical: `${SITE_URL}/mobiles` },
  openGraph: {
    title: 'Buy Mobile Phones Online India — Best Price 2026 | AbKharido',
    description: 'Latest smartphones at the best price in India. iPhone, Samsung, OnePlus — free express delivery & COD.',
    url: `${SITE_URL}/mobiles`,
    siteName: 'AbKharido',
    locale: 'en_IN',
    type: 'website',
    images: [{ url: `${SITE_URL}/logo.jpg`, width: 1200, height: 630, alt: 'Buy Mobiles Online India — AbKharido' }]
  }
};

export default async function MobilesPage() {
  const products = await getMobilesProducts();

  const categorySchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Buy Mobile Phones Online India — AbKharido',
    description: 'Shop the latest smartphones in India with free delivery and genuine brand warranty.',
    url: `${SITE_URL}/mobiles`,
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Mobiles', item: `${SITE_URL}/mobiles` }
      ]
    }
  };

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Best Smartphones in India 2026 | AbKharido',
    url: `${SITE_URL}/mobiles`,
    numberOfItems: products.length,
    itemListElement: products.slice(0, 20).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: p.name,
      url: `${SITE_URL}/product/${p.id || p._id}`,
      image: p.image || (p.images && p.images[0]),
      offers: { '@type': 'Offer', priceCurrency: 'INR', price: p.price || 0, availability: 'https://schema.org/InStock' }
    }))
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(categorySchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />

      <CatalogClient initialCategory="mobiles" initialSearch="" initialProducts={products} />
    </>
  );
}

