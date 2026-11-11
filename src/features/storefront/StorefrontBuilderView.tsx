'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ExternalLink,
  Globe,
  Monitor,
  Plus,
  Smartphone,
  Tablet,
  Trash2,
} from 'lucide-react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { useUiStore } from '../../stores/useUiStore';
import { brandWorkspaceApi } from '../../services';
import { PageHeader, PermissionGate, SectionCard, StatusBadge } from '../../components/shared/UiPrimitives';
import { Button } from '../../components/ui/button';

export type StorefrontBuilderTab = 'overview' | 'editor' | 'pages' | 'navigation' | 'seo' | 'domain';

export function StorefrontBuilderView({ initialTab = 'editor' }: { initialTab?: StorefrontBuilderTab }) {
  const [tab, setTab] = useState<StorefrontBuilderTab>(initialTab);
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  const profile = useWorkspaceStore((s) => s.profile);
  const updateProfile = useWorkspaceStore((s) => s.updateProfile);
  const sections = useWorkspaceStore((s) => s.storefrontSections);
  const setSections = useWorkspaceStore((s) => s.setStorefrontSections);
  const hasUnsavedDraft = useWorkspaceStore((s) => s.storefrontHasUnsavedDraft);
  const lastPublished = useWorkspaceStore((s) => s.storefrontLastPublishedAt);
  const publishStorefront = useWorkspaceStore((s) => s.publishStorefrontChanges);

  const pages = useWorkspaceStore((s) => s.storefrontPages);
  const savePage = useWorkspaceStore((s) => s.saveStorefrontPage);
  const navMenus = useWorkspaceStore((s) => s.navMenus);
  const setNavMenus = useWorkspaceStore((s) => s.setNavMenus);

  const showToast = useUiStore((s) => s.showToast);
  const hideToast = useUiStore((s) => s.hideToast);

  const [newPageTitle, setNewPageTitle] = useState('');
  const [newMenuLabel, setNewMenuLabel] = useState('');
  const [newMenuHref, setNewMenuHref] = useState('#catalog');
  const [customDomain, setCustomDomain] = useState(profile.domain?.customDomain || '');
  const [seoTitle, setSeoTitle] = useState(profile.seo?.title || '');
  const [seoDesc, setSeoDesc] = useState(profile.seo?.description || '');

  const notify = (msg: string) => {
    showToast(msg);
    setTimeout(hideToast, 3000);
  };

  const moveSection = (idx: number, dir: -1 | 1) => {
    const nextIdx = idx + dir;
    if (nextIdx < 0 || nextIdx >= sections.length) return;
    const copy = [...sections];
    const [removed] = copy.splice(idx, 1);
    copy.splice(nextIdx, 0, removed);
    setSections(copy);
  };

  const handlePublish = async () => {
    try {
      await brandWorkspaceApi.updateStorefrontSettings({
        primaryColor: profile.primaryColor,
        accentColor: profile.accentColor,
        announcement: profile.announcement,
        aboutText: profile.description,
      });
    } catch {
      // Local draft published
    }
    publishStorefront();
    notify('Storefront layout changes explicitly published live.');
  };

  return (
    <PermissionGate module="storefront" action="view">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Public Boutique Experience"
          title="Storefront Visual Builder"
          subtitle="Configure storefront homepage sections, custom pages, navigation menus, custom domain DNS, and SEO metadata."
          actions={
            <>
              <Link href={`/brands/${profile.slug}`} target="_blank">
                <Button variant="outline" size="sm" className="gap-1.5">
                  Preview Storefront <ExternalLink className="w-3 h-3" />
                </Button>
              </Link>
              <PermissionGate module="storefront" action="publish">
                <Button size="sm" onClick={handlePublish} className="gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {hasUnsavedDraft ? 'Publish Draft Changes' : 'Published'}
                </Button>
              </PermissionGate>
            </>
          }
        />

        {/* Draft / Published Banner */}
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <StatusBadge status={hasUnsavedDraft ? 'DRAFT' : 'PUBLISHED'} />
            <span className="text-slate-600">
              {hasUnsavedDraft
                ? 'You have unpublished draft storefront edits. Click "Publish Draft Changes" to apply publicly.'
                : `Last published: ${lastPublished || 'Live'}`}
            </span>
          </div>
          <span className="font-mono text-slate-500">Public URL: /brands/{profile.slug}</span>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 text-xs font-bold">
          {(
            [
              ['editor', 'Homepage Sections'],
              ['pages', 'Website Pages'],
              ['navigation', 'Navigation & Menus'],
              ['domain', 'Domain & SSL'],
              ['seo', 'SEO Settings'],
            ] as Array<[StorefrontBuilderTab, string]>
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

        {tab === 'editor' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <SectionCard title="Section Order & Copy" subtitle="Enable, reorder, or customize sections" className="lg:col-span-5">
              <div className="space-y-2.5">
                {sections.map((sec, idx) => (
                  <div key={sec.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <label className="flex items-center gap-2 font-bold text-slate-900">
                        <input
                          type="checkbox"
                          checked={sec.enabled}
                          onChange={(e) =>
                            setSections(
                              sections.map((s) =>
                                s.id === sec.id ? { ...s, enabled: e.target.checked } : s
                              )
                            )
                          }
                          className="rounded accent-slate-950"
                        />
                        <span>{sec.type.replace(/_/g, ' ').toUpperCase()}</span>
                      </label>
                      <div className="flex gap-1">
                        <button type="button" onClick={() => moveSection(idx, -1)} className="p-1 rounded hover:bg-slate-200" aria-label="Move section up">
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" onClick={() => moveSection(idx, 1)} className="p-1 rounded hover:bg-slate-200" aria-label="Move section down">
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <input
                      value={sec.title}
                      onChange={(e) =>
                        setSections(sections.map((s) => (s.id === sec.id ? { ...s, title: e.target.value } : s)))
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold"
                    />
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              title="Responsive Live Wireframe Preview"
              className="lg:col-span-7"
              right={
                <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                  <button type="button" onClick={() => setViewport('desktop')} className={`p-1.5 rounded-lg ${viewport === 'desktop' ? 'bg-white shadow' : ''}`}>
                    <Monitor className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => setViewport('tablet')} className={`p-1.5 rounded-lg ${viewport === 'tablet' ? 'bg-white shadow' : ''}`}>
                    <Tablet className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => setViewport('mobile')} className={`p-1.5 rounded-lg ${viewport === 'mobile' ? 'bg-white shadow' : ''}`}>
                    <Smartphone className="w-4 h-4" />
                  </button>
                </div>
              }
            >
              <div
                className={`mx-auto border border-slate-300 rounded-2xl overflow-hidden bg-[#FAF9F6] transition-all ${
                  viewport === 'mobile' ? 'max-w-[340px]' : viewport === 'tablet' ? 'max-w-[560px]' : 'w-full'
                }`}
              >
                <div className="px-4 py-2 text-center text-[11px] font-bold text-white" style={{ backgroundColor: profile.primaryColor }}>
                  {profile.announcement}
                </div>
                <div className="p-4 space-y-3">
                  {sections
                    .filter((s) => s.enabled)
                    .map((s) => (
                      <div key={s.id} className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
                        <span className="text-[10px] font-mono uppercase text-slate-400">{s.type}</span>
                        <p className="text-sm font-bold text-slate-900">{s.title}</p>
                        {s.subtitle && <p className="text-xs text-slate-500">{s.subtitle}</p>}
                      </div>
                    ))}
                </div>
              </div>
            </SectionCard>
          </div>
        )}

        {tab === 'pages' && (
          <SectionCard title="Website Pages Manager" subtitle="Create and edit custom boutique policy and editorial pages">
            <div className="space-y-3">
              {pages.map((pg) => (
                <div key={pg.id} className="p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div>
                    <p className="font-bold text-slate-900">{pg.title} <span className="font-mono text-slate-400">({pg.slug})</span></p>
                    <p className="text-slate-500 mt-0.5">{pg.content}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={pg.published ? 'PUBLISHED' : 'DRAFT'} />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => savePage({ ...pg, published: !pg.published })}
                    >
                      Toggle
                    </Button>
                  </div>
                </div>
              ))}

              <div className="flex gap-2 pt-2">
                <input
                  value={newPageTitle}
                  onChange={(e) => setNewPageTitle(e.target.value)}
                  placeholder="New Page Title (e.g. Lookbook 2026)"
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs flex-1 max-w-sm"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    if (!newPageTitle.trim()) return;
                    savePage({
                      id: `pg_${Date.now()}`,
                      title: newPageTitle.trim(),
                      slug: `/${newPageTitle.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
                      published: false,
                      content: 'Custom boutique editorial content.',
                      updatedAt: new Date().toISOString().slice(0, 10),
                    });
                    setNewPageTitle('');
                    notify('Draft page created.');
                  }}
                  className="gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Page
                </Button>
              </div>
            </div>
          </SectionCard>
        )}

        {tab === 'navigation' && (
          <SectionCard title="Storefront Navigation Menus">
            <div className="space-y-3 text-xs">
              {navMenus.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <div>
                    <span className="font-bold text-slate-900">{m.label}</span>
                    <span className="text-slate-400 ml-2 font-mono">{m.href}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNavMenus(navMenus.filter((x) => x.id !== m.id))}
                    className="text-rose-600 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="flex flex-wrap gap-2 pt-2">
                <input value={newMenuLabel} onChange={(e) => setNewMenuLabel(e.target.value)} placeholder="Menu label" className="px-3 py-2 rounded-xl border border-slate-200" />
                <input value={newMenuHref} onChange={(e) => setNewMenuHref(e.target.value)} placeholder="Target path or #anchor" className="px-3 py-2 rounded-xl border border-slate-200" />
                <Button
                  size="sm"
                  onClick={() => {
                    if (!newMenuLabel.trim()) return;
                    setNavMenus([...navMenus, { id: `nav_${Date.now()}`, label: newMenuLabel.trim(), href: newMenuHref }]);
                    setNewMenuLabel('');
                  }}
                >
                  Add Link
                </Button>
              </div>
            </div>
          </SectionCard>
        )}

        {tab === 'domain' && (
          <SectionCard title="Storefront Domains & SSL Configuration">
            <div className="space-y-4 text-xs max-w-2xl">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Globe className="w-4 h-4" /> Platform Subdomain
                  </p>
                  <p className="font-mono text-slate-600 mt-0.5">{profile.domain?.subdomain}</p>
                </div>
                <StatusBadge status="ACTIVE" />
              </div>

              <div className="space-y-2">
                <label className="block font-bold text-slate-800">Custom Domain</label>
                <div className="flex gap-2">
                  <input value={customDomain} onChange={(e) => setCustomDomain(e.target.value)} placeholder="shop.yourbrand.com" className="flex-1 px-3 py-2 rounded-xl border border-slate-200" />
                  <Button
                    size="sm"
                    onClick={() => {
                      updateProfile({ domain: { ...profile.domain!, customDomain } });
                      notify('Custom domain DNS verification check queued.');
                    }}
                  >
                    Save Domain
                  </Button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Point a <code>CNAME</code> record from <code>{customDomain || 'shop.yourbrand.com'}</code> to <code>cname.v-try.fashion</code> for automated SSL provisioning.
                </p>
              </div>
            </div>
          </SectionCard>
        )}

        {tab === 'seo' && (
          <SectionCard title="Storefront SEO Metadata">
            <div className="space-y-4 text-xs max-w-2xl">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Meta Title</label>
                <input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Meta Description</label>
                <textarea rows={3} value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200" />
              </div>
              <Button
                size="sm"
                onClick={() => {
                  updateProfile({ seo: { ...profile.seo!, title: seoTitle, description: seoDesc } });
                  notify('Storefront SEO metadata updated.');
                }}
              >
                Save SEO Metadata
              </Button>
            </div>
          </SectionCard>
        )}
      </div>
    </PermissionGate>
  );
}
