'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowDownRight, ArrowUpRight, Minus, RefreshCw } from 'lucide-react';
import {
  brandWorkspaceApi,
  type CustomersReport,
  type ProductsReport,
  type ReportPeriod,
  type SalesReport,
  type TryOnReport,
} from '../../services/brandService';
import { EmptyState, ErrorBanner, PageHeader, PermissionGate, SafeImage, SectionCard } from '../../components/shared/UiPrimitives';
import { Button } from '../../components/ui/button';

const PERIODS: Array<{ id: ReportPeriod; label: string }> = [
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
  { id: '90d', label: 'Last 90 days' },
];

const money = (n: number) => `৳${Math.round(n).toLocaleString()}`;

type Loaded = {
  sales: SalesReport;
  products: ProductsReport;
  customers: CustomersReport;
  tryOn: TryOnReport;
};

/** "Up 12% from the last period" style change badge. */
function Change({ value }: { value: number | null | undefined }) {
  if (value === null || value === undefined) return <span className="text-[11px] text-slate-400">No earlier data to compare</span>;
  if (value === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
        <Minus className="h-3 w-3" /> Same as before
      </span>
    );
  }
  const up = value > 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${up ? 'text-emerald-700' : 'text-rose-700'}`}>
      <Icon className="h-3.5 w-3.5" />
      {Math.abs(value)}% {up ? 'more' : 'less'} than before
    </span>
  );
}

function Stat({ label, value, change, note }: { label: string; value: string; change?: number | null; note?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950">{value}</p>
      <div className="mt-1.5">{note ? <span className="text-[11px] text-slate-500">{note}</span> : <Change value={change} />}</div>
    </div>
  );
}

/** A simple bar chart. Each bar has a plain-text label for screen readers. */
function Bars({ rows, value, format }: { rows: Array<{ label: string; value: number }>; value: string; format: (n: number) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  const dense = rows.length > 14;
  return (
    <div>
      <div className="flex h-44 items-end gap-1" role="img" aria-label={`${value} by day`}>
        {rows.map((r, i) => (
          <div key={`${r.label}-${i}`} className="group relative flex h-full flex-1 items-end" title={`${r.label}: ${format(r.value)}`}>
            <div
              className="w-full rounded-t-md bg-slate-900 transition-colors group-hover:bg-slate-700"
              style={{ height: `${r.value > 0 ? Math.max(4, (r.value / max) * 100) : 0}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-slate-400">
        <span>{rows[0]?.label}</span>
        {!dense && rows.length > 2 && <span>{rows[Math.floor(rows.length / 2)]?.label}</span>}
        <span>{rows[rows.length - 1]?.label}</span>
      </div>
    </div>
  );
}

