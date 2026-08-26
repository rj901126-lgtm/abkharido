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
    default: "AbKharido | India's #1 Premium E-Commerce & Online Shopping Destination",
    template: "%s | AbKharido"
  },
  description: "Shop 100% verified genuine electronics, flagship smartphones, luxury designer fashion, audio gear and home appliances at AbKharido. Express 24-48h Delivery across 29,000+ Indian pincodes, 7-day doorstep returns, Cash on Delivery (COD) and 0% EMI.",
  keywords: [
    "abkharido", "ab kharido", "online shopping india", "best online shopping site in india",
    "buy smartphones online", "flagship mobile phones best price", "electronics sale india",
    "designer fashion buy online", "cash on delivery shopping", "fast delivery ecommerce india",
    "cheap online shopping with free delivery", "authentic brand warranty india", "biker jackets online",
    "smartwatches discounts", "wireless earbuds best price"
  ],
  authors: [{ name: 'AbKharido India Retail Private Limited', url: SITE_URL }],
  creator: 'AbKharido',
  publisher: 'AbKharido Retail Private Limited',
  applicationName: 'AbKharido',
  category: 'ecommerce',
  classification: 'Online Shopping, Electronics, Fashion, Retail',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
    languages: {
      'en-IN': '/',
      'hi-IN': '/'
    }
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: SITE_URL,
    siteName: 'AbKharido',
    title: "AbKharido | India's #1 Premium E-Commerce Destination",
    description: "Shop verified smartphones, designer apparel, premium audio, and lifestyle gear. Lightning-fast express delivery, 7-day returns, Cash on Delivery.",
    images: [
      {
        url: `${SITE_URL}/logo.jpg`,
        width: 1200,
        height: 630,
        alt: 'AbKharido - Online Shopping India',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "AbKharido | India's #1 Premium E-Commerce Destination",
    description: "Shop verified electronics, fashion, and lifestyle. Fast shipping, 7-day returns, secure payments.",
    images: [`${SITE_URL}/logo.jpg`],
    creator: '@abkharido',
  },
  other: {
    'geo.region': 'IN',
    'geo.placename': 'India',
    'geo.position': '19.0760;72.8777',
    'ICBM': '19.0760, 72.8777',
    'rating': 'general',
    'distribution': 'global',
    'revisit-after': '1 days'
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
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ? {
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    }
  } : {})
};

// Fix WCAG 1.4.4 & Lighthouse Accessibility: Allow user-scaling & pinch-to-zoom
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#4f46e5',
};

export default function RootLayout({ children }) {
  const structuredData = [
    // WebSite — enables Google Search sitelinks searchbox
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'AbKharido',
      alternateName: ['Ab Kharido', 'AbKharido India', 'AbKharido Online Shopping'],
      url: SITE_URL,
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/catalog?search={search_term_string}` },
        'query-input': 'required name=search_term_string',
      },
    },
    // Organization — full corporate identity for Google Knowledge Panel
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'AbKharido Retail Private Limited',
      legalName: 'AbKharido Retail Private Limited',
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.jpg`,
        width: 512,
        height: 512,
        caption: 'AbKharido — India\'s Online Shopping Marketplace'
      },
      image: `${SITE_URL}/logo.jpg`,
      description: 'AbKharido is India\'s premier direct-to-consumer e-commerce marketplace offering genuine electronics, smartphones, fashion and lifestyle products with free delivery pan-India.',
      foundingDate: '2026',
      numberOfEmployees: { '@type': 'QuantitativeValue', value: 50 },
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Outer Ring Road, Devarabeesanahalli',
        addressLocality: 'Bengaluru',
        addressRegion: 'Karnataka',
        postalCode: '560103',
        addressCountry: 'IN'
      },
      contactPoint: [
        {
          '@type': 'ContactPoint',
          telephone: '+91-9172600587',
          contactType: 'customer service',
          contactOption: 'TollFree',
          areaServed: 'IN',
          availableLanguage: ['en', 'Hindi'],
          hoursAvailable: {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            opens: '09:00',
            closes: '21:00'
          }
        },
        {
          '@type': 'ContactPoint',
          email: 'help@abkharido.com',
          contactType: 'customer support',
          areaServed: 'IN'
        }
      ],
      sameAs: [
        'https://twitter.com/abkharido',
        'https://www.instagram.com/abkharido',
        'https://www.facebook.com/abkharido',
        'https://www.youtube.com/@abkharido'
      ]
    },
    // OnlineStore (LocalBusiness sub-type) — full Indian merchant data
    {
      '@context': 'https://schema.org',
      '@type': ['Store', 'OnlineStore'],
      '@id': `${SITE_URL}/#store`,
      name: 'AbKharido India — Online Shopping',
      url: SITE_URL,
      image: `${SITE_URL}/logo.jpg`,
      description: 'India\'s trusted online shopping destination. Free delivery across 29,000+ pincodes. Electronics, smartphones, fashion, and home products with genuine warranty.',
      priceRange: '₹99 - ₹1,99,999',
      currenciesAccepted: 'INR',
      paymentAccepted: 'Cash on Delivery, UPI, Credit Card, Debit Card, Net Banking, EMI',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Outer Ring Road, Devarabeesanahalli',
        addressLocality: 'Bengaluru',
        addressRegion: 'Karnataka',
        postalCode: '560103',
        addressCountry: 'IN'
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: 12.9716,
        longitude: 77.5946
      },
      areaServed: [
        { '@type': 'Country', name: 'India' },
        { '@type': 'City', name: 'Mumbai' },
        { '@type': 'City', name: 'Delhi' },
        { '@type': 'City', name: 'Bengaluru' },
        { '@type': 'City', name: 'Hyderabad' },
        { '@type': 'City', name: 'Chennai' },
        { '@type': 'City', name: 'Kolkata' },
        { '@type': 'City', name: 'Pune' },
        { '@type': 'City', name: 'Ahmedabad' }
      ],
      openingHoursSpecification: [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          opens: '00:00',
          closes: '23:59'
        }
      ],
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'AbKharido Products',
        itemListElement: [
          { '@type': 'OfferCatalog', name: 'Electronics & Smartphones' },
          { '@type': 'OfferCatalog', name: 'Fashion & Apparel' },
          { '@type': 'OfferCatalog', name: 'Home & Living' },
          { '@type': 'OfferCatalog', name: 'Appliances' }
        ]
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: 4.6,
        reviewCount: 12847,
        bestRating: 5,
        worstRating: 1
      }
    }
  ];

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/logo.jpg" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        {/* Google Fonts — zero CLS via display=swap */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* DNS prefetch for all third-party services */}
        <link rel="dns-prefetch" href="https://sdk.cashfree.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        {/* Canonical self-referencing alternate */}
        <link rel="alternate" hrefLang="en-IN" href={SITE_URL} />
        <link rel="alternate" hrefLang="hi-IN" href={SITE_URL} />
        <link rel="alternate" hrefLang="x-default" href={SITE_URL} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body suppressHydrationWarning>
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

