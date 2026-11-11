import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
export const preferredRegion = 'auto';

const BRAND_STOREFRONTS: Record<string, any> = {
  'aura-atelier': {
    name: 'Aura Atelier',
    slug: 'aura-atelier',
    tagline: 'Quiet Luxury & Ethical Sustainable Silk',
    banner: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&auto=format&fit=crop&q=80',
    logo: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=200&auto=format&fit=crop&q=80',
    announcement: 'Complimentary worldwide express delivery on orders over $150',
    about: 'Born in Milan, Aura Atelier crafts timeless silhouette pieces using certified organic mulberry silks and heirloom Belgian linens.',
    accent: '#000000',
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

/**
 * Edge Runtime Storefront Data Routing Handler
 * Resolves brand boutique and apparel collections globally with edge caching.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const startTime = Date.now();
  const { slug } = params;

  let store = BRAND_STOREFRONTS[slug];

  // Try fetching upstream from brand-api microservice
  const brandApiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
  if (brandApiUrl) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);

      const res = await fetch(`${brandApiUrl}/api/storefront/${slug}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && data.name) {
          store = data;
        }
      }
    } catch {
      // Fallback seamlessly to local edge catalog
    }
  }

  if (!store) {
    return NextResponse.json(
      { success: false, error: `Storefront '${slug}' not found` },
      { status: 404 }
    );
  }

  const durationMs = Date.now() - startTime;

  return NextResponse.json(
    {
      success: true,
      store,
      edge: {
        runtime: 'Vercel Edge Network (V8 Isolate)',
        durationMs,
        region: process.env.VERCEL_REGION || 'edge-auto',
      },
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600',
        'CDN-Cache-Control': 'max-age=120',
        'x-edge-runtime': 'vercel-edge-v8',
        'server-timing': `edge-storefront;dur=${durationMs}`,
      },
    }
  );
}
