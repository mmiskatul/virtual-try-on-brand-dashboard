'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Download, Package, Search, ShoppingCart, Truck } from 'lucide-react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { useUiStore } from '../../stores/useUiStore';
import { useMounted } from '../../hooks/useMounted';
import { Order } from '../../types';
import {
  EmptyState,
  KpiCard,
  PageHeader,
  PermissionGate,
  SafeImage,
  SectionCard,
} from '../../components/shared/UiPrimitives';
import { Button } from '../../components/ui/button';
import { canPerform } from '../../config/permissions';
import { GROUP_LABEL, GROUP_STYLE, OrderGroup, groupOf, money, nextStep, orderTime, useOrderActions } from './orderHelpers';

const STATUS_CHIPS: Array<OrderGroup | 'ALL'> = ['ALL', 'NEW', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];
type DateRange = 'ALL' | 'TODAY' | '7D' | '30D';
const DAY = 24 * 60 * 60 * 1000;

function exportCsvFile(filename: string, headers: string[], rows: Array<Array<string | number>>) {
  const csv = [headers.join(','), ...rows.map((r) => r.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function StatusPill({ status }: { status: Order['status'] }) {
  const g = groupOf(status);
  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-bold ${GROUP_STYLE[g]}`}>{GROUP_LABEL[g]}</span>;
}

function ItemPhotos({ order }: { order: Order }) {
  const items = order.items || [];
  if (items.length === 0) return <span className="text-slate-400">{order.itemCount} item{order.itemCount === 1 ? '' : 's'}</span>;
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex -space-x-2">
        {items.slice(0, 3).map((it, i) => (
          <div key={i} className="relative h-8 w-7 overflow-hidden rounded-md border-2 border-white bg-slate-100">
            <SafeImage src={it.imageUrl || ''} alt={it.productName} fill className="object-cover" />
          </div>
        ))}
      </div>
      <span className="text-slate-500">{order.itemCount} item{order.itemCount === 1 ? '' : 's'}</span>
    </div>
  );
}

export function OrdersView() {
  const mounted = useMounted();
  const orders = useWorkspaceStore((s) => s.orders);
  const activeRole = useWorkspaceStore((s) => s.activeRole);
  const roleOverrides = useWorkspaceStore((s) => s.roleOverrides);
  const showToast = useUiStore((s) => s.showToast);
  const { setStatus, savingId } = useOrderActions();

  const canEdit = canPerform(activeRole, 'orders', 'edit', roleOverrides);
  const canExport = canPerform(activeRole, 'orders', 'export', roleOverrides);

  const [search, setSearch] = useState('');
  const [group, setGroup] = useState<OrderGroup | 'ALL'>('ALL');
  const [range, setRange] = useState<DateRange>('ALL');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  // Taken once when the page opens, so the "older than" checks stay steady while you work.
  const [now] = useState(() => Date.now());

  const all = useMemo(() => (mounted ? orders : []), [mounted, orders]);

  const counts = useMemo(() => {
    const c: Record<OrderGroup | 'ALL', number> = { ALL: all.length, NEW: 0, PACKED: 0, SHIPPED: 0, DELIVERED: 0, CANCELLED: 0, REFUNDED: 0 };
    for (const o of all) c[groupOf(o.status)] += 1;
    return c;
  }, [all]);

  // "Shipped a while ago but not marked delivered": worth checking on.
  const staleShipped = useMemo(() => {
    return all.filter((o) => {
      if (groupOf(o.status) !== 'SHIPPED') return false;
      const t = orderTime(o);
      return t !== null && now - t > 7 * DAY;
    });
  }, [all, now]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all.filter((o) => {
      if (group !== 'ALL' && groupOf(o.status) !== group) return false;
      if (q && !(o.id.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q) || o.customerEmail.toLowerCase().includes(q))) return false;
      if (range !== 'ALL') {
        const t = orderTime(o);
        if (t === null) return true;
        const limit = range === 'TODAY' ? DAY : range === '7D' ? 7 * DAY : 30 * DAY;
        if (now - t > limit) return false;
      }
      return true;
    });
  }, [all, search, group, range, now]);

  const sales = all.filter((o) => groupOf(o.status) !== 'CANCELLED' && groupOf(o.status) !== 'REFUNDED').reduce((s, o) => s + o.total, 0);
  const waiting = counts.NEW + counts.PACKED;

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const allVisibleSelected = filtered.length > 0 && filtered.every((o) => selected.has(o.id));
  const toggleAllVisible = () =>
    setSelected(allVisibleSelected ? new Set() : new Set(filtered.map((o) => o.id)));

  const bulkMove = async (from: OrderGroup, label: string) => {
    const targets = all.filter((o) => selected.has(o.id) && groupOf(o.status) === from);
    const step = nextStep(targets[0]?.status ?? 'PENDING');
    if (targets.length === 0 || !step) {
      showToast(`None of the selected orders can be ${label} right now.`);
      return;
    }
    setBulkBusy(true);
    let done = 0;
    for (const o of targets) {
      if (await setStatus(o, step.to, true)) done += 1;
    }
    setBulkBusy(false);
    setSelected(new Set());
    showToast(`${done} of ${targets.length} order${targets.length === 1 ? '' : 's'} ${label}.`);
  };

  const attention = [
    { key: 'new', count: counts.NEW, text: 'new orders to pack', onClick: () => setGroup('NEW'), tone: 'amber' },
    { key: 'packed', count: counts.PACKED, text: 'packed, ready to ship', onClick: () => setGroup('PACKED'), tone: 'sky' },
    { key: 'stale', count: staleShipped.length, text: 'shipped over 7 days ago, not delivered', onClick: () => setGroup('SHIPPED'), tone: 'rose' },
  ].filter((a) => a.count > 0);

  return (
    <PermissionGate module="orders" action="view">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Orders"
          title="Orders"
          subtitle="See your orders, pack them, send them out and mark them delivered."
          actions={
            canExport ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  exportCsvFile(
                    `orders-${new Date().toISOString().slice(0, 10)}.csv`,
                    ['Order number', 'Customer', 'Email', 'Date', 'Items', 'Total', 'Payment', 'Status'],
                    filtered.map((o) => [o.id, o.customerName, o.customerEmail, o.date, o.itemCount, o.total.toFixed(2), o.paymentStatus || 'PAID', GROUP_LABEL[groupOf(o.status)]])
                  );
                  showToast(`Downloaded ${filtered.length} order${filtered.length === 1 ? '' : 's'}.`);
                }}
              >
                <Download className="w-3.5 h-3.5" /> Download orders (CSV)
              </Button>
            ) : undefined
          }
        />

        {!mounted ? (
          <div className="space-y-3" aria-busy="true" aria-label="Loading orders">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
            <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <KpiCard label="Sales (paid)" value={money(sales)} icon={<Package className="w-4 h-4" />} />
              <KpiCard label="All orders" value={all.length} icon={<ShoppingCart className="w-4 h-4" />} />
              <KpiCard label="Waiting to send" value={waiting} icon={<Truck className="w-4 h-4" />} />
              <KpiCard label="Delivered" value={counts.DELIVERED} icon={<CheckCircle2 className="w-4 h-4" />} />
            </div>

            {all.length > 0 && (
              attention.length > 0 ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
                  <p className="text-xs font-bold text-amber-900 mb-2">Needs your attention</p>
                  <div className="flex flex-wrap gap-2">
                    {attention.map((a) => (
                      <button key={a.key} type="button" onClick={a.onClick} className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-left text-xs hover:border-amber-400">
                        <span className="font-extrabold text-slate-950 text-sm">{a.count}</span>{' '}
                        <span className="text-slate-700">{a.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> You are all caught up. Nothing needs action right now.
                </div>
              )
            )}

            <SectionCard
              title="All orders"
              subtitle="Only orders for your own products show here."
              right={
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search order number, name or email"
                    className="w-full rounded-xl border border-slate-200 pl-8 pr-3 py-1.5 text-xs"
                    aria-label="Search orders"
                  />
                </div>
              }
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3">
                <div className="flex flex-wrap gap-1.5">
                  {STATUS_CHIPS.map((g) => (
                    <button
                      key={g}
                      type="button"
                      aria-pressed={group === g}
                      onClick={() => setGroup(g)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                        group === g ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {g === 'ALL' ? 'All' : GROUP_LABEL[g]} ({counts[g]})
                    </button>
                  ))}
                </div>
                <select value={range} onChange={(e) => setRange(e.target.value as DateRange)} aria-label="Date" className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold">
                  <option value="ALL">Any date</option>
                  <option value="TODAY">Last 24 hours</option>
                  <option value="7D">Last 7 days</option>
                  <option value="30D">Last 30 days</option>
                </select>
              </div>

              {canEdit && selected.size > 0 && (
                <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
                  <span className="font-bold text-slate-900">{selected.size} selected</span>
                  <Button size="sm" variant="outline" disabled={bulkBusy} onClick={() => void bulkMove('NEW', 'packed')}>Mark as packed</Button>
                  <Button size="sm" variant="outline" disabled={bulkBusy} onClick={() => void bulkMove('PACKED', 'shipped')}>Mark as shipped</Button>
                  <button type="button" className="ml-auto font-bold underline" onClick={() => setSelected(new Set())}>Clear</button>
                </div>
              )}

              {all.length === 0 ? (
                <EmptyState title="No orders yet" description="When a shopper buys one of your products, the order will show up here." />
              ) : filtered.length === 0 ? (
                <EmptyState title="No orders found" description="Try a different search, status or date." actionLabel="Clear filters" onAction={() => { setSearch(''); setGroup('ALL'); setRange('ALL'); }} />
              ) : (
                <>
                  <div className="sm:hidden space-y-3">
                    {filtered.map((o) => {
                      const step = nextStep(o.status);
                      return (
                        <div key={o.id} className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2.5 text-xs">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <Link href={`/dashboard/orders/${encodeURIComponent(o.id)}`} className="font-mono font-extrabold text-slate-900 hover:underline break-all">{o.id}</Link>
                              <p className="text-slate-600 truncate">{o.customerName}</p>
                            </div>
                            <StatusPill status={o.status} />
                          </div>
                          <div className="flex items-center justify-between">
                            <ItemPhotos order={o} />
                            <span className="font-extrabold text-slate-950">{money(o.total)}</span>
                          </div>
                          <div className="flex gap-2">
                            <Link href={`/dashboard/orders/${encodeURIComponent(o.id)}`} className="flex-1">
                              <Button size="sm" variant="outline" className="w-full">Open</Button>
                            </Link>
                            {canEdit && step && (
                              <Button size="sm" className="flex-1" disabled={savingId === o.id} onClick={() => void setStatus(o, step.to)}>{step.label}</Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="text-[11px] uppercase text-slate-500 border-b border-slate-200 bg-slate-50">
                        <tr>
                          <th className="p-3 w-8">
                            {canEdit && <input type="checkbox" aria-label="Select all shown orders" checked={allVisibleSelected} onChange={toggleAllVisible} className="rounded accent-slate-950" />}
                          </th>
                          <th className="p-3">Order</th>
                          <th className="p-3">Customer</th>
                          <th className="p-3">Items</th>
                          <th className="p-3">Date</th>
                          <th className="p-3 text-right">Total</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Next step</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filtered.map((o) => {
                          const step = nextStep(o.status);
                          return (
                            <tr key={o.id} className="hover:bg-slate-50/60">
                              <td className="p-3">
                                {canEdit && <input type="checkbox" aria-label={`Select order ${o.id}`} checked={selected.has(o.id)} onChange={() => toggle(o.id)} className="rounded accent-slate-950" />}
                              </td>
                              <td className="p-3">
                                <Link href={`/dashboard/orders/${encodeURIComponent(o.id)}`} className="font-mono font-extrabold text-slate-900 hover:underline">{o.id}</Link>
                              </td>
                              <td className="p-3">
                                <p className="font-semibold text-slate-900">{o.customerName}</p>
                                <p className="text-slate-500">{o.customerEmail}</p>
                              </td>
                              <td className="p-3"><ItemPhotos order={o} /></td>
                              <td className="p-3 text-slate-600">{o.date}</td>
                              <td className="p-3 text-right font-bold text-slate-950">{money(o.total)}</td>
                              <td className="p-3"><StatusPill status={o.status} /></td>
                              <td className="p-3 text-right">
                                {canEdit && step ? (
                                  <Button size="sm" disabled={savingId === o.id} onClick={() => void setStatus(o, step.to)}>{step.label}</Button>
                                ) : (
                                  <Link href={`/dashboard/orders/${encodeURIComponent(o.id)}`} className="font-bold underline">Open</Link>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </SectionCard>
          </>
        )}
      </div>
    </PermissionGate>
  );
}
