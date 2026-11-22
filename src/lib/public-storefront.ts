/**
 * Resolves a public brand storefront from the backend (single source of truth).
 * Returns null when the brand does not exist or the backend is unreachable.
 */
export interface PublicStorefront {
  name: string;
  slug: string;
  tagline: string;
  banner: string;
  logo: string;
  announcement: string;
  about: string;
  accent: string;
  /** False when the brand has closed its store for now. */
  open: boolean;
  seoTitle: string;
  seoDescription: string;
  products: Array<{
    id: string;
    name: string;
    category: string;
    price: number;
    image: string;
    tryOn: boolean;
  }>;
}

function backendBase(): string {
  return (
    process.env.INTERNAL_BACKEND_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_API_URL ||
    'http://localhost:4000'
  ).replace(/\/+$/, '');
}

export async function fetchPublicStorefront(slug: string): Promise<PublicStorefront | null> {
  if (!/^[a-z0-9][a-z0-9-]{0,80}$/i.test(slug)) return null;
  try {
    const res = await fetch(`${backendBase()}/api/v1/brands/${encodeURIComponent(slug)}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 120 },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const data = json?.data ?? json;
    const t = data?.tenant;
    if (!t?.name) return null;
    const s = t.storefrontSettings || {};
    const products = Array.isArray(data.products) ? data.products : [];
    return {
      name: t.name,
      slug: t.slug || slug,
      tagline: s.slogan || t.description || '',
      banner: t.bannerUrl || s.bannerImage || '',
      logo: t.logoUrl || '',
      announcement: s.announcement || '',
      about: s.aboutText || t.description || '',
      accent: s.accentColor || s.primaryColor || '#0F172A',
      open: s.store?.open !== false,
      seoTitle: s.store?.seo?.title || '',
      seoDescription: s.store?.seo?.description || '',
      products: products
        .filter((p: any) => p.brandStorefrontPublished)
        .map((p: any) => ({
          id: String(p.id),
          name: String(p.name),
          category: String(p.category || ''),
          price: Number(p.price) || 0,
          image: (Array.isArray(p.images) && p.images[0]) || '',
          tryOn: Boolean(p.isTryOnEligible),
        })),
    };
  } catch {
    return null;
  }
}
