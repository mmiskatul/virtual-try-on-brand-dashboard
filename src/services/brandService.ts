import { BRAND_API_URL, brandFetch } from '../lib/api';
import { BrandProfile, Fabric, InventoryMovement, Order, Product } from '../types';

const API_BASE = BRAND_API_URL;

export class ServiceError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
    this.name = 'ServiceError';
  }
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await brandFetch(`${API_BASE}${path}`, {
      ...init,
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
    const ss = t.storefrontSettings || {};
    const slug = t.slug || 'brand';
    const baseSettings = {
      timezone: 'UTC',
      dateFormat: 'YYYY-MM-DD',
      language: 'English',
      currency: 'BDT',
      taxRatePercent: 0,
      taxInclusive: false,
      freeShippingThreshold: 150,
      defaultShippingFee: 12,
      emailNotifications: true,
      orderNotifications: true,
      inventoryNotifications: true,
      tryOnNotifications: true,
      billingNotifications: true,
      twoFactorEnabled: false,
    };
    return {
      id: t.id,
      name: t.name,
      slug,
      email: t.contactEmail,
      onboardingCompleted: Boolean(ss.onboardingCompleted),
      onboardingCompletedAt: typeof ss.onboardingCompletedAt === 'number' ? ss.onboardingCompletedAt : undefined,
      owner: ss.ownerName || undefined,
      legalName: ss.legalName || undefined,
      businessType: ss.businessType || undefined,
      phone: ss.phone || undefined,
      city: ss.city || undefined,
      country: ss.country || undefined,
      address: ss.address || undefined,
      categoryFocus: ss.categoryFocus || undefined,
      ...(Array.isArray(ss.categories) && ss.categories.length > 0 ? { specialties: ss.categories } : {}),
      slogan: ss.slogan || undefined,
      shortDescription: ss.shortDescription || undefined,
      description: t.description,
      brandStory: ss.aboutText || t.description || undefined,
      logo: t.logoUrl || undefined,
      banner: t.bannerUrl || ss.bannerImage || undefined,
      announcement: ss.announcement,
      primaryColor: ss.primaryColor,
      accentColor: ss.accentColor,
      ...(ss.socialLinks ? { socialLinks: ss.socialLinks } : {}),
      ...(ss.currency ? { settings: baseSettings } : {}),
      ...(ss.storefrontTitle || ss.shortDescription || t.description
        ? {
            seo: {
              title: ss.storefrontTitle || '',
              description: ss.shortDescription || t.description || '',
              canonicalUrl: `https://vton.store/brands/${slug}`,
              ogImage: t.bannerUrl || ss.bannerImage || '',
              allowIndexing: true,
            },
          }
        : {}),
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

  // Brand Categories, Collections & SKU Variants (Phase 3 Enterprise Catalog)
  getCategories: async () => {
    const res = await apiFetch<any>('/api/v1/brand/categories');
    return res?.data?.categories || res?.categories || [];
  },

  createCategory: (payload: { name: string; slug?: string; sortOrder?: number; seoTitle?: string }) =>
    apiFetch<any>('/api/v1/brand/categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getCollections: async () => {
    const res = await apiFetch<any>('/api/v1/brand/collections');
    return res?.data?.collections || res?.collections || [];
  },

  createCollection: (payload: { title: string; slug?: string; description?: string }) =>
    apiFetch<any>('/api/v1/brand/collections', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  upsertVariant: (
    productId: string,
    payload: { sku: string; size: string; color: string; priceOverride?: number; stockQuantity: number; available?: boolean }
  ) =>
    apiFetch<any>(`/api/v1/products/${encodeURIComponent(productId)}/variants`, {
      method: 'POST',
      body: JSON.stringify(payload),
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

  // Plans, Subscription & Real-Time Credit Accounting
  getPublicPlans: async () => {
    const res = await apiFetch<any>('/api/v1/plans');
    return res?.data?.plans || res?.plans || [];
  },

  getBillingSummary: async () => {
    const res = await apiFetch<any>('/api/v1/brand/billing');
    return res?.data || res;
  },

  subscribePlan: async (planSlug: 'STARTER' | 'PRO' | 'ENTERPRISE', billingInterval: 'MONTHLY' | 'ANNUAL' = 'MONTHLY') => {
    const res = await apiFetch<any>('/api/v1/brand/billing/subscribe', {
      method: 'POST',
      body: JSON.stringify({ planSlug, billingInterval }),
    });
    return res?.data || res;
  },

  // Reviews & Brand Support Tickets
  getProductReviews: async (productId: string) => {
    const res = await apiFetch<any>(`/api/v1/products/${encodeURIComponent(productId)}/reviews`);
    return res?.data || res;
  },

  replyToReview: async (reviewId: string, reply: string) => {
    const res = await apiFetch<any>(`/api/v1/reviews/${encodeURIComponent(reviewId)}/reply`, {
      method: 'POST',
      body: JSON.stringify({ reply }),
    });
    return res?.data || res;
  },

  getSupportTickets: async () => {
    const res = await apiFetch<any>('/api/v1/support/tickets');
    return res?.data?.tickets || [];
  },

  createSupportTicket: async (payload: { subject: string; category?: string; priority?: 'LOW' | 'MEDIUM' | 'HIGH'; message: string }) => {
    const res = await apiFetch<any>('/api/v1/support/tickets', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res?.data || res;
  },

  executeTryOn: async (params: {
    productId: string;
    personImage: string;
    garmentImage: string;
    category: string;
  }): Promise<{ mode: 'live_ai' | 'unavailable'; resultUrl?: string; message?: string }> => {
    // 1. Prefer enterprise async job orchestrator (Outbox -> Worker/AI Service -> Signed Result URL)
    try {
      const submitRes = await apiFetch<any>('/api/v1/try-on/jobs', {
        method: 'POST',
        headers: { 'Idempotency-Key': `studio_${params.productId}_${Date.now()}` },
        body: JSON.stringify({
          productId: params.productId,
          personImageUrl: params.personImage,
          garmentImageUrl: params.garmentImage,
          category: params.category,
        }),
      });
      const job = submitRes?.data || submitRes;
      if (job?.jobId) {
        if (job.status === 'COMPLETED' && job.resultUrl) {
          return { mode: 'live_ai', resultUrl: job.resultUrl };
        }
        for (let i = 0; i < 15; i++) {
          await new Promise((r) => setTimeout(r, 1000));
          const statusRes = await apiFetch<any>(`/api/v1/try-on/jobs/${encodeURIComponent(job.jobId)}`);
          const poll = statusRes?.data || statusRes;
          if (poll?.status === 'COMPLETED' && poll?.resultUrl) {
            return { mode: 'live_ai', resultUrl: poll.resultUrl };
          }
          if (poll?.status === 'FAILED' || poll?.status === 'CANCELLED') {
            return { mode: 'unavailable', message: poll.errorMessage || 'AI try-on generation failed.' };
          }
        }
      }
    } catch {
      // Fallback transparently to synchronous /direct endpoint if async job orchestrator is unreachable
    }

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

