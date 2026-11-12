export type CatalogStatus = 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
export type PublicationStatus =
  | 'DRAFT'
  | 'READY'
  | 'PENDING_REVIEW'
  | 'PUBLISHED'
  | 'SCHEDULED'
  | 'UNPUBLISHED'
  | 'REJECTED'
  | 'ARCHIVED';

export type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
export type PaymentStatus = 'PAID' | 'PENDING' | 'FAILED' | 'REFUNDED';
export type TryOnCategory = 'tops' | 'bottoms' | 'dresses' | 'outerwear' | 'all';

export type StaffRole =
  | 'OWNER'
  | 'ADMINISTRATOR'
  | 'PRODUCT_MANAGER'
  | 'MARKETING_MANAGER'
  | 'ORDER_MANAGER'
  | 'CUSTOMER_SUPPORT'
  | 'TRYON_MANAGER';

export type PermissionAction =
  | 'view'
  | 'create'
  | 'edit'
  | 'delete'
  | 'publish'
  | 'export'
  | 'manage_settings';

export type ResourceModule =
  | 'overview'
  | 'brand'
  | 'storefront'
  | 'products'
  | 'marketplace'
  | 'tryon'
  | 'orders'
  | 'inventory'
  | 'customers'
  | 'marketing'
  | 'analytics'
  | 'team'
  | 'billing'
  | 'integrations'
  | 'settings';

export interface ProductVariant {
  id: string;
  sku: string;
  size: string;
  color: string;
  colorHex?: string;
  stockQuantity: number;
  priceOverride?: number;
  barcode?: string;
  weightGrams?: number;
  image?: string;
  available: boolean;
}

