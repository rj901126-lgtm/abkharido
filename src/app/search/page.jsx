import React from 'react';
import CatalogClient from '../catalog/CatalogClient';
import connectDB from '../../lib/connectDB.js';
import Product from '../../../server/models/Product.js';
import { toPublicProductDTO } from '../../lib/productValidator.js';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.abkharido.com';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getSearchProducts(category, search) {
  try {
    await connectDB();
    const filter = {
      status: { $in: ['published', 'active'], $ne: 'archived' },
      isArchived: { $ne: true }
    };

    if (category && category !== 'all') {
      const escapedCat = category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.category = { $regex: new RegExp(`^${escapedCat}$`, 'i') };
    }

    if (search && search.trim()) {
      const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: { $regex: escapedSearch, $options: 'i' } },
        { description: { $regex: escapedSearch, $options: 'i' } },
        { category: { $regex: escapedSearch, $options: 'i' } }
      ];
    }

    const products = await Product.find(filter).limit(100).lean();
    if (products && products.length > 0) {
      return products.map(toPublicProductDTO);
    }
    return [];
  } catch (err) {
    console.error('[Search Page Server Fetch Error]:', err);
    return [];
  }
}

export async function generateMetadata({ searchParams }) {
  const params = await searchParams;
  const q = params?.q || params?.search || '';
  const category = params?.category || '';

  let title = 'Search Products | AbKharido';
  let description = 'Search genuine verified products with express delivery and Cash on Delivery at AbKharido.';

  if (q) {
    title = `Search results for "${q}" | AbKharido`;
    description = `Find the best verified products matching "${q}" at AbKharido. Express delivery & COD across India.`;
  } else if (category && category !== 'all') {
    const formattedCat = category.charAt(0).toUpperCase() + category.slice(1);
    title = `${formattedCat} Search | AbKharido`;
  }

  const queryParams = new URLSearchParams();
  if (q) queryParams.set('q', q);
  if (category && category !== 'all') queryParams.set('category', category);
  const canonicalUrl = `${SITE_URL}/search${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

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
      type: 'website'
    }
  };
}

export default async function SearchPage({ searchParams }) {
  const params = await searchParams;
  const q = params?.q || params?.search || '';
  const category = params?.category || 'all';

  const initialProducts = await getSearchProducts(category, q);

  return (
    <CatalogClient 
      initialCategory={category} 
      initialSearch={q} 
      initialProducts={initialProducts} 
    />
  );
}
