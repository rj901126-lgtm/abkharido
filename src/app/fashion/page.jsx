import React from 'react';
import Link from 'next/link';
import CatalogClient from '../catalog/CatalogClient';
import { PRODUCTS } from '../../db/mockData.js';
import connectDB from '../../../server/config/db.js';
import Product from '../../../server/models/Product.js';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.abkharido.com';

export const revalidate = 300;

async function getFashionProducts() {
  try {
    await connectDB();
    const products = await Product.find({ category: 'fashion' }).limit(60).lean();
    if (products && products.length > 0) return JSON.parse(JSON.stringify(products));
  } catch (_e) {}
  return JSON.parse(JSON.stringify(PRODUCTS.filter(p => p.category === 'fashion')));
}

export const metadata = {
  title: 'Buy Fashion Online India — Biker Jackets, Streetwear & More | AbKharido',
  description: 'Shop trendy fashion online India — leather biker jackets, streetwear, sneakers & more. Free delivery, 7-day free returns, Cash on Delivery at AbKharido.',
  metadataBase: new URL(SITE_URL),
  keywords: ['buy fashion online india', 'biker jacket online india', 'leather jacket india', 'streetwear india online', 'fashion sale india free delivery', 'buy clothes online cash on delivery'],
  alternates: { canonical: `${SITE_URL}/fashion` },
  openGraph: {
    title: 'Fashion Store India — Free Delivery & Returns | AbKharido',
    description: 'Shop India\'s trendiest fashion — jackets, footwear, streetwear. Free express delivery, 7-day returns, COD.',
    url: `${SITE_URL}/fashion`,
    siteName: 'AbKharido',
    locale: 'en_IN',
    type: 'website',
    images: [{ url: `${SITE_URL}/logo.jpg`, width: 1200, height: 630, alt: 'AbKharido Fashion Store India' }]
  }
};

export default async function FashionPage() {
  const products = await getFashionProducts();

  const categorySchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Fashion Store India — AbKharido',
    description: 'Shop trending fashion online in India with free delivery and easy returns.',
    url: `${SITE_URL}/fashion`,
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Fashion', item: `${SITE_URL}/fashion` }
      ]
    }
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(categorySchema) }} />

      <CatalogClient initialCategory="fashion" initialSearch="" initialProducts={products} />
    </>
  );
}

