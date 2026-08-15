import React from 'react';
import PartnerClient from './PartnerClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.abkharido.com';

export const metadata = {
  title: 'Creator & Affiliate Partner Program | AbKharido',
  description: 'Join the AbKharido Creator Economy. Share authentic product links on WhatsApp and Instagram to earn direct bank cashbacks up to 12%.',
  alternates: {
    canonical: `${SITE_URL}/partner`,
  },
  openGraph: {
    title: 'Monetize Your Digital Influence | AbKharido Partner Center',
    description: 'Earn automated weekly bank payouts by sharing verified store links.',
    url: `${SITE_URL}/partner`,
    siteName: 'AbKharido',
    type: 'website',
    images: [`${SITE_URL}/logo.jpg`],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AbKharido Partner & Creator Program',
    description: 'Earn automated weekly cash payouts by sharing verified store links.',
    images: [`${SITE_URL}/logo.jpg`],
  },
};

export default function Page() {
  return <PartnerClient />;
}
