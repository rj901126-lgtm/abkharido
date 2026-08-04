import React from 'react';
import ProductClient from './ProductClient';

// Helper to safely resolve params in Next.js 15
async function getResolvedParams(params) {
  // In Next.js 15, page params are Promises
  return await params;
}

// Generate dynamic SEO metadata based on the product ID
export async function generateMetadata({ params }) {
  const resolvedParams = await getResolvedParams(params);
  const id = resolvedParams.id;
  
  try {
    // In a Server Component, we fetch directly from the internal API URL or backend DB.
    // For simplicity, we'll fetch from the local API running concurrently on port 5000.
    const res = await fetch(`http://ocalhost:5000/api/products/${id}`, { next: { revalidate: 60 } });
    const product = await res.json();
    
    if (product && product.name) {
      return {
        title: `${product.name} | AbKharido Premium`,
        description: product.description || `Buy ${product.name} at the best price on AbKharido.`,
        openGraph: {
          title: product.name,
          description: product.description,
          images: product.images && product.images.length > 0 ? [product.images[0]] : [],
        },
      };
    }
  } catch (err) {
    console.error("Failed to generate metadata for product", id, err);
  }

  // Fallback metadata
  return {
    title: 'Product Details | AbKharido Premium',
    description: 'View amazing products on AbKharido.',
  };
}

export default async function Page({ params }) {
  const resolvedParams = await getResolvedParams(params);
  const id = resolvedParams.id;
  
  return <ProductClient id={id} />;
}
