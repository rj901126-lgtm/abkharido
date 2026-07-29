/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Disabled to prevent double-invocation causing hydration mismatches
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
    ],
  },
  // NOTE: output: 'standalone' removed — only needed for Docker/self-hosted, NOT Vercel
  async rewrites() {
    const backendUrl = process.env.BACKEND_API_URL || 'http://16.16.195.180:5000';
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
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
