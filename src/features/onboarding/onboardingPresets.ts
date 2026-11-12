import { BrandProfile, Fabric, Product } from '../../types';

export const ONBOARDING_STEPS = [
  '1. Brand Name',
  '2. Contact Info',
  '3. Colors & Photos',
  '4. Products & Try-On',
  '5. Review & Save',
] as const;

export const CATEGORY_FOCUS_OPTIONS = [
  "Women's Wear",
  "Men's Wear",
  'Casual Wear',
  'Streetwear',
  'Traditional Wear',
  'Sportswear',
  'Party Wear',
  'Kids Wear',
];

const LEGACY_CATEGORY_MAP: Record<string, string> = {
  'Womenswear & Couture': "Women's Wear",
  "Women's Clothing": "Women's Wear",
  'Menswear & Tailoring': "Men's Wear",
  "Men's Clothing": "Men's Wear",
  'Contemporary Apparel & Ready-to-Wear': 'Casual Wear',
  'Everyday & Casual Wear': 'Casual Wear',
  'Streetwear & Essentials': 'Streetwear',
  'Streetwear & Basics': 'Streetwear',
  'Modest & Heritage Wear': 'Traditional Wear',
  'Traditional & Modest Wear': 'Traditional Wear',
  'Athleisure & Resort': 'Sportswear',
  'Sport & Vacation Wear': 'Sportswear',
  'Bridal & Occasionwear': 'Party Wear',
  'Wedding & Party Wear': 'Party Wear',
};

export function normalizeCategoryFocus(value?: string): string {
  const clean = String(value || '').trim();
  if (!clean) return CATEGORY_FOCUS_OPTIONS[0];
  if (LEGACY_CATEGORY_MAP[clean]) return LEGACY_CATEGORY_MAP[clean];
  return CATEGORY_FOCUS_OPTIONS.includes(clean) ? clean : CATEGORY_FOCUS_OPTIONS[0];
}

export function parseCategorySelection(value?: string | string[] | null): string[] {
  const rawList = Array.isArray(value)
    ? value
    : typeof value === 'string'
    ? value.split(',')
    : [];
  const out: string[] = [];
  for (const raw of rawList) {
    const trimmed = String(raw || '').trim();
    if (!trimmed) continue;
    const normalized = normalizeCategoryFocus(trimmed);
    if (!out.includes(normalized)) out.push(normalized);
  }
  return out;
}

export const BUSINESS_TYPE_OPTIONS = [
  'Online Shop',
  'Boutique',
  'Clothing Store',
  'Designer',
  'Factory Direct',
];

const LEGACY_BUSINESS_TYPE_MAP: Record<string, string> = {
  'Fashion House / D2C Brand': 'Online Shop',
  'Online Clothing Brand': 'Online Shop',
  'Boutique Atelier': 'Boutique',
  'Boutique Shop': 'Boutique',
  'Contemporary Apparel Label': 'Clothing Store',
  'Casual Fashion Store': 'Clothing Store',
  'Designer Studio': 'Designer',
  'Independent Designer': 'Designer',
  'Manufacturer Direct': 'Factory Direct',
  'Direct Maker / Factory': 'Factory Direct',
};

export function normalizeBusinessType(value?: string): string {
  const clean = String(value || '').trim();
  if (!clean) return '';
  if (LEGACY_BUSINESS_TYPE_MAP[clean]) return LEGACY_BUSINESS_TYPE_MAP[clean];
  return BUSINESS_TYPE_OPTIONS.includes(clean) ? clean : '';
}

export const CURRENCY_OPTIONS = ['BDT'] as const;

export const BRAND_COLOR_PRESETS = [
  { label: 'Midnight Ink', primaryColor: '#0F172A', accentColor: '#C2410C' },
  { label: 'Atelier Emerald', primaryColor: '#064E3B', accentColor: '#D97706' },
  { label: 'Crimson Silk', primaryColor: '#881337', accentColor: '#E11D48' },
  { label: 'Warm Espresso', primaryColor: '#431407', accentColor: '#B45309' },
  { label: 'Cobalt Studio', primaryColor: '#1E3A8A', accentColor: '#2563EB' },
] as const;

