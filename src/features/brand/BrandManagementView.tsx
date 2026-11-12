'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Check, Palette, ShieldCheck, Upload } from 'lucide-react';
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
    establishedYear: profile.establishedYear || '2022',
    instagram: profile.socialLinks?.instagram || '',
    website: profile.socialLinks?.website || '',
    secondaryColor: profile.secondaryColor || '#334155',
    backgroundColor: profile.backgroundColor || '#FAF9F6',
    textColor: profile.textColor || '#0F172A',
    headingFont: profile.headingFont || 'Plus Jakarta Sans',
    bodyFont: profile.bodyFont || 'Plus Jakarta Sans',
    buttonStyle: profile.buttonStyle || 'pill',
  });

  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [targetAssetKey, setTargetAssetKey] = useState<'lightLogo' | 'socialImage'>('lightLogo');

  const notify = (msg: string) => {
    showToast(msg);
    setTimeout(hideToast, 3000);
  };

  const handleSave = async () => {
    updateProfile({
      establishedYear: form.establishedYear,
      secondaryColor: form.secondaryColor,
      backgroundColor: form.backgroundColor,
      textColor: form.textColor,
      headingFont: form.headingFont,
      bodyFont: form.bodyFont,
      buttonStyle: form.buttonStyle as any,
      socialLinks: {
        ...(profile.socialLinks || {}),
        instagram: form.instagram,
        website: form.website,
      },
    });

    try {
      await brandWorkspaceApi.updateProfile({
        name: profile.name,
        description: profile.description,
        contactEmail: profile.email,
        logoUrl: profile.logo,
        bannerUrl: profile.banner,
        storefrontSettings: {
          primaryColor: profile.primaryColor,
          accentColor: profile.accentColor,
          aboutText: profile.brandStory || profile.description,
          socialLinks: {
            ...(profile.socialLinks || {}),
            instagram: form.instagram,
            website: form.website,
          },
        },
      });
      notify('Brand verification details & extended tokens saved.');
    } catch {
      notify('Saved locally in workspace.');
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
          eyebrow="Brand Verification & Extended Assets"
          title="Verification, Theme Tokens & Supplemental Media"
          subtitle="Core brand profile, business info, primary colors, storefront design, logo, and showcase photo are configured in Getting Started."
          actions={
            <div className="flex items-center gap-2">
              <Link href="/dashboard/getting-started">
                <Button variant="outline" size="sm" className="gap-1.5">
                  Edit Core Setup <ArrowUpRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
              <PermissionGate module="brand" action="edit">
                <Button size="sm" onClick={handleSave} className="gap-1.5">
                  <Check className="w-3.5 h-3.5" /> Save Changes
                </Button>
              </PermissionGate>
            </div>
          }
        />

        <div className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
              <SafeImage src={profile.logo} alt={profile.name} fill className="object-cover" />
            </div>
            <div className="min-w-0">
              <p className="font-extrabold text-slate-950 truncate">{profile.name}</p>
              <p className="text-slate-500 truncate">
                /{profile.slug} • {profile.slogan || 'Core brand identity active from Getting Started'}
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/getting-started"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 text-white font-bold shrink-0 self-start sm:self-auto"
          >
            Update Name, Colors, Logo & Style <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
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
            <SectionCard title="Additional Heritage & Web Links" subtitle="Supplemental links not covered in initial onboarding" className="lg:col-span-7">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Established Year</label>
                  <input value={form.establishedYear} onChange={(e) => setForm({ ...form, establishedYear: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Instagram Handle</label>
                  <input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Official Website</label>
                  <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200" />
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
                    Verified status is issued strictly by platform governance after checking business registration ({profile.registrationNumber || 'On file'}). Brand owners cannot self-assign verification.
                  </p>
                </div>
              </div>
            </SectionCard>
          </div>
        )}

        {(tab === 'hub' || tab === 'identity') && (
          <SectionCard title="Extended Surface & Button Tokens" subtitle="Fine-tune secondary canvas colors and button shapes alongside your primary Getting Started palette">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
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

              <div
                className="lg:col-span-5 rounded-2xl border border-slate-200 p-6 space-y-3"
                style={{ backgroundColor: form.backgroundColor, color: form.textColor }}
              >
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider opacity-70">
                  <Palette className="w-3.5 h-3.5" /> Live Token Preview
                </div>
                <h3 className="text-xl font-extrabold">{profile.name}</h3>
                <p className="text-xs opacity-80">{profile.slogan || 'Storefront typography & button preview'}</p>
                <button
                  type="button"
                  style={{ backgroundColor: profile.primaryColor }}
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
          <SectionCard title="Supplemental Brand Assets" subtitle="Light header watermark & Open Graph social share cover (main logo & showcase photo are in Getting Started)">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {(
                [
                  ['lightLogo', 'Light Header Watermark Logo', '400×400 px • Transparent PNG'],
                  ['socialImage', 'Social Open Graph Share Cover', '1200×630 px • < 5MB'],
                ] as Array<['lightLogo' | 'socialImage', string, string]>
              ).map(([assetKey, label, dims]) => {
                const src = (profile as any)[assetKey] || profile.logo;
                return (
                  <div key={assetKey} className="rounded-2xl border border-slate-200 p-3 space-y-3 bg-slate-50/70">
                    <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-white border border-slate-200">
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

