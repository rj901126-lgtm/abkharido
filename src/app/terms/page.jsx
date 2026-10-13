import { serializeJsonLd } from '../../utils/safeRendering.js';
import React from 'react';
import InfoPage from '../../views/InfoPage';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.abkharido.com';

export const metadata = {
  title: 'Terms of Use & Service Guidelines',
  description: 'Read the official Terms of Use, account security standards, and electronic transaction terms for AbKharido.com (AbKharido Retail Private Limited).',
  alternates: {
    canonical: `${SITE_URL}/terms`
  },
  openGraph: {
    title: 'Terms of Use & Guidelines',
    description: 'Official user terms, transaction guidelines, and affiliate compliance policies on AbKharido.',
    url: `${SITE_URL}/terms`,
    siteName: 'AbKharido',
    locale: 'en_IN',
    type: 'website'
  }
};

export default function TermsPage() {
  const termsSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Terms of Use & Guidelines',
    url: `${SITE_URL}/terms`,
    description: 'Terms of use and electronic contract guidelines for AbKharido.com.',
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
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(termsSchema) }}
      />
      <InfoPage infoType="terms" />
    </>
  );
}
