'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  Download,
  Loader2,
  PackagePlus,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { Product } from '../../types';
import { canPerform } from '../../config/permissions';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { brandWorkspaceApi } from '../../services';
import {
  ConfirmDialog,
  ErrorBanner,
  PageHeader,
  PermissionGate,
  SafeImage,
  SectionCard,
} from '../../components/shared/UiPrimitives';
import { ProductsNavTabs } from '../../components/shared/ProductsNavTabs';
import { Button } from '../../components/ui/button';
import { Drawer, Switch, formatApiError, useNotify } from './shared';
import { lowSizesOfVariants } from './variantPlan';

type StatusChip = 'ALL' | 'LIVE' | 'DRAFT' | 'OUT_OF_STOCK';

const PAGE_SIZE = 10;

function isLive(p: Product) {
  return p.brandStorefrontPublished || p.marketplacePublished;
}

function StockLabel({ p }: { p: Product }) {
  if (p.stock <= 0) {
    return <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">Out of stock</span>;
  }
  const low = p.stock < (p.lowStockThreshold || 5);
  const lowSizes = lowSizesOfVariants(p.variants);
  return (
    <span className="block">
      <span className={`font-bold ${low ? 'text-amber-600' : 'text-slate-700'}`}>
        {p.stock} {low ? 'left' : 'units'}
      </span>
      {lowSizes.length > 0 && (
        <span className="mt-0.5 block text-[10px] font-semibold text-amber-700" title="Sizes below their low-stock alert">
          Low: {lowSizes.map((s) => `${s.size} (${s.stock})`).join(', ')}
        </span>
      )}
    </span>
  );
}

