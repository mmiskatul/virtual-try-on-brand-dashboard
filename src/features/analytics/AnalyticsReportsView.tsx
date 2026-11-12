'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Download,
  Eye,
  Globe,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import { DEMO_REVENUE_SERIES } from '../../data/brandDemoSeed';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { useUiStore } from '../../stores/useUiStore';
import { useMounted } from '../../hooks/useMounted';
import {
  KpiCard,
  PageHeader,
  PermissionGate,
  SectionCard,
  StatusBadge,
  SvgBarChart,
} from '../../components/shared/UiPrimitives';
import { Button } from '../../components/ui/button';

export type AnalyticsTab =
  | 'overview'
  | 'sales'
  | 'products'
  | 'customers'
  | 'marketplace'
  | 'virtual-try-on';

const ANALYTICS_TABS: Array<{ id: AnalyticsTab; label: string; href: string }> = [
  { id: 'overview', label: 'Business Analytics', href: '/dashboard/analytics' },
  { id: 'sales', label: 'Sales Reports', href: '/dashboard/analytics/sales' },
  { id: 'products', label: 'Product Performance', href: '/dashboard/analytics/products' },
  { id: 'customers', label: 'Customer Analytics', href: '/dashboard/analytics/customers' },
  { id: 'marketplace', label: 'Marketplace Analytics', href: '/dashboard/analytics/marketplace' },
  { id: 'virtual-try-on', label: 'Virtual Try-On Reports', href: '/dashboard/analytics/virtual-try-on' },
];

