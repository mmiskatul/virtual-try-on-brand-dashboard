import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'https://brands.v-try.fashion';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/storefront/',
        disallow: ['/api/', '/dashboard/'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
