import React from 'react';
import InfoPage from '../../views/InfoPage';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.abkharido.com';

export const metadata = {
  title: 'Privacy Policy & Data Security',
  description: 'Understand how AbKharido protects customer data, order details, mobile numbers, and payment transactions with Cashfree bank-grade encryption.',
  alternates: {
    canonical: `${SITE_URL}/privacy`
  },
  openGraph: {
    title: 'Privacy Policy & Customer Protection',
    description: 'Learn about our data privacy practices, secure payment isolation, and referral code privacy protection.',
    url: `${SITE_URL}/privacy`,
    siteName: 'AbKharido',
    locale: 'en_IN',
    type: 'website'
  }
};

export default function PrivacyPage() {
  const privacySchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Privacy Policy',
    url: `${SITE_URL}/privacy`,
    description: 'Data privacy and security standards for AbKharido customers.',
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(privacySchema) }}
      />
      <InfoPage infoType="privacy" />
    </>
  );
}
