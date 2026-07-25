import mongoose from 'mongoose';
import { PRODUCTS } from '../../src/db/mockData.js';
import Product from '../models/Product.js';

export async function seedDatabaseIfEmpty() {
  try {
    const count = await Product.countDocuments();
    if (count === 0) {
      console.log('[Enterprise Config] Database is empty. Seeding with mock data...');
      await Product.insertMany(PRODUCTS);
      console.log(`[Enterprise Config] Successfully seeded ${PRODUCTS.length} products.`);
    }
  } catch (err) {
    console.error('[Enterprise Config] Error seeding database:', err.message);
  }
}
