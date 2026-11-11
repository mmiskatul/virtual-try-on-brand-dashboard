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
  Product,
  ReturnRequest,
  StorefrontPageRecord,
  StorefrontSectionConfig,
  TeamMember,
  TryOnConfiguration,
  TryOnGenerationSession,
  WarehouseLocation,
  WebhookSubscription,
} from '../types';

export const DEMO_BRAND_PROFILE: BrandProfile = {
  id: 'tenant_aura',
  name: 'Aura Atelier',
  slug: 'aura-atelier',
  owner: 'Elena Rostova',
  email: 'elena@auraatelier.com',
  legalName: 'Aura Atelier Fashion Ltd.',
  businessType: 'Independent Designer Fashion House',
  registrationNumber: 'REG-2024-88412',
  phone: '+880 1711-889900',
  country: 'Bangladesh / Italy',
  city: 'Dhaka',
  address: 'Studio 4B, Road 11, Banani, Dhaka 1213',
  establishedYear: '2022',
  categoryFocus: 'Silk Dresses, Linen Tailoring & Festive Wear',
  specialties: ['Mulberry Silk', 'Belgian Linen', 'Virtual Fitting Ready'],
  slogan: 'Quiet Luxury Engineered for Effortless Fit',
  shortDescription: 'Minimalist ethical mulberry silks and structured linen silhouettes crafted in small batches.',
  description:
    'Founded between Milan and Dhaka, Aura Atelier designs bias-cut dresses, tailored outerwear, and breathable separates with AI virtual fitting previews.',
  brandStory:
    'Every Aura Atelier collection starts with certified natural fibers, zero-waste bias cutting, and real-body drape calibration before any piece enters production.',
  logo: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&auto=format&fit=crop&q=80',
  lightLogo: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&auto=format&fit=crop&q=80',
  darkLogo: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&auto=format&fit=crop&q=80',
  mobileLogo: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=120&auto=format&fit=crop&q=80',
  favicon: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=64&auto=format&fit=crop&q=80',
  banner: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&auto=format&fit=crop&q=80',
  socialImage: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=1200&auto=format&fit=crop&q=80',
  verificationStatus: 'VERIFIED',
  quotaUsed: 124,
  quotaMax: 1000,
  plan: 'PRO',
  storeStatus: 'LIVE',
  marketplaceStatus: 'CONNECTED',
  announcement: 'Complimentary express delivery on orders over $150 — Try On virtually before ordering',
  primaryColor: '#0F172A',
  secondaryColor: '#334155',
  accentColor: '#0F172A',
  backgroundColor: '#FAF9F6',
  textColor: '#0F172A',
  headingFont: 'Plus Jakarta Sans',
  bodyFont: 'Plus Jakarta Sans',
  buttonStyle: 'pill',
  socialLinks: {
    instagram: '@auraatelier',
    facebook: 'fb.com/auraatelier',
    website: 'https://aura-atelier.v-try.fashion',
  },
  domain: {
    subdomain: 'aura-atelier.v-try.fashion',
    customDomain: 'shop.auraatelier.com',
    verified: true,
    sslStatus: 'ACTIVE',
    primary: 'subdomain',
  },
  seo: {
    title: 'Aura Atelier | Quiet Luxury & AI Virtual Try-On Boutique',
    description: 'Shop mulberry silk slip dresses, Italian linen trousers, and studio separates with instant virtual fitting.',
    canonicalUrl: 'https://aura-atelier.v-try.fashion',
    ogImage: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&auto=format&fit=crop&q=80',
    allowIndexing: true,
  },
  settings: {
    timezone: 'Asia/Dhaka (UTC+6)',
    dateFormat: 'YYYY-MM-DD',
    language: 'English',
    currency: 'USD ($)',
    taxRatePercent: 5,
    taxInclusive: false,
    freeShippingThreshold: 150,
    defaultShippingFee: 12,
    emailNotifications: true,
    orderNotifications: true,
    inventoryNotifications: true,
    tryOnNotifications: true,
    billingNotifications: true,
    twoFactorEnabled: false,
  },
};

const PHOTO_POOL = [
  'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=800&auto=format&fit=crop&q=80',
];

