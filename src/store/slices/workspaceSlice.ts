import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  AbandonedCart,
  ActivityLogEntry,
  ApiCredential,
  BillingInvoice,
  BrandCustomer,
  BrandProfile,
  CustomerReview,
  DiscountCode,
  Fabric,
  InventoryMovement,
  MarketingCampaign,
  MarketplacePost,
  NavMenuItem,
  Order,
  PermissionAction,
  Product,
  ResourceModule,
  ReturnRequest,
  StaffRole,
  StorefrontPageRecord,
  StorefrontSectionConfig,
  TeamMember,
  TryOnConfiguration,
  TryOnGenerationSession,
  WarehouseLocation,
  WebhookSubscription,
} from '../../types';
import {
  DEMO_ABANDONED_CARTS,
  DEMO_ACTIVITY_LOGS,
  DEMO_API_KEYS,
  DEMO_BRAND_PROFILE,
  DEMO_CAMPAIGNS,
  DEMO_CUSTOMERS,
  DEMO_DISCOUNTS,
  DEMO_FABRICS,
  DEMO_INVENTORY_LOGS,
  DEMO_INVOICES,
  DEMO_MARKETPLACE_POSTS,
  DEMO_NAV_MENUS,
  DEMO_ORDERS,
  DEMO_PRODUCTS,
  DEMO_RETURNS,
  DEMO_REVIEWS,
  DEMO_STOREFRONT_PAGES,
  DEMO_STOREFRONT_SECTIONS,
  DEMO_TEAM,
  DEMO_TRYON_CONFIG,
  DEMO_TRYON_SESSIONS,
  DEMO_WAREHOUSES,
  DEMO_WEBHOOKS,
} from '../../data/brandDemoSeed';
import { DEFAULT_ROLE_PERMISSIONS } from '../../config/permissions';

export interface WorkspaceSliceState {
  _hydrated: boolean;
  isLiveBackend: boolean;
  lastSyncedAt: string | null;
  activeRole: StaffRole;
  sidebarCollapsed: boolean;
  openGroups: string[];

  profile: BrandProfile;
  products: Product[];
  fabrics: Fabric[];
  marketplacePosts: MarketplacePost[];
  orders: Order[];
  returns: ReturnRequest[];
  abandonedCarts: AbandonedCart[];
  warehouses: WarehouseLocation[];
  inventoryLogs: InventoryMovement[];
  customers: BrandCustomer[];
  reviews: CustomerReview[];
  campaigns: MarketingCampaign[];
  discounts: DiscountCode[];
  storefrontSections: StorefrontSectionConfig[];
  storefrontHasUnsavedDraft: boolean;
  storefrontLastPublishedAt: string | null;
  storefrontPages: StorefrontPageRecord[];
  navMenus: NavMenuItem[];
  tryOnConfig: TryOnConfiguration;
  tryOnSessions: TryOnGenerationSession[];
  teamMembers: TeamMember[];
  roleOverrides: Partial<Record<StaffRole, Partial<Record<ResourceModule, PermissionAction[]>>>>;
  activityLogs: ActivityLogEntry[];
  invoices: BillingInvoice[];
  apiKeys: ApiCredential[];
  webhooks: WebhookSubscription[];
  onboardingStep: number;
  onboardingStepByTenant: Record<string, number>;
  onboardingCompletedStepsByTenant: Record<string, number[]>;
  onboardingCompletedIds: string[];
  onboardedTenantIds: string[];
  onboardingProfileDrafts: Record<string, Partial<BrandProfile>>;
  backendOnboardingStatusByTenant: Record<string, boolean | null>;
}

export const PERSISTED_WORKSPACE_KEYS = [
  'activeRole',
  'sidebarCollapsed',
  'openGroups',
  'onboardingStep',
  'onboardingStepByTenant',
  'onboardingCompletedStepsByTenant',
  'onboardingCompletedIds',
  'onboardedTenantIds',
  'onboardingProfileDrafts',
  'storefrontSections',
  'storefrontPages',
  'navMenus',
  'tryOnConfig',
  'roleOverrides',
] as const;

