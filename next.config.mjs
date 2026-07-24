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
    const backendUrl = process.env.BACKEND_API_URL;
    // Only proxy to backend if BACKEND_API_URL env variable is configured
    if (backendUrl) {
      return [
        {
          source: '/api/:path*',
          destination: `${backendUrl}/api/:path*`,
        },
      ];
    }
    return [];
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