const SEED_SPECS: Array<{
  name: string;
  cat: string;
  tryOnCat: string;
  price: number;
  stock: number;
  mp: boolean;
  sf: boolean;
  tryOn: boolean;
  col: string;
  material: string;
}> = [
  { name: 'Elysian Draped Silk Slip Dress', cat: 'Dresses', tryOnCat: 'dresses', price: 245, stock: 44, mp: true, sf: true, tryOn: true, col: 'Premium Collection', material: '19mm Mulberry Silk Crepe' },
  { name: 'Sculpted Linen Cross-Halter Top', cat: 'Tops', tryOnCat: 'tops', price: 135, stock: 35, mp: false, sf: true, tryOn: true, col: 'Summer Collection', material: '100% Belgian Flax Linen' },
  { name: 'Aura Tailored Pleat Trousers', cat: 'Bottoms', tryOnCat: 'bottoms', price: 180, stock: 3, mp: true, sf: true, tryOn: true, col: 'Office Wear', material: 'Belgian Washed Slub Linen' },
  { name: 'Como Crepe Bow Office Blouse', cat: 'Shirts', tryOnCat: 'tops', price: 195, stock: 26, mp: true, sf: true, tryOn: true, col: 'Office Wear', material: '100% Silk Crepe de Chine' },
  { name: 'Palazzo Pleated Linen Column Dress', cat: 'Dresses', tryOnCat: 'dresses', price: 230, stock: 18, mp: true, sf: true, tryOn: true, col: 'Summer Collection', material: 'Organic Italian Linen Blend' },
  { name: 'Atelier Archive Cashmere Opera Coat', cat: 'Jackets', tryOnCat: 'outerwear', price: 540, stock: 9, mp: false, sf: true, tryOn: true, col: 'Winter Collection', material: 'Double-Faced Cashmere Silk' },
  { name: 'Siena Satin Draped Wrap Skirt', cat: 'Bottoms', tryOnCat: 'bottoms', price: 155, stock: 22, mp: true, sf: true, tryOn: true, col: 'New Arrivals', material: 'Heavy Matte Silk Satin' },
  { name: 'Amalfi Camp-Collar Linen Shirt', cat: 'Shirts', tryOnCat: 'tops', price: 98, stock: 41, mp: true, sf: true, tryOn: true, col: 'Summer Collection', material: 'Aero-Washed Italian Linen' },
  { name: 'Sonargaon Jamdani Festive Dress', cat: 'Traditional Wear', tryOnCat: 'dresses', price: 265, stock: 14, mp: true, sf: true, tryOn: true, col: 'Eid Collection', material: 'Handspun Muslin Cotton' },
  { name: 'Milanese Double-Breasted Linen Blazer', cat: 'Jackets', tryOnCat: 'outerwear', price: 310, stock: 19, mp: true, sf: true, tryOn: true, col: 'Office Wear', material: 'Structured Twill Linen' },
  { name: 'Moonlight Ivory Organza Saree', cat: 'Sarees', tryOnCat: 'dresses', price: 295, stock: 12, mp: true, sf: true, tryOn: true, col: 'Eid Collection', material: 'Pure Handloom Organza Silk' },
  { name: 'Velvet Evening Cowl Midi Gown', cat: 'Dresses', tryOnCat: 'dresses', price: 285, stock: 4, mp: false, sf: true, tryOn: true, col: 'Premium Collection', material: 'Silk Blend Micro Velvet' },
  { name: 'Mayfair Two-Ply Poplin Crisp Shirt', cat: 'Shirts', tryOnCat: 'tops', price: 118, stock: 33, mp: true, sf: true, tryOn: true, col: 'Office Wear', material: 'Egyptian Mercerized Cotton' },
  { name: 'Banani Studio Heavyweight Hoodie', cat: 'Hoodies', tryOnCat: 'tops', price: 140, stock: 29, mp: true, sf: true, tryOn: true, col: 'New Arrivals', material: '460gsm Organic Loopback Terry' },
  { name: 'Brera Supima Rib Mock Tee', cat: 'T-Shirts', tryOnCat: 'tops', price: 58, stock: 64, mp: true, sf: true, tryOn: true, col: 'Summer Collection', material: '260gsm Combed Supima Cotton' },
  { name: 'Marais Selvedge Wide-Leg Jeans', cat: 'Jeans', tryOnCat: 'bottoms', price: 168, stock: 21, mp: true, sf: true, tryOn: true, col: 'New Arrivals', material: '13oz Organic Selvedge Denim' },
  { name: 'Botanical Block-Print Summer Tunic', cat: 'Traditional Wear', tryOnCat: 'tops', price: 88, stock: 37, mp: true, sf: true, tryOn: true, col: 'Eid Collection', material: '80-Count Cotton Cambric' },
  { name: 'Stockholm Double-Faced Wool Coat', cat: 'Jackets', tryOnCat: 'outerwear', price: 420, stock: 7, mp: false, sf: true, tryOn: true, col: 'Winter Collection', material: '90% Merino / 10% Cashmere' },
  { name: 'Kuala Wide Bamboo Palazzo Pants', cat: 'Pants', tryOnCat: 'bottoms', price: 96, stock: 28, mp: true, sf: true, tryOn: true, col: 'Summer Collection', material: 'Bamboo Lyocell Linen' },
  { name: 'Chattogram Indigo Slub Overshirt', cat: 'Shirts', tryOnCat: 'tops', price: 79, stock: 42, mp: true, sf: true, tryOn: true, col: 'Summer Collection', material: 'Hand-Spun Organic Khadi' },
  { name: 'Lumiere Bias Bias-Cut Silk Camisole', cat: 'Tops', tryOnCat: 'tops', price: 110, stock: 30, mp: true, sf: true, tryOn: true, col: 'New Arrivals', material: '16mm Charmeuse Silk' },
  { name: 'Florentine Structured Saddle Bag', cat: 'Accessories', tryOnCat: 'all', price: 240, stock: 16, mp: true, sf: true, tryOn: false, col: 'Premium Collection', material: 'Vegetable-Tanned Calfskin' },
  { name: 'Silk Twill Printed Square Scarf', cat: 'Accessories', tryOnCat: 'all', price: 92, stock: 50, mp: true, sf: true, tryOn: false, col: 'Summer Collection', material: '14mm Como Twill Silk' },
  { name: 'Nordic Fine-Gauge Merino Knit', cat: 'Tops', tryOnCat: 'tops', price: 152, stock: 2, mp: false, sf: true, tryOn: true, col: 'Winter Collection', material: 'Extra-Fine RWS Merino' },
  { name: 'Bergen Flannel Single-Pleat Trouser', cat: 'Pants', tryOnCat: 'bottoms', price: 185, stock: 19, mp: true, sf: true, tryOn: true, col: 'Winter Collection', material: 'Brushed Merino Flannel' },
  { name: 'Tropic Washed Poplin Maxi Dress', cat: 'Dresses', tryOnCat: 'dresses', price: 164, stock: 24, mp: true, sf: true, tryOn: true, col: 'Summer Collection', material: 'GOTS Organic Cotton Poplin' },
  { name: 'Atelier Cropped Matte Field Jacket', cat: 'Jackets', tryOnCat: 'outerwear', price: 295, stock: 15, mp: true, sf: true, tryOn: true, col: 'New Arrivals', material: 'Waterproof Nylon Twill' },
  { name: 'Dhakai Pastel Zari Muslin Saree', cat: 'Sarees', tryOnCat: 'dresses', price: 255, stock: 8, mp: true, sf: true, tryOn: true, col: 'Eid Collection', material: 'Muslin Silk & Metallic Zari' },
  { name: 'Washed Charcoal Boxy Studio Tee', cat: 'T-Shirts', tryOnCat: 'tops', price: 54, stock: 58, mp: true, sf: true, tryOn: true, col: 'New Arrivals', material: '280gsm Enzyme-Washed Jersey' },
  { name: 'Heritage Raw Indigo Carpenter Jeans', cat: 'Jeans', tryOnCat: 'bottoms', price: 172, stock: 17, mp: false, sf: false, tryOn: true, col: 'New Arrivals', material: '14oz Raw Cotton Denim' },
  { name: 'Unpublished SS27 Silk Prototype', cat: 'Dresses', tryOnCat: 'dresses', price: 320, stock: 5, mp: false, sf: false, tryOn: false, col: 'Premium Collection', material: 'Studio Test Silk' },
  { name: 'Archival Linen Belted Trench', cat: 'Jackets', tryOnCat: 'outerwear', price: 365, stock: 11, mp: false, sf: true, tryOn: true, col: 'Winter Collection', material: 'Heavy Belgian Canvas' },
];

