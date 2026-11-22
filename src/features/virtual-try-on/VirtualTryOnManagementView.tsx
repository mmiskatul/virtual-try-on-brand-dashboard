'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Check, CheckCircle2, Circle, Code2, Copy, ExternalLink, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';
import type { TryOnConfigPatch } from '../../services/brandService';
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
} from '../../components/shared/UiPrimitives';
import { Button } from '../../components/ui/button';
import { resolveBrandLook } from '../../lib/brand-look';
import { TRY_ON_LAYOUTS, TryOnLayoutId, layoutIdFor } from '../../lib/try-on-layouts';

export type TryOnTab = 'overview' | 'products' | 'appearance' | 'history';

const TABS: Array<{ id: TryOnTab; label: string; href: string }> = [
  { id: 'overview', label: 'Overview', href: '/dashboard/virtual-try-on' },
  { id: 'products', label: 'Garments', href: '/dashboard/try-on-garments' },
  { id: 'appearance', label: 'Look & Feel', href: '/dashboard/try-on-look' },
  { id: 'history', label: 'Sessions', href: '/dashboard/try-on-sessions' },
];

type GarmentFilter = 'all' | 'on' | 'off' | 'attention';

/** A small wireframe of each try-on page design, so brands can pick by how it looks. */
function LayoutWireframe({ id, accent }: { id: TryOnLayoutId; accent: string }) {
  const panel = 'rounded bg-slate-200';
  const garment = 'rounded-sm bg-slate-300';
  return (
    <div className="h-24 w-full rounded-lg border border-slate-200 bg-white p-1.5 flex flex-col gap-1">
      <div className="h-2 w-1/3 rounded bg-slate-300" />
      {id === 'classic' && (
        <div className="flex-1 grid grid-cols-3 gap-1">
          <div className={panel} />
          <div className={panel} />
          <div className="flex flex-col gap-1">
            <div className="flex-1 rounded bg-slate-300" />
            <div className="flex-1 rounded bg-slate-300" />
            <div className="h-2 rounded" style={{ backgroundColor: accent }} />
          </div>
        </div>
      )}
      {id === 'grid' && (
        <div className="flex-1 grid grid-cols-3 gap-1">
          <div className={panel} />
          <div className={panel} />
          <div className="grid grid-cols-2 gap-0.5 content-start">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`${garment} h-4`} />
            ))}
          </div>
        </div>
      )}
      {id === 'showcase' && (
        <div className="flex-1 flex flex-col gap-1">
          <div className="flex-1 grid grid-cols-2 gap-1">
            <div className={panel} />
            <div className={panel} />
          </div>
          <div className="grid grid-cols-4 gap-0.5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`${garment} h-4`} />
            ))}
          </div>
        </div>
      )}
      {id === 'editorial' && (
        <div className="flex-1 flex flex-col gap-1">
          <div className="flex-1 grid grid-cols-2 gap-1">
            <div className={panel} />
            <div className={panel} />
          </div>
          <div className="grid grid-cols-3 gap-1">
            {[0, 1, 2].map((i) => (
              <div key={i} className={`${garment} h-6`} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function VirtualTryOnManagementView({ initialTab = 'overview' }: { initialTab?: TryOnTab }) {
  const tab = initialTab;
  const pathname = usePathname();
  const profile = useWorkspaceStore((s) => s.profile);
  const products = useWorkspaceStore((s) => s.products);
  const updateProduct = useWorkspaceStore((s) => s.updateProduct);
  const tryOnConfig = useWorkspaceStore((s) => s.tryOnConfig);
  const updateTryOnConfig = useWorkspaceStore((s) => s.updateTryOnConfig);
  const [serverJobs, setServerJobs] = useState<Awaited<ReturnType<typeof brandWorkspaceApi.getTryOnJobs>> | null>(null);

  const showToast = useUiStore((s) => s.showToast);
  const hideToast = useUiStore((s) => s.hideToast);

  const [engineOk, setEngineOk] = useState<boolean | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [appearance, setAppearance] = useState(tryOnConfig.appearance);
  const [filter, setFilter] = useState<GarmentFilter>('all');

  // Sessions come from the server (every shopper try-on), not from this browser.
  useEffect(() => {
    let cancelled = false;
    brandWorkspaceApi
      .getTryOnJobs()
      .then((jobs) => {
        if (!cancelled) setServerJobs(jobs);
      })
      .catch(() => {
        if (!cancelled) setServerJobs([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const sessions = useMemo(
    () =>
      (serverJobs || []).map((j) => {
        const status: 'COMPLETED' | 'FAILED' | 'PROCESSING' | 'CANCELLED' =
          j.status === 'COMPLETED' ? 'COMPLETED' : j.status === 'FAILED' ? 'FAILED' : j.status === 'CANCELLED' ? 'CANCELLED' : 'PROCESSING';
        return {
          id: j.jobId,
          tenantId: profile.id || '',
          productId: j.productId || '',
          productName: products.find((p) => p.id === j.productId)?.name || 'Removed product',
          category: j.category || '',
          status,
          durationMs: j.latencyMs || 0,
          creditsUsed: status === 'COMPLETED' ? 1 : 0,
          errorReason: status === 'FAILED' ? j.errorMessage || 'The try-on did not complete.' : undefined,
          createdAt: j.createdAt ? new Date(j.createdAt).toLocaleString() : '',
        };
      }),
    [serverJobs, products, profile.id]
  );

  const notify = (msg: string) => {
    showToast(msg);
    setTimeout(hideToast, 3000);
  };

  useEffect(() => {
    brandWorkspaceApi
      .getTryOnProviderStatus()
      .then(() => setEngineOk(true))
      .catch(() => setEngineOk(false));
  }, []);

  // Settings live on the server: load them once, save them with a real request.
  const [serverReady, setServerReady] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  useEffect(() => {
    let cancelled = false;
    brandWorkspaceApi
      .getTryOnConfig()
      .then((cfg) => {
        if (cancelled) return;
        updateTryOnConfig(cfg);
        setAppearance(cfg.appearance);
        setServerReady(true);
      })
      .catch(() => {
        /* keep the defaults; saving will report the real error */
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persistConfig = async (patch: TryOnConfigPatch, okMessage: string) => {
    setSavingConfig(true);
    try {
      const saved = await brandWorkspaceApi.saveTryOnConfig(patch);
      updateTryOnConfig(saved);
      setAppearance(saved.appearance);
      notify(okMessage);
    } catch (err: any) {
      notify(err?.message || 'Could not save your settings.');
    } finally {
      setSavingConfig(false);
    }
  };

  // A garment change is shown right away and then saved on the server; it is put back if saving fails.
  const setGarmentEligible = async (productId: string, value: boolean) => {
    const before = products.find((p) => p.id === productId)?.isTryOnEligible ?? !value;
    updateProduct(productId, { isTryOnEligible: value });
    try {
      await brandWorkspaceApi.setPublication(productId, 'isTryOnEligible', value);
    } catch {
      updateProduct(productId, { isTryOnEligible: before });
      notify('Could not save that change. Please try again.');
    }
  };

  const setAllEligible = async (value: boolean) => {
    const targets = products.filter((p) => p.isTryOnEligible !== value);
    await Promise.all(targets.map((p) => setGarmentEligible(p.id, value)));
    notify(value ? 'Try-on turned on for all garments.' : 'Try-on turned off for all garments.');
  };

  const publicTryOnUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/try/${profile.slug}` : `/try/${profile.slug}`;

  const copy = async (text: string, done: (v: boolean) => void) => {
    if (typeof navigator === 'undefined') return;
    await navigator.clipboard.writeText(text).catch(() => {});
    done(true);
    setTimeout(() => done(false), 2000);
  };

  const eligibleProducts = useMemo(
    () => products.filter((p) => p.isTryOnEligible && p.includeInBrandTryOn !== false),
    [products]
  );
  const needsAttention = useMemo(
    () => eligibleProducts.filter((p) => !p.image || p.imageQualityStatus === 'NEEDS_CHECK'),
    [eligibleProducts]
  );

  const completedCount = sessions.filter((s) => s.status === 'COMPLETED').length;
  const failedCount = sessions.filter((s) => s.status === 'FAILED').length;
  const successRate = sessions.length > 0 ? `${Math.round((completedCount / sessions.length) * 100)}%` : '-';
  const creditsLeft = Math.max(0, profile.quotaMax - profile.quotaUsed);
  const usagePct = profile.quotaMax > 0 ? Math.min(100, Math.round((profile.quotaUsed / profile.quotaMax) * 100)) : 0;

  const topGarments = useMemo(() => {
    const counts = new Map<string, { name: string; count: number }>();
    for (const s of sessions) {
      const entry = counts.get(s.productId) || { name: s.productName, count: 0 };
      entry.count += 1;
      counts.set(s.productId, entry);
    }
    return Array.from(counts.entries())
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [sessions]);

  // The try-on page copies the brand's own look (Settings > Onboarding), so no separate colours here.
  const brandLook = useMemo(() => resolveBrandLook(profile, { logo: profile.logo, banner: profile.banner }), [profile]);
  const isOn = tryOnConfig.enabled && tryOnConfig.publicPageActive;
  const checklist = [
    {
      id: 'on',
      label: 'Turn on virtual try-on',
      done: isOn,
      href: '/dashboard/virtual-try-on',
      action: 'Use the switches below',
    },
    {
      id: 'garments',
      label: 'Enable at least 3 garments',
      done: eligibleProducts.length >= 3,
      href: '/dashboard/try-on-garments',
      action: `${eligibleProducts.length} of 3 enabled`,
    },
    {
      id: 'photos',
      label: 'Use clear garment photos',
      done: eligibleProducts.length > 0 && needsAttention.length === 0,
      href: '/dashboard/try-on-garments',
      action: needsAttention.length > 0 ? `${needsAttention.length} need a better photo` : 'Enable garments first',
    },
    {
      id: 'first',
      label: 'Get your first shopper try-on',
      done: sessions.length > 0,
      href: `/try/${profile.slug}`,
      action: 'Share your link below',
    },
  ];
  const doneCount = checklist.filter((c) => c.done).length;

  const embedSnippet = `<a href="${publicTryOnUrl}" target="_blank" rel="noopener">${appearance.primaryBtnText}</a>`;

  return (
    <PermissionGate module="tryon" action="view">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Virtual Try-On"
          title="Virtual Try-On"
          subtitle="Let shoppers see your garments on themselves. Turn it on, choose your garments and share your link."
          actions={
            <>
              <Button variant="outline" size="sm" onClick={() => void copy(publicTryOnUrl, setCopiedUrl)} className="gap-1.5">
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedUrl ? 'Link copied' : 'Copy link'}
              </Button>
              <Link href={`/try/${profile.slug}`} target="_blank">
                <Button size="sm" className="gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Preview as shopper <ExternalLink className="w-3 h-3" />
                </Button>
              </Link>
            </>
          }
        />

        {engineOk !== null && (
          <div
            className={`rounded-2xl border px-4 py-3 flex items-center gap-2.5 text-xs ${
              engineOk ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-amber-200 bg-amber-50 text-amber-900'
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${engineOk ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span className="font-bold">
              {engineOk ? 'Try-on is working' : 'Try-on is temporarily unavailable. Please try again in a few minutes.'}
            </span>
          </div>
        )}

        <nav aria-label="Virtual try-on sections" className="flex gap-2 overflow-x-auto no-scrollbar pb-1 text-xs font-bold">
          {TABS.map((t) => {
            const active = tab === t.id || pathname === t.href;
            return (
              <Link
                key={t.id}
                href={t.href}
                aria-current={active ? 'page' : undefined}
                className={`px-3.5 py-2 rounded-xl border whitespace-nowrap ${
                  active ? 'bg-slate-950 text-white border-slate-950' : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                {t.label}
                {t.id === 'products' && ` (${eligibleProducts.length})`}
              </Link>
            );
          })}
        </nav>

        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <KpiCard label="Garments on" value={eligibleProducts.length} change={`of ${products.length} products`} icon={<Sparkles className="w-4 h-4 text-amber-600" />} />
              <KpiCard label="Shopper try-ons" value={sessions.length} change={`${completedCount} completed`} icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />} />
              <KpiCard label="Success rate" value={successRate} change={`${failedCount} failed`} icon={<RefreshCw className="w-4 h-4" />} />
              <KpiCard label="Credits left" value={creditsLeft} change={`${profile.quotaUsed} used`} icon={<ShieldCheck className="w-4 h-4" />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SectionCard title="Get started" subtitle={`${doneCount} of ${checklist.length} steps done`}>
                <ul className="space-y-2 text-xs">
                  {checklist.map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2.5">
                      <span className="flex items-center gap-2 min-w-0">
                        {c.done ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                        )}
                        <span className={`font-semibold ${c.done ? 'text-slate-500 line-through' : 'text-slate-900'}`}>{c.label}</span>
                      </span>
                      {!c.done && (
                        <Link href={c.href} className="shrink-0 text-[11px] font-bold text-slate-900 underline">
                          {c.action}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </SectionCard>

              <SectionCard title="Try-on switches" subtitle="Turn the experience on or off for your shoppers.">
                <div className="space-y-3 text-sm">
                  {(
                    [
                      ['enabled', 'Virtual try-on is on', 'When off, shoppers cannot try on any of your products.'],
                      ['publicPageActive', 'Your try-on page is visible', `The page at /try/${profile.slug}. When off, shoppers see an "unavailable" message.`],
                    ] as const
                  ).map(([key, title, help]) => (
                    <label key={key} className="flex items-start justify-between gap-4 p-3.5 rounded-xl border border-slate-200 cursor-pointer">
                      <span className="min-w-0">
                        <span className="block font-semibold text-slate-950">{title}</span>
                        <span className="block text-xs text-slate-500 mt-0.5">{help}</span>
                      </span>
                      <input
                        type="checkbox"
                        checked={tryOnConfig[key]}
                        disabled={savingConfig || !serverReady}
                        onChange={(e) => void persistConfig({ [key]: e.target.checked }, e.target.checked ? 'Turned on.' : 'Turned off.')}
                        className="mt-1 h-4 w-4 accent-slate-950 shrink-0"
                      />
                    </label>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="Share your try-on" subtitle="Link to it from your website, Instagram bio or product pages.">
                <div className="space-y-4 text-sm">
                  <div className="flex items-center gap-2">
                    <input readOnly value={publicTryOnUrl} className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs" />
                    <Button size="sm" variant="outline" className="h-10" onClick={() => void copy(publicTryOnUrl, setCopiedUrl)}>
                      {copiedUrl ? 'Copied' : 'Copy'}
                    </Button>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 mb-1.5 flex items-center gap-1.5 text-xs">
                      <Code2 className="w-4 h-4" /> Add a button to your website
                    </p>
                    <pre className="p-3.5 rounded-xl bg-slate-950 text-slate-100 overflow-x-auto font-mono text-[11px] leading-relaxed">{embedSnippet}</pre>
                    <Button size="sm" variant="outline" className="mt-2" onClick={() => void copy(embedSnippet, setCopiedCode)}>
                      {copiedCode ? 'Copied' : 'Copy code'}
                    </Button>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Credits" subtitle={`${profile.plan} plan`}>
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">
                      {profile.quotaUsed} of {profile.quotaMax} used
                    </span>
                    <span className="text-slate-500">{creditsLeft} left</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full rounded-full ${usagePct >= 90 ? 'bg-rose-500' : 'bg-slate-900'}`} style={{ width: `${usagePct}%` }} />
                  </div>
                  <Link href="/dashboard/billing" className="inline-block font-bold text-slate-900 underline">
                    {usagePct >= 80 ? 'Running low: view plans' : 'View plan and credits'}
                  </Link>
                </div>
              </SectionCard>

              <SectionCard title="Most tried-on garments" subtitle="What shoppers try on the most">
                {topGarments.length === 0 ? (
                  <p className="text-xs text-slate-500">No try-ons yet. Share your link to get started.</p>
                ) : (
                  <ol className="space-y-2 text-xs">
                    {topGarments.map((g, i) => (
                      <li key={g.id} className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="font-bold text-slate-900 truncate">
                          {i + 1}. {g.name}
                        </span>
                        <span className="font-semibold text-slate-600 shrink-0">{g.count} try-on{g.count === 1 ? '' : 's'}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </SectionCard>

              <SectionCard title="Garments needing attention" subtitle="Clear, front-facing photos give the best results">
                {needsAttention.length === 0 ? (
                  <p className="text-xs text-slate-500">All enabled garments look good.</p>
                ) : (
                  <ul className="space-y-2 text-xs">
                    {needsAttention.slice(0, 5).map((p) => (
                      <li key={p.id} className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-amber-50 border border-amber-100">
                        <span className="font-bold text-slate-900 truncate">{p.name}</span>
                        <Link href={`/dashboard/products/${p.id}/edit`} className="shrink-0 font-bold underline">
                          Fix photo
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>
            </div>
          </div>
        )}

        {tab === 'products' && (
          <SectionCard
            title="Garments"
            subtitle="Choose which products shoppers can try on."
            right={
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => void setAllEligible(true)}>
                  Turn on all
                </Button>
                <Button size="sm" variant="outline" onClick={() => void setAllEligible(false)}>
                  Turn off all
                </Button>
              </div>
            }
          >
            <div className="flex flex-wrap gap-2 mb-4 text-xs font-bold">
              {(
                [
                  ['all', `All (${products.length})`],
                  ['on', `On (${products.filter((p) => p.isTryOnEligible).length})`],
                  ['off', `Off (${products.filter((p) => !p.isTryOnEligible).length})`],
                  ['attention', `Needs attention (${needsAttention.length})`],
                ] as Array<[GarmentFilter, string]>
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setFilter(k)}
                  className={`px-3 py-1.5 rounded-full border ${
                    filter === k ? 'bg-slate-950 text-white border-slate-950' : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {(() => {
              const rows = products.filter((p) =>
                filter === 'on'
                  ? p.isTryOnEligible
                  : filter === 'off'
                    ? !p.isTryOnEligible
                    : filter === 'attention'
                      ? needsAttention.some((n) => n.id === p.id)
                      : true
              );
              if (rows.length === 0) {
                return <EmptyState title="No garments here" description="Try a different filter, or add products first." />;
              }
              return (
                <div className="space-y-2.5 text-xs">
                  {rows.map((p) => {
                    const flagged = needsAttention.some((n) => n.id === p.id);
                    return (
                      <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                        <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                          <SafeImage src={p.image} alt={p.name} fill className="object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <Link href={`/dashboard/products/${p.id}`} className="block truncate font-bold text-slate-900 hover:underline">
                            {p.name}
                          </Link>
                          <div className="mt-1 flex items-center gap-2">
                            <StatusBadge status={p.isTryOnEligible ? 'ACTIVE' : 'HIDDEN'} />
                            {flagged && (
                              <Link href={`/dashboard/products/${p.id}/edit`} className="text-[11px] font-bold text-amber-700 underline">
                                Photo needs checking
                              </Link>
                            )}
                          </div>
                        </div>
                        <label className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-slate-500">Garment type</span>
                          <select
                            value={p.tryOnCategory}
                            onChange={(e) => updateProduct(p.id, { tryOnCategory: e.target.value })}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                          >
                            <option value="tops">Top</option>
                            <option value="bottoms">Bottom</option>
                            <option value="dresses">Dress</option>
                            <option value="outerwear">Outerwear</option>
                          </select>
                        </label>
                        <label className="flex items-center gap-2 font-semibold text-slate-700">
                          <span>Try-on</span>
                          <input
                            type="checkbox"
                            checked={p.isTryOnEligible}
                            onChange={(e) => void setGarmentEligible(p.id, e.target.checked)}
                            className="h-4 w-4 rounded accent-slate-950"
                          />
                        </label>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </SectionCard>
        )}

        {tab === 'appearance' && (
          <div className="space-y-6">
          <SectionCard title="Page design" subtitle="Choose how your try-on page is laid out. Colours and logo still follow your brand.">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {TRY_ON_LAYOUTS.map((opt) => {
                const selected = layoutIdFor(appearance.previewLayout, appearance.gridStyle) === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setAppearance({ ...appearance, previewLayout: opt.previewLayout, gridStyle: opt.gridStyle })}
                    className={`text-left rounded-2xl border p-2.5 space-y-2 transition-colors ${
                      selected ? 'border-slate-950 ring-2 ring-slate-950/15 bg-slate-50' : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <LayoutWireframe id={opt.id} accent={brandLook.accent} />
                    <div className="px-0.5">
                      <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        {opt.label}
                        {selected && <Check className="h-3.5 w-3.5 text-emerald-600" />}
                      </p>
                      <p className="text-[11px] text-slate-500 leading-snug">{opt.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-[11px] text-slate-500">Press Save look below to publish your choice.</p>
          </SectionCard>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <SectionCard title="How your try-on page looks" subtitle="Words shoppers see. Colours, logo and banner follow your brand." className="lg:col-span-7">
              <div className="space-y-3 text-xs">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2.5">
                  <p className="font-bold text-slate-900">Matches your brand automatically</p>
                  <div className="flex flex-wrap items-center gap-3">
                    {([['Main', brandLook.primary], ['Accent', brandLook.accent], ['Background', brandLook.background], ['Text', brandLook.text]] as const).map(([label, c]) => (
                      <span key={label} className="inline-flex items-center gap-1.5 text-[11px] text-slate-600">
                        <span className="h-5 w-5 rounded-full border border-slate-300" style={{ backgroundColor: c }} />
                        {label}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Change them in{' '}
                    <Link href="/dashboard/settings/onboarding/identity" className="font-bold text-slate-900 underline">Theme &amp; Identity</Link>
                    {' '}or{' '}
                    <Link href="/dashboard/settings/onboarding/media" className="font-bold text-slate-900 underline">Logos &amp; Brand Media</Link>.
                    The try-on page updates by itself.
                  </p>
                </div>
                <div>
                  <label className="block font-bold mb-1">Page title</label>
                  <input value={appearance.pageTitle} onChange={(e) => setAppearance({ ...appearance, pageTitle: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200" />
                </div>
                <div>
                  <label className="block font-bold mb-1">Page subtitle</label>
                  <textarea rows={2} value={appearance.pageDescription} onChange={(e) => setAppearance({ ...appearance, pageDescription: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200" />
                </div>
                <div>
                  <label className="block font-bold mb-1">Photo upload instructions</label>
                  <input value={appearance.uploadInstructions} onChange={(e) => setAppearance({ ...appearance, uploadInstructions: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">Try-on button text</label>
                    <input value={appearance.primaryBtnText} onChange={(e) => setAppearance({ ...appearance, primaryBtnText: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200" />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Generate button text</label>
                    <input value={appearance.generateBtnText} onChange={(e) => setAppearance({ ...appearance, generateBtnText: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200" />
                  </div>
                </div>
                <label className="flex items-center gap-2 pt-1">
                  <input type="checkbox" checked={appearance.showPrices} onChange={(e) => setAppearance({ ...appearance, showPrices: e.target.checked })} /> Show prices
                </label>
                <Button size="sm" disabled={savingConfig || !serverReady} onClick={() => void persistConfig({ appearance: { ...appearance, accentColor: brandLook.accent, backgroundColor: brandLook.background } }, 'Saved. Your try-on page now uses this look.')}>
                  Save look
                </Button>
              </div>
            </SectionCard>

            <SectionCard title="Live preview" className="lg:col-span-5">
              <div className="rounded-2xl border border-slate-200 overflow-hidden" style={{ backgroundColor: brandLook.background, color: brandLook.text }}>
                {brandLook.banner && (
                  <div className="relative h-20 w-full">
                    <SafeImage src={brandLook.banner} alt="" fill className="object-cover" />
                  </div>
                )}
                <div className="p-4 sm:p-5 space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="relative w-8 h-8 rounded-full overflow-hidden border border-slate-300 shrink-0">
                    <SafeImage src={profile.logo} alt={profile.name} fill className="object-cover" />
                  </div>
                  <span className="font-bold text-sm truncate">{profile.name}</span>
                </div>
                <div>
                  <h4 className="font-bold text-base">{appearance.pageTitle}</h4>
                  <p className="text-xs opacity-70 mt-1">{appearance.pageDescription}</p>
                </div>
                <div className="p-3 rounded-xl bg-white border border-dashed border-slate-300 text-[11px] text-slate-500">{appearance.uploadInstructions}</div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-4 py-2 text-white text-xs font-bold" style={{ backgroundColor: brandLook.accent, borderRadius: brandLook.buttonRadius }}>
                    {appearance.generateBtnText}
                  </span>
                  <span className="px-4 py-2 border border-slate-300 bg-white text-xs font-bold" style={{ borderRadius: brandLook.buttonRadius }}>{appearance.primaryBtnText}</span>
                </div>
                </div>
              </div>
            </SectionCard>
          </div>
          </div>
        )}

        {tab === 'history' && (
          <SectionCard
            title="Sessions"
            subtitle="Every try-on shoppers have run. Shopper photos and results are not shown here, to protect their privacy."
            right={
              <Link href="/dashboard/settings/privacy" className="text-[11px] font-bold underline">
                Photo privacy settings
              </Link>
            }
          >
            {sessions.length === 0 ? (
              <EmptyState title="No try-ons yet" description="When shoppers try on your garments, each session will appear here." />
            ) : (
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead className="text-[10px] uppercase text-slate-500 border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="p-3">Garment</th>
                      <th className="p-3">Result</th>
                      <th className="p-3">Details</th>
                      <th className="p-3 text-right">When</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sessions.map((s) => (
                      <tr key={s.id}>
                        <td className="p-3 font-semibold text-slate-900">{s.productName}</td>
                        <td className="p-3">
                          <StatusBadge status={s.status} />
                        </td>
                        <td className="p-3 text-slate-600">
                          {s.errorReason || (s.status === 'COMPLETED' ? 'Completed' : '-')}
                        </td>
                        <td className="p-3 text-right text-slate-500">{s.createdAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        )}
      </div>
    </PermissionGate>
  );
}
