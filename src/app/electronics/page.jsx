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

      {/* SEO Hero — Rich text block that Amazon/Flipkart don't have */}
      <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4f46e5 100%)', color: '#fff', padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          {/* Breadcrumb */}
          <nav style={{ display: 'flex', justifyContent: 'center', gap: 8, fontSize: 13, opacity: 0.7, marginBottom: 16 }}>
            <Link href="/" style={{ color: '#fff', textDecoration: 'none' }}>Home</Link>
            <span>›</span>
            <span>Electronics</span>
          </nav>
          <h1 style={{ fontSize: 'clamp(24px, 5vw, 42px)', fontWeight: 900, margin: '0 0 12px', lineHeight: 1.2 }}>
            Electronics Store India 🇮🇳
          </h1>
          <p style={{ fontSize: 17, opacity: 0.85, margin: '0 0 20px', lineHeight: 1.7 }}>
            Shop verified smartphones, smartwatches, earbuds, laptops & more — with <strong>Free Express Delivery</strong> across 29,000+ pincodes, <strong>7-Day Doorstep Returns</strong>, and <strong>Cash on Delivery</strong>.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['📱 Smartphones', '⌚ Smartwatches', '🎧 Earbuds', '💻 Laptops', '📷 Cameras'].map(tag => (
              <span key={tag} style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 99, padding: '6px 14px', fontSize: 13, fontWeight: 600 }}>{tag}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Editorial Content — Topical Authority Block */}
      <div style={{ background: '#f8fafc', padding: '32px 24px', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: '0 0 12px' }}>
            Why Buy Electronics from AbKharido?
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {[
              { icon: '✅', title: '100% Genuine', desc: 'Every product verified before dispatch' },
              { icon: '🚀', title: 'Express 24h Delivery', desc: 'Same-day delivery in metro cities' },
              { icon: '🔄', title: '7-Day Free Returns', desc: 'Doorstep pickup, zero questions' },
              { icon: '💳', title: 'COD Available', desc: 'Pay on delivery, up to ₹15,000' },
              { icon: '🏷️', title: 'Best Price Guarantee', desc: 'No hidden charges, transparent pricing' },
              { icon: '🛡️', title: 'Brand Warranty', desc: 'Full manufacturer warranty on all items' }
            ].map(f => (
              <div key={f.title} style={{ background: '#fff', borderRadius: 12, padding: '16px', border: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{f.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#111827', marginBottom: 4 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: '#6b7280' }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <CatalogClient initialCategory="electronics" initialSearch="" initialProducts={products} />
    </>
  );
}
