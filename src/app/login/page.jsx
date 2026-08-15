import React from 'react';
import LoginClient from './LoginClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.abkharido.com';

export const metadata = {
  title: 'Sign In / Register | AbKharido',
  description: 'Log in to your AbKharido account using SMS OTP, Google, or password to track orders, manage wallet coins, and earn rewards.',
  alternates: {
    canonical: `${SITE_URL}/login`,
  },
};

export default function LoginPage() {
  return <LoginClient />;
}
