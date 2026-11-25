'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Boxes, Download, PackageX, Search, Wallet } from 'lucide-react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { useUiStore } from '../../stores/useUiStore';
import { brandWorkspaceApi } from '../../services/brandService';
import { useMounted } from '../../hooks/useMounted';
import { Product } from '../../types';
import { EmptyState, KpiCard, PageHeader, PermissionGate, SafeImage, SectionCard } from '../../components/shared/UiPrimitives';
import { Button } from '../../components/ui/button';
import { canPerform } from '../../config/permissions';
import { Drawer } from '../products/shared';

export type InventoryTab = 'stock' | 'history';

const TABS: Array<{ id: InventoryTab; label: string; href: string }> = [
  { id: 'stock', label: 'Stock', href: '/dashboard/inventory' },
  { id: 'history', label: 'History', href: '/dashboard/inventory-history' },
];

type Filter = 'all' | 'low' | 'out';
const REASONS = ['New stock arrived', 'Damaged or lost', 'Sold in my shop', 'Fixed a wrong count'];

const lowLimit = (p: Product) => p.lowStockThreshold || 5;
const isOut = (p: Product) => p.stock <= 0;
const isLow = (p: Product) => p.stock > 0 && p.stock < lowLimit(p);

const INPUT = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-950/10';

