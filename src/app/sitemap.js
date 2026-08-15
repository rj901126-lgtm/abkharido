import { PRODUCTS } from '../db/mockData.js';
import connectDB from '../../server/config/db.js';
import Product from '../../server/models/Product.js';
import mongoose from 'mongoose';

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.abkharido.com';

  const staticPages = [
    '',
    '/catalog',
    '/categories',
    '/partner',
    '/login'
  ].map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'daily',
    priority: route === '' ? 1.0 : 0.8,
  }));

  // Fetch product IDs for dynamic sitemap
  let productUrls = [];
  try {
    if (mongoose.connection.readyState === 1) {
      const dbProducts = await Product.find({}).select('id updatedAt').lean();
      if (dbProducts && dbProducts.length > 0) {
        productUrls = dbProducts.map(p => ({
          url: `${baseUrl}/product/${p.id}`,
          lastModified: p.updatedAt ? new Date(p.updatedAt).toISOString() : new Date().toISOString(),
          changeFrequency: 'weekly',
          priority: 0.9,
        }));
      }
    }
  } catch (err) {}

  if (productUrls.length === 0) {
    productUrls = PRODUCTS.map(p => ({
      url: `${baseUrl}/product/${p.id}`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'weekly',
      priority: 0.9,
    }));
  }

  return [...staticPages, ...productUrls];
}
