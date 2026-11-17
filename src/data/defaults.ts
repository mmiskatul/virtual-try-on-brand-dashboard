import type {
  NavMenuItem,
  StorefrontPageRecord,
  StorefrontSectionConfig,
  TryOnConfiguration,
} from '../types';

/**
 * Neutral starting configuration for a brand-new workspace.
 * Contains no brand-specific copy, domains or demo records.
 */

export const DEFAULT_TRYON_CONFIG: TryOnConfiguration = {
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
  privacyPolicyUrl: '',
  termsUrl: '',
  dataProcessingNotice:
    'Uploaded photographs are used only to create your temporary try-on preview and are deleted according to our retention policy.',
  domainAllowlist: [],
  appearance: {
    pageTitle: 'Virtual Fitting Studio',
    pageDescription: 'Preview how our garments look on you before you order.',
    uploadInstructions:
      'Upload a clear front-facing photo with even lighting and unobstructed shoulders.',
    primaryBtnText: 'Try It On',
    uploadBtnText: 'Upload Your Photo',
    generateBtnText: 'Generate My Look',
    retryBtnText: 'Try Another Outfit',
    loadingText: 'Creating your preview...',
    successText: 'Your preview is ready. Slide to compare with the original.',
    errorText: 'We could not finish your preview. Please try again with another photo.',
    accentColor: '#0F172A',
    backgroundColor: '#FFFFFF',
    gridStyle: '4-col',
    previewLayout: 'split',
    showPrices: true,
    showRatings: true,
  },
};

export const DEFAULT_STOREFRONT_SECTIONS: StorefrontSectionConfig[] = [
  { id: 'sec_hero', type: 'hero', title: 'Welcome', subtitle: '', enabled: true, ctaLabel: 'Shop now' },
  { id: 'sec_featured', type: 'featured_products', title: 'Featured', enabled: true },
  { id: 'sec_new', type: 'new_arrivals', title: 'New Arrivals', enabled: true },
  { id: 'sec_tryon', type: 'try_on_promo', title: 'Try it on before you buy', subtitle: '', enabled: true },
] as StorefrontSectionConfig[];

export const DEFAULT_STOREFRONT_PAGES: StorefrontPageRecord[] = [];

export const DEFAULT_NAV_MENUS: NavMenuItem[] = [
  { id: 'nav_1', label: 'New Arrivals', href: '#new-arrivals' },
  { id: 'nav_2', label: 'All Products', href: '#catalog' },
];
