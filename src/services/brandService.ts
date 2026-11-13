import { BRAND_API_URL, brandFetch } from '../lib/api';
import { normalizeHeaderStyle } from '../features/onboarding/onboardingPresets';
import { BrandProfile, Fabric, InventoryMovement, Order, Product } from '../types';

const API_BASE = BRAND_API_URL;

export interface ValidationIssue {
  path: string;
  message: string;
  code?: string;
}

export class ServiceError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public issues?: ValidationIssue[],
    public correlationId?: string
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeoutMs = init.body instanceof FormData ? 25000 : 8000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
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
        errJson?.code || errJson?.error,
        Array.isArray(errJson?.issues) ? errJson.issues : undefined,
        errJson?.correlationId
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

export function mapTenantToBrandProfile(t: any): Partial<BrandProfile> & { id: string } {
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
    onboardingCompletedAt:
      typeof ss.onboardingCompletedAt === 'number' ? ss.onboardingCompletedAt : undefined,
    owner: ss.ownerName || undefined,
    legalName: ss.legalName || undefined,
    businessType: ss.businessType || undefined,
    phone: ss.phone || undefined,
    city: ss.city || undefined,
    country: ss.country || undefined,
    address: ss.address || undefined,
    categoryFocus: ss.categoryFocus || undefined,
    ...(Array.isArray(ss.categories) && ss.categories.length > 0
      ? { specialties: ss.categories }
      : {}),
    slogan: ss.slogan || undefined,
    shortDescription: ss.shortDescription || undefined,
    establishedYear: ss.establishedYear || undefined,
    registrationNumber: ss.registrationNumber || undefined,
    description: t.description,
    brandStory: ss.aboutText || t.description || undefined,
    logo: t.logoUrl || undefined,
    lightLogo: ss.lightLogoUrl ?? undefined,
    banner: t.bannerUrl || ss.bannerImage || undefined,
    socialImage: ss.socialImageUrl ?? undefined,
    announcement: ss.announcement,
    primaryColor: ss.primaryColor,
    secondaryColor: ss.secondaryColor || undefined,
    accentColor: ss.accentColor,
    backgroundColor: ss.backgroundColor || undefined,
    textColor: ss.textColor || undefined,
    headingFont: ss.headingFont || undefined,
    bodyFont: ss.bodyFont || undefined,
    buttonStyle: ss.buttonStyle || undefined,
    ...(typeof ss.headerStyle === 'string'
      ? { headerStyle: normalizeHeaderStyle(ss.headerStyle) }
      : {}),
    ...(ss.socialLinks ? { socialLinks: ss.socialLinks } : {}),
    ...(ss.currency ? { settings: baseSettings } : {}),
    ...(ss.storefrontTitle || ss.shortDescription || t.description
      ? {
          seo: {
            title: ss.storefrontTitle || '',
            description: ss.shortDescription || t.description || '',
            canonicalUrl: `https://vton.store/brands/${slug}`,
            ogImage: ss.socialImageUrl || t.bannerUrl || ss.bannerImage || '',
            allowIndexing: true,
          },
        }
      : {}),
    verificationStatus:
      t.status === 'ACTIVE'
        ? 'VERIFIED'
        : t.status === 'PENDING_VERIFICATION'
        ? 'UNDER_REVIEW'
        : 'UNVERIFIED',
    storeStatus: t.status === 'ACTIVE' ? 'LIVE' : 'MAINTENANCE',
  };
}