export const DEMO_PRODUCTS: Product[] = SEED_SPECS.map((item, idx) => {
  const num = String(idx + 1).padStart(3, '0');
  const slug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const sku = `AUR-${item.cat.slice(0, 3).toUpperCase()}-${num}`;
  const img = PHOTO_POOL[idx % PHOTO_POOL.length];
  const createdDays = idx + 1;

  return {
    id: `prod_${idx + 1}`,
    tenantId: 'tenant_aura',
    name: item.name,
    slug,
    sku,
    category: item.cat,
    subCategory: item.tryOnCat,
    productType: 'Apparel',
    shortDescription: `${item.material} crafted in small studio batches.`,
    description: `${item.name} tailored in ${item.material}. Designed for clean everyday silhouette balance and validated for AI virtual fitting.`,
    collections: [item.col],
    tags: [item.cat.toLowerCase(), item.material.split(' ')[0].toLowerCase(), 'editorial'],
    price: item.price,
    compareAtPrice: idx % 3 === 0 ? Math.round(item.price * 1.18) : undefined,
    costPrice: Math.round(item.price * 0.42),
    taxable: true,
    stock: item.stock,
    lowStockThreshold: 5,
    warehouseLocation: idx % 2 === 0 ? 'Dhaka Main Studio' : 'Milan Dispatch Hub',
    allowBackorder: false,
    catalogStatus: item.sf || item.mp ? 'ACTIVE' : 'DRAFT',
    brandStorefrontPublished: item.sf,
    marketplacePublished: item.mp,
    isTryOnEligible: item.tryOn,
    tryOnCategory: item.tryOnCat,
    includeInBrandTryOn: item.tryOn,
    includeInMarketplaceTryOn: item.tryOn && item.mp,
    imageQualityStatus: item.tryOn ? 'VERIFIED' : 'NEEDS_CHECK',
    image: img,
    images: [img, PHOTO_POOL[(idx + 2) % PHOTO_POOL.length]],
    variants: [
      { id: `${sku}-S`, sku: `${sku}-S`, size: 'S', color: 'Obsidian', colorHex: '#111827', stockQuantity: Math.max(1, Math.floor(item.stock / 3)), available: item.stock > 0 },
      { id: `${sku}-M`, sku: `${sku}-M`, size: 'M', color: 'Obsidian', colorHex: '#111827', stockQuantity: Math.max(1, Math.floor(item.stock / 2)), available: item.stock > 0 },
      { id: `${sku}-L`, sku: `${sku}-L`, size: 'L', color: 'Ivory', colorHex: '#F3EFEA', stockQuantity: Math.max(0, Math.floor(item.stock / 4)), available: item.stock > 0 },
    ],
    specs: {
      material: item.material,
      fabricType: item.material,
      weightGsm: '190 gsm',
      stretch: 'LOW',
      fitType: 'Relaxed Tailored',
      sleeveType: 'Standard',
      neckType: 'Clean Seam',
      length: 'Regular',
      care: 'Cold gentle wash or dry clean',
      origin: 'Dhaka / Milan',
    },
    salesCount: Math.max(4, 96 - idx * 2),
    viewsCount: 420 + (32 - idx) * 65,
    favoritesCount: 28 + (32 - idx) * 6,
    createdAt: new Date(Date.now() - createdDays * 86_400_000).toISOString().slice(0, 10),
    updatedAt: new Date(Date.now() - Math.floor(createdDays / 2) * 86_400_000).toISOString().slice(0, 10),
  };
});

