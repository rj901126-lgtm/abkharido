import React from 'react';
import CategoriesClient from './CategoriesClient';
import { PRODUCTS } from '../../db/mockData.js';
import mongoose from 'mongoose';
import Product from '../../../server/models/Product.js';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.abkharido.com';

export const revalidate = 60; // Revalidate every 60 seconds

async function getCategoriesProducts() {
  try {
    if (mongoose.connection.readyState === 1) {
      const products = await Product.find({}).limit(100).lean();
      if (products && products.length > 0) {
        return JSON.parse(JSON.stringify(products));
      }
    }
  } catch (_e) {}
  return JSON.parse(JSON.stringify(PRODUCTS));
}

export const metadata = {
  title: 'All Categories - Explore Collections | AbKharido',
  description: 'Browse all categories on AbKharido: Mobiles, Electronics, Designer Fashion, Home Decor, Appliances, and more with huge daily savings.',
  alternates: {
    canonical: `${SITE_URL}/categories`,
  },
  openGraph: {
    title: 'Explore Collections & Categories | AbKharido',
    description: 'Browse all departments on AbKharido with express doorstep delivery across India.',
    url: `${SITE_URL}/categories`,
    siteName: 'AbKharido',
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/logo.jpg`,
        width: 800,
        height: 800,
        alt: 'AbKharido Categories',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Explore Collections & Categories | AbKharido',
    description: 'Browse all departments on AbKharido with express doorstep delivery.',
    images: [`${SITE_URL}/logo.jpg`],
  },
};

export default async function Page() {
  const initialProducts = await getCategoriesProducts();
  return <CategoriesClient initialProducts={initialProducts} />;
}