export function ProductsListView() {
  const notify = useNotify();
  const products = useWorkspaceStore((s) => s.products);
  const setProducts = useWorkspaceStore((s) => s.setProducts);
  const addProduct = useWorkspaceStore((s) => s.addProduct);
  const updateProduct = useWorkspaceStore((s) => s.updateProduct);
  const deleteProduct = useWorkspaceStore((s) => s.deleteProduct);
  const activeRole = useWorkspaceStore((s) => s.activeRole);
  const roleOverrides = useWorkspaceStore((s) => s.roleOverrides);

  const canPublish = canPerform(activeRole, 'products', 'publish', roleOverrides);
  const canDelete = canPerform(activeRole, 'products', 'delete', roleOverrides);
  const canEdit = canPerform(activeRole, 'products', 'edit', roleOverrides);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [chip, setChip] = useState<StatusChip>('ALL');
  const [category, setCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc' | 'sales'>('newest');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [moreOpen, setMoreOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [csvRaw, setCsvRaw] = useState('name,sku,category,price,stock\n');
  const [importLog, setImportLog] = useState<string | null>(null);

  const fetchProducts = useCallback(
    async (manual = false) => {
      if (manual) setRefreshing(true);
      setError(null);
      try {
        setProducts(await brandWorkspaceApi.getProducts());
      } catch (err) {
        setError(formatApiError(err, 'Failed to load products.'));
      } finally {
        setLoading(false);
        if (manual) setRefreshing(false);
      }
    },
    [setProducts]
  );

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))],
    [products]
  );

  const counts = useMemo(
    () => ({
      ALL: products.length,
      LIVE: products.filter(isLive).length,
      DRAFT: products.filter((p) => !isLive(p)).length,
      OUT_OF_STOCK: products.filter((p) => p.stock <= 0).length,
    }),
    [products]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = products.filter((p) => {
      const matchQ =
        !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
      const matchCat = category === 'All' || p.category === category;
      const matchChip =
        chip === 'ALL' ||
        (chip === 'LIVE' && isLive(p)) ||
        (chip === 'DRAFT' && !isLive(p)) ||
        (chip === 'OUT_OF_STOCK' && p.stock <= 0);
      return matchQ && matchCat && matchChip;
    });
    return [...list].sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'sales') return (b.salesCount || 0) - (a.salesCount || 0);
      return (b.updatedAt || '').localeCompare(a.updatedAt || '');
    });
  }, [products, search, chip, category, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const toggleVisibility = async (
    p: Product,
    field: 'brandStorefrontPublished' | 'marketplacePublished' | 'isTryOnEligible'
  ) => {
    if (!canEdit) {
      notify('Your role cannot change product settings.');
      return;
    }
    setError(null);
    const previous = p[field];
    updateProduct(p.id, { [field]: !previous });
    try {
      await brandWorkspaceApi.setPublication(p.id, field, !previous);
      notify(`Updated ${p.name}.`);
    } catch (err) {
      updateProduct(p.id, { [field]: previous });
      setError(formatApiError(err, `Could not update ${p.name}.`));
    }
  };

  const runBulkAction = async (action: 'publish_mp' | 'unpublish_mp' | 'enable_tryon' | 'archive') => {
    if (selectedIds.length === 0) return;
    const apiAction = {
      publish_mp: 'PUBLISH_MARKETPLACE',
      unpublish_mp: 'UNPUBLISH_MARKETPLACE',
      enable_tryon: 'ENABLE_TRYON',
      archive: 'ARCHIVE',
    } as const;
    setError(null);
    setBusy(true);
    try {
      const res = await brandWorkspaceApi.bulkProductAction(selectedIds, apiAction[action]);
      res.products.forEach((updated) => updateProduct(updated.id, updated));
      if (res.errors.length > 0) setError(res.errors.map((e) => `${e.productId}: ${e.message}`).join(' • '));
      notify(res.message || `Updated ${res.updatedCount} product(s).`);
      setSelectedIds([]);
      void fetchProducts();
    } catch (err) {
      setError(formatApiError(err, 'Bulk action failed.'));
    } finally {
      setBusy(false);
    }
  };

  const exportCsv = async () => {
    setMoreOpen(false);
    setError(null);
    setBusy(true);
    try {
      const csv = await brandWorkspaceApi.exportProductsCsv({ category, status: 'All' });
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'brand-catalog-export.csv';
      a.click();
      URL.revokeObjectURL(url);
      notify('Catalog exported to CSV.');
    } catch (err) {
      setError(formatApiError(err, 'Could not export the catalog.'));
    } finally {
      setBusy(false);
    }
  };

  const parsedCsvRows = useMemo(() => {
    const lines = csvRaw.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];
    const seen = new Set<string>();
    return lines.slice(1).map((line) => {
      const [name, sku, rowCategory, price, stock] = line.split(',').map((s) => s?.trim() || '');
      const key = sku.toLowerCase();
      const duplicate = products.some((p) => p.sku.toLowerCase() === key) || Boolean(key && seen.has(key));
      if (key) seen.add(key);
      return {
        name,
        sku,
        category: rowCategory || 'Apparel',
        price: Number(price) || 0,
        stock: Number(stock) || 0,
        duplicateSku: duplicate,
      };
    });
  }, [csvRaw, products]);

  const importCsv = async () => {
    setError(null);
    setImportLog(null);
    const valid = parsedCsvRows.filter((r) => r.name && r.sku && !r.duplicateSku);
    if (valid.length === 0) {
      setImportLog('No valid rows to import. Check for missing names or duplicate SKUs.');
      return;
    }
    setBusy(true);
    try {
      const res = await brandWorkspaceApi.bulkImportProducts(
        valid.map((r) => ({ name: r.name, sku: r.sku, category: r.category, price: r.price, stock: r.stock })),
        true
      );
      res.importedProducts.forEach((created) => addProduct(created));
      setImportLog(res.message);
      notify(`Imported ${res.importedCount} product(s).`);
    } catch (err) {
      setImportLog(formatApiError(err, 'Import failed.'));
    } finally {
      setBusy(false);
    }
  };

  const chips: Array<{ key: StatusChip; label: string }> = [
    { key: 'ALL', label: 'All' },
    { key: 'LIVE', label: 'Live' },
    { key: 'DRAFT', label: 'Draft' },
    { key: 'OUT_OF_STOCK', label: 'Out of stock' },
  ];

  return (
    <PermissionGate module="products" action="view">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Product Management"
          title="Products"
          subtitle="Add garments, control where they are visible, and keep stock up to date."
          actions={
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={refreshing}
                onClick={() => void fetchProducts(true)}
                className="gap-1.5"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <div className="relative">
                <Button variant="outline" size="sm" onClick={() => setMoreOpen((v) => !v)} className="gap-1.5">
                  More <ChevronDown className="h-3.5 w-3.5" />
                </Button>
                {moreOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMoreOpen(false)} />
                    <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white text-xs font-semibold shadow-lg">
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => {
                            setMoreOpen(false);
                            setImportOpen(true);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-slate-50"
                        >
                          <Upload className="h-3.5 w-3.5" /> Import from CSV
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void exportCsv()}
                        className="flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-slate-50 disabled:opacity-60"
                      >
                        <Download className="h-3.5 w-3.5" /> Export to CSV
                      </button>
                    </div>
                  </>
                )}
              </div>
              <Link href="/dashboard/products/new">
                <Button size="sm" className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> Add Product
                </Button>
              </Link>
            </>
          }
        />

        <ProductsNavTabs />

        {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

        <SectionCard>
          {loading && products.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="text-sm font-medium">Loading products…</span>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <PackagePlus className="h-6 w-6" />
              </span>
              <div>
                <p className="text-base font-bold text-slate-950">Add your first product</p>
                <p className="mt-1 max-w-sm text-xs text-slate-500">
                  Upload a photo, set a price and publish it to your storefront. Takes about two minutes.
                </p>
              </div>
              <Link href="/dashboard/products/new">
                <Button size="sm" className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> Add Product
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Status chips */}
              <div className="flex flex-wrap gap-2">
                {chips.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => {
                      setChip(c.key);
                      setPage(1);
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
                      chip === c.key
                        ? 'border-slate-950 bg-slate-950 text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {c.label}
                    <span
                      className={`rounded-full px-1.5 text-[10px] tabular-nums ${
                        chip === c.key ? 'bg-white/20' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {counts[c.key]}
                    </span>
                  </button>
                ))}
              </div>

              {/* Search / filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:max-w-xs sm:flex-1">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Search name, SKU or category"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs focus:bg-white focus:outline-none"
                  />
                </div>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setPage(1);
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c === 'All' ? 'All categories' : c}
                    </option>
                  ))}
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold"
                >
                  <option value="newest">Recently updated</option>
                  <option value="price-asc">Price: low to high</option>
                  <option value="price-desc">Price: high to low</option>
                  <option value="sales">Best selling</option>
                </select>
              </div>

              {selectedIds.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-900 p-3 text-xs text-white">
                  <span className="font-bold">{selectedIds.length} selected</span>
                  <div className="flex flex-wrap gap-2">
                    {canPublish && (
                      <>
                        <button type="button" disabled={busy} onClick={() => void runBulkAction('publish_mp')} className="rounded bg-white px-2.5 py-1 font-bold text-slate-950 disabled:opacity-60">
                          Publish to Marketplace
                        </button>
                        <button type="button" disabled={busy} onClick={() => void runBulkAction('unpublish_mp')} className="rounded bg-slate-700 px-2.5 py-1 font-bold disabled:opacity-60">
                          Unpublish
                        </button>
                      </>
                    )}
                    <button type="button" disabled={busy} onClick={() => void runBulkAction('enable_tryon')} className="rounded bg-amber-400 px-2.5 py-1 font-bold text-slate-950 disabled:opacity-60">
                      Enable Try-On
                    </button>
                    <button type="button" disabled={busy} onClick={() => void runBulkAction('archive')} className="rounded bg-rose-600 px-2.5 py-1 font-bold disabled:opacity-60">
                      Archive
                    </button>
                  </div>
                </div>
              )}

              {paged.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  No products match these filters.{' '}
                  <button
                    type="button"
                    className="font-bold text-slate-900 underline"
                    onClick={() => {
                      setSearch('');
                      setChip('ALL');
                      setCategory('All');
                    }}
                  >
                    Reset filters
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="w-8 px-3 py-3">
                          <input
                            type="checkbox"
                            aria-label="Select all on this page"
                            checked={selectedIds.length === paged.length && paged.length > 0}
                            onChange={(e) => setSelectedIds(e.target.checked ? paged.map((p) => p.id) : [])}
                          />
                        </th>
                        <th className="px-3 py-3">Product</th>
                        <th className="px-3 py-3">Price</th>
                        <th className="px-3 py-3">Stock</th>
                        <th className="px-3 py-3 text-center">Storefront</th>
                        <th className="px-3 py-3 text-center">Marketplace</th>
                        <th className="px-3 py-3 text-center">Try-On</th>
                        <th className="px-3 py-3 text-right" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paged.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/70">
                          <td className="px-3 py-3">
                            <input
                              type="checkbox"
                              aria-label={`Select ${p.name}`}
                              checked={selectedIds.includes(p.id)}
                              onChange={() => toggleSelect(p.id)}
                            />
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-3">
                              <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                                <SafeImage src={p.image} alt={p.name} fill className="object-cover" />
                              </div>
                              <div className="min-w-0">
                                <Link
                                  href={`/dashboard/products/${p.id}`}
                                  className="block max-w-[220px] truncate font-bold text-slate-900 hover:underline"
                                >
                                  {p.name}
                                </Link>
                                <p className="text-[11px] text-slate-500">
                                  <span className="font-mono">{p.sku}</span> · {p.category}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 font-bold text-slate-950">
                            {(() => {
                              const prices = [p.price, ...(p.variants || []).map((v) => v.price ?? p.price)];
                              const low = Math.min(...prices);
                              const high = Math.max(...prices);
                              return low === high ? `৳${low}` : `৳${low}–${high}`;
                            })()}
                          </td>
                          <td className="px-3 py-3">
                            <StockLabel p={p} />
                          </td>
                          <td className="px-3 py-3 text-center">
                            <Switch
                              label={`Storefront visibility for ${p.name}`}
                              checked={p.brandStorefrontPublished}
                              disabled={!canEdit}
                              onChange={() => void toggleVisibility(p, 'brandStorefrontPublished')}
                            />
                          </td>
                          <td className="px-3 py-3 text-center">
                            <Switch
                              label={`Marketplace visibility for ${p.name}`}
                              checked={p.marketplacePublished}
                              disabled={!canEdit}
                              onChange={() => void toggleVisibility(p, 'marketplacePublished')}
                            />
                          </td>
                          <td className="px-3 py-3 text-center">
                            <button
                              type="button"
                              disabled={!canEdit}
                              onClick={() => void toggleVisibility(p, 'isTryOnEligible')}
                              aria-label={`Try-on for ${p.name}`}
                              aria-pressed={p.isTryOnEligible}
                              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold disabled:opacity-50 ${
                                p.isTryOnEligible
                                  ? 'border-amber-200 bg-amber-50 text-amber-800'
                                  : 'border-slate-200 bg-slate-100 text-slate-500'
                              }`}
                            >
                              <Sparkles className="h-3 w-3" />
                              {p.isTryOnEligible ? 'On' : 'Off'}
                            </button>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <Link
                                href={`/dashboard/products/${p.id}`}
                                className="rounded-lg border border-slate-200 px-2.5 py-1 font-semibold hover:bg-slate-100"
                              >
                                Edit
                              </Link>
                              {canDelete && (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(p.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600"
                                  aria-label={`Delete ${p.name}`}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs">
                  <span className="text-slate-500">
                    Page {page} of {totalPages} ({filtered.length} products)
                  </span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                      Previous
                    </Button>
                    <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </SectionCard>
      </div>

      {/* CSV import drawer */}
      <Drawer
        open={importOpen}
        title="Import products from CSV"
        subtitle="Columns: name, sku, category, price, stock"
        onClose={() => setImportOpen(false)}
        footer={
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-slate-500">
              {parsedCsvRows.filter((r) => r.name && r.sku && !r.duplicateSku).length} of {parsedCsvRows.length} rows ready
            </span>
            <Button size="sm" disabled={busy || parsedCsvRows.length === 0} onClick={() => void importCsv()}>
              {busy ? 'Importing…' : 'Import'}
            </Button>
          </div>
        }
      >
        <textarea
          value={csvRaw}
          onChange={(e) => setCsvRaw(e.target.value)}
          rows={8}
          spellCheck={false}
          className="w-full rounded-xl border border-slate-200 p-3 font-mono text-xs"
          aria-label="CSV data"
        />
        {parsedCsvRows.length > 0 && (
          <ul className="mt-4 space-y-1.5 text-xs">
            {parsedCsvRows.map((r, i) => (
              <li
                key={`${r.sku}-${i}`}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
                  r.duplicateSku || !r.name || !r.sku ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-slate-200'
                }`}
              >
                <span className="truncate font-semibold">{r.name || '(no name)'}</span>
                <span className="font-mono text-[11px]">{r.duplicateSku ? 'duplicate SKU' : r.sku || 'no SKU'}</span>
              </li>
            ))}
          </ul>
        )}
        {importLog && <p className="mt-4 text-xs font-semibold text-slate-700">{importLog}</p>}
      </Drawer>

      <ConfirmDialog
        open={Boolean(confirmDeleteId)}
        title="Delete this product?"
        description="This permanently removes the product from your catalog, storefront and marketplace. To hide it instead, turn off its Storefront and Marketplace switches."
        confirmLabel="Delete Product"
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={async () => {
          if (!confirmDeleteId) return;
          const targetId = confirmDeleteId;
          setConfirmDeleteId(null);
          setError(null);
          try {
            await brandWorkspaceApi.deleteProduct(targetId);
            deleteProduct(targetId);
            notify('Product deleted.');
            void fetchProducts();
          } catch (err) {
            setError(formatApiError(err, 'Could not delete the product.'));
          }
        }}
      />
    </PermissionGate>
  );
}