export const DEMO_FABRICS: Fabric[] = [
  { id: 'fab_1', tenantId: 'tenant_aura', name: '19mm Mulberry Silk Crepe', composition: '100% Organic Mulberry Silk', stretch: 'LOW', thickness: 'LIGHT', care: 'Dry clean or cold silk wash.', color: 'Ivory', weightGsm: 110 },
  { id: 'fab_2', tenantId: 'tenant_aura', name: 'Belgian Washed Slub Linen', composition: '100% European Flax Linen', stretch: 'NONE', thickness: 'MEDIUM', care: 'Machine wash 30°C, line dry.', color: 'Sand', weightGsm: 185 },
  { id: 'fab_3', tenantId: 'tenant_aura', name: '460gsm Loopback French Terry', composition: '100% Combed Organic Cotton', stretch: 'MEDIUM', thickness: 'HEAVY', care: 'Wash cold inside out.', color: 'Charcoal', weightGsm: 460 },
  { id: 'fab_4', tenantId: 'tenant_aura', name: 'Dhakai 80-Count Muslin', composition: '100% Handspun Fine Cotton', stretch: 'NONE', thickness: 'LIGHT', care: 'Gentle cold soak only.', color: 'Ecru', weightGsm: 95 },
];

export const DEMO_MARKETPLACE_POSTS: MarketplacePost[] = [
  {
    id: 'post_01',
    tenantId: 'tenant_aura',
    productId: 'prod_1',
    title: 'Elysian Draped Silk Slip Dress — Global Runway Highlight',
    description: 'Cut on a 45-degree bias in 19mm mulberry silk crepe with real-time virtual drape fitting.',
    category: 'Dresses',
    collection: 'Premium Collection',
    promotionalText: 'Featured in Spring Silk Edit',
    tags: ['silk', 'slip dress', 'evening'],
    featuredImage: PHOTO_POOL[0],
    gallery: [PHOTO_POOL[0], PHOTO_POOL[1]],
    status: 'PUBLISHED',
    featuredRequested: true,
    publishedAt: '2026-11-04T09:00:00Z',
    impressions: 14280,
    clicks: 2180,
    favorites: 492,
    orders: 64,
    revenue: 15680,
  },
  {
    id: 'post_02',
    tenantId: 'tenant_aura',
    productId: 'prod_3',
    title: 'Aura Tailored Pleat Trousers — Office Minimalist Uniform',
    description: 'Relaxed Belgian flax linen double-pleated trousers engineered for breathable daily wear.',
    category: 'Bottoms',
    collection: 'Office Wear',
    promotionalText: 'Free shipping over $150',
    tags: ['linen', 'trousers', 'office'],
    featuredImage: PHOTO_POOL[4],
    gallery: [PHOTO_POOL[4]],
    status: 'PUBLISHED',
    publishedAt: '2026-11-01T10:30:00Z',
    impressions: 9420,
    clicks: 1290,
    favorites: 304,
    orders: 41,
    revenue: 7380,
  },
  {
    id: 'post_03',
    tenantId: 'tenant_aura',
    productId: 'prod_6',
    title: 'Atelier Archive Cashmere Opera Coat — Marketplace Release Draft',
    description: 'Prepared draft post pending final winter campaign photography approval.',
    category: 'Jackets',
    collection: 'Winter Collection',
    tags: ['cashmere', 'outerwear', 'draft'],
    featuredImage: PHOTO_POOL[8],
    gallery: [PHOTO_POOL[8]],
    status: 'DRAFT',
    impressions: 0,
    clicks: 0,
    favorites: 0,
    orders: 0,
    revenue: 0,
  },
  {
    id: 'post_04',
    tenantId: 'tenant_aura',
    productId: 'prod_11',
    title: 'Moonlight Ivory Organza Saree — Scheduled Festive Spotlight',
    description: 'Scheduled automatically for Eid festive campaign kickoff.',
    category: 'Sarees',
    collection: 'Eid Collection',
    tags: ['saree', 'eid', 'organza'],
    featuredImage: PHOTO_POOL[11],
    gallery: [PHOTO_POOL[11]],
    status: 'SCHEDULED',
    scheduledFor: '2026-11-18T10:00',
    impressions: 0,
    clicks: 0,
    favorites: 0,
    orders: 0,
    revenue: 0,
  },
];