export interface Product {
  id: string;
  tenantId?: string;
  name: string;
  slug: string;
  sku: string;
  category: string;
  subCategory?: string;
  productType?: string;
  shortDescription?: string;
  description?: string;
  collections?: string[];
  tags?: string[];
  price: number;
  compareAtPrice?: number;
  costPrice?: number; // Private to authorized staff
  taxable?: boolean;
  stock: number;
  lowStockThreshold?: number;
  warehouseLocation?: string;
  allowBackorder?: boolean;
  catalogStatus?: CatalogStatus;
  brandStorefrontPublished: boolean;
  marketplacePublished: boolean;
  isTryOnEligible: boolean;
  tryOnCategory: string;
  includeInBrandTryOn?: boolean;
  includeInMarketplaceTryOn?: boolean;
  imageQualityStatus?: 'VERIFIED' | 'NEEDS_CHECK';
  image: string;
  images?: string[];
  videoUrl?: string;
  variants?: ProductVariant[];
  specs?: {
    material?: string;
    fabricType?: string;
    weightGsm?: string;
    stretch?: string;
    fitType?: string;
    sleeveType?: string;
    neckType?: string;
    length?: string;
    care?: string;
    origin?: string;
  };
  salesCount?: number;
  viewsCount?: number;
  favoritesCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Fabric {
  id: string;
  tenantId?: string;
  name: string;
  composition: string;
  stretch: string;
  thickness: string;
  care: string;
  color?: string;
  weightGsm?: number;
}

export interface MarketplacePost {
  id: string;
  tenantId: string;
  productId: string;
  title: string;
  description: string;
  category: string;
  collection: string;
  promotionalText?: string;
  tags: string[];
  featuredImage: string;
  gallery: string[];
  status: PublicationStatus;
  featuredRequested?: boolean;
  scheduledFor?: string;
  publishedAt?: string;
  impressions: number;
  clicks: number;
  favorites: number;
  orders: number;
  revenue: number;
}

export interface OrderItem {
  productId: string;
  variantSku: string;
  productName: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  imageUrl?: string;
}

export interface Order {
  id: string;
  tenantId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  total: number;
  subtotal?: number;
  discount?: number;
  shippingFee?: number;
  status: 'CONFIRMED' | 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  paymentStatus?: PaymentStatus;
  paymentMethod?: string;
  shippingMethod?: string;
  trackingNumber?: string;
  shippingAddress?: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  items?: OrderItem[];
  itemCount: number;
  date: string;
  timeline?: Array<{ label: string; at: string }>;
}

export interface ReturnRequest {
  id: string;
  orderId: string;
  customerName: string;
  productName: string;
  reason: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REFUNDED';
  requestedAt: string;
}

export interface AbandonedCart {
  id: string;
  customerEmail: string;
  customerName: string;
  itemCount: number;
  value: number;
  lastActiveAt: string;
  recoverySent: boolean;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  productName: string;
  variantSku: string;
  location: string;
  change: number;
  newStock: number;
  reason: string;
  actor: string;
  timestamp: string;
}

export interface WarehouseLocation {
  id: string;
  name: string;
  city: string;
  country: string;
  isDefault: boolean;
  totalUnits: number;
}

export interface BrandCustomer {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone?: string;
  group: 'NEW' | 'RETURNING' | 'HIGH_VALUE' | 'VIP';
  orderCount: number;
  totalSpend: number;
  registeredAt: string;
  lastActivityAt: string;
  city: string;
}

export interface CustomerReview {
  id: string;
  productId: string;
  productName: string;
  customerName: string;
  rating: number;
  comment: string;
  verifiedPurchase: boolean;
  reply?: string;
  reported?: boolean;
  createdAt: string;
}

export interface StorefrontSectionConfig {
  id: string;
  type:
    | 'hero'
    | 'intro'
    | 'featured_products'
    | 'new_arrivals'
    | 'best_sellers'
    | 'categories'
    | 'collections'
    | 'try_on_promo'
    | 'story'
    | 'testimonials'
    | 'newsletter'
    | 'footer';
  title: string;
  subtitle?: string;
  enabled: boolean;
  ctaLabel?: string;
  bannerImage?: string;
}

export interface StorefrontPageRecord {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  content: string;
  updatedAt: string;
}

export interface NavMenuItem {
  id: string;
  label: string;
  href: string;
  parentId?: string;
}

export interface TryOnConfiguration {
  enabled: boolean;
  publicPageActive: boolean;
  mode: 'balanced' | 'high_fidelity' | 'fast_preview';
  resolution: '768x1024' | '1024x1366';
  allowedFormats: string[];
  maxUploadMb: number;
  supportedCategories: TryOnCategory[];
  concurrencyLimit: number;
  requireConsent: boolean;
  retentionDays: number;
  privacyPolicyUrl: string;
  termsUrl: string;
  dataProcessingNotice: string;
  domainAllowlist: string[];
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

export interface TryOnGenerationSession {
  id: string;
  tenantId: string;
  productId: string;
  productName: string;
  category: string;
  status: 'COMPLETED' | 'FAILED' | 'PROCESSING' | 'CANCELLED';
  durationMs: number;
  creditsUsed: number;
  convertedToCart?: boolean;
  attributedOrderId?: string;
  attributedRevenue?: number;
  errorReason?: string;
  createdAt: string;
}

export interface MarketingCampaign {
  id: string;
  name: string;
  season: string;
  status: 'ACTIVE' | 'SCHEDULED' | 'ENDED';
  startDate: string;
  endDate: string;
  impressions: number;
  conversions: number;
}

export interface DiscountCode {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  minOrderValue: number;
  scope: 'ALL_PRODUCTS' | 'COLLECTION' | 'SPECIFIC_PRODUCT';
  usageCount: number;
  usageLimit: number;
  expiresAt: string;
  active: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED';
  lastActiveAt: string;
}

export interface ActivityLogEntry {
  id: string;
  actor: string;
  role: StaffRole;
  action: string;
  entity: string;
  details: string;
  timestamp: string;
}

export interface BillingInvoice {
  id: string;
  period: string;
  amount: number;
  status: 'PAID' | 'PENDING';
  plan: string;
  issuedAt: string;
}

export interface ApiCredential {
  id: string;
  name: string;
  publicPrefix: string;
  createdAt: string;
  lastUsedAt: string;
  rateLimitPerMin: number;
  status: 'ACTIVE' | 'REVOKED';
}

export interface WebhookSubscription {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  lastDeliveryStatus: '200 OK' | 'RETRYING' | 'PENDING';
  lastDeliveryAt: string;
}

export interface BrandProfile {
  id?: string;
  name: string;
  slug: string;
  owner: string;
  email: string;
  onboardingCompleted?: boolean;
  onboardingCompletedAt?: number;
  legalName?: string;
  businessType?: string;
  registrationNumber?: string;
  phone?: string;
  country?: string;
  city?: string;
  address?: string;
  establishedYear?: string;
  categoryFocus?: string;
  specialties?: string[];
  slogan?: string;
  shortDescription?: string;
  description?: string;
  brandStory?: string;
  logo: string;
  lightLogo?: string;
  darkLogo?: string;
  mobileLogo?: string;
  favicon?: string;
  banner: string;
  socialImage?: string;
  verificationStatus?: 'VERIFIED' | 'UNDER_REVIEW' | 'UNVERIFIED';
  quotaUsed: number;
  quotaMax: number;
  plan: 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE';
  storeStatus?: 'LIVE' | 'MAINTENANCE';
  marketplaceStatus?: 'CONNECTED' | 'PAUSED';
  announcement: string;
  primaryColor: string;
  secondaryColor?: string;
  accentColor?: string;
  headerStyle?:
    | 'split'
    | 'split-reverse'
    | 'minimal'
    | 'centered'
    | 'cover'
    | 'magazine'
    | 'grid-showcase'
    | 'noir-boutique';
  backgroundColor?: string;
  textColor?: string;
  headingFont?: string;
  bodyFont?: string;
  buttonStyle?: 'pill' | 'rounded' | 'square';
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    website?: string;
  };
  domain?: {
    subdomain: string;
    customDomain?: string;
    verified: boolean;
    sslStatus: 'ACTIVE' | 'PENDING';
    primary: 'subdomain' | 'custom';
  };
  seo?: {
    title: string;
    description: string;
    canonicalUrl: string;
    ogImage: string;
    allowIndexing: boolean;
  };
  settings?: {
    timezone: string;
    dateFormat: string;
    language: string;
    currency: string;
    taxRatePercent: number;
    taxInclusive: boolean;
    freeShippingThreshold: number;
    defaultShippingFee: number;
    emailNotifications: boolean;
    orderNotifications: boolean;
    inventoryNotifications: boolean;
    tryOnNotifications: boolean;
    billingNotifications: boolean;
    twoFactorEnabled: boolean;
  };
}

export type TabType = 'overview' | 'products' | 'fabrics' | 'inventory' | 'storefront' | 'orders' | 'ai';
