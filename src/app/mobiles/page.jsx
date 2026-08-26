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

      {/* SEO Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0284c7 100%)', color: '#fff', padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <nav style={{ display: 'flex', justifyContent: 'center', gap: 8, fontSize: 13, opacity: 0.7, marginBottom: 16 }}>
            <Link href="/" style={{ color: '#fff', textDecoration: 'none' }}>Home</Link>
            <span>›</span>
            <span>Mobiles</span>
          </nav>
          <h1 style={{ fontSize: 'clamp(24px, 5vw, 42px)', fontWeight: 900, margin: '0 0 12px', lineHeight: 1.2 }}>
            Mobile Phones Online India 📱
          </h1>
          <p style={{ fontSize: 17, opacity: 0.85, margin: '0 0 20px', lineHeight: 1.7 }}>
            Buy the latest iPhones, Samsung Galaxy, OnePlus, realme & Redmi phones at the <strong>best price in India</strong>. Free express delivery, 7-day returns, Cash on Delivery.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['📱 iPhone', '🌟 Samsung', '⚡ OnePlus', '🎯 realme', '🔥 Redmi'].map(tag => (
              <span key={tag} style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 99, padding: '6px 14px', fontSize: 13, fontWeight: 600 }}>{tag}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Topical Authority Block */}
      <div style={{ background: '#f8fafc', padding: '28px 24px', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: '0 0 12px' }}>
            Why Buy Smartphones from AbKharido?
          </h2>
          <p style={{ fontSize: 15, color: '#4b5563', lineHeight: 1.7, maxWidth: 700, margin: '0 0 20px' }}>
            Unlike grey-market resellers, AbKharido sources directly from authorized brand distributors.
            Every smartphone comes with a <strong>full manufacturer warranty</strong>, Indian charger included,
            BIS certification, and the same genuine sealed box you'd get at an Apple Store or Samsung Galaxy Studio.
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {['✅ IMEI Verified', '📦 Original Sealed Box', '🔋 Indian Charger Included', '🛡️ Full Warranty', '🔄 7-Day Returns'].map(f => (
              <span key={f} style={{ background: '#e0f2fe', color: '#0369a1', borderRadius: 99, padding: '6px 14px', fontSize: 13, fontWeight: 600 }}>{f}</span>
            ))}
          </div>
        </div>
      </div>

      <CatalogClient initialCategory="mobiles" initialSearch="" initialProducts={products} />
    </>
  );
}
