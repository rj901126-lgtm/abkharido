import React from 'react';
import CatalogClient from './CatalogClient';
import Product from '../../../server/models/Product.js';

import connectDB from '../../lib/connectDB.js';
import { toPublicProductDTO } from '../../lib/productValidator.js';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.abkharido.com';

export const revalidate = 60; // Revalidate every 60 seconds

async function getCatalogProducts(category, search) {
  try {
    await connectDB();
    const query = {
      status: { $in: ['published', 'active'], $ne: 'archived' },
      isArchived: { $ne: true }
    };
    if (category && category !== 'all') {
      const escapedCat = category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.category = { $regex: new RegExp(`^${escapedCat}$`, 'i') };
    }
    if (search && search.trim()) {
      const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: { $regex: escapedSearch, $options: 'i' } },
        { description: { $regex: escapedSearch, $options: 'i' } },
        { category: { $regex: escapedSearch, $options: 'i' } }
      ];
    }
    const products = await Product.find(query).limit(100).lean();
    if (products && products.length > 0) {
      return products.map(toPublicProductDTO);
    }
    return [];
  } catch (_e) {
    return [];
  }
}

export async function generateMetadata({ searchParams }) {
  const params = await searchParams;
  const category = params?.category;
  const search = params?.search;

  let title = 'Explore All Products';
  let description = 'Shop quality verified products across Electronics, Mobiles, Fashion, and Home appliances with standard courier shipping across India.';

  if (search) {
    title = `Search results for "${search}"`;
    description = `Explore deals and verified items matching "${search}" on AbKharido.`;
  } else if (category && category !== 'all') {
    const formattedCat = category.charAt(0).toUpperCase() + category.slice(1);
    title = `${formattedCat} Store - Deals Online`;
    description = `Shop the latest ${formattedCat} online with discounts, standard courier delivery, and Cash on Delivery on AbKharido.`;
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

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: category !== 'all' ? `${category.toUpperCase()} Collection | AbKharido` : 'All Products | AbKharido',
    url: `${SITE_URL}/catalog${category !== 'all' ? `?category=${category}` : ''}`,
    numberOfItems: initialProducts.length,
    itemListElement: initialProducts.slice(0, 30).map((p, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: p.name,
      url: `${SITE_URL}/product/${p.id || p._id}`,
      image: p.image || (p.images && p.images[0]) || `${SITE_URL}/logo.jpg`,
      offers: {
        '@type': 'Offer',
        priceCurrency: 'INR',
        price: p.price || 0,
        availability: 'https://schema.org/InStock'
      }
    }))
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <CatalogClient initialCategory={category} initialSearch={search} initialProducts={initialProducts} />
    </>
  );
}

