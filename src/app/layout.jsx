import React from 'react';
import { AppProvider } from '../context/AppContext';
import ClientLayout from '../components/ClientLayout'; // We will create this for client-side layout features

import '../index.css';
import '../App.css';

export const metadata = {
  title: "AbKharido | India's Premium E-Commerce Destination",
  description: "Shop the best deals on Electronics, Fashion, Home Appliances, and Mobiles at AbKharido. Fast shipping, easy returns, and secure payments.",
  keywords: "abkharido, e-commerce, india shopping, electronics, fashion, buy online",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#4f46e5" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/logo.jpg" />
        <script src="https://sdk.cashfree.com/js/v3/cashfree.js" async></script>
      </head>
      <body>
        <AppProvider>
          <ClientLayout>{children}</ClientLayout>
        </AppProvider>
      </body>
    </html>
  );
}
