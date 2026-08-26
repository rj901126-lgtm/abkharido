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
    const products = await Product.find({ category: { $in: ['appliances', 'home'] } }).limit(60).lean();
    if (products && products.length > 0) return JSON.parse(JSON.stringify(products));
  } catch (_e) {}
  return JSON.parse(JSON.stringify(PRODUCTS.filter(p => ['appliances', 'home'].includes(p.category))));
}

export const metadata = {
  title: 'Buy Home & Kitchen Appliances Online India — Best Deals | AbKharido',
  description: 'Shop smart refrigerators, front-load washing machines, 5-star split ACs, air fryers & microwave ovens online in India. Free brand installation & warranty on AbKharido.',
  metadataBase: new URL(SITE_URL),
  keywords: ['buy appliances online india', 'refrigerators online india', 'washing machine sale india', 'split inverter ac best price', 'kitchen appliances india', 'abkharido appliances'],
  alternates: { canonical: `${SITE_URL}/appliances` },
  openGraph: {
    title: 'Home & Kitchen Appliances Store India — Free Delivery & Warranty | AbKharido',
    description: 'India\'s top large and kitchen appliances deals. Smart refrigerators, washing machines, ACs & microwaves with free delivery and brand warranty.',
    url: `${SITE_URL}/appliances`,
    siteName: 'AbKharido',
    locale: 'en_IN',
    type: 'website',
    images: [{ url: `${SITE_URL}/logo.jpg`, width: 1200, height: 630, alt: 'AbKharido Appliances Store India' }]
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
