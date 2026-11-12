import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
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
} from '../types';
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
} from '../data/brandDemoSeed';
import { DEFAULT_ROLE_PERMISSIONS } from '../config/permissions';

export interface WorkspaceState {
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
  onboardingCompletedIds: string[];
  onboardedTenantIds: string[];
  onboardingProfileDrafts: Record<string, Partial<BrandProfile>>;

  setLiveSync: (live: boolean) => void;
  setActiveRole: (role: StaffRole) => void;
  toggleSidebarCollapsed: () => void;
  toggleNavGroup: (id: string) => void;
  updateProfile: (partial: Partial<BrandProfile>) => void;
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (id: string, delta: number, reason?: string, location?: string) => void;

  setFabrics: (fabrics: Fabric[]) => void;
  addFabric: (fabric: Fabric) => void;

  addMarketplacePost: (post: MarketplacePost) => void;
  updateMarketplacePost: (id: string, updates: Partial<MarketplacePost>) => void;
  deleteMarketplacePost: (id: string) => void;

  setOrders: (orders: Order[]) => void;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  updateReturnStatus: (id: string, status: ReturnRequest['status']) => void;
  markAbandonedRecovered: (id: string) => void;

  addWarehouse: (w: WarehouseLocation) => void;
  replyToReview: (id: string, reply: string) => void;
  toggleReportReview: (id: string) => void;

  addCampaign: (c: MarketingCampaign) => void;
  addDiscount: (d: DiscountCode) => void;
  toggleDiscountActive: (id: string) => void;

  setStorefrontSections: (sections: StorefrontSectionConfig[]) => void;
  publishStorefrontChanges: () => void;
  saveStorefrontPage: (page: StorefrontPageRecord) => void;
  setNavMenus: (items: NavMenuItem[]) => void;

  updateTryOnConfig: (partial: Partial<TryOnConfiguration>) => void;
  addTryOnSession: (session: TryOnGenerationSession) => void;

  inviteTeamMember: (member: Omit<TeamMember, 'id' | 'lastActiveAt'>) => void;
  updateTeamMemberRole: (id: string, role: StaffRole) => void;
  toggleRolePermission: (role: StaffRole, mod: ResourceModule, action: PermissionAction) => void;

  createApiKey: (name: string) => { credential: ApiCredential; rawSecret: string };
  revokeApiKey: (id: string) => void;
  addWebhook: (w: Omit<WebhookSubscription, 'id' | 'lastDeliveryStatus' | 'lastDeliveryAt'>) => void;
  removeWebhook: (id: string) => void;

  setOnboardingStep: (step: number) => void;
  toggleOnboardingChecklist: (id: string) => void;
  markOnboardingCompleted: (tenantId: string) => void;
  reopenOnboarding: (tenantId: string) => void;
  saveOnboardingProfileForTenant: (tenantId: string, partial: Partial<BrandProfile>) => void;
  addFabricRecord: (fabric: Fabric) => void;
  recordAudit: (action: string, entity: string, details: string) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
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
      onboardingCompletedIds: [],
      onboardedTenantIds: [],
      onboardingProfileDrafts: {},

      setLiveSync: (live) =>
        set({ isLiveBackend: live, lastSyncedAt: new Date().toLocaleTimeString() }),

      setActiveRole: (activeRole) => set({ activeRole }),

      toggleSidebarCollapsed: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      toggleNavGroup: (id) =>
        set((s) => ({
          openGroups: s.openGroups.includes(id)
            ? s.openGroups.filter((g) => g !== id)
            : [...s.openGroups, id],
        })),

      updateProfile: (partial) => {
        set((s) => ({ profile: { ...s.profile, ...partial } }));
        get().recordAudit('PROFILE_UPDATED', 'Brand Workspace', `Updated ${Object.keys(partial).join(', ')}`);
      },

      setProducts: (products) => set({ products }),

      addProduct: (product) => {
        set((s) => ({ products: [product, ...s.products] }));
        get().recordAudit('PRODUCT_CREATED', product.name, `Created SKU ${product.sku}`);
      },

