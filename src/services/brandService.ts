import { BRAND_API_URL, brandFetch } from '../lib/api';
import type { ProductPayload } from '../lib/productContract';
import { normalizeHeaderStyle } from '../features/onboarding/onboardingPresets';
import { BrandProfile, InventoryMovement, Order, Product } from '../types';

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

export interface ServerTryOnConfig {
  enabled: boolean;
  publicPageActive: boolean;
  requireConsent: boolean;
  retentionDays: number;
  privacyPolicyUrl: string;
  termsUrl: string;
  dataProcessingNotice: string;
  appearance: {
    pageTitle: string;
    pageDescription: string;
    uploadInstructions: string;
    primaryBtnText: string;
    uploadBtnText: string;
    generateBtnText: string;
    retryBtnText: string;
    loadingText: string;
    successText: string;
    errorText: string;
    accentColor: string;
    backgroundColor: string;
    gridStyle: '3-col' | '4-col' | 'editorial';
    previewLayout: 'split' | 'centered';
    showPrices: boolean;
    showRatings: boolean;
  };
}

export type TryOnConfigPatch = Partial<Omit<ServerTryOnConfig, 'appearance'>> & {
  appearance?: Partial<ServerTryOnConfig['appearance']>;
};

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  readAt?: string;
}

export interface BrandReview {
  id: string;
  productId: string;
  productName: string;
  authorName: string;
  rating: number;
  comment: string;
  verifiedBuy: boolean;
  brandReply?: string;
  createdAt: string;
}

export interface SessionInfo {
  id: string;
  deviceLabel: string;
  ipMasked: string;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
}

export interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  createdAt?: string | number;
  updatedAt?: string | number;
  messages?: Array<{ id: string; body?: string; message?: string; authorName?: string; createdAt?: string | number }>;
}

export interface BrandCustomer {
  email: string;
  name: string;
  city: string;
  country: string;
  orderCount: number;
  totalSpent: number;
  firstOrderAt: number;
  lastOrderAt: number;
  group: 'NEW' | 'RETURNING';
}

export interface CustomerOrderRow {
  id: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  itemCount: number;
  createdAt: number;
}

export interface BrandDiscount {
  id: string;
  code: string;
  description?: string;
  type: 'PERCENT' | 'FIXED';
  value: number;
  minOrder: number;
  maxUses: number | null;
  usedCount: number;
  startsAt: number | null;
  endsAt: number | null;
  active: boolean;
  createdAt: number;
}

export interface DiscountInput {
  code: string;
  description?: string;
  type: 'PERCENT' | 'FIXED';
  value: number;
  minOrder?: number;
  maxUses?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
  active?: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  roleName: string;
  isOwner: boolean;
  emailVerified: boolean;
  joinedAt: number;
  /** Access given to this person on top of their role. */
  extraPermissions: string[];
  /** Everything they can do: the role's fixed access plus the extras. */
  effectivePermissions: string[];
  mustChangePassword: boolean;
  disabled: boolean;
}

export interface GrantableAccess {
  key: string;
  label: string;
  help: string;
  ownerOnly?: boolean;
}

export interface NewTeamMember {
  name: string;
  email: string;
  role: string;
  password?: string;
  mustChangePassword?: boolean;
  extraPermissions?: string[];
}

export interface TeamMemberPatch {
  name?: string;
  role?: string;
  extraPermissions?: string[];
  disabled?: boolean;
}

export interface TeamInvite {
  id: string;
  email: string;
  role: string;
  roleName: string;
  invitedAt: number;
  expiresAt: number;
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';
}

export interface TeamRoleInfo {
  code: string;
  name: string;
  description: string;
  permissions: string[];
  /** The owner role is fixed and cannot be changed. */
  fixed?: boolean;
}

/** Making a try-on picture can take a minute or more, so those calls wait this long (other calls stay quick). */
const TRY_ON_TIMEOUT_MS = 120_000;

