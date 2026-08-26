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

      {/* SEO Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0c0a09 0%, #292524 50%, #44403c 100%)', color: '#fff', padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <nav style={{ display: 'flex', justifyContent: 'center', gap: 8, fontSize: 13, opacity: 0.7, marginBottom: 16 }}>
            <Link href="/" style={{ color: '#fff', textDecoration: 'none' }}>Home</Link>
            <span>›</span>
            <span>Fashion</span>
          </nav>
          <h1 style={{ fontSize: 'clamp(24px, 5vw, 42px)', fontWeight: 900, margin: '0 0 12px', lineHeight: 1.2 }}>
            Fashion Store India 👗
          </h1>
          <p style={{ fontSize: 17, opacity: 0.85, margin: '0 0 20px', lineHeight: 1.7 }}>
            Shop premium leather biker jackets, streetwear, sneakers, and apparel — with <strong>Free Express Delivery</strong> and <strong>7-Day Hassle-Free Returns</strong> across India.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['🧥 Jackets', '👟 Sneakers', '👕 Streetwear', '👜 Bags', '👒 Accessories'].map(tag => (
              <span key={tag} style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 99, padding: '6px 14px', fontSize: 13, fontWeight: 600 }}>{tag}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Topical Block */}
      <div style={{ background: '#fafaf9', padding: '28px 24px', borderBottom: '1px solid #e7e5e4' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: '0 0 12px' }}>
            AbKharido Fashion — Why It's Different
          </h2>
          <p style={{ fontSize: 15, color: '#4b5563', lineHeight: 1.7, maxWidth: 700, margin: '0 0 16px' }}>
            We don't carry fast fashion. Every garment on AbKharido is selected for <strong>material quality, stitching precision, and lasting style</strong>. Our biker jackets are genuine vegetable-tanned leather; our streetwear uses GSM 280+ heavyweight cotton. Size charts are accurate — your returns will be rare.
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {['✅ Premium Materials', '📏 Accurate Size Charts', '🔄 Free 7-Day Returns', '🚀 Same-Day Metro Delivery', '💳 COD Available'].map(f => (
              <span key={f} style={{ background: '#f5f5f4', color: '#44403c', borderRadius: 99, padding: '6px 14px', fontSize: 13, fontWeight: 600, border: '1px solid #e7e5e4' }}>{f}</span>
            ))}
          </div>
        </div>
      </div>

      <CatalogClient initialCategory="fashion" initialSearch="" initialProducts={products} />
    </>
  );
}
