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
    optimizePackageImports: ['lucide-react', '@tanstack/react-query', 'zod'],
  },
  poweredByHeader: false,
  // Old / duplicate URLs keep working (bookmarks, emails) by redirecting to the canonical page.
  async redirects() {
    return [
      { source: '/dashboard/overview', destination: '/dashboard', permanent: true },
      { source: '/dashboard/brand', destination: '/dashboard/settings', permanent: true },
      { source: '/dashboard/brand/profile', destination: '/dashboard/settings', permanent: true },
      { source: '/dashboard/brand/identity', destination: '/dashboard/settings?tab=identity', permanent: true },
      { source: '/dashboard/brand/media', destination: '/dashboard/settings?tab=media', permanent: true },
      { source: '/dashboard/settings/brand', destination: '/dashboard/settings?tab=identity', permanent: true },
      // Settings was 11 pages; it is now 4 (Brand, Store, Try-on privacy, Account & security).
      { source: '/dashboard/settings/onboarding', destination: '/dashboard/settings', permanent: true },
      { source: '/dashboard/settings/onboarding/identity', destination: '/dashboard/settings?tab=identity', permanent: true },
      { source: '/dashboard/settings/onboarding/media', destination: '/dashboard/settings?tab=media', permanent: true },
      { source: '/dashboard/settings/general', destination: '/dashboard/settings', permanent: true },
      { source: '/dashboard/settings/delivery', destination: '/dashboard/settings/store', permanent: true },
      { source: '/dashboard/settings/seo', destination: '/dashboard/settings/store', permanent: true },
      { source: '/dashboard/settings/security', destination: '/dashboard/settings/account', permanent: true },
      { source: '/dashboard/products/create', destination: '/dashboard/products/addproduct', permanent: true },
      { source: '/dashboard/products/categories/add', destination: '/dashboard/categories/new', permanent: true },
      { source: '/dashboard/products/categories/create', destination: '/dashboard/categories/new', permanent: true },
      // Sub-pages moved out of their parent route: old links keep working.
      { source: '/dashboard/products/categories', destination: '/dashboard/categories', permanent: true },
      { source: '/dashboard/products/categories/:path*', destination: '/dashboard/categories/:path*', permanent: true },
      { source: '/dashboard/products/collections', destination: '/dashboard/collections', permanent: true },
      { source: '/dashboard/products/collections/:path*', destination: '/dashboard/collections/:path*', permanent: true },
      { source: '/dashboard/orders/abandoned', destination: '/dashboard/orders', permanent: true },
      { source: '/dashboard/orders/abandoned/:path*', destination: '/dashboard/orders', permanent: true },
      { source: '/dashboard/orders/returns', destination: '/dashboard/orders', permanent: true },
      { source: '/dashboard/orders/returns/:path*', destination: '/dashboard/orders', permanent: true },
      { source: '/dashboard/orders/refunds', destination: '/dashboard/orders', permanent: true },
      { source: '/dashboard/orders/refunds/:path*', destination: '/dashboard/orders', permanent: true },
      { source: '/dashboard/inventory/locations', destination: '/dashboard/inventory', permanent: true },
      { source: '/dashboard/inventory/locations/:path*', destination: '/dashboard/inventory', permanent: true },
      { source: '/dashboard/inventory/adjustments', destination: '/dashboard/inventory', permanent: true },
      { source: '/dashboard/inventory/adjustments/:path*', destination: '/dashboard/inventory', permanent: true },
      { source: '/dashboard/inventory/history', destination: '/dashboard/inventory-history', permanent: true },
      { source: '/dashboard/inventory/history/:path*', destination: '/dashboard/inventory-history', permanent: true },
      { source: '/dashboard/analytics/sales', destination: '/dashboard/analytics#sales', permanent: true },
      { source: '/dashboard/analytics/sales/:path*', destination: '/dashboard/analytics#sales', permanent: true },
      { source: '/dashboard/analytics/products', destination: '/dashboard/analytics#products', permanent: true },
      { source: '/dashboard/analytics/products/:path*', destination: '/dashboard/analytics#products', permanent: true },
      { source: '/dashboard/analytics/customers', destination: '/dashboard/analytics#customers', permanent: true },
      { source: '/dashboard/analytics/customers/:path*', destination: '/dashboard/analytics#customers', permanent: true },
      { source: '/dashboard/analytics/marketplace', destination: '/dashboard/analytics', permanent: true },
      { source: '/dashboard/analytics/marketplace/:path*', destination: '/dashboard/analytics', permanent: true },
      { source: '/dashboard/analytics/virtual-try-on', destination: '/dashboard/analytics#try-on', permanent: true },
      { source: '/dashboard/analytics/virtual-try-on/:path*', destination: '/dashboard/analytics#try-on', permanent: true },
      { source: '/dashboard/billing/plan', destination: '/dashboard/billing#plan', permanent: true },
      { source: '/dashboard/billing/plan/:path*', destination: '/dashboard/billing#plan', permanent: true },
      { source: '/dashboard/billing/usage', destination: '/dashboard/billing#usage', permanent: true },
      { source: '/dashboard/billing/usage/:path*', destination: '/dashboard/billing#usage', permanent: true },
      { source: '/dashboard/billing/invoices', destination: '/dashboard/billing#invoices', permanent: true },
      { source: '/dashboard/billing/invoices/:path*', destination: '/dashboard/billing#invoices', permanent: true },
      { source: '/dashboard/billing/payment-methods', destination: '/dashboard/billing', permanent: true },
      { source: '/dashboard/billing/payment-methods/:path*', destination: '/dashboard/billing', permanent: true },
      { source: '/dashboard/virtual-try-on/studio', destination: '/dashboard/virtual-try-on', permanent: true },
      { source: '/dashboard/virtual-try-on/configuration', destination: '/dashboard/virtual-try-on', permanent: true },
      { source: '/dashboard/virtual-try-on/embedding', destination: '/dashboard/virtual-try-on', permanent: true },
      { source: '/dashboard/virtual-try-on/products', destination: '/dashboard/try-on-garments', permanent: true },
      { source: '/dashboard/virtual-try-on/appearance', destination: '/dashboard/try-on-look', permanent: true },
      { source: '/dashboard/virtual-try-on/history', destination: '/dashboard/try-on-sessions', permanent: true },
      { source: '/dashboard/virtual-try-on/privacy', destination: '/dashboard/settings/privacy', permanent: true },
      // Returns, refunds and abandoned carts are hidden until the server supports them.
      { source: '/dashboard/abandoned-carts', destination: '/dashboard/orders', permanent: false },
      { source: '/dashboard/returns', destination: '/dashboard/orders', permanent: false },
      { source: '/dashboard/refunds', destination: '/dashboard/orders', permanent: false },
      { source: '/dashboard/try-on-look', destination: '/dashboard/virtual-try-on', permanent: false },
      { source: '/dashboard/sales-reports', destination: '/dashboard/analytics#sales', permanent: false },
      { source: '/dashboard/product-performance', destination: '/dashboard/analytics#products', permanent: false },
      { source: '/dashboard/customer-analytics', destination: '/dashboard/analytics#customers', permanent: false },
      { source: '/dashboard/marketplace-analytics', destination: '/dashboard/analytics', permanent: false },
      { source: '/dashboard/try-on-reports', destination: '/dashboard/analytics#try-on', permanent: false },
      { source: '/dashboard/warehouses', destination: '/dashboard/inventory', permanent: false },
      { source: '/dashboard/stock-adjustments', destination: '/dashboard/inventory', permanent: false },
      { source: '/dashboard/settings/business', destination: '/dashboard/settings', permanent: false },
      { source: '/dashboard/settings/domains', destination: '/dashboard/settings', permanent: false },
      { source: '/dashboard/settings/localization', destination: '/dashboard/settings', permanent: false },
      { source: '/dashboard/settings/tax', destination: '/dashboard/settings', permanent: false },
      { source: '/dashboard/settings/shipping', destination: '/dashboard/settings/store', permanent: false },
      { source: '/dashboard/settings/notifications', destination: '/dashboard/settings', permanent: false },
      { source: '/dashboard/subscription-plan', destination: '/dashboard/billing#plan', permanent: false },
      { source: '/dashboard/ai-usage', destination: '/dashboard/billing#usage', permanent: false },
      { source: '/dashboard/invoices', destination: '/dashboard/billing#invoices', permanent: false },
      { source: '/dashboard/payment-methods', destination: '/dashboard/billing', permanent: false },
      { source: '/dashboard/integrations', destination: '/dashboard', permanent: false },
      { source: '/dashboard/integrations/:path*', destination: '/dashboard', permanent: false },
      { source: '/dashboard/developer/:path*', destination: '/dashboard', permanent: false },
      { source: '/dashboard/marketing/coupons', destination: '/dashboard/marketing/discounts', permanent: true },
      { source: '/dashboard/marketplace/analytics', destination: '/dashboard/analytics', permanent: true },
      { source: '/dashboard/virtual-try-on/analytics', destination: '/dashboard/analytics#try-on', permanent: true },
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
