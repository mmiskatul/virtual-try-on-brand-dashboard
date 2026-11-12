'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  ArrowLeft,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  Globe,
  Image as ImageIcon,
  Layers,
  Loader2,
  Lock,
  Package,
  Palette,
  ShieldCheck,
  Sparkles,
  Store,
  Upload,
  Wand2,
} from 'lucide-react';
import { PageHeader, SectionCard, StatusBadge } from '../../components/shared/UiPrimitives';
import { brandWorkspaceApi } from '../../services/brandService';
import { useUiStore } from '../../stores/useUiStore';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { Fabric, Product } from '../../types';
import {
  BRAND_COLOR_PRESETS,
  BUSINESS_TYPE_OPTIONS,
  CATEGORY_FOCUS_OPTIONS,
  CURRENCY_OPTIONS,
  ONBOARDING_STEPS,
  OnboardingFormState,
  SAMPLE_BANNER_PRESETS,
  SAMPLE_LOGO_PRESETS,
  buildSampleBrandFormValues,
  buildSampleStarterCatalog,
  createInitialOnboardingForm,
  isHttpImageUrl,
  toBrandSlug,
} from './onboardingPresets';

const SAMPLE_GARMENT_IMAGE =
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80';

export interface GettingStartedWizardProps {
  embeddedInModal?: boolean;
  verifiedTenantId?: string;
  verifiedName?: string | null;
  verifiedEmail?: string | null;
  onCompleted?: () => void;
}