export const DEMO_ORDERS: Order[] = [
  {
    id: 'ORD-77492',
    tenantId: 'tenant_aura',
    customerName: 'Nadia Rahman',
    customerEmail: 'nadia.rahman@example.com',
    customerPhone: '+880 1712-345678',
    total: 425,
    subtotal: 425,
    discount: 0,
    shippingFee: 0,
    status: 'PROCESSING',
    paymentStatus: 'PAID',
    paymentMethod: 'bKash',
    shippingMethod: 'Dhaka Same-Day Express',
    trackingNumber: 'TRK-882910BD',
    shippingAddress: { street: 'House 24, Road 11, Banani', city: 'Dhaka', postalCode: '1213', country: 'Bangladesh' },
    items: [
      { productId: 'prod_1', variantSku: 'AUR-DRE-001-M', productName: 'Elysian Draped Silk Slip Dress', size: 'M', color: 'Obsidian', quantity: 1, unitPrice: 245, lineTotal: 245, imageUrl: PHOTO_POOL[0] },
      { productId: 'prod_3', variantSku: 'AUR-BOT-003-M', productName: 'Aura Tailored Pleat Trousers', size: 'M', color: 'Obsidian', quantity: 1, unitPrice: 180, lineTotal: 180, imageUrl: PHOTO_POOL[4] },
    ],
    itemCount: 2,
    date: '2026-11-10',
    timeline: [
      { label: 'Order Placed via Marketplace', at: '2026-11-10 10:15' },
      { label: 'bKash Payment Confirmed', at: '2026-11-10 10:16' },
      { label: 'Packing at Dhaka Studio', at: '2026-11-10 14:20' },
    ],
  },
  {
    id: 'ORD-77488',
    tenantId: 'tenant_aura',
    customerName: 'Tariq Hasan',
    customerEmail: 'tariq.h@example.com',
    total: 310,
    subtotal: 310,
    shippingFee: 0,
    status: 'SHIPPED',
    paymentStatus: 'PAID',
    paymentMethod: 'Nagad',
    shippingMethod: 'Priority Air Courier',
    trackingNumber: 'TRK-882844BD',
    shippingAddress: { street: 'Suite 9A, Agrabad', city: 'Chattogram', postalCode: '4100', country: 'Bangladesh' },
    items: [
      { productId: 'prod_10', variantSku: 'AUR-JAC-010-L', productName: 'Milanese Double-Breasted Linen Blazer', size: 'L', color: 'Obsidian', quantity: 1, unitPrice: 310, lineTotal: 310, imageUrl: PHOTO_POOL[3] },
    ],
    itemCount: 1,
    date: '2026-11-08',
    timeline: [
      { label: 'Order Confirmed', at: '2026-11-08 11:02' },
      { label: 'Dispatched with Pathao/Steadfast', at: '2026-11-09 09:30' },
    ],
  },
  {
    id: 'ORD-77451',
    tenantId: 'tenant_aura',
    customerName: 'Claire Moreau',
    customerEmail: 'claire.m@example.com',
    total: 230,
    subtotal: 230,
    shippingFee: 0,
    status: 'DELIVERED',
    paymentStatus: 'PAID',
    paymentMethod: 'Card',
    shippingMethod: 'DHL Express',
    trackingNumber: 'DHL-9938174',
    shippingAddress: { street: '18 Rue de Turenne', city: 'Paris', postalCode: '75004', country: 'France' },
    items: [
      { productId: 'prod_5', variantSku: 'AUR-DRE-005-S', productName: 'Palazzo Pleated Linen Column Dress', size: 'S', color: 'Ivory', quantity: 1, unitPrice: 230, lineTotal: 230, imageUrl: PHOTO_POOL[2] },
    ],
    itemCount: 1,
    date: '2026-11-03',
  },
  {
    id: 'ORD-77412',
    tenantId: 'tenant_aura',
    customerName: 'Farhan Ahmed',
    customerEmail: 'farhan.a@example.com',
    total: 195,
    status: 'PENDING',
    paymentStatus: 'PENDING',
    paymentMethod: 'COD',
    itemCount: 1,
    date: '2026-11-11',
  },
  {
    id: 'ORD-77398',
    tenantId: 'tenant_aura',
    customerName: 'Sadia Chowdhury',
    customerEmail: 'sadia.c@example.com',
    total: 295,
    status: 'DELIVERED',
    paymentStatus: 'PAID',
    paymentMethod: 'bKash',
    itemCount: 1,
    date: '2026-10-29',
  },
];

export const DEMO_RETURNS: ReturnRequest[] = [
  { id: 'RET-301', orderId: 'ORD-77451', customerName: 'Claire Moreau', productName: 'Palazzo Pleated Linen Column Dress', reason: 'Exchange Size S -> M', amount: 230, status: 'PENDING', requestedAt: '2026-11-10' },
  { id: 'RET-298', orderId: 'ORD-77102', customerName: 'Lucas Meyer', productName: 'Mayfair Two-Ply Poplin Crisp Shirt', reason: 'Color preference', amount: 118, status: 'REFUNDED', requestedAt: '2026-11-02' },
];

export const DEMO_ABANDONED_CARTS: AbandonedCart[] = [
  { id: 'CART-901', customerName: 'Anika Tabassum', customerEmail: 'anika.t@example.com', itemCount: 2, value: 380, lastActiveAt: '2 hours ago', recoverySent: false },
  { id: 'CART-896', customerName: 'Samir Kabir', customerEmail: 'samir.k@example.com', itemCount: 1, value: 195, lastActiveAt: '14 hours ago', recoverySent: true },
];

export const DEMO_WAREHOUSES: WarehouseLocation[] = [
  { id: 'wh_dhaka', name: 'Dhaka Main Studio', city: 'Dhaka', country: 'Bangladesh', isDefault: true, totalUnits: 512 },
  { id: 'wh_milan', name: 'Milan Dispatch Hub', city: 'Milan', country: 'Italy', isDefault: false, totalUnits: 214 },
];

