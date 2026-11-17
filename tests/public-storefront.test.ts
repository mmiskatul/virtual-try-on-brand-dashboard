import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchPublicStorefront } from '@/lib/public-storefront';

afterEach(() => vi.restoreAllMocks());

const backendPayload = {
  success: true,
  data: {
    tenant: { name: 'Test Atelier', slug: 'test-atelier', storefrontSettings: { accentColor: '#111111' } },
    products: [
      { id: 'a', name: 'Published', price: 10, images: ['x.png'], brandStorefrontPublished: true, isTryOnEligible: true },
      { id: 'b', name: 'Draft', price: 5, images: [], brandStorefrontPublished: false },
    ],
  },
};

describe('fetchPublicStorefront', () => {
  it('maps backend data and hides unpublished products', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => backendPayload }));
    const store = await fetchPublicStorefront('test-atelier');
    expect(store?.name).toBe('Test Atelier');
    expect(store?.products.map((p) => p.id)).toEqual(['a']);
    expect(store?.products[0].tryOn).toBe(true);
  });
  it('returns null for unknown brands and backend failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    expect(await fetchPublicStorefront('nope')).toBeNull();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('down')));
    expect(await fetchPublicStorefront('nope')).toBeNull();
  });
  it('rejects malformed slugs without calling the backend', async () => {
    const f = vi.fn();
    vi.stubGlobal('fetch', f);
    expect(await fetchPublicStorefront('../../etc/passwd')).toBeNull();
    expect(f).not.toHaveBeenCalled();
  });
});
