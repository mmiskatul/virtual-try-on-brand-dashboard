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
