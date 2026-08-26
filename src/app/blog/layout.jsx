// Blog layout — metadata lives here (server component) so it works with 'use client' page
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.abkharido.com';

export const metadata = {
  title: 'Shopping Guides & Buying Advice | AbKharido Blog',
  metadataBase: new URL(SITE_URL),
  description: 'Expert buying guides, product comparisons, and online shopping tips for India. Best smartwatches, earbuds, mobiles, and more — researched and reviewed by AbKharido editorial team.',
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: {
    title: 'AbKharido Blog — Best Buying Guides & Shopping Tips India 2026',
    description: 'In-depth reviews, comparisons, and shopping advice for Indian consumers. Smartwatches, earbuds, mobiles, fashion, and more.',
    url: `${SITE_URL}/blog`,
    siteName: 'AbKharido',
    locale: 'en_IN',
    type: 'website',
    images: [{ url: `${SITE_URL}/logo.jpg`, width: 1200, height: 630, alt: 'AbKharido Blog' }]
  }
};

export default function BlogLayout({ children }) {
  return children;
}
