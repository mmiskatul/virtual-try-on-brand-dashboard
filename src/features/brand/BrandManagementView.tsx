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
import {
  BRAND_COLOR_PRESETS,
  STOREFRONT_HEADER_STYLES,
  StorefrontHeaderStyle,
} from '../onboarding/onboardingPresets';
import {
  DESIGN_LAYOUT_GUIDANCE,
  FullShopLivePreview,
  StorefrontDesignCarousel,
} from '../../components/shared/StorefrontDesignShowcase';
import {
  ErrorBanner,
  PageHeader,
  PermissionGate,
  SafeImage,
  SectionCard,
  StatusBadge,
} from '../../components/shared/UiPrimitives';
import { Button } from '../../components/ui/button';
import { Field, SaveBar, useUnsavedWarning } from '../../components/shared/SettingsKit';
import { canPerform } from '../../config/permissions';

export type BrandSection = 'profile' | 'business' | 'social' | 'verification' | 'theme' | 'media';
type BrandManagementTab = 'profile' | 'identity' | 'media';

const SECTION_TAB: Record<BrandSection, BrandManagementTab> = {
  profile: 'profile',
  business: 'profile',
  social: 'profile',
  verification: 'profile',
  theme: 'identity',
  media: 'media',
};

const SECTION_COPY: Record<BrandSection, { title: string; subtitle: string }> = {
  profile: { title: 'Brand profile', subtitle: 'Your name, contact details, tagline and story.' },
  business: { title: 'Business details', subtitle: 'Legal name, registration and where you are based.' },
  social: { title: 'Social links', subtitle: 'Instagram, Facebook and your website.' },
  verification: { title: 'Verification', subtitle: 'Your trust badge and what is left to finish.' },
  theme: { title: 'Theme & identity', subtitle: 'Colours, fonts and button style for your storefront.' },
  media: { title: 'Logos & media', subtitle: 'Your logo, banner and share image.' },
};
export type BrandAssetKey = 'logo' | 'banner' | 'lightLogo' | 'socialImage';

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'Unsupported file type. Please upload a PNG, JPG or WEBP image.';
  }
  if (file.size === 0) return 'This file is empty. Please choose a different image.';
  if (file.size > MAX_IMAGE_BYTES) {
    return `Image is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). The maximum size is 10MB.`;
  }
  return null;
}

const FONT_OPTIONS = [
  'Plus Jakarta Sans',
  'Cormorant Garamond',
  'Playfair Display',
  'Inter',
  'DM Sans',
] as const;