export const DEMO_INVENTORY_LOGS: InventoryMovement[] = [
  { id: 'inv_1', productId: 'prod_3', productName: 'Aura Tailored Pleat Trousers', variantSku: 'AUR-BOT-003-M', location: 'Dhaka Main Studio', change: -2, newStock: 3, reason: 'Marketplace Order ORD-77492', actor: 'System Checkout', timestamp: '2026-11-10 10:15' },
  { id: 'inv_2', productId: 'prod_1', productName: 'Elysian Draped Silk Slip Dress', variantSku: 'AUR-DRE-001-M', location: 'Dhaka Main Studio', change: 20, newStock: 44, reason: 'Atelier batch restock', actor: 'Elena Rostova', timestamp: '2026-11-09 16:40' },
  { id: 'inv_3', productId: 'prod_24', productName: 'Nordic Fine-Gauge Merino Knit', variantSku: 'AUR-TOP-024-S', location: 'Milan Dispatch Hub', change: -4, newStock: 2, reason: 'VIP Boutique Order', actor: 'Order Manager', timestamp: '2026-11-08 11:20' },
];

export const DEMO_CUSTOMERS: BrandCustomer[] = [
  { id: 'cust_1', tenantId: 'tenant_aura', name: 'Nadia Rahman', email: 'nadia.rahman@example.com', phone: '+880 1712-345678', group: 'VIP', orderCount: 6, totalSpend: 1480, registeredAt: '2026-04-12', lastActivityAt: '2026-11-10', city: 'Dhaka' },
  { id: 'cust_2', tenantId: 'tenant_aura', name: 'Tariq Hasan', email: 'tariq.h@example.com', group: 'HIGH_VALUE', orderCount: 4, totalSpend: 920, registeredAt: '2026-06-03', lastActivityAt: '2026-11-08', city: 'Chattogram' },
  { id: 'cust_3', tenantId: 'tenant_aura', name: 'Claire Moreau', email: 'claire.m@example.com', group: 'RETURNING', orderCount: 3, totalSpend: 680, registeredAt: '2026-07-19', lastActivityAt: '2026-11-03', city: 'Paris' },
  { id: 'cust_4', tenantId: 'tenant_aura', name: 'Sadia Chowdhury', email: 'sadia.c@example.com', group: 'VIP', orderCount: 5, totalSpend: 1210, registeredAt: '2026-05-22', lastActivityAt: '2026-10-29', city: 'Dhaka' },
  { id: 'cust_5', tenantId: 'tenant_aura', name: 'Farhan Ahmed', email: 'farhan.a@example.com', group: 'NEW', orderCount: 1, totalSpend: 195, registeredAt: '2026-11-11', lastActivityAt: '2026-11-11', city: 'Sylhet' },
];

export const DEMO_REVIEWS: CustomerReview[] = [
  { id: 'rev_b1', productId: 'prod_1', productName: 'Elysian Draped Silk Slip Dress', customerName: 'Nadia Rahman', rating: 5, comment: 'Virtual try-on drape matched size M perfectly.', verifiedPurchase: true, reply: 'Thank you Nadia! So glad the bias cut felt effortless.', createdAt: '2026-11-05' },
  { id: 'rev_b2', productId: 'prod_3', productName: 'Aura Tailored Pleat Trousers', customerName: 'Claire Moreau', rating: 5, comment: 'Belgian linen holds crisp pleats all day.', verifiedPurchase: true, createdAt: '2026-11-02' },
  { id: 'rev_b3', productId: 'prod_10', productName: 'Milanese Double-Breasted Linen Blazer', customerName: 'Tariq Hasan', rating: 4, comment: 'Great shoulder structure; wish sleeve cuffs had one extra button.', verifiedPurchase: true, createdAt: '2026-10-30' },
];

export const DEMO_TRYON_CONFIG: TryOnConfiguration = {
  enabled: true,
  publicPageActive: true,
  mode: 'balanced',
  resolution: '1024x1366',
  allowedFormats: ['image/jpeg', 'image/png', 'image/webp'],
  maxUploadMb: 10,
  supportedCategories: ['tops', 'bottoms', 'dresses', 'outerwear'],
  concurrencyLimit: 4,
  requireConsent: true,
  retentionDays: 30,
  privacyPolicyUrl: '/privacy-policy',
  termsUrl: '/terms',
  dataProcessingNotice:
    'Uploaded photographs are used strictly for temporary customer try-on visualization in accordance with platform consent policy.',
  domainAllowlist: ['auraatelier.com', 'shop.auraatelier.com', 'localhost:3000'],
  appearance: {
    pageTitle: 'Aura Atelier Virtual Fitting Studio',
    pageDescription:
      'Preview how Aura Atelier mulberry silk dresses and tailored linen silhouettes look on you before placing an order.',
    uploadInstructions:
      'Upload a clear front-facing photo with even lighting and unobstructed shoulders.',
    primaryBtnText: 'Try It On',
    uploadBtnText: 'Upload Your Photo',
    generateBtnText: 'Generate My Look',
    retryBtnText: 'Try Another Outfit',
    loadingText: 'Synthesizing silk drape & fabric contour...',
    successText: 'Virtual fit complete — slide to compare original vs look.',
    errorText: 'Generation could not complete cleanly. Please retry with another photo.',
    accentColor: '#0F172A',
    backgroundColor: '#FAF9F6',
    gridStyle: '4-col',
    previewLayout: 'split',
    showPrices: true,
    showRatings: true,
  },
};

