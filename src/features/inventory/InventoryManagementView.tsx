'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowDownUp,
  Boxes,
  Building2,
  Download,
  History,
  Plus,
  Search,
} from 'lucide-react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { useUiStore } from '../../stores/useUiStore';
import { brandWorkspaceApi } from '../../services/brandService';
import { useMounted } from '../../hooks/useMounted';
import {
  EmptyState,
  KpiCard,
  PageHeader,
  PermissionGate,
  SectionCard,
  StatusBadge,
} from '../../components/shared/UiPrimitives';
import { Button } from '../../components/ui/button';
import { canPerform } from '../../config/permissions';

export type InventoryTab = 'overview' | 'locations' | 'adjustments' | 'history';

const INV_TABS: Array<{ id: InventoryTab; label: string; href: string }> = [
  { id: 'overview', label: 'Stock Overview', href: '/dashboard/inventory' },
  { id: 'locations', label: 'Warehouses / Locations', href: '/dashboard/inventory/locations' },
  { id: 'adjustments', label: 'Stock Adjustments', href: '/dashboard/inventory/adjustments' },
  { id: 'history', label: 'Inventory History', href: '/dashboard/inventory/history' },
];

export function InventoryManagementView({
  initialTab = 'overview',
}: {
  initialTab?: InventoryTab;
}) {
  const mounted = useMounted();
  const isLiveBackend = useWorkspaceStore((s) => s.isLiveBackend);
  const activeRole = useWorkspaceStore((s) => s.activeRole);
  const roleOverrides = useWorkspaceStore((s) => s.roleOverrides);
  const products = useWorkspaceStore((s) => s.products);
  const warehouses = useWorkspaceStore((s) => s.warehouses);
  const inventoryLogs = useWorkspaceStore((s) => s.inventoryLogs);
  const adjustStock = useWorkspaceStore((s) => s.adjustStock);
  const addWarehouse = useWorkspaceStore((s) => s.addWarehouse);
  const recordAudit = useWorkspaceStore((s) => s.recordAudit);
  const showToast = useUiStore((s) => s.showToast);

  const [tab, setTab] = useState<InventoryTab>(initialTab);
  const [search, setSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [adjustDelta, setAdjustDelta] = useState('10');
  const [adjustReason, setAdjustReason] = useState('Restock from atelier production');
  const [adjustLocation, setAdjustLocation] = useState('Dhaka Main Studio');
  const [submitting, setSubmitting] = useState(false);

  const [whName, setWhName] = useState('');
  const [whCity, setWhCity] = useState('');
  const [whCountry, setWhCountry] = useState('Bangladesh');

  const canEdit = canPerform(activeRole, 'inventory', 'edit', roleOverrides);
  const safeProducts = mounted ? products : [];
  const safeWarehouses = mounted ? warehouses : [];
  const safeLogs = mounted ? inventoryLogs : [];

  const totalUnits = safeProducts.reduce((s, p) => s + (p.stock || 0), 0);
  const lowStockItems = safeProducts.filter(
    (p) => p.stock > 0 && p.stock < (p.lowStockThreshold || 5)
  );
  const outOfStockItems = safeProducts.filter((p) => p.stock <= 0);
  const stockValue = safeProducts.reduce((s, p) => s + p.stock * p.price, 0);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return safeProducts.filter(
      (p) =>
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [safeProducts, search]);

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = selectedProductId || safeProducts[0]?.id;
    const target = safeProducts.find((p) => p.id === targetId);
    const delta = Number(adjustDelta);
    if (!target || !Number.isFinite(delta) || delta === 0) return;

    setSubmitting(true);
    try {
      if (isLiveBackend) {
        await brandWorkspaceApi.adjustInventory({
          productId: target.id,
          variantSku: target.variants?.[0]?.sku || target.sku,
          change: delta,
          reason: adjustReason,
        });
      }
      adjustStock(target.id, delta, adjustReason, adjustLocation);
      showToast(`Stock updated for ${target.name} (${delta > 0 ? `+${delta}` : delta}).`);
      setAdjustDelta('0');
    } catch (err: any) {
      showToast(err?.message || 'Inventory adjustment failed on backend.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddWarehouse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!whName.trim() || !whCity.trim()) return;
    addWarehouse({
      id: `wh_${Date.now()}`,
      name: whName.trim(),
      city: whCity.trim(),
      country: whCountry.trim() || 'Bangladesh',
      isDefault: false,
      totalUnits: 0,
    });
    recordAudit('WAREHOUSE_ADDED', whName.trim(), `${whCity.trim()}, ${whCountry.trim()}`);
    showToast(`Added warehouse location "${whName.trim()}".`);
    setWhName('');
    setWhCity('');
  };

  return (
    <PermissionGate module="inventory" action="view">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Stock & Fulfillment"
          title="Inventory, Warehouses & Stock Ledger"
          subtitle="Monitor garment stock levels, avoid overselling, and audit stock movements across locations."
          actions={
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                const csv = [
                  ['Product', 'SKU', 'Location', 'Change', 'New Stock', 'Reason', 'Actor', 'Timestamp'].join(','),
                  ...safeLogs.map((l) =>
                    [
                      l.productName,
                      l.variantSku,
                      l.location,
                      l.change,
                      l.newStock,
                      l.reason,
                      l.actor,
                      l.timestamp,
                    ]
                      .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
                      .join(',')
                  ),
                ].join('\n');
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'inventory-ledger.csv';
                a.click();
                URL.revokeObjectURL(url);
                showToast('Exported inventory ledger CSV.');
              }}
            >
              <Download className="w-3.5 h-3.5" /> Export Ledger CSV
            </Button>
          }
        />

        <div className="flex flex-wrap gap-2">
          {INV_TABS.map((t) => (
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

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <KpiCard label="Total Units in Stock" value={totalUnits.toLocaleString()} icon={<Boxes className="w-4 h-4" />} />
          <KpiCard label="Retail Stock Value" value={`$${stockValue.toLocaleString()}`} icon={<Building2 className="w-4 h-4" />} />
          <KpiCard
            label="Low Stock Alerts"
            value={lowStockItems.length}
            positive={lowStockItems.length === 0}
            icon={<AlertTriangle className="w-4 h-4 text-amber-600" />}
          />
          <KpiCard
            label="Out of Stock SKUs"
            value={outOfStockItems.length}
            positive={outOfStockItems.length === 0}
            icon={<History className="w-4 h-4 text-rose-600" />}
          />
        </div>

        {tab === 'overview' && (
          <SectionCard
            title="Catalog Inventory Status"
            subtitle="Quick +5 / -1 stock controls or route directly to batch adjustments."
            right={
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search SKU or product..."
                  className="w-full rounded-xl border border-slate-200 pl-8 pr-3 py-1.5 text-xs"
                />
              </div>
            }
          >
            {filteredProducts.length === 0 ? (
              <EmptyState title="No products found" description="Create apparel SKUs in Product Management." />
            ) : (
              <>
                <div className="sm:hidden space-y-2.5 text-xs">
                  {filteredProducts.map((p) => {
                    const low = p.stock > 0 && p.stock < (p.lowStockThreshold || 5);
                    const out = p.stock <= 0;
                    return (
                      <div key={p.id} className="rounded-xl border border-slate-200 p-3 bg-white space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 break-words">{p.name}</p>
                            <p className="font-mono text-[11px] text-slate-500">{p.sku}</p>
                          </div>
                          <StatusBadge status={out ? 'FAILED' : low ? 'PENDING' : 'ACTIVE'} />
                        </div>
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                          <div>
                            <span className="text-slate-400 block">Warehouse</span>
                            <span className="font-semibold text-slate-700 break-words">{p.warehouseLocation || 'Dhaka Main Studio'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Threshold</span>
                            <span className="text-slate-600">{p.lowStockThreshold || 5}u</span>
                          </div>
                          <div className="text-right">
                            <span className="text-slate-400 block">Available</span>
                            <span className="font-extrabold text-slate-950 tabular-nums">{p.stock}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!canEdit || p.stock <= 0}
                            onClick={() => {
                              adjustStock(p.id, -1, 'Quick counter decrement', p.warehouseLocation || 'Dhaka Main Studio');
                              showToast(`Decremented ${p.sku} by 1.`);
                            }}
                            className="h-8 px-3 text-xs flex-1"
                          >
                            -1 Unit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!canEdit}
                            onClick={() => {
                              adjustStock(p.id, 5, 'Quick atelier restock', p.warehouseLocation || 'Dhaka Main Studio');
                              showToast(`Restocked ${p.sku} (+5 units).`);
                            }}
                            className="h-8 px-3 text-xs flex-1"
                          >
                            +5 Units
                          </Button>
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
                        <th className="py-2.5 pr-4">SKU</th>
                        <th className="py-2.5 pr-4">Warehouse</th>
                        <th className="py-2.5 pr-4">Threshold</th>
                        <th className="py-2.5 pr-4">Available</th>
                        <th className="py-2.5 pr-4">Health</th>
                        <th className="py-2.5 text-right">Quick Adjust</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredProducts.map((p) => {
                        const low = p.stock > 0 && p.stock < (p.lowStockThreshold || 5);
                        const out = p.stock <= 0;
                        return (
                          <tr key={p.id}>
                            <td className="py-3 pr-4 font-bold text-slate-900">{p.name}</td>
                            <td className="py-3 pr-4 font-mono text-slate-600">{p.sku}</td>
                            <td className="py-3 pr-4 text-slate-600">{p.warehouseLocation || 'Dhaka Main Studio'}</td>
                            <td className="py-3 pr-4 text-slate-500">{p.lowStockThreshold || 5} units</td>
                            <td className="py-3 pr-4 font-extrabold text-slate-950">{p.stock}</td>
                            <td className="py-3 pr-4">
                              <StatusBadge status={out ? 'FAILED' : low ? 'PENDING' : 'ACTIVE'} />
                            </td>
                            <td className="py-3 text-right">
                              <div className="inline-flex gap-1.5">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={!canEdit || p.stock <= 0}
                                  onClick={() => {
                                    adjustStock(p.id, -1, 'Quick counter decrement', p.warehouseLocation || 'Dhaka Main Studio');
                                    showToast(`Decremented ${p.sku} by 1.`);
                                  }}
                                  className="h-7 px-2 text-xs"
                                >
                                  -1
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={!canEdit}
                                  onClick={() => {
                                    adjustStock(p.id, 5, 'Quick atelier restock', p.warehouseLocation || 'Dhaka Main Studio');
                                    showToast(`Restocked ${p.sku} (+5 units).`);
                                  }}
                                  className="h-7 px-2 text-xs"
                                >
                                  +5
                                </Button>
                              </div>
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
        )}

        {tab === 'locations' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <SectionCard
              className="lg:col-span-7"
              title="Registered Warehouses & Fulfillment Studios"
              subtitle="Inventory pools available to your brand tenant."
            >
              <div className="space-y-3 text-xs">
                {safeWarehouses.map((w) => (
                  <div key={w.id} className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl border border-slate-200">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-900">{w.name}</p>
                        {w.isDefault && <StatusBadge status="ACTIVE" />}
                      </div>
                      <p className="text-slate-500 mt-0.5">
                        {w.city}, {w.country}
                      </p>
                    </div>
                    <p className="font-extrabold text-slate-950">{w.totalUnits.toLocaleString()} units</p>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              className="lg:col-span-5"
              title="Add Warehouse Location"
              subtitle="Register another studio, retail backroom, or regional hub."
            >
              <form onSubmit={handleAddWarehouse} className="space-y-3 text-xs">
                <label className="block space-y-1">
                  <span className="font-semibold text-slate-700">Location Name</span>
                  <input
                    required
                    disabled={!canEdit}
                    value={whName}
                    onChange={(e) => setWhName(e.target.value)}
                    placeholder="e.g. Banani Showroom Stockroom"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="font-semibold text-slate-700">City</span>
                  <input
                    required
                    disabled={!canEdit}
                    value={whCity}
                    onChange={(e) => setWhCity(e.target.value)}
                    placeholder="Dhaka"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="font-semibold text-slate-700">Country</span>
                  <input
                    disabled={!canEdit}
                    value={whCountry}
                    onChange={(e) => setWhCountry(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </label>
                <Button type="submit" disabled={!canEdit} className="w-full gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Add Location
                </Button>
              </form>
            </SectionCard>
          </div>
        )}

        {tab === 'adjustments' && (
          <SectionCard
            title="Manual Stock Adjustment"
            subtitle="Record incoming factory shipments, damaged write-offs, or cycle-count corrections."
          >
            <form onSubmit={handleAdjustSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <label className="block space-y-1">
                <span className="font-semibold text-slate-700">Target Product SKU</span>
                <select
                  value={selectedProductId || safeProducts[0]?.id || ''}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 bg-white"
                >
                  {safeProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) — Current: {p.stock}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1">
                <span className="font-semibold text-slate-700">Warehouse Location</span>
                <select
                  value={adjustLocation}
                  onChange={(e) => setAdjustLocation(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 bg-white"
                >
                  {safeWarehouses.map((w) => (
                    <option key={w.id} value={w.name}>
                      {w.name} ({w.city})
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1">
                <span className="font-semibold text-slate-700">Quantity Delta (+ restock, - shrink)</span>
                <input
                  type="number"
                  required
                  value={adjustDelta}
                  onChange={(e) => setAdjustDelta(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </label>

              <label className="block space-y-1">
                <span className="font-semibold text-slate-700">Adjustment Reason</span>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </label>

              <div className="md:col-span-2 flex justify-end">
                <Button type="submit" disabled={!canEdit || submitting || safeProducts.length === 0} className="gap-1.5">
                  <ArrowDownUp className="w-3.5 h-3.5" />
                  {submitting ? 'Applying Adjustment...' : 'Apply Stock Adjustment'}
                </Button>
              </div>
            </form>
          </SectionCard>
        )}

        {tab === 'history' && (
          <SectionCard title="Inventory Movement History" subtitle="Immutable audit trail of stock changes.">
            {safeLogs.length === 0 ? (
              <EmptyState title="No movements recorded yet" description="Stock adjustments and fulfillment deductions appear here." />
            ) : (
              <>
                <div className="sm:hidden space-y-2.5 text-xs">
                  {safeLogs.map((l) => (
                    <div key={l.id} className="rounded-xl border border-slate-200 p-3 bg-white space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 break-words">{l.productName}</p>
                          <p className="font-mono text-[11px] text-slate-500">{l.variantSku}</p>
                        </div>
                        <span className={`font-extrabold shrink-0 ${l.change >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {l.change >= 0 ? `+${l.change}` : l.change} (→ {l.newStock})
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600">{l.reason} · {l.location}</p>
                      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                        <span>By {l.actor}</span>
                        <span>{l.timestamp}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                        <th className="py-2.5 pr-4">Product / SKU</th>
                        <th className="py-2.5 pr-4">Location</th>
                        <th className="py-2.5 pr-4">Delta</th>
                        <th className="py-2.5 pr-4">Result Stock</th>
                        <th className="py-2.5 pr-4">Reason</th>
                        <th className="py-2.5 pr-4">Actor</th>
                        <th className="py-2.5">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {safeLogs.map((l) => (
                        <tr key={l.id}>
                          <td className="py-3 pr-4">
                            <p className="font-bold text-slate-900">{l.productName}</p>
                            <p className="font-mono text-[11px] text-slate-500">{l.variantSku}</p>
                          </td>
                          <td className="py-3 pr-4 text-slate-600">{l.location}</td>
                          <td className={`py-3 pr-4 font-extrabold ${l.change >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {l.change >= 0 ? `+${l.change}` : l.change}
                          </td>
                          <td className="py-3 pr-4 font-bold text-slate-900">{l.newStock}</td>
                          <td className="py-3 pr-4 text-slate-600">{l.reason}</td>
                          <td className="py-3 pr-4 text-slate-600">{l.actor}</td>
                          <td className="py-3 text-slate-400">{l.timestamp}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </SectionCard>
        )}
      </div>
    </PermissionGate>
  );
}