export type PersistedWorkspaceSlice = Pick<WorkspaceSliceState, (typeof PERSISTED_WORKSPACE_KEYS)[number]>;

const initialState: WorkspaceSliceState = {
  _hydrated: false,
  isLiveBackend: false,
  lastSyncedAt: null,
  activeRole: 'OWNER',
  sidebarCollapsed: false,
  openGroups: ['overview', 'brand', 'products', 'marketplace', 'virtual-try-on', 'commerce'],

  profile: DEMO_BRAND_PROFILE,
  products: DEMO_PRODUCTS,
  fabrics: DEMO_FABRICS,
  marketplacePosts: DEMO_MARKETPLACE_POSTS,
  orders: DEMO_ORDERS,
  returns: DEMO_RETURNS,
  abandonedCarts: DEMO_ABANDONED_CARTS,
  warehouses: DEMO_WAREHOUSES,
  inventoryLogs: DEMO_INVENTORY_LOGS,
  customers: DEMO_CUSTOMERS,
  reviews: DEMO_REVIEWS,
  campaigns: DEMO_CAMPAIGNS,
  discounts: DEMO_DISCOUNTS,
  storefrontSections: DEMO_STOREFRONT_SECTIONS,
  storefrontHasUnsavedDraft: false,
  storefrontLastPublishedAt: '2026-11-09 14:00',
  storefrontPages: DEMO_STOREFRONT_PAGES,
  navMenus: DEMO_NAV_MENUS,
  tryOnConfig: DEMO_TRYON_CONFIG,
  tryOnSessions: DEMO_TRYON_SESSIONS,
  teamMembers: DEMO_TEAM,
  roleOverrides: {},
  activityLogs: DEMO_ACTIVITY_LOGS,
  invoices: DEMO_INVOICES,
  apiKeys: DEMO_API_KEYS,
  webhooks: DEMO_WEBHOOKS,
  onboardingStep: 1,
  onboardingStepByTenant: {},
  onboardingCompletedStepsByTenant: {},
  onboardingCompletedIds: [],
  onboardedTenantIds: [],
  onboardingProfileDrafts: {},
  backendOnboardingStatusByTenant: {},
};

function appendAuditEntry(
  state: WorkspaceSliceState,
  action: string,
  entity: string,
  details: string
) {
  state.activityLogs = [
    {
      id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      actor: state.profile.owner,
      role: state.activeRole,
      action,
      entity,
      details,
      timestamp: new Date().toLocaleString(),
    },
    ...state.activityLogs,
  ].slice(0, 100);
}

const DEFAULT_SEO = {
  title: '',
  description: '',
  canonicalUrl: '',
  ogImage: '',
  allowIndexing: true,
};