const ASSET_CARDS: Array<{
  key: BrandAssetKey;
  label: string;
  dims: string;
  aspect: string;
}> = [
  { key: 'logo', label: 'Primary Brand Logo', dims: '512×512 px • Square PNG/WEBP', aspect: 'aspect-square' },
  { key: 'banner', label: 'Storefront Hero Banner', dims: '1600×900 px • Widescreen', aspect: 'aspect-[16/9]' },
  { key: 'lightLogo', label: 'Light Header Watermark Logo', dims: '400×400 px • Transparent PNG', aspect: 'aspect-square' },
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

export function BrandManagementView({ section }: { section: BrandSection }) {
  const tab = SECTION_TAB[section];
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
  useUnsavedWarning(dirty);
  const activeRole = useWorkspaceStore((s) => s.activeRole);
  const roleOverrides = useWorkspaceStore((s) => s.roleOverrides);
  const canEdit = canPerform(activeRole, 'brand', 'edit', roleOverrides);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingSection, setSavingSection] = useState<'profile' | 'identity' | 'media' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadingField, setUploadingField] = useState<BrandAssetKey | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const targetAssetKeyRef = useRef<BrandAssetKey>('logo');

  const formatApiError = useCallback((err: unknown, fallback: string): string => {
    if (err instanceof ServiceError && err.issues && err.issues.length > 0) {
      return err.issues.map((i) => `${i.path}: ${i.message}`).join(' • ');
    }
    return (err as any)?.message || fallback;
  }, []);

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

  const handleSaveMediaStudio = async () => {
    setErrorMessage(null);
    setSaving(true);
    setSavingSection('media');
    try {
      await brandWorkspaceApi.updateBrandDetails({
        slogan: form.slogan.trim(),
        announcement: form.announcement.trim(),
      });
      const idRes = await brandWorkspaceApi.updateBrandIdentity({
        primaryColor: form.primaryColor,
        secondaryColor: form.secondaryColor,
        accentColor: form.accentColor,
        headerStyle: form.headerStyle,
      });
      applySavedProfileResult(
        idRes.profile,
        'Selected storefront UI design, copy & colors saved.'
      );
    } catch (err: unknown) {
      setErrorMessage(formatApiError(err, 'Failed to save storefront UI design settings.'));
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
    await handleSaveMediaStudio();
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

  const triggerUploadForSlot = (assetKey: BrandAssetKey) => {
    targetAssetKeyRef.current = assetKey;
    fileRef.current?.click();
  };

  const handleFileUpload = async (file: File) => {
    const slotKey = targetAssetKeyRef.current;
    setErrorMessage(null);
    const invalid = validateImageFile(file);
    if (invalid) {
      setErrorMessage(invalid);
      notify(invalid);
      return;
    }
    setUploadingField(slotKey);
    const meta = ASSET_CARDS.find((c) => c.key === slotKey);
    try {
      const uploadRes = await brandWorkspaceApi.uploadMediaFile(file);
      if (!uploadRes.ok || !uploadRes.url) {
        setErrorMessage(uploadRes.error || 'Image upload failed.');
        return;
      }
      await persistAssetUrl(slotKey, uploadRes.url);
      notify(`Uploaded and saved ${meta?.label || slotKey}.`);
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
          backHref="/dashboard/settings"
          backLabel="Settings"
          eyebrow="Settings • Brand"
          title={SECTION_COPY[section].title}
          subtitle={SECTION_COPY[section].subtitle}
          actions={
            <Button type="button" variant="outline" size="sm" onClick={() => void syncFromBackend(true)} disabled={loadingProfile} className="gap-1.5">
              <RefreshCw className={`w-3.5 h-3.5 ${loadingProfile ? 'animate-spin' : ''}`} />
              {loadingProfile ? 'Syncing...' : 'Refresh'}
            </Button>
          }
        />

        {errorMessage && <ErrorBanner message={errorMessage} onRetry={() => void syncFromBackend(true)} />}

        {section === 'profile' && (
          <SectionCard title="Brand profile" subtitle="Shown on your storefront and in emails to shoppers.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Brand Name" value={form.name} onChange={(v) => updateField('name', v)} placeholder="Your brand name" required />
              <Field label="Contact Email" value={form.contactEmail} onChange={(v) => updateField('contactEmail', v)} placeholder="hello@yourbrand.com" type="email" />
              <Field label="Brand Owner / Lead Contact" value={form.owner} onChange={(v) => updateField('owner', v)} placeholder="Your full name" />
              <Field label="Support Phone" value={form.phone} onChange={(v) => updateField('phone', v)} placeholder="+880 1711-000000" />
              <Field label="Tagline / Slogan" value={form.slogan} onChange={(v) => updateField('slogan', v)} placeholder="Quiet Luxury Engineered for Effortless Fit" />
              <Field label="Category Focus" value={form.categoryFocus} onChange={(v) => updateField('categoryFocus', v)} placeholder="Silk Dresses, Linen Tailoring & Festive Wear" />
              <Field label="Storefront Announcement Banner" value={form.announcement} onChange={(v) => updateField('announcement', v)} placeholder="Free express delivery on orders over ৳1,500" className="sm:col-span-2" />
              <Field label="Short Description" value={form.shortDescription} onChange={(v) => updateField('shortDescription', v)} placeholder="Minimalist ethical silks and tailored silhouettes." className="sm:col-span-2" />
              <Field label="Brand Story & About" value={form.description} onChange={(v) => updateField('description', v)} placeholder="Tell shoppers about your craftsmanship, sizing philosophy, and heritage..." rows={3} className="sm:col-span-2" />
            </div>
          </SectionCard>
        )}

        {section === 'business' && (
          <SectionCard title="Business details" subtitle="Your legal and location details. Shoppers do not see the registration number.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Legal Entity Name" value={form.legalName} onChange={(v) => updateField('legalName', v)} placeholder="Your registered company name" />
              <Field label="Business Type" value={form.businessType} onChange={(v) => updateField('businessType', v)} placeholder="Independent Fashion House" />
              <Field label="Business Registration #" value={form.registrationNumber} onChange={(v) => updateField('registrationNumber', v)} placeholder="REG-2024-88412" />
              <Field label="Established Year" value={form.establishedYear} onChange={(v) => updateField('establishedYear', v)} placeholder="2022" maxLength={4} />
              <Field label="City" value={form.city} onChange={(v) => updateField('city', v)} placeholder="Dhaka" />
              <Field label="Country / Region" value={form.country} onChange={(v) => updateField('country', v)} placeholder="Bangladesh" />
              <Field label="Studio / Flagship Address" value={form.address} onChange={(v) => updateField('address', v)} placeholder="Studio 4B, Road 11, Banani, Dhaka" className="sm:col-span-2" />
            </div>
          </SectionCard>
        )}

        {section === 'social' && (
          <SectionCard title="Social links" subtitle="Where shoppers can find you online.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Instagram Handle" value={form.instagram} onChange={(v) => updateField('instagram', v)} placeholder="@yourbrand" />
              <Field label="Facebook Page" value={form.facebook} onChange={(v) => updateField('facebook', v)} placeholder="facebook.com/yourbrand" />
              <Field label="Official Website" value={form.website} onChange={(v) => updateField('website', v)} placeholder="https://yourbrand.com" className="sm:col-span-2" />
            </div>
          </SectionCard>
        )}

        {section === 'verification' && (
        <SectionCard title="Verification and account status">
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
                <p>Account ID: {profile.id || 'local'}</p>
                <p>Slug: /brands/{profile.slug}</p>
                <p>Storefront: {profile.storeStatus || 'LIVE'}</p>
              </div>
            </div>
          </div>
        </SectionCard>
        )}

        {section === 'theme' && (
          <SectionCard
            title="Storefront Theme Colors, Typography & Layout Tokens"
            subtitle="Changes are saved to your storefront theme."
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

                <p className="col-span-2 sm:col-span-3 rounded-xl bg-slate-50 px-3.5 py-3 text-xs text-slate-600">Your store title for Google and shared links is edited in <Link href="/dashboard/settings/seo" className="font-semibold text-slate-900 underline">Search &amp; sharing</Link>.</p>
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

        {section === 'media' && (
          <div className="space-y-6">
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

            {/* Choose or Switch Active Storefront UI Design right inside the Logos & media page */}
            <SectionCard
              title="Store design, logos and images"
              subtitle={`Active Design: ${
                STOREFRONT_HEADER_STYLES.find((s) => s.id === form.headerStyle)?.label || 'Editorial Split'
              } — Switch layouts below and edit media directly inside your selected UI`}
            >
              <div className="space-y-5">
                <StorefrontDesignCarousel
                  selectedStyle={form.headerStyle}
                  onSelectStyle={(styleId) => updateField('headerStyle', styleId)}
                  brandName={form.name || profile.name}
                  primaryColor={form.primaryColor}
                  accentColor={form.accentColor}
                  logoUrl={profile.logo || ''}
                  bannerUrl={profile.banner || ''}
                  headingText="Choose or Change Your Storefront UI Design (Swap Left ↔ Right Across All 8 UIs)"
                />

                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-700 flex flex-wrap items-center justify-between gap-2">
                  <span>
                    <strong className="text-slate-950">
                      {STOREFRONT_HEADER_STYLES.find((s) => s.id === form.headerStyle)?.label}:
                    </strong>{' '}
                    {DESIGN_LAYOUT_GUIDANCE[form.headerStyle].summary}
                  </span>
                  <span className="font-mono text-[11px] text-slate-500">
                    layout: {form.headerStyle}
                  </span>
                </div>

                {/* Live Interactive Layout Preview + Relevant Controls tailored to selected UI */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
                  <div className="xl:col-span-8 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-bold text-slate-900">
                        Interactive Preview — Update Assets Directly Inside This UI
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Click Upload / Replace inside the mockup header or hero frame
                      </span>
                    </div>
                    <FullShopLivePreview
                      styleId={form.headerStyle}
                      brandName={form.name || profile.name}
                      storefrontTitle={form.storefrontTitle || form.name || profile.name}
                      slogan={form.slogan}
                      announcement={form.announcement}
                      primaryColor={form.primaryColor}
                      secondaryColor={form.secondaryColor}
                      accentColor={form.accentColor}
                      backgroundColor={form.backgroundColor}
                      textColor={form.textColor}
                      headingFont={form.headingFont}
                      bodyFont={form.bodyFont}
                      buttonStyle={form.buttonStyle}
                      logoUrl={profile.logo || ''}
                      lightLogoUrl={profile.lightLogo || ''}
                      bannerUrl={profile.banner || ''}
                      socialImageUrl={profile.socialImage || ''}
                      uploadingSlot={uploadingField}
                      onUploadSlot={(slot) => triggerUploadForSlot(slot)}
                      onRemoveSlot={(slot) => void handleRemoveAsset(slot)}
                    />
                  </div>

                  {/* Quick Relevant Copy & Color Controls beside the selected UI */}
                  <div className="xl:col-span-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3.5 text-xs">
                    <div>
                      <p className="font-extrabold text-slate-950">Quick Edit for Selected UI</p>
                      <p className="text-[11px] text-slate-500">
                        Live text &amp; colors rendered in{' '}
                        <strong>
                          {STOREFRONT_HEADER_STYLES.find((s) => s.id === form.headerStyle)?.label}
                        </strong>
                      </p>
                    </div>


                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Hero Tagline / Slogan</label>
                      <input
                        value={form.slogan}
                        onChange={(e) => updateField('slogan', e.target.value)}
                        placeholder="Modern craftsmanship for everyday wear"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-slate-950"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Top Announcement Banner</label>
                      <input
                        value={form.announcement}
                        onChange={(e) => updateField('announcement', e.target.value)}
                        placeholder="Free shipping across Dhaka on orders over ৳3,000"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-slate-950"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block font-bold text-slate-700">Color Presets</label>
                      <div className="flex flex-wrap gap-1.5">
                        {BRAND_COLOR_PRESETS.map((preset) => {
                          const active =
                            form.primaryColor.toLowerCase() === preset.primaryColor.toLowerCase();
                          return (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => {
                                updateField('primaryColor', preset.primaryColor);
                                updateField('accentColor', preset.accentColor);
                              }}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-colors ${
                                active
                                  ? 'border-slate-950 bg-slate-950 text-white'
                                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <span
                                className="w-2.5 h-2.5 rounded-full border border-white/40"
                                style={{ backgroundColor: preset.primaryColor }}
                              />
                              {preset.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="p-2.5 rounded-xl border border-slate-200 bg-white">
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                          Primary
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={form.primaryColor}
                            onChange={(e) => updateField('primaryColor', e.target.value)}
                            className="w-8 h-7 rounded cursor-pointer border border-slate-200"
                          />
                          <span className="font-mono text-[11px]">{form.primaryColor}</span>
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl border border-slate-200 bg-white">
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                          Accent
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={form.accentColor}
                            onChange={(e) => updateField('accentColor', e.target.value)}
                            className="w-8 h-7 rounded cursor-pointer border border-slate-200"
                          />
                          <span className="font-mono text-[11px]">{form.accentColor}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>
        )}

        {section !== 'verification' && (
          <SaveBar
            dirty={dirty}
            saving={saving}
            canEdit={canEdit && uploadingField === null}
            onSave={() => void handleSave()}
            onDiscard={() => {
              setForm(buildFormFromProfile(profile));
              setDirty(false);
            }}
          />
        )}
      </div>
    </PermissionGate>
  );
}
