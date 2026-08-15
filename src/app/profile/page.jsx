import React from 'react';
import ProfileClient from './ProfileClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.abkharido.com';

export const metadata = {
  title: 'My Profile & Rewards Wallet | AbKharido',
  description: 'Manage saved addresses, view referral coins, update bank details for cashback payouts on AbKharido.',
  alternates: {
    canonical: `${SITE_URL}/profile`,
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function Page() {
  return <ProfileClient />;
}
