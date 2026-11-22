import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchPublicStorefront } from '@/lib/public-storefront';
import BrandStorefrontClient from './BrandStorefrontClient';

interface Props {
  params: Promise<{ brandSlug: string }>;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://shop.brand.vtrystudio.com';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { brandSlug } = await params;
  const store = await fetchPublicStorefront(brandSlug);
  if (!store) {
    return { title: 'Storefront Not Found | V-TRY Studio', robots: { index: false, follow: false } };
  }
  const description = (store.seoDescription || `${store.about || store.tagline} Try on ${store.name}'s collection with AI Virtual Try-On.`).trim();
  const pageTitle = store.seoTitle || `${store.name} | Official Boutique & AI Virtual Fitting`;
  return {
    title: pageTitle,
    description,
    alternates: { canonical: `/brands/${store.slug}` },
    openGraph: {
      type: 'website',
      url: `${SITE_URL}/brands/${store.slug}`,
      title: store.seoTitle || `${store.name} | Official Boutique`,
      description,
      images: store.banner ? [{ url: store.banner, width: 1200, height: 630, alt: `${store.name} banner` }] : [],
    },
    twitter: { card: 'summary_large_image', title: store.seoTitle || `${store.name} | Official Boutique`, description },
  };
}

export default async function BrandStorefrontPage({ params }: Props) {
  const { brandSlug } = await params;
  const store = await fetchPublicStorefront(brandSlug);
  // A real 404 status for unknown brands (good for SEO).
  if (!store) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ClothingStore',
    name: store.name,
    description: store.about || store.tagline,
    url: `${SITE_URL}/brands/${store.slug}`,
    ...(store.logo ? { logo: store.logo } : {}),
    ...(store.banner ? { image: store.banner } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        // "<" escaped so brand-supplied text can never close the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\u003c') }}
      />
      <BrandStorefrontClient />
    </>
  );
}
