import React from 'react';
import { notFound } from 'next/navigation';
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

  if (!product || !product.name) {
    return {
      title: 'Product Not Found | AbKharido',
      description: 'The requested product could not be found in the AbKharido catalog. Explore top smartphones, electronics, and fashion deals.',
    };
  }

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

export default async function Page({ params }) {
  const resolvedParams = await params;
  const id = resolvedParams?.id;
  const product = await getProduct(id);

  // Return real HTTP 404 if product is not found
  if (!product) {
    notFound();
  }

  // Generate Product JSON-LD structured data for Google Search snippet indexing
  const productPrice = product.price || 0;
  const productUrl = `${SITE_URL}/product/${product.id || id}`;
  const categoryName = product.category || 'General';

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: [
      product.image || (product.images && product.images[0]) || `${SITE_URL}/logo.jpg`,
      ...(product.images || [])
    ].filter(Boolean),
    description: product.description || `Buy ${product.name} online in India with Free Express Delivery at AbKharido.`,
    sku: `AK-${product.id || id}`,
    mpn: `MPN-${product.id || id}`,
    brand: {
      '@type': 'Brand',
      name: product.brand || 'AbKharido Verified'
    },
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'INR',
      price: productPrice,
      priceValidUntil: '2027-12-31',
      itemCondition: 'https://schema.org/NewCondition',
      availability: product.inStock !== false ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'AbKharido Retail Private Limited'
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: '0',
          currency: 'INR'
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'IN'
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          businessDays: {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
          },
          cutoffTime: '17:00:00Z',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 0,
            maxValue: 1,
            unitCode: 'd'
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 1,
            maxValue: 3,
            unitCode: 'd'
          }
        }
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'IN',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 7,
        returnMethod: 'https://schema.org/ReturnAtKiosk',
        returnFees: 'https://schema.org/FreeReturn'
      }
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: product.rating || 4.8,
      reviewCount: product.reviewsCount || 148,
      bestRating: 5,
      worstRating: 1
    }
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: SITE_URL
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Catalog',
        item: `${SITE_URL}/catalog`
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: categoryName,
        item: `${SITE_URL}/catalog?category=${encodeURIComponent(categoryName.toLowerCase())}`
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: product.name,
        item: productUrl
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ProductClient id={id} initialProduct={product} />
    </>
  );
}

