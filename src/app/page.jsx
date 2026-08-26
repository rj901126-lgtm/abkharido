import React from 'react';
import HomeClientWrapper from './HomeClientWrapper';
import logger from '../../server/config/logger.js';
import connectDB from '../../server/config/db.js';
import Product from '../../server/models/Product.js';
import { PRODUCTS } from '../db/mockData.js';

export const revalidate = 60; // ISR: Revalidate every 60 seconds

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.abkharido.com';

export const metadata = {
  title: "AbKharido — India's #1 Online Shopping Destination | Free Delivery & Cash on Delivery",
  description: "Shop 100% genuine electronics, smartphones, fashion & home products at AbKharido. Free express delivery pan-India, 7-day doorstep returns, Cash on Delivery, and exclusive deals.",
  keywords: [
    'online shopping india', 'buy online india', 'free delivery india', 'cash on delivery shopping india',
    'best online shopping site india 2026', 'electronics online india', 'fashion online india',
    'smartphones best price india', 'abkharido', 'ab kharido online shopping'
  ],
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: "AbKharido — India's Best Online Shopping | Free Delivery + COD",
    description: "Shop genuine electronics, smartphones, fashion and lifestyle. Free express delivery, 7-day returns, Cash on Delivery available.",
    url: SITE_URL, siteName: 'AbKharido', locale: 'en_IN', type: 'website',
    images: [{ url: `${SITE_URL}/logo.jpg`, width: 1200, height: 630, alt: 'AbKharido India Online Shopping' }]
  }
};

async function getProducts() {
  try {
    const dbPromise = (async () => {
      await connectDB();
      const products = await Product.find({}).limit(100).lean();
      if (products && products.length > 0) {
        return JSON.parse(JSON.stringify(products));
      }
      return null;
    })();

    // 2.5s fast timeout safeguard so SSR never crashes or times out
    const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 2500));
    const result = await Promise.race([dbPromise, timeoutPromise]);
    if (result) return result;
  } catch (error) {
    logger.error('Failed to fetch products for SSR', error);
  }
  return JSON.parse(JSON.stringify(PRODUCTS));
}

export default async function Page() {
  try {
    const products = await getProducts();
    return <HomeClientWrapper serverProducts={products || PRODUCTS} />;
  } catch (err) {
    return <HomeClientWrapper serverProducts={PRODUCTS} />;
  }
}


