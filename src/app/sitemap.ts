import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'https://shop.brand.vtrystudio.com';
  const now = new Date();

  // Public brand storefronts are brand-specific and discovered via the marketplace;
  // no hardcoded demo slugs are advertised here.
  const publicSlugs: string[] = [];

  return publicSlugs.map((slug) => ({
    url: `${siteUrl}/brands/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.9,
  }));
}
