'use client';

import React, { useRef, useState } from 'react';
import { Check, Palette, ShieldCheck, Upload } from 'lucide-react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { useUiStore } from '../../stores/useUiStore';
import { brandWorkspaceApi } from '../../services';
import { PageHeader, PermissionGate, SafeImage, SectionCard, StatusBadge } from '../../components/shared/UiPrimitives';
import { Button } from '../../components/ui/button';

export type BrandManagementTab = 'hub' | 'profile' | 'identity' | 'media';

export function BrandManagementView({ initialTab = 'hub' }: { initialTab?: BrandManagementTab }) {
  const [tab, setTab] = useState<BrandManagementTab>(initialTab);
  const profile = useWorkspaceStore((s) => s.profile);
  const updateProfile = useWorkspaceStore((s) => s.updateProfile);
  const showToast = useUiStore((s) => s.showToast);
  const hideToast = useUiStore((s) => s.hideToast);

  const [form, setForm] = useState({
    name: profile.name,
    slug: profile.slug,
    slogan: profile.slogan || '',
    shortDescription: profile.shortDescription || '',
    description: profile.description || '',
    brandStory: profile.brandStory || '',
    categoryFocus: profile.categoryFocus || '',
    establishedYear: profile.establishedYear || '2022',
    email: profile.email,
    phone: profile.phone || '',
    address: profile.address || '',
    country: profile.country || '',
    instagram: profile.socialLinks?.instagram || '',
    website: profile.socialLinks?.website || '',
    primaryColor: profile.primaryColor,
    secondaryColor: profile.secondaryColor || '#334155',
    accentColor: profile.accentColor || '#0F172A',
    backgroundColor: profile.backgroundColor || '#FAF9F6',
    textColor: profile.textColor || '#0F172A',
    headingFont: profile.headingFont || 'Plus Jakarta Sans',
    bodyFont: profile.bodyFont || 'Plus Jakarta Sans',
    buttonStyle: profile.buttonStyle || 'pill',
  });

  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [targetAssetKey, setTargetAssetKey] = useState<'logo' | 'lightLogo' | 'darkLogo' | 'banner' | 'socialImage'>('logo');

  const notify = (msg: string) => {
    showToast(msg);
    setTimeout(hideToast, 3000);
  };

  const handleSave = async () => {
    updateProfile({
      name: form.name,
      slug: form.slug,
      slogan: form.slogan,
      shortDescription: form.shortDescription,
      description: form.description,
      brandStory: form.brandStory,
      categoryFocus: form.categoryFocus,
      establishedYear: form.establishedYear,
      email: form.email,
      phone: form.phone,
      address: form.address,
      country: form.country,
      primaryColor: form.primaryColor,
      secondaryColor: form.secondaryColor,
      accentColor: form.accentColor,
      backgroundColor: form.backgroundColor,
      textColor: form.textColor,
      headingFont: form.headingFont,
      bodyFont: form.bodyFont,
      buttonStyle: form.buttonStyle as any,
      socialLinks: { instagram: form.instagram, website: form.website },
    });

    try {
      await brandWorkspaceApi.updateProfile({
        name: form.name,
        description: form.description,
        contactEmail: form.email,
        logoUrl: profile.logo,
        bannerUrl: profile.banner,
        storefrontSettings: {
          primaryColor: form.primaryColor,
          accentColor: form.accentColor,
          aboutText: form.brandStory,
        },
      });
      notify('Brand profile & theme saved to backend.');
    } catch {
      notify('Brand profile saved locally in workspace.');
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploadingField(targetAssetKey);
    const res = await brandWorkspaceApi.uploadMediaFile(file);
    setUploadingField(null);
    if (!res.ok || !res.url) {
      notify(res.error || 'Upload failed.');
      return;
    }
    updateProfile({ [targetAssetKey]: res.url } as any);
    notify(`Uploaded ${targetAssetKey} (${res.provider}).`);
  };

  return (
    <PermissionGate module="brand" action="view">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Brand Management"
          title="Brand Profile, Visual Identity & Media"
          subtitle="Manage public brand storytelling, uploaded logos/banners, typography tokens, and platform verification review."
          actions={
            <PermissionGate module="brand" action="edit">
              <Button size="sm" onClick={handleSave} className="gap-1.5">
                <Check className="w-3.5 h-3.5" /> Save Changes
              </Button>
            </PermissionGate>
          }
        />

        <div className="flex gap-2 border-b border-slate-200 pb-3 text-xs font-bold overflow-x-auto">
          {(
            [
              ['hub', 'Overview'],
              ['profile', 'Brand Profile'],
              ['identity', 'Colors & Typography'],
              ['media', 'Logos & Media Library'],
            ] as Array<[BrandManagementTab, string]>
          ).map(([k, lbl]) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={`px-4 py-2 rounded-xl border whitespace-nowrap ${
                tab === k ? 'bg-slate-950 text-white border-slate-950' : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>

        {(tab === 'hub' || tab === 'profile') && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <SectionCard title="Public Brand Details" className="lg:col-span-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Brand Name *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Storefront Slug</label>
                  <input value={form.slug} readOnly className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-500" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Brand Slogan</label>
                  <input value={form.slogan} onChange={(e) => setForm({ ...form, slogan: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Public Description</label>
                  <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Brand Story</label>
                  <textarea rows={3} value={form.brandStory} onChange={(e) => setForm({ ...form, brandStory: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Business Email</label>
                  <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Instagram Handle</label>
                  <input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Established Year</label>
                  <input value={form.establishedYear} onChange={(e) => setForm({ ...form, establishedYear: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200" />
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Platform Verification Status" className="lg:col-span-4">
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Current Badge</span>
                  <StatusBadge status={profile.verificationStatus || 'VERIFIED'} />
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-slate-600">
                  <p className="font-bold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Super Admin Reviewed
                  </p>
                  <p>
                    Verified status is issued strictly by platform governance after checking business registration ({profile.registrationNumber || 'On file'}). Brand owners cannot self-assign verification.
                  </p>
                </div>
              </div>
            </SectionCard>
          </div>
        )}

        {(tab === 'hub' || tab === 'identity') && (
          <SectionCard title="Colors, Typography & Live Storefront Preview">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
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
                        onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                        className="w-10 h-8 rounded cursor-pointer border border-slate-200"
                      />
                      <span className="font-mono text-[11px]">{(form as any)[k]}</span>
                    </div>
                  </div>
                ))}
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

              {/* Live Brand Theme Preview */}
              <div
                className="lg:col-span-5 rounded-2xl border border-slate-200 p-6 space-y-3"
                style={{ backgroundColor: form.backgroundColor, color: form.textColor }}
              >
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider opacity-70">
                  <Palette className="w-3.5 h-3.5" /> Live Token Preview
                </div>
                <h3 className="text-xl font-extrabold">{form.name}</h3>
                <p className="text-xs opacity-80">{form.slogan}</p>
                <button
                  type="button"
                  style={{ backgroundColor: form.primaryColor }}
                  className={`px-4 py-2 text-xs font-bold text-white ${
                    form.buttonStyle === 'pill' ? 'rounded-full' : form.buttonStyle === 'square' ? 'rounded-none' : 'rounded-xl'
                  }`}
                >
                  Shop Collection
                </button>
              </div>
            </div>
          </SectionCard>
        )}

        {(tab === 'hub' || tab === 'media') && (
          <SectionCard title="Brand Logos & Editorial Banners" subtitle="Supports PNG/JPG/WebP uploads up to 10MB via Cloudinary">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              {(
                [
                  ['logo', 'Main Brand Logo', '400×400 px • < 2MB'],
                  ['lightLogo', 'Light Header Logo', '400×400 px • Transparent PNG'],
                  ['banner', 'Storefront Cover Banner', '1600×640 px • < 5MB'],
                  ['socialImage', 'Social Open Graph Cover', '1200×630 px'],
                ] as Array<['logo' | 'lightLogo' | 'banner' | 'socialImage', string, string]>
              ).map(([assetKey, label, dims]) => {
                const src = (profile as any)[assetKey] || profile.logo;
                return (
                  <div key={assetKey} className="rounded-2xl border border-slate-200 p-3 space-y-3 bg-slate-50/70">
                    <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-white border border-slate-200">
                      <SafeImage src={src} alt={label} fill className="object-cover" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{label}</p>
                      <p className="text-[11px] text-slate-500">{dims}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={uploadingField === assetKey}
                      onClick={() => {
                        setTargetAssetKey(assetKey);
                        fileRef.current?.click();
                      }}
                      className="w-full gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {uploadingField === assetKey ? 'Uploading...' : 'Replace Image'}
                    </Button>
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

