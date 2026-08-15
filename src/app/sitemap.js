export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.abkharido.com';

  const staticPages = [
    '',
    '/catalog',
    '/categories',
    '/cart',
    '/checkout',
    '/partner',
    '/login'
  ].map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'daily',
    priority: route === '' ? 1.0 : 0.8,
  }));

  return staticPages;
}