      updateProduct: (id, updates) => {
        const target = get().products.find((p) => p.id === id);
        set((s) => ({
          products: s.products.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString().slice(0, 10) } : p
          ),
        }));
        if (target) {
          get().recordAudit('PRODUCT_UPDATED', target.name, `Modified ${Object.keys(updates).join(', ')}`);
        }
      },

      deleteProduct: (id) => {
        const target = get().products.find((p) => p.id === id);
        set((s) => ({ products: s.products.filter((p) => p.id !== id) }));
        if (target) {
          get().recordAudit('PRODUCT_DELETED', target.name, `Removed ${target.sku} from tenant catalog`);
        }
      },

      adjustStock: (id, delta, reason = 'Manual inventory adjustment', location = 'Dhaka Main Studio') => {
        const target = get().products.find((p) => p.id === id);
        if (!target) return;
        const nextStock = Math.max(0, target.stock + delta);
        set((s) => ({
          products: s.products.map((p) => (p.id === id ? { ...p, stock: nextStock } : p)),
          inventoryLogs: [
            {
              id: `inv_${Date.now()}`,
              productId: target.id,
              productName: target.name,
              variantSku: target.sku,
              location,
              change: delta,
              newStock: nextStock,
              reason,
              actor: get().profile.owner,
              timestamp: new Date().toLocaleString(),
            },
            ...s.inventoryLogs,
          ],
        }));
        get().recordAudit('INVENTORY_ADJUSTED', target.name, `${delta > 0 ? '+' : ''}${delta} units (${reason})`);
      },

      setFabrics: (fabrics) => set({ fabrics }),
      addFabric: (fabric) => set((s) => ({ fabrics: [fabric, ...s.fabrics] })),

      addMarketplacePost: (post) => {
        set((s) => ({ marketplacePosts: [post, ...s.marketplacePosts] }));
        get().recordAudit('MARKETPLACE_POST_CREATED', post.title, `Status: ${post.status}`);
      },

      updateMarketplacePost: (id, updates) => {
        set((s) => ({
          marketplacePosts: s.marketplacePosts.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        }));
        get().recordAudit('MARKETPLACE_POST_UPDATED', id, `Updated ${Object.keys(updates).join(', ')}`);
      },

      deleteMarketplacePost: (id) =>
        set((s) => ({ marketplacePosts: s.marketplacePosts.filter((m) => m.id !== id) })),

      setOrders: (orders) => set({ orders }),
      updateOrder: (id, updates) => {
        set((s) => ({
          orders: s.orders.map((o) => (o.id === id ? { ...o, ...updates } : o)),
        }));
        get().recordAudit('ORDER_UPDATED', id, `Status/fields updated`);
      },

      updateReturnStatus: (id, status) =>
        set((s) => ({
          returns: s.returns.map((r) => (r.id === id ? { ...r, status } : r)),
        })),

      markAbandonedRecovered: (id) =>
        set((s) => ({
          abandonedCarts: s.abandonedCarts.map((c) => (c.id === id ? { ...c, recoverySent: true } : c)),
        })),

      addWarehouse: (w) => set((s) => ({ warehouses: [...s.warehouses, w] })),

      replyToReview: (id, reply) =>
        set((s) => ({
          reviews: s.reviews.map((r) => (r.id === id ? { ...r, reply } : r)),
        })),

      toggleReportReview: (id) =>
        set((s) => ({
          reviews: s.reviews.map((r) => (r.id === id ? { ...r, reported: !r.reported } : r)),
        })),

      addCampaign: (c) => set((s) => ({ campaigns: [c, ...s.campaigns] })),
      addDiscount: (d) => set((s) => ({ discounts: [d, ...s.discounts] })),
      toggleDiscountActive: (id) =>
        set((s) => ({
          discounts: s.discounts.map((d) => (d.id === id ? { ...d, active: !d.active } : d)),
        })),

      setStorefrontSections: (storefrontSections) =>
        set({ storefrontSections, storefrontHasUnsavedDraft: true }),

      publishStorefrontChanges: () => {
        set({
          storefrontHasUnsavedDraft: false,
          storefrontLastPublishedAt: new Date().toLocaleString(),
        });
        get().recordAudit('STOREFRONT_PUBLISHED', 'Public Boutique', 'Published storefront layout edits');
      },

      saveStorefrontPage: (page) =>
        set((s) => {
          const exists = s.storefrontPages.some((p) => p.id === page.id);
          return {
            storefrontPages: exists
              ? s.storefrontPages.map((p) => (p.id === page.id ? page : p))
              : [...s.storefrontPages, page],
            storefrontHasUnsavedDraft: true,
          };
        }),

      setNavMenus: (navMenus) => set({ navMenus, storefrontHasUnsavedDraft: true }),

      updateTryOnConfig: (partial) => {
        set((s) => ({ tryOnConfig: { ...s.tryOnConfig, ...partial } }));
        get().recordAudit('TRYON_CONFIG_UPDATED', 'Virtual Try-On', 'Saved customer experience settings');
      },

      addTryOnSession: (session) =>
        set((s) => ({
          tryOnSessions: [session, ...s.tryOnSessions],
          profile: {
            ...s.profile,
            quotaUsed:
              session.status === 'COMPLETED' ? s.profile.quotaUsed + session.creditsUsed : s.profile.quotaUsed,
          },
        })),

      inviteTeamMember: (member) => {
        set((s) => ({
          teamMembers: [
            ...s.teamMembers,
            { ...member, id: `tm_${Date.now()}`, lastActiveAt: 'Pending Invite' },
          ],
        }));
        get().recordAudit('TEAM_INVITED', member.email, `Invited with role ${member.role}`);
      },

      updateTeamMemberRole: (id, role) => {
        set((s) => ({
          teamMembers: s.teamMembers.map((m) => (m.id === id ? { ...m, role } : m)),
        }));
        get().recordAudit('ROLE_CHANGED', id, `Updated role to ${role}`);
      },

      toggleRolePermission: (role, mod, action) =>
        set((s) => {
          const base = s.roleOverrides[role]?.[mod] || DEFAULT_ROLE_PERMISSIONS[role]?.[mod] || [];
          const next = base.includes(action) ? base.filter((a) => a !== action) : [...base, action];
          return {
            roleOverrides: {
              ...s.roleOverrides,
              [role]: {
                ...(s.roleOverrides[role] || {}),
                [mod]: next,
              },
            },
          };
        }),

      createApiKey: (name) => {
        const rand = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
        const rawSecret = `vtry_live_${rand}`;
        const credential: ApiCredential = {
          id: `key_${Date.now()}`,
          name,
          publicPrefix: `${rawSecret.slice(0, 14)}••••••${rawSecret.slice(-4)}`,
          createdAt: new Date().toISOString().slice(0, 10),
          lastUsedAt: 'Never',
          rateLimitPerMin: 120,
          status: 'ACTIVE',
        };
        set((s) => ({ apiKeys: [credential, ...s.apiKeys] }));
        get().recordAudit('API_KEY_CREATED', name, 'Issued new merchant credential (prefix stored)');
        return { credential, rawSecret };
      },

      revokeApiKey: (id) => {
        set((s) => ({
          apiKeys: s.apiKeys.map((k) => (k.id === id ? { ...k, status: 'REVOKED' } : k)),
        }));
        get().recordAudit('API_KEY_REVOKED', id, 'Revoked merchant API credential');
      },

      addWebhook: (w) =>
        set((s) => ({
          webhooks: [
            {
              ...w,
              id: `wh_${Date.now()}`,
              lastDeliveryStatus: 'PENDING',
              lastDeliveryAt: 'Not delivered yet',
            },
            ...s.webhooks,
          ],
        })),

      removeWebhook: (id) =>
        set((s) => ({ webhooks: s.webhooks.filter((w) => w.id !== id) })),

      setOnboardingStep: (onboardingStep) => set({ onboardingStep }),

      toggleOnboardingChecklist: (id) =>
        set((s) => ({
          onboardingCompletedIds: s.onboardingCompletedIds.includes(id)
            ? s.onboardingCompletedIds.filter((x) => x !== id)
            : [...s.onboardingCompletedIds, id],
        })),

      markOnboardingCompleted: (tenantId) => {
        const cleanTenantId = String(tenantId || '').trim() || get().profile.id || 'tenant_aura';
        set((s) => ({
          onboardedTenantIds: s.onboardedTenantIds.includes(cleanTenantId)
            ? s.onboardedTenantIds
            : [...s.onboardedTenantIds, cleanTenantId],
          onboardingCompletedIds: Array.from(
            new Set([
              ...s.onboardingCompletedIds,
              'chk_profile',
              'chk_business',
              'chk_identity',
              'chk_product',
              'chk_tryon',
              'chk_launch',
            ])
          ),
          onboardingStep: 5,
        }));
        get().recordAudit(
          'ONBOARDING_COMPLETED',
          cleanTenantId,
          'Completed brand owner onboarding profile and workspace setup'
        );
      },

      reopenOnboarding: (tenantId) => {
        const cleanTenantId = String(tenantId || '').trim();
        set((s) => ({
          onboardedTenantIds: cleanTenantId
            ? s.onboardedTenantIds.filter((id) => id !== cleanTenantId)
            : s.onboardedTenantIds,
          onboardingStep: 1,
        }));
      },

      saveOnboardingProfileForTenant: (tenantId, partial) => {
        const cleanTenantId = String(tenantId || '').trim() || get().profile.id || 'tenant_aura';
        set((s) => {
          const prevDraft = s.onboardingProfileDrafts[cleanTenantId] || {};
          const mergedSeo = partial.seo
            ? {
                ...(s.profile.seo || {
                  title: '',
                  description: '',
                  canonicalUrl: '',
                  ogImage: '',
                  allowIndexing: true,
                }),
                ...(prevDraft.seo || {}),
                ...partial.seo,
              }
            : prevDraft.seo;
          const mergedSocial = partial.socialLinks
            ? { ...(s.profile.socialLinks || {}), ...(prevDraft.socialLinks || {}), ...partial.socialLinks }
            : prevDraft.socialLinks;
          const mergedSettings = partial.settings
            ? {
                ...(s.profile.settings || {
                  timezone: 'UTC',
                  dateFormat: 'YYYY-MM-DD',
                  language: 'English',
                  currency: 'USD',
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
                }),
                ...(prevDraft.settings || {}),
                ...partial.settings,
              }
            : prevDraft.settings;

          const nextDraft: Partial<BrandProfile> = {
            ...prevDraft,
            ...partial,
            ...(mergedSeo ? { seo: mergedSeo } : {}),
            ...(mergedSocial ? { socialLinks: mergedSocial } : {}),
            ...(mergedSettings ? { settings: mergedSettings } : {}),
          };

          const updatedSections = partial.seo?.title || partial.slogan
            ? s.storefrontSections.map((sec) =>
                sec.type === 'hero'
                  ? {
                      ...sec,
                      title: partial.seo?.title || partial.name || sec.title,
                      subtitle: partial.slogan || partial.shortDescription || sec.subtitle,
                      bannerImage: partial.banner || sec.bannerImage,
                    }
                  : sec
              )
            : s.storefrontSections;

          return {
            profile: {
              ...s.profile,
              ...partial,
              ...(mergedSeo ? { seo: mergedSeo } : {}),
              ...(mergedSocial ? { socialLinks: mergedSocial } : {}),
              ...(mergedSettings ? { settings: mergedSettings } : {}),
            },
            storefrontSections: updatedSections,
            onboardingProfileDrafts: {
              ...s.onboardingProfileDrafts,
              [cleanTenantId]: nextDraft,
            },
          };
        });
        get().recordAudit(
          'BRAND_ONBOARDING_SAVED',
          cleanTenantId,
          'Saved brand profile, title, and starter onboarding details'
        );
      },

      addFabricRecord: (fabric) =>
        set((s) => ({
          fabrics: [
            fabric,
            ...s.fabrics.filter(
              (f) => f.id !== fabric.id && f.name.toLowerCase() !== fabric.name.toLowerCase()
            ),
          ],
        })),

      recordAudit: (action, entity, details) =>
        set((s) => ({
          activityLogs: [
            {
              id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
              actor: s.profile.owner,
              role: s.activeRole,
              action,
              entity,
              details,
              timestamp: new Date().toLocaleString(),
            },
            ...s.activityLogs,
          ].slice(0, 100),
        })),
    }),
    {
      name: 'vton_brand_workspace_v2',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        activeRole: state.activeRole,
        sidebarCollapsed: state.sidebarCollapsed,
        openGroups: state.openGroups,
        onboardingStep: state.onboardingStep,
        onboardingCompletedIds: state.onboardingCompletedIds,
        onboardedTenantIds: state.onboardedTenantIds,
        onboardingProfileDrafts: state.onboardingProfileDrafts,
        storefrontSections: state.storefrontSections,
        storefrontPages: state.storefrontPages,
        navMenus: state.navMenus,
        tryOnConfig: state.tryOnConfig,
        roleOverrides: state.roleOverrides,
      }),
    }
  )
);

