import { Product } from '../types';

/**
 * Server-Driven Data Cache with Precise Tags
 * Fetches merchant brand catalog with Next.js extended fetch options and granular cache tags.
 */
export async function getBrandServerProducts(): Promise<Product[]> {
  const brandApiUrl = process.env.NEXT_PUBLIC_BRAND_API_URL || 'http://localhost:4000';

  try {
    const res = await fetch(`${brandApiUrl}/api/products`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // Precise Server-Driven Next.js Cache Tags
      next: {
        tags: ['brand-products', 'brand-inventory'],
        revalidate: 3600,
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return data;
      }
    }
  } catch {
    // Return empty fallback if backend is offline
  }

  return [];
}
