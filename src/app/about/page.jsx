import React from 'react';
import InfoPage from '../../views/InfoPage';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.abkharido.com';

export const metadata = {
  title: 'About Us | AbKharido India - Direct Buy & Earn Marketplace',
  description: 'Learn about AbKharido.com, India\'s premier direct-to-consumer e-commerce destination for verified electronics, fashion, and lifestyle products with genuine brand warranty.',
  alternates: {
    canonical: `${SITE_URL}/about`
  },
  openGraph: {
    title: 'About AbKharido.com | India\'s Premium Online Shopping Destination',
    description: '100% genuine brand warranty, express warehouse shipping, and rewarding community commerce.',
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
        streetAddress: 'Outer Ring Road, Devarabeesanahalli',
        addressLocality: 'Bengaluru',
        addressRegion: 'Karnataka',
        postalCode: '560103',
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
