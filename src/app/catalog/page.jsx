import React from 'react';
import CatalogClient from './CatalogClient';
import { PRODUCTS } from '../../db/mockData.js';
import mongoose from 'mongoose';
import Product from '../../../server/models/Product.js';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.abkharido.com';

export const revalidate = 60; // Revalidate every 60 seconds

async function getCatalogProducts(category, search) {
  try {
    if (mongoose.connection.readyState === 1) {
      let query = {};
      if (category && category !== 'all') query.category = category;
      if (search) query.name = { $regex: search, $options: 'i' };
      const products = await Product.find(query).limit(100).lean();
      if (products && products.length > 0) {
        return JSON.parse(JSON.stringify(products));
      }
    }
  } catch (_e) {}
  
  let list = PRODUCTS;
  if (category && category !== 'all') {
    list = list.filter(p => p.category === category);
  }
  if (search) {
    const s = search.toLowerCase();
    list = list.filter(p => p.name.toLowerCase().includes(s) || (p.description && p.description.toLowerCase().includes(s)));
  }
  return JSON.parse(JSON.stringify(list));
}

export async function generateMetadata({ searchParams }) {
  const params = await searchParams;
  const category = params?.category;
  const search = params?.search;

  let title = 'Explore All Products | AbKharido';
  let description = 'Shop thousands of genuine verified products across Electronics, Mobiles, Fashion, and Home appliances with express shipping across India.';

  if (search) {
    title = `Search results for "${search}" | AbKharido`;
    description = `Explore top deals and verified items matching "${search}" on AbKharido.`;
  } else if (category && category !== 'all') {
    const formattedCat = category.charAt(0).toUpperCase() + category.slice(1);
    title = `${formattedCat} Store - Best Deals Online | AbKharido`;
    description = `Shop the latest ${formattedCat} online with exclusive discounts, express delivery, and cash on delivery on AbKharido.`;
  }

  const canonicalUrl = `${SITE_URL}/catalog${category ? `?category=${category}` : ''}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'AbKharido',
      type: 'website',
      images: [
        {
          url: `${SITE_URL}/logo.jpg`,
          width: 800,
          height: 800,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${SITE_URL}/logo.jpg`],
    },
  };
}

export default async function Page({ searchParams }) {
  const params = await searchParams;
  const category = params?.category || 'all';
  const search = params?.search || '';
  const initialProducts = await getCatalogProducts(category, search);

  return <CatalogClient initialCategory={category} initialSearch={search} initialProducts={initialProducts} />;
}

