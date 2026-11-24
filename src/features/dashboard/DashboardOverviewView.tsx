'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  CheckCircle2,
  Coins,
  CreditCard,
  ExternalLink,
  Eye,
  Globe,
  Palette,
  Plus,
  RefreshCw,
  Settings,
  ShoppingBag,
  Sparkles,
  Store,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  brandWorkspaceApi,
  type BrandOverviewActivityResponse,
  type BrandOverviewChecklist,
  type BrandOverviewSummary,
  type BrandOverviewTimeseries,
  type OverviewChecklistId,
  type OverviewPeriod,
} from '../../services/brandService';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { useMounted } from '../../hooks/useMounted';
import { useTryOnSessions } from '../../hooks/useTryOnSessions';
import {
  ErrorBanner,
  KpiCard,
  PageHeader,
  SafeImage,
  SectionCard,
  StatusBadge,
  SvgBarChart,
} from '../../components/shared/UiPrimitives';
import { Button } from '../../components/ui/button';

const CHECKLIST_ITEMS: Array<{ id: OverviewChecklistId; label: string; href: string }> = [
  { id: 'chk_profile', label: 'Add your brand story, tagline & about text', href: '/dashboard/settings' },
  { id: 'chk_logo', label: 'Upload main logo & brand assets', href: '/dashboard/settings?tab=media' },
  { id: 'chk_cover', label: 'Configure storefront cover & theme', href: '/dashboard/settings?tab=media' },
  { id: 'chk_biz', label: 'Add legal & business details (needed for payouts)', href: '/dashboard/settings/business' },
  { id: 'chk_product', label: 'Create first apparel product', href: '/dashboard/products/new' },
  { id: 'chk_variants', label: 'Configure sizes, colors & variants', href: '/dashboard/products' },
  { id: 'chk_storefront', label: 'Publish your brand storefront', href: '/dashboard/settings/store' },
  { id: 'chk_tryon', label: 'Configure Virtual Try-On experience', href: '/dashboard/virtual-try-on' },
  { id: 'chk_publish', label: 'Publish first product to global marketplace', href: '/dashboard/marketplace/create' },
  { id: 'chk_test_tryon', label: 'Test public Virtual Try-On studio', href: '/dashboard/virtual-try-on' },
];

