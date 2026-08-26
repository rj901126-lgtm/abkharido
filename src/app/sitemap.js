import { PRODUCTS, CATEGORIES } from '../db/mockData.js';
import connectDB from '../../server/config/db.js';
import Product from '../../server/models/Product.js';
import { BLOG_POSTS } from '../data/blogPosts.js';

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.abkharido.com';

  const staticPages = [
    '',
    '/catalog',
    '/categories',
    '/partner',
    '/seller',
    '/login',
    '/compare',
    '/cart',
    '/about',
    '/terms',
    '/privacy',
    '/shipping',
    '/returns',
    '/contact',
    '/faq',
    '/vip',
    '/blog',
  ].map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: route === '' || route === '/catalog' ? 'hourly' : route === '/blog' ? 'daily' : 'daily',
    priority: route === '' ? 1.0 : route === '/catalog' ? 0.95 : (['/about', '/terms', '/privacy', '/shipping', '/returns', '/contact', '/faq'].includes(route) ? 0.6 : 0.85),
  }));

  // Dedicated SEO category landing pages (HIGH priority — our secret weapon vs Amazon/Flipkart)
  const dedicatedCategoryPages = [
    { route: '/electronics', priority: 0.98 },
    { route: '/mobiles', priority: 0.98 },
    { route: '/fashion', priority: 0.97 },
  ].map(({ route, priority }) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'daily',
    priority,
  }));

  // Catalog query category pages
  const categoryUrls = CATEGORIES.filter(c => c.id !== 'all').map(c => ({
    url: `${baseUrl}/catalog?category=${c.id}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'daily',
    priority: 0.9,
  }));

  // Blog posts — informational content that beats Amazon/Flipkart on long-tail keywords
  const blogUrls = BLOG_POSTS.map(post => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt).toISOString(),
    changeFrequency: 'weekly',
    priority: 0.85,
  }));

  // Fetch product IDs for dynamic sitemap
  let productUrls = [];
  try {
    await connectDB();
    const dbProducts = await Product.find({}).select('id _id updatedAt').lean();
    if (dbProducts && dbProducts.length > 0) {
      productUrls = dbProducts.map(p => ({
        url: `${baseUrl}/product/${p.id || p._id}`,
        lastModified: p.updatedAt ? new Date(p.updatedAt).toISOString() : new Date().toISOString(),
        changeFrequency: 'daily',
        priority: 0.95,
      }));
    }
  } catch (_err) {}

  if (productUrls.length === 0) {
    productUrls = PRODUCTS.map(p => ({
      url: `${baseUrl}/product/${p.id}`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'daily',
      priority: 0.95,
    }));
  }

  return [...staticPages, ...dedicatedCategoryPages, ...categoryUrls, ...blogUrls, ...productUrls];
}