export function ReportsView() {
  const [period, setPeriod] = useState<ReportPeriod>('30d');
  const [data, setData] = useState<Loaded | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (p: ReportPeriod) => {
    setLoading(true);
    setError(null);
    try {
      const [sales, products, customers, tryOn] = await Promise.all([
        brandWorkspaceApi.getSalesReport(p),
        brandWorkspaceApi.getProductsReport(p),
        brandWorkspaceApi.getCustomersReport(p),
        brandWorkspaceApi.getTryOnReport(p),
      ]);
      setData({ sales, products, customers, tryOn });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not load your reports.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(period);
  }, [load, period]);

  const periodLabel = PERIODS.find((p) => p.id === period)?.label.toLowerCase();

  return (
    <PermissionGate module="analytics" action="view">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Reports"
          title="Reports"
          subtitle="How your shop is doing: sales, best products, customers and virtual try-on."
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-xl border border-slate-200 bg-white p-1" role="group" aria-label="Time period">
                {PERIODS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={period === p.id}
                    onClick={() => setPeriod(p.id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold ${period === p.id ? 'bg-slate-950 text-white' : 'text-slate-600'}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => void load(period)} disabled={loading}>
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </Button>
            </div>
          }
        />

        <nav aria-label="Jump to a section" className="flex flex-wrap gap-2 text-xs font-bold">
          {[['sales', 'Sales'], ['products', 'Products'], ['customers', 'Customers'], ['try-on', 'Virtual try-on']].map(([id, label]) => (
            <a key={id} href={`#${id}`} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-700 hover:border-slate-400">
              {label}
            </a>
          ))}
        </nav>

        {error && <ErrorBanner message={error} onRetry={() => void load(period)} />}

        {loading && !data ? (
          <div className="space-y-4" aria-busy="true" aria-label="Loading reports">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
            <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
          </div>
        ) : data ? (
          <div className={`space-y-8 ${loading ? 'opacity-60' : ''}`}>
            {/* Sales */}
            <section id="sales" className="scroll-mt-24 space-y-4">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Stat label="Sales" value={money(data.sales.revenue)} change={data.sales.change.revenue} />
                <Stat label="Orders" value={String(data.sales.orders)} change={data.sales.change.orders} />
                <Stat label="Average order" value={money(data.sales.averageOrderValue)} change={data.sales.change.averageOrderValue} />
                <Stat label="Given in discounts" value={money(data.sales.discountsGiven)} note={`In the ${periodLabel}`} />
              </div>

              <SectionCard title="Sales over time" subtitle={period === '90d' ? 'Each bar is one week' : 'Each bar is one day'}>
                {data.sales.orders === 0 ? (
                  <EmptyState title="No sales yet in this time" description="When shoppers buy from you, your sales will show here." />
                ) : (
                  <Bars rows={data.sales.series.map((d) => ({ label: d.label, value: d.revenue }))} value="Sales" format={money} />
                )}
                <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3 text-xs">
                  {[['PENDING', 'New'], ['PROCESSING', 'Packed'], ['SHIPPED', 'Shipped'], ['DELIVERED', 'Delivered'], ['CANCELLED', 'Cancelled']].map(([k, label]) => (
                    <span key={k} className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">
                      {label}: {data.sales.byStatus[k] || 0}
                    </span>
                  ))}
                </div>
              </SectionCard>
            </section>

            {/* Products */}
            <section id="products" className="scroll-mt-24">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <SectionCard title="Best-selling products" subtitle={`${data.products.totalUnits} item${data.products.totalUnits === 1 ? '' : 's'} sold in the ${periodLabel}`}>
                  {data.products.top.length === 0 ? (
                    <EmptyState title="Nothing sold yet" description="Your best sellers will show here once orders come in." />
                  ) : (
                    <ol className="space-y-2.5">
                      {data.products.top.map((p, i) => (
                        <li key={p.productId} className="flex items-center gap-3 rounded-xl border border-slate-100 p-2.5 text-xs">
                          <span className="w-5 text-center font-extrabold text-slate-400">{i + 1}</span>
                          <div className="relative h-11 w-9 shrink-0 overflow-hidden rounded-md bg-slate-100">
                            <SafeImage src={p.imageUrl || ''} alt={p.name} fill className="object-cover" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-bold text-slate-900">{p.name}</p>
                            <p className="text-slate-500">{p.units} sold</p>
                          </div>
                          <span className="font-extrabold text-slate-950">{money(p.revenue)}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                </SectionCard>

                <SectionCard title="Not selling yet" subtitle="Products with no sales in this time">
                  {data.products.notSold.length === 0 ? (
                    <EmptyState title="Everything is selling" description="Every live product has had at least one sale." />
                  ) : (
                    <ul className="space-y-2.5">
                      {data.products.notSold.map((p) => (
                        <li key={p.productId} className="flex items-center gap-3 rounded-xl border border-slate-100 p-2.5 text-xs">
                          <div className="relative h-11 w-9 shrink-0 overflow-hidden rounded-md bg-slate-100">
                            <SafeImage src={p.imageUrl || ''} alt={p.name} fill className="object-cover" />
                          </div>
                          <span className="min-w-0 flex-1 truncate font-semibold text-slate-900">{p.name}</span>
                          <Link href={`/dashboard/products/${p.productId}`} className="font-bold underline">View</Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </SectionCard>
              </div>
            </section>

            {/* Customers */}
            <section id="customers" className="scroll-mt-24">
              <SectionCard
                title="Your customers"
                subtitle={`${data.customers.totalCustomers} customer${data.customers.totalCustomers === 1 ? '' : 's'} bought in the ${periodLabel}`}
              >
                {data.customers.totalCustomers === 0 ? (
                  <EmptyState title="No customers yet" description="People who buy from you will show here." />
                ) : (
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
                      <div className="rounded-xl bg-emerald-50 p-4">
                        <p className="text-xs font-semibold text-emerald-800">New buyers</p>
                        <p className="text-2xl font-extrabold text-emerald-900">{data.customers.newBuyers}</p>
                        <p className="text-[11px] text-emerald-800/80">First time buying from you</p>
                      </div>
                      <div className="rounded-xl bg-sky-50 p-4">
                        <p className="text-xs font-semibold text-sky-800">Coming back</p>
                        <p className="text-2xl font-extrabold text-sky-900">{data.customers.returningBuyers}</p>
                        <p className="text-[11px] text-sky-800/80">Bought from you before</p>
                      </div>
                    </div>
                    <div className="overflow-x-auto lg:col-span-2">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-slate-200 text-[10px] uppercase text-slate-500">
                          <tr>
                            <th className="py-2 pr-3">Best customers</th>
                            <th className="py-2 pr-3 text-right">Orders</th>
                            <th className="py-2 text-right">Spent</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {data.customers.top.map((c) => (
                            <tr key={c.email}>
                              <td className="py-2.5 pr-3">
                                <p className="font-bold text-slate-900">{c.name}</p>
                                <p className="text-slate-500">{c.email}</p>
                              </td>
                              <td className="py-2.5 pr-3 text-right tabular-nums">{c.orders}</td>
                              <td className="py-2.5 text-right font-extrabold tabular-nums text-slate-950">{money(c.spent)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </SectionCard>
            </section>

            {/* Virtual try-on */}
            <section id="try-on" className="scroll-mt-24 space-y-4">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Stat label="Try-ons" value={String(data.tryOn.total)} change={data.tryOn.change.total} />
                <Stat label="Worked" value={String(data.tryOn.completed)} note="Finished try-ons" />
                <Stat label="Did not work" value={String(data.tryOn.failed)} note="Failed try-ons" />
                <Stat label="Success rate" value={data.tryOn.successRate === null ? '-' : `${Math.round(data.tryOn.successRate)}%`} note="Of finished try-ons" />
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <SectionCard title="Try-ons over time" className="lg:col-span-2">
                  {data.tryOn.total === 0 ? (
                    <EmptyState title="No try-ons yet" description="Share your try-on link to get shoppers trying your clothes." />
                  ) : (
                    <Bars rows={data.tryOn.series.map((d) => ({ label: d.label, value: d.tryOns }))} value="Try-ons" format={(n) => String(n)} />
                  )}
                </SectionCard>
                <SectionCard title="Most tried-on">
                  {data.tryOn.topProducts.length === 0 ? (
                    <p className="text-xs text-slate-500">Nothing tried on yet.</p>
                  ) : (
                    <ol className="space-y-2 text-xs">
                      {data.tryOn.topProducts.map((p, i) => (
                        <li key={p.productId} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-2.5">
                          <span className="truncate font-bold text-slate-900">{i + 1}. {p.name}</span>
                          <span className="shrink-0 font-semibold text-slate-600">{p.count}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                </SectionCard>
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </PermissionGate>
  );
}