export function InventoryView({ initialTab = 'stock' }: { initialTab?: InventoryTab }) {
  const mounted = useMounted();
  const isLiveBackend = useWorkspaceStore((s) => s.isLiveBackend);
  const activeRole = useWorkspaceStore((s) => s.activeRole);
  const roleOverrides = useWorkspaceStore((s) => s.roleOverrides);
  const products = useWorkspaceStore((s) => s.products);
  const inventoryLogs = useWorkspaceStore((s) => s.inventoryLogs);
  const adjustStock = useWorkspaceStore((s) => s.adjustStock);
  const showToast = useUiStore((s) => s.showToast);

  const canEdit = canPerform(activeRole, 'inventory', 'edit', roleOverrides);
  const all = useMemo(() => (mounted ? products : []), [mounted, products]);
  const logs = useMemo(() => (mounted ? inventoryLogs : []), [mounted, inventoryLogs]);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  // Change-stock drawer
  const [target, setTarget] = useState<Product | null>(null);
  const [variantSku, setVariantSku] = useState('');
  const [direction, setDirection] = useState<'add' | 'remove'>('add');
  const [amount, setAmount] = useState('1');
  const [reason, setReason] = useState(REASONS[0]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const totalPieces = all.reduce((s, p) => s + (p.stock || 0), 0);
  const stockValue = all.reduce((s, p) => s + p.stock * p.price, 0);
  const lowCount = all.filter(isLow).length;
  const outCount = all.filter(isOut).length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all.filter((p) => {
      if (filter === 'low' && !isLow(p)) return false;
      if (filter === 'out' && !isOut(p)) return false;
      return !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    });
  }, [all, search, filter]);

  const nameOf = (productId: string, fallback: string) => all.find((p) => p.id === productId)?.name || fallback;

  const openDrawer = (p: Product, dir: 'add' | 'remove' = 'add') => {
    setTarget(p);
    setVariantSku(p.variants?.[0]?.sku || p.sku);
    setDirection(dir);
    setAmount('1');
    setReason(dir === 'add' ? REASONS[0] : REASONS[1]);
    setFormError(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target) return;
    const n = Math.floor(Number(amount));
    if (!Number.isFinite(n) || n <= 0) return setFormError('Enter how many pieces, for example 5.');
    const delta = direction === 'add' ? n : -n;
    const variant = target.variants?.find((v) => v.sku === variantSku);
    if (direction === 'remove' && variant && n > variant.stockQuantity) {
      return setFormError(`This size only has ${variant.stockQuantity} in stock.`);
    }
    setSaving(true);
    setFormError(null);
    try {
      if (isLiveBackend) {
        await brandWorkspaceApi.adjustInventory({ productId: target.id, variantSku, change: delta, reason });
      }
      adjustStock(target.id, delta, reason, 'Main stock');
      showToast(`${target.name}: ${delta > 0 ? '+' : ''}${delta} saved.`);
      setTarget(null);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Could not change the stock. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const downloadHistory = () => {
    const rows = [
      ['Product', 'SKU', 'Change', 'Stock after', 'Reason', 'When'],
      ...logs.map((l) => [nameOf(l.productId, l.productName), l.variantSku, l.change, l.newStock, l.reason, l.timestamp]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded your stock history.');
  };

  const stockLabel = (p: Product) =>
    isOut(p) ? { text: 'Out of stock', cls: 'bg-rose-50 text-rose-700 border-rose-200' } : isLow(p) ? { text: 'Running low', cls: 'bg-amber-50 text-amber-800 border-amber-200' } : { text: 'In stock', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };

  return (
    <PermissionGate module="inventory" action="view">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Stock"
          title="Inventory"
          subtitle="See how much stock you have, avoid selling what you do not have, and keep a record of every change."
          actions={
            initialTab === 'history' ? (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={downloadHistory} disabled={logs.length === 0}>
                <Download className="w-3.5 h-3.5" /> Download history (CSV)
              </Button>
            ) : undefined
          }
        />

        <nav aria-label="Inventory sections" className="flex gap-2 text-xs font-bold">
          {TABS.map((t) => (
            <Link key={t.id} href={t.href} aria-current={initialTab === t.id ? 'page' : undefined} className={`rounded-xl border px-3.5 py-2 ${initialTab === t.id ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
              {t.label}
            </Link>
          ))}
        </nav>

        {!mounted ? (
          <div className="space-y-3" aria-busy="true" aria-label="Loading stock">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
            <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              <KpiCard label="Pieces in stock" value={totalPieces.toLocaleString()} icon={<Boxes className="w-4 h-4" />} />
              <KpiCard label="Stock value" value={`৳${Math.round(stockValue).toLocaleString()}`} icon={<Wallet className="w-4 h-4" />} />
              <KpiCard label="Running low" value={lowCount} positive={lowCount === 0} icon={<AlertTriangle className="w-4 h-4 text-amber-600" />} />
              <KpiCard label="Out of stock" value={outCount} positive={outCount === 0} icon={<PackageX className="w-4 h-4 text-rose-600" />} />
            </div>

            {initialTab === 'stock' && (
              <SectionCard
                title="Stock by product"
                subtitle="Change stock when new pieces arrive, get damaged or are sold in your own shop."
                right={
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, SKU or category" aria-label="Search stock" className="w-full rounded-xl border border-slate-200 pl-8 pr-3 py-1.5 text-xs" />
                  </div>
                }
              >
                <div className="flex flex-wrap gap-1.5 pb-3">
                  {([['all', `All (${all.length})`], ['low', `Running low (${lowCount})`], ['out', `Out of stock (${outCount})`]] as Array<[Filter, string]>).map(([k, label]) => (
                    <button key={k} type="button" aria-pressed={filter === k} onClick={() => setFilter(k)} className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold ${filter === k ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
                      {label}
                    </button>
                  ))}
                </div>

                {all.length === 0 ? (
                  <EmptyState title="No products yet" description="Add your products first, then their stock shows here." />
                ) : filtered.length === 0 ? (
                  <EmptyState title="Nothing found" description="Try a different search or filter." actionLabel="Clear filters" onAction={() => { setSearch(''); setFilter('all'); }} />
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {filtered.map((p) => {
                      const label = stockLabel(p);
                      const sizes = (p.variants || []).reduce<Record<string, number>>((acc, v) => {
                        acc[v.size] = (acc[v.size] || 0) + v.stockQuantity;
                        return acc;
                      }, {});
                      return (
                        <li key={p.id} className="flex flex-wrap items-center gap-3 py-3 text-xs">
                          <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                            <SafeImage src={p.image} alt={p.name} fill className="object-cover" />
                          </div>
                          <div className="min-w-0 flex-1 basis-48">
                            <Link href={`/dashboard/products/${p.id}`} className="block truncate font-bold text-slate-900 hover:underline">{p.name}</Link>
                            <p className="font-mono text-[11px] text-slate-500">{p.sku}</p>
                            {Object.keys(sizes).length > 0 && (
                              <p className="mt-0.5 text-[11px] text-slate-500">
                                {Object.entries(sizes).map(([size, n]) => `${size} ${n}`).join(' · ')}
                              </p>
                            )}
                          </div>
                          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${label.cls}`}>{label.text}</span>
                          <div className="w-16 text-right">
                            <p className="text-lg font-extrabold tabular-nums text-slate-950">{p.stock}</p>
                            <p className="text-[11px] text-slate-400">in stock</p>
                          </div>
                          {canEdit && (
                            <div className="flex gap-1.5">
                              <Button size="sm" variant="outline" onClick={() => openDrawer(p, 'remove')} aria-label={`Remove stock from ${p.name}`}>−</Button>
                              <Button size="sm" onClick={() => openDrawer(p, 'add')}>Change stock</Button>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </SectionCard>
            )}

            {initialTab === 'history' && (
              <SectionCard title="Stock history" subtitle="A record of every stock change. It cannot be edited.">
                {logs.length === 0 ? (
                  <EmptyState title="No stock changes yet" description="When stock is added, removed or sold, it shows up here." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-200 text-[11px] uppercase text-slate-400">
                        <tr>
                          <th className="py-2.5 pr-4">Product</th>
                          <th className="py-2.5 pr-4 text-right">Change</th>
                          <th className="py-2.5 pr-4 text-right">Stock after</th>
                          <th className="py-2.5 pr-4">Why</th>
                          <th className="py-2.5 text-right">When</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {logs.map((l) => (
                          <tr key={l.id}>
                            <td className="py-3 pr-4">
                              <p className="font-bold text-slate-900">{nameOf(l.productId, l.productName)}</p>
                              <p className="font-mono text-[11px] text-slate-500">{l.variantSku}</p>
                            </td>
                            <td className={`py-3 pr-4 text-right font-extrabold tabular-nums ${l.change >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{l.change >= 0 ? `+${l.change}` : l.change}</td>
                            <td className="py-3 pr-4 text-right font-bold tabular-nums text-slate-900">{l.newStock}</td>
                            <td className="py-3 pr-4 text-slate-600">{l.reason}</td>
                            <td className="py-3 text-right text-slate-400">{l.timestamp}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </SectionCard>
            )}
          </>
        )}

        <Drawer
          open={Boolean(target)}
          title={target ? `Change stock: ${target.name}` : 'Change stock'}
          subtitle="Add pieces that arrived, or take away ones that are gone."
          onClose={() => setTarget(null)}
          footer={
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setTarget(null)}>Cancel</Button>
              <Button type="submit" form="stock-form" size="sm" disabled={saving}>{saving ? 'Saving…' : direction === 'add' ? 'Add stock' : 'Remove stock'}</Button>
            </div>
          }
        >
          {target && (
            <form id="stock-form" onSubmit={submit} className="space-y-4 text-sm">
              {(target.variants?.length || 0) > 0 && (
                <label className="block space-y-1.5">
                  <span className="font-semibold text-slate-700">Which size and colour</span>
                  <select value={variantSku} onChange={(e) => setVariantSku(e.target.value)} className={INPUT}>
                    {target.variants!.map((v) => (
                      <option key={v.sku} value={v.sku}>{v.size} · {v.color} ({v.stockQuantity} in stock)</option>
                    ))}
                  </select>
                </label>
              )}

              <div className="grid grid-cols-2 gap-2" role="group" aria-label="Add or remove">
                {([['add', 'Add stock'], ['remove', 'Remove stock']] as Array<['add' | 'remove', string]>).map(([k, label]) => (
                  <button key={k} type="button" aria-pressed={direction === k} onClick={() => { setDirection(k); setReason(k === 'add' ? REASONS[0] : REASONS[1]); }} className={`rounded-xl border py-2.5 text-sm font-bold ${direction === k ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-700'}`}>
                    {label}
                  </button>
                ))}
              </div>

              <label className="block space-y-1.5">
                <span className="font-semibold text-slate-700">How many pieces</span>
                <input type="number" min={1} step={1} value={amount} onChange={(e) => setAmount(e.target.value)} className={INPUT} />
              </label>

              <div className="space-y-1.5">
                <span className="font-semibold text-slate-700">Why</span>
                <div className="flex flex-wrap gap-2">
                  {REASONS.map((r) => (
                    <button key={r} type="button" aria-pressed={reason === r} onClick={() => setReason(r)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${reason === r ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-700'}`}>
                      {r}
                    </button>
                  ))}
                </div>
                <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={120} className={INPUT} aria-label="Reason" />
              </div>

              {formError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-800">{formError}</p>}
            </form>
          )}
        </Drawer>
      </div>
    </PermissionGate>
  );
}
