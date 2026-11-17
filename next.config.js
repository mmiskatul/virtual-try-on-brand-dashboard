// Local default so next-auth does not warn when .env only holds the backend URL.
// In production the host (e.g. Vercel) provides the URL.
if (process.env.NODE_ENV !== 'production' && !process.env.NEXTAUTH_URL) {
  process.env.NEXTAUTH_URL = 'http://localhost:3001';
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  experimental: {
    taint: true,
    instrumentationHook: true,
    optimizePackageImports: ['lucide-react', '@tanstack/react-query', 'zod'],
  },
  poweredByHeader: false,
  // Old / duplicate URLs keep working (bookmarks, emails) by redirecting to the canonical page.
  async redirects() {
    return [
      { source: '/dashboard/overview', destination: '/dashboard', permanent: true },
      { source: '/dashboard/brand', destination: '/dashboard/settings/onboarding', permanent: true },
      { source: '/dashboard/brand/profile', destination: '/dashboard/settings/onboarding', permanent: true },
      { source: '/dashboard/brand/identity', destination: '/dashboard/settings/onboarding/identity', permanent: true },
      { source: '/dashboard/brand/media', destination: '/dashboard/settings/onboarding/media', permanent: true },
      { source: '/dashboard/settings/brand', destination: '/dashboard/settings/onboarding/identity', permanent: true },
      { source: '/dashboard/products/create', destination: '/dashboard/products/addproduct', permanent: true },
      { source: '/dashboard/products/categories/add', destination: '/dashboard/products/categories/addcategory', permanent: true },
      { source: '/dashboard/products/categories/create', destination: '/dashboard/products/categories/addcategory', permanent: true },
      { source: '/dashboard/marketing/coupons', destination: '/dashboard/marketing/discounts', permanent: true },
      { source: '/dashboard/marketplace/analytics', destination: '/dashboard/analytics/marketplace', permanent: true },
      { source: '/dashboard/virtual-try-on/analytics', destination: '/dashboard/analytics/virtual-try-on', permanent: true },
      { source: '/forget-password', destination: '/forgot-password', permanent: true },
      { source: '/storefront/:slug', destination: '/brands/:slug', permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com'
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com'
      },
      { protocol: 'https', hostname: 'api.vtrystudio.com' },
      { protocol: 'https', hostname: 'ai.vtrystudio.com' },
      ...(process.env.NODE_ENV !== 'production'
        ? [
            { protocol: 'http', hostname: 'localhost' },
            { protocol: 'http', hostname: '127.0.0.1' },
          ]
        : []),
    ]
  }
};

module.exports = nextConfig;