async function apiFetch<T>(path: string, init: RequestInit = {}, timeoutOverrideMs?: number): Promise<T> {
  const controller = new AbortController();
  const timeoutMs = timeoutOverrideMs ?? (init.body instanceof FormData ? 25000 : 8000);
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
      if (
        res.status === 403 &&
        (errJson?.code === 'PASSWORD_CHANGE_REQUIRED' || errJson?.error === 'PasswordChangeRequired') &&
        typeof window !== 'undefined' &&
        !window.location.pathname.startsWith('/change-password')
      ) {
        window.location.assign('/change-password');
      }
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
    shortDescription: raw.shortDescription ?? '',
    collections: raw.collection ? [raw.collection] : [],
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    audience: raw.audience === 'WOMEN' || raw.audience === 'MEN' || raw.audience === 'UNISEX' ? raw.audience : undefined,
    price: Number(raw.price ?? 0),
    compareAtPrice: raw.compareAtPrice ? Number(raw.compareAtPrice) : undefined,
    costPrice: raw.costPrice != null ? Number(raw.costPrice) : undefined,
    stock: variants.length > 0 ? totalStock : Number(raw.stock ?? 0),
    lowStockThreshold: raw.lowStockThreshold != null ? Number(raw.lowStockThreshold) : 5,
    warehouseLocation: raw.warehouseLocation || undefined,
    catalogStatus:
      raw.catalogStatus || (raw.brandStorefrontPublished || raw.marketplacePublished ? 'ACTIVE' : 'DRAFT'),
    brandStorefrontPublished: Boolean(raw.brandStorefrontPublished),
    marketplacePublished: Boolean(raw.marketplacePublished),
    isTryOnEligible: Boolean(raw.isTryOnEligible ?? true),
    tryOnCategory: raw.tryOnCategory || 'tops',
    includeInBrandTryOn: raw.includeInBrandTryOn ?? Boolean(raw.isTryOnEligible ?? true),
    includeInMarketplaceTryOn: raw.includeInMarketplaceTryOn ?? Boolean(raw.isTryOnEligible && raw.marketplacePublished),
    aiReferenceImage: raw.aiReferenceImage || raw.specs?._aiReferenceImage || undefined,
    imageQualityStatus: 'VERIFIED',
    image:
      (Array.isArray(raw.images) && raw.images[0]) ||
      raw.image ||
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80',
    images: Array.isArray(raw.images) && raw.images.length > 0 ? raw.images : undefined,
    variants,
    // Keys starting with "_" are internal and are not part of the product's specifications.
    specs: Object.fromEntries(Object.entries(raw.specs || {}).filter(([key]) => !key.startsWith('_'))),
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
  getProducts: async (params?: {
    search?: string;
    category?: string;
    status?: string;
    sortBy?: string;
  }): Promise<Product[]> => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.category && params.category !== 'All') query.set('category', params.category);
    if (params?.status && params.status !== 'All') query.set('status', params.status);
    if (params?.sortBy) query.set('sortBy', params.sortBy);
    const qs = query.toString();
    const res = await apiFetch<{ products: any[] } | any[]>(`/api/v1/products${qs ? `?${qs}` : ''}`);
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

  addProduct: async (payload: ProductPayload): Promise<Product> => {
    const res = await apiFetch<{ product: any }>('/api/v1/products/addproduct', {
      method: 'POST',
      headers: { 'Idempotency-Key': `addprod_${Date.now()}_${Math.random().toString(36).slice(2, 7)}` },
      body: JSON.stringify(payload),
    });
    return normalizeBackendProduct(res.product);
  },

  updateProduct: async (id: string, payload: Partial<ProductPayload>): Promise<Product> => {
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


  checkCategorySlug: async (
    slug: string,
    name?: string
  ): Promise<CheckCategorySlugResult> => {
    const params = new URLSearchParams();
    if (slug) params.set('slug', slug);
    if (name) params.set('name', name);
    const res = await apiFetch<any>(`/api/v1/brand/categories/check-slug?${params.toString()}`);
    return (
      res?.data ||
      res || {
        available: true,
        slug: slug.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        message: 'Slug available',
      }
    );
  },


  addCategory: async (payload: CreateCategoryPayload): Promise<BrandCategoryRecord> => {
    const res = await apiFetch<any>('/api/v1/brand/categories/add', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res?.data?.category || res?.category;
  },


  updateCategory: async (
    id: string,
    payload: {
      name?: string;
      slug?: string;
      sortOrder?: number;
      seoTitle?: string;
      description?: string;
      parentCategory?: string;
      tryOnCategory?: 'tops' | 'bottoms' | 'dresses' | 'outerwear' | 'all' | 'none';
      active?: boolean;
    }
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

  // Real try-on sessions for this brand (from the server, newest first).
  getTryOnJobs: async (limit = 100): Promise<Array<{ jobId: string; productId?: string; category?: string; status: string; errorCode?: string; errorMessage?: string; latencyMs?: number; createdAt?: number }>> => {
    const res = await apiFetch<any>(`/api/v1/try-on/jobs?limit=${limit}`);
    const jobs = res?.data?.jobs || res?.jobs || [];
    return Array.isArray(jobs) ? jobs.filter(Boolean) : [];
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

  // --- Try-on experience settings (saved per brand, read by the public try-on page) ---
  getTryOnConfig: async (): Promise<ServerTryOnConfig> => {
    const res = await apiFetch<any>('/api/v1/brand/try-on-config');
    return res.config;
  },

  saveTryOnConfig: async (patch: TryOnConfigPatch): Promise<ServerTryOnConfig> => {
    const res = await apiFetch<any>('/api/v1/brand/try-on-config', {
      method: 'PUT',
      body: JSON.stringify(patch),
    });
    return res.config;
  },

  getPublicTryOnConfig: async (slug: string): Promise<ServerTryOnConfig> => {
    const res = await apiFetch<any>(`/api/v1/brands/${encodeURIComponent(slug)}/try-on-config`);
    return res.config;
  },

  // --- Notifications ---
  getNotifications: async (): Promise<AppNotification[]> => {
    const res = await apiFetch<any>('/api/v1/notifications');
    return res?.data?.notifications || [];
  },

  markNotificationRead: async (id: string) => {
    await apiFetch<any>(`/api/v1/notifications/${encodeURIComponent(id)}/read`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  // --- Reviews inbox ---
  getBrandReviews: async (): Promise<BrandReview[]> => {
    const res = await apiFetch<any>('/api/v1/brand/reviews');
    return res?.data?.reviews || [];
  },

  // --- Account security ---
  getSessions: async (): Promise<{ currentSessionId: string | null; sessions: SessionInfo[] }> => {
    const res = await apiFetch<any>('/api/v1/auth/sessions');
    const data = res?.data || res;
    return { currentSessionId: data.currentSessionId || null, sessions: data.sessions || [] };
  },

  revokeSession: async (id: string) => {
    await apiFetch<any>(`/api/v1/auth/sessions/${encodeURIComponent(id)}/revoke`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const res = await apiFetch<any>('/api/v1/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return (res?.data || res) as { changed: boolean; revokedOtherSessions: number };
  },

  // --- Customers (derived from this brand's orders) ---
  getCustomers: async () => {
    return apiFetch<{ customers: BrandCustomer[]; totals: { customers: number; returning: number; revenue: number } }>(
      '/api/v1/brand/customers'
    );
  },

  getCustomer: async (email: string) => {
    return apiFetch<{ customer: BrandCustomer; orders: CustomerOrderRow[] }>(
      `/api/v1/brand/customers/${encodeURIComponent(email)}`
    );
  },

  // --- Discounts & coupons ---
  getDiscounts: async (): Promise<BrandDiscount[]> => {
    const res = await apiFetch<{ discounts: BrandDiscount[] }>('/api/v1/brand/discounts');
    return res.discounts;
  },

  createDiscount: async (input: DiscountInput): Promise<BrandDiscount> => {
    const res = await apiFetch<{ discount: BrandDiscount }>('/api/v1/brand/discounts', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return res.discount;
  },

  updateDiscount: async (id: string, patch: Partial<Omit<DiscountInput, 'code'>>): Promise<BrandDiscount> => {
    const res = await apiFetch<{ discount: BrandDiscount }>(`/api/v1/brand/discounts/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    return res.discount;
  },

  deleteDiscount: async (id: string) => {
    await apiFetch<any>(`/api/v1/brand/discounts/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  // --- Store settings: open or closed, delivery charges, search and sharing text ---
  getStoreSettings: async (): Promise<StoreSettings> => {
    const res = await apiFetch<{ settings: StoreSettings }>('/api/v1/brand/store-settings');
    return res.settings;
  },

  saveStoreSettings: async (patch: StoreSettingsPatch): Promise<StoreSettings> => {
    const res = await apiFetch<{ settings: StoreSettings }>('/api/v1/brand/store-settings', {
      method: 'PUT',
      body: JSON.stringify(patch),
    });
    return res.settings;
  },

  // How each discount code is doing (orders, sales, money given away)
  getDiscountStats: async (): Promise<DiscountStatsResponse> => apiFetch<DiscountStatsResponse>('/api/v1/brand/discounts/stats'),

  // --- Reports (all numbers come from the server) ---
  getSalesReport: (period: ReportPeriod) => apiFetch<SalesReport>(`/api/v1/brand/reports/sales?period=${period}`),
  getProductsReport: (period: ReportPeriod) => apiFetch<ProductsReport>(`/api/v1/brand/reports/products?period=${period}`),
  getCustomersReport: (period: ReportPeriod) => apiFetch<CustomersReport>(`/api/v1/brand/reports/customers?period=${period}`),
  getTryOnReport: (period: ReportPeriod) => apiFetch<TryOnReport>(`/api/v1/brand/reports/try-on?period=${period}`),

  // --- Team ---
  getTeam: async () => {
    return apiFetch<{
      members: TeamMember[];
      invites: TeamInvite[];
      roles: TeamRoleInfo[];
      grantable: GrantableAccess[];
      canGrantOwnerOnly: boolean;
      canCreateAdmins: boolean;
    }>('/api/v1/brand/team');
  },

  // Add a person straight away with an email and a password.
  createTeamMember: async (input: NewTeamMember) =>
    apiFetch<{ member: TeamMember; temporaryPassword?: string }>('/api/v1/brand/team/members', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  updateTeamMember: async (id: string, patch: TeamMemberPatch) =>
    apiFetch<{ member: TeamMember }>(`/api/v1/brand/team/members/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),

  resetTeamMemberPassword: async (id: string, password?: string) =>
    apiFetch<{ reset: boolean; temporaryPassword?: string }>(`/api/v1/brand/team/members/${encodeURIComponent(id)}/reset-password`, {
      method: 'POST',
      body: JSON.stringify(password ? { password } : {}),
    }),

  inviteTeamMember: async (email: string, role: string) => {
    return apiFetch<{ invite: TeamInvite; inviteUrl: string; emailDelivered: boolean }>('/api/v1/brand/team/invites', {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    });
  },

  revokeTeamInvite: async (id: string) => {
    await apiFetch<any>(`/api/v1/brand/team/invites/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  changeTeamMemberRole: async (userId: string, role: string) => {
    await apiFetch<any>(`/api/v1/brand/team/members/${encodeURIComponent(userId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  },

  removeTeamMember: async (userId: string) => {
    await apiFetch<any>(`/api/v1/brand/team/members/${encodeURIComponent(userId)}`, { method: 'DELETE' });
  },

  acceptTeamInvite: async (token: string, name: string, password: string) => {
    return apiFetch<{ accepted: boolean; email: string; brandName: string }>('/api/v1/auth/accept-invite', {
      method: 'POST',
      body: JSON.stringify({ token, name, password }),
    });
  },

  executeTryOn: async (params: {
    productId: string;
    personImage: string;
    garmentImage: string;
    category: string;
    /** Who is trying it on, and the size they usually wear. The picture is made to fit them. */
    gender?: 'female' | 'male';
    size?: string;
    /** The size of the garment they chose, so the picture shows how it fits compared with their own size. */
    garmentSize?: string;
    /** The shopper's answer to the privacy tick box. The backend refuses the photo if the brand needs consent and this is false. */
    consentGiven?: boolean;
    /** Optional styling choices such as tucked_in or sleeves_rolled. They ride along in the same request (no extra AI call). */
    styleOptions?: string[];
  }): Promise<{ mode: 'live_ai' | 'unavailable'; resultUrl?: string; message?: string }> => {
    // 1. Create a try-on job. The backend makes the picture with Gemini and we wait for it.
    let jobId: string | undefined;
    try {
      const submitRes = await apiFetch<any>('/api/v1/try-on/jobs', {
        method: 'POST',
        headers: { 'Idempotency-Key': `studio_${params.productId}_${Date.now()}` },
        body: JSON.stringify({
          productId: params.productId,
          personImageUrl: params.personImage,
          garmentImageUrl: params.garmentImage,
          category: params.category,
          ...(params.gender ? { gender: params.gender } : {}),
          ...(params.size ? { size: params.size } : {}),
          ...(params.garmentSize ? { garmentSize: params.garmentSize } : {}),
          ...(params.consentGiven !== undefined ? { consentGiven: params.consentGiven } : {}),
          ...(params.styleOptions?.length ? { styleOptions: params.styleOptions } : {}),
        }),
      }, TRY_ON_TIMEOUT_MS);
      const job = submitRes?.data || submitRes;
      jobId = job?.jobId;
      if (jobId) {
        if (job.status === 'COMPLETED' && job.resultUrl) {
          return { mode: 'live_ai', resultUrl: job.resultUrl };
        }
        // Gemini can take about half a minute, so wait up to a minute.
        for (let i = 0; i < 40; i++) {
          await new Promise((r) => setTimeout(r, 1500));
          const statusRes = await apiFetch<any>(`/api/v1/try-on/jobs/${encodeURIComponent(jobId)}`);
          const poll = statusRes?.data || statusRes;
          if (poll?.status === 'COMPLETED' && poll?.resultUrl) {
            return { mode: 'live_ai', resultUrl: poll.resultUrl };
          }
          if (poll?.status === 'FAILED' || poll?.status === 'CANCELLED') {
            return { mode: 'unavailable', message: poll.errorMessage || 'The try-on could not be created. Please try again.' };
          }
        }
        // A job exists, so do not start a second one (it would use another try-on credit).
        return { mode: 'unavailable', message: 'This is taking longer than usual. Please try again in a moment.' };
      }
    } catch (err: any) {
      if (jobId) return { mode: 'unavailable', message: err?.message || 'Could not check on your try-on. Please try again.' };
      // No job was created, so the one-step route below is safe to try.
    }

    try {
      const res = await apiFetch<any>('/api/v1/try-on/direct', {
        method: 'POST',
        headers: { 'Idempotency-Key': `studio_${params.productId}_${Date.now()}` },
        body: JSON.stringify(params),
      }, TRY_ON_TIMEOUT_MS);
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

  /** The signed-in person's real role and permissions, as the server sees them. */
  async getMyAccess(): Promise<{ role: string; permissions: string[] }> {
    const res = await apiFetch<{ data?: { role?: string; permissions?: string[] }; role?: string; permissions?: string[] }>('/api/v1/auth/rbac/me');
    const d = res.data ?? res;
    return { role: String(d.role || ''), permissions: Array.isArray(d.permissions) ? d.permissions : [] };
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
    /** Sizes below the alert level the brand set for them. */
    lowSizes?: Array<{ size: string; stock: number; threshold: number }>;
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
  description?: string;
  parentCategory?: string;
  tryOnCategory?: 'tops' | 'bottoms' | 'dresses' | 'outerwear' | 'all' | 'none';
  productCount?: number;
}

export interface CheckCategorySlugResult {
  available: boolean;
  slug: string;
  suggestedSlug?: string;
  message: string;
}

export interface CreateCategoryPayload {
  name: string;
  slug?: string;
  sortOrder?: number;
  seoTitle?: string;
  description?: string;
  parentCategory?: string;
  tryOnCategory?: 'tops' | 'bottoms' | 'dresses' | 'outerwear' | 'all' | 'none';
  active?: boolean;
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

export type ReportPeriod = '7d' | '30d' | '90d';

export interface SalesReport {
  period: ReportPeriod;
  revenue: number;
  orders: number;
  averageOrderValue: number;
  previous: { revenue: number; orders: number; averageOrderValue: number };
  change: { revenue: number | null; orders: number | null; averageOrderValue: number | null };
  discountsGiven: number;
  byStatus: Record<string, number>;
  series: Array<{ date: string; label: string; revenue: number; orders: number }>;
}

export interface ProductsReport {
  period: ReportPeriod;
  top: Array<{ productId: string; name: string; imageUrl?: string; units: number; revenue: number }>;
  notSold: Array<{ productId: string; name: string; imageUrl?: string }>;
  totalUnits: number;
}

export interface CustomersReport {
  period: ReportPeriod;
  totalCustomers: number;
  newBuyers: number;
  returningBuyers: number;
  top: Array<{ email: string; name: string; orders: number; spent: number; lastOrderAt: number }>;
}

export interface TryOnReport {
  period: ReportPeriod;
  total: number;
  completed: number;
  failed: number;
  inProgress: number;
  successRate: number | null;
  change: { total: number | null };
  series: Array<{ date: string; label: string; tryOns: number }>;
  topProducts: Array<{ productId: string; name: string; count: number }>;
}

export interface DiscountStatsResponse {
  stats: Array<{ id: string; code: string; orders: number; revenue: number; discountGiven: number }>;
  totals: { orders: number; revenue: number; discountGiven: number };
}

export interface StoreSettings {
  open: boolean;
  shipping: { defaultFee: number; freeOver: number | null };
  seo: { title: string; description: string };
  /** Who the whole store is for. UNISEX means both women and men. */
  audience: 'WOMEN' | 'MEN' | 'UNISEX';
  returns: { policy: string; windowDays: number | null };
}

export interface StoreSettingsPatch {
  open?: boolean;
  shipping?: Partial<StoreSettings['shipping']>;
  seo?: Partial<StoreSettings['seo']>;
  audience?: StoreSettings['audience'];
  returns?: Partial<StoreSettings['returns']>;
}
