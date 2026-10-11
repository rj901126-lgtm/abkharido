import React from 'react';
import InfoPage from '../../views/InfoPage';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.abkharido.com';

export const metadata = {
  title: 'Contact Customer Support & Partnerships',
  description: 'Get in touch with AbKharido customer support via phone (+91 9172600587), WhatsApp, or email (support@abkharido.com). Registered office in Palghar, Maharashtra.',
  alternates: {
    canonical: `${SITE_URL}/contact`
  },
  openGraph: {
    title: 'Contact Support & Helpdesk',
    description: 'Direct phone, WhatsApp, and email support for orders, refunds, and partnerships.',
    url: `${SITE_URL}/contact`,
    siteName: 'AbKharido',
    locale: 'en_IN',
    type: 'website'
  }
};

export default function ContactPage() {
  const contactSchema = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Contact AbKharido Support',
    url: `${SITE_URL}/contact`,
    mainEntity: {
      '@type': 'Organization',
      name: 'AbKharido Retail Private Limited',
      url: SITE_URL,
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+91-9172600587',
        contactType: 'customer service',
        areaServed: 'IN',
        availableLanguage: ['en', 'Hindi'],
        hoursAvailable: {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
          opens: '09:00',
          closes: '21:00'
        }
      },
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactSchema) }}
      />
      <InfoPage infoType="contact" />
    </>
  );
}
