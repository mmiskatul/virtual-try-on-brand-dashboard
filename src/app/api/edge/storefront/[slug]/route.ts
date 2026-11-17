import { NextRequest, NextResponse } from 'next/server';
import { fetchPublicStorefront } from '@/lib/public-storefront';

export const runtime = 'edge';
export const preferredRegion = 'auto';

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

  const store = await fetchPublicStorefront(slug);

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