export const SAMPLE_LOGO_PRESETS = [
  {
    label: 'Editorial Monogram',
    url: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&auto=format&fit=crop&q=80',
  },
  {
    label: 'Minimalist Tag',
    url: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&auto=format&fit=crop&q=80',
  },
  {
    label: 'Studio Atelier',
    url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&auto=format&fit=crop&q=80',
  },
] as const;

export const SAMPLE_BANNER_PRESETS = [
  {
    label: 'Luxury Atelier Loft',
    url: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1400&auto=format&fit=crop&q=80',
  },
  {
    label: 'Tailored Collection',
    url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1400&auto=format&fit=crop&q=80',
  },
  {
    label: 'Minimal Runway Rack',
    url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1400&auto=format&fit=crop&q=80',
  },
] as const;

export function toBrandSlug(value: string): string {
  const cleaned = String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return cleaned || 'my-brand';
}

export function isHttpImageUrl(url: string | undefined): boolean {
  return Boolean(url && /^https?:\/\//i.test(url.trim()));
}

export interface OnboardingFormState {
  brandName: string;
  storefrontTitle: string;
  slogan: string;
  announcement: string;
  categoryFocus: string;
  categories: string[];
  shortDescription: string;
  brandStory: string;
  ownerName: string;
  legalName: string;
  businessType: string;
  bizEmail: string;
  phone: string;
  city: string;
  country: string;
  address: string;
  currency: string;
  instagram: string;
  website: string;
  primaryColor: string;
  accentColor: string;
  logoUrl: string;
  bannerUrl: string;
}

export function createInitialOnboardingForm(params: {
  tenantId: string;
  profile: BrandProfile;
  savedDraft?: Partial<BrandProfile>;
  isOnboarded?: boolean;
  sessionEmail?: string | null;
}): OnboardingFormState {
  const { tenantId, profile, savedDraft, isOnboarded = false, sessionEmail } = params;
  const liveMatchesTenant = profile.id === tenantId;
  const allowLiveProfileFallback = isOnboarded && liveMatchesTenant;

  const isCannedSampleContactBundle = (source?: Partial<BrandProfile>): boolean => {
    if (!source) return false;
    return (
      source.phone === '+1 (555) 238-4910' ||
      source.address === '240 Mercer Street, Studio 4B'
    );
  };

  const draftHasSampleContact = !isOnboarded && isCannedSampleContactBundle(savedDraft);
  const liveHasSampleContact = !isOnboarded && isCannedSampleContactBundle(profile);

  const pick = <K extends keyof BrandProfile>(
    key: K,
    fallback: NonNullable<BrandProfile[K]> | ''
  ): any => {
    if (savedDraft?.[key] !== undefined && savedDraft[key] !== '') {
      if (
        draftHasSampleContact &&
        (key === 'legalName' ||
          key === 'businessType' ||
          key === 'phone' ||
          key === 'city' ||
          key === 'country' ||
          key === 'address')
      ) {
        return fallback;
      }
      return savedDraft[key];
    }
    if (allowLiveProfileFallback && profile[key]) {
      if (
        liveHasSampleContact &&
        (key === 'legalName' ||
          key === 'businessType' ||
          key === 'phone' ||
          key === 'city' ||
          key === 'country' ||
          key === 'address')
      ) {
        return fallback;
      }
      return profile[key];
    }
    return fallback;
  };

  const initialCategories = (() => {
    const fromDraft = parseCategorySelection(savedDraft?.specialties || savedDraft?.categoryFocus);
    if (fromDraft.length > 0) return fromDraft;
    if (allowLiveProfileFallback) {
      const fromLive = parseCategorySelection(profile.specialties || profile.categoryFocus);
      if (fromLive.length > 0) return fromLive;
    }
    return [];
  })();

  const rawAnnouncement = pick('announcement', '');
  const cleanAnnouncement =
    !isOnboarded && (!savedDraft || draftHasSampleContact) && rawAnnouncement === 'Welcome to our brand new storefront!'
      ? ''
      : rawAnnouncement;

  const rawBrandStory = pick('brandStory', '') || (allowLiveProfileFallback ? profile.description || '' : '');
  const brandTitleForDefaultCheck = String(pick('name', '') || '').trim();
  const cleanBrandStory =
    !isOnboarded &&
    rawBrandStory &&
    (rawBrandStory === `Welcome to ${brandTitleForDefaultCheck}.` || rawBrandStory === 'Welcome to My Brand Studio.')
      ? ''
      : rawBrandStory;

  return {
    brandName: pick('name', ''),
    storefrontTitle:
      savedDraft?.seo?.title ||
      (allowLiveProfileFallback ? profile.seo?.title || '' : ''),
    slogan: pick('slogan', ''),
    announcement: cleanAnnouncement,
    categoryFocus: initialCategories.join(', '),
    categories: initialCategories,
    shortDescription: pick('shortDescription', ''),
    brandStory: cleanBrandStory,
    ownerName: pick('owner', ''),
    legalName: pick('legalName', ''),
    businessType: normalizeBusinessType(pick('businessType', '')),
    bizEmail:
      savedDraft?.email ||
      (allowLiveProfileFallback ? profile.email : '') ||
      sessionEmail ||
      '',
    phone: pick('phone', ''),
    city: pick('city', ''),
    country: pick('country', ''),
    address: pick('address', ''),
    currency: 'BDT',
    instagram:
      (draftHasSampleContact ? '' : savedDraft?.socialLinks?.instagram) ||
      (allowLiveProfileFallback && !liveHasSampleContact ? profile.socialLinks?.instagram || '' : ''),
    website:
      (draftHasSampleContact ? '' : savedDraft?.socialLinks?.website) ||
      (allowLiveProfileFallback && !liveHasSampleContact ? profile.socialLinks?.website || '' : ''),
    primaryColor:
      savedDraft?.primaryColor ||
      (allowLiveProfileFallback ? profile.primaryColor : '') ||
      BRAND_COLOR_PRESETS[0].primaryColor,
    accentColor:
      savedDraft?.accentColor ||
      (allowLiveProfileFallback ? profile.accentColor : undefined) ||
      BRAND_COLOR_PRESETS[0].accentColor,
    logoUrl: savedDraft?.logo || (allowLiveProfileFallback ? profile.logo || '' : ''),
    bannerUrl: savedDraft?.banner || (allowLiveProfileFallback ? profile.banner || '' : ''),
  };
}

export function buildSampleBrandFormValues(
  current: OnboardingFormState
): OnboardingFormState {
  const cleanName = current.brandName.trim() || 'Veloura Atelier';
  const sampleCategories =
    current.categories.length > 0
      ? current.categories
      : [CATEGORY_FOCUS_OPTIONS[0], CATEGORY_FOCUS_OPTIONS[2]];
  return {
    ...current,
    brandName: cleanName,
    storefrontTitle: current.storefrontTitle.trim() || `${cleanName} — Online Shop`,
    slogan: current.slogan.trim() || 'Comfortable clothes made to look great every day.',
    announcement:
      current.announcement.trim() ||
      `Welcome to ${cleanName} — Try on our clothes online before you buy.`,
    categoryFocus: sampleCategories.join(', '),
    categories: sampleCategories,
    shortDescription:
      current.shortDescription.trim() ||
      `${cleanName} sells clean, comfortable everyday clothes with instant Virtual Try-On.`,
    brandStory:
      current.brandStory.trim() ||
      `${cleanName} makes easy-to-wear clothes using soft, durable fabrics. Customers can preview how every item fits before placing an order.`,
  };
}

export function buildSampleStarterCatalog(tenantId: string, brandName: string): {
  products: Product[];
  fabric: Fabric;
} {
  const cleanName = brandName.trim() || 'Brand';
  const skuPrefix = toBrandSlug(cleanName).slice(0, 4).toUpperCase().replace(/-/g, '') || 'BRND';
  const stamp = Date.now().toString(36).toUpperCase().slice(-4);

  const blazerSku = `${skuPrefix}-BLZ-${stamp}`;
  const topSku = `${skuPrefix}-TOP-${stamp}`;

  const products: Product[] = [
    {
      id: `prod_sample_1_${Date.now()}`,
      tenantId,
      name: `${cleanName} Signature Structured Blazer`,
      slug: `${toBrandSlug(cleanName)}-signature-blazer-${stamp.toLowerCase()}`,
      sku: blazerSku,
      category: 'Outerwear',
      shortDescription: 'Architectural double-breasted wool-linen blazer calibrated for AI Virtual Try-On.',
      description: `A tailored outerwear staple from ${cleanName}, cut with a structured shoulder and breathable half-lined drape.`,
      collections: ['Starter Collection'],
      tags: ['starter', 'try-on-ready', 'outerwear'],
      price: 185,
      stock: 24,
      lowStockThreshold: 5,
      catalogStatus: 'ACTIVE',
      brandStorefrontPublished: true,
      marketplacePublished: false,
      isTryOnEligible: true,
      tryOnCategory: 'outerwear',
      includeInBrandTryOn: true,
      includeInMarketplaceTryOn: false,
      imageQualityStatus: 'VERIFIED',
      image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&auto=format&fit=crop&q=80',
      images: ['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&auto=format&fit=crop&q=80'],
      variants: [
        { id: `var_${blazerSku}_s`, sku: `${blazerSku}-S`, size: 'S', color: 'Obsidian', stockQuantity: 8, available: true },
        { id: `var_${blazerSku}_m`, sku: `${blazerSku}-M`, size: 'M', color: 'Obsidian', stockQuantity: 10, available: true },
        { id: `var_${blazerSku}_l`, sku: `${blazerSku}-L`, size: 'L', color: 'Obsidian', stockQuantity: 6, available: true },
      ],
    },
    {
      id: `prod_sample_2_${Date.now() + 1}`,
      tenantId,
      name: `${cleanName} Draped Silk-Blend Top`,
      slug: `${toBrandSlug(cleanName)}-draped-silk-top-${stamp.toLowerCase()}`,
      sku: topSku,
      category: 'Tops',
      shortDescription: 'Fluid everyday top with clean neckline geometry for crisp virtual try-on rendering.',
      description: `Lightweight crepe-drape blouse designed by ${cleanName} for effortless layering and studio try-on accuracy.`,
      collections: ['Starter Collection'],
      tags: ['starter', 'try-on-ready', 'tops'],
      price: 98,
      stock: 30,
      lowStockThreshold: 5,
      catalogStatus: 'ACTIVE',
      brandStorefrontPublished: true,
      marketplacePublished: false,
      isTryOnEligible: true,
      tryOnCategory: 'tops',
      includeInBrandTryOn: true,
      includeInMarketplaceTryOn: false,
      imageQualityStatus: 'VERIFIED',
      image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80',
      images: ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80'],
      variants: [
        { id: `var_${topSku}_s`, sku: `${topSku}-S`, size: 'S', color: 'Ivory', stockQuantity: 10, available: true },
        { id: `var_${topSku}_m`, sku: `${topSku}-M`, size: 'M', color: 'Ivory', stockQuantity: 12, available: true },
        { id: `var_${topSku}_l`, sku: `${topSku}-L`, size: 'L', color: 'Ivory', stockQuantity: 8, available: true },
      ],
    },
  ];

  const fabric: Fabric = {
    id: `fab_sample_${Date.now()}`,
    tenantId,
    name: `${cleanName} Mulberry Silk Crepe`,
    composition: '85% Mulberry Silk, 15% Elastane Blend',
    color: 'Champagne Ivory',
    weightGsm: 145,
    stretch: 'Slight',
    thickness: 'Lightweight',
    care: 'Cold gentle hand wash or eco dry clean.',
  };

  return { products, fabric };
}
