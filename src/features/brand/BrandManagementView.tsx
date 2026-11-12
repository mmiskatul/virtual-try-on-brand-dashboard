'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  Check,
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
import { brandWorkspaceApi } from '../../services';
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

const FONT_OPTIONS = [
  'Plus Jakarta Sans',
  'Cormorant Garamond',
  'Playfair Display',
  'Inter',
  'DM Sans',
] as const;

export function BrandManagementView({ initialTab = 'hub' }: { initialTab?: BrandManagementTab }) {
  const [tab, setTab] = useState<BrandManagementTab>(initialTab);
  const profile = useWorkspaceStore((s) => s.profile);
  const isLiveBackend = useWorkspaceStore((s) => s.isLiveBackend);
  const updateProfile = useWorkspaceStore((s) => s.updateProfile);
  const setLiveSync = useWorkspaceStore((s) => s.setLiveSync);
  const showToast = useUiStore((s) => s.showToast);
  const hideToast = useUiStore((s) => s.hideToast);

  const [form, setForm] = useState({
    establishedYear: profile.establishedYear || '2022',
    instagram: profile.socialLinks?.instagram || '',
    facebook: profile.socialLinks?.facebook || '',
    website: profile.socialLinks?.website || '',
    secondaryColor: profile.secondaryColor || '#334155',
    backgroundColor: profile.backgroundColor || '#FAF9F6',
    textColor: profile.textColor || '#0F172A',
    headingFont: profile.headingFont || 'Plus Jakarta Sans',
    bodyFont: profile.bodyFont || 'Plus Jakarta Sans',
    buttonStyle: (profile.buttonStyle || 'pill') as 'pill' | 'rounded' | 'square',
  });

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadingField, setUploadingField] = useState<'lightLogo' | 'socialImage' | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [targetAssetKey, setTargetAssetKey] = useState<'lightLogo' | 'socialImage'>('lightLogo');

  const notify = useCallback(
    (msg: string) => {
      showToast(msg);
      setTimeout(hideToast, 3200);
    },
    [showToast, hideToast]
  );

  const hydrateFromProfile = useCallback(
    (next: typeof profile) => {
      setForm({
        establishedYear: next.establishedYear || '2022',
        instagram: next.socialLinks?.instagram || '',
        facebook: next.socialLinks?.facebook || '',
        website: next.socialLinks?.website || '',
        secondaryColor: next.secondaryColor || '#334155',
        backgroundColor: next.backgroundColor || '#FAF9F6',
        textColor: next.textColor || '#0F172A',
        headingFont: next.headingFont || 'Plus Jakarta Sans',
        bodyFont: next.bodyFont || 'Plus Jakarta Sans',
        buttonStyle: (next.buttonStyle || 'pill') as 'pill' | 'rounded' | 'square',
      });
    },
    []
  );

  const syncFromBackend = useCallback(async () => {
    setLoadingProfile(true);
    setErrorMessage(null);
    try {
      const liveProfile = await brandWorkspaceApi.getProfile();
      updateProfile(liveProfile);
      setLiveSync(true);
      hydrateFromProfile({ ...profile, ...liveProfile } as any);
    } catch (err: any) {
      if (isLiveBackend) {
        setErrorMessage(err?.message || 'Unable to sync latest brand settings from backend.');
      }
    } finally {
      setLoadingProfile(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrateFromProfile, isLiveBackend, setLiveSync, updateProfile]);

  useEffect(() => {
    void syncFromBackend();
    // Only fetch live brand profile on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    hydrateFromProfile(profile);
  }, [
    profile.establishedYear,
    profile.socialLinks?.instagram,
    profile.socialLinks?.facebook,
    profile.socialLinks?.website,
    profile.secondaryColor,
    profile.backgroundColor,
    profile.textColor,
    profile.headingFont,
    profile.bodyFont,
    profile.buttonStyle,
    hydrateFromProfile,
    profile,
  ]);

  const validateWebsiteInput = (raw: string): string => {
    const trimmed = raw.trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };

  const handleSave = async () => {
    setErrorMessage(null);
    const trimmedYear = form.establishedYear.trim();
    if (trimmedYear && !/^\d{4}$/.test(trimmedYear)) {
      setErrorMessage('Established year must be a 4-digit year such as 2022.');
      return;
    }
    const normalizedWebsite = validateWebsiteInput(form.website);
    if (normalizedWebsite) {
      try {
        new URL(normalizedWebsite);
      } catch {
        setErrorMessage('Official Website must be a valid URL (e.g. https://yourbrand.com).');
        return;
      }
    }

    setSaving(true);
    const nextSocialLinks = {
      ...(profile.socialLinks || {}),
      instagram: form.instagram.trim(),
      facebook: form.facebook.trim(),
      website: normalizedWebsite,
    };

    try {
      const res = await brandWorkspaceApi.updateProfile({
        storefrontSettings: {
          establishedYear: trimmedYear,
          secondaryColor: form.secondaryColor,
          backgroundColor: form.backgroundColor,
          textColor: form.textColor,
          headingFont: form.headingFont,
          bodyFont: form.bodyFont,
          buttonStyle: form.buttonStyle,
          lightLogoUrl: profile.lightLogo || '',
          socialImageUrl: profile.socialImage || '',
          socialLinks: nextSocialLinks,
        },
      });
      const ss = res?.tenant?.storefrontSettings || {};
      updateProfile({
        establishedYear: ss.establishedYear ?? trimmedYear,
        secondaryColor: ss.secondaryColor ?? form.secondaryColor,
        backgroundColor: ss.backgroundColor ?? form.backgroundColor,
        textColor: ss.textColor ?? form.textColor,
        headingFont: ss.headingFont ?? form.headingFont,
        bodyFont: ss.bodyFont ?? form.bodyFont,
        buttonStyle: ss.buttonStyle ?? form.buttonStyle,
        lightLogo: ss.lightLogoUrl ?? profile.lightLogo,
        socialImage: ss.socialImageUrl ?? profile.socialImage,
        socialLinks: ss.socialLinks ?? nextSocialLinks,
      });
      setForm((prev) => ({ ...prev, website: normalizedWebsite }));
      notify('Brand verification details & extended tokens saved to backend.');
    } catch (err: any) {
      const msg = err?.message || 'Failed to save brand settings to backend.';
      setErrorMessage(msg);
    } finally {
      setSaving(false);
    }
  };

  const persistAssetUrl = async (assetKey: 'lightLogo' | 'socialImage', nextUrl: string) => {
    const fieldName = assetKey === 'lightLogo' ? 'lightLogoUrl' : 'socialImageUrl';
    await brandWorkspaceApi.updateProfile({
      storefrontSettings: {
        [fieldName]: nextUrl,
      },
    });
    updateProfile({ [assetKey]: nextUrl } as any);
  };

  const handleFileUpload = async (file: File) => {
    setErrorMessage(null);
    setUploadingField(targetAssetKey);
    try {
      const res = await brandWorkspaceApi.uploadMediaFile(file);
      if (!res.ok || !res.url) {
        setErrorMessage(res.error || 'Image upload failed.');
        return;
      }
      await persistAssetUrl(targetAssetKey, res.url);
      notify(`Uploaded and saved ${targetAssetKey === 'lightLogo' ? 'Light Header Logo' : 'Social OG Cover'}.`);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to persist uploaded asset.');
    } finally {
      setUploadingField(null);
    }
  };

  const handleRemoveAsset = async (assetKey: 'lightLogo' | 'socialImage') => {
    setErrorMessage(null);
    setUploadingField(assetKey);
    try {
      await persistAssetUrl(assetKey, '');
      notify(`Removed ${assetKey === 'lightLogo' ? 'Light Header Logo' : 'Social OG Cover'}.`);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to remove brand asset.');
    } finally {
      setUploadingField(null);
    }
  };

  return (
    <PermissionGate module="brand" action="view">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Brand Verification & Extended Assets"
          title="Verification, Theme Tokens & Supplemental Media"
          subtitle="Core brand identity, contact details, primary palette, logo, showcase photo, and header style are configured in Getting Started."
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void syncFromBackend()}
                disabled={loadingProfile}
                className="gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingProfile ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Link href="/dashboard/getting-started">
                <Button variant="outline" size="sm" className="gap-1.5">
                  Core Setup <ArrowUpRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
              <PermissionGate module="brand" action="edit">
                <Button
                  size="sm"
                  onClick={() => void handleSave()}
                  disabled={saving || uploadingField !== null}
                  className="gap-1.5"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </PermissionGate>
            </div>
          }
        />

        {errorMessage && <ErrorBanner message={errorMessage} onRetry={() => void syncFromBackend()} />}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
              <SafeImage src={profile.logo} alt={profile.name} fill className="object-cover" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-extrabold text-slate-950 truncate">{profile.name}</p>
                <StatusBadge status={profile.storeStatus || 'LIVE'} />
              </div>
              <p className="text-slate-500 truncate">
                /brands/{profile.slug} • {profile.slogan || 'Core brand identity active from Getting Started'}
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
            <Link
              href="/dashboard/getting-started"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-bold"
            >
              Update Name, Colors, Logo & Style <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="flex gap-2 border-b border-slate-200 pb-3 text-xs font-bold overflow-x-auto">
          {(
            [
              ['hub', 'All Verification & Assets'],
              ['profile', 'Verification & Links'],
              ['identity', 'Extended Theme Tokens'],
              ['media', 'Supplemental Logos'],
            ] as Array<[BrandManagementTab, string]>
          ).map(([k, lbl]) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={`px-4 py-2 rounded-xl border whitespace-nowrap transition-colors ${
                tab === k ? 'bg-slate-950 text-white border-slate-950' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>

        {(tab === 'hub' || tab === 'profile') && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <SectionCard
              title="Heritage & Social Channels"
              subtitle="Synced cleanly to your tenant profile in PostgreSQL"
              className="lg:col-span-7"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Established Year</label>
                  <input
                    value={form.establishedYear}
                    onChange={(e) => setForm({ ...form, establishedYear: e.target.value })}
                    placeholder="2022"
                    maxLength={4}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-950"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Instagram Handle</label>
                  <input
                    value={form.instagram}
                    onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                    placeholder="@yourbrand"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-950"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Facebook Page</label>
                  <input
                    value={form.facebook}
                    onChange={(e) => setForm({ ...form, facebook: e.target.value })}
                    placeholder="facebook.com/yourbrand"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-950"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Official Website</label>
                  <input
                    value={form.website}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                    placeholder="https://yourbrand.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-950"
                  />
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Platform Verification Status" className="lg:col-span-5">
              <div className="space-y-3 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-slate-800">Current Badge</span>
                  <StatusBadge status={profile.verificationStatus || 'VERIFIED'} />
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-slate-600">
                  <p className="font-bold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Super Admin Reviewed
                  </p>
                  <p>
                    Verified status is issued strictly by platform governance after checking business registration ({profile.registrationNumber || 'On file'}).
                  </p>
                  <p className="font-mono text-[11px] text-slate-500 pt-1">
                    Tenant ID: {profile.id || 'local'} • Storefront: {profile.storeStatus || 'LIVE'}
                  </p>
                </div>
              </div>
            </SectionCard>
          </div>
        )}

        {(tab === 'hub' || tab === 'identity') && (
          <SectionCard
            title="Extended Surface, Typography & Button Tokens"
            subtitle="Customize secondary surface tones, typography, and button shapes alongside your Getting Started palette"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                {[
                  ['secondaryColor', 'Secondary Color'],
                  ['backgroundColor', 'Canvas Background'],
                  ['textColor', 'Body Text'],
                ].map(([k, lbl]) => (
                  <div key={k} className="p-3 rounded-xl border border-slate-200 space-y-1.5">
                    <label className="block font-bold text-slate-700">{lbl}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={(form as any)[k]}
                        onChange={(e) => setForm({ ...form, [k]: e.target.value })}
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
                    onChange={(e) => setForm({ ...form, headingFont: e.target.value })}
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
                    onChange={(e) => setForm({ ...form, bodyFont: e.target.value })}
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
                    onChange={(e) => setForm({ ...form, buttonStyle: e.target.value as any })}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold"
                  >
                    <option value="pill">Pill (Rounded Full)</option>
                    <option value="rounded">Soft Rounded</option>
                    <option value="square">Sharp Architectural</option>
                  </select>
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
                  <span className="text-[10px] font-mono">{form.headingFont}</span>
                </div>
                <h3 className="text-xl font-extrabold" style={{ fontFamily: form.headingFont }}>
                  {profile.name}
                </h3>
                <p className="text-xs opacity-80">
                  {profile.slogan || 'Storefront typography & button preview'}
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    style={{ backgroundColor: profile.primaryColor }}
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
            title="Supplemental Brand Assets"
            subtitle="Uploads save immediately to Cloudinary & PostgreSQL (main logo & showcase photo are managed in Getting Started)"
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
              {(
                [
                  ['lightLogo', 'Light Header Watermark Logo', '400×400 px • Transparent PNG'],
                  ['socialImage', 'Social Open Graph Share Cover', '1200×630 px • < 5MB'],
                ] as Array<['lightLogo' | 'socialImage', string, string]>
              ).map(([assetKey, label, dims]) => {
                const src = assetKey === 'lightLogo' ? profile.lightLogo : profile.socialImage;
                const isBusy = uploadingField === assetKey;
                return (
                  <div key={assetKey} className="rounded-2xl border border-slate-200 p-4 space-y-3 bg-slate-50/70">
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
                          {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                          {isBusy ? 'Saving...' : src ? 'Replace' : 'Upload Photo'}
                        </Button>
                      </div>
                    </div>

                    {src ? (
                      <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-white border border-slate-200">
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
                        className="w-full aspect-[16/9] rounded-xl border-2 border-dashed border-slate-300 bg-white hover:border-slate-500 flex flex-col items-center justify-center gap-1.5 text-slate-500 transition-colors"
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
