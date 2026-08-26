/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Disabled to prevent double-invocation causing hydration mismatches
  compress: true,          // Enable gzip/brotli — reduces page size 60-70%
  poweredByHeader: false,  // Don't reveal tech stack (minor security + SEO signal)
  images: {
    formats: ['image/avif', 'image/webp'], // Serve AVIF (40% smaller than WebP) to supported browsers
    deviceSizes: [390, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 2592000, // Cache images for 30 days
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: '**.googleapis.com' },
    ],
  },
  // Enable standalone output for AWS Docker, but disable it if running on Vercel
  output: process.env.VERCEL ? undefined : 'standalone',
  experimental: {
    optimizeCss: false,       // Disabled — can cause build issues on some setups
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
      // Cache static assets aggressively (images, fonts, css, js)
      {
        source: '/(.*)\\.(jpg|jpeg|png|webp|avif|svg|gif|ico|woff|woff2|ttf|eot)$',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // Ensure HTML pages are always fresh for SEO crawlers
      {
        source: '/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=3600' },
        ],
      },
    ];
  },
  async rewrites() {
    const backendUrl = process.env.BACKEND_API_URL || 'http://127.0.0.1:5000';
    return {
      fallback: [
        {
          source: '/api/:path*',
          destination: `${backendUrl.replace(/\/$/, '')}/api/:path*`, // prevent double slashes
        },
      ],
    };
  },
  async redirects() {
    return [
      // Redirect legacy /home route to root
      { source: '/home', destination: '/', permanent: true },
      // Category alias redirects — /mobiles → /catalog?category=mobiles
      // (These are for backward compat if old URLs existed)
      { source: '/category/:cat', destination: '/catalog?category=:cat', permanent: true },
    ];
  },
};

export default nextConfig;

