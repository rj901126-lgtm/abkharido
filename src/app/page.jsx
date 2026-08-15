import React from 'react';
import HomeClientWrapper from './HomeClientWrapper';
import logger from '../../server/config/logger.js';
import connectDB from '../../server/config/db.js';
import Product from '../../server/models/Product.js';
import mongoose from 'mongoose';
import { PRODUCTS } from '../db/mockData.js';

export const revalidate = 60; // ISR: Revalidate every 60 seconds

async function getProducts() {
  try {
    if (mongoose.connection.readyState === 1) {
      const products = await Product.find({}).limit(100).lean();
      if (products && products.length > 0) {
        return JSON.parse(JSON.stringify(products));
      }
    }
  } catch (error) {
    logger.error('Failed to fetch products for SSR', error);
  }
  return JSON.parse(JSON.stringify(PRODUCTS));
}

export default async function Page() {
  const products = await getProducts();
  return <HomeClientWrapper serverProducts={products} />;
}
