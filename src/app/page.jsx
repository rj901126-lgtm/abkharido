import React from 'react';
import HomeClientWrapper from './HomeClientWrapper';
import logger from '../../server/config/logger.js';
import connectDB from '../../server/config/db.js';
import Product from '../../server/models/Product.js';

export const revalidate = 60; // ISR: Revalidate every 60 seconds

async function getProducts() {
  try {
    await connectDB();
    const products = await Product.find({}).limit(100).lean();
    return JSON.parse(JSON.stringify(products));
  } catch (error) {
    logger.error('Failed to fetch products for SSR', error);
    return [];
  }
}

export default async function Page() {
  const products = await getProducts();
  return <HomeClientWrapper serverProducts={products} />;
}
