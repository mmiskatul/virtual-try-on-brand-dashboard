'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Upload,
} from 'lucide-react';
import { TryOnCategory } from '../../types';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { useUiStore } from '../../stores/useUiStore';
import { brandWorkspaceApi } from '../../services';
import {
  EmptyState,
  KpiCard,
  PageHeader,
  PermissionGate,
  SafeImage,
  SectionCard,
  StatusBadge,
  SvgBarChart,
} from '../../components/shared/UiPrimitives';
import { Button } from '../../components/ui/button';

export type TryOnTab =
  | 'overview'
  | 'studio'
  | 'configuration'
  | 'products'
  | 'appearance'
  | 'embedding'
  | 'history'
  | 'analytics'
  | 'privacy';

const SAMPLE_STUDIO_MODELS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
];

export function VirtualTryOnManagementView({ initialTab = 'overview' }: { initialTab?: TryOnTab }) {
  const [tab, setTab] = useState<TryOnTab>(initialTab);
  const profile = useWorkspaceStore((s) => s.profile);
  const products = useWorkspaceStore((s) => s.products);
  const updateProduct = useWorkspaceStore((s) => s.updateProduct);
  const tryOnConfig = useWorkspaceStore((s) => s.tryOnConfig);
  const updateTryOnConfig = useWorkspaceStore((s) => s.updateTryOnConfig);
  const sessions = useWorkspaceStore((s) => s.tryOnSessions);
  const addTryOnSession = useWorkspaceStore((s) => s.addTryOnSession);

  const showToast = useUiStore((s) => s.showToast);
  const hideToast = useUiStore((s) => s.hideToast);

  const [engineInfo, setEngineInfo] = useState<{ connected: boolean; mode: string; provider: string }>({
    connected: false,
    mode: 'checking',
    provider: 'checking',
  });
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Appearance local editor copy
  const [appearance, setAppearance] = useState(tryOnConfig.appearance);
  const [allowlistDomain, setAllowlistDomain] = useState('');

  // Studio Testbench state
  const eligibleProducts = useMemo(
    () => products.filter((p) => p.isTryOnEligible && p.includeInBrandTryOn !== false),
    [products]
  );
  const [studioProductId, setStudioProductId] = useState(eligibleProducts[0]?.id || products[0]?.id || '');
  const [studioPersonImg, setStudioPersonImg] = useState(SAMPLE_STUDIO_MODELS[0]);
  const [studioPhase, setStudioPhase] = useState<'idle' | 'processing' | 'done' | 'failed'>('idle');
  const [studioResultUrl, setStudioResultUrl] = useState('');
  const [studioMessage, setStudioMessage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    brandWorkspaceApi
      .getTryOnProviderStatus()
      .then((res) =>
        setEngineInfo({ connected: true, mode: res.mode, provider: res.provider })
      )
      .catch(() =>
        setEngineInfo({ connected: false, mode: 'offline', provider: 'unavailable' })
      );
  }, []);

  const notify = (msg: string) => {
    showToast(msg);
    setTimeout(hideToast, 3000);
  };

  const publicTryOnUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/try/${profile.slug}`
      : `/try/${profile.slug}`;

  const activeStudioProduct =
    eligibleProducts.find((p) => p.id === studioProductId) || eligibleProducts[0];

  const handleCopyUrl = async () => {
    if (typeof navigator === 'undefined') return;
    await navigator.clipboard.writeText(publicTryOnUrl).catch(() => {});
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleRunStudioTest = async () => {
    if (!activeStudioProduct) return;
    setStudioPhase('processing');
    setStudioMessage(null);
    const start = Date.now();
    const res = await brandWorkspaceApi.executeTryOn({
      productId: activeStudioProduct.id,
      personImage: studioPersonImg,
      garmentImage: activeStudioProduct.image,
      category: activeStudioProduct.tryOnCategory || 'tops',
    });
    const dur = Date.now() - start;

    if (res.mode === 'live_ai' && res.resultUrl) {
      setStudioResultUrl(res.resultUrl);
      setStudioPhase('done');
      addTryOnSession({
        id: `gen_${Date.now()}`,
        tenantId: profile.id || 'tenant_aura',
        productId: activeStudioProduct.id,
        productName: activeStudioProduct.name,
        category: activeStudioProduct.tryOnCategory,
        status: 'COMPLETED',
        durationMs: dur,
        creditsUsed: 1,
        createdAt: new Date().toLocaleString(),
      });
    } else {
      setStudioPhase('failed');
      setStudioMessage(
        res.message ||
          'Backend AI synthesis did not complete (product not published in live DB or AI engine offline). Live synthesis is never simulated in production.'
      );
      addTryOnSession({
        id: `gen_${Date.now()}`,
        tenantId: profile.id || 'tenant_aura',
        productId: activeStudioProduct.id,
        productName: activeStudioProduct.name,
        category: activeStudioProduct.tryOnCategory,
        status: 'FAILED',
        durationMs: dur,
        creditsUsed: 0,
        errorReason: res.message || 'Backend engine unavailable',
        createdAt: new Date().toLocaleString(),
      });
    }
  };

  const completedCount = sessions.filter((s) => s.status === 'COMPLETED').length;
  const failedCount = sessions.filter((s) => s.status === 'FAILED').length;
  const successRate =
    sessions.length > 0 ? `${Math.round((completedCount / sessions.length) * 100)}%` : '0%';
  const avgDurationSec =
    sessions.length > 0
      ? (sessions.reduce((sum, s) => sum + s.durationMs, 0) / sessions.length / 1000).toFixed(2)
      : '0.00';

  const embedSnippet = `<script src="https://cdn.v-try.fashion/widget.js" data-brand="${profile.slug}" data-accent="${tryOnConfig.appearance.accentColor}"></script>`;

  return (
    <PermissionGate module="tryon" action="view">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Core Platform Differentiator"
          title="Brand Virtual Try-On Studio & Settings"
          subtitle={`Manage your isolated public fitting experience at /try/${profile.slug}, garment eligibility, theme, embed widget, and privacy rules.`}
          actions={
            <>
              <Button variant="outline" size="sm" onClick={handleCopyUrl} className="gap-1.5">
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedUrl ? 'Copied Try-On URL' : 'Copy Public URL'}
              </Button>
              <Link href={`/try/${profile.slug}`} target="_blank">
                <Button size="sm" className="gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Open Public Try-On <ExternalLink className="w-3 h-3" />
                </Button>
              </Link>
            </>
          }
        />

        {/* Engine Connection Strip */}
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className={`w-2.5 h-2.5 rounded-full ${engineInfo.connected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span className="font-bold text-slate-900">
              {engineInfo.connected
                ? `Connected to Platform AI Service (${engineInfo.mode})`
                : 'AI Service Offline (Check Docker vton-backend :4000 -> vton-ai-service :8000)'}
            </span>
          </div>
          <span className="font-mono text-slate-500">
            Public Route: <code>/try/{profile.slug}</code>
          </span>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 text-xs font-bold">
          {(
            [
              ['overview', 'Overview'],
              ['studio', 'Test Studio'],
              ['products', `Garment Eligibility (${eligibleProducts.length})`],
              ['appearance', 'Appearance Editor'],
              ['configuration', 'AI Configuration'],
              ['embedding', 'Widget & Embed'],
              ['history', 'Generation History'],
              ['analytics', 'Try-On Analytics'],
              ['privacy', 'Privacy Controls'],
            ] as Array<[TryOnTab, string]>
          ).map(([k, lbl]) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={`px-3.5 py-2 rounded-xl border whitespace-nowrap ${
                tab === k ? 'bg-slate-950 text-white border-slate-950' : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <KpiCard label="Eligible Garments" value={eligibleProducts.length} change={`of ${products.length} total`} icon={<Sparkles className="w-4 h-4 text-amber-600" />} />
              <KpiCard label="Total Sessions" value={sessions.length} change={`${completedCount} completed`} icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />} />
              <KpiCard label="Success Rate" value={successRate} change={`${failedCount} failed`} icon={<RefreshCw className="w-4 h-4" />} />
              <KpiCard label="Credits Consumed" value={profile.quotaUsed} change={`${profile.quotaMax - profile.quotaUsed} left`} icon={<ShieldCheck className="w-4 h-4" />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SectionCard title="Dedicated Brand Try-On Link" subtitle="Zero cross-brand leakage: shoppers here only try on items belonging strictly to your brand">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">Try-On Feature Status</span>
                    <StatusBadge status={tryOnConfig.enabled ? 'ACTIVE' : 'PAUSED'} />
                  </div>
                  <p className="font-mono text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 truncate">
                    {publicTryOnUrl}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => setTab('studio')}>Test Generation</Button>
                    <Button size="sm" variant="outline" onClick={() => setTab('appearance')}>Customize Look</Button>
                    <Button size="sm" variant="outline" onClick={() => setTab('products')}>Manage Products</Button>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Most Tried-On Garments" subtitle="Based on recorded generation sessions">
                <div className="space-y-2.5 text-xs">
                  {eligibleProducts.slice(0, 4).map((p) => (
                    <div key={p.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <span className="font-bold text-slate-900 truncate">{p.name}</span>
                      <span className="font-mono text-slate-500">{p.tryOnCategory}</span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>
          </div>
        )}

        {tab === 'studio' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <SectionCard title="1. Customer Subject Photo" className="lg:col-span-4">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const up = await brandWorkspaceApi.uploadMediaFile(file);
                  if (up.ok && up.url) setStudioPersonImg(up.url);
                }}
              />
              <div className="space-y-3 text-xs">
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                  <SafeImage src={studioPersonImg} alt="Test subject" fill className="object-cover" />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} className="flex-1 gap-1.5">
                    <Upload className="w-3.5 h-3.5" /> Upload Photo
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setStudioPersonImg(
                        studioPersonImg === SAMPLE_STUDIO_MODELS[0]
                          ? SAMPLE_STUDIO_MODELS[1]
                          : SAMPLE_STUDIO_MODELS[0]
                      )
                    }
                  >
                    Switch Preset
                  </Button>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="2. AI Output Stage" className="lg:col-span-4">
              {studioPhase === 'processing' ? (
                <div className="aspect-[3/4] rounded-2xl bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center space-y-2">
                  <Sparkles className="w-8 h-8 text-amber-300 animate-pulse" />
                  <p className="font-bold text-sm">{tryOnConfig.appearance.loadingText}</p>
                </div>
              ) : studioPhase === 'done' && studioResultUrl ? (
                <div className="space-y-3">
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-slate-100 border border-emerald-300">
                    <SafeImage src={studioResultUrl} alt="Live AI result" fill className="object-cover" />
                  </div>
                  <p className="text-xs font-bold text-emerald-700">Live Backend AI Result Received</p>
                </div>
              ) : studioPhase === 'failed' ? (
                <div className="aspect-[3/4] rounded-2xl border border-rose-200 bg-rose-50/50 p-6 flex flex-col items-center justify-center text-center space-y-3 text-xs">
                  <AlertTriangle className="w-8 h-8 text-rose-600" />
                  <p className="font-bold text-slate-900">Generation Did Not Complete</p>
                  <p className="text-slate-600">{studioMessage}</p>
                  <Button size="sm" onClick={handleRunStudioTest}>Retry Request</Button>
                </div>
              ) : (
                <div className="aspect-[3/4] rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center p-6 text-center text-xs text-slate-500">
                  Select a garment on the right and press Generate to dispatch an authentic job via <code>/api/v1/try-on/direct</code>.
                </div>
              )}
            </SectionCard>

            <SectionCard title={`3. ${profile.name} Garments`} className="lg:col-span-4">
              <div className="space-y-3 text-xs">
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {eligibleProducts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setStudioProductId(p.id)}
                      className={`w-full text-left p-2.5 rounded-xl border flex items-center gap-3 ${
                        activeStudioProduct?.id === p.id
                          ? 'border-slate-950 bg-slate-100 font-bold'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="relative w-10 h-12 rounded-lg overflow-hidden shrink-0">
                        <SafeImage src={p.image} alt={p.name} fill className="object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-slate-900">{p.name}</p>
                        <p className="text-[11px] text-slate-500">৳{p.price} • {p.tryOnCategory}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <Button onClick={handleRunStudioTest} disabled={!activeStudioProduct || studioPhase === 'processing'} className="w-full gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  {tryOnConfig.appearance.generateBtnText}
                </Button>
              </div>
            </SectionCard>
          </div>
        )}

        {tab === 'products' && (
          <SectionCard
            title="Garment Virtual Try-On Eligibility"
            subtitle="Enable/disable AI try-on per garment or in bulk and verify image category compatibility"
            right={
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => { products.forEach((p) => updateProduct(p.id, { isTryOnEligible: true })); notify('Enabled Try-On across all garments.'); }}>
                  Enable All
                </Button>
              </div>
            }
          >
            <div className="sm:hidden space-y-2.5 text-xs">
              {products.map((p) => (
                <div key={p.id} className="rounded-xl border border-slate-200 p-3 bg-white space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">{p.name}</p>
                      <div className="mt-1">
                        <StatusBadge status={p.imageQualityStatus || 'VERIFIED'} />
                      </div>
                    </div>
                    <StatusBadge status={p.isTryOnEligible ? 'ACTIVE' : 'HIDDEN'} />
                  </div>
                  <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                    <label className="space-y-1">
                      <span className="text-[11px] font-semibold text-slate-500">AI Category</span>
                      <select
                        value={p.tryOnCategory}
                        onChange={(e) => updateProduct(p.id, { tryOnCategory: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                      >
                        <option value="tops">tops</option>
                        <option value="bottoms">bottoms</option>
                        <option value="dresses">dresses</option>
                        <option value="outerwear">outerwear</option>
                      </select>
                    </label>
                    <div className="flex flex-col justify-end gap-1.5">
                      <label className="flex items-center justify-between gap-2 text-[11px] font-semibold text-slate-700">
                        <span>Brand Try-On</span>
                        <input
                          type="checkbox"
                          checked={p.isTryOnEligible}
                          onChange={(e) => updateProduct(p.id, { isTryOnEligible: e.target.checked })}
                          className="rounded accent-slate-950"
                        />
                      </label>
                      <label className="flex items-center justify-between gap-2 text-[11px] font-semibold text-slate-700">
                        <span>Marketplace</span>
                        <input
                          type="checkbox"
                          checked={Boolean(p.includeInMarketplaceTryOn)}
                          onChange={(e) => updateProduct(p.id, { includeInMarketplaceTryOn: e.target.checked })}
                          className="rounded accent-slate-950"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden sm:block overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead className="text-[10px] uppercase text-slate-500 border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="p-3">Garment</th>
                    <th className="p-3">AI Category</th>
                    <th className="p-3">Image Compatibility</th>
                    <th className="p-3 text-center">Brand Try-On</th>
                    <th className="p-3 text-center">Marketplace Try-On</th>
                    <th className="p-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((p) => (
                    <tr key={p.id}>
                      <td className="p-3 font-bold text-slate-900">{p.name}</td>
                      <td className="p-3">
                        <select
                          value={p.tryOnCategory}
                          onChange={(e) => updateProduct(p.id, { tryOnCategory: e.target.value })}
                          className="px-2 py-1 rounded border border-slate-200 bg-white"
                        >
                          <option value="tops">tops</option>
                          <option value="bottoms">bottoms</option>
                          <option value="dresses">dresses</option>
                          <option value="outerwear">outerwear</option>
                        </select>
                      </td>
                      <td className="p-3"><StatusBadge status={p.imageQualityStatus || 'VERIFIED'} /></td>
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={p.isTryOnEligible}
                          onChange={(e) => updateProduct(p.id, { isTryOnEligible: e.target.checked })}
                          className="rounded accent-slate-950"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={Boolean(p.includeInMarketplaceTryOn)}
                          onChange={(e) => updateProduct(p.id, { includeInMarketplaceTryOn: e.target.checked })}
                          className="rounded accent-slate-950"
                        />
                      </td>
                      <td className="p-3 text-right"><StatusBadge status={p.isTryOnEligible ? 'ACTIVE' : 'HIDDEN'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        )}

        {tab === 'appearance' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <SectionCard title="Customer UI Labels & Layout" className="lg:col-span-7">
              <div className="space-y-3 text-xs">
                <div><label className="block font-bold mb-1">Public Page Title</label><input value={appearance.pageTitle} onChange={(e) => setAppearance({ ...appearance, pageTitle: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200" /></div>
                <div><label className="block font-bold mb-1">Page Subtitle</label><textarea rows={2} value={appearance.pageDescription} onChange={(e) => setAppearance({ ...appearance, pageDescription: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200" /></div>
                <div><label className="block font-bold mb-1">Upload Instructions</label><input value={appearance.uploadInstructions} onChange={(e) => setAppearance({ ...appearance, uploadInstructions: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200" /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><label className="block font-bold mb-1">Try-On Button Text</label><input value={appearance.primaryBtnText} onChange={(e) => setAppearance({ ...appearance, primaryBtnText: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200" /></div>
                  <div><label className="block font-bold mb-1">Generate Button Text</label><input value={appearance.generateBtnText} onChange={(e) => setAppearance({ ...appearance, generateBtnText: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200" /></div>
                  <div><label className="block font-bold mb-1">Accent Color</label><input type="color" value={appearance.accentColor} onChange={(e) => setAppearance({ ...appearance, accentColor: e.target.value })} className="w-16 h-8 rounded border border-slate-200" /></div>
                  <div><label className="block font-bold mb-1">Grid Style</label><select value={appearance.gridStyle} onChange={(e) => setAppearance({ ...appearance, gridStyle: e.target.value as any })} className="w-full px-3 py-2 rounded-xl border border-slate-200"><option value="3-col">3 Columns</option><option value="4-col">4 Columns</option><option value="editorial">Editorial</option></select></div>
                </div>
                <div className="flex flex-wrap gap-3 sm:gap-4 pt-1">
                  <label className="flex items-center gap-2"><input type="checkbox" checked={appearance.showPrices} onChange={(e) => setAppearance({ ...appearance, showPrices: e.target.checked })} /> Display Prices</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={appearance.showRatings} onChange={(e) => setAppearance({ ...appearance, showRatings: e.target.checked })} /> Display Ratings</label>
                </div>
                <Button size="sm" onClick={() => { updateTryOnConfig({ appearance }); notify('Saved public try-on appearance.'); }}>
                  Save Appearance
                </Button>
              </div>
            </SectionCard>

            <SectionCard title="Live Customer Preview" className="lg:col-span-5">
              <div className="rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4" style={{ backgroundColor: appearance.backgroundColor }}>
                <div className="flex items-center gap-2.5">
                  <div className="relative w-8 h-8 rounded-full overflow-hidden border border-slate-300 shrink-0">
                    <SafeImage src={profile.logo} alt={profile.name} fill className="object-cover" />
                  </div>
                  <span className="font-bold text-sm text-slate-950 truncate">{profile.name}</span>
                </div>
                <div>
                  <h4 className="font-bold text-base text-slate-950">{appearance.pageTitle}</h4>
                  <p className="text-xs text-slate-600 mt-1">{appearance.pageDescription}</p>
                </div>
                <div className="p-3 rounded-xl bg-white border border-dashed border-slate-300 text-[11px] text-slate-500">
                  {appearance.uploadInstructions}
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-4 py-2 rounded-full text-white text-xs font-bold" style={{ backgroundColor: appearance.accentColor }}>
                    {appearance.generateBtnText}
                  </span>
                  <span className="px-4 py-2 rounded-full border border-slate-300 bg-white text-xs font-bold">
                    {appearance.primaryBtnText}
                  </span>
                </div>
              </div>
            </SectionCard>
          </div>
        )}

        {tab === 'configuration' && (
          <SectionCard title="Generation Pipeline Configuration" subtitle="Settings governed by your subscription plan entitlements">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs max-w-3xl">
              <div>
                <label className="block font-bold mb-1">Generation Quality Preset</label>
                <select value={tryOnConfig.mode} onChange={(e) => updateTryOnConfig({ mode: e.target.value as any })} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white">
                  <option value="balanced">Balanced (Plan Default)</option>
                  <option value="high_fidelity">High Fidelity ({profile.plan})</option>
                  <option value="fast_preview">Fast Studio Preview</option>
                </select>
              </div>
              <div>
                <label className="block font-bold mb-1">Output Resolution</label>
                <select value={tryOnConfig.resolution} onChange={(e) => updateTryOnConfig({ resolution: e.target.value as any })} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white">
                  <option value="768x1024">768 × 1024 px</option>
                  <option value="1024x1366">1024 × 1366 px HD</option>
                </select>
              </div>
              <div>
                <label className="block font-bold mb-1">Max Upload File Size (MB)</label>
                <input type="number" min={2} max={10} value={tryOnConfig.maxUploadMb} onChange={(e) => updateTryOnConfig({ maxUploadMb: Number(e.target.value) })} className="w-full px-3 py-2 rounded-xl border border-slate-200" />
              </div>
              <div>
                <label className="block font-bold mb-1">Plan Concurrency Cap</label>
                <input readOnly value={`${tryOnConfig.concurrencyLimit} parallel jobs (${profile.plan} Plan)`} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-600" />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-bold mb-1">Supported Garment Categories</label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {(['tops', 'bottoms', 'dresses', 'outerwear'] as TryOnCategory[]).map((c) => {
                    const active = tryOnConfig.supportedCategories.includes(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() =>
                          updateTryOnConfig({
                            supportedCategories: active
                              ? tryOnConfig.supportedCategories.filter((x) => x !== c)
                              : [...tryOnConfig.supportedCategories, c],
                          })
                        }
                        className={`px-3 py-1.5 rounded-full font-bold border ${
                          active ? 'bg-slate-950 text-white border-slate-950' : 'bg-white text-slate-600 border-slate-200'
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </SectionCard>
        )}

        {tab === 'embedding' && (
          <SectionCard title="Public URL, Embed Widget & Domain Allowlist">
            <div className="space-y-4 text-xs max-w-3xl">
              <div>
                <p className="font-bold text-slate-800 mb-1 flex items-center gap-1.5"><Code2 className="w-4 h-4" /> Shopify / Custom Store Embed Script</p>
                <pre className="p-3.5 rounded-xl bg-slate-950 text-slate-100 overflow-x-auto font-mono text-[11px]">{embedSnippet}</pre>
              </div>
              <div className="space-y-2">
                <p className="font-bold text-slate-800">Allowed Embed Domains</p>
                <div className="flex flex-wrap gap-2">
                  {tryOnConfig.domainAllowlist.map((d) => (
                    <span key={d} className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 font-mono">
                      {d}
                    </span>
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input value={allowlistDomain} onChange={(e) => setAllowlistDomain(e.target.value)} placeholder="store.yourdomain.com" className="px-3 py-2 rounded-xl border border-slate-200 w-full sm:flex-1 sm:max-w-xs" />
                  <Button
                    size="sm"
                    onClick={() => {
                      if (!allowlistDomain.trim()) return;
                      updateTryOnConfig({ domainAllowlist: [...tryOnConfig.domainAllowlist, allowlistDomain.trim()] });
                      setAllowlistDomain('');
                      notify('Domain added to widget allowlist.');
                    }}
                  >
                    Allow Domain
                  </Button>
                </div>
              </div>
            </div>
          </SectionCard>
        )}

        {tab === 'history' && (
          <SectionCard title="AI Generation Session History" subtitle="Customer photos and generated results remain strictly hidden unless explicit customer consent & business purpose apply.">
            {sessions.length === 0 ? (
              <EmptyState title="No try-on sessions yet" description="Sessions generated from the studio or public widget will appear here." />
            ) : (
              <>
                <div className="sm:hidden space-y-2.5 text-xs">
                  {sessions.map((s) => (
                    <div key={s.id} className="rounded-xl border border-slate-200 p-3 bg-white space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-mono text-[11px] font-bold text-slate-500 break-all">{s.id}</p>
                          <p className="font-bold text-slate-900 line-clamp-2">{s.productName}</p>
                        </div>
                        <StatusBadge status={s.status} />
                      </div>
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                        <div>
                          <span className="text-slate-400 block">Duration</span>
                          <span className="font-semibold text-slate-800 tabular-nums">{s.durationMs} ms</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Credits</span>
                          <span className="font-semibold text-slate-800 tabular-nums">{s.creditsUsed}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-400 block">Logged</span>
                          <span className="font-semibold text-slate-600">{s.createdAt}</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-600 pt-1 border-t border-slate-100 break-words">
                        {s.attributedOrderId
                          ? `Attributed: Order ${s.attributedOrderId} (৳${s.attributedRevenue})`
                          : s.errorReason || 'No purchase yet'}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="hidden sm:block overflow-x-auto text-xs">
                  <table className="w-full text-left">
                    <thead className="text-[10px] uppercase text-slate-500 border-b border-slate-200 bg-slate-50">
                      <tr>
                        <th className="p-3">Session ID</th>
                        <th className="p-3">Garment</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Duration</th>
                        <th className="p-3">Credits</th>
                        <th className="p-3">Attribution</th>
                        <th className="p-3 text-right">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sessions.map((s) => (
                        <tr key={s.id}>
                          <td className="p-3 font-mono font-bold">{s.id}</td>
                          <td className="p-3 font-semibold">{s.productName}</td>
                          <td className="p-3"><StatusBadge status={s.status} /></td>
                          <td className="p-3">{s.durationMs} ms</td>
                          <td className="p-3">{s.creditsUsed}</td>
                          <td className="p-3 text-slate-600">{s.attributedOrderId ? `Order ${s.attributedOrderId} (৳${s.attributedRevenue})` : s.errorReason || 'No purchase yet'}</td>
                          <td className="p-3 text-right text-slate-500">{s.createdAt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </SectionCard>
        )}

        {tab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <KpiCard label="Sessions Recorded" value={sessions.length} />
              <KpiCard label="Success Rate" value={successRate} />
              <KpiCard label="Avg Duration" value={`${avgDurationSec}s`} />
              <KpiCard label="Attributed Orders" value={sessions.filter((s) => s.attributedOrderId).length} />
            </div>
            <SectionCard title="Daily Try-On Sessions by Garment Category">
              <SvgBarChart
                data={[
                  { label: 'Dresses', count: sessions.filter((s) => s.category === 'dresses').length },
                  { label: 'Outerwear', count: sessions.filter((s) => s.category === 'outerwear').length },
                  { label: 'Bottoms', count: sessions.filter((s) => s.category === 'bottoms').length },
                  { label: 'Tops', count: sessions.filter((s) => s.category === 'tops').length },
                ]}
                valueKey="count"
              />
            </SectionCard>
          </div>
        )}

        {tab === 'privacy' && (
          <SectionCard title="Try-On Consent & Privacy Controls" subtitle="Transparent customer image retention policy configuration">
            <div className="space-y-4 text-xs max-w-2xl">
              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200">
                <span className="font-bold">Require explicit customer consent before upload</span>
                <input type="checkbox" checked={tryOnConfig.requireConsent} onChange={(e) => updateTryOnConfig({ requireConsent: e.target.checked })} className="rounded accent-slate-950" />
              </label>
              <div>
                <label className="block font-bold mb-1">Retention Window Preference (Days)</label>
                <input type="number" min={1} max={365} value={tryOnConfig.retentionDays} onChange={(e) => updateTryOnConfig({ retentionDays: Number(e.target.value) })} className="w-32 px-3 py-2 rounded-xl border border-slate-200" />
                <p className="text-[11px] text-slate-500 mt-1">
                  Note: Automatic scheduled erasure depends on backend storage retention workers when external cloud persistence is enabled.
                </p>
              </div>
              <div>
                <label className="block font-bold mb-1">Customer Data Processing Notice</label>
                <textarea rows={2} value={tryOnConfig.dataProcessingNotice} onChange={(e) => updateTryOnConfig({ dataProcessingNotice: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200" />
              </div>
              <Button size="sm" onClick={() => notify('Privacy settings saved.')}>Save Privacy Policy</Button>
            </div>
          </SectionCard>
        )}
      </div>
    </PermissionGate>
  );
}

