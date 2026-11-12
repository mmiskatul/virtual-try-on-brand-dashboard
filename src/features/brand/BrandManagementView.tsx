'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Check,
  CheckCircle2,
  Circle,
  ExternalLink,
  Image as ImageIcon,
  Loader2,
  Palette,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Upload,
} from 'lucide-react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { useUiStore } from '../../stores/useUiStore';
import {
  BrandVerificationSummary,
  ServiceError,
  brandWorkspaceApi,
} from '../../services';
import { STOREFRONT_HEADER_STYLES, StorefrontHeaderStyle } from '../onboarding/onboardingPresets';
import {
  ErrorBanner,
  PageHeader,
  PermissionGate,
  SafeImage,
  SectionCard,
  StatusBadge,
} from '../../components/shared/UiPrimitives';
import { Button } from '../../components/ui/button';

export type BrandManagementTab = 'hub' | 'profile' | 'identity' | 'media';
export type BrandAssetKey = 'logo' | 'banner' | 'lightLogo' | 'socialImage';

const FONT_OPTIONS = [
  'Plus Jakarta Sans',
  'Cormorant Garamond',
  'Playfair Display',
  'Inter',
  'DM Sans',
] as const;

const TAB_ROUTES: Array<{ key: BrandManagementTab; label: string; href: string }> = [
  { key: 'hub', label: 'All Brand Workspace', href: '/dashboard/brand' },
  { key: 'profile', label: 'Profile & Verification', href: '/dashboard/brand/profile' },
  { key: 'identity', label: 'Theme & Identity', href: '/dashboard/brand/identity' },
  { key: 'media', label: 'Logos & Brand Media', href: '/dashboard/brand/media' },
];

const ASSET_CARDS: Array<{
  key: BrandAssetKey;
  label: string;
  dims: string;
  aspect: string;
}> = [
  { key: 'logo', label: 'Primary Brand Logo', dims: '512×512 px • Square PNG/WEBP', aspect: 'aspect-[16/9]' },
  { key: 'banner', label: 'Storefront Hero Banner', dims: '1600×900 px • Widescreen', aspect: 'aspect-[16/9]' },
  { key: 'lightLogo', label: 'Light Header Watermark Logo', dims: '400×400 px • Transparent PNG', aspect: 'aspect-[16/9]' },
  { key: 'socialImage', label: 'Social Open Graph Share Cover', dims: '1200×630 px • < 5MB', aspect: 'aspect-[16/9]' },
];

interface BrandFormState {
  name: string;
  contactEmail: string;
  owner: string;
  legalName: string;
  businessType: string;
  registrationNumber: string;
  establishedYear: string;
  phone: string;
  city: string;
  country: string;
  address: string;
  categoryFocus: string;
  slogan: string;
  shortDescription: string;
  description: string;
  announcement: string;
  instagram: string;
  facebook: string;
  website: string;
  storefrontTitle: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  headingFont: string;
  bodyFont: string;
  buttonStyle: 'pill' | 'rounded' | 'square';
  headerStyle: StorefrontHeaderStyle;
}

function buildFormFromProfile(profile: ReturnType<typeof useWorkspaceStore.getState>['profile']): BrandFormState {
  return {
    name: profile.name || '',
    contactEmail: profile.email || '',
    owner: profile.owner || '',
    legalName: profile.legalName || '',
    businessType: profile.businessType || '',
    registrationNumber: profile.registrationNumber || '',
    establishedYear: profile.establishedYear || '2022',
    phone: profile.phone || '',
    city: profile.city || '',
    country: profile.country || '',
    address: profile.address || '',
    categoryFocus: profile.categoryFocus || '',
    slogan: profile.slogan || '',
    shortDescription: profile.shortDescription || '',
    description: profile.description || '',
    announcement: profile.announcement || '',
    instagram: profile.socialLinks?.instagram || '',
    facebook: profile.socialLinks?.facebook || '',
    website: profile.socialLinks?.website || '',
    storefrontTitle: profile.seo?.title || profile.name || '',
    primaryColor: profile.primaryColor || '#0F172A',
    secondaryColor: profile.secondaryColor || '#334155',
    accentColor: profile.accentColor || '#0F172A',
    backgroundColor: profile.backgroundColor || '#FAF9F6',
    textColor: profile.textColor || '#0F172A',
    headingFont: profile.headingFont || 'Plus Jakarta Sans',
    bodyFont: profile.bodyFont || 'Plus Jakarta Sans',
    buttonStyle: (profile.buttonStyle || 'pill') as 'pill' | 'rounded' | 'square',
    headerStyle: (profile.headerStyle || 'split') as StorefrontHeaderStyle,
  };
}

