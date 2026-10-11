import React from 'react';
import InfoPage from '../../views/InfoPage';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.abkharido.com';

export const metadata = {
  title: 'About Us — Direct Buy & Earn Marketplace',
  description: 'Learn about AbKharido.com, India\'s direct-to-consumer e-commerce destination for quality verified electronics, fashion, and lifestyle products with reliable courier dispatch.',
  alternates: {
    canonical: `${SITE_URL}/about`
  },
  openGraph: {
    title: 'About Us — India\'s Online Shopping Destination',
    description: 'Direct quality assurance, 2-5 day courier dispatch, 7-day returns, and rewarding community commerce.',
    url: `${SITE_URL}/about`,
    siteName: 'AbKharido',
    locale: 'en_IN',
    type: 'website'
  }
};

export default function AboutPage() {
  const aboutSchema = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'About AbKharido',
    url: `${SITE_URL}/about`,
    mainEntity: {
      '@type': 'Organization',
      name: 'AbKharido Retail Private Limited',
      url: SITE_URL,
      logo: `${SITE_URL}/logo.jpg`,
      foundingDate: '2026',
      founders: [{ '@type': 'Person', name: 'AbKharido Leadership Team' }],
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Palghar',
        addressLocality: 'Palghar',
        addressRegion: 'Maharashtra',
        postalCode: '401404',
        addressCountry: 'IN'
      }
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutSchema) }}
      />
      <InfoPage infoType="about" />
    </>
  );
}
