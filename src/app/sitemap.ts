import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'https://brands.v-try.fashion';
  const now = new Date();

  // Public brand storefronts for crawler indexing
  const publicSlugs = ['aura-atelier', 'vogue-nova'];

  return publicSlugs.map((slug) => ({
    url: `${siteUrl}/storefront/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.9,
  }));
}