export const DEMO_TRYON_SESSIONS: TryOnGenerationSession[] = [
  { id: 'gen_9042', tenantId: 'tenant_aura', productId: 'prod_1', productName: 'Elysian Draped Silk Slip Dress', category: 'dresses', status: 'COMPLETED', durationMs: 2840, creditsUsed: 1, convertedToCart: true, attributedOrderId: 'ORD-77492', attributedRevenue: 245, createdAt: '2026-11-10 09:58' },
  { id: 'gen_9041', tenantId: 'tenant_aura', productId: 'prod_3', productName: 'Aura Tailored Pleat Trousers', category: 'bottoms', status: 'COMPLETED', durationMs: 2410, creditsUsed: 1, convertedToCart: true, attributedOrderId: 'ORD-77492', attributedRevenue: 180, createdAt: '2026-11-10 10:04' },
  { id: 'gen_9038', tenantId: 'tenant_aura', productId: 'prod_10', productName: 'Milanese Double-Breasted Linen Blazer', category: 'outerwear', status: 'COMPLETED', durationMs: 3120, creditsUsed: 1, convertedToCart: true, attributedOrderId: 'ORD-77488', attributedRevenue: 310, createdAt: '2026-11-08 10:45' },
  { id: 'gen_9035', tenantId: 'tenant_aura', productId: 'prod_11', productName: 'Moonlight Ivory Organza Saree', category: 'dresses', status: 'FAILED', durationMs: 1180, creditsUsed: 0, errorReason: 'Subject pose occlusion check failed', createdAt: '2026-11-07 18:19' },
  { id: 'gen_9031', tenantId: 'tenant_aura', productId: 'prod_5', productName: 'Palazzo Pleated Linen Column Dress', category: 'dresses', status: 'COMPLETED', durationMs: 2670, creditsUsed: 1, convertedToCart: false, createdAt: '2026-11-06 15:22' },
];

export const DEMO_CAMPAIGNS: MarketingCampaign[] = [
  { id: 'cmp_1', name: 'Winter Silk & Cashmere Preview', season: 'AW 2026', status: 'ACTIVE', startDate: '2026-11-01', endDate: '2026-12-15', impressions: 18400, conversions: 142 },
  { id: 'cmp_2', name: 'Eid Heritage Muslin Capsule', season: 'Festive', status: 'SCHEDULED', startDate: '2026-11-18', endDate: '2026-12-30', impressions: 0, conversions: 0 },
];

export const DEMO_DISCOUNTS: DiscountCode[] = [
  { id: 'dsc_1', code: 'AURA15', type: 'PERCENTAGE', value: 15, minOrderValue: 150, scope: 'ALL_PRODUCTS', usageCount: 42, usageLimit: 200, expiresAt: '2026-12-31', active: true },
  { id: 'dsc_2', code: 'SILK25', type: 'FIXED', value: 25, minOrderValue: 200, scope: 'COLLECTION', usageCount: 19, usageLimit: 100, expiresAt: '2026-11-30', active: true },
];

export const DEMO_STOREFRONT_SECTIONS: StorefrontSectionConfig[] = [
  { id: 'sec_hero', type: 'hero', title: 'Quiet Luxury Engineered for Effortless Fit', subtitle: 'Small-batch mulberry silks and tailored Belgian linen.', enabled: true, ctaLabel: 'Explore Collection' },
  { id: 'sec_intro', type: 'intro', title: 'Crafted Between Milan & Dhaka', subtitle: 'Zero-waste bias tailoring validated for virtual try-on.', enabled: true },
  { id: 'sec_featured', type: 'featured_products', title: 'Signature Studio Pieces', enabled: true },
  { id: 'sec_new', type: 'new_arrivals', title: 'New Arrivals', enabled: true },
  { id: 'sec_tryon', type: 'try_on_promo', title: 'Try Our Garments Virtually Before Ordering', subtitle: 'Upload a portrait and preview your exact silhouette on our studio canvas.', enabled: true, ctaLabel: 'Launch Studio' },
  { id: 'sec_collections', type: 'collections', title: 'Curated Capsules', enabled: true },
  { id: 'sec_reviews', type: 'testimonials', title: 'Customer Impressions', enabled: true },
  { id: 'sec_newsletter', type: 'newsletter', title: 'Join Private Trunk Invitations', enabled: true },
];

export const DEMO_STOREFRONT_PAGES: StorefrontPageRecord[] = [
  { id: 'pg_home', title: 'Home', slug: '/', published: true, content: 'Main boutique editorial landing page.', updatedAt: '2026-11-09' },
  { id: 'pg_about', title: 'About Us', slug: '/about', published: true, content: 'Our Milan & Dhaka atelier heritage and ethical silk standards.', updatedAt: '2026-11-04' },
  { id: 'pg_size', title: 'Size Guide', slug: '/size-guide', published: true, content: 'Chest, waist, hip, and length measurement charts across XS–XXL.', updatedAt: '2026-10-28' },
  { id: 'pg_shipping', title: 'Shipping & Return Policy', slug: '/policies', published: true, content: '2-4 business days insured courier delivery; 30-day unworn returns.', updatedAt: '2026-10-21' },
];

export const DEMO_NAV_MENUS: NavMenuItem[] = [
  { id: 'nav_1', label: 'New Arrivals', href: '#new-arrivals' },
  { id: 'nav_2', label: 'All Garments', href: '#catalog' },
  { id: 'nav_3', label: 'Virtual Try-On', href: '/try/aura-atelier' },
  { id: 'nav_4', label: 'About Studio', href: '#about' },
];

