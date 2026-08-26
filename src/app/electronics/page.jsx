import React from 'react';
import Link from 'next/link';
import CatalogClient from '../catalog/CatalogClient';
import { PRODUCTS } from '../../db/mockData.js';
import connectDB from '../../../server/config/db.js';
import Product from '../../../server/models/Product.js';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.abkharido.com';

export const revalidate = 300;

async function getElectronicsProducts() {
  try {
    await connectDB();
    const products = await Product.find({ category: { $in: ['electronics', 'mobiles'] } }).limit(60).lean();
    if (products && products.length > 0) return JSON.parse(JSON.stringify(products));
  } catch (_e) {}
  return JSON.parse(JSON.stringify(PRODUCTS.filter(p => ['electronics', 'mobiles'].includes(p.category))));
}

export const metadata = {
  title: 'Buy Electronics Online India — Best Deals with Free Delivery | AbKharido',
  description: 'Shop the best electronics online in India — smartphones, laptops, smartwatches, earbuds, tablets & more. Free express delivery, 7-day returns, Cash on Delivery on AbKharido.',
  metadataBase: new URL(SITE_URL),
  keywords: ['buy electronics online india', 'electronics sale india', 'best electronics deals', 'smartphones online india', 'laptops online india', 'earbuds india', 'smartwatch india'],
  alternates: { canonical: `${SITE_URL}/electronics` },
  openGraph: {
    title: 'Electronics Store India — Free Delivery & 7-Day Returns | AbKharido',
    description: 'India\'s best electronics deals. Genuine smartphones, laptops, earbuds, smartwatches with free express delivery pan-India.',
    url: `${SITE_URL}/electronics`,
    siteName: 'AbKharido',
    locale: 'en_IN',
    type: 'website',
    images: [{ url: `${SITE_URL}/logo.jpg`, width: 1200, height: 630, alt: 'AbKharido Electronics Store India' }]
  }
};

export default async function ElectronicsPage() {
  const products = await getElectronicsProducts();

  const categorySchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Electronics Store India — AbKharido',
    description: 'Shop the best electronics online in India with free delivery and 7-day returns.',
    url: `${SITE_URL}/electronics`,
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Electronics', item: `${SITE_URL}/electronics` }
      ]
    }
  };

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Best Electronics in India 2026 | AbKharido',
    url: `${SITE_URL}/electronics`,
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

      <CatalogClient initialCategory="electronics" initialSearch="" initialProducts={products} />
    </>
  );
}

