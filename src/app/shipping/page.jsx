import React from 'react';
import InfoPage from '../../views/InfoPage';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.abkharido.com';

export const metadata = {
  title: 'Shipping & Delivery Policy — 2-5 Days Dispatch',
  description: 'Learn about AbKharido shipping timelines, free delivery on orders ₹499 and above (₹40 under ₹499), courier partners (NimbusPost, BlueDart, Delhivery), and live tracking.',
  alternates: {
    canonical: `${SITE_URL}/shipping`
  },
  openGraph: {
    title: 'Shipping & Delivery Policy | AbKharido Pan-India Delivery',
    description: 'Standard 2-5 day delivery across 29,000+ Indian pincodes. Free shipping on orders ₹499+.',
    url: `${SITE_URL}/shipping`,
    siteName: 'AbKharido',
    locale: 'en_IN',
    type: 'website'
  }
};

export default function ShippingPage() {
  const shippingSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Shipping & Delivery Policy',
    url: `${SITE_URL}/shipping`,
    description: 'Detailed shipping charges, delivery timeframes, and fulfillment information for AbKharido.',
    publisher: {
      '@type': 'Organization',
      name: 'AbKharido Retail Private Limited',
      url: SITE_URL
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(shippingSchema) }}
      />
      <InfoPage infoType="shipping" />
    </>
  );
}
