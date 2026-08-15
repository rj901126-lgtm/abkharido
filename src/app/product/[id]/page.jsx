import React from 'react';
import ProductClient from './ProductClient';
import connectDB from '../../../../server/config/db.js';
import Product from '../../../../server/models/Product.js';
import mongoose from 'mongoose';
import { PRODUCTS } from '../../../db/mockData.js';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.abkharido.com';

export const revalidate = 60; // ISR: Revalidate product page every 60 seconds

// Safe helper to resolve product on server without blocking
async function getProduct(id) {
  if (!id) return null;
  const cleanId = String(id).trim();

  // Try DB query if connected or quick connect
  try {
    if (mongoose.connection.readyState === 1) {
      const productDoc = await Product.findOne({
        $or: [{ id: cleanId }, { _id: cleanId.length === 24 ? cleanId : undefined }].filter(Boolean)
      }).lean();
      if (productDoc) return JSON.parse(JSON.stringify(productDoc));
    }
  } catch (err) {
    // Continue to fallback
  }

  // Fallback to local catalog
  const localProduct = PRODUCTS.find(p => p.id === cleanId || p._id === cleanId);
  if (localProduct) {
    return JSON.parse(JSON.stringify(localProduct));
  }

  return null;
}

// Generate dynamic SEO metadata and Open Graph tags for WhatsApp / Social previews
export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const id = resolvedParams?.id;
  const product = await getProduct(id);

  if (product && product.name) {
    const imageUrl = product.image || (product.images && product.images[0]) || `${SITE_URL}/logo.jpg`;
    const canonicalUrl = `${SITE_URL}/product/${product.id || id}`;

    return {
      title: `${product.name} - Best Price in India`,
      description: product.description || `Buy ${product.name} online at the best price in India on AbKharido. Express Delivery, 7-Day Returns & Cash on Delivery available.`,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title: `${product.name} | AbKharido`,
        description: product.description || `Shop ${product.name} on AbKharido for ₹${(product.price || 0).toLocaleString('en-IN')}. Fast shipping across India.`,
        url: canonicalUrl,
        siteName: 'AbKharido',
        type: 'website',
        locale: 'en_IN',
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 1200,
            alt: product.name,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${product.name} - ₹${(product.price || 0).toLocaleString('en-IN')}`,
        description: product.description || `Buy ${product.name} online at AbKharido.`,
        images: [imageUrl],
      },
    };
  }

  return {
    title: 'Product Details | AbKharido',
    description: 'Explore top trending electronics, smartphones, and fashion on AbKharido.',
  };
}

export default async function Page({ params }) {
  const resolvedParams = await params;
  const id = resolvedParams?.id;
  const product = await getProduct(id);

  // Generate Product JSON-LD structured data for Google Search snippet indexing
  const productJsonLd = product ? {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.image || (product.images && product.images[0]),
    description: product.description,
    brand: {
      '@type': 'Brand',
      name: product.brand || 'AbKharido Verified'
    },
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/product/${product.id || id}`,
      priceCurrency: 'INR',
      price: product.price,
      priceValidUntil: '2026-12-31',
      itemCondition: 'https://schema.org/NewCondition',
      availability: product.inStock !== false ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'AbKharido'
      }
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: product.rating || 4.7,
      reviewCount: product.reviewsCount || 120
    }
  } : null;

  return (
    <>
      {productJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
        />
      )}
      <ProductClient id={id} initialProduct={product} />
    </>
  );
}
