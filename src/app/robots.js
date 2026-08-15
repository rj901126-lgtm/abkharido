export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.abkharido.com';
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/seller/', '/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
