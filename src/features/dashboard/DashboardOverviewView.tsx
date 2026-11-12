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
  { id: 'chk_profile', label: 'Complete brand profile & story', href: '/dashboard/getting-started' },
  { id: 'chk_logo', label: 'Upload main logo & brand assets', href: '/dashboard/getting-started' },
  { id: 'chk_cover', label: 'Configure storefront cover & theme', href: '/dashboard/getting-started' },
  { id: 'chk_biz', label: 'Add legal & business contact details', href: '/dashboard/getting-started' },
  { id: 'chk_product', label: 'Create first apparel product', href: '/dashboard/products/create' },
  { id: 'chk_variants', label: 'Configure sizes, colors & variants', href: '/dashboard/products' },
  { id: 'chk_storefront', label: 'Publish dedicated brand storefront', href: '/dashboard/storefront/editor' },
  { id: 'chk_tryon', label: 'Configure Virtual Try-On experience', href: '/dashboard/virtual-try-on/configuration' },
  { id: 'chk_publish', label: 'Publish first product to global marketplace', href: '/dashboard/marketplace/create' },
  { id: 'chk_test_tryon', label: 'Test public Virtual Try-On studio', href: '/dashboard/virtual-try-on/studio' },
];

export function DashboardOverviewView() {
  const mounted = useMounted();
  const profile = useWorkspaceStore((s) => s.profile);
  const products = useWorkspaceStore((s) => s.products);
  const orders = useWorkspaceStore((s) => s.orders);
  const customers = useWorkspaceStore((s) => s.customers);
  const marketplacePosts = useWorkspaceStore((s) => s.marketplacePosts);
  const tryOnSessions = useWorkspaceStore((s) => s.tryOnSessions);
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
        setOverviewError(err?.message || 'Unable to load live overview telemetry.');
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

  const publishedPostsCount =
    summary?.marketplaceActivity.publishedPosts ?? safePosts.filter((p) => p.status === 'PUBLISHED').length;
  const draftOrScheduledPostsCount =
    summary?.marketplaceActivity.draftOrScheduled ??
    safePosts.filter((p) => p.status === 'DRAFT' || p.status === 'SCHEDULED').length;
  const totalPostClicks =
    summary?.marketplaceActivity.totalClicks ?? safePosts.reduce((s, p) => s + p.clicks, 0);
  const postRevenue =
    summary?.marketplaceActivity.postRevenue ?? safePosts.reduce((s, p) => s + p.revenue, 0);

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

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        eyebrow="Brand Business Operating System"
        title={`Welcome back, ${profile.owner.split(' ')[0]}`}
        subtitle={`Isolated tenant workspace for ${workspaceName} (${workspaceSlug}). Control catalog, marketplace publications, virtual try-on, and fulfillment.`}
        actions={
          <div className="grid grid-cols-3 sm:flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                void loadOverviewCore();
                void loadTimeseries();
              }}
              disabled={overviewLoading || timeseriesLoading}
              className="gap-1.5 w-full sm:w-auto justify-center text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${overviewLoading || timeseriesLoading ? 'animate-spin' : ''}`} />
              <span className="truncate">Refresh</span>
            </Button>
            <Link href={`/brands/${workspaceSlug}`} target="_blank" className="w-full sm:w-auto">
              <Button variant="outline" size="sm" className="gap-1.5 w-full sm:w-auto justify-center text-xs">
                <Store className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Public Store</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </Button>
            </Link>
            <Link href="/dashboard/products/create" className="w-full sm:w-auto">
              <Button size="sm" className="gap-1.5 w-full sm:w-auto justify-center text-xs">
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span>Add Product</span>
              </Button>
            </Link>
          </div>
        }
      />

      {overviewError && <ErrorBanner message={overviewError} onRetry={() => void loadOverviewCore()} />}

      {/* A. Welcome & Workspace Status Strip + Quick Actions */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <div className="flex items-start sm:items-center gap-3.5 sm:gap-4 min-w-0">
          <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
            <SafeImage src={workspaceLogo} alt={workspaceName} fill className="object-cover" />
          </div>
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h2 className="text-sm sm:text-base font-extrabold text-slate-950 truncate max-w-full">
                {workspaceName}
              </h2>
              <StatusBadge status={workspacePlan} />
              <StatusBadge status={workspaceStoreStatus} />
              <StatusBadge status={workspaceMarketplaceStatus} />
              <StatusBadge status={workspaceTryOnStatus} />
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] sm:text-xs text-slate-500">
              <Link
                href={`/brands/${workspaceSlug}`}
                target="_blank"
                className="inline-flex items-center gap-1 hover:text-slate-900 min-w-0 max-w-full"
              >
                <span className="shrink-0">Storefront:</span>
                <code className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono break-all">
                  /brands/{workspaceSlug}
                </code>
              </Link>
              <Link
                href={`/try/${workspaceSlug}`}
                target="_blank"
                className="inline-flex items-center gap-1 hover:text-slate-900 min-w-0 max-w-full"
              >
                <span className="shrink-0">Try-On:</span>
                <code className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono break-all">
                  /try/{workspaceSlug}
                </code>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 min-[440px]:grid-cols-3 lg:flex lg:flex-wrap gap-2 w-full lg:w-auto shrink-0">
          <Link href="/dashboard/marketplace/create" className="w-full lg:w-auto">
            <Button variant="outline" size="sm" className="gap-1.5 w-full lg:w-auto justify-center text-xs">
              <Globe className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Marketplace Post</span>
            </Button>
          </Link>
          <Link href="/dashboard/virtual-try-on/studio" className="w-full lg:w-auto">
            <Button variant="outline" size="sm" className="gap-1.5 w-full lg:w-auto justify-center text-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="truncate">Try-On Studio</span>
            </Button>
          </Link>
          <Link href="/dashboard/storefront/editor" className="w-full lg:w-auto">
            <Button variant="outline" size="sm" className="gap-1.5 w-full lg:w-auto justify-center text-xs">
              <Palette className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Storefront</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Module Switcher Strip for Mobile & Tablet */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
        {[
          { label: 'Products', href: '/dashboard/products', icon: ShoppingBag, badge: totalProductsCount },
          { label: 'Orders', href: '/dashboard/orders', icon: CreditCard, badge: pendingOrders },
          { label: 'Inventory', href: '/dashboard/inventory', icon: Boxes, badge: lowStockProducts.length },
          { label: 'Marketplace', href: '/dashboard/marketplace', icon: Globe },
          { label: 'Try-On Studio', href: '/dashboard/virtual-try-on/studio', icon: Sparkles },
          { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
          { label: 'Settings', href: '/dashboard/settings', icon: Settings },
        ].map((mod) => {
          const ModIcon = mod.icon;
          return (
            <Link
              key={mod.href}
              href={mod.href}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-white hover:border-slate-900 hover:bg-slate-50 text-xs font-semibold text-slate-700 shrink-0 transition-colors"
            >
              <ModIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>{mod.label}</span>
              {typeof mod.badge === 'number' && mod.badge > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-slate-900 text-white text-[10px] font-bold tabular-nums">
                  {mod.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* B. 8 Business Performance KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          label="Total Revenue"
          value={`৳${totalRevenue.toLocaleString()}`}
          change={summary?.kpis.revenueChangeLabel || 'Live BDT'}
          positive={!(summary?.kpis.revenueChangeLabel || '').startsWith('-')}
          icon={<CreditCard className="w-4 h-4" />}
          hint="Net merchandise revenue from active orders."
        />
        <KpiCard
          label="Total Orders"
          value={totalOrdersCount}
          change={summary?.kpis.ordersChangeLabel || `${pendingOrders} active`}
          positive={!(summary?.kpis.ordersChangeLabel || '').startsWith('-')}
          icon={<ShoppingBag className="w-4 h-4" />}
          hint="Confirmed tenant seller orders."
        />
        <KpiCard
          label="Total Products"
          value={totalProductsCount}
          change={`${publishedCount} market • ${storefrontPublishedCount} store`}
          icon={<Store className="w-4 h-4" />}
          hint="All SKUs in your private + storefront catalog."
        />
        <KpiCard
          label="Total Customers"
          value={totalCustomersCount}
          change={totalCustomersCount > 0 ? 'Unique buyers' : 'No orders yet'}
          icon={<Users className="w-4 h-4" />}
          hint="Verified shoppers who purchased from your brand."
        />
        <KpiCard
          label="Marketplace Views"
          value={marketplaceViews.toLocaleString()}
          change={`${publishedPostsCount} active`}
          icon={<Eye className="w-4 h-4" />}
          hint="Impressions across published marketplace listings."
        />
        <KpiCard
          label="Product Sales"
          value={totalSalesUnits.toLocaleString()}
          change={totalSalesUnits > 0 ? 'Units sold' : '0 units'}
          icon={<TrendingUp className="w-4 h-4" />}
          hint="Cumulative garment units sold."
        />
        <KpiCard
          label="Try-On Sessions"
          value={tryOnUsed}
          change={`${tryOnSessionsCount} logged`}
          icon={<Sparkles className="w-4 h-4 text-amber-600" />}
          hint="Customer virtual fitting requests processed."
        />
        <KpiCard
          label="AI Credits Left"
          value={creditsRemaining.toLocaleString()}
          change={`of ${tryOnQuota}`}
          positive={creditsRemaining > 100}
          icon={<Coins className="w-4 h-4" />}
          hint="Monthly plan AI try-on generation allowance."
        />
      </div>

      {/* C. Revenue Analytics & Sales Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        <SectionCard
          className="lg:col-span-8"
          title="Revenue & Try-On Volume Analytics"
          subtitle="Interactive breakdown across revenue, orders, and try-on demand"
          right={
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full pb-0.5 text-[11px] sm:text-xs">
              {(['today', '7d', '30d', '90d', 'custom'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`px-2.5 py-1 rounded-lg font-bold border shrink-0 transition-colors ${
                    period === p ? 'bg-slate-950 text-white border-slate-950' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {p === 'today' ? 'Today' : p === 'custom' ? 'Custom' : p.toUpperCase()}
                </button>
              ))}
            </div>
          }
        >
          {period === 'custom' && (
            <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
              <span className="font-semibold text-slate-600">Date Range:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                aria-label="Start date"
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-800"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                aria-label="End date"
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-800"
              />
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {[
                ['revenue', 'Revenue (৳)'],
                ['orders', 'Order Volume'],
                ['tryOns', 'Try-On Sessions'],
              ].map(([k, lbl]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setChartMetric(k as any)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                    chartMetric === k ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-950'
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>
            {timeseries && (
              <span className="text-[11px] font-semibold text-slate-500 tabular-nums">
                {timeseriesLoading
                  ? 'Updating...'
                  : `Period total: ৳${timeseries.totals.revenue.toLocaleString()} • ${timeseries.totals.orders} orders • ${timeseries.totals.tryOns} try-ons`}
              </span>
            )}
          </div>
          <SvgBarChart
            data={chartData}
            valueKey={chartMetric}
            prefix={chartMetric === 'revenue' ? '৳' : ''}
          />
        </SectionCard>

        <SectionCard title="Sales Overview" subtitle="Real-time order breakdown" className="lg:col-span-4">
          <div className="space-y-2.5 text-xs sm:text-[13px]">
            {[
              ['Total Merchandise Revenue', `৳${totalRevenue.toFixed(2)}`],
              ['Paid Orders', paidOrders],
              ['Pending / Processing', pendingOrders],
              ['Cancelled Orders', cancelledOrders],
              ['Refunded Orders', refundedOrders],
              ['Average Order Value (AOV)', `৳${aov.toFixed(2)}`],
            ].map(([label, val]) => (
              <div key={String(label)} className="flex items-center justify-between gap-3 p-2.5 sm:p-3 rounded-xl bg-slate-50 border border-slate-100 min-w-0">
                <span className="text-slate-600 font-medium leading-snug">{label}</span>
                <span className="font-extrabold text-slate-950 tabular-nums shrink-0">{val}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* F. Dedicated Virtual Try-On Performance & G. Marketplace Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        <SectionCard
          className="lg:col-span-7"
          title="Virtual Try-On Performance & Attribution"
          subtitle="Measured strictly from recorded generation logs and attributed order IDs"
          right={
            <Link href="/dashboard/virtual-try-on/analytics" className="text-xs font-bold underline whitespace-nowrap">
              Full Report &rarr;
            </Link>
          }
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
            {[
              ['Logged Sessions', loggedTryOns],
              ['Successful', successfulTryOns],
              ['Failed', failedTryOns],
              ['Avg Speed', `${avgDurationSec}s`],
              ['Cart Conversions', cartConvertedTryOns],
              ['Attributed Orders', attributedOrders],
              ['Attributed Rev', `৳${attributedRevenue.toLocaleString()}`],
              ['Credits Used', creditsUsedTotal],
            ].map(([k, v]) => (
              <div key={String(k)} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 min-w-0">
                <p className="text-[11px] sm:text-xs text-slate-500 leading-snug">{k}</p>
                <p className="text-base sm:text-lg font-extrabold text-slate-950 mt-0.5 tabular-nums">{v}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          className="lg:col-span-5"
          title="Marketplace Publication Activity"
          subtitle="Explicit global catalog posts status"
          right={
            <Link href="/dashboard/marketplace" className="text-xs font-bold underline whitespace-nowrap">
              Manage Posts &rarr;
            </Link>
          }
        >
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 text-xs">
            <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 min-w-0">
              <p className="text-[11px] sm:text-xs text-slate-500">Published Posts</p>
              <p className="text-base sm:text-lg font-extrabold text-slate-950 mt-0.5 tabular-nums">
                {publishedPostsCount}
              </p>
            </div>
            <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 min-w-0">
              <p className="text-[11px] sm:text-xs text-slate-500">Draft / Scheduled</p>
              <p className="text-base sm:text-lg font-extrabold text-slate-950 mt-0.5 tabular-nums">
                {draftOrScheduledPostsCount}
              </p>
            </div>
            <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 min-w-0">
              <p className="text-[11px] sm:text-xs text-slate-500">Total Clicks</p>
              <p className="text-base sm:text-lg font-extrabold text-slate-950 mt-0.5 tabular-nums">
                {totalPostClicks.toLocaleString()}
              </p>
            </div>
            <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 min-w-0">
              <p className="text-[11px] sm:text-xs text-slate-500">Post Revenue</p>
              <p className="text-base sm:text-lg font-extrabold text-emerald-700 mt-0.5 tabular-nums">
                ৳{postRevenue.toLocaleString()}
              </p>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* E. Product Performance + Onboarding Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        <SectionCard
          className="lg:col-span-6"
          title="Top Garments & Low-Stock Alerts"
          subtitle={`${lowStockProducts.length} SKU(s) currently below safety stock threshold`}
          right={
            <Link href="/dashboard/inventory" className="text-xs font-bold underline whitespace-nowrap">
              Manage Inventory &rarr;
            </Link>
          }
        >
          {lowStockProducts.length > 0 && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-start sm:items-center gap-2 text-amber-900 min-w-0">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 sm:mt-0" />
                <span className="leading-snug">
                  Low stock on <strong>{lowStockProducts[0].name}</strong> ({lowStockProducts[0].stock} left)
                </span>
              </div>
              <Link href="/dashboard/inventory/adjustments" className="font-bold underline text-amber-950 shrink-0 self-end sm:self-auto">
                Restock &rarr;
              </Link>
            </div>
          )}

          {bestSellingProducts.length === 0 ? (
            <div className="p-5 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 text-center space-y-2 text-xs text-slate-500">
              <p>No garments in your catalog yet.</p>
              <Link href="/dashboard/products/create" className="inline-block font-bold text-slate-900 underline">
                Create your first product &rarr;
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5 pt-1">
              {bestSellingProducts.map((p) => (
                <Link
                  key={p.id}
                  href={`/dashboard/products/${p.id}`}
                  className="flex items-center justify-between gap-3 p-2.5 sm:p-3 rounded-xl border border-slate-100 hover:border-slate-300 transition-colors text-xs sm:text-[13px]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                      <SafeImage src={p.image} alt={p.name} fill className="object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">{p.name}</p>
                      <p className="text-[11px] sm:text-xs text-slate-500">
                        {p.salesCount || 0} sold • {p.stock} in stock
                      </p>
                    </div>
                  </div>
                  <span className="font-extrabold text-slate-950 tabular-nums shrink-0">৳{p.price}</span>
                </Link>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          className="lg:col-span-6"
          title={`Getting Started Checklist (${checklistPct}%)`}
          subtitle="Auto-synced with workspace setup plus manual milestone tracking"
          right={
            <Link href="/dashboard/getting-started" className="text-xs font-bold underline whitespace-nowrap">
              Launch Wizard &rarr;
            </Link>
          }
        >
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden mb-3">
            <div className="h-full bg-slate-950 transition-all duration-300" style={{ width: `${checklistPct}%` }} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {checklistItems.map((item) => {
              const done = item.completed;
              const isSaving = checklistSavingId === item.id;
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 sm:p-2 rounded-xl bg-slate-50 border border-slate-100 gap-2.5 min-h-[44px] sm:min-h-0"
                >
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => void handleToggleChecklist(item.id)}
                    className="flex items-center gap-2 text-left min-w-0 flex-1 disabled:opacity-60"
                  >
                    <CheckCircle2 className={`w-4 h-4 shrink-0 ${done ? 'text-emerald-600' : 'text-slate-300'}`} />
                    <span className={`line-clamp-2 sm:line-clamp-1 leading-snug ${done ? 'line-through text-slate-400' : 'text-slate-800 font-medium'}`}>
                      {item.label}
                    </span>
                  </button>
                  <Link
                    href={item.href}
                    className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-slate-700 hover:text-slate-950 shrink-0"
                  >
                    Go
                  </Link>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>

      {/* H. Recent Activity & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        <SectionCard className="lg:col-span-5" title="Recent Brand Activity" subtitle="Chronological staff & system events">
          {safeLogs.length === 0 ? (
            <div className="p-5 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 text-center text-xs text-slate-500">
              No workspace activity logged yet. Catalog edits, inventory adjustments, and storefront updates appear here.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 text-xs">
              {safeLogs.slice(0, 6).map((log) => (
                <div key={log.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <span className="font-bold text-slate-900 break-words">{log.entity}</span>
                    <span className="text-[10px] sm:text-[11px] font-mono text-slate-400 shrink-0">{log.timestamp}</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{log.details}</p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          className="lg:col-span-7"
          title="Recent Orders"
          subtitle="Direct fulfillment belonging strictly to this brand"
          right={
            <Link href="/dashboard/orders" className="text-xs font-bold underline whitespace-nowrap">
              All Orders &rarr;
            </Link>
          }
        >
          {recentOrders.length === 0 ? (
            <div className="p-5 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 text-center text-xs text-slate-500">
              No orders placed yet. Published storefront and marketplace orders will show up here.
            </div>
          ) : (
            <>
              {/* Mobile Phone Card Layout */}
              <div className="sm:hidden space-y-2.5">
                {recentOrders.map((ord) => (
                  <Link
                    key={ord.id}
                    href={`/dashboard/orders/${ord.id}`}
                    className="block p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-white transition-colors space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-extrabold text-slate-950">{ord.id}</span>
                      <StatusBadge status={ord.status} />
                    </div>
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{ord.customerName}</p>
                        <p className="text-[11px] text-slate-500">{ord.date}</p>
                      </div>
                      <span className="text-sm font-extrabold text-slate-950 tabular-nums shrink-0">৳{ord.total}</span>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Desktop Table Layout */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-[13px]">
                  <thead className="text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-2 pr-3">Order</th>
                      <th className="py-2 pr-3">Customer</th>
                      <th className="py-2 pr-3">Amount</th>
                      <th className="py-2 pr-3">Status</th>
                      <th className="py-2 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-50">
                        <td className="py-2.5 pr-3 font-mono font-bold whitespace-nowrap">
                          <Link href={`/dashboard/orders/${ord.id}`} className="hover:underline">
                            {ord.id}
                          </Link>
                        </td>
                        <td className="py-2.5 pr-3">{ord.customerName}</td>
                        <td className="py-2.5 pr-3 font-bold tabular-nums">৳{ord.total}</td>
                        <td className="py-2.5 pr-3"><StatusBadge status={ord.status} /></td>
                        <td className="py-2.5 text-right text-slate-500 whitespace-nowrap">{ord.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