const DEFAULT_BRAND_SETTINGS = {
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

export const workspaceSlice = createSlice({
  name: 'workspace',
  initialState,
  reducers: {
    hydrateWorkspace: (state, action: PayloadAction<Partial<PersistedWorkspaceSlice> | null>) => {
      const persisted = action.payload;
      if (persisted && typeof persisted === 'object') {
        for (const key of PERSISTED_WORKSPACE_KEYS) {
          if (persisted[key] !== undefined) {
            // @ts-expect-error key is narrowed from PERSISTED_WORKSPACE_KEYS
            state[key] = persisted[key];
          }
        }
      }
      state._hydrated = true;
    },
    markHydrated: (state) => {
      state._hydrated = true;
    },

    setLiveSync: (state, action: PayloadAction<boolean>) => {
      state.isLiveBackend = action.payload;
      state.lastSyncedAt = new Date().toLocaleTimeString();
    },
    setActiveRole: (state, action: PayloadAction<StaffRole>) => {
      state.activeRole = action.payload;
    },
    toggleSidebarCollapsed: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    toggleNavGroup: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      state.openGroups = state.openGroups.includes(id)
        ? state.openGroups.filter((g) => g !== id)
        : [...state.openGroups, id];
    },
    updateProfile: (state, action: PayloadAction<Partial<BrandProfile>>) => {
      const partial = action.payload;
      state.profile = { ...state.profile, ...partial };
      appendAuditEntry(state, 'PROFILE_UPDATED', 'Brand Workspace', `Updated ${Object.keys(partial).join(', ')}`);
    },
    applySyncedProfile: (state, action: PayloadAction<Partial<BrandProfile>>) => {
      state.profile = { ...state.profile, ...action.payload };
    },

    setProducts: (state, action: PayloadAction<Product[]>) => {
      state.products = action.payload;
    },
    addProduct: (state, action: PayloadAction<Product>) => {
      const product = action.payload;
      state.products = [product, ...state.products];
      appendAuditEntry(state, 'PRODUCT_CREATED', product.name, `Created SKU ${product.sku}`);
    },
    updateProduct: (state, action: PayloadAction<{ id: string; updates: Partial<Product> }>) => {
      const { id, updates } = action.payload;
      const target = state.products.find((p) => p.id === id);
      state.products = state.products.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString().slice(0, 10) } : p
      );
      if (target) {
        appendAuditEntry(state, 'PRODUCT_UPDATED', target.name, `Modified ${Object.keys(updates).join(', ')}`);
      }
    },
    deleteProduct: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      const target = state.products.find((p) => p.id === id);
      state.products = state.products.filter((p) => p.id !== id);
      if (target) {
        appendAuditEntry(state, 'PRODUCT_DELETED', target.name, `Removed ${target.sku} from tenant catalog`);
      }
    },
    adjustStock: (
      state,
      action: PayloadAction<{ id: string; delta: number; reason?: string; location?: string }>
    ) => {
      const { id, delta, reason = 'Manual inventory adjustment', location = 'Dhaka Main Studio' } = action.payload;
      const target = state.products.find((p) => p.id === id);
      if (!target) return;
      const nextStock = Math.max(0, target.stock + delta);
      target.stock = nextStock;
      state.inventoryLogs = [
        {
          id: `inv_${Date.now()}`,
          productId: target.id,
          productName: target.name,
          variantSku: target.sku,
          location,
          change: delta,
          newStock: nextStock,
          reason,
          actor: state.profile.owner,
          timestamp: new Date().toLocaleString(),
        },
        ...state.inventoryLogs,
      ];
      appendAuditEntry(state, 'INVENTORY_ADJUSTED', target.name, `${delta > 0 ? '+' : ''}${delta} units (${reason})`);
    },

    setFabrics: (state, action: PayloadAction<Fabric[]>) => {
      state.fabrics = action.payload;
    },
    addFabric: (state, action: PayloadAction<Fabric>) => {
      state.fabrics = [action.payload, ...state.fabrics];
    },
    addFabricRecord: (state, action: PayloadAction<Fabric>) => {
      const fabric = action.payload;
      state.fabrics = [
        fabric,
        ...state.fabrics.filter(
          (f) => f.id !== fabric.id && f.name.toLowerCase() !== fabric.name.toLowerCase()
        ),
      ];
    },

    addMarketplacePost: (state, action: PayloadAction<MarketplacePost>) => {
      const post = action.payload;
      state.marketplacePosts = [post, ...state.marketplacePosts];
      appendAuditEntry(state, 'MARKETPLACE_POST_CREATED', post.title, `Status: ${post.status}`);
    },
    updateMarketplacePost: (state, action: PayloadAction<{ id: string; updates: Partial<MarketplacePost> }>) => {
      const { id, updates } = action.payload;
      state.marketplacePosts = state.marketplacePosts.map((m) => (m.id === id ? { ...m, ...updates } : m));
      appendAuditEntry(state, 'MARKETPLACE_POST_UPDATED', id, `Updated ${Object.keys(updates).join(', ')}`);
    },
    deleteMarketplacePost: (state, action: PayloadAction<string>) => {
      state.marketplacePosts = state.marketplacePosts.filter((m) => m.id !== action.payload);
    },

    setOrders: (state, action: PayloadAction<Order[]>) => {
      state.orders = action.payload;
    },
    updateOrder: (state, action: PayloadAction<{ id: string; updates: Partial<Order> }>) => {
      const { id, updates } = action.payload;
      state.orders = state.orders.map((o) => (o.id === id ? { ...o, ...updates } : o));
      appendAuditEntry(state, 'ORDER_UPDATED', id, 'Status/fields updated');
    },
    updateReturnStatus: (state, action: PayloadAction<{ id: string; status: ReturnRequest['status'] }>) => {
      const { id, status } = action.payload;
      state.returns = state.returns.map((r) => (r.id === id ? { ...r, status } : r));
    },
    markAbandonedRecovered: (state, action: PayloadAction<string>) => {
      state.abandonedCarts = state.abandonedCarts.map((c) =>
        c.id === action.payload ? { ...c, recoverySent: true } : c
      );
    },

    addWarehouse: (state, action: PayloadAction<WarehouseLocation>) => {
      state.warehouses.push(action.payload);
    },
    replyToReview: (state, action: PayloadAction<{ id: string; reply: string }>) => {
      const { id, reply } = action.payload;
      state.reviews = state.reviews.map((r) => (r.id === id ? { ...r, reply } : r));
    },
    toggleReportReview: (state, action: PayloadAction<string>) => {
      state.reviews = state.reviews.map((r) =>
        r.id === action.payload ? { ...r, reported: !r.reported } : r
      );
    },

    addCampaign: (state, action: PayloadAction<MarketingCampaign>) => {
      state.campaigns = [action.payload, ...state.campaigns];
    },
    addDiscount: (state, action: PayloadAction<DiscountCode>) => {
      state.discounts = [action.payload, ...state.discounts];
    },
    toggleDiscountActive: (state, action: PayloadAction<string>) => {
      state.discounts = state.discounts.map((d) =>
        d.id === action.payload ? { ...d, active: !d.active } : d
      );
    },

    setStorefrontSections: (state, action: PayloadAction<StorefrontSectionConfig[]>) => {
      state.storefrontSections = action.payload;
      state.storefrontHasUnsavedDraft = true;
    },
    publishStorefrontChanges: (state) => {
      state.storefrontHasUnsavedDraft = false;
      state.storefrontLastPublishedAt = new Date().toLocaleString();
      appendAuditEntry(state, 'STOREFRONT_PUBLISHED', 'Public Boutique', 'Published storefront layout edits');
    },
    saveStorefrontPage: (state, action: PayloadAction<StorefrontPageRecord>) => {
      const page = action.payload;
      const exists = state.storefrontPages.some((p) => p.id === page.id);
      state.storefrontPages = exists
        ? state.storefrontPages.map((p) => (p.id === page.id ? page : p))
        : [...state.storefrontPages, page];
      state.storefrontHasUnsavedDraft = true;
    },
    setNavMenus: (state, action: PayloadAction<NavMenuItem[]>) => {
      state.navMenus = action.payload;
      state.storefrontHasUnsavedDraft = true;
    },

    updateTryOnConfig: (state, action: PayloadAction<Partial<TryOnConfiguration>>) => {
      state.tryOnConfig = { ...state.tryOnConfig, ...action.payload };
      appendAuditEntry(state, 'TRYON_CONFIG_UPDATED', 'Virtual Try-On', 'Saved customer experience settings');
    },
    addTryOnSession: (state, action: PayloadAction<TryOnGenerationSession>) => {
      const session = action.payload;
      state.tryOnSessions = [session, ...state.tryOnSessions];
      if (session.status === 'COMPLETED') {
        state.profile.quotaUsed += session.creditsUsed;
      }
    },

    inviteTeamMember: (state, action: PayloadAction<Omit<TeamMember, 'id' | 'lastActiveAt'>>) => {
      const member = action.payload;
      state.teamMembers.push({ ...member, id: `tm_${Date.now()}`, lastActiveAt: 'Pending Invite' });
      appendAuditEntry(state, 'TEAM_INVITED', member.email, `Invited with role ${member.role}`);
    },
    updateTeamMemberRole: (state, action: PayloadAction<{ id: string; role: StaffRole }>) => {
      const { id, role } = action.payload;
      state.teamMembers = state.teamMembers.map((m) => (m.id === id ? { ...m, role } : m));
      appendAuditEntry(state, 'ROLE_CHANGED', id, `Updated role to ${role}`);
    },
    toggleRolePermission: (
      state,
      action: PayloadAction<{ role: StaffRole; mod: ResourceModule; permAction: PermissionAction }>
    ) => {
      const { role, mod, permAction } = action.payload;
      const base = state.roleOverrides[role]?.[mod] || DEFAULT_ROLE_PERMISSIONS[role]?.[mod] || [];
      const next = base.includes(permAction)
        ? base.filter((a) => a !== permAction)
        : [...base, permAction];
      state.roleOverrides = {
        ...state.roleOverrides,
        [role]: {
          ...(state.roleOverrides[role] || {}),
          [mod]: next,
        },
      };
    },

    addApiKeyRecord: (state, action: PayloadAction<ApiCredential>) => {
      const credential = action.payload;
      state.apiKeys = [credential, ...state.apiKeys];
      appendAuditEntry(state, 'API_KEY_CREATED', credential.name, 'Issued new merchant credential (prefix stored)');
    },
    revokeApiKey: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      state.apiKeys = state.apiKeys.map((k) => (k.id === id ? { ...k, status: 'REVOKED' } : k));
      appendAuditEntry(state, 'API_KEY_REVOKED', id, 'Revoked merchant API credential');
    },
    addWebhook: (
      state,
      action: PayloadAction<Omit<WebhookSubscription, 'id' | 'lastDeliveryStatus' | 'lastDeliveryAt'>>
    ) => {
      state.webhooks = [
        {
          ...action.payload,
          id: `wh_${Date.now()}`,
          lastDeliveryStatus: 'PENDING',
          lastDeliveryAt: 'Not delivered yet',
        },
        ...state.webhooks,
      ];
    },
    removeWebhook: (state, action: PayloadAction<string>) => {
      state.webhooks = state.webhooks.filter((w) => w.id !== action.payload);
    },

    setOnboardingStep: (state, action: PayloadAction<{ step: number; tenantId?: string }>) => {
      const { step, tenantId } = action.payload;
      const cleanTenantId = String(tenantId || state.profile.id || '').trim();
      state.onboardingStep = step;
      if (cleanTenantId) {
        state.onboardingStepByTenant[cleanTenantId] = step;
      }
    },
    markOnboardingStepCompleted: (state, action: PayloadAction<{ tenantId: string; stepNumber: number }>) => {
      const cleanTenantId = String(action.payload.tenantId || state.profile.id || 'tenant_aura').trim();
      const prev = state.onboardingCompletedStepsByTenant[cleanTenantId] || [];
      if (!prev.includes(action.payload.stepNumber)) {
        state.onboardingCompletedStepsByTenant[cleanTenantId] = [...prev, action.payload.stepNumber].sort(
          (a, b) => a - b
        );
      }
    },
    toggleOnboardingChecklist: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      state.onboardingCompletedIds = state.onboardingCompletedIds.includes(id)
        ? state.onboardingCompletedIds.filter((x) => x !== id)
        : [...state.onboardingCompletedIds, id];
    },
    markOnboardingCompleted: (state, action: PayloadAction<string>) => {
      const cleanTenantId = String(action.payload || '').trim() || state.profile.id || 'tenant_aura';
      if (!state.onboardedTenantIds.includes(cleanTenantId)) {
        state.onboardedTenantIds.push(cleanTenantId);
      }
      state.onboardingCompletedStepsByTenant[cleanTenantId] = [1, 2, 3, 4];
      state.onboardingStepByTenant[cleanTenantId] = 4;
      state.onboardingCompletedIds = Array.from(
        new Set([...state.onboardingCompletedIds, 'chk_profile', 'chk_business', 'chk_identity', 'chk_launch'])
      );
      state.onboardingStep = 4;
      appendAuditEntry(
        state,
        'ONBOARDING_COMPLETED',
        cleanTenantId,
        'Completed brand owner onboarding profile and workspace setup'
      );
    },
    reopenOnboarding: (state, action: PayloadAction<string>) => {
      const cleanTenantId = String(action.payload || '').trim();
      if (cleanTenantId) {
        state.onboardedTenantIds = state.onboardedTenantIds.filter((id) => id !== cleanTenantId);
        state.backendOnboardingStatusByTenant[cleanTenantId] = false;
        state.onboardingStepByTenant[cleanTenantId] = 1;
      }
      state.onboardingStep = 1;
    },
    setBackendOnboardingStatus: (state, action: PayloadAction<{ tenantId: string; onboarded: boolean | null }>) => {
      const cleanTenantId = String(action.payload.tenantId || '').trim();
      if (!cleanTenantId) return;
      const { onboarded } = action.payload;
      if (onboarded === true) {
        state.onboardedTenantIds = Array.from(new Set([...state.onboardedTenantIds, cleanTenantId]));
      } else if (onboarded === false) {
        state.onboardedTenantIds = state.onboardedTenantIds.filter((id) => id !== cleanTenantId);
      }
      state.backendOnboardingStatusByTenant[cleanTenantId] = onboarded;
    },
    saveOnboardingProfileForTenant: (
      state,
      action: PayloadAction<{ tenantId: string; partial: Partial<BrandProfile> }>
    ) => {
      const { tenantId, partial } = action.payload;
      const cleanTenantId = String(tenantId || '').trim() || state.profile.id || 'tenant_aura';
      const prevDraft = state.onboardingProfileDrafts[cleanTenantId] || {};
      const mergedSeo = partial.seo
        ? { ...(state.profile.seo || DEFAULT_SEO), ...(prevDraft.seo || {}), ...partial.seo }
        : prevDraft.seo;
      const mergedSocial = partial.socialLinks
        ? { ...(state.profile.socialLinks || {}), ...(prevDraft.socialLinks || {}), ...partial.socialLinks }
        : prevDraft.socialLinks;
      const mergedSettings = partial.settings
        ? { ...(state.profile.settings || DEFAULT_BRAND_SETTINGS), ...(prevDraft.settings || {}), ...partial.settings }
        : prevDraft.settings;

      const nextDraft: Partial<BrandProfile> = {
        ...prevDraft,
        ...partial,
        ...(mergedSeo ? { seo: mergedSeo } : {}),
        ...(mergedSocial ? { socialLinks: mergedSocial } : {}),
        ...(mergedSettings ? { settings: mergedSettings } : {}),
      };

      if (partial.seo?.title || partial.slogan) {
        state.storefrontSections = state.storefrontSections.map((sec) =>
          sec.type === 'hero'
            ? {
                ...sec,
                title: partial.seo?.title || partial.name || sec.title,
                subtitle: partial.slogan || partial.shortDescription || sec.subtitle,
                bannerImage: partial.banner || sec.bannerImage,
              }
            : sec
        );
      }

      state.profile = {
        ...state.profile,
        ...partial,
        ...(mergedSeo ? { seo: mergedSeo } : {}),
        ...(mergedSocial ? { socialLinks: mergedSocial } : {}),
        ...(mergedSettings ? { settings: mergedSettings } : {}),
      };
      state.onboardingProfileDrafts[cleanTenantId] = nextDraft;

      appendAuditEntry(
        state,
        'BRAND_ONBOARDING_SAVED',
        cleanTenantId,
        'Saved brand profile, title, and starter onboarding details'
      );
    },
    restoreOnboardingDraftSnapshot: (
      state,
      action: PayloadAction<{ tenantId: string; snapshot: Partial<BrandProfile> | null }>
    ) => {
      const { tenantId, snapshot } = action.payload;
      const cleanTenantId = String(tenantId || '').trim() || state.profile.id || 'tenant_aura';
      if (!snapshot) {
        delete state.onboardingProfileDrafts[cleanTenantId];
      } else {
        state.onboardingProfileDrafts[cleanTenantId] = snapshot;
        state.profile = {
          ...state.profile,
          ...snapshot,
        };
      }
    },
    recordAudit: (state, action: PayloadAction<{ action: string; entity: string; details: string }>) => {
      appendAuditEntry(state, action.payload.action, action.payload.entity, action.payload.details);
    },
  },
});

export const workspaceActions = workspaceSlice.actions;
export default workspaceSlice.reducer;

