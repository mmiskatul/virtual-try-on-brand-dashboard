'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Download, Search, Users } from 'lucide-react';
import { brandWorkspaceApi, type BrandCustomer, type CustomerOrderRow } from '../../services/brandService';
import { ErrorBanner, KpiCard, PageHeader, PermissionGate, SectionCard, StatusBadge } from '../../components/shared/UiPrimitives';

const money = (n: number) => `৳${Math.round(n).toLocaleString()}`;
const day = (ms: number) => (ms ? new Date(ms).toLocaleDateString() : '-');

type Sort = 'spent' | 'recent' | 'orders';
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

export function CustomersView() {
  const [customers, setCustomers] = useState<BrandCustomer[]>([]);
  const [totals, setTotals] = useState({ customers: 0, returning: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<'ALL' | 'NEW' | 'RETURNING'>('ALL');
  const [sort, setSort] = useState<Sort>('spent');
  // Taken once when the page opens, so "new this month" does not change while you look.
  const [now] = useState(() => Date.now());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await brandWorkspaceApi.getCustomers();
      setCustomers(res.customers);
      setTotals(res.totals);
    } catch (e: any) {
      setError(e?.message || 'Could not load your customers.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = customers.filter(
      (c) =>
        (group === 'ALL' || c.group === group) &&
        (!q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.city.toLowerCase().includes(q))
    );
    return [...list].sort((a, b) =>
      sort === 'recent' ? b.lastOrderAt - a.lastOrderAt : sort === 'orders' ? b.orderCount - a.orderCount : b.totalSpent - a.totalSpent
    );
  }, [customers, query, group, sort]);

  const newThisMonth = useMemo(() => customers.filter((c) => c.firstOrderAt && now - c.firstOrderAt < THIRTY_DAYS).length, [customers, now]);

  const downloadCsv = () => {
    const rows = [
      ['Name', 'Email', 'City', 'Orders', 'Total spent', 'First order', 'Last order'],
      ...visible.map((c) => [c.name, c.email, c.city, c.orderCount, c.totalSpent.toFixed(2), day(c.firstOrderAt), day(c.lastOrderAt)]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PermissionGate module="customers" action="view">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Customers"
          title="Your customers"
          subtitle="Everyone who has bought from you. This list builds itself from your orders."
          actions={
            <button type="button" onClick={downloadCsv} disabled={visible.length === 0} className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
              <Download className="h-4 w-4" /> Download list (CSV)
            </button>
          }
        />

        {error && <ErrorBanner message={error} onRetry={() => void load()} />}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <KpiCard label="Customers" value={totals.customers} icon={<Users className="w-4 h-4" />} />
          <KpiCard label="New this month" value={newThisMonth} />
          <KpiCard label="Came back to buy again" value={totals.returning} />
          <KpiCard label="Total spent" value={money(totals.revenue)} />
        </div>

        <SectionCard
          title="All customers"
          right={
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search name, email or city"
                  aria-label="Search customers"
                  className="h-10 pl-9 pr-3 rounded-xl border border-slate-200 text-sm w-56 focus:outline-none focus:border-slate-950"
                />
              </div>
              <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort customers" className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700">
                <option value="spent">Best customers first</option>
                <option value="recent">Latest order first</option>
                <option value="orders">Most orders first</option>
              </select>
              <div className="flex rounded-lg border border-slate-200 overflow-hidden text-sm font-semibold" role="group" aria-label="Filter customers">
                {(['ALL', 'NEW', 'RETURNING'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGroup(g)}
                    aria-pressed={group === g}
                    className={`px-3.5 py-2 ${group === g ? 'bg-slate-950 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                  >
                    {g === 'ALL' ? 'All' : g === 'NEW' ? 'New' : 'Returning'}
                  </button>
                ))}
              </div>
            </div>
          }
        >
          {loading ? (
            <div className="space-y-2" aria-busy="true" aria-label="Loading customers">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">
              <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              {customers.length === 0 ? 'No customers yet. They appear here after their first order.' : 'No customers match your search.'}
            </div>
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                    <th className="py-2.5 px-2 font-semibold">Customer</th>
                    <th className="py-2.5 px-2 font-semibold">Orders</th>
                    <th className="py-2.5 px-2 font-semibold">Spent</th>
                    <th className="py-2.5 px-2 font-semibold">Last order</th>
                    <th className="py-2.5 px-2 font-semibold">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visible.map((c) => (
                    <tr key={c.email} className="hover:bg-slate-50">
                      <td className="py-3 px-2">
                        <Link href={`/dashboard/customers/${encodeURIComponent(c.email)}`} className="block">
                          <span className="font-semibold text-slate-950">{c.name}</span>
                          <span className="block text-xs text-slate-500">{c.email}{c.city ? ` · ${c.city}` : ''}</span>
                        </Link>
                      </td>
                      <td className="py-3 px-2 tabular-nums">{c.orderCount}</td>
                      <td className="py-3 px-2 tabular-nums font-semibold">{money(c.totalSpent)}</td>
                      <td className="py-3 px-2 text-slate-600">{day(c.lastOrderAt)}</td>
                      <td className="py-3 px-2">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${c.group === 'RETURNING' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                          {c.group === 'RETURNING' ? 'Returning' : 'New'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>
    </PermissionGate>
  );
}

export function CustomerDetailView({ email }: { email: string }) {
  const [customer, setCustomer] = useState<BrandCustomer | null>(null);
  const [orders, setOrders] = useState<CustomerOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await brandWorkspaceApi.getCustomer(email);
      setCustomer(res.customer);
      setOrders(res.orders);
    } catch (e: any) {
      setError(e?.message || 'Could not load this customer.');
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <PermissionGate module="customers" action="view">
      <div className="space-y-6">
        <Link href="/dashboard/customers" className="text-sm font-semibold text-slate-600 hover:text-slate-950">
          &larr; All customers
        </Link>
        {error && <ErrorBanner message={error} onRetry={() => void load()} />}
        {loading ? (
          <div className="space-y-3" aria-busy="true" aria-label="Loading customer">
            <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
          </div>
        ) : customer ? (
          <>
            <PageHeader eyebrow="Customer" title={customer.name} subtitle={`${customer.email}${customer.city ? ` · ${customer.city}` : ''}`} />
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
              <KpiCard label="Orders" value={customer.orderCount} />
              <KpiCard label="Total spent" value={money(customer.totalSpent)} />
              <KpiCard label="Average order" value={money(customer.orderCount ? customer.totalSpent / customer.orderCount : 0)} />
              <KpiCard label="Customer since" value={day(customer.firstOrderAt)} />
              <KpiCard label="Last order" value={day(customer.lastOrderAt)} />
            </div>
            <SectionCard title="Orders">
              <ul className="divide-y divide-slate-100">
                {orders.map((o) => (
                  <li key={o.id}>
                    <Link href={`/dashboard/orders/${o.id}`} className="flex items-center gap-3 py-3 hover:bg-slate-50 -mx-2 px-2 rounded-lg">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold font-mono text-slate-950">{o.id}</p>
                        <p className="text-xs text-slate-500">{day(o.createdAt)} &middot; {o.itemCount} item{o.itemCount === 1 ? '' : 's'}</p>
                      </div>
                      <StatusBadge status={o.status} />
                      <span className="w-24 text-right text-sm font-bold tabular-nums">{money(o.totalAmount)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </SectionCard>
          </>
        ) : null}
      </div>
    </PermissionGate>
  );
}
