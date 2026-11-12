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
import { store } from '../store';
import { createSliceFacadeHook } from '../store/hooks';
import { selectWorkspaceState } from '../store/selectors';
import { workspaceActions } from '../store/slices/workspaceSlice';
import {
  isWorkspaceHydrated,
  subscribeWorkspaceHydration,
} from '../store/middleware/persistence';

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
  onboardingStepByTenant: Record<string, number>;
  onboardingCompletedStepsByTenant: Record<string, number[]>;
  onboardingCompletedIds: string[];
  onboardedTenantIds: string[];
  onboardingProfileDrafts: Record<string, Partial<BrandProfile>>;
  backendOnboardingStatusByTenant: Record<string, boolean | null>;

  setLiveSync: (live: boolean) => void;
  setActiveRole: (role: StaffRole) => void;
  toggleSidebarCollapsed: () => void;
  toggleNavGroup: (id: string) => void;
  updateProfile: (partial: Partial<BrandProfile>) => void;
  applySyncedProfile: (partial: Partial<BrandProfile>) => void;
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

  setOnboardingStep: (step: number, tenantId?: string) => void;
  markOnboardingStepCompleted: (tenantId: string, stepNumber: number) => void;
  toggleOnboardingChecklist: (id: string) => void;
  markOnboardingCompleted: (tenantId: string) => void;
  reopenOnboarding: (tenantId: string) => void;
  setBackendOnboardingStatus: (tenantId: string, onboarded: boolean | null) => void;
  saveOnboardingProfileForTenant: (tenantId: string, partial: Partial<BrandProfile>) => void;
  restoreOnboardingDraftSnapshot: (tenantId: string, snapshot: Partial<BrandProfile> | null) => void;
  addFabricRecord: (fabric: Fabric) => void;
  recordAudit: (action: string, entity: string, details: string) => void;
}

