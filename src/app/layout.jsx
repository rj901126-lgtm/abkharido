import React, { Suspense } from 'react';
import { AppProvider } from '../context/AppContext';
import ClientLayout from '../components/ClientLayout'; // We will create this for client-side layout features
import NextAuthProvider from '../components/NextAuthProvider';
import Script from 'next/script';

import '../index.css';
import '../App.css';

export const metadata = {
  title: "AbKharido | India's Premium E-Commerce Destination",
  description: "Shop the best deals on Electronics, Fashion, Home Appliances, and Mobiles at AbKharido. Fast shipping, easy returns, and secure payments.",
  keywords: "abkharido, e-commerce, india shopping, electronics, fashion, buy online",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#4f46e5',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#4f46e5" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/logo.jpg" />
      </head>
      <body>
        <Script src="https://sdk.cashfree.com/js/v3/cashfree.js" strategy="beforeInteractive" />
        <NextAuthProvider>
          <AppProvider>
            <Suspense fallback={null}>
              <ClientLayout>{children}</ClientLayout>
            </Suspense>
          </AppProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