export function GettingStartedWizard({
  embeddedInModal = false,
  verifiedTenantId,
  verifiedName,
  verifiedEmail,
  onCompleted,
}: GettingStartedWizardProps = {}) {
  const { data: session } = useSession();

  const profile = useWorkspaceStore((s) => s.profile);
  const products = useWorkspaceStore((s) => s.products);
  const fabrics = useWorkspaceStore((s) => s.fabrics);
  const addProduct = useWorkspaceStore((s) => s.addProduct);
  const addFabricRecord = useWorkspaceStore((s) => s.addFabricRecord);
  const tryOnConfig = useWorkspaceStore((s) => s.tryOnConfig);
  const updateTryOnConfig = useWorkspaceStore((s) => s.updateTryOnConfig);
  const onboardingStepByTenant = useWorkspaceStore((s) => s.onboardingStepByTenant);
  const onboardingCompletedStepsByTenant = useWorkspaceStore(
    (s) => s.onboardingCompletedStepsByTenant
  );
  const setStep = useWorkspaceStore((s) => s.setOnboardingStep);
  const markOnboardingStepCompleted = useWorkspaceStore((s) => s.markOnboardingStepCompleted);
  const completedIds = useWorkspaceStore((s) => s.onboardingCompletedIds);
  const toggleChecklist = useWorkspaceStore((s) => s.toggleOnboardingChecklist);
  const onboardedTenantIds = useWorkspaceStore((s) => s.onboardedTenantIds);
  const onboardingProfileDrafts = useWorkspaceStore((s) => s.onboardingProfileDrafts);
  const saveOnboardingProfileForTenant = useWorkspaceStore((s) => s.saveOnboardingProfileForTenant);
  const markOnboardingCompleted = useWorkspaceStore((s) => s.markOnboardingCompleted);
  const setBackendOnboardingStatus = useWorkspaceStore((s) => s.setBackendOnboardingStatus);
  const updateProfile = useWorkspaceStore((s) => s.updateProfile);
  const isLiveBackend = useWorkspaceStore((s) => s.isLiveBackend);

  const showToast = useUiStore((s) => s.showToast);
  const hideToast = useUiStore((s) => s.hideToast);

  const activeTenantId = String(
    session?.user?.tenantId || verifiedTenantId || profile.id || 'tenant_aura'
  ).trim();
  const resolvedSessionEmail = session?.user?.email ?? verifiedEmail;
  const isAlreadyOnboarded = Boolean(activeTenantId && onboardedTenantIds.includes(activeTenantId));

  const savedTenantDraft = onboardingProfileDrafts[activeTenantId];
  const completedStepsForTenant = onboardingCompletedStepsByTenant[activeTenantId] || [];
  const step1Done =
    isAlreadyOnboarded ||
    (completedStepsForTenant.includes(1) &&
      Boolean(savedTenantDraft?.name?.trim() && savedTenantDraft?.seo?.title?.trim()));
  const step2Done =
    isAlreadyOnboarded ||
    (step1Done &&
      completedStepsForTenant.includes(2) &&
      Boolean(savedTenantDraft?.email?.trim()));
  const step3Done = isAlreadyOnboarded || (step2Done && completedStepsForTenant.includes(3));
  const step4Done = isAlreadyOnboarded || (step3Done && completedStepsForTenant.includes(4));
  const maxUnlockedStep = step4Done ? 5 : step3Done ? 4 : step2Done ? 3 : step1Done ? 2 : 1;

  const rawTenantStep = onboardingStepByTenant[activeTenantId] || 1;
  const step = Math.min(Math.max(rawTenantStep, 1), maxUnlockedStep);

  const [storeHydrated, setStoreHydrated] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStage, setSaveStage] = useState<'idle' | 'saving' | 'verifying' | 'redirecting' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [sampleLoading, setSampleLoading] = useState(false);
  const [uploadingField, setUploadingField] = useState<'logo' | 'banner' | 'product' | null>(null);

  const [form, setForm] = useState<OnboardingFormState>(() =>
    createInitialOnboardingForm({
      tenantId: activeTenantId,
      profile,
      savedDraft: savedTenantDraft,
      isOnboarded: isAlreadyOnboarded,
      sessionEmail: resolvedSessionEmail,
    })
  );

  // Step 4 custom starter product fields
  const [prodName, setProdName] = useState('');
  const [prodSku, setProdSku] = useState('');
  const [prodCategory, setProdCategory] = useState('Tops');
  const [prodTryOnCat, setProdTryOnCat] = useState<'tops' | 'bottoms' | 'dresses' | 'outerwear'>('tops');
  const [prodPrice, setProdPrice] = useState('125');
  const [prodStock, setProdStock] = useState('25');
  const [prodImageUrl, setProdImageUrl] = useState('');
  const [prodDescription, setProdDescription] = useState('');
  const [publishStorefront, setPublishStorefront] = useState(true);
  const [enableTryOnItem, setEnableTryOnItem] = useState(true);

  const initializedTenantRef = useRef<string | null>(null);
  const liveSyncedTenantRef = useRef<string | null>(null);

  useEffect(() => {
    setStoreHydrated(useWorkspaceStore.persist.hasHydrated());
    const unsub = useWorkspaceStore.persist.onFinishHydration(() => {
      setStoreHydrated(true);
    });
    return () => {
      unsub();
    };
  }, []);

  // Re-sync local form state cleanly once Zustand localStorage rehydrates and/or live profile resolves
  useEffect(() => {
    if (!storeHydrated) return;
    const savedDraft = onboardingProfileDrafts[activeTenantId];
    const tenantChanged = initializedTenantRef.current !== activeTenantId;
    const liveArrived =
      profile.id === activeTenantId && liveSyncedTenantRef.current !== activeTenantId;

    if (!tenantChanged && !(liveArrived && !isDirty)) return;

    initializedTenantRef.current = activeTenantId;
    if (profile.id === activeTenantId) {
      liveSyncedTenantRef.current = activeTenantId;
    }

    setForm(
      createInitialOnboardingForm({
        tenantId: activeTenantId,
        profile,
        savedDraft,
        isOnboarded: isAlreadyOnboarded,
        sessionEmail: resolvedSessionEmail,
      })
    );
  }, [
    storeHydrated,
    activeTenantId,
    profile,
    onboardingProfileDrafts,
    isAlreadyOnboarded,
    resolvedSessionEmail,
    isDirty,
  ]);

  const notify = (msg: string) => {
    showToast(msg);
    setTimeout(hideToast, 3200);
  };

  const markChecklist = (id: string) => {
    if (!completedIds.includes(id)) {
      toggleChecklist(id);
    }
  };

  const updateField = <K extends keyof OnboardingFormState>(key: K, value: OnboardingFormState[K]) => {
    setIsDirty(true);
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const computedSlug = useMemo(
    () => (profile.id === activeTenantId && profile.slug ? profile.slug : toBrandSlug(form.brandName)),
    [profile.id, profile.slug, activeTenantId, form.brandName]
  );

  // Count how many starter setup sections are filled cleanly
  const readiness = useMemo(() => {
    const hasBrandTitle = Boolean(form.brandName.trim() && form.storefrontTitle.trim());
    const hasBusinessContact = Boolean(form.bizEmail.trim() && (form.legalName.trim() || form.ownerName.trim()));
    const hasIdentityMedia = Boolean(form.primaryColor && (form.logoUrl || form.bannerUrl));
    const hasStarterCatalog = products.length > 0;
    const hasTryOn = Boolean(tryOnConfig.enabled);
    const totalDone = [hasBrandTitle, hasBusinessContact, hasIdentityMedia, hasStarterCatalog, hasTryOn].filter(Boolean).length;
    return {
      hasBrandTitle,
      hasBusinessContact,
      hasIdentityMedia,
      hasStarterCatalog,
      hasTryOn,
      totalDone,
      pct: Math.round((totalDone / 5) * 100),
    };
  }, [form, products.length, tryOnConfig.enabled]);

  const persistBrandForm = async (
    formToSave: OnboardingFormState,
    syncBackend: boolean,
    options?: { markCompleted?: boolean }
  ): Promise<{ backendSaved: boolean; error?: string }> => {
    const cleanName = formToSave.brandName.trim() || 'My Brand Studio';
    const cleanTitle =
      formToSave.storefrontTitle.trim() || `${cleanName} — Official Storefront & Virtual Try-On`;
    const cleanSlug = profile.id === activeTenantId && profile.slug ? profile.slug : toBrandSlug(cleanName);
    const cleanDesc = formToSave.brandStory.trim() || formToSave.shortDescription.trim();

    saveOnboardingProfileForTenant(activeTenantId, {
      id: activeTenantId,
      name: cleanName,
      slug: cleanSlug,
      owner: formToSave.ownerName.trim() || session?.user?.name || profile.owner,
      email: formToSave.bizEmail.trim() || session?.user?.email || profile.email,
      legalName: formToSave.legalName.trim(),
      businessType: formToSave.businessType,
      phone: formToSave.phone.trim(),
      city: formToSave.city.trim(),
      country: formToSave.country.trim(),
      address: formToSave.address.trim(),
      categoryFocus: formToSave.categoryFocus,
      slogan: formToSave.slogan.trim(),
      announcement: formToSave.announcement.trim(),
      shortDescription: formToSave.shortDescription.trim(),
      description: cleanDesc,
      brandStory: formToSave.brandStory.trim() || cleanDesc,
      primaryColor: formToSave.primaryColor,
      accentColor: formToSave.accentColor,
      ...(formToSave.logoUrl.trim() ? { logo: formToSave.logoUrl.trim() } : {}),
      ...(formToSave.bannerUrl.trim() ? { banner: formToSave.bannerUrl.trim() } : {}),
      socialLinks: {
        ...(profile.socialLinks || {}),
        instagram: formToSave.instagram.trim(),
        website: formToSave.website.trim(),
      },
      seo: {
        ...(profile.seo || {
          title: cleanTitle,
          description: formToSave.shortDescription.trim() || cleanDesc,
          canonicalUrl: `https://vton.store/brands/${cleanSlug}`,
          ogImage: isHttpImageUrl(formToSave.bannerUrl) ? formToSave.bannerUrl : '',
          allowIndexing: true,
        }),
        title: cleanTitle,
        description: formToSave.shortDescription.trim() || cleanDesc,
      },
      settings: {
        ...(profile.settings || {
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
        currency: formToSave.currency || 'USD',
      },
    });

    updateTryOnConfig({
      appearance: {
        ...tryOnConfig.appearance,
        pageTitle: `${cleanName} Virtual Try-On Studio`,
        pageDescription:
          formToSave.slogan.trim() ||
          `Preview ${cleanName} silhouettes in real time before ordering.`,
        accentColor: formToSave.primaryColor || tryOnConfig.appearance.accentColor,
      },
    });

    if (!syncBackend) return { backendSaved: false };

    const safeLogo = isHttpImageUrl(formToSave.logoUrl) ? formToSave.logoUrl.trim() : undefined;
    const safeBanner = isHttpImageUrl(formToSave.bannerUrl) ? formToSave.bannerUrl.trim() : undefined;

    const storefrontSettingsPayload: Record<string, any> = {
      primaryColor: formToSave.primaryColor,
      accentColor: formToSave.accentColor,
      announcement: formToSave.announcement.trim(),
      aboutText: formToSave.brandStory.trim() || formToSave.shortDescription.trim(),
      storefrontTitle: cleanTitle,
      slogan: formToSave.slogan.trim(),
      shortDescription: formToSave.shortDescription.trim(),
      categoryFocus: formToSave.categoryFocus,
      ownerName: formToSave.ownerName.trim() || session?.user?.name || '',
      legalName: formToSave.legalName.trim(),
      businessType: formToSave.businessType,
      phone: formToSave.phone.trim(),
      city: formToSave.city.trim(),
      country: formToSave.country.trim(),
      address: formToSave.address.trim(),
      currency: formToSave.currency || 'USD',
      socialLinks: {
        instagram: formToSave.instagram.trim(),
        website: formToSave.website.trim(),
      },
      ...(safeBanner ? { bannerImage: safeBanner } : {}),
      ...(options?.markCompleted
        ? { onboardingCompleted: true, onboardingCompletedAt: Date.now() }
        : {}),
    };

    try {
      await brandWorkspaceApi.updateProfile({
        name: cleanName,
        description: cleanDesc || cleanTitle,
        contactEmail: formToSave.bizEmail.trim() || undefined,
        ...(safeLogo ? { logoUrl: safeLogo } : {}),
        ...(safeBanner ? { bannerUrl: safeBanner } : {}),
        storefrontSettings: storefrontSettingsPayload,
      });
      return { backendSaved: true };
    } catch (err) {
      return {
        backendSaved: false,
        error: err instanceof Error ? err.message : 'Unable to save setup to backend.',
      };
    }
  };

  const handleApplySampleBrand = () => {
    const sampled = buildSampleBrandFormValues(form);
    setForm(sampled);
    setIsDirty(true);
    saveOnboardingProfileForTenant(activeTenantId, {
      name: sampled.brandName,
      owner: sampled.ownerName,
      email: sampled.bizEmail,
      legalName: sampled.legalName,
      businessType: sampled.businessType,
      slogan: sampled.slogan,
      announcement: sampled.announcement,
      categoryFocus: sampled.categoryFocus,
      shortDescription: sampled.shortDescription,
      description: sampled.brandStory,
      brandStory: sampled.brandStory,
      phone: sampled.phone,
      city: sampled.city,
      country: sampled.country,
      address: sampled.address,
      primaryColor: sampled.primaryColor,
      accentColor: sampled.accentColor,
      logo: sampled.logoUrl,
      banner: sampled.bannerUrl,
      seo: {
        ...(profile.seo || {
          title: sampled.storefrontTitle,
          description: sampled.shortDescription,
          canonicalUrl: '',
          ogImage: sampled.bannerUrl,
          allowIndexing: true,
        }),
        title: sampled.storefrontTitle,
        description: sampled.shortDescription,
      },
      socialLinks: {
        ...(profile.socialLinks || {}),
        instagram: sampled.instagram,
        website: sampled.website,
      },
    });
    notify('Sample brand name, title, story, contact, and media loaded. Review or customize any field.');
  };

  const handleSaveStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.brandName.trim()) {
      notify('Please enter your Brand Name before continuing.');
      return;
    }
    if (!form.storefrontTitle.trim()) {
      notify('Please enter a Storefront Title before continuing.');
      return;
    }
    setSaving(true);
    const { backendSaved } = await persistBrandForm(form, true);
    markChecklist('chk_profile');
    markOnboardingStepCompleted(activeTenantId, 1);
    setSaving(false);
    setStep(2, activeTenantId);
    notify(
      backendSaved
        ? 'Brand name, storefront title, and story saved to workspace & backend.'
        : 'Brand details saved to your onboarding workspace.'
    );
  };

  const handleSaveStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.bizEmail.trim() || !form.bizEmail.includes('@')) {
      notify('Please enter a valid business contact email.');
      return;
    }
    setSaving(true);
    const { backendSaved } = await persistBrandForm(form, true);
    markChecklist('chk_business');
    markOnboardingStepCompleted(activeTenantId, 2);
    setSaving(false);
    setStep(3, activeTenantId);
    notify(
      backendSaved
        ? 'Business and contact details saved to backend.'
        : 'Business and contact details saved to onboarding workspace.'
    );
  };

  const handleSaveStep3 = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { backendSaved } = await persistBrandForm(form, true);
    markChecklist('chk_identity');
    markOnboardingStepCompleted(activeTenantId, 3);
    setSaving(false);
    setStep(4, activeTenantId);
    notify(
      backendSaved
        ? 'Brand colors, logo, and banner synced to storefront.'
        : 'Brand identity saved locally for storefront preview.'
    );
  };

  const handleUploadAsset = async (
    field: 'logo' | 'banner' | 'product',
    file: File | undefined
  ) => {
    if (!file) return;
    setUploadingField(field);
    const res = await brandWorkspaceApi.uploadMediaFile(file);
    setUploadingField(null);
    if (!res.ok || !res.url) {
      notify(res.error || 'Could not process image upload.');
      return;
    }
    if (field === 'logo') {
      updateField('logoUrl', res.url);
    } else if (field === 'banner') {
      updateField('bannerUrl', res.url);
    } else {
      setProdImageUrl(res.url);
    }
    notify(
      res.provider === 'local_preview'
        ? 'Image attached in local preview mode.'
        : 'Image uploaded successfully.'
    );
  };

  const createSingleProduct = async (productDraft: {
    name: string;
    sku: string;
    category: string;
    tryOnCategory: 'tops' | 'bottoms' | 'dresses' | 'outerwear';
    price: number;
    stock: number;
    description: string;
    image: string;
    brandStorefrontPublished: boolean;
    isTryOnEligible: boolean;
  }): Promise<Product> => {
    const safeImage = isHttpImageUrl(productDraft.image) ? productDraft.image : SAMPLE_GARMENT_IMAGE;
    const variants = [
      {
        id: `var_${productDraft.sku}_s`,
        sku: `${productDraft.sku}-S`,
        size: 'S',
        color: 'Default',
        stockQuantity: Math.max(1, Math.floor(productDraft.stock / 3)),
        available: true,
      },
      {
        id: `var_${productDraft.sku}_m`,
        sku: `${productDraft.sku}-M`,
        size: 'M',
        color: 'Default',
        stockQuantity: Math.max(1, Math.ceil(productDraft.stock / 2)),
        available: true,
      },
      {
        id: `var_${productDraft.sku}_l`,
        sku: `${productDraft.sku}-L`,
        size: 'L',
        color: 'Default',
        stockQuantity: Math.max(1, productDraft.stock - Math.floor(productDraft.stock / 3) - Math.ceil(productDraft.stock / 2)),
        available: true,
      },
    ];

    try {
      const created = await brandWorkspaceApi.createProduct({
        name: productDraft.name,
        sku: productDraft.sku,
        category: productDraft.category,
        price: productDraft.price,
        description: productDraft.description,
        images: [safeImage],
        brandStorefrontPublished: productDraft.brandStorefrontPublished,
        marketplacePublished: false,
        isTryOnEligible: productDraft.isTryOnEligible,
        tryOnCategory: productDraft.tryOnCategory,
        variants,
      });
      return created;
    } catch {
      return {
        id: `prod_onboard_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        tenantId: activeTenantId,
        name: productDraft.name,
        slug: toBrandSlug(productDraft.name),
        sku: productDraft.sku,
        category: productDraft.category,
        shortDescription: productDraft.description.slice(0, 120),
        description: productDraft.description,
        price: productDraft.price,
        stock: productDraft.stock,
        lowStockThreshold: 5,
        catalogStatus: productDraft.brandStorefrontPublished ? 'ACTIVE' : 'DRAFT',
        brandStorefrontPublished: productDraft.brandStorefrontPublished,
        marketplacePublished: false,
        isTryOnEligible: productDraft.isTryOnEligible,
        tryOnCategory: productDraft.tryOnCategory,
        includeInBrandTryOn: productDraft.isTryOnEligible,
        includeInMarketplaceTryOn: false,
        imageQualityStatus: 'VERIFIED',
        image: productDraft.image || safeImage,
        images: [productDraft.image || safeImage],
        variants,
      };
    }
  };

  const handleAddCustomProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) {
      notify('Enter a garment product name first.');
      return;
    }
    setSaving(true);
    const cleanSku =
      prodSku.trim() ||
      `${toBrandSlug(form.brandName).slice(0, 3).toUpperCase() || 'SKU'}-${Date.now()
        .toString()
        .slice(-4)}`;
    const priceNum = Math.max(0, Number(prodPrice) || 95);
    const stockNum = Math.max(1, Number(prodStock) || 20);

    const created = await createSingleProduct({
      name: prodName.trim(),
      sku: cleanSku,
      category: prodCategory,
      tryOnCategory: prodTryOnCat,
      price: priceNum,
      stock: stockNum,
      description:
        prodDescription.trim() ||
        `Starter catalog garment created during ${form.brandName || 'Brand'} onboarding.`,
      image: prodImageUrl.trim() || SAMPLE_GARMENT_IMAGE,
      brandStorefrontPublished: publishStorefront,
      isTryOnEligible: enableTryOnItem,
    });

    addProduct(created);
    markChecklist('chk_product');
    setProdName('');
    setProdSku('');
    setProdDescription('');
    setSaving(false);
    notify(`Added "${created.name}" (${created.sku}) to your catalog.`);
  };

  const handleAddSampleStarterKit = async () => {
    setSampleLoading(true);
    const { products: sampleProducts, fabric: sampleFabric } = buildSampleStarterCatalog(
      activeTenantId,
      form.brandName
    );

    const existingNames = new Set(products.map((p) => p.name.toLowerCase()));
    let addedProductsCount = 0;

    for (const item of sampleProducts) {
      if (existingNames.has(item.name.toLowerCase())) continue;
      const created = await createSingleProduct({
        name: item.name,
        sku: item.sku,
        category: item.category,
        tryOnCategory: (item.tryOnCategory as 'tops' | 'bottoms' | 'dresses' | 'outerwear') || 'tops',
        price: item.price,
        stock: item.stock,
        description: item.description || '',
        image: item.image,
        brandStorefrontPublished: true,
        isTryOnEligible: true,
      });
      addProduct(created);
      addedProductsCount += 1;
    }

    let createdFabric: Fabric = sampleFabric;
    try {
      const fabRes = await brandWorkspaceApi.createFabric({
        name: sampleFabric.name,
        composition: sampleFabric.composition,
        color: sampleFabric.color,
        weightGsm: sampleFabric.weightGsm,
        stretch: sampleFabric.stretch,
        thickness: sampleFabric.thickness,
        care: sampleFabric.care,
      });
      if (fabRes?.fabric) createdFabric = fabRes.fabric;
    } catch {
      // Keep local starter fabric when offline
    }
    addFabricRecord(createdFabric);
    markChecklist('chk_product');
    setSampleLoading(false);

    notify(
      addedProductsCount > 0
        ? `Sample Starter Kit loaded: ${addedProductsCount} Try-On garments + 1 fabric specification added.`
        : 'Sample Starter fabric synced (sample garments were already present in catalog).'
    );
  };

  const handleSaveCatalogAndContinue = () => {
    if (products.length > 0) markChecklist('chk_product');
    if (tryOnConfig.enabled) markChecklist('chk_tryon');
    markOnboardingStepCompleted(activeTenantId, 4);
    setStep(5, activeTenantId);
  };

  const handleCompleteOnboarding = async () => {
    if (!form.brandName.trim() || !form.storefrontTitle.trim()) {
      setStep(1, activeTenantId);
      notify('Please complete your Brand Name and Storefront Title before saving setup.');
      return;
    }
    if (!form.bizEmail.trim() || !form.bizEmail.includes('@')) {
      setStep(2, activeTenantId);
      notify('Please enter a valid business contact email before saving setup.');
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaveStage('saving');

    const saveRes = await persistBrandForm(form, true, { markCompleted: true });
    if (!saveRes.backendSaved) {
      const msg = saveRes.error || 'Could not save your onboarding setup to the backend.';
      setSaveError(msg);
      setSaveStage('error');
      setSaving(false);
      notify(msg);
      return;
    }

    setSaveStage('verifying');
    try {
      const verifiedProfile = await brandWorkspaceApi.getProfile();
      if (!verifiedProfile?.onboardingCompleted) {
        const msg = 'Backend reload check did not confirm onboarding completion. Please retry Save.';
        setSaveError(msg);
        setSaveStage('error');
        setSaving(false);
        notify(msg);
        return;
      }

      updateProfile({
        ...verifiedProfile,
        owner: verifiedProfile.owner || form.ownerName.trim() || session?.user?.name || '',
      });
      setBackendOnboardingStatus(verifiedProfile.id || activeTenantId, true);
      markOnboardingCompleted(verifiedProfile.id || activeTenantId);

      setSaveStage('redirecting');
      notify('Brand setup saved and verified from backend. Redirecting to Brand Dashboard...');
      onCompleted?.();

      if (typeof window !== 'undefined') {
        window.location.assign('/dashboard');
      }
    } catch (err) {
      const msg =
        err instanceof Error
          ? `Backend reload check failed: ${err.message}`
          : 'Backend reload verification failed. Please retry Save.';
      setSaveError(msg);
      setSaveStage('error');
      setSaving(false);
      notify(msg);
    }
  };

  const handleStepSwitch = (targetStep: number) => {
    if (targetStep > maxUnlockedStep) {
      notify(
        step === 1
          ? 'Please enter and save your Brand Name & Storefront Title first.'
          : 'Complete the current step first before continuing.'
      );
      return;
    }
    if (step1Done) {
      void persistBrandForm(form, false);
    }
    setStep(targetStep, activeTenantId);
  };

  return (
    <div className={embeddedInModal ? 'space-y-5' : 'space-y-6 pb-8'}>
      {embeddedInModal ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="space-y-0.5 min-w-0">
            <p className="text-xs sm:text-sm font-extrabold text-slate-950">
              Complete Your Brand Profile &amp; Storefront Setup
            </p>
            <p className="text-[11px] sm:text-xs text-slate-600">
              Add your brand name, storefront title, contact details, visuals, and sample products to unlock dashboard access.
            </p>
          </div>
          <button
            type="button"
            onClick={handleApplySampleBrand}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold shrink-0 transition-colors"
          >
            <Wand2 className="w-3.5 h-3.5 text-slate-700" />
            Fill Sample Brand Details
          </button>
        </div>
      ) : (
        <PageHeader
          eyebrow="Owner Configuration & Onboarding"
          title={
            isAlreadyOnboarded
              ? `Brand Setup & Starter Wizard — ${form.brandName || profile.name}`
              : 'Complete Your Brand Profile & Storefront Setup'
          }
          subtitle="Configure your brand name, storefront title, contact details, visual identity, and sample catalog items before entering the full workspace."
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={isAlreadyOnboarded ? 'ACTIVE' : 'PENDING'} />
              <button
                type="button"
                onClick={handleApplySampleBrand}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 text-xs font-bold transition-colors"
              >
                <Wand2 className="w-3.5 h-3.5 text-slate-700" />
                Fill Sample Brand Details
              </button>
              {isAlreadyOnboarded && (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
                >
                  Open Dashboard
                </Link>
              )}
            </div>
          }
        />
      )}

      {/* Setup Readiness Progress Strip */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck className="w-4 h-4 text-slate-900 shrink-0" />
            <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
              Workspace Setup Readiness: {readiness.totalDone} of 5 areas configured ({readiness.pct}%)
            </p>
          </div>
          <span className="text-[11px] font-semibold text-slate-500">
            {isLiveBackend ? 'Syncing with Live Backend' : 'Local Workspace Draft Mode'}
          </span>
        </div>
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-slate-950 transition-all duration-300"
            style={{ width: `${Math.max(12, readiness.pct)}%` }}
          />
        </div>
      </div>

      {/* Stepper Navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {ONBOARDING_STEPS.map((label, idx) => {
          const stepNum = idx + 1;
          const active = step === stepNum;
          const locked = stepNum > maxUnlockedStep;
          const done =
            (stepNum === 1 && step1Done) ||
            (stepNum === 2 && step2Done) ||
            (stepNum === 3 && step3Done) ||
            (stepNum === 4 && step4Done) ||
            (stepNum === 5 && isAlreadyOnboarded);
          return (
            <button
              key={label}
              type="button"
              disabled={locked}
              onClick={() => handleStepSwitch(stepNum)}
              className={`px-3 py-2.5 rounded-xl text-left text-xs font-bold border transition-all flex items-center justify-between gap-1.5 ${
                active
                  ? 'bg-slate-950 text-white border-slate-950 shadow-sm'
                  : locked
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-70'
                  : done
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100/70'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span className="truncate">{label}</span>
              {done && !active && <Check className="w-3.5 h-3.5 shrink-0 text-emerald-700" />}
              {locked && !active && <Lock className="w-3 h-3 shrink-0 text-slate-400" />}
            </button>
          );
        })}
      </div>

      {/* STEP 1: BRAND PROFILE & TITLE */}
      {step === 1 && (
        <SectionCard
          title="1. Brand Name, Storefront Title & Positioning"
          subtitle="Set how your brand appears across your dashboard header, customer boutique page, and marketplace listings."
          right={
            <button
              type="button"
              onClick={handleApplySampleBrand}
              className="text-xs font-bold text-slate-700 hover:text-slate-950 underline underline-offset-4"
            >
              Populate Sample Fields
            </button>
          }
        >
          <form onSubmit={handleSaveStep1} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <label className="block space-y-1">
                <span className="font-bold text-slate-700">Brand Name *</span>
                <input
                  type="text"
                  required
                  value={form.brandName}
                  onChange={(e) => updateField('brandName', e.target.value)}
                  placeholder="e.g. Veloura Atelier"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-950"
                />
              </label>

              <label className="block space-y-1">
                <span className="font-bold text-slate-700">Storefront Title / Headline *</span>
                <input
                  type="text"
                  required
                  value={form.storefrontTitle}
                  onChange={(e) => updateField('storefrontTitle', e.target.value)}
                  placeholder="e.g. Veloura Atelier — Modern Ready-to-Wear & Try-On"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-950"
                />
              </label>

              <label className="block space-y-1">
                <span className="font-bold text-slate-700">Brand Slogan / Subtitle</span>
                <input
                  type="text"
                  value={form.slogan}
                  onChange={(e) => updateField('slogan', e.target.value)}
                  placeholder="e.g. Tailored silhouettes woven for real-time digital fit."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-950"
                />
              </label>

              <label className="block space-y-1">
                <span className="font-bold text-slate-700">Primary Category Focus</span>
                <select
                  value={form.categoryFocus}
                  onChange={(e) => updateField('categoryFocus', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-slate-950"
                >
                  {CATEGORY_FOCUS_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1 md:col-span-2">
                <span className="font-bold text-slate-700">Top Announcement Strip</span>
                <input
                  type="text"
                  value={form.announcement}
                  onChange={(e) => updateField('announcement', e.target.value)}
                  placeholder="e.g. Autumn Drop Live — Preview fit in AI Virtual Try-On before ordering."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-950"
                />
              </label>

              <label className="block space-y-1 md:col-span-2">
                <span className="font-bold text-slate-700">Short Storefront Pitch</span>
                <input
                  type="text"
                  value={form.shortDescription}
                  onChange={(e) => updateField('shortDescription', e.target.value)}
                  placeholder="One-line overview displayed on brand cards and search previews."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-950"
                />
              </label>

              <label className="block space-y-1 md:col-span-2">
                <span className="font-bold text-slate-700">Brand Story & Editorial Bio</span>
                <textarea
                  rows={3}
                  value={form.brandStory}
                  onChange={(e) => updateField('brandStory', e.target.value)}
                  placeholder="Share your brand ethos, craft heritage, and fabric standards..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-950 resize-y"
                />
              </label>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <Globe className="w-4 h-4 text-slate-500 shrink-0" />
                <span>
                  Storefront URL: <strong className="font-mono text-slate-950">/brands/{computedSlug}</strong>
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">/try/{computedSlug}</span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleApplySampleBrand}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-800"
              >
                Auto-Fill Sample Details
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 disabled:opacity-60 text-white text-xs font-bold transition-colors"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Next: Business &amp; Contact
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </SectionCard>
      )}

      {/* STEP 2: BUSINESS & CONTACT INFO */}
      {step === 2 && (
        <SectionCard
          title="2. Owner, Legal Business & Contact Information"
          subtitle="Provide business contact, location, and billing currency metadata for merchant operations and receipts."
        >
          <form onSubmit={handleSaveStep2} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <label className="block space-y-1">
                <span className="font-bold text-slate-700">Owner / Primary Contact Name</span>
                <input
                  type="text"
                  value={form.ownerName}
                  onChange={(e) => updateField('ownerName', e.target.value)}
                  placeholder="Your full name"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-950"
                />
              </label>

              <label className="block space-y-1">
                <span className="font-bold text-slate-700">Registered / Legal Business Name</span>
                <input
                  type="text"
                  value={form.legalName}
                  onChange={(e) => updateField('legalName', e.target.value)}
                  placeholder="e.g. Veloura Atelier Ltd."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-950"
                />
              </label>

              <label className="block space-y-1">
                <span className="font-bold text-slate-700">Business Type</span>
                <select
                  value={form.businessType}
                  onChange={(e) => updateField('businessType', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-slate-950"
                >
                  {BUSINESS_TYPE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1">
                <span className="font-bold text-slate-700">Business Contact Email *</span>
                <input
                  type="email"
                  required
                  value={form.bizEmail}
                  onChange={(e) => updateField('bizEmail', e.target.value)}
                  placeholder="hello@yourbrand.com"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-950"
                />
              </label>

              <label className="block space-y-1">
                <span className="font-bold text-slate-700">Phone Number</span>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-950"
                />
              </label>

              <label className="block space-y-1">
                <span className="font-bold text-slate-700">Store Currency</span>
                <select
                  value={form.currency}
                  onChange={(e) => updateField('currency', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-slate-950"
                >
                  {CURRENCY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1">
                <span className="font-bold text-slate-700">City</span>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  placeholder="e.g. Dhaka / London / New York"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-950"
                />
              </label>

              <label className="block space-y-1">
                <span className="font-bold text-slate-700">Country</span>
                <input
                  type="text"
                  value={form.country}
                  onChange={(e) => updateField('country', e.target.value)}
                  placeholder="e.g. Bangladesh / United States"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-950"
                />
              </label>

              <label className="block space-y-1 md:col-span-2">
                <span className="font-bold text-slate-700">Studio / Flagship Address</span>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  placeholder="Street address, studio suite, postal code"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-950"
                />
              </label>

              <label className="block space-y-1">
                <span className="font-bold text-slate-700">Instagram Handle</span>
                <input
                  type="text"
                  value={form.instagram}
                  onChange={(e) => updateField('instagram', e.target.value)}
                  placeholder="@yourbrand"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-950"
                />
              </label>

              <label className="block space-y-1">
                <span className="font-bold text-slate-700">Website URL</span>
                <input
                  type="text"
                  value={form.website}
                  onChange={(e) => updateField('website', e.target.value)}
                  placeholder="https://yourbrand.com"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-950"
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleStepSwitch(1)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-800"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 disabled:opacity-60 text-white text-xs font-bold transition-colors"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Next: Identity &amp; Media
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </SectionCard>
      )}

      {/* STEP 3: VISUAL IDENTITY, LOGO & BANNER */}
      {step === 3 && (
        <SectionCard
          title="3. Visual Identity, Palette, Logo & Storefront Banner"
          subtitle="Pick curated colors and upload or apply sample brand imagery. Live header preview updates below."
        >
          <form onSubmit={handleSaveStep3} className="space-y-5">
            {/* Color Palette Selection */}
            <div className="space-y-2.5">
              <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5" />
                Curated Theme Presets & Custom Colors
              </p>
              <div className="flex flex-wrap gap-2">
                {BRAND_COLOR_PRESETS.map((preset) => {
                  const selected =
                    form.primaryColor.toLowerCase() === preset.primaryColor.toLowerCase();
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        updateField('primaryColor', preset.primaryColor);
                        updateField('accentColor', preset.accentColor);
                      }}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors ${
                        selected
                          ? 'border-slate-950 bg-slate-950 text-white'
                          : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white/40"
                        style={{ backgroundColor: preset.primaryColor }}
                      />
                      <span>{preset.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                <div className="space-y-1">
                  <span className="font-bold text-slate-700 block">Primary Brand Color</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.primaryColor}
                      onChange={(e) => updateField('primaryColor', e.target.value)}
                      className="w-11 h-10 rounded-xl border border-slate-200 cursor-pointer bg-white p-1"
                    />
                    <input
                      type="text"
                      value={form.primaryColor}
                      onChange={(e) => updateField('primaryColor', e.target.value)}
                      className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="font-bold text-slate-700 block">Accent Highlight Color</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.accentColor}
                      onChange={(e) => updateField('accentColor', e.target.value)}
                      className="w-11 h-10 rounded-xl border border-slate-200 cursor-pointer bg-white p-1"
                    />
                    <input
                      type="text"
                      value={form.accentColor}
                      onChange={(e) => updateField('accentColor', e.target.value)}
                      className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Logo & Banner Upload / Presets */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
              <div className="space-y-2.5 p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5" />
                    Brand Logo Image
                  </span>
                  <label className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 font-bold cursor-pointer">
                    <Upload className="w-3 h-3" />
                    <span>{uploadingField === 'logo' ? 'Uploading...' : 'Upload Logo'}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => void handleUploadAsset('logo', e.target.files?.[0])}
                    />
                  </label>
                </div>
                <input
                  type="url"
                  value={form.logoUrl}
                  onChange={(e) => updateField('logoUrl', e.target.value)}
                  placeholder="https://... or choose sample below"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-slate-950"
                />
                <div className="flex flex-wrap gap-1.5">
                  {SAMPLE_LOGO_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => updateField('logoUrl', preset.url)}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold ${
                        form.logoUrl === preset.url
                          ? 'border-slate-950 bg-slate-950 text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      Sample: {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5 p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5" />
                    Storefront Hero Banner
                  </span>
                  <label className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 font-bold cursor-pointer">
                    <Upload className="w-3 h-3" />
                    <span>{uploadingField === 'banner' ? 'Uploading...' : 'Upload Banner'}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => void handleUploadAsset('banner', e.target.files?.[0])}
                    />
                  </label>
                </div>
                <input
                  type="url"
                  value={form.bannerUrl}
                  onChange={(e) => updateField('bannerUrl', e.target.value)}
                  placeholder="https://... or choose sample below"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-slate-950"
                />
                <div className="flex flex-wrap gap-1.5">
                  {SAMPLE_BANNER_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => updateField('bannerUrl', preset.url)}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold ${
                        form.bannerUrl === preset.url
                          ? 'border-slate-950 bg-slate-950 text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      Sample: {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Storefront Preview */}
            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
              {form.announcement.trim() && (
                <div
                  className="px-4 py-1.5 text-center text-[11px] font-bold text-white"
                  style={{ backgroundColor: form.primaryColor }}
                >
                  {form.announcement}
                </div>
              )}
              <div className="relative h-44 sm:h-52 bg-slate-900 flex items-end p-5 text-white overflow-hidden">
                {form.bannerUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.bannerUrl}
                    alt="Storefront Hero Preview"
                    className="absolute inset-0 w-full h-full object-cover opacity-55"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
                <div className="relative z-10 flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border-2 border-white/80 bg-white text-slate-950 flex items-center justify-center font-extrabold text-lg shrink-0">
                    {form.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={form.logoUrl}
                        alt="Brand Logo Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{(form.brandName.trim() || 'B').charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <span
                      className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white mb-1"
                      style={{ backgroundColor: form.accentColor }}
                    >
                      {form.brandName || 'Your Brand'}
                    </span>
                    <h3 className="text-base sm:text-lg font-extrabold leading-tight truncate">
                      {form.storefrontTitle || 'Storefront Title'}
                    </h3>
                    <p className="text-xs text-slate-200 truncate">
                      {form.slogan || 'Add a slogan or tagline in Step 1'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleStepSwitch(2)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-800"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 disabled:opacity-60 text-white text-xs font-bold transition-colors"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Next: Starter Catalog &amp; Try-On
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </SectionCard>
      )}

      {/* STEP 4: STARTER / SAMPLE CATALOG & TRY-ON */}
      {step === 4 && (
        <div className="space-y-5">
          {/* One-click Sample Starter Collection */}
          <SectionCard
            title="4A. Instant Sample Starter Collection & Fabric Specs"
            subtitle="Seed sample Try-On garments and fabric specifications with one click so your storefront and AI studio are testable immediately."
            right={
              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 text-[11px] font-bold">
                {products.length} Products • {fabrics.length} Fabrics
              </span>
            }
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs">
              <div className="space-y-1">
                <p className="font-bold text-slate-950 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-slate-700" />
                  Starter Pack: 2 Try-On Garments + 1 Silk Crepe Fabric
                </p>
                <p className="text-slate-600 leading-relaxed">
                  Adds <strong>{form.brandName || 'Brand'} Signature Structured Blazer</strong>,{' '}
                  <strong>Draped Silk-Blend Top</strong> (with S/M/L stock variants), and a fabric spec sheet directly into your workspace.
                </p>
              </div>
              <button
                type="button"
                disabled={sampleLoading}
                onClick={handleAddSampleStarterKit}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 disabled:opacity-60 text-white font-bold shrink-0 transition-colors"
              >
                {sampleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Add Sample Starter Kit
              </button>
            </div>
          </SectionCard>

          {/* Custom Product Quick Form + Try-On Configuration */}
          <SectionCard
            title="4B. Add a Custom Starter Product & Virtual Try-On Defaults"
            subtitle="Optionally add your own first garment and set AI Virtual Try-On studio quality defaults."
          >
            <form onSubmit={handleAddCustomProduct} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                <label className="block space-y-1">
                  <span className="font-bold text-slate-700">Product Name *</span>
                  <input
                    type="text"
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    placeholder="e.g. Tailored Obsidian Trench"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-950"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="font-bold text-slate-700">SKU Code</span>
                  <input
                    type="text"
                    value={prodSku}
                    onChange={(e) => setProdSku(e.target.value)}
                    placeholder="Auto-generated if blank"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-mono focus:outline-none focus:border-slate-950"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="font-bold text-slate-700">Price ({form.currency || 'USD'})</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-950"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="font-bold text-slate-700">Catalog Category</span>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-slate-950"
                  >
                    <option value="Tops">Tops</option>
                    <option value="Dresses">Dresses</option>
                    <option value="Outerwear">Outerwear</option>
                    <option value="Bottoms">Bottoms</option>
                  </select>
                </label>

                <label className="block space-y-1">
                  <span className="font-bold text-slate-700">AI Try-On Garment Class</span>
                  <select
                    value={prodTryOnCat}
                    onChange={(e) =>
                      setProdTryOnCat(
                        e.target.value as 'tops' | 'bottoms' | 'dresses' | 'outerwear'
                      )
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-slate-950"
                  >
                    <option value="tops">Tops / Shirts / Knits</option>
                    <option value="dresses">Dresses / Full Outfit</option>
                    <option value="outerwear">Outerwear / Blazers</option>
                    <option value="bottoms">Bottoms / Trousers</option>
                  </select>
                </label>

                <label className="block space-y-1">
                  <span className="font-bold text-slate-700">Initial Stock Units</span>
                  <input
                    type="number"
                    min="1"
                    value={prodStock}
                    onChange={(e) => setProdStock(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-950"
                  />
                </label>

                <div className="sm:col-span-2 lg:col-span-3 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-700">Garment Front Image URL</span>
                    <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-bold cursor-pointer">
                      <Upload className="w-3 h-3" />
                      <span>{uploadingField === 'product' ? 'Uploading...' : 'Upload Image'}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => void handleUploadAsset('product', e.target.files?.[0])}
                      />
                    </label>
                  </div>
                  <input
                    type="url"
                    value={prodImageUrl}
                    onChange={(e) => setProdImageUrl(e.target.value)}
                    placeholder="https://... or click Upload Image"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-950"
                  />
                </div>

                <label className="block space-y-1 sm:col-span-2 lg:col-span-3">
                  <span className="font-bold text-slate-700">Garment Description</span>
                  <input
                    type="text"
                    value={prodDescription}
                    onChange={(e) => setProdDescription(e.target.value)}
                    placeholder="Fabric composition, fit notes, and styling summary..."
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-950"
                  />
                </label>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
                <div className="flex flex-wrap items-center gap-4">
                  <label className="inline-flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={publishStorefront}
                      onChange={(e) => setPublishStorefront(e.target.checked)}
                    />
                    Publish on Storefront immediately
                  </label>
                  <label className="inline-flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableTryOnItem}
                      onChange={(e) => setEnableTryOnItem(e.target.checked)}
                    />
                    Enable AI Virtual Try-On
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-900 bg-white hover:bg-slate-950 hover:text-white text-slate-950 font-bold transition-colors"
                >
                  <Package className="w-3.5 h-3.5" />
                  Add Custom Product
                </button>
              </div>
            </form>

            {/* Virtual Try-On Toggle Bar */}
            <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tryOnConfig.enabled}
                  onChange={(e) =>
                    updateTryOnConfig({
                      enabled: e.target.checked,
                      publicPageActive: e.target.checked,
                    })
                  }
                  className="mt-0.5"
                />
                <span>
                  <strong className="block text-slate-900">
                    Activate Customer Virtual Try-On Page (/try/{computedSlug})
                  </strong>
                  <span className="text-slate-500">
                    Shoppers can upload a full/upper-body photo to try on your published garments.
                  </span>
                </span>
              </label>

              <label className="block space-y-1 p-3 rounded-xl border border-slate-200 bg-slate-50">
                <span className="font-bold text-slate-800 block">Default AI Inference Quality Mode</span>
                <select
                  value={tryOnConfig.mode}
                  onChange={(e) =>
                    updateTryOnConfig({
                      mode: e.target.value as 'balanced' | 'high_fidelity' | 'fast_preview',
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none"
                >
                  <option value="balanced">Balanced Speed & Fidelity (Recommended)</option>
                  <option value="high_fidelity">High Fidelity Couture Texture</option>
                  <option value="fast_preview">Fast Preview</option>
                </select>
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
              <button
                type="button"
                onClick={() => handleStepSwitch(3)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-800"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
              <button
                type="button"
                onClick={handleSaveCatalogAndContinue}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
              >
                Next: Review &amp; Save
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </SectionCard>
        </div>
      )}

      {/* STEP 5: REVIEW & FINAL SAVE */}
      {step === 5 && (
        <SectionCard
          title="5. Review Brand Setup & Save to Backend"
          subtitle="All onboarding steps are complete. Click Save to persist your setup, re-verify from the backend, and redirect to your Brand Dashboard."
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Store className="w-4 h-4" />
                    Brand & Storefront Title
                  </span>
                  <button
                    type="button"
                    onClick={() => handleStepSwitch(1)}
                    className="text-[11px] font-bold text-slate-700 underline"
                  >
                    Edit
                  </button>
                </div>
                <p>
                  <span className="text-slate-500">Brand Name:</span>{' '}
                  <strong className="text-slate-950">{form.brandName || 'Not set'}</strong>
                </p>
                <p>
                  <span className="text-slate-500">Storefront Title:</span>{' '}
                  <strong className="text-slate-950">{form.storefrontTitle || 'Not set'}</strong>
                </p>
                <p>
                  <span className="text-slate-500">Tagline:</span>{' '}
                  <span className="text-slate-800">{form.slogan || '—'}</span>
                </p>
                <p>
                  <span className="text-slate-500">Category:</span>{' '}
                  <span className="text-slate-800">{form.categoryFocus}</span>
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4" />
                    Business & Contact
                  </span>
                  <button
                    type="button"
                    onClick={() => handleStepSwitch(2)}
                    className="text-[11px] font-bold text-slate-700 underline"
                  >
                    Edit
                  </button>
                </div>
                <p>
                  <span className="text-slate-500">Owner:</span>{' '}
                  <strong className="text-slate-950">{form.ownerName || 'Brand Owner'}</strong>
                </p>
                <p>
                  <span className="text-slate-500">Legal Entity:</span>{' '}
                  <span className="text-slate-800">{form.legalName || '—'}</span>
                </p>
                <p>
                  <span className="text-slate-500">Email:</span>{' '}
                  <strong className="text-slate-950">{form.bizEmail || 'Not set'}</strong>
                </p>
                <p>
                  <span className="text-slate-500">Region & Currency:</span>{' '}
                  <span className="text-slate-800">
                    {[form.city, form.country].filter(Boolean).join(', ') || 'Global'} ({form.currency})
                  </span>
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2.5 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Catalog & Virtual Try-On Readiness
                </p>
                <div className="flex items-center gap-2">
                  {products.length === 0 && (
                    <button
                      type="button"
                      disabled={sampleLoading}
                      onClick={handleAddSampleStarterKit}
                      className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-900"
                    >
                      {sampleLoading ? 'Adding Sample...' : '+ Quick Add Sample Kit'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleStepSwitch(4)}
                    className="text-[11px] font-bold text-slate-700 underline"
                  >
                    Configure Catalog
                  </button>
                </div>
              </div>
              <p className="text-slate-600">
                Workspace currently contains <strong>{products.length} product(s)</strong>,{' '}
                <strong>{fabrics.length} fabric profile(s)</strong>, and Virtual Try-On studio is{' '}
                <strong>{tryOnConfig.enabled ? 'Enabled' : 'Disabled'}</strong>.
              </p>
            </div>

            {saveError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-900">
                <strong className="font-bold">Save / Verification Failed: </strong>
                {saveError}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => handleStepSwitch(4)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-50 text-xs font-bold text-slate-800"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={handleCompleteOnboarding}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-950 hover:bg-slate-800 disabled:opacity-60 text-white text-xs sm:text-sm font-bold shadow-sm transition-colors"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                {saveStage === 'saving'
                  ? 'Saving to Backend...'
                  : saveStage === 'verifying'
                  ? 'Reloading & Verifying Backend...'
                  : saveStage === 'redirecting'
                  ? 'Verified! Redirecting to Dashboard...'
                  : 'Save & Launch Brand Dashboard'}
              </button>
            </div>
          </div>
        </SectionCard>
      )}
    </div>
  );
}