const workspaceBoundActions = {
  setLiveSync: (live: boolean) => {
    store.dispatch(workspaceActions.setLiveSync(live));
  },
  setActiveRole: (role: StaffRole) => {
    store.dispatch(workspaceActions.setActiveRole(role));
  },
  toggleSidebarCollapsed: () => {
    store.dispatch(workspaceActions.toggleSidebarCollapsed());
  },
  toggleNavGroup: (id: string) => {
    store.dispatch(workspaceActions.toggleNavGroup(id));
  },
  updateProfile: (partial: Partial<BrandProfile>) => {
    store.dispatch(workspaceActions.updateProfile(partial));
  },
  applySyncedProfile: (partial: Partial<BrandProfile>) => {
    store.dispatch(workspaceActions.applySyncedProfile(partial));
  },
  setProducts: (products: Product[]) => {
    store.dispatch(workspaceActions.setProducts(products));
  },
  addProduct: (product: Product) => {
    store.dispatch(workspaceActions.addProduct(product));
  },
  updateProduct: (id: string, updates: Partial<Product>) => {
    store.dispatch(workspaceActions.updateProduct({ id, updates }));
  },
  deleteProduct: (id: string) => {
    store.dispatch(workspaceActions.deleteProduct(id));
  },
  adjustStock: (id: string, delta: number, reason?: string, location?: string) => {
    store.dispatch(workspaceActions.adjustStock({ id, delta, reason, location }));
  },
  setFabrics: (fabrics: Fabric[]) => {
    store.dispatch(workspaceActions.setFabrics(fabrics));
  },
  addFabric: (fabric: Fabric) => {
    store.dispatch(workspaceActions.addFabric(fabric));
  },
  addMarketplacePost: (post: MarketplacePost) => {
    store.dispatch(workspaceActions.addMarketplacePost(post));
  },
  updateMarketplacePost: (id: string, updates: Partial<MarketplacePost>) => {
    store.dispatch(workspaceActions.updateMarketplacePost({ id, updates }));
  },
  deleteMarketplacePost: (id: string) => {
    store.dispatch(workspaceActions.deleteMarketplacePost(id));
  },
  setOrders: (orders: Order[]) => {
    store.dispatch(workspaceActions.setOrders(orders));
  },
  updateOrder: (id: string, updates: Partial<Order>) => {
    store.dispatch(workspaceActions.updateOrder({ id, updates }));
  },
  updateReturnStatus: (id: string, status: ReturnRequest['status']) => {
    store.dispatch(workspaceActions.updateReturnStatus({ id, status }));
  },
  markAbandonedRecovered: (id: string) => {
    store.dispatch(workspaceActions.markAbandonedRecovered(id));
  },
  addWarehouse: (w: WarehouseLocation) => {
    store.dispatch(workspaceActions.addWarehouse(w));
  },
  replyToReview: (id: string, reply: string) => {
    store.dispatch(workspaceActions.replyToReview({ id, reply }));
  },
  toggleReportReview: (id: string) => {
    store.dispatch(workspaceActions.toggleReportReview(id));
  },
  addCampaign: (c: MarketingCampaign) => {
    store.dispatch(workspaceActions.addCampaign(c));
  },
  addDiscount: (d: DiscountCode) => {
    store.dispatch(workspaceActions.addDiscount(d));
  },
  toggleDiscountActive: (id: string) => {
    store.dispatch(workspaceActions.toggleDiscountActive(id));
  },
  setStorefrontSections: (sections: StorefrontSectionConfig[]) => {
    store.dispatch(workspaceActions.setStorefrontSections(sections));
  },
  publishStorefrontChanges: () => {
    store.dispatch(workspaceActions.publishStorefrontChanges());
  },
  saveStorefrontPage: (page: StorefrontPageRecord) => {
    store.dispatch(workspaceActions.saveStorefrontPage(page));
  },
  setNavMenus: (items: NavMenuItem[]) => {
    store.dispatch(workspaceActions.setNavMenus(items));
  },
  updateTryOnConfig: (partial: Partial<TryOnConfiguration>) => {
    store.dispatch(workspaceActions.updateTryOnConfig(partial));
  },
  addTryOnSession: (session: TryOnGenerationSession) => {
    store.dispatch(workspaceActions.addTryOnSession(session));
  },
  inviteTeamMember: (member: Omit<TeamMember, 'id' | 'lastActiveAt'>) => {
    store.dispatch(workspaceActions.inviteTeamMember(member));
  },
  updateTeamMemberRole: (id: string, role: StaffRole) => {
    store.dispatch(workspaceActions.updateTeamMemberRole({ id, role }));
  },
  toggleRolePermission: (role: StaffRole, mod: ResourceModule, permAction: PermissionAction) => {
    store.dispatch(workspaceActions.toggleRolePermission({ role, mod, permAction }));
  },
  createApiKey: (name: string) => {
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
    store.dispatch(workspaceActions.addApiKeyRecord(credential));
    return { credential, rawSecret };
  },
  revokeApiKey: (id: string) => {
    store.dispatch(workspaceActions.revokeApiKey(id));
  },
  addWebhook: (w: Omit<WebhookSubscription, 'id' | 'lastDeliveryStatus' | 'lastDeliveryAt'>) => {
    store.dispatch(workspaceActions.addWebhook(w));
  },
  removeWebhook: (id: string) => {
    store.dispatch(workspaceActions.removeWebhook(id));
  },
  setOnboardingStep: (step: number, tenantId?: string) => {
    store.dispatch(workspaceActions.setOnboardingStep({ step, tenantId }));
  },
  markOnboardingStepCompleted: (tenantId: string, stepNumber: number) => {
    store.dispatch(workspaceActions.markOnboardingStepCompleted({ tenantId, stepNumber }));
  },
  toggleOnboardingChecklist: (id: string) => {
    store.dispatch(workspaceActions.toggleOnboardingChecklist(id));
  },
  markOnboardingCompleted: (tenantId: string) => {
    store.dispatch(workspaceActions.markOnboardingCompleted(tenantId));
  },
  reopenOnboarding: (tenantId: string) => {
    store.dispatch(workspaceActions.reopenOnboarding(tenantId));
  },
  setBackendOnboardingStatus: (tenantId: string, onboarded: boolean | null) => {
    store.dispatch(workspaceActions.setBackendOnboardingStatus({ tenantId, onboarded }));
  },
  saveOnboardingProfileForTenant: (tenantId: string, partial: Partial<BrandProfile>) => {
    store.dispatch(workspaceActions.saveOnboardingProfileForTenant({ tenantId, partial }));
  },
  restoreOnboardingDraftSnapshot: (tenantId: string, snapshot: Partial<BrandProfile> | null) => {
    store.dispatch(workspaceActions.restoreOnboardingDraftSnapshot({ tenantId, snapshot }));
  },
  addFabricRecord: (fabric: Fabric) => {
    store.dispatch(workspaceActions.addFabricRecord(fabric));
  },
  recordAudit: (action: string, entity: string, details: string) => {
    store.dispatch(workspaceActions.recordAudit({ action, entity, details }));
  },
};

const baseWorkspaceHook = createSliceFacadeHook(selectWorkspaceState, workspaceBoundActions);

export const useWorkspaceStore = Object.assign(baseWorkspaceHook, {
  persist: {
    hasHydrated: isWorkspaceHydrated,
    onFinishHydration: subscribeWorkspaceHydration,
  },
});
