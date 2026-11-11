'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  CheckCircle2,
  Coins,
  CreditCard,
  ExternalLink,
  Eye,
  Globe,
  Palette,
  Plus,
  ShoppingBag,
  Sparkles,
  Store,
  TrendingUp,
  Users,
} from 'lucide-react';
import { DEMO_REVENUE_SERIES } from '../../data/brandDemoSeed';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { useMounted } from '../../hooks/useMounted';
import {
  KpiCard,
  PageHeader,
  SafeImage,
  SectionCard,
  StatusBadge,
  SvgBarChart,
} from '../../components/shared/UiPrimitives';
import { Button } from '../../components/ui/button';

const CHECKLIST_ITEMS = [
  { id: 'chk_profile', label: 'Complete brand profile & story', href: '/dashboard/brand/profile' },
  { id: 'chk_logo', label: 'Upload main logo & brand assets', href: '/dashboard/brand/identity' },
  { id: 'chk_cover', label: 'Configure storefront cover & theme', href: '/dashboard/storefront/editor' },
  { id: 'chk_biz', label: 'Add legal & business contact details', href: '/dashboard/settings/business' },
  { id: 'chk_product', label: 'Create first apparel product', href: '/dashboard/products/create' },
  { id: 'chk_variants', label: 'Configure sizes, colors & variants', href: '/dashboard/products' },
  { id: 'chk_storefront', label: 'Publish dedicated brand storefront', href: '/dashboard/storefront' },
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
  const onboardingCompletedIds = useWorkspaceStore((s) => s.onboardingCompletedIds);
  const toggleOnboardingChecklist = useWorkspaceStore((s) => s.toggleOnboardingChecklist);

  const [period, setPeriod] = useState<'today' | '7d' | '30d' | '90d' | 'custom'>('7d');
  const [chartMetric, setChartMetric] = useState<'revenue' | 'orders' | 'tryOns'>('revenue');

  const safeProducts = mounted ? products : [];
  const safeOrders = mounted ? orders : [];
  const safeCustomers = mounted ? customers : [];
  const safePosts = mounted ? marketplacePosts : [];
  const safeSessions = mounted ? tryOnSessions : [];
  const safeLogs = mounted ? activityLogs : [];

  const totalRevenue = useMemo(
    () => safeOrders.filter((o) => o.status !== 'CANCELLED' && o.status !== 'REFUNDED').reduce((s, o) => s + o.total, 0),
    [safeOrders]
  );
  const paidOrders = safeOrders.filter((o) => o.paymentStatus === 'PAID').length;
  const pendingOrders = safeOrders.filter((o) => o.status === 'PENDING' || o.status === 'PROCESSING').length;
  const cancelledOrders = safeOrders.filter((o) => o.status === 'CANCELLED').length;
  const refundedOrders = safeOrders.filter((o) => o.status === 'REFUNDED').length;
  const aov = safeOrders.length > 0 ? totalRevenue / safeOrders.length : 0;

  const totalSalesUnits = safeProducts.reduce((s, p) => s + (p.salesCount || 0), 0);
  const marketplaceViews = safePosts.reduce((s, p) => s + (p.impressions || 0), 0);
  const publishedCount = safeProducts.filter((p) => p.marketplacePublished).length;
  const creditsRemaining = Math.max(0, profile.quotaMax - profile.quotaUsed);

  // Strict factual Try-On attribution from actual session records
  const successfulTryOns = safeSessions.filter((t) => t.status === 'COMPLETED').length;
  const failedTryOns = safeSessions.filter((t) => t.status === 'FAILED').length;
  const cartConvertedTryOns = safeSessions.filter((t) => t.convertedToCart).length;
  const attributedOrders = safeSessions.filter((t) => Boolean(t.attributedOrderId)).length;
  const attributedRevenue = safeSessions.reduce((s, t) => s + (t.attributedRevenue || 0), 0);
  const avgDurationSec =
    safeSessions.length > 0
      ? (safeSessions.reduce((s, t) => s + t.durationMs, 0) / safeSessions.length / 1000).toFixed(2)
      : '0.00';

  const lowStockProducts = safeProducts.filter((p) => p.stock < (p.lowStockThreshold || 5));
  const bestSellingProducts = [...safeProducts]
    .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
    .slice(0, 4);

  const checklistPct = Math.round((onboardingCompletedIds.length / CHECKLIST_ITEMS.length) * 100);
  const chartData = period === 'custom' ? DEMO_REVENUE_SERIES['30d'] : DEMO_REVENUE_SERIES[period];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Brand Business Operating System"
        title={`Welcome back, ${profile.owner.split(' ')[0]}`}
        subtitle={`Isolated tenant workspace for ${profile.name} (${profile.slug}). Control catalog, marketplace publications, virtual try-on, and fulfillment.`}
        actions={
          <>
            <Link href={`/brands/${profile.slug}`} target="_blank">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Store className="w-3.5 h-3.5" /> View Public Store <ExternalLink className="w-3 h-3" />
              </Button>
            </Link>
            <Link href="/dashboard/products/create">
              <Button size="sm" className="gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Add Product
              </Button>
            </Link>
          </>
        }
      />

      {/* A. Welcome & Workspace Status Strip + Quick Actions */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
            <SafeImage src={profile.logo} alt={profile.name} fill className="object-cover" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-950">{profile.name}</h2>
              <StatusBadge status={profile.plan} />
              <StatusBadge status={profile.storeStatus || 'LIVE'} />
              <StatusBadge status={profile.marketplaceStatus || 'CONNECTED'} />
              <StatusBadge status="TRY-ON ACTIVE" />
            </div>
            <p className="text-xs text-slate-500">
              Storefront URL: <code>/brands/{profile.slug}</code> • Public Try-On: <code>/try/{profile.slug}</code>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/marketplace/create">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Globe className="w-3.5 h-3.5" /> Create Marketplace Post
            </Button>
          </Link>
          <Link href="/dashboard/virtual-try-on/studio">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Open Try-On Studio
            </Button>
          </Link>
          <Link href="/dashboard/storefront/editor">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Palette className="w-3.5 h-3.5" /> Customize Storefront
            </Button>
          </Link>
        </div>
      </div>

      {/* B. 8 Business Performance KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} change="+14.2%" icon={<CreditCard className="w-4 h-4" />} hint="Net merchandise revenue from active orders." />
        <KpiCard label="Total Orders" value={safeOrders.length} change="+8.5%" icon={<ShoppingBag className="w-4 h-4" />} hint="Confirmed tenant seller orders." />
        <KpiCard label="Total Products" value={safeProducts.length} change={`${publishedCount} public`} icon={<Store className="w-4 h-4" />} hint="All SKUs in your private + storefront catalog." />
        <KpiCard label="Total Customers" value={safeCustomers.length} change="+11.0%" icon={<Users className="w-4 h-4" />} hint="Verified shoppers who purchased from your brand." />
        <KpiCard label="Marketplace Views" value={marketplaceViews.toLocaleString()} change="+19.3%" icon={<Eye className="w-4 h-4" />} hint="Impressions across published marketplace listings." />
        <KpiCard label="Total Product Sales" value={totalSalesUnits.toLocaleString()} change="+9.4%" icon={<TrendingUp className="w-4 h-4" />} hint="Cumulative garment units sold." />
        <KpiCard label="Virtual Try-On Sessions" value={profile.quotaUsed} change={`${safeSessions.length} logged`} icon={<Sparkles className="w-4 h-4 text-amber-600" />} hint="Customer virtual fitting requests processed." />
        <KpiCard label="AI Credits Remaining" value={creditsRemaining.toLocaleString()} change={`of ${profile.quotaMax}`} positive={creditsRemaining > 100} icon={<Coins className="w-4 h-4" />} hint="Monthly plan AI try-on generation allowance." />
      </div>

      {/* C. Revenue Analytics & D. Sales Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <SectionCard
          className="lg:col-span-8"
          title="Revenue & Try-On Volume Analytics"
          subtitle="Interactive breakdown across revenue, orders, and try-on demand"
          right={
            <div className="flex flex-wrap gap-1.5 text-xs">
              {(['today', '7d', '30d', '90d', 'custom'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`px-2.5 py-1 rounded-lg font-bold border ${
                    period === p ? 'bg-slate-950 text-white border-slate-950' : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  {p === 'today' ? 'Today' : p === 'custom' ? 'Custom' : p.toUpperCase()}
                </button>
              ))}
            </div>
          }
        >
          <div className="flex gap-2 pb-2">
            {[
              ['revenue', 'Revenue ($)'],
              ['orders', 'Order Volume'],
              ['tryOns', 'Try-On Sessions'],
            ].map(([k, lbl]) => (
              <button
                key={k}
                type="button"
                onClick={() => setChartMetric(k as any)}
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  chartMetric === k ? 'bg-slate-200 text-slate-950' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>
          <SvgBarChart
            data={chartData}
            valueKey={chartMetric}
            prefix={chartMetric === 'revenue' ? '$' : ''}
          />
        </SectionCard>

        <SectionCard title="D. Sales Overview" subtitle="Real-time order breakdown" className="lg:col-span-4">
          <div className="space-y-2.5 text-xs">
            {[
              ['Total Merchandise Revenue', `$${totalRevenue.toFixed(2)}`],
              ['Paid Orders', paidOrders],
              ['Pending / Processing Orders', pendingOrders],
              ['Cancelled Orders', cancelledOrders],
              ['Refunded Orders', refundedOrders],
              ['Average Order Value (AOV)', `$${aov.toFixed(2)}`],
            ].map(([label, val]) => (
              <div key={String(label)} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-600 font-medium">{label}</span>
                <span className="font-extrabold text-slate-950">{val}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* F. Dedicated Virtual Try-On Performance & G. Marketplace Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <SectionCard
          className="lg:col-span-7"
          title="Virtual Try-On Performance & Attribution"
          subtitle="Measured strictly from recorded generation logs and attributed order IDs"
          right={
            <Link href="/dashboard/virtual-try-on/analytics" className="text-xs font-bold underline">
              Full Report &rarr;
            </Link>
          }
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {[
              ['Logged Sessions', safeSessions.length],
              ['Successful', successfulTryOns],
              ['Failed', failedTryOns],
              ['Avg Speed', `${avgDurationSec}s`],
              ['Cart Conversions', cartConvertedTryOns],
              ['Attributed Orders', attributedOrders],
              ['Attributed Rev', `$${attributedRevenue}`],
              ['Credits Consumed', safeSessions.reduce((s, t) => s + t.creditsUsed, 0)],
            ].map(([k, v]) => (
              <div key={String(k)} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <p className="text-[11px] text-slate-500">{k}</p>
                <p className="text-base font-extrabold text-slate-950 mt-0.5">{v}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          className="lg:col-span-5"
          title="Marketplace Publication Activity"
          subtitle="Explicit global catalog posts status"
          right={
            <Link href="/dashboard/marketplace" className="text-xs font-bold underline">
              Manage Posts &rarr;
            </Link>
          }
        >
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <p className="text-slate-500">Published Posts</p>
              <p className="text-lg font-extrabold text-slate-950 mt-0.5">{safePosts.filter((p) => p.status === 'PUBLISHED').length}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <p className="text-slate-500">Draft / Scheduled</p>
              <p className="text-lg font-extrabold text-slate-950 mt-0.5">
                {safePosts.filter((p) => p.status === 'DRAFT' || p.status === 'SCHEDULED').length}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <p className="text-slate-500">Total Clicks</p>
              <p className="text-lg font-extrabold text-slate-950 mt-0.5">
                {safePosts.reduce((s, p) => s + p.clicks, 0).toLocaleString()}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <p className="text-slate-500">Post Revenue</p>
              <p className="text-lg font-extrabold text-emerald-700 mt-0.5">
                ${safePosts.reduce((s, p) => s + p.revenue, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* E. Product Performance + J. Onboarding Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <SectionCard
          className="lg:col-span-6"
          title="Top Garments & Low-Stock Alerts"
          subtitle={`${lowStockProducts.length} SKU(s) currently below safety stock threshold`}
          right={<Link href="/dashboard/inventory" className="text-xs font-bold underline">Manage Inventory &rarr;</Link>}
        >
          {lowStockProducts.length > 0 && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-amber-900">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  Low stock on <strong>{lowStockProducts[0].name}</strong> ({lowStockProducts[0].stock} left)
                </span>
              </div>
              <Link href="/dashboard/inventory/adjustments" className="font-bold underline text-amber-950 shrink-0">
                Restock
              </Link>
            </div>
          )}

          <div className="space-y-2.5 pt-1">
            {bestSellingProducts.map((p) => (
              <Link
                key={p.id}
                href={`/dashboard/products/${p.id}`}
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-slate-300 transition-colors text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                    <SafeImage src={p.image} alt={p.name} fill className="object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">{p.name}</p>
                    <p className="text-[11px] text-slate-500">{p.salesCount || 0} sold • {p.stock} in stock</p>
                  </div>
                </div>
                <span className="font-extrabold text-slate-950">${p.price}</span>
              </Link>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          className="lg:col-span-6"
          title={`Getting Started Checklist (${checklistPct}%)`}
          subtitle="Complete all workspace milestones for maximum marketplace conversion"
          right={<Link href="/dashboard/getting-started" className="text-xs font-bold underline">Launch Wizard &rarr;</Link>}
        >
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden mb-3">
            <div className="h-full bg-slate-950 transition-all duration-300" style={{ width: `${checklistPct}%` }} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {CHECKLIST_ITEMS.map((item) => {
              const done = onboardingCompletedIds.includes(item.id);
              return (
                <div key={item.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 gap-2">
                  <button
                    type="button"
                    onClick={() => toggleOnboardingChecklist(item.id)}
                    className="flex items-center gap-2 text-left min-w-0"
                  >
                    <CheckCircle2 className={`w-4 h-4 shrink-0 ${done ? 'text-emerald-600' : 'text-slate-300'}`} />
                    <span className={`truncate ${done ? 'line-through text-slate-400' : 'text-slate-800 font-medium'}`}>
                      {item.label}
                    </span>
                  </button>
                  <Link href={item.href} className="text-[10px] font-bold text-slate-600 hover:text-slate-950 shrink-0">
                    Go
                  </Link>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>

      {/* H. Recent Activity & I. Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <SectionCard className="lg:col-span-5" title="Recent Brand Activity" subtitle="Chronological staff & system events">
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 text-xs">
            {safeLogs.slice(0, 6).map((log) => (
              <div key={log.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{log.entity}</span>
                  <span className="text-[10px] font-mono text-slate-400">{log.timestamp}</span>
                </div>
                <p className="text-slate-600">{log.details}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          className="lg:col-span-7"
          title="Recent Orders"
          subtitle="Direct fulfillment belonging strictly to this brand"
          right={<Link href="/dashboard/orders" className="text-xs font-bold underline">All Orders &rarr;</Link>}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-2 pr-3">Order</th>
                  <th className="py-2 pr-3">Customer</th>
                  <th className="py-2 pr-3">Amount</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {safeOrders.slice(0, 5).map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50">
                    <td className="py-2.5 pr-3 font-mono font-bold">
                      <Link href={`/dashboard/orders/${ord.id}`} className="hover:underline">
                        {ord.id}
                      </Link>
                    </td>
                    <td className="py-2.5 pr-3">{ord.customerName}</td>
                    <td className="py-2.5 pr-3 font-bold">${ord.total}</td>
                    <td className="py-2.5 pr-3"><StatusBadge status={ord.status} /></td>
                    <td className="py-2.5 text-right text-slate-500">{ord.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

