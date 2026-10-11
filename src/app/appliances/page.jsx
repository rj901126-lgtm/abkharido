import React from 'react';
import CatalogClient from '../catalog/CatalogClient';
import { PRODUCTS } from '../../db/mockData.js';
import connectDB from '../../../server/config/db.js';
import Product from '../../../server/models/Product.js';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.abkharido.com';

export const revalidate = 300;

async function getAppliancesProducts() {
  try {
    await connectDB();
    const products = await Product.find({
      category: { $in: ['appliances', 'home'] },
      status: { $in: ['published', 'active'], $ne: 'archived' },
      isArchived: { $ne: true }
    }).limit(60).lean();
    if (products && products.length > 0) return JSON.parse(JSON.stringify(products));
  } catch (_e) {}
  return JSON.parse(JSON.stringify(PRODUCTS.filter(p => ['appliances', 'home'].includes(p.category) && (p.status === 'published' || p.status === 'active') && !p.isArchived)));
}

export const metadata = {
  title: 'Buy Home & Living Products Online India — Best Deals',
  description: 'Shop home utilities and small appliances online in India. Quality checked direct inventory, standard courier delivery & 7-day returns on AbKharido.',
  metadataBase: new URL(SITE_URL),
  keywords: ['buy home living online india', 'home appliances india', 'kitchen utilities india', 'abkharido home'],
  alternates: { canonical: `${SITE_URL}/appliances` },
  openGraph: {
    title: 'Home & Living Products Store India — Reliable Delivery',
    description: 'Home and utility essentials. Standard 2-5 day courier delivery and easy 7-day returns.',
    url: `${SITE_URL}/appliances`,
    siteName: 'AbKharido',
    locale: 'en_IN',
    type: 'website',
    images: [{ url: `${SITE_URL}/logo.jpg`, width: 1200, height: 630, alt: 'AbKharido Home Store India' }]
  }
};

export default async function AppliancesPage() {
  const products = await getAppliancesProducts();

  const categorySchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Home & Kitchen Appliances Store India — AbKharido',
    description: 'Shop the best appliances online in India with free delivery and 1-year brand warranty.',
    url: `${SITE_URL}/appliances`,
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Appliances', item: `${SITE_URL}/appliances` }
      ]
    }
  };

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Best Home & Kitchen Appliances in India 2026 | AbKharido',
    url: `${SITE_URL}/appliances`,
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

      <CatalogClient initialCategory="appliances" initialSearch="" initialProducts={products} />
    </>
  );
}
