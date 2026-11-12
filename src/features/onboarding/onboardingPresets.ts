import { BrandProfile, Fabric, Product } from '../../types';

export const ONBOARDING_STEPS = [
  '1. Brand & Title',
  '2. Business & Contact',
  '3. Identity & Media',
  '4. Starter Catalog & Try-On',
  '5. Review & Save',
] as const;

export const CATEGORY_FOCUS_OPTIONS = [
  'Womenswear & Couture',
  'Menswear & Tailoring',
  'Contemporary Apparel & Ready-to-Wear',
  'Streetwear & Essentials',
  'Modest & Heritage Wear',
  'Athleisure & Resort',
  'Bridal & Occasionwear',
];

export const BUSINESS_TYPE_OPTIONS = [
  'Fashion House / D2C Brand',
  'Boutique Atelier',
  'Contemporary Apparel Label',
  'Designer Studio',
  'Manufacturer Direct',
];

export const CURRENCY_OPTIONS = ['USD', 'EUR', 'GBP', 'BDT', 'AED'] as const;

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

  const pick = <K extends keyof BrandProfile>(
    key: K,
    fallback: NonNullable<BrandProfile[K]> | ''
  ): any => {
    if (savedDraft?.[key] !== undefined && savedDraft[key] !== '') {
      return savedDraft[key];
    }
    if (allowLiveProfileFallback && profile[key]) {
      return profile[key];
    }
    return fallback;
  };

  return {
    brandName: pick('name', ''),
    storefrontTitle:
      savedDraft?.seo?.title ||
      (allowLiveProfileFallback ? profile.seo?.title || '' : ''),
    slogan: pick('slogan', ''),
    announcement: pick('announcement', ''),
    categoryFocus: pick('categoryFocus', CATEGORY_FOCUS_OPTIONS[0]),
    shortDescription: pick('shortDescription', ''),
    brandStory: pick('brandStory', '') || (allowLiveProfileFallback ? profile.description || '' : ''),
    ownerName: pick('owner', ''),
    legalName: pick('legalName', ''),
    businessType: pick('businessType', BUSINESS_TYPE_OPTIONS[0]),
    bizEmail:
      savedDraft?.email ||
      (allowLiveProfileFallback ? profile.email : '') ||
      sessionEmail ||
      '',
    phone: pick('phone', ''),
    city: pick('city', ''),
    country: pick('country', ''),
    address: pick('address', ''),
    currency:
      savedDraft?.settings?.currency ||
      (allowLiveProfileFallback ? profile.settings?.currency : undefined) ||
      'USD',
    instagram:
      savedDraft?.socialLinks?.instagram ||
      (allowLiveProfileFallback ? profile.socialLinks?.instagram || '' : ''),
    website:
      savedDraft?.socialLinks?.website ||
      (allowLiveProfileFallback ? profile.socialLinks?.website || '' : ''),
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
  const slug = toBrandSlug(cleanName);
  return {
    brandName: cleanName,
    storefrontTitle: `${cleanName} — Modern Silhouettes & Virtual Try-On`,
    slogan: 'Elevated everyday tailoring crafted for real-time digital fit.',
    announcement: `Welcome to ${cleanName} — Instant Virtual Try-On is active across our signature pieces.`,
    categoryFocus: current.categoryFocus || CATEGORY_FOCUS_OPTIONS[2],
    shortDescription: `${cleanName} blends architectural cuts with breathable natural textiles, built for effortless fit preview before checkout.`,
    brandStory: `${cleanName} is an independent design house focused on enduring wardrobe pieces. Every garment is pattern-tested for drape, comfort, and true-to-size virtual try-on visualization.`,
    ownerName: current.ownerName.trim() || 'Brand Founder',
    legalName: `${cleanName} Apparel Ltd.`,
    businessType: current.businessType || BUSINESS_TYPE_OPTIONS[0],
    bizEmail: current.bizEmail.trim() || `hello@${slug}.com`,
    phone: current.phone.trim() || '+1 (555) 238-4910',
    city: current.city.trim() || 'New York',
    country: current.country.trim() || 'United States',
    address: current.address.trim() || '240 Mercer Street, Studio 4B',
    currency: current.currency || 'USD',
    instagram: current.instagram.trim() || `@${slug}`,
    website: current.website.trim() || `https://${slug}.vton.store`,
    primaryColor: current.primaryColor || BRAND_COLOR_PRESETS[0].primaryColor,
    accentColor: current.accentColor || BRAND_COLOR_PRESETS[0].accentColor,
    logoUrl: current.logoUrl || SAMPLE_LOGO_PRESETS[0].url,
    bannerUrl: current.bannerUrl || SAMPLE_BANNER_PRESETS[0].url,
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