export const DEMO_TEAM: TeamMember[] = [
  { id: 'tm_1', name: 'Elena Rostova', email: 'elena@auraatelier.com', role: 'OWNER', status: 'ACTIVE', lastActiveAt: 'Online now' },
  { id: 'tm_2', name: 'Amina Karim', email: 'amina@auraatelier.com', role: 'PRODUCT_MANAGER', status: 'ACTIVE', lastActiveAt: '18 mins ago' },
  { id: 'tm_3', name: 'Rafiq Islam', email: 'rafiq@auraatelier.com', role: 'ORDER_MANAGER', status: 'ACTIVE', lastActiveAt: '1 hour ago' },
  { id: 'tm_4', name: 'Sofia Rossi', email: 'sofia@auraatelier.com', role: 'TRYON_MANAGER', status: 'ACTIVE', lastActiveAt: 'Yesterday' },
];

export const DEMO_ACTIVITY_LOGS: ActivityLogEntry[] = [
  { id: 'act_1', actor: 'Amina Karim', role: 'PRODUCT_MANAGER', action: 'PRODUCT_PUBLISHED', entity: 'Elysian Draped Silk Slip Dress', details: 'Published to Marketplace and Storefront channels', timestamp: '2026-11-10 15:10' },
  { id: 'act_2', actor: 'Rafiq Islam', role: 'ORDER_MANAGER', action: 'ORDER_UPDATED', entity: 'ORD-77488', details: 'Marked order as SHIPPED (TRK-882844BD)', timestamp: '2026-11-09 09:30' },
  { id: 'act_3', actor: 'Sofia Rossi', role: 'TRYON_MANAGER', action: 'TRYON_CONFIG_SAVED', entity: 'Try-On Configuration', details: 'Set default resolution to 1024x1366', timestamp: '2026-11-08 17:45' },
  { id: 'act_4', actor: 'Elena Rostova', role: 'OWNER', action: 'TEAM_INVITED', entity: 'sofia@auraatelier.com', details: 'Assigned role TRYON_MANAGER', timestamp: '2026-11-05 11:20' },
];

export const DEMO_INVOICES: BillingInvoice[] = [
  { id: 'INV-2026-11', period: 'Nov 2026', amount: 149, status: 'PAID', plan: 'PRO Monthly + 1,000 AI Credits', issuedAt: '2026-11-01' },
  { id: 'INV-2026-10', period: 'Oct 2026', amount: 149, status: 'PAID', plan: 'PRO Monthly + 1,000 AI Credits', issuedAt: '2026-10-01' },
  { id: 'INV-2026-09', period: 'Sep 2026', amount: 149, status: 'PAID', plan: 'PRO Monthly + 1,000 AI Credits', issuedAt: '2026-09-01' },
];

export const DEMO_API_KEYS: ApiCredential[] = [
  { id: 'key_live_1', name: 'Production Headless Storefront Key', publicPrefix: 'vtry_live_98ab••••••4e1f', createdAt: '2026-08-14', lastUsedAt: '5 mins ago', rateLimitPerMin: 120, status: 'ACTIVE' },
  { id: 'key_test_1', name: 'Staging Widget Embed Key', publicPrefix: 'vtry_test_44cd••••••9b0a', createdAt: '2026-10-02', lastUsedAt: '2 days ago', rateLimitPerMin: 60, status: 'ACTIVE' },
];

export const DEMO_WEBHOOKS: WebhookSubscription[] = [
  { id: 'wh_1', url: 'https://hooks.auraatelier.com/vton-events', events: ['product.published', 'order.created', 'tryon.completed'], active: true, lastDeliveryStatus: '200 OK', lastDeliveryAt: '2026-11-11 10:15' },
  { id: 'wh_2', url: 'https://erp.auraatelier.com/inventory-sync', events: ['inventory.updated', 'order.updated'], active: true, lastDeliveryStatus: '200 OK', lastDeliveryAt: '2026-11-10 14:20' },
];

export const DEMO_REVENUE_SERIES = {
  today: [
    { label: '09:00', revenue: 245, orders: 1, tryOns: 12 },
    { label: '12:00', revenue: 425, orders: 2, tryOns: 21 },
    { label: '15:00', revenue: 690, orders: 3, tryOns: 34 },
    { label: '18:00', revenue: 885, orders: 4, tryOns: 46 },
  ],
  '7d': [
    { label: 'Mon', revenue: 480, orders: 2, tryOns: 28 },
    { label: 'Tue', revenue: 720, orders: 3, tryOns: 35 },
    { label: 'Wed', revenue: 615, orders: 3, tryOns: 31 },
    { label: 'Thu', revenue: 940, orders: 4, tryOns: 44 },
    { label: 'Fri', revenue: 1180, orders: 5, tryOns: 52 },
    { label: 'Sat', revenue: 1490, orders: 6, tryOns: 64 },
    { label: 'Sun', revenue: 1320, orders: 5, tryOns: 58 },
  ],
  '30d': [
    { label: 'Wk 1', revenue: 4210, orders: 18, tryOns: 192 },
    { label: 'Wk 2', revenue: 5180, orders: 22, tryOns: 245 },
    { label: 'Wk 3', revenue: 6490, orders: 27, tryOns: 288 },
    { label: 'Wk 4', revenue: 7840, orders: 31, tryOns: 334 },
  ],
  '90d': [
    { label: 'Sep', revenue: 18400, orders: 76, tryOns: 810 },
    { label: 'Oct', revenue: 22150, orders: 91, tryOns: 980 },
    { label: 'Nov', revenue: 24890, orders: 102, tryOns: 1120 },
  ],
};