export function BrandManagementView({ initialTab = 'hub' }: { initialTab?: BrandManagementTab }) {
  const [tab, setTab] = useState<BrandManagementTab>(initialTab);
  const profile = useWorkspaceStore((s) => s.profile);
  const isLiveBackend = useWorkspaceStore((s) => s.isLiveBackend);
  const lastSyncedAt = useWorkspaceStore((s) => s.lastSyncedAt);
  const updateProfile = useWorkspaceStore((s) => s.updateProfile);
  const applySyncedProfile = useWorkspaceStore((s) => s.applySyncedProfile);
  const setLiveSync = useWorkspaceStore((s) => s.setLiveSync);
  const showToast = useUiStore((s) => s.showToast);
  const hideToast = useUiStore((s) => s.hideToast);

  const [form, setForm] = useState<BrandFormState>(() => buildFormFromProfile(profile));
  const [verification, setVerification] = useState<BrandVerificationSummary | null>(null);
  const [dirty, setDirty] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingSection, setSavingSection] = useState<'all' | 'profile' | 'identity' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadingField, setUploadingField] = useState<BrandAssetKey | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [targetAssetKey, setTargetAssetKey] = useState<BrandAssetKey>('logo');

  const formatApiError = useCallback((err: unknown, fallback: string): string => {
    if (err instanceof ServiceError && err.issues && err.issues.length > 0) {
      return err.issues.map((i) => `${i.path}: ${i.message}`).join(' • ');
    }
    return (err as any)?.message || fallback;
  }, []);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const updateField = <K extends keyof BrandFormState>(key: K, value: BrandFormState[K]) => {
    setDirty(true);
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const notify = useCallback(
    (msg: string) => {
      showToast(msg);
      setTimeout(hideToast, 3200);
    },
    [showToast, hideToast]
  );

  const syncFromBackend = useCallback(
    async (forceResetForm = false) => {
      setLoadingProfile(true);
      setErrorMessage(null);
      try {
        const [liveProfile, verificationSummary] = await Promise.all([
          brandWorkspaceApi.getProfile(),
          brandWorkspaceApi.getVerification().catch(() => null),
        ]);
        applySyncedProfile(liveProfile);
        if (verificationSummary) setVerification(verificationSummary);
        setLiveSync(true);
        const merged = { ...useWorkspaceStore.getState().profile, ...liveProfile };
        if (forceResetForm || !dirty) {
          setForm(buildFormFromProfile(merged));
          setDirty(false);
        }
      } catch (err: unknown) {
        setErrorMessage(
          formatApiError(
            err,
            'Unable to sync latest brand profile from backend. Check your brand session.'
          )
        );
      } finally {
        setLoadingProfile(false);
      }
    },
    [applySyncedProfile, dirty, formatApiError, setLiveSync]
  );

  useEffect(() => {
    void syncFromBackend(true);
    // Sync latest tenant profile from PostgreSQL on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!dirty) {
      setForm(buildFormFromProfile(profile));
    }
  }, [profile, dirty]);

  const validateWebsiteInput = (raw: string): string => {
    const trimmed = raw.trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };

  const validateProfileInputs = (): string | null => {
    if (!form.name.trim()) return 'Brand Name is required.';
    const trimmedEmail = form.contactEmail.trim();
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return 'Contact Email must be a valid email address.';
    }
    const trimmedYear = form.establishedYear.trim();
    if (trimmedYear && !/^\d{4}$/.test(trimmedYear)) {
      return 'Established year must be a 4-digit year such as 2022.';
    }
    const normalizedWebsite = validateWebsiteInput(form.website);
    if (normalizedWebsite) {
      try {
        new URL(normalizedWebsite);
      } catch {
        return 'Official Website must be a valid URL (e.g. https://yourbrand.com).';
      }
    }
    return null;
  };

  const applySavedProfileResult = useCallback(
    (savedProfile: Partial<ReturnType<typeof useWorkspaceStore.getState>['profile']> & { id: string }, message: string) => {
      updateProfile(savedProfile);
      setLiveSync(true);
      setDirty(false);
      setForm(buildFormFromProfile({ ...useWorkspaceStore.getState().profile, ...savedProfile }));
      notify(message);
    },
    [notify, setLiveSync, updateProfile]
  );

  const handleSaveDetails = async () => {
    setErrorMessage(null);
    const validationError = validateProfileInputs();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }
    const trimmedName = form.name.trim();
    const trimmedEmail = form.contactEmail.trim();
    const normalizedWebsite = validateWebsiteInput(form.website);

    setSaving(true);
    setSavingSection('profile');
    try {
      const res = await brandWorkspaceApi.updateBrandDetails({
        name: trimmedName,
        ...(trimmedEmail ? { contactEmail: trimmedEmail } : {}),
        owner: form.owner.trim(),
        legalName: form.legalName.trim(),
        businessType: form.businessType.trim(),
        registrationNumber: form.registrationNumber.trim(),
        establishedYear: form.establishedYear.trim(),
        phone: form.phone.trim(),
        city: form.city.trim(),
        country: form.country.trim(),
        address: form.address.trim(),
        categoryFocus: form.categoryFocus.trim(),
        slogan: form.slogan.trim(),
        shortDescription: form.shortDescription.trim(),
        description: form.description.trim(),
        announcement: form.announcement.trim(),
        socialLinks: {
          instagram: form.instagram.trim(),
          facebook: form.facebook.trim(),
          website: normalizedWebsite,
        },
      });
      if (res.verification) setVerification(res.verification);
      applySavedProfileResult(res.profile, 'Core profile & legal details saved.');
    } catch (err: unknown) {
      setErrorMessage(formatApiError(err, 'Failed to save brand profile details.'));
    } finally {
      setSaving(false);
      setSavingSection(null);
    }
  };

  const handleSaveIdentity = async () => {
    setErrorMessage(null);
    setSaving(true);
    setSavingSection('identity');
    try {
      const res = await brandWorkspaceApi.updateBrandIdentity({
        storefrontTitle: form.storefrontTitle.trim() || form.name.trim() || profile.name,
        primaryColor: form.primaryColor,
        secondaryColor: form.secondaryColor,
        accentColor: form.accentColor,
        backgroundColor: form.backgroundColor,
        textColor: form.textColor,
        headingFont: form.headingFont,
        bodyFont: form.bodyFont,
        buttonStyle: form.buttonStyle,
        headerStyle: form.headerStyle,
      });
      applySavedProfileResult(res.profile, 'Theme palette & visual identity saved.');
    } catch (err: unknown) {
      setErrorMessage(formatApiError(err, 'Failed to save theme identity settings.'));
    } finally {
      setSaving(false);
      setSavingSection(null);
    }
  };

  const handleSave = async () => {
    if (tab === 'profile') {
      await handleSaveDetails();
      return;
    }
    if (tab === 'identity') {
      await handleSaveIdentity();
      return;
    }

    setErrorMessage(null);
    const validationError = validateProfileInputs();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    const trimmedName = form.name.trim();
    const trimmedEmail = form.contactEmail.trim();
    const normalizedWebsite = validateWebsiteInput(form.website);

    setSaving(true);
    setSavingSection('all');
    try {
      const res = await brandWorkspaceApi.updateProfile({
        name: trimmedName,
        description: form.description.trim(),
        ...(trimmedEmail ? { contactEmail: trimmedEmail } : {}),
        storefrontSettings: {
          ownerName: form.owner.trim(),
          legalName: form.legalName.trim(),
          businessType: form.businessType.trim(),
          registrationNumber: form.registrationNumber.trim(),
          establishedYear: form.establishedYear.trim(),
          phone: form.phone.trim(),
          city: form.city.trim(),
          country: form.country.trim(),
          address: form.address.trim(),
          categoryFocus: form.categoryFocus.trim(),
          slogan: form.slogan.trim(),
          shortDescription: form.shortDescription.trim(),
          aboutText: form.description.trim(),
          announcement: form.announcement.trim(),
          storefrontTitle: form.storefrontTitle.trim() || trimmedName,
          primaryColor: form.primaryColor,
          secondaryColor: form.secondaryColor,
          accentColor: form.accentColor,
          backgroundColor: form.backgroundColor,
          textColor: form.textColor,
          headingFont: form.headingFont,
          bodyFont: form.bodyFont,
          buttonStyle: form.buttonStyle,
          headerStyle: form.headerStyle,
          lightLogoUrl: profile.lightLogo || '',
          socialImageUrl: profile.socialImage || '',
          socialLinks: {
            instagram: form.instagram.trim(),
            facebook: form.facebook.trim(),
            website: normalizedWebsite,
          },
        },
      });

      const verificationSummary = await brandWorkspaceApi.getVerification().catch(() => null);
      if (verificationSummary) setVerification(verificationSummary);
      applySavedProfileResult(
        res.profile,
        'Brand profile, theme identity & assets saved to backend.'
      );
    } catch (err: unknown) {
      setErrorMessage(formatApiError(err, 'Failed to save brand settings to backend.'));
    } finally {
      setSaving(false);
      setSavingSection(null);
    }
  };

  const persistAssetUrl = async (assetKey: BrandAssetKey, nextUrl: string) => {
    const res = nextUrl
      ? await brandWorkspaceApi.updateBrandMediaSlot(assetKey, nextUrl)
      : await brandWorkspaceApi.deleteBrandMediaSlot(assetKey);
    updateProfile(res.profile);
    setLiveSync(true);
    const verificationSummary = await brandWorkspaceApi.getVerification().catch(() => null);
    if (verificationSummary) setVerification(verificationSummary);
  };

  const handleFileUpload = async (file: File) => {
    setErrorMessage(null);
    setUploadingField(targetAssetKey);
    const meta = ASSET_CARDS.find((c) => c.key === targetAssetKey);
    try {
      const uploadRes = await brandWorkspaceApi.uploadMediaFile(file);
      if (!uploadRes.ok || !uploadRes.url) {
        setErrorMessage(uploadRes.error || 'Image upload failed.');
        return;
      }
      await persistAssetUrl(targetAssetKey, uploadRes.url);
      notify(`Uploaded and saved ${meta?.label || targetAssetKey}.`);
    } catch (err: unknown) {
      setErrorMessage(formatApiError(err, 'Failed to persist uploaded asset to backend.'));
    } finally {
      setUploadingField(null);
    }
  };

  const handleRemoveAsset = async (assetKey: BrandAssetKey) => {
    setErrorMessage(null);
    setUploadingField(assetKey);
    const meta = ASSET_CARDS.find((c) => c.key === assetKey);
    try {
      await persistAssetUrl(assetKey, '');
      notify(`Removed ${meta?.label || assetKey}.`);
    } catch (err: unknown) {
      setErrorMessage(formatApiError(err, 'Failed to remove brand asset.'));
    } finally {
      setUploadingField(null);
    }
  };

  const getAssetUrl = (key: BrandAssetKey): string | undefined => {
    if (key === 'logo') return profile.logo;
    if (key === 'banner') return profile.banner;
    if (key === 'lightLogo') return profile.lightLogo;
    return profile.socialImage;
  };

  return (
    <PermissionGate module="brand" action="view">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Brand Workspace & Backend Sync"
          title="Brand Profile, Verification, Theme & Media"
          subtitle="Manage your live tenant identity, business verification details, storefront palette, typography, and Cloudinary media assets."
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void syncFromBackend(true)}
                disabled={loadingProfile}
                className="gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingProfile ? 'animate-spin' : ''}`} />
                {loadingProfile ? 'Syncing...' : 'Refresh'}
              </Button>
              <PermissionGate module="brand" action="edit">
                <Button
                  size="sm"
                  onClick={() => void handleSave()}
                  disabled={saving || uploadingField !== null}
                  className="gap-1.5"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  {saving ? 'Saving...' : dirty ? 'Save Changes *' : 'Save Changes'}
                </Button>
              </PermissionGate>
            </div>
          }
        />

        {errorMessage && <ErrorBanner message={errorMessage} onRetry={() => void syncFromBackend(true)} />}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
              <SafeImage src={profile.logo} alt={profile.name} fill className="object-cover" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-extrabold text-slate-950 truncate">{form.name || profile.name}</p>
                <StatusBadge status={profile.storeStatus || 'LIVE'} />
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    isLiveBackend
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {isLiveBackend ? `Synced${lastSyncedAt ? ` • ${lastSyncedAt}` : ''}` : 'Sync Pending'}
                </span>
              </div>
              <p className="text-slate-500 truncate">
                /brands/{profile.slug} • {form.slogan || profile.slogan || 'Official Storefront'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link
              href={`/brands/${profile.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold"
            >
              View Live Shop <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        <div className="flex gap-2 border-b border-slate-200 pb-3 text-xs font-bold overflow-x-auto">
          {TAB_ROUTES.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              onClick={() => setTab(item.key)}
              className={`px-4 py-2 rounded-xl border whitespace-nowrap transition-colors ${
                tab === item.key
                  ? 'bg-slate-950 text-white border-slate-950'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {(tab === 'hub' || tab === 'profile') && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <SectionCard
              title="Core Brand, Business & Social Details"
              subtitle="Persisted directly to your tenant record via PATCH /api/v1/brand/profile/details"
              right={
                <PermissionGate module="brand" action="edit">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={saving}
                    onClick={() => void handleSaveDetails()}
                    className="gap-1.5"
                  >
                    {savingSection === 'profile' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    {savingSection === 'profile' ? 'Saving Profile...' : 'Save Profile Details'}
                  </Button>
                </PermissionGate>
              }
              className="lg:col-span-8"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Brand Name *</label>
                  <input
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="Aura Atelier"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-950"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) => updateField('contactEmail', e.target.value)}
                    placeholder="hello@yourbrand.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-950"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Brand Owner / Lead Contact</label>
                  <input
                    value={form.owner}
                    onChange={(e) => updateField('owner', e.target.value)}
                    placeholder="Elena Rostova"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-950"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Legal Entity Name</label>
                  <input
                    value={form.legalName}
                    onChange={(e) => updateField('legalName', e.target.value)}
                    placeholder="Aura Atelier Fashion Ltd."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-950"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Business Type</label>
                  <input
                    value={form.businessType}
                    onChange={(e) => updateField('businessType', e.target.value)}
                    placeholder="Independent Fashion House"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-950"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Business Registration #</label>
                  <input
                    value={form.registrationNumber}
                    onChange={(e) => updateField('registrationNumber', e.target.value)}
                    placeholder="REG-2024-88412"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-950"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Established Year</label>
                  <input
                    value={form.establishedYear}
                    onChange={(e) => updateField('establishedYear', e.target.value)}
                    placeholder="2022"
                    maxLength={4}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-950"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Support Phone</label>
                  <input
                    value={form.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="+880 1711-000000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-950"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">City</label>
                  <input
                    value={form.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    placeholder="Dhaka"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-950"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Country / Region</label>
                  <input
                    value={form.country}
                    onChange={(e) => updateField('country', e.target.value)}
                    placeholder="Bangladesh"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-950"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Studio / Flagship Address</label>
                  <input
                    value={form.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    placeholder="Studio 4B, Road 11, Banani, Dhaka"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-950"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tagline / Slogan</label>
                  <input
                    value={form.slogan}
                    onChange={(e) => updateField('slogan', e.target.value)}
                    placeholder="Quiet Luxury Engineered for Effortless Fit"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-950"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category Focus</label>
                  <input
                    value={form.categoryFocus}
                    onChange={(e) => updateField('categoryFocus', e.target.value)}
                    placeholder="Silk Dresses, Linen Tailoring & Festive Wear"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-950"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Storefront Announcement Banner</label>
                  <input
                    value={form.announcement}
                    onChange={(e) => updateField('announcement', e.target.value)}
                    placeholder="Free express delivery on orders over ৳1,500"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-950"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Short Description</label>
                  <input
                    value={form.shortDescription}
                    onChange={(e) => updateField('shortDescription', e.target.value)}
                    placeholder="Minimalist ethical silks and tailored silhouettes."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-950"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Brand Story & About</label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    placeholder="Tell shoppers about your craftsmanship, sizing philosophy, and heritage..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-950"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Instagram Handle</label>
                  <input
                    value={form.instagram}
                    onChange={(e) => updateField('instagram', e.target.value)}
                    placeholder="@yourbrand"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-950"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Facebook Page</label>
                  <input
                    value={form.facebook}
                    onChange={(e) => updateField('facebook', e.target.value)}
                    placeholder="facebook.com/yourbrand"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-950"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Official Website</label>
                  <input
                    value={form.website}
                    onChange={(e) => updateField('website', e.target.value)}
                    placeholder="https://yourbrand.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-950"
                  />
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Platform Verification & Tenant Status" className="lg:col-span-4">
              <div className="space-y-3 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-slate-800">Current Badge</span>
                  <StatusBadge status={profile.verificationStatus || 'VERIFIED'} />
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-slate-600">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" /> Verification Readiness
                    </p>
                    <span className="font-mono text-[11px] font-bold text-slate-900">
                      {verification ? `${verification.verificationScore}%` : 'Syncing...'}
                    </span>
                  </div>
                  {verification && (
                    <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 transition-all"
                        style={{ width: `${verification.verificationScore}%` }}
                      />
                    </div>
                  )}
                  <p>
                    Registration ({verification?.registrationNumber || form.registrationNumber || 'On file'}).
                  </p>
                  {verification && verification.checks.length > 0 && (
                    <ul className="space-y-1.5 pt-1">
                      {verification.checks.map((chk) => (
                        <li key={chk.key} className="flex items-center gap-1.5 text-[11px]">
                          {chk.completed ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <Circle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                          )}
                          <span className={chk.completed ? 'text-slate-700' : 'text-slate-500'}>
                            {chk.label}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="pt-2 border-t border-slate-200 space-y-1 font-mono text-[11px] text-slate-500">
                    <p>Tenant ID: {profile.id || 'local'}</p>
                    <p>Slug: /brands/{profile.slug}</p>
                    <p>Storefront: {profile.storeStatus || 'LIVE'}</p>
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>
        )}

        {(tab === 'hub' || tab === 'identity') && (
          <SectionCard
            title="Storefront Theme Colors, Typography & Layout Tokens"
            subtitle="Changes save directly to your storefrontSettings via PATCH /api/v1/brand/identity"
            right={
              <PermissionGate module="brand" action="edit">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={saving}
                  onClick={() => void handleSaveIdentity()}
                  className="gap-1.5"
                >
                  {savingSection === 'identity' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  {savingSection === 'identity' ? 'Saving Theme...' : 'Save Theme & Identity'}
                </Button>
              </PermissionGate>
            }
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                {[
                  ['primaryColor', 'Primary Color'],
                  ['secondaryColor', 'Secondary Color'],
                  ['accentColor', 'Accent Color'],
                  ['backgroundColor', 'Canvas Background'],
                  ['textColor', 'Body Text'],
                ].map(([k, lbl]) => (
                  <div key={k} className="p-3 rounded-xl border border-slate-200 space-y-1.5">
                    <label className="block font-bold text-slate-700">{lbl}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={(form as any)[k]}
                        onChange={(e) => updateField(k as keyof BrandFormState, e.target.value)}
                        className="w-10 h-8 rounded cursor-pointer border border-slate-200"
                      />
                      <span className="font-mono text-[11px] uppercase">{(form as any)[k]}</span>
                    </div>
                  </div>
                ))}

                <div className="p-3 rounded-xl border border-slate-200 space-y-1.5">
                  <label className="block font-bold text-slate-700">Heading Font</label>
                  <select
                    value={form.headingFont}
                    onChange={(e) => updateField('headingFont', e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold"
                  >
                    {FONT_OPTIONS.map((font) => (
                      <option key={font} value={font}>
                        {font}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 space-y-1.5">
                  <label className="block font-bold text-slate-700">Body Font</label>
                  <select
                    value={form.bodyFont}
                    onChange={(e) => updateField('bodyFont', e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold"
                  >
                    {FONT_OPTIONS.map((font) => (
                      <option key={font} value={font}>
                        {font}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 space-y-1.5">
                  <label className="block font-bold text-slate-700">Button Style</label>
                  <select
                    value={form.buttonStyle}
                    onChange={(e) =>
                      updateField('buttonStyle', e.target.value as 'pill' | 'rounded' | 'square')
                    }
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold"
                  >
                    <option value="pill">Pill (Rounded Full)</option>
                    <option value="rounded">Soft Rounded</option>
                    <option value="square">Sharp Architectural</option>
                  </select>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 space-y-1.5">
                  <label className="block font-bold text-slate-700">Header Style</label>
                  <select
                    value={form.headerStyle}
                    onChange={(e) => updateField('headerStyle', e.target.value as StorefrontHeaderStyle)}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold"
                  >
                    {STOREFRONT_HEADER_STYLES.map((hs) => (
                      <option key={hs.id} value={hs.id}>
                        {hs.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2 sm:col-span-3 p-3 rounded-xl border border-slate-200 space-y-1.5">
                  <label className="block font-bold text-slate-700">Storefront SEO / Hero Title</label>
                  <input
                    value={form.storefrontTitle}
                    onChange={(e) => updateField('storefrontTitle', e.target.value)}
                    placeholder="Aura Atelier Official Storefront"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-slate-950"
                  />
                </div>
              </div>

              <div
                className="lg:col-span-5 rounded-2xl border border-slate-200 p-6 space-y-3 shadow-sm"
                style={{
                  backgroundColor: form.backgroundColor,
                  color: form.textColor,
                  fontFamily: form.bodyFont,
                }}
              >
                <div className="flex items-center justify-between gap-2 text-xs font-bold uppercase tracking-wider opacity-70">
                  <span className="inline-flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5" /> Live Token Preview
                  </span>
                  <span className="text-[10px] font-mono">
                    {form.headingFont} • {form.headerStyle}
                  </span>
                </div>
                <h3 className="text-xl font-extrabold" style={{ fontFamily: form.headingFont }}>
                  {form.storefrontTitle || form.name || profile.name}
                </h3>
                <p className="text-xs opacity-80">
                  {form.slogan || profile.slogan || 'Storefront typography & button preview'}
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    style={{ backgroundColor: form.primaryColor }}
                    className={`px-4 py-2 text-xs font-bold text-white ${
                      form.buttonStyle === 'pill'
                        ? 'rounded-full'
                        : form.buttonStyle === 'square'
                        ? 'rounded-none'
                        : 'rounded-xl'
                    }`}
                  >
                    Shop Collection
                  </button>
                  <span
                    style={{ borderColor: form.secondaryColor, color: form.secondaryColor }}
                    className={`px-3 py-1.5 text-xs font-bold border ${
                      form.buttonStyle === 'pill'
                        ? 'rounded-full'
                        : form.buttonStyle === 'square'
                        ? 'rounded-none'
                        : 'rounded-xl'
                    }`}
                  >
                    Try On Studio
                  </span>
                </div>
              </div>
            </div>
          </SectionCard>
        )}

        {(tab === 'hub' || tab === 'media') && (
          <SectionCard
            title="Brand Logos, Banner & Social Media Assets"
            subtitle="All 4 media slots upload to Cloudinary via /api/v1/uploads and save immediately to PostgreSQL"
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFileUpload(file);
                e.currentTarget.value = '';
              }}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {ASSET_CARDS.map(({ key: assetKey, label, dims, aspect }) => {
                const src = getAssetUrl(assetKey);
                const isBusy = uploadingField === assetKey;
                return (
                  <div
                    key={assetKey}
                    className="rounded-2xl border border-slate-200 p-4 space-y-3 bg-slate-50/70"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-bold text-slate-900">{label}</p>
                        <p className="text-[11px] text-slate-500">{dims}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {src && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isBusy}
                            onClick={() => void handleRemoveAsset(assetKey)}
                            className="gap-1 border-rose-200 text-rose-700 hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remove
                          </Button>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          variant={src ? 'outline' : 'default'}
                          disabled={isBusy}
                          onClick={() => {
                            setTargetAssetKey(assetKey);
                            fileRef.current?.click();
                          }}
                          className="gap-1.5"
                        >
                          {isBusy ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Upload className="w-3.5 h-3.5" />
                          )}
                          {isBusy ? 'Saving...' : src ? 'Replace' : 'Upload Photo'}
                        </Button>
                      </div>
                    </div>

                    {src ? (
                      <div
                        className={`relative ${aspect} rounded-xl overflow-hidden bg-white border border-slate-200`}
                      >
                        <SafeImage src={src} alt={label} fill className="object-cover" />
                        <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-slate-950/80 text-white text-[10px] font-bold">
                          Synced to Backend
                        </span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => {
                          setTargetAssetKey(assetKey);
                          fileRef.current?.click();
                        }}
                        className={`w-full ${aspect} rounded-xl border-2 border-dashed border-slate-300 bg-white hover:border-slate-500 flex flex-col items-center justify-center gap-1.5 text-slate-500 transition-colors`}
                      >
                        <ImageIcon className="w-5 h-5 text-slate-400" />
                        <span className="font-semibold text-slate-700">Click to upload {label}</span>
                        <span className="text-[11px] text-slate-400">PNG, JPG, or WEBP up to 10MB</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </SectionCard>
        )}
      </div>
    </PermissionGate>
  );
}