export const brandWorkspaceApi = {
  // Brand Profile & Analytics
  getProfile: async (): Promise<Partial<BrandProfile> & { id: string }> => {
    const res = await apiFetch<{ tenant: any }>('/api/v1/brand/profile');
    return mapTenantToBrandProfile(res.tenant);
  },

  updateProfile: async (
    payload: Partial<{
      name: string;
      description: string;
      contactEmail: string;
      logoUrl: string;
      bannerUrl: string;
      storefrontSettings: any;
    }>
  ) => {
    const res = await apiFetch<{ message: string; tenant: any }>('/api/v1/brand/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return {
      ...res,
      profile: mapTenantToBrandProfile(res.tenant),
    };
  },

  updateStorefrontSettings: (settings: Record<string, any>) =>
    apiFetch<{ message: string; tenant: any }>('/api/v1/brand/storefront-settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),

  getVerification: () =>
    apiFetch<BrandVerificationSummary>('/api/v1/brand/verification'),

  updateBrandDetails: async (payload: BrandDetailsPatchPayload) => {
    const res = await apiFetch<{
      message: string;
      section: 'profile';
      tenant: any;
      verification?: BrandVerificationSummary;
    }>('/api/v1/brand/profile/details', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return {
      ...res,
      profile: mapTenantToBrandProfile(res.tenant),
    };
  },

  updateBrandIdentity: async (payload: BrandIdentityPatchPayload) => {
    const res = await apiFetch<{
      message: string;
      section: 'identity';
      tenant: any;
    }>('/api/v1/brand/identity', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return {
      ...res,
      profile: mapTenantToBrandProfile(res.tenant),
    };
  },

  updateBrandMediaSlot: async (slot: BrandMediaSlot, url: string) => {
    const res = await apiFetch<{
      message: string;
      slot: BrandMediaSlot;
      url: string;
      tenant: any;
    }>(`/api/v1/brand/media/${encodeURIComponent(slot)}`, {
      method: 'PUT',
      body: JSON.stringify({ url }),
    });
    return {
      ...res,
      profile: mapTenantToBrandProfile(res.tenant),
    };
  },

  deleteBrandMediaSlot: async (slot: BrandMediaSlot) => {
    const res = await apiFetch<{
      message: string;
      slot: BrandMediaSlot;
      url: string;
      tenant: any;
    }>(`/api/v1/brand/media/${encodeURIComponent(slot)}`, {
      method: 'DELETE',
    });
    return {
      ...res,
      profile: mapTenantToBrandProfile(res.tenant),
    };
  },

  getAnalytics: () => apiFetch<any>('/api/v1/brand/analytics'),

  // Products & Dual Publication
  getProducts: async (): Promise<Product[]> => {
    const res = await apiFetch<{ products: any[] } | any[]>('/api/v1/products');
    const list = Array.isArray(res) ? res : res?.products || [];
    return list.map(normalizeBackendProduct);
  },

  getProductFormOptions: () =>
    apiFetch<AddProductFormOptions>('/api/v1/products/form-options'),

  checkProductSku: (sku: string, excludeProductId?: string) => {
    const params = new URLSearchParams({ sku });
    if (excludeProductId) params.set('excludeProductId', excludeProductId);
    return apiFetch<{ sku: string; available: boolean; message: string }>(
      `/api/v1/products/check-sku?${params.toString()}`
    );
  },

  createProduct: async (payload: any): Promise<Product> => {
    const res = await apiFetch<{ product: any }>('/api/v1/products', {
      method: 'POST',
      headers: { 'Idempotency-Key': `prod_${Date.now()}_${Math.random().toString(36).slice(2, 7)}` },
      body: JSON.stringify(payload),
    });
    return normalizeBackendProduct(res.product);
  },

  addProduct: async (payload: any): Promise<Product> => {
    const res = await apiFetch<{ product: any }>('/api/v1/products/addproduct', {
      method: 'POST',
      headers: { 'Idempotency-Key': `addprod_${Date.now()}_${Math.random().toString(36).slice(2, 7)}` },
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
    channel: 'brandStorefrontPublished' | 'marketplacePublished' | 'isTryOnEligible',
    published: boolean
  ) =>
    apiFetch<any>(`/api/v1/products/${encodeURIComponent(productId)}/publish`, {
      method: 'PATCH',
      body: JSON.stringify({ channel, published }),
    }),

  bulkProductAction: async (
    productIds: string[],
    action:
      | 'PUBLISH_MARKETPLACE'
      | 'UNPUBLISH_MARKETPLACE'
      | 'SHOW_STOREFRONT'
      | 'HIDE_STOREFRONT'
      | 'ENABLE_TRYON'
      | 'DISABLE_TRYON'
      | 'ARCHIVE'
  ) => {
    const res = await apiFetch<{
      message: string;
      action: string;
      updatedCount: number;
      skippedCount: number;
      products: any[];
      errors: Array<{ productId: string; code: string; message: string }>;
    }>('/api/v1/products/bulk', {
      method: 'PATCH',
      body: JSON.stringify({ productIds, action }),
    });
    return {
      ...res,
      products: (res.products || []).map(normalizeBackendProduct),
    };
  },

  bulkImportProducts: async (
    rows: Array<{
      name: string;
      sku: string;
      category?: string;
      price: number;
      stock?: number;
      collection?: string;
      description?: string;
      tryOnCategory?: string;
    }>,
    skipDuplicateSkus = true
  ) => {
    const res = await apiFetch<{
      message: string;
      importedCount: number;
      skippedCount: number;
      importedProducts: any[];
      skipped: Array<{ rowNumber: number; sku: string; reason: string }>;
    }>('/api/v1/products/bulk-import', {
      method: 'POST',
      body: JSON.stringify({ rows, skipDuplicateSkus }),
    });
    return {
      ...res,
      importedProducts: (res.importedProducts || []).map(normalizeBackendProduct),
    };
  },

  exportProductsCsv: async (params?: { category?: string; status?: string }): Promise<string> => {
    const search = new URLSearchParams({ format: 'csv' });
    if (params?.category && params.category !== 'All') search.set('category', params.category);
    if (params?.status && params.status !== 'All') search.set('status', params.status);
    const res = await brandFetch(`${API_BASE}/api/v1/products/export?${search.toString()}`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new ServiceError(
        res.status,
        errJson?.message || `Export failed (${res.status})`,
        errJson?.code || errJson?.error,
        Array.isArray(errJson?.issues) ? errJson.issues : undefined,
        errJson?.correlationId
      );
    }
    return res.text();
  },

  deleteProduct: (id: string) =>
    apiFetch<{ message: string }>(`/api/v1/products/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  // Brand Categories, Collections & SKU Variants (Phase 3 Enterprise Catalog)
  getCategories: async (): Promise<BrandCategoryRecord[]> => {
    const res = await apiFetch<any>('/api/v1/brand/categories');
    return res?.data?.categories || res?.categories || [];
  },

  createCategory: async (payload: {
    name: string;
    slug?: string;
    sortOrder?: number;
    seoTitle?: string;
  }): Promise<BrandCategoryRecord> => {
    const res = await apiFetch<any>('/api/v1/brand/categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res?.data?.category || res?.category;
  },

  updateCategory: async (
    id: string,
    payload: { name?: string; slug?: string; sortOrder?: number; seoTitle?: string }
  ): Promise<BrandCategoryRecord> => {
    const res = await apiFetch<any>(`/api/v1/brand/categories/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return res?.data?.category || res?.category;
  },

  deleteCategory: (id: string) =>
    apiFetch<any>(`/api/v1/brand/categories/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  getCollections: async (): Promise<BrandCollectionRecord[]> => {
    const res = await apiFetch<any>('/api/v1/brand/collections');
    return res?.data?.collections || res?.collections || [];
  },

  createCollection: async (payload: {
    title: string;
    slug?: string;
    description?: string;
  }): Promise<BrandCollectionRecord> => {
    const res = await apiFetch<any>('/api/v1/brand/collections', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res?.data?.collection || res?.collection;
  },

  updateCollection: async (
    id: string,
    payload: { title?: string; slug?: string; description?: string }
  ): Promise<BrandCollectionRecord> => {
    const res = await apiFetch<any>(`/api/v1/brand/collections/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return res?.data?.collection || res?.collection;
  },

  deleteCollection: (id: string) =>
    apiFetch<any>(`/api/v1/brand/collections/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  upsertVariant: (
    productId: string,
    payload: { sku: string; size: string; color: string; priceOverride?: number; stockQuantity: number; available?: boolean }
  ) =>
    apiFetch<any>(`/api/v1/products/${encodeURIComponent(productId)}/variants`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteVariant: (productId: string, variantId: string) =>
    apiFetch<any>(`/api/v1/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}`, {
      method: 'DELETE',
    }),

  // Fabrics
  getFabrics: async (): Promise<Fabric[]> => {
    const res = await apiFetch<{ fabrics: Fabric[] } | Fabric[]>('/api/v1/fabrics');
    return Array.isArray(res) ? res : res?.fabrics || [];
  },

  createFabric: (fabric: Partial<Fabric>) =>
    apiFetch<{ message?: string; fabric: Fabric }>('/api/v1/fabrics', {
      method: 'POST',
      body: JSON.stringify(fabric),
    }),

  updateFabric: (id: string, fabric: Partial<Fabric>) =>
    apiFetch<{ message?: string; fabric: Fabric }>(`/api/v1/fabrics/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(fabric),
    }),

  deleteFabric: (id: string) =>
    apiFetch<{ message: string }>(`/api/v1/fabrics/${encodeURIComponent(id)}`, {
      method: 'DELETE',
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
    } catch (err: any) {
      if (err instanceof ServiceError && err.status !== 503) {
        return { ok: false, error: err.message || `Upload rejected (${err.status}).` };
      }
      if (file.size > 1.5 * 1024 * 1024) {
        return {
          ok: false,
          error: 'Backend upload service unreachable. Reconnect to upload images larger than 1.5 MB.',
        };
      }
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

  async getOverviewSummary(): Promise<BrandOverviewSummary> {
    return apiFetch<BrandOverviewSummary>('/api/v1/brand/overview');
  },

  async getOverviewTimeseries(params: {
    period: OverviewPeriod;
    startDate?: string;
    endDate?: string;
  }): Promise<BrandOverviewTimeseries> {
    const query = new URLSearchParams({ period: params.period });
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);
    return apiFetch<BrandOverviewTimeseries>(`/api/v1/brand/overview/timeseries?${query.toString()}`);
  },

  async getOverviewActivity(limit = 15): Promise<BrandOverviewActivityResponse> {
    return apiFetch<BrandOverviewActivityResponse>(
      `/api/v1/brand/overview/activity?limit=${encodeURIComponent(String(limit))}`
    );
  },

  async getOverviewChecklist(): Promise<BrandOverviewChecklist> {
    return apiFetch<BrandOverviewChecklist>('/api/v1/brand/overview/checklist');
  },

  async updateOverviewChecklist(
    payload: { toggleId?: OverviewChecklistId; completedIds?: OverviewChecklistId[] }
  ): Promise<BrandOverviewChecklist> {
    return apiFetch<BrandOverviewChecklist>('/api/v1/brand/overview/checklist', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },
};

export type OverviewPeriod = 'today' | '7d' | '30d' | '90d' | 'custom';

export type OverviewChecklistId =
  | 'chk_profile'
  | 'chk_logo'
  | 'chk_cover'
  | 'chk_biz'
  | 'chk_product'
  | 'chk_variants'
  | 'chk_storefront'
  | 'chk_tryon'
  | 'chk_publish'
  | 'chk_test_tryon';

export interface BrandOverviewSummary {
  currency: 'BDT';
  generatedAt: number;
  workspace: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string | null;
    status: string;
    plan: string;
    storeStatus: 'LIVE' | 'MAINTENANCE';
    marketplaceStatus: 'CONNECTED' | 'NOT_CONNECTED';
    tryOnStatus: 'TRY-ON ACTIVE' | 'PAUSED';
  };
  kpis: {
    totalRevenue: number;
    revenueChangeLabel: string;
    totalOrders: number;
    ordersChangeLabel: string;
    totalProducts: number;
    publishedStorefrontProducts: number;
    publishedMarketplaceProducts: number;
    totalCustomers: number;
    marketplaceViews: number;
    productSalesUnits: number;
    tryOnSessionsCount: number;
    tryOnUsed: number;
    tryOnQuota: number;
    tryOnCreditsLeft: number;
  };
  salesOverview: {
    totalRevenue: number;
    paidOrders: number;
    pendingOrders: number;
    cancelledOrders: number;
    refundedOrders: number;
    averageOrderValue: number;
  };
  tryOnPerformance: {
    loggedSessions: number;
    successful: number;
    failed: number;
    processingOrQueued: number;
    avgSpeedSec: number;
    cartConversions: number;
    attributedOrders: number;
    attributedRevenue: number;
    creditsUsed: number;
  };
  marketplaceActivity: {
    publishedPosts: number;
    draftOrScheduled: number;
    totalClicks: number;
    postRevenue: number;
  };
  topProducts: Array<{
    id: string;
    name: string;
    sku: string;
    price: number;
    stock: number;
    lowStockThreshold: number;
    salesCount: number;
    image: string;
  }>;
  lowStockProducts: Array<{
    id: string;
    name: string;
    sku: string;
    stock: number;
    lowStockThreshold: number;
  }>;
  recentOrders: Array<{
    id: string;
    customerName: string;
    customerEmail: string;
    total: number;
    status: string;
    paymentStatus: string;
    itemCount: number;
    date: string;
    createdAt: number;
  }>;
}

export interface BrandOverviewTimeseries {
  currency: 'BDT';
  period: OverviewPeriod;
  rangeStart: number;
  rangeEnd: number;
  totals: {
    revenue: number;
    orders: number;
    tryOns: number;
  };
  series: Array<{
    label: string;
    revenue: number;
    orders: number;
    tryOns: number;
  }>;
}

export interface BrandOverviewActivityResponse {
  activities: Array<{
    id: string;
    action: string;
    entity: string;
    details: string;
    actor: string;
    role: string;
    timestamp: string;
    createdAt: number;
  }>;
}

export interface BrandOverviewChecklist {
  completedIds: string[];
  autoCompletedIds: string[];
  manualCompletedIds: string[];
  completedCount: number;
  totalCount: number;
  completionPct: number;
  items: Array<{
    id: OverviewChecklistId;
    label: string;
    href: string;
    completed: boolean;
    autoCompleted: boolean;
  }>;
}

export type BrandMediaSlot = 'logo' | 'banner' | 'lightLogo' | 'socialImage';

export interface BrandDetailsPatchPayload {
  name?: string;
  contactEmail?: string;
  owner?: string;
  legalName?: string;
  businessType?: string;
  registrationNumber?: string;
  establishedYear?: string;
  phone?: string;
  city?: string;
  country?: string;
  address?: string;
  categoryFocus?: string;
  slogan?: string;
  shortDescription?: string;
  description?: string;
  announcement?: string;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    website?: string;
  };
}

export interface BrandIdentityPatchPayload {
  storefrontTitle?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  headingFont?: string;
  bodyFont?: string;
  buttonStyle?: 'pill' | 'rounded' | 'square';
  headerStyle?: string;
}

export interface AddProductFormOptions {
  categories: string[];
  collections: string[];
  fabrics: Array<{ id: string; name: string; composition: string }>;
  tryOnCategories: Array<'tops' | 'bottoms' | 'dresses' | 'outerwear' | 'all'>;
  defaultCurrency: 'BDT';
  suggestedSkuPrefix: string;
  quota: {
    plan: string;
    used: number;
    limit: number;
    remaining: number;
  };
}

export interface BrandCategoryRecord {
  id: string;
  tenantId: string | null;
  name: string;
  slug: string;
  sortOrder: number;
  active: boolean;
  seoTitle?: string;
}

export interface BrandCollectionRecord {
  id: string;
  tenantId: string | null;
  title: string;
  slug: string;
  description?: string;
  active: boolean;
  sponsored: boolean;
}

export interface BrandVerificationCheck {
  key: string;
  label: string;
  category: 'identity' | 'legal' | 'contact' | 'media';
  completed: boolean;
}

export interface BrandVerificationSummary {
  tenantId: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';
  storeActive: boolean;
  verificationScore: number;
  completedChecks: number;
  totalChecks: number;
  registrationNumber: string;
  legalName: string;
  contactEmail: string;
  checks: BrandVerificationCheck[];
  missingRequirements: string[];
  updatedAt: number;
}

