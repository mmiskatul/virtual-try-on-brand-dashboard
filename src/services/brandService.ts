import { BrandProfile, Fabric, InventoryMovement, Order, Product } from '../types';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:4000';

export class ServiceError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
    this.name = 'ServiceError';
  }
}

function authHeaders(extra?: Record<string, string>): Headers {
  const headers = new Headers(extra || {});
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('brand_token');
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }
  return headers;
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const isFormData = init.body instanceof FormData;
    const headers = authHeaders(
      init.headers ? (Object.fromEntries(new Headers(init.headers).entries()) as Record<string, string>) : undefined
    );
    if (isFormData) headers.delete('Content-Type');

    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new ServiceError(
        res.status,
        errJson?.message || `Request failed (${res.status})`,
        errJson?.error
      );
    }
    return res.json();
  } catch (err: any) {
    clearTimeout(timeout);
    if (err instanceof ServiceError) throw err;
    throw new ServiceError(503, err?.message || 'Backend service unavailable');
  }
}

export function normalizeBackendProduct(raw: any): Product {
  const variants = Array.isArray(raw.variants) ? raw.variants : [];
  const totalStock = variants.reduce(
    (sum: number, v: any) => sum + (Number(v.stockQuantity) || 0),
    0
  );
  return {
    id: raw.id,
    tenantId: raw.tenantId,
    name: raw.name,
    slug: raw.slug || String(raw.name || raw.id).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    sku: raw.sku || `SKU-${String(raw.id).slice(-4).toUpperCase()}`,
    category: raw.category || 'Apparel',
    subCategory: raw.subCategory,
    description: raw.description || '',
    shortDescription: raw.description ? String(raw.description).slice(0, 120) : '',
    collections: raw.collection ? [raw.collection] : [],
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    price: Number(raw.price ?? 0),
    compareAtPrice: raw.compareAtPrice ? Number(raw.compareAtPrice) : undefined,
    stock: variants.length > 0 ? totalStock : Number(raw.stock ?? 0),
    lowStockThreshold: 5,
    catalogStatus: raw.brandStorefrontPublished || raw.marketplacePublished ? 'ACTIVE' : 'DRAFT',
    brandStorefrontPublished: Boolean(raw.brandStorefrontPublished),
    marketplacePublished: Boolean(raw.marketplacePublished),
    isTryOnEligible: Boolean(raw.isTryOnEligible ?? true),
    tryOnCategory: raw.tryOnCategory || 'tops',
    includeInBrandTryOn: Boolean(raw.isTryOnEligible ?? true),
    includeInMarketplaceTryOn: Boolean(raw.isTryOnEligible && raw.marketplacePublished),
    imageQualityStatus: 'VERIFIED',
    image:
      (Array.isArray(raw.images) && raw.images[0]) ||
      raw.image ||
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80',
    images: Array.isArray(raw.images) && raw.images.length > 0 ? raw.images : undefined,
    variants,
    specs: raw.specs || {},
    createdAt: raw.createdAt ? new Date(raw.createdAt).toISOString().slice(0, 10) : undefined,
    updatedAt: raw.updatedAt ? new Date(raw.updatedAt).toISOString().slice(0, 10) : undefined,
  };
}

