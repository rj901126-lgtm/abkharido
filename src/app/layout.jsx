import React, { Suspense } from 'react';
import { AppProvider } from '../context/AppContext';
import { LanguageProvider } from '../context/LanguageContext';
import ClientLayout from '../components/ClientLayout';
import NextAuthProvider from '../components/NextAuthProvider';
import Script from 'next/script';

import '../index.css';
import '../App.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.abkharido.com';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "AbKharido | India's Premium E-Commerce Destination",
    template: "%s | AbKharido"
  },
  description: "Shop verified electronics, flagship smartphones, designer fashion, and luxury appliances at AbKharido. Fast express delivery across India, 7-day easy returns, and secure payments.",
  keywords: ["abkharido", "e-commerce india", "online shopping", "smartphones", "electronics", "designer fashion", "buy online india"],
  authors: [{ name: 'AbKharido India' }],
  creator: 'AbKharido',
  publisher: 'AbKharido Retail Private Limited',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: SITE_URL,
    siteName: 'AbKharido',
    title: "AbKharido | India's Premium E-Commerce Destination",
    description: "Shop verified electronics, flagship smartphones, designer fashion, and luxury appliances at AbKharido. Fast express delivery across India, 7-day easy returns, and secure payments.",
    images: [
      {
        url: `${SITE_URL}/logo.jpg`,
        width: 800,
        height: 800,
        alt: 'AbKharido - Direct Buy & Earn',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "AbKharido | India's Premium E-Commerce Destination",
    description: "Shop verified electronics, flagship smartphones, designer fashion, and luxury appliances at AbKharido. Fast express delivery across India, 7-day easy returns, and secure payments.",
    images: [`${SITE_URL}/logo.jpg`],
    creator: '@abkharido',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'google-site-verification-placeholder',
  },
};

// Fix WCAG 1.4.4 & Lighthouse Accessibility: Allow user-scaling & pinch-to-zoom
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#4f46e5',
};

export default function RootLayout({ children }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'AbKharido',
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/catalog?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/logo.jpg" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <Script src="https://sdk.cashfree.com/js/v3/cashfree.js" strategy="beforeInteractive" />
        <NextAuthProvider>
          <AppProvider>
            <LanguageProvider>
              <Suspense fallback={null}>
                <ClientLayout>{children}</ClientLayout>
              </Suspense>
            </LanguageProvider>
          </AppProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
