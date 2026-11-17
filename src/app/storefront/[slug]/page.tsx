import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { StorefrontClient } from './StorefrontClient';
import { fetchPublicStorefront } from '@/lib/public-storefront';

interface Props {
  params: {
    slug: string;
  };
}


// Dynamic Server-Side Rendering (SSR) SEO Metadata Generator
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const store = await fetchPublicStorefront(params.slug);
  if (!store) {
    return {
      title: 'Storefront Not Found | V-TRY Platform',
      description: 'The requested independent designer storefront could not be located.'
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shop.brand.vtrystudio.com';

  return {
    title: `${store.name} | Official Boutique & AI Virtual Fitting`,
    description: `${store.about} Experience ${store.name}'s collection with real-time AI Virtual Try-On before purchasing.`,
    keywords: [
      store.name,
      'Designer Boutique',
      'AI Virtual Try-On',
      'Independent Fashion Brand',
      'Luxury Clothing',
      store.tagline
    ],
    alternates: {
      canonical: `/storefront/${params.slug}`,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: 'website',
      url: `${siteUrl}/storefront/${params.slug}`,
      title: `${store.name} | Official Boutique & AI Fitting Room`,
      description: store.tagline,
      images: [
        {
          url: store.banner,
          width: 1200,
          height: 630,
          alt: `${store.name} Boutique Banner`
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: `${store.name} | Official Boutique`,
      description: store.tagline,
      images: [store.banner]
    }
  };
}

export default async function StorefrontPage({ params }: Props) {
  const store = await fetchPublicStorefront(params.slug);
  if (!store) {
    notFound();
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shop.brand.vtrystudio.com';

  // Comprehensive Schema.org Structured JSON-LD with ClothingStore and Breadcrumbs
  const jsonLdGraph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: siteUrl,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Storefronts',
            item: `${siteUrl}/storefront`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: store.name,
            item: `${siteUrl}/storefront/${store.slug}`,
          },
        ],
      },
      {
        '@type': 'ClothingStore',
        '@id': `${siteUrl}/storefront/${store.slug}#store`,
        name: store.name,
        description: store.about,
        image: store.logo,
        url: `${siteUrl}/storefront/${store.slug}`,
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: `${store.name} Collection`,
          itemListElement: store.products.map((p, idx) => ({
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Product',
              name: p.name,
              image: p.image,
              description: `${p.name} by ${store.name}`,
              offers: {
                '@type': 'Offer',
                price: p.price,
                priceCurrency: 'BDT',
                availability: 'https://schema.org/InStock',
              },
            },
            position: idx + 1,
          })),
        },
      },
    ],
  };

  const nonce = headers().get('x-nonce') ?? undefined;

  return (
    <>
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdGraph).replace(/</g, '\\u003c') }}
      />
      <StorefrontClient brand={store} products={store.products} />
    </>
  );
}