export function normalizeBackendOrder(raw: any): Order {
  const items = Array.isArray(raw.items) ? raw.items : [];
  return {
    id: raw.id,
    tenantId: raw.tenantId,
    customerName: raw.shippingAddress?.fullName || raw.customerEmail || 'Customer',
    customerEmail: raw.customerEmail || '',
    total: Number(raw.totalAmount ?? raw.total ?? 0),
    subtotal: Number(raw.subtotal ?? raw.totalAmount ?? 0),
    shippingFee: Number(raw.shippingFee ?? 0),
    status: raw.status || 'PROCESSING',
    paymentStatus: raw.paymentStatus || 'PAID',
    shippingAddress: raw.shippingAddress,
    items,
    itemCount: items.reduce((sum: number, i: any) => sum + (Number(i.quantity) || 1), 0) || 1,
    date: raw.createdAt ? new Date(raw.createdAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
  };
}

export const brandWorkspaceApi = {
  // Brand Profile & Analytics
  getProfile: async (): Promise<Partial<BrandProfile> & { id: string }> => {
    const res = await apiFetch<{ tenant: any }>('/api/v1/brand/profile');
    const t = res.tenant;
    return {
      id: t.id,
      name: t.name,
      slug: t.slug,
      email: t.contactEmail,
      description: t.description,
      logo: t.logoUrl || undefined,
      banner: t.bannerUrl || t.storefrontSettings?.bannerImage || undefined,
      announcement: t.storefrontSettings?.announcement,
      primaryColor: t.storefrontSettings?.primaryColor,
      accentColor: t.storefrontSettings?.accentColor,
      storeStatus: t.status === 'ACTIVE' ? 'LIVE' : 'MAINTENANCE',
    };
  },

  updateProfile: (payload: Partial<{ name: string; description: string; contactEmail: string; logoUrl: string; bannerUrl: string; storefrontSettings: any }>) =>
    apiFetch<{ message: string; tenant: any }>('/api/v1/brand/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  updateStorefrontSettings: (settings: Record<string, any>) =>
    apiFetch<{ message: string; tenant: any }>('/api/v1/brand/storefront-settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),

  getAnalytics: () => apiFetch<any>('/api/v1/brand/analytics'),

  // Products & Dual Publication
  getProducts: async (): Promise<Product[]> => {
    const res = await apiFetch<{ products: any[] } | any[]>('/api/v1/products');
    const list = Array.isArray(res) ? res : res?.products || [];
    return list.map(normalizeBackendProduct);
  },

  createProduct: async (payload: any): Promise<Product> => {
    const res = await apiFetch<{ product: any }>('/api/v1/products', {
      method: 'POST',
      headers: { 'Idempotency-Key': `prod_${Date.now()}_${Math.random().toString(36).slice(2, 7)}` },
      body: JSON.stringify(payload),
    });
    return normalizeBackendProduct(res.product);
  },

  updateProduct: async (id: string, payload: any): Promise<Product> => {
    const res = await apiFetch<{ product: any }>(`/api/v1/products/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return normalizeBackendProduct(res.product);
  },

  setPublication: (
    productId: string,
    channel: 'brandStorefrontPublished' | 'marketplacePublished',
    published: boolean
  ) =>
    apiFetch<any>(`/api/v1/products/${encodeURIComponent(productId)}/publish`, {
      method: 'PATCH',
      body: JSON.stringify({ channel, published }),
    }),

  deleteProduct: (id: string) =>
    apiFetch<{ message: string }>(`/api/v1/products/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  // Fabrics
  getFabrics: async (): Promise<Fabric[]> => {
    const res = await apiFetch<{ fabrics: Fabric[] } | Fabric[]>('/api/v1/fabrics');
    return Array.isArray(res) ? res : res?.fabrics || [];
  },

  createFabric: (fabric: Partial<Fabric>) =>
    apiFetch<{ fabric: Fabric }>('/api/v1/fabrics', {
      method: 'POST',
      body: JSON.stringify(fabric),
    }),

  // Inventory
  adjustInventory: (payload: { productId: string; variantSku: string; change: number; reason: string }) =>
    apiFetch<{ message: string; newStock: number }>('/api/v1/inventory/adjust', {
      method: 'POST',
      headers: { 'Idempotency-Key': `inv_${payload.variantSku}_${Date.now()}` },
      body: JSON.stringify(payload),
    }),

  getInventoryLogs: async (): Promise<InventoryMovement[]> => {
    const res = await apiFetch<{ logs: any[] }>('/api/v1/inventory/logs');
    return (res.logs || []).map((l) => ({
      id: l.id,
      productId: l.productId,
      productName: l.productId,
      variantSku: l.variantSku,
      location: 'Primary Studio',
      change: l.change,
      newStock: l.newStock,
      reason: l.reason,
      actor: 'Authorized Staff',
      timestamp: l.timestamp ? new Date(l.timestamp).toLocaleString() : '',
    }));
  },

  // Orders
  getOrders: async (): Promise<Order[]> => {
    const res = await apiFetch<{ orders: any[] } | any[]>('/api/v1/brand/orders');
    const list = Array.isArray(res) ? res : res?.orders || [];
    return list.map(normalizeBackendOrder);
  },

  updateOrderStatus: (orderId: string, status: string) =>
    apiFetch<{ message: string; order: any }>(`/api/v1/brand/orders/${encodeURIComponent(orderId)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  // Media Uploads (Cloudinary + fallback)
  uploadMediaFile: async (file: File): Promise<{ ok: boolean; url?: string; provider?: string; error?: string }> => {
    if (!file.type.startsWith('image/')) {
      return { ok: false, error: 'Only JPG, PNG, or WebP images are supported.' };
    }
    if (file.size > 10 * 1024 * 1024) {
      return { ok: false, error: 'Image must be 10 MB or less.' };
    }

    const form = new FormData();
    form.append('file', file);
    try {
      const res = await apiFetch<{ url: string; provider: string }>('/api/v1/uploads', {
        method: 'POST',
        body: form,
      });
      return { ok: true, url: res.url, provider: res.provider };
    } catch {
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.readAsDataURL(file);
      });
      return { ok: true, url: dataUrl, provider: 'local_preview' };
    }
  },

  // Public Storefront Discovery (Strictly Tenant-Isolated)
  getPublicStorefront: async (brandSlug: string) => {
    const res = await apiFetch<{ tenant: any; products: any[] }>(
      `/api/v1/internal/storefront/${encodeURIComponent(brandSlug)}`
    );
    return {
      tenant: res.tenant,
      products: (res.products || [])
        .map(normalizeBackendProduct)
        .filter((p) => p.tenantId === res.tenant.id && p.brandStorefrontPublished),
    };
  },

  // Try-On Provider Status & Execution
  getTryOnProviderStatus: () =>
    apiFetch<{ mode: string; provider: string; status: string }>('/api/v1/try-on/provider'),

  executeTryOn: async (params: {
    productId: string;
    personImage: string;
    garmentImage: string;
    category: string;
  }): Promise<{ mode: 'live_ai' | 'unavailable'; resultUrl?: string; message?: string }> => {
    try {
      const res = await apiFetch<any>('/api/v1/try-on/direct', {
        method: 'POST',
        headers: { 'Idempotency-Key': `studio_${params.productId}_${Date.now()}` },
        body: JSON.stringify(params),
      });
      const resultUrl =
        res.resultUrl || res.output_url || res.outputImageUrl || res.result?.output_url;
      if (resultUrl) {
        return { mode: 'live_ai', resultUrl };
      }
      return { mode: 'unavailable', message: 'Backend returned no output URL.' };
    } catch (err: any) {
      return {
        mode: 'unavailable',
        message: err?.message || 'AI try-on engine unavailable or product not published.',
      };
    }
  },
};

