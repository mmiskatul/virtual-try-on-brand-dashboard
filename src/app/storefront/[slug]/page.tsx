import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { StorefrontClient } from './StorefrontClient';

interface Props {
  params: {
    slug: string;
  };
}

export const runtime = 'edge';
export const preferredRegion = 'auto';

// Brand directory for SSR resolution
const STOREFRONTS: Record<string, {
  name: string;
  slug: string;
  tagline: string;
  banner: string;
  logo: string;
  announcement: string;
  about: string;
  accent: string;
  products: Array<{
    id: string;
    name: string;
    category: string;
    price: number;
    image: string;
    tryOn: boolean;
  }>;
}> = {
  'aura-atelier': {
    name: 'Aura Atelier',
    slug: 'aura-atelier',
    tagline: 'Quiet Luxury & Ethical Sustainable Silk',
    banner: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&auto=format&fit=crop&q=80',
    logo: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=200&auto=format&fit=crop&q=80',
    announcement: 'Complimentary worldwide express delivery on orders over $150',
    about: 'Born in Milan, Aura Atelier crafts timeless silhouette pieces using certified organic mulberry silks and heirloom Belgian linens.',
    accent: '#38bdf8',
    products: [
      {
        id: 'p1',
        name: 'Elysian Draped Silk Slip Dress',
        category: 'Dresses',
        price: 245,
        image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=80',
        tryOn: true
      },
      {
        id: 'p2',
        name: 'Sculpted Linen Cross-Halter Top',
        category: 'Tops',
        price: 135,
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
        tryOn: true
      },
      {
        id: 'p3',
        name: 'Aura Tailored Pleat Trousers',
        category: 'Bottoms',
        price: 180,
        image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&auto=format&fit=crop&q=80',
        tryOn: true
      }
    ]
  },
  'vogue-nova': {
    name: 'Vogue Nova',
    slug: 'vogue-nova',
    tagline: 'Futuristic Streetwear & Structural Tailoring',
    banner: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&auto=format&fit=crop&q=80',
    logo: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200&auto=format&fit=crop&q=80',
    announcement: 'Autumn/Winter Cybernetics Drop Live Now',
    about: 'Technical fabrics meet architectural streetwear silhouettes for high-density urban living.',
    accent: '#f43f5e',
    products: [
      {
        id: 'p4',
        name: 'Cyber-Tailored Oversized Blazer',
        category: 'Outerwear',
        price: 320,
        image: 'https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?w=800&auto=format&fit=crop&q=80',
        tryOn: true
      }
    ]
  }
};

// Dynamic Server-Side Rendering (SSR) SEO Metadata Generator
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const store = STOREFRONTS[params.slug];
  if (!store) {
    return {
      title: 'Storefront Not Found | V-TRY Platform',
      description: 'The requested independent designer storefront could not be located.'
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://brands.v-try.fashion';

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

export default function StorefrontPage({ params }: Props) {
  const store = STOREFRONTS[params.slug];
  if (!store) {
    notFound();
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://brands.v-try.fashion';

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
                priceCurrency: 'USD',
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdGraph) }}
      />
      <StorefrontClient brand={store} products={store.products} />
    </>
  );
}