export function DashboardOverviewView() {
  const mounted = useMounted();
  const profile = useWorkspaceStore((s) => s.profile);
  const products = useWorkspaceStore((s) => s.products);
  const orders = useWorkspaceStore((s) => s.orders);
  const customers = useWorkspaceStore((s) => s.customers);
  const marketplacePosts = useWorkspaceStore((s) => s.marketplacePosts);
  const { sessions: tryOnSessions } = useTryOnSessions();
  const activityLogs = useWorkspaceStore((s) => s.activityLogs);
  const isLiveBackend = useWorkspaceStore((s) => s.isLiveBackend);
  const onboardingCompletedIds = useWorkspaceStore((s) => s.onboardingCompletedIds);
  const toggleOnboardingChecklist = useWorkspaceStore((s) => s.toggleOnboardingChecklist);

  const [period, setPeriod] = useState<OverviewPeriod>('7d');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [chartMetric, setChartMetric] = useState<'revenue' | 'orders' | 'tryOns'>('revenue');

  const [summary, setSummary] = useState<BrandOverviewSummary | null>(null);
  const [timeseries, setTimeseries] = useState<BrandOverviewTimeseries | null>(null);
  const [overviewActivities, setOverviewActivities] = useState<BrandOverviewActivityResponse['activities'] | null>(null);
  const [checklist, setChecklist] = useState<BrandOverviewChecklist | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [timeseriesLoading, setTimeseriesLoading] = useState(false);
  const [checklistSavingId, setChecklistSavingId] = useState<OverviewChecklistId | null>(null);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  const loadOverviewCore = useCallback(async () => {
    setOverviewLoading(true);
    setOverviewError(null);
    try {
      const [sumRes, actRes, chkRes] = await Promise.all([
        brandWorkspaceApi.getOverviewSummary(),
        brandWorkspaceApi.getOverviewActivity(15),
        brandWorkspaceApi.getOverviewChecklist(),
      ]);
      setSummary(sumRes);
      setOverviewActivities(actRes.activities);
      setChecklist(chkRes);
    } catch (err: any) {
      if (isLiveBackend) {
        setOverviewError(err?.message || 'Could not load your latest numbers. Please try again.');
      }
    } finally {
      setOverviewLoading(false);
    }
  }, [isLiveBackend]);

  const loadTimeseries = useCallback(async () => {
    if (period === 'custom' && (Boolean(customStartDate) !== Boolean(customEndDate))) {
      return;
    }
    setTimeseriesLoading(true);
    try {
      const res = await brandWorkspaceApi.getOverviewTimeseries({
        period,
        ...(period === 'custom' && customStartDate && customEndDate
          ? { startDate: customStartDate, endDate: customEndDate }
          : {}),
      });
      setTimeseries(res);
    } catch (err: any) {
      if (isLiveBackend) {
        setOverviewError(err?.message || 'Unable to load overview chart series.');
      }
    } finally {
      setTimeseriesLoading(false);
    }
  }, [period, customStartDate, customEndDate, isLiveBackend]);

  useEffect(() => {
    if (!mounted) return;
    void loadOverviewCore();
  }, [mounted, loadOverviewCore]);

  useEffect(() => {
    if (!mounted) return;
    void loadTimeseries();
  }, [mounted, loadTimeseries]);

  const handleToggleChecklist = async (id: OverviewChecklistId) => {
    setChecklistSavingId(id);
    setOverviewError(null);
    try {
      const updated = await brandWorkspaceApi.updateOverviewChecklist({ toggleId: id });
      setChecklist(updated);
      toggleOnboardingChecklist(id);
    } catch (err: any) {
      if (isLiveBackend) {
        setOverviewError(err?.message || 'Failed to save checklist progress.');
      } else {
        toggleOnboardingChecklist(id);
      }
    } finally {
      setChecklistSavingId(null);
    }
  };

  const safeProducts = mounted ? products : [];
  const safeOrders = mounted ? orders : [];
  const safeCustomers = mounted ? customers : [];
  const safePosts = mounted ? marketplacePosts : [];
  const safeSessions = mounted ? tryOnSessions : [];
  const safeLogs = overviewActivities ?? (mounted ? activityLogs : []);

  const fallbackTotalRevenue = useMemo(
    () => safeOrders.filter((o) => o.status !== 'CANCELLED' && o.status !== 'REFUNDED').reduce((s, o) => s + o.total, 0),
    [safeOrders]
  );

  const totalRevenue = summary?.kpis.totalRevenue ?? fallbackTotalRevenue;
  const totalOrdersCount = summary?.kpis.totalOrders ?? safeOrders.length;
  const totalProductsCount = summary?.kpis.totalProducts ?? safeProducts.length;
  const totalCustomersCount = summary?.kpis.totalCustomers ?? safeCustomers.length;
  const marketplaceViews = summary?.kpis.marketplaceViews ?? safePosts.reduce((s, p) => s + (p.impressions || 0), 0);
  const totalSalesUnits = summary?.kpis.productSalesUnits ?? safeProducts.reduce((s, p) => s + (p.salesCount || 0), 0);
  const publishedCount =
    summary?.kpis.publishedMarketplaceProducts ?? safeProducts.filter((p) => p.marketplacePublished).length;
  const storefrontPublishedCount =
    summary?.kpis.publishedStorefrontProducts ?? safeProducts.filter((p) => p.brandStorefrontPublished).length;
  const tryOnUsed = summary?.kpis.tryOnUsed ?? profile.quotaUsed;
  const tryOnQuota = summary?.kpis.tryOnQuota ?? profile.quotaMax;
  const tryOnSessionsCount = summary?.kpis.tryOnSessionsCount ?? safeSessions.length;
  const creditsRemaining = summary?.kpis.tryOnCreditsLeft ?? Math.max(0, tryOnQuota - tryOnUsed);

  const paidOrders = summary?.salesOverview.paidOrders ?? safeOrders.filter((o) => o.paymentStatus === 'PAID').length;
  const pendingOrders =
    summary?.salesOverview.pendingOrders ??
    safeOrders.filter((o) => o.status === 'PENDING' || o.status === 'PROCESSING').length;
  const cancelledOrders = summary?.salesOverview.cancelledOrders ?? safeOrders.filter((o) => o.status === 'CANCELLED').length;
  const refundedOrders = summary?.salesOverview.refundedOrders ?? safeOrders.filter((o) => o.status === 'REFUNDED').length;
  const aov = summary?.salesOverview.averageOrderValue ?? (safeOrders.length > 0 ? totalRevenue / safeOrders.length : 0);

  const loggedTryOns = summary?.tryOnPerformance.loggedSessions ?? safeSessions.length;
  const successfulTryOns = summary?.tryOnPerformance.successful ?? safeSessions.filter((t) => t.status === 'COMPLETED').length;
  const failedTryOns = summary?.tryOnPerformance.failed ?? safeSessions.filter((t) => t.status === 'FAILED').length;
  const cartConvertedTryOns =
    summary?.tryOnPerformance.cartConversions ?? safeSessions.filter((t) => t.convertedToCart).length;
  const attributedOrders =
    summary?.tryOnPerformance.attributedOrders ?? safeSessions.filter((t) => Boolean(t.attributedOrderId)).length;
  const attributedRevenue =
    summary?.tryOnPerformance.attributedRevenue ?? safeSessions.reduce((s, t) => s + (t.attributedRevenue || 0), 0);
  const creditsUsedTotal =
    summary?.tryOnPerformance.creditsUsed ?? safeSessions.reduce((s, t) => s + t.creditsUsed, 0);
  const avgDurationSec =
    summary?.tryOnPerformance.avgSpeedSec !== undefined
      ? summary.tryOnPerformance.avgSpeedSec.toFixed(2)
      : safeSessions.length > 0
      ? (safeSessions.reduce((s, t) => s + t.durationMs, 0) / safeSessions.length / 1000).toFixed(2)
      : '0.00';

  const lowStockProducts =
    summary?.lowStockProducts ??
    safeProducts
      .filter((p) => p.stock < (p.lowStockThreshold || 5))
      .map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        stock: p.stock,
        lowStockThreshold: p.lowStockThreshold || 5,
      }));

  const bestSellingProducts =
    summary?.topProducts ??
    [...safeProducts]
      .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
      .slice(0, 4)
      .map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        price: p.price,
        stock: p.stock,
        lowStockThreshold: p.lowStockThreshold || 5,
        salesCount: p.salesCount || 0,
        image: p.image,
      }));

  const recentOrders =
    summary?.recentOrders ??
    safeOrders.slice(0, 5).map((o) => ({
      id: o.id,
      customerName: o.customerName,
      customerEmail: o.customerEmail,
      total: o.total,
      status: o.status,
      paymentStatus: o.paymentStatus,
      itemCount: o.items?.length ?? 1,
      date: o.date,
      createdAt: Date.now(),
    }));

  const checklistItems = checklist?.items ?? CHECKLIST_ITEMS.map((item) => ({
    ...item,
    completed: onboardingCompletedIds.includes(item.id),
    autoCompleted: false,
  }));
  const checklistPct =
    checklist?.completionPct ?? Math.round((onboardingCompletedIds.length / CHECKLIST_ITEMS.length) * 100);
  const chartData = timeseries?.series ?? [{ label: 'Current', revenue: 0, orders: 0, tryOns: 0 }];

  const workspaceName = summary?.workspace.name || profile.name;
  const workspaceSlug = summary?.workspace.slug || profile.slug;
  const workspaceLogo = summary?.workspace.logoUrl || profile.logo;
  const workspacePlan = summary?.workspace.plan || profile.plan;
  const workspaceStoreStatus = summary?.workspace.storeStatus || profile.storeStatus || 'LIVE';
  const workspaceMarketplaceStatus =
    summary?.workspace.marketplaceStatus || profile.marketplaceStatus || 'CONNECTED';
  const workspaceTryOnStatus = summary?.workspace.tryOnStatus || 'TRY-ON ACTIVE';

  const firstName = (profile.owner || '').trim().split(' ')[0] || 'there';
  const isNewShop = totalProductsCount === 0 && totalOrdersCount === 0;
  const chartTotal = chartData.reduce((sum, d) => sum + (Number((d as Record<string, unknown>)[chartMetric]) || 0), 0);
  const nextSteps = checklistItems.filter((i) => !i.completed).slice(0, 4);

  const attention: Array<{ id: string; text: string; href: string; tone: 'warn' | 'info' }> = [];
  if (pendingOrders > 0) {
    attention.push({ id: 'orders', text: `${pendingOrders} order${pendingOrders === 1 ? '' : 's'} waiting to be processed`, href: '/dashboard/orders', tone: 'warn' });
  }
  if (lowStockProducts.length > 0) {
    attention.push({ id: 'stock', text: `${lowStockProducts.length} product${lowStockProducts.length === 1 ? '' : 's'} running low on stock`, href: '/dashboard/inventory', tone: 'warn' });
  }
  if (failedTryOns > 0) {
    attention.push({ id: 'failed', text: `${failedTryOns} try-on${failedTryOns === 1 ? '' : 's'} failed. Check the customer photos`, href: '/dashboard/try-on-sessions', tone: 'warn' });
  }
  if (tryOnQuota > 0 && creditsRemaining / tryOnQuota < 0.2) {
    attention.push({ id: 'credits', text: `AI credits are running low (${creditsRemaining} left)`, href: '/dashboard/billing', tone: 'warn' });
  }
  if (!isNewShop && totalProductsCount > 0 && storefrontPublishedCount === 0) {
    attention.push({ id: 'nopub', text: 'Publish a product so customers can see it', href: '/dashboard/products', tone: 'info' });
  }

  const metricLabel = { revenue: 'Revenue', orders: 'Orders', tryOns: 'Try-ons' } as const;

  return (
    <div className="space-y-6">
      {/* Header: one title, one primary action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">Hi {firstName}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {isNewShop ? `Let's get ${workspaceName} ready to sell.` : `Here is how ${workspaceName} is doing.`}
            {summary?.generatedAt && (
              <span className="text-slate-400">
                {' '}
                Updated {new Date(summary.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="Refresh overview"
            title="Refresh"
            onClick={() => {
              void loadOverviewCore();
              void loadTimeseries();
            }}
            disabled={overviewLoading || timeseriesLoading}
            className="h-10 w-10 p-0 justify-center"
          >
            <RefreshCw className={`w-4 h-4 ${overviewLoading || timeseriesLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Link href={`/brands/${workspaceSlug}`} target="_blank">
            <Button type="button" variant="outline" size="sm" className="h-10 gap-1.5 text-sm">
              View store <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </Link>
          <Link href="/dashboard/products/new">
            <Button type="button" size="sm" className="h-10 gap-1.5 text-sm">
              <Plus className="w-4 h-4" /> Add product
            </Button>
          </Link>
        </div>
      </div>

      {overviewError && <ErrorBanner message={overviewError} onRetry={() => void loadOverviewCore()} />}

      {/* First-run: a focused guide instead of a wall of empty cards */}
      {isNewShop && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h2 className="text-xl font-bold text-slate-950">Get your shop ready</h2>
              <p className="text-sm text-slate-500 mt-1 max-w-xl">
                A few quick steps and you can start selling with virtual try-on.
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-3xl font-extrabold text-slate-950 tabular-nums">{checklistPct}%</p>
              <p className="text-xs text-slate-500">complete</p>
            </div>
          </div>
          <div className="mt-5 h-2 rounded-full bg-slate-100 overflow-hidden" role="progressbar" aria-valuenow={checklistPct} aria-valuemin={0} aria-valuemax={100} aria-label="Setup progress">
            <div className="h-full rounded-full bg-slate-950 transition-all" style={{ width: `${checklistPct}%` }} />
          </div>
          <ol className="mt-6 grid gap-3 sm:grid-cols-2">
            {nextSteps.map((item, i) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="flex items-center gap-4 rounded-xl border border-slate-200 p-4 hover:border-slate-900 hover:bg-slate-50 transition-colors"
                >
                  <span className="w-8 h-8 rounded-full bg-slate-950 text-white grid place-items-center text-sm font-bold shrink-0">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm font-semibold text-slate-900 leading-snug">{item.label}</span>
                  <span className="text-slate-400" aria-hidden="true">&rarr;</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Needs attention (only when there is something to do) */}
      {!isNewShop && attention.length > 0 && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 sm:p-5">
          <h2 className="text-sm font-bold text-slate-950 mb-2">Needs your attention</h2>
          <ul className="divide-y divide-amber-100">
            {attention.map((a) => (
              <li key={a.id}>
                <Link href={a.href} className="flex items-center justify-between gap-3 py-2.5 text-sm hover:text-slate-950 text-slate-800">
                  <span className="flex items-center gap-2.5 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${a.tone === 'warn' ? 'bg-amber-500' : 'bg-sky-500'}`} />
                    <span className="truncate">{a.text}</span>
                  </span>
                  <span className="text-xs font-bold text-slate-500 shrink-0">Open &rarr;</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Four core numbers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          label="Revenue"
          value={`৳${totalRevenue.toLocaleString()}`}
          change={summary?.kpis.revenueChangeLabel || undefined}
          positive={!(summary?.kpis.revenueChangeLabel || '').startsWith('-')}
          compare
          icon={<CreditCard className="w-4 h-4" />}
        />
        <KpiCard
          label="Orders"
          value={totalOrdersCount}
          change={`${pendingOrders} to process`}
          positive={pendingOrders === 0}
          icon={<ShoppingBag className="w-4 h-4" />}
        />
        <KpiCard
          label="Try-ons"
          value={tryOnUsed}
          change={loggedTryOns > 0 ? `${Math.round((successfulTryOns / loggedTryOns) * 100)}% success` : 'None yet'}
          icon={<Sparkles className="w-4 h-4 text-amber-600" />}
        />
        <KpiCard
          label="AI credits left"
          value={creditsRemaining.toLocaleString()}
          change={`of ${tryOnQuota}`}
          positive={tryOnQuota === 0 || creditsRemaining / tryOnQuota >= 0.2}
          icon={<Coins className="w-4 h-4" />}
        />
      </div>

      {!isNewShop && (
        <>
          {/* Trend */}
          <SectionCard
            title="Performance"
            subtitle={`Total for the period: ${metricLabel[chartMetric] === 'Revenue' ? '৳' : ''}${chartTotal.toLocaleString()}`}
            right={
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs font-bold" role="group" aria-label="Metric">
                  {(['revenue', 'orders', 'tryOns'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setChartMetric(m)}
                      aria-pressed={chartMetric === m}
                      className={`px-3 py-1.5 ${chartMetric === m ? 'bg-slate-950 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                    >
                      {metricLabel[m]}
                    </button>
                  ))}
                </div>
                <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs font-bold" role="group" aria-label="Period">
                  {(['today', '7d', '30d', '90d'] as const).map((per) => (
                    <button
                      key={per}
                      type="button"
                      onClick={() => setPeriod(per)}
                      aria-pressed={period === per}
                      className={`px-3 py-1.5 ${period === per ? 'bg-slate-950 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                    >
                      {per === 'today' ? 'Today' : per.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            }
          >
            {chartTotal === 0 ? (
              <p className="py-10 text-center text-sm text-slate-500">
                No {metricLabel[chartMetric].toLowerCase()} in this period yet.
              </p>
            ) : (
              <SvgBarChart
                data={chartData}
                valueKey={chartMetric}
                prefix={chartMetric === 'revenue' ? '৳' : ''}
                color={chartMetric === 'tryOns' ? '#d97706' : '#0f172a'}
              />
            )}
          </SectionCard>

          {/* Try-on funnel + sales summary */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <SectionCard
              className="lg:col-span-3"
              title="From try-on to sale"
              subtitle="How many customers go from trying on to buying"
              right={
                <Link href="/dashboard/analytics#try-on" className="text-xs font-bold underline whitespace-nowrap">
                  Full report &rarr;
                </Link>
              }
            >
              {(() => {
                const steps: Array<[string, number]> = [
                  ['Started a try-on', loggedTryOns],
                  ['Got a result', successfulTryOns],
                  ['Added to cart', cartConvertedTryOns],
                  ['Placed an order', attributedOrders],
                ];
                const top = Math.max(1, steps[0][1]);
                return (
                  <div className="space-y-3.5">
                    {steps.map(([label, n], i) => {
                      const pct = Math.round((n / top) * 100);
                      const fromPrev = i > 0 && steps[i - 1][1] > 0 ? Math.round((n / steps[i - 1][1]) * 100) : null;
                      return (
                        <div key={label}>
                          <div className="flex items-baseline justify-between mb-1.5 text-sm">
                            <span className="font-medium text-slate-700">{label}</span>
                            <span className="tabular-nums text-slate-500">
                              <b className="text-slate-950">{n}</b>
                              {fromPrev !== null && <span className="ml-2 text-xs">{fromPrev}% of previous</span>}
                            </span>
                          </div>
                          <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden" role="img" aria-label={`${label}: ${n}`}>
                            <div className="h-full rounded-full bg-slate-950" style={{ width: `${Math.max(n > 0 ? 3 : 0, pct)}%` }} />
                          </div>
                        </div>
                      );
                    })}
                    <p className="pt-1 text-xs text-slate-500">
                      Sales from try-ons: <b className="text-slate-900">৳{attributedRevenue.toLocaleString()}</b>
                      {failedTryOns > 0 && <> &middot; {failedTryOns} failed</>} &middot; avg {avgDurationSec}s
                    </p>
                  </div>
                );
              })()}
            </SectionCard>

            <SectionCard className="lg:col-span-2" title="Sales summary">
              <dl className="divide-y divide-slate-100 text-sm">
                {[
                  ['Paid orders', paidOrders],
                  ['Pending', pendingOrders],
                  ['Cancelled', cancelledOrders],
                  ['Refunded', refundedOrders],
                  ['Average order', `৳${Math.round(aov).toLocaleString()}`],
                ].map(([k, v]) => (
                  <div key={String(k)} className="flex items-center justify-between py-2.5">
                    <dt className="text-slate-600">{k}</dt>
                    <dd className="font-bold text-slate-950 tabular-nums">{v}</dd>
                  </div>
                ))}
              </dl>
            </SectionCard>
          </div>

          {/* Products + orders */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SectionCard
              title="Top products"
              right={
                <Link href="/dashboard/inventory" className="text-xs font-bold underline whitespace-nowrap">
                  Inventory &rarr;
                </Link>
              }
            >
              {bestSellingProducts.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">
                  No products yet.{' '}
                  <Link href="/dashboard/products/new" className="font-bold underline">
                    Add your first product
                  </Link>
                </p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {bestSellingProducts.map((pr) => {
                    const low = pr.stock <= (pr.lowStockThreshold || 5);
                    return (
                      <li key={pr.id}>
                        <Link href={`/dashboard/products/${pr.id}`} className="flex items-center gap-3 py-3 hover:bg-slate-50 -mx-2 px-2 rounded-lg">
                          <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                            <SafeImage src={pr.image} alt={pr.name} fill className="object-cover" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-950 truncate">{pr.name}</p>
                            <p className="text-xs text-slate-500">{pr.sku} &middot; ৳{pr.price}</p>
                          </div>
                          <span
                            className={`text-xs font-bold px-2 py-1 rounded-full shrink-0 ${
                              low ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {pr.stock} in stock
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </SectionCard>

            <SectionCard
              title="Recent orders"
              right={
                <Link href="/dashboard/orders" className="text-xs font-bold underline whitespace-nowrap">
                  All orders &rarr;
                </Link>
              }
            >
              {recentOrders.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">
                  No orders yet. Share your store link to get your first one.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {recentOrders.map((ord) => (
                    <li key={ord.id}>
                      <Link href={`/dashboard/orders/${ord.id}`} className="flex items-center gap-3 py-3 hover:bg-slate-50 -mx-2 px-2 rounded-lg">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-950 truncate">{ord.customerName}</p>
                          <p className="text-xs text-slate-500 font-mono">{ord.id}</p>
                        </div>
                        <StatusBadge status={ord.status} />
                        <span className="text-sm font-bold text-slate-950 tabular-nums w-20 text-right shrink-0">৳{ord.total}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          </div>

          {/* Remaining setup (compact) */}
          {checklistPct < 100 && nextSteps.length > 0 && (
            <SectionCard id="readiness" title={`Finish setting up (${checklistPct}%)`}>
              <ul className="divide-y divide-slate-100">
                {nextSteps.map((item) => (
                  <li key={item.id}>
                    <Link href={item.href} className="flex items-center justify-between gap-3 py-2.5 text-sm text-slate-800 hover:text-slate-950">
                      <span>{item.label}</span>
                      <span className="text-xs font-bold text-slate-500">Go &rarr;</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}
        </>
      )}
    </div>
  );
}
