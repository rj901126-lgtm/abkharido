import React from 'react';
import HomeClientWrapper from './HomeClientWrapper';
import logger from '../../server/config/logger.js';
import connectDB from '../../server/config/db.js';
import Product from '../../server/models/Product.js';
import { toPublicProductDTO } from '../lib/productValidator.js';

export const revalidate = 60; // ISR: Revalidate every 60 seconds

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.abkharido.com';

export const metadata = {
  title: {
    absolute: "AbKharido — Online Shopping for Electronics, Fashion & Home"
  },
  description: "Shop genuine electronics, smartphones, fashion & home products at AbKharido. Free express delivery, 7-day doorstep returns, Cash on Delivery, and exclusive deals.",
  keywords: [
    'online shopping india', 'buy online india', 'free delivery india', 'cash on delivery shopping india',
    'best online shopping site india 2026', 'electronics online india', 'fashion online india',
    'smartphones best price india', 'abkharido', 'ab kharido online shopping'
  ],
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: "AbKharido — Online Shopping | Free Delivery + COD",
    description: "Shop genuine electronics, smartphones, fashion and lifestyle. Free express delivery, 7-day returns, Cash on Delivery available.",
    url: SITE_URL, siteName: 'AbKharido', locale: 'en_IN', type: 'website',
    images: [{ url: `${SITE_URL}/logo.jpg`, width: 1200, height: 630, alt: 'AbKharido India Online Shopping' }]
  }
};

async function getProducts() {
  try {
    const dbPromise = (async () => {
      await connectDB();
      const products = await Product.find({
        status: { $in: ['published', 'active'], $ne: 'archived' },
        isArchived: { $ne: true }
      }).limit(100).lean();
      if (products && products.length > 0) {
        return products.map(toPublicProductDTO);
      }
      return [];
    })();

    // 2.5s fast timeout safeguard so SSR never crashes or times out
    const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve([]), 2500));
    const result = await Promise.race([dbPromise, timeoutPromise]);
    if (result && result.length > 0) return result;
  } catch (error) {
    logger.error('Failed to fetch products for SSR', error);
  }
  return [];
}

export default async function Page() {
  const products = await getProducts();
  return <HomeClientWrapper serverProducts={products} />;
}


