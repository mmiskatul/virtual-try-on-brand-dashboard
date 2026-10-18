/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    taint: true,
    instrumentationHook: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com'
      },
      {
        protocol: 'http',
        hostname: 'localhost'
      }
    ]
  }
};

module.exports = nextConfig;
