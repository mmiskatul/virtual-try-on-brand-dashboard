'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Download,
  ExternalLink,
  Layers,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { Product } from '../../types';
import { canPerform } from '../../config/permissions';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { useUiStore } from '../../stores/useUiStore';
import { brandWorkspaceApi } from '../../services';
import {
  ConfirmDialog,
  EmptyState,
  PageHeader,
  PermissionGate,
  SafeImage,
  SectionCard,
  StatusBadge,
} from '../../components/shared/UiPrimitives';
import { Button } from '../../components/ui/button';

export type ProductsSubView =
  | 'list'
  | 'categories'
  | 'collections'
  | 'attributes'
  | 'import'
  | 'export';

export function ProductsManagementView({ initialView = 'list' }: { initialView?: ProductsSubView }) {
  const [view, setView] = useState<ProductsSubView>(initialView);

  const products = useWorkspaceStore((s) => s.products);
  const fabrics = useWorkspaceStore((s) => s.fabrics);
  const activeRole = useWorkspaceStore((s) => s.activeRole);
  const roleOverrides = useWorkspaceStore((s) => s.roleOverrides);
  const updateProduct = useWorkspaceStore((s) => s.updateProduct);
  const deleteProduct = useWorkspaceStore((s) => s.deleteProduct);
  const addProduct = useWorkspaceStore((s) => s.addProduct);
  const addFabric = useWorkspaceStore((s) => s.addFabric);

  const showToast = useUiStore((s) => s.showToast);
  const hideToast = useUiStore((s) => s.hideToast);

  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc' | 'sales'>('newest');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Import CSV preview state
  const [csvRaw, setCsvRaw] = useState(
    'name,sku,category,price,stock\nStudio Draped Silk Top,AUR-TOP-901,Tops,145,25\nMilanese Cropped Coat,AUR-JAC-902,Jackets,340,12'
  );
  const [importLog, setImportLog] = useState<string | null>(null);

  // Attribute / Fabric composer
  const [fabName, setFabName] = useState('');
  const [fabComp, setFabComp] = useState('');

  const canPublish = canPerform(activeRole, 'products', 'publish', roleOverrides);
  const canDelete = canPerform(activeRole, 'products', 'delete', roleOverrides);
  const canEdit = canPerform(activeRole, 'products', 'edit', roleOverrides);

  const notify = (msg: string) => {
    showToast(msg);
    setTimeout(hideToast, 3000);
  };

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(products.map((p) => p.category)))],
    [products]
  );

  const collectionsList = useMemo(
    () => Array.from(new Set(products.flatMap((p) => p.collections || []))),
    [products]
  );

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      const q = search.trim().toLowerCase();
      const matchQ =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      const matchCat = catFilter === 'All' || p.category === catFilter;
      const matchStatus =
        statusFilter === 'All' ||
        (statusFilter === 'MARKETPLACE' && p.marketplacePublished) ||
        (statusFilter === 'STOREFRONT_ONLY' && p.brandStorefrontPublished && !p.marketplacePublished) ||
        (statusFilter === 'DRAFT' && !p.brandStorefrontPublished && !p.marketplacePublished) ||
        (statusFilter === 'TRYON' && p.isTryOnEligible);
      return matchQ && matchCat && matchStatus;
    });

    list = [...list].sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'sales') return (b.salesCount || 0) - (a.salesCount || 0);
      return (b.updatedAt || '').localeCompare(a.updatedAt || '');
    });

    return list;
  }, [products, search, catFilter, statusFilter, sortBy]);

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleVisibility = async (
    p: Product,
    field: 'brandStorefrontPublished' | 'marketplacePublished' | 'isTryOnEligible'
  ) => {
    if (!canEdit) {
      notify('Your role cannot modify product settings.');
      return;
    }
    const nextVal = !p[field];
    updateProduct(p.id, { [field]: nextVal });

    if (field !== 'isTryOnEligible') {
      try {
        await brandWorkspaceApi.setPublication(p.id, field, nextVal);
      } catch {
        // Optimistic update preserved locally
      }
    }
    notify(`Updated ${p.name} visibility.`);
  };

  const runBulkAction = (action: 'publish_mp' | 'unpublish_mp' | 'enable_tryon' | 'archive') => {
    if (selectedIds.length === 0) return;
    selectedIds.forEach((id) => {
      if (action === 'publish_mp') updateProduct(id, { marketplacePublished: true, catalogStatus: 'ACTIVE' });
      if (action === 'unpublish_mp') updateProduct(id, { marketplacePublished: false });
      if (action === 'enable_tryon') updateProduct(id, { isTryOnEligible: true });
      if (action === 'archive') updateProduct(id, { catalogStatus: 'ARCHIVED', marketplacePublished: false, brandStorefrontPublished: false });
    });
    notify(`Applied bulk action to ${selectedIds.length} product(s).`);
    setSelectedIds([]);
  };

  const handleExportCsv = () => {
    const header = 'id,name,sku,category,price,stock,storefrontPublished,marketplacePublished,isTryOnEligible';
    const rows = filtered.map(
      (p) =>
        `"${p.id}","${p.name.replace(/"/g, '""')}","${p.sku}","${p.category}",${p.price},${p.stock},${p.brandStorefrontPublished},${p.marketplacePublished},${p.isTryOnEligible}`
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'brand-catalog-export.csv';
    a.click();
    URL.revokeObjectURL(url);
    notify(`Exported ${filtered.length} products cleanly to CSV.`);
  };

  const parsedCsvRows = useMemo(() => {
    const lines = csvRaw.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    return lines.slice(1).map((line) => {
      const [name, sku, category, price, stock] = line.split(',').map((s) => s?.trim() || '');
      const duplicateSku = products.some((p) => p.sku.toLowerCase() === sku.toLowerCase());
      return { name, sku, category: category || 'Apparel', price: Number(price) || 0, stock: Number(stock) || 0, duplicateSku };
    });
  }, [csvRaw, products]);

  const handleConfirmCsvImport = () => {
    const validRows = parsedCsvRows.filter((r) => r.name && r.sku && !r.duplicateSku);
    validRows.forEach((r) => {
      addProduct({
        id: `prod_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        name: r.name,
        slug: r.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        sku: r.sku,
        category: r.category,
        price: r.price,
        stock: r.stock,
        catalogStatus: 'DRAFT',
        brandStorefrontPublished: true,
        marketplacePublished: false,
        isTryOnEligible: true,
        tryOnCategory: 'tops',
        image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80',
      });
    });
    setImportLog(`Imported ${validRows.length} garment(s) cleanly. Skipped ${parsedCsvRows.length - validRows.length} duplicate/invalid row(s).`);
    notify(`Imported ${validRows.length} products into tenant catalog.`);
  };

  return (
    <PermissionGate module="products" action="view">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Product Management"
          title="Garment Catalog & Visibility Control"
          subtitle="Private catalog items require explicit Storefront or Marketplace publication before customers can see them."
          actions={
            <>
              <Button variant="outline" size="sm" onClick={handleExportCsv} className="gap-1.5">
                <Download className="w-3.5 h-3.5" /> Export CSV
              </Button>
              <Link href="/dashboard/products/create">
                <Button size="sm" className="gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Add Product
                </Button>
              </Link>
            </>
          }
        />

        {/* Sub-view tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 text-xs font-bold">
          {(
            [
              ['list', `All Products (${products.length})`],
              ['categories', 'Categories'],
              ['collections', 'Collections'],
              ['attributes', 'Attributes & Fabrics'],
              ['import', 'Bulk CSV Import'],
              ['export', 'Export Catalog'],
            ] as Array<[ProductsSubView, string]>
          ).map(([k, lbl]) => (
            <button
              key={k}
              type="button"
              onClick={() => setView(k)}
              className={`px-3.5 py-2 rounded-xl border whitespace-nowrap ${
                view === k ? 'bg-slate-950 text-white border-slate-950' : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>

        {view === 'list' && (
          <SectionCard>
            {/* Filters & Bulk Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
                <div className="relative flex-1 max-w-xs">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    placeholder="Search title, SKU, category..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none"
                  />
                </div>
                <select value={catFilter} onChange={(e) => { setCatFilter(e.target.value); setPage(1); }} className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white">
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white">
                  <option value="All">All Visibility</option>
                  <option value="MARKETPLACE">Published to Marketplace</option>
                  <option value="STOREFRONT_ONLY">Brand Storefront Only</option>
                  <option value="DRAFT">Draft / Hidden</option>
                  <option value="TRYON">Try-On Eligible</option>
                </select>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white">
                  <option value="newest">Recently Updated</option>
                  <option value="price-asc">Price: Low-High</option>
                  <option value="price-desc">Price: High-Low</option>
                  <option value="sales">Best Selling</option>
                </select>
              </div>
            </div>

            {selectedIds.length > 0 && (
              <div className="p-3 rounded-xl bg-slate-900 text-white flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-bold">{selectedIds.length} garment(s) selected</span>
                <div className="flex flex-wrap gap-2">
                  {canPublish && (
                    <>
                      <button type="button" onClick={() => runBulkAction('publish_mp')} className="px-2.5 py-1 rounded bg-white text-slate-950 font-bold">
                        Publish to Marketplace
                      </button>
                      <button type="button" onClick={() => runBulkAction('unpublish_mp')} className="px-2.5 py-1 rounded bg-slate-700 font-bold">
                        Unpublish
                      </button>
                    </>
                  )}
                  <button type="button" onClick={() => runBulkAction('enable_tryon')} className="px-2.5 py-1 rounded bg-amber-400 text-slate-950 font-bold">
                    Enable Try-On
                  </button>
                  <button type="button" onClick={() => runBulkAction('archive')} className="px-2.5 py-1 rounded bg-rose-600 font-bold">
                    Archive
                  </button>
                </div>
              </div>
            )}

            {paged.length === 0 ? (
              <EmptyState
                title="No matching garments"
                description="Create your first garment or reset catalog filters."
                actionLabel="Reset Filters"
                onAction={() => { setSearch(''); setCatFilter('All'); setStatusFilter('All'); }}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="py-3 px-3"><input type="checkbox" checked={selectedIds.length === paged.length && paged.length > 0} onChange={(e) => setSelectedIds(e.target.checked ? paged.map((p) => p.id) : [])} /></th>
                      <th className="py-3 px-3">Product</th>
                      <th className="py-3 px-3">SKU</th>
                      <th className="py-3 px-3">Price</th>
                      <th className="py-3 px-3">Stock</th>
                      <th className="py-3 px-3 text-center">Storefront</th>
                      <th className="py-3 px-3 text-center">Marketplace</th>
                      <th className="py-3 px-3 text-center">Try-On</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paged.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-3">
                          <input type="checkbox" checked={selectedIds.includes(p.id)} onChange={() => toggleSelect(p.id)} />
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <div className="relative w-10 h-12 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                              <SafeImage src={p.image} alt={p.name} fill className="object-cover" />
                            </div>
                            <div className="min-w-0">
                              <Link href={`/dashboard/products/${p.id}`} className="font-bold text-slate-900 hover:underline block truncate max-w-[200px]">
                                {p.name}
                              </Link>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] text-slate-500">{p.category}</span>
                                <StatusBadge status={p.catalogStatus || 'ACTIVE'} />
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-500">{p.sku}</td>
                        <td className="py-3 px-3 font-bold text-slate-950">${p.price}</td>
                        <td className="py-3 px-3">
                          <span className={`font-bold ${p.stock < (p.lowStockThreshold || 5) ? 'text-amber-600' : 'text-slate-700'}`}>
                            {p.stock} units
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => toggleVisibility(p, 'brandStorefrontPublished')}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                              p.brandStorefrontPublished
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}
                          >
                            {p.brandStorefrontPublished ? 'Visible' : 'Hidden'}
                          </button>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => toggleVisibility(p, 'marketplacePublished')}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                              p.marketplacePublished
                                ? 'bg-slate-950 text-white border-slate-950'
                                : 'bg-white text-slate-600 border-slate-300'
                            }`}
                          >
                            {p.marketplacePublished ? 'Published' : 'Unpublished'}
                          </button>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => toggleVisibility(p, 'isTryOnEligible')}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                              p.isTryOnEligible
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}
                          >
                            <Sparkles className="w-3 h-3" />
                            {p.isTryOnEligible ? 'Enabled' : 'Off'}
                          </button>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <Link href={`/dashboard/products/${p.id}`} className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 font-semibold">
                              Edit
                            </Link>
                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(p.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600"
                                aria-label="Delete product"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                <span className="text-slate-500">Page {page} of {totalPages} ({filtered.length} total)</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                  <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
                </div>
              </div>
            )}
          </SectionCard>
        )}

        {view === 'categories' && (
          <SectionCard title="Product Categories Breakdown" subtitle="Organize your brand-exclusive taxonomy">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              {categories.filter((c) => c !== 'All').map((c) => {
                const count = products.filter((p) => p.category === c).length;
                return (
                  <div key={c} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-1">
                    <p className="font-bold text-slate-900">{c}</p>
                    <p className="text-slate-500">{count} product(s)</p>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        )}

        {view === 'collections' && (
          <SectionCard title="Brand Collections" subtitle="Group seasonal garments across storefront & marketplace">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              {collectionsList.map((col) => (
                <div key={col} className="p-5 rounded-2xl border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-950">{col}</span>
                    <Layers className="w-4 h-4 text-slate-500" />
                  </div>
                  <p className="text-slate-500">
                    {products.filter((p) => (p.collections || []).includes(col)).length} assigned garment(s)
                  </p>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {view === 'attributes' && (
          <SectionCard title="Fabrics & Material Specifications" subtitle="Reusable textile records attached to apparel garments">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {fabrics.map((f) => (
                <div key={f.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-1">
                  <p className="font-bold text-slate-900">{f.name}</p>
                  <p className="text-slate-600">{f.composition} • {f.thickness} • Stretch: {f.stretch}</p>
                  <p className="text-[11px] text-slate-500">{f.care}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100 text-xs">
              <input value={fabName} onChange={(e) => setFabName(e.target.value)} placeholder="Fabric name (e.g. Organic Poplin)" className="px-3 py-2 rounded-xl border border-slate-200" />
              <input value={fabComp} onChange={(e) => setFabComp(e.target.value)} placeholder="Composition" className="px-3 py-2 rounded-xl border border-slate-200" />
              <Button
                size="sm"
                onClick={async () => {
                  if (!fabName.trim()) return;
                  const next = { id: `fab_${Date.now()}`, name: fabName.trim(), composition: fabComp || '100% Natural Fiber', stretch: 'LOW', thickness: 'MEDIUM', care: 'Gentle wash' };
                  addFabric(next);
                  try { await brandWorkspaceApi.createFabric(next); } catch {}
                  setFabName(''); setFabComp('');
                  notify('Fabric added to library.');
                }}
              >
                Add Fabric
              </Button>
            </div>
          </SectionCard>
        )}

        {view === 'import' && (
          <SectionCard title="Bulk CSV Product Import" subtitle="Preview parsed columns and duplicate SKU checks before adding to tenant catalog">
            <div className="space-y-4 text-xs">
              <textarea rows={4} value={csvRaw} onChange={(e) => setCsvRaw(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 font-mono text-[11px]" />
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] uppercase text-slate-500">
                    <tr><th className="p-2.5">Name</th><th className="p-2.5">SKU</th><th className="p-2.5">Category</th><th className="p-2.5">Price</th><th className="p-2.5">Stock</th><th className="p-2.5">Validation</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedCsvRows.map((r, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-bold">{r.name}</td>
                        <td className="p-2.5 font-mono">{r.sku}</td>
                        <td className="p-2.5">{r.category}</td>
                        <td className="p-2.5">${r.price}</td>
                        <td className="p-2.5">{r.stock}</td>
                        <td className="p-2.5">{r.duplicateSku ? <span className="text-rose-600 font-bold">Duplicate SKU</span> : <span className="text-emerald-600 font-bold">Ready</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center gap-3">
                <Button size="sm" onClick={handleConfirmCsvImport} className="gap-1.5">
                  <Upload className="w-3.5 h-3.5" /> Import Valid Rows
                </Button>
                {importLog && <span className="font-semibold text-emerald-700">{importLog}</span>}
              </div>
            </div>
          </SectionCard>
        )}

        {view === 'export' && (
          <SectionCard title="Export Catalog Dataset" subtitle="Download your tenant's full product catalog including visibility states">
            <Button size="sm" onClick={handleExportCsv} className="gap-1.5">
              <Download className="w-4 h-4" /> Download Full CSV ({products.length} SKUs)
            </Button>
          </SectionCard>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(confirmDeleteId)}
        title="Delete Garment from Brand Catalog?"
        description="This permanently removes the product from your brand catalog, storefront, and marketplace. Unpublishing instead preserves the product cleanly."
        confirmLabel="Delete Product"
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={async () => {
          if (confirmDeleteId) {
            deleteProduct(confirmDeleteId);
            try { await brandWorkspaceApi.deleteProduct(confirmDeleteId); } catch {}
            notify('Product deleted.');
            setConfirmDeleteId(null);
          }
        }}
      />
    </PermissionGate>
  );
}