export function AnalyticsReportsView({
  initialTab = 'overview',
}: {
  initialTab?: AnalyticsTab;
}) {
  const mounted = useMounted();
  const products = useWorkspaceStore((s) => s.products);
  const orders = useWorkspaceStore((s) => s.orders);
  const customers = useWorkspaceStore((s) => s.customers);
  const marketplacePosts = useWorkspaceStore((s) => s.marketplacePosts);
  const tryOnSessions = useWorkspaceStore((s) => s.tryOnSessions);
  const showToast = useUiStore((s) => s.showToast);

  const [tab, setTab] = useState<AnalyticsTab>(initialTab);
  const [period, setPeriod] = useState<'today' | '7d' | '30d' | '90d'>('7d');

  const safeProducts = mounted ? products : [];
  const safeOrders = mounted ? orders : [];
  const safeCustomers = mounted ? customers : [];
  const safePosts = mounted ? marketplacePosts : [];
  const safeSessions = mounted ? tryOnSessions : [];

  const activeOrders = safeOrders.filter((o) => o.status !== 'CANCELLED' && o.status !== 'REFUNDED');
  const grossSales = safeOrders.reduce((s, o) => s + o.total, 0);
  const netSales = activeOrders.reduce((s, o) => s + o.total, 0);
  const totalDiscounts = safeOrders.reduce((s, o) => s + (o.discount || 0), 0);
  const refundedTotal = safeOrders
    .filter((o) => o.status === 'REFUNDED')
    .reduce((s, o) => s + o.total, 0);
  const aov = activeOrders.length > 0 ? netSales / activeOrders.length : 0;

  const newCustomers = safeCustomers.filter((c) => c.group === 'NEW').length;
  const returningCustomers = safeCustomers.filter((c) => c.group !== 'NEW').length;
  const avgClv =
    safeCustomers.length > 0
      ? safeCustomers.reduce((s, c) => s + c.totalSpend, 0) / safeCustomers.length
      : 0;

  const mktImpressions = safePosts.reduce((s, p) => s + p.impressions, 0);
  const mktClicks = safePosts.reduce((s, p) => s + p.clicks, 0);
  const mktRevenue = safePosts.reduce((s, p) => s + p.revenue, 0);

  const completedTryOns = safeSessions.filter((t) => t.status === 'COMPLETED').length;
  const failedTryOns = safeSessions.filter((t) => t.status === 'FAILED').length;
  const tryOnCartAdds = safeSessions.filter((t) => t.convertedToCart).length;
  const tryOnAttributedRevenue = safeSessions.reduce((s, t) => s + (t.attributedRevenue || 0), 0);

  const topProducts = useMemo(
    () => [...safeProducts].sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0)).slice(0, 8),
    [safeProducts]
  );

  const handleExportReport = () => {
    const csv = [
      ['Metric', 'Value'].join(','),
      ['Gross Sales', grossSales.toFixed(2)],
      ['Net Sales', netSales.toFixed(2)],
      ['Discounts', totalDiscounts.toFixed(2)],
      ['Refunds', refundedTotal.toFixed(2)],
      ['Average Order Value', aov.toFixed(2)],
      ['Marketplace Impressions', mktImpressions],
      ['Marketplace Clicks', mktClicks],
      ['Marketplace Revenue', mktRevenue.toFixed(2)],
      ['Completed Try-Ons', completedTryOns],
      ['Try-On Attributed Revenue', tryOnAttributedRevenue.toFixed(2)],
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brand-analytics-${tab}-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported analytics summary CSV.');
  };

  return (
    <PermissionGate module="analytics" action="view">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Business Intelligence"
          title="Analytics & Performance Reports"
          subtitle="Sales performance, product conversion, customer lifetime spend, marketplace attribution, and virtual try-on ROI."
          actions={
            <Button variant="outline" size="sm" onClick={handleExportReport} className="gap-1.5">
              <Download className="w-3.5 h-3.5" /> Export Report CSV
            </Button>
          }
        />

        <div className="flex flex-wrap gap-2">
          {ANALYTICS_TABS.map((t) => (
            <Link
              key={t.id}
              href={t.href}
              onClick={() => setTab(t.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
                tab === t.id
                  ? 'bg-slate-950 text-white border-slate-950'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {(tab === 'overview' || tab === 'sales') && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <KpiCard label="Gross Revenue" value={`৳${grossSales.toFixed(2)}`} icon={<TrendingUp className="w-4 h-4" />} />
              <KpiCard label="Net Sales" value={`৳${netSales.toFixed(2)}`} icon={<BarChart3 className="w-4 h-4" />} />
              <KpiCard label="Discounts Given" value={`৳${totalDiscounts.toFixed(2)}`} icon={<ShoppingBag className="w-4 h-4" />} />
              <KpiCard label="Refunds" value={`৳${refundedTotal.toFixed(2)}`} icon={<Users className="w-4 h-4" />} />
              <KpiCard label="Average Order Value" value={`৳${aov.toFixed(2)}`} icon={<TrendingUp className="w-4 h-4" />} />
            </div>

            <SectionCard
              title="Revenue Trend"
              subtitle="Sample time-series visualization across tenant orders"
              right={
                <div className="flex gap-1.5 text-xs">
                  {(['today', '7d', '30d', '90d'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPeriod(p)}
                      className={`px-2.5 py-1 rounded-lg font-bold border ${
                        period === p
                          ? 'bg-slate-950 text-white border-slate-950'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      {p.toUpperCase()}
                    </button>
                  ))}
                </div>
              }
            >
              <SvgBarChart data={DEMO_REVENUE_SERIES[period]} valueKey="revenue" prefix="$" />
            </SectionCard>
          </>
        )}

        {(tab === 'overview' || tab === 'products') && (
          <SectionCard
            title="Top Performing Garments"
            subtitle="Ranked by units sold from your brand catalog"
          >
            <div className="sm:hidden space-y-2.5 text-xs">
              {topProducts.map((p) => {
                const views = p.viewsCount || 1;
                const sales = p.salesCount || 0;
                const cvr = ((sales / views) * 100).toFixed(1);
                return (
                  <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">{p.name}</p>
                        <p className="text-[11px] text-slate-500">{p.category} · ${p.price.toFixed(2)}</p>
                      </div>
                      <span className="font-bold text-emerald-700 shrink-0">{cvr}% CVR</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                      <div>
                        <span className="text-slate-400 block">Views</span>
                        <span className="font-semibold text-slate-700 tabular-nums">{views.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Sold</span>
                        <span className="font-extrabold text-slate-950 tabular-nums">{sales}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 block">Stock</span>
                        <span className="font-semibold text-slate-700 tabular-nums">{p.stock}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-2.5 pr-4">Product</th>
                    <th className="py-2.5 pr-4">Category</th>
                    <th className="py-2.5 pr-4">Price</th>
                    <th className="py-2.5 pr-4">Views</th>
                    <th className="py-2.5 pr-4">Units Sold</th>
                    <th className="py-2.5 pr-4">Est. Conversion</th>
                    <th className="py-2.5 text-right">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topProducts.map((p) => {
                    const views = p.viewsCount || 1;
                    const sales = p.salesCount || 0;
                    const cvr = ((sales / views) * 100).toFixed(1);
                    return (
                      <tr key={p.id}>
                        <td className="py-3 pr-4 font-bold text-slate-900">{p.name}</td>
                        <td className="py-3 pr-4 text-slate-600">{p.category}</td>
                        <td className="py-3 pr-4 font-semibold">৳{p.price.toFixed(2)}</td>
                        <td className="py-3 pr-4 text-slate-600">{views.toLocaleString()}</td>
                        <td className="py-3 pr-4 font-extrabold text-slate-950">{sales}</td>
                        <td className="py-3 pr-4 text-emerald-700 font-bold">{cvr}%</td>
                        <td className="py-3 text-right">{p.stock}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </SectionCard>
        )}

        {tab === 'customers' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <KpiCard label="New Buyers" value={newCustomers} icon={<Users className="w-4 h-4" />} />
              <KpiCard label="Repeat / High-Value Buyers" value={returningCustomers} icon={<Users className="w-4 h-4" />} />
              <KpiCard label="Average Customer Value" value={`৳${avgClv.toFixed(2)}`} icon={<TrendingUp className="w-4 h-4" />} />
            </div>
            <SectionCard title="Top Patrons by Lifetime Spend">
              <div className="space-y-2 text-xs">
                {[...safeCustomers]
                  .sort((a, b) => b.totalSpend - a.totalSpend)
                  .map((c) => (
                    <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl border border-slate-200">
                      <div>
                        <p className="font-bold text-slate-900">{c.name}</p>
                        <p className="text-slate-500">
                          {c.city} • {c.orderCount} order(s)
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="font-extrabold text-slate-950">৳{c.totalSpend.toFixed(2)}</p>
                        <StatusBadge status={c.group} />
                      </div>
                    </div>
                  ))}
              </div>
            </SectionCard>
          </div>
        )}

        {tab === 'marketplace' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <KpiCard label="Marketplace Views" value={mktImpressions.toLocaleString()} icon={<Eye className="w-4 h-4" />} />
              <KpiCard label="Marketplace Clicks" value={mktClicks.toLocaleString()} icon={<Globe className="w-4 h-4" />} />
              <KpiCard
                label="Click-Through Rate"
                value={mktImpressions > 0 ? `${((mktClicks / mktImpressions) * 100).toFixed(1)}%` : '0.0%'}
                icon={<TrendingUp className="w-4 h-4" />}
              />
              <KpiCard label="Marketplace Revenue" value={`৳${mktRevenue.toFixed(2)}`} icon={<ShoppingBag className="w-4 h-4" />} />
            </div>
            <SectionCard title="Post-by-Post Marketplace Performance">
              <div className="sm:hidden space-y-2.5 text-xs">
                {safePosts.map((p) => (
                  <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-slate-900 line-clamp-2 leading-snug">{p.title}</p>
                      <StatusBadge status={p.status} />
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                      <div>
                        <span className="text-slate-400 block">Impressions</span>
                        <span className="font-semibold text-slate-700 tabular-nums">{p.impressions.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Clicks / Favs</span>
                        <span className="font-semibold text-slate-700 tabular-nums">{p.clicks.toLocaleString()} / {p.favorites}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 block">Revenue</span>
                        <span className="font-extrabold text-slate-950 tabular-nums">৳{p.revenue.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="py-2.5 pr-4">Listing Title</th>
                      <th className="py-2.5 pr-4">Status</th>
                      <th className="py-2.5 pr-4">Impressions</th>
                      <th className="py-2.5 pr-4">Clicks</th>
                      <th className="py-2.5 pr-4">Favorites</th>
                      <th className="py-2.5 pr-4">Orders</th>
                      <th className="py-2.5 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {safePosts.map((p) => (
                      <tr key={p.id}>
                        <td className="py-3 pr-4 font-bold text-slate-900">{p.title}</td>
                        <td className="py-3 pr-4">
                          <StatusBadge status={p.status} />
                        </td>
                        <td className="py-3 pr-4">{p.impressions.toLocaleString()}</td>
                        <td className="py-3 pr-4">{p.clicks.toLocaleString()}</td>
                        <td className="py-3 pr-4">{p.favorites}</td>
                        <td className="py-3 pr-4">{p.orders}</td>
                        <td className="py-3 text-right font-bold">৳{p.revenue.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div>
        )}

        {tab === 'virtual-try-on' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <KpiCard label="Completed Sessions" value={completedTryOns} icon={<Sparkles className="w-4 h-4 text-amber-600" />} />
              <KpiCard label="Failed / Rejected" value={failedTryOns} positive={failedTryOns === 0} icon={<BarChart3 className="w-4 h-4" />} />
              <KpiCard label="Cart Conversions" value={tryOnCartAdds} icon={<ShoppingBag className="w-4 h-4" />} />
              <KpiCard label="Try-On Attributed Sales" value={`৳${tryOnAttributedRevenue.toFixed(2)}`} icon={<TrendingUp className="w-4 h-4" />} />
            </div>
            <SectionCard title="Daily Virtual Try-On Volume">
              <SvgBarChart data={DEMO_REVENUE_SERIES[period]} valueKey="tryOns" color="#d97706" />
            </SectionCard>
          </div>
        )}
      </div>
    </PermissionGate>
  );
}

