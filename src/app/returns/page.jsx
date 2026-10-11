import React from 'react';
import InfoPage from '../../views/InfoPage';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.abkharido.com';

export const metadata = {
  title: '7-Day Return & Replacement Policy',
  description: 'Easy 7-day doorstep replacement and return guarantee on electronics, mobiles, and fashion items purchased from AbKharido. Fast refund processing via original payment method.',
  alternates: {
    canonical: `${SITE_URL}/returns`
  },
  openGraph: {
    title: '7-Day Return & Replacement Policy',
    description: 'Hassle-free 7-day returns, doorstep courier pickup, and fast refunds on verified orders.',
    url: `${SITE_URL}/returns`,
    siteName: 'AbKharido',
    locale: 'en_IN',
    type: 'website'
  }
};

export default function ReturnsPage() {
  const returnsSchema = {
    '@context': 'https://schema.org',
    '@type': 'MerchantReturnPolicy',
    name: 'AbKharido 7-Day Return & Replacement Policy',
    url: `${SITE_URL}/returns`,
    applicableCountry: 'IN',
    returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
    merchantReturnDays: 7,
    returnMethod: 'https://schema.org/ReturnAtKiosk',
    returnFees: 'https://schema.org/FreeReturn',
    customerRemorseReturnFees: 'https://schema.org/FreeReturn'
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(returnsSchema) }}
      />
      <InfoPage infoType="returns" />
    </>
  );
}
