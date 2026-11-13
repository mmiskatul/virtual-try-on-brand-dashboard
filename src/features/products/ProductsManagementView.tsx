'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Download,
  Layers,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { Fabric, Product } from '../../types';
import { canPerform } from '../../config/permissions';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { useUiStore } from '../../stores/useUiStore';
import {
  BrandCategoryRecord,
  BrandCollectionRecord,
  brandWorkspaceApi,
  ServiceError,
} from '../../services';
import {
  ConfirmDialog,
  EmptyState,
  ErrorBanner,
  PageHeader,
  PermissionGate,
  SafeImage,
  SectionCard,
  StatusBadge,
} from '../../components/shared/UiPrimitives';
import { ProductsNavTabs } from '../../components/shared/ProductsNavTabs';
import { Button } from '../../components/ui/button';

export type ProductsSubView =
  | 'list'
  | 'categories'
  | 'collections'
  | 'attributes'
  | 'import'
  | 'export';

function formatApiError(err: unknown, fallback: string): string {
  if (err instanceof ServiceError) {
    if (err.issues && err.issues.length > 0) {
      return err.issues.map((i) => `${i.path}: ${i.message}`).join(' • ');
    }
    return err.message || fallback;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export function ProductsManagementView({ initialView = 'list' }: { initialView?: ProductsSubView }) {
  const [view, setView] = useState<ProductsSubView>(initialView);
  useEffect(() => {
    setView(initialView);
  }, [initialView]);

  const products = useWorkspaceStore((s) => s.products);
  const fabrics = useWorkspaceStore((s) => s.fabrics);
  const activeRole = useWorkspaceStore((s) => s.activeRole);
  const roleOverrides = useWorkspaceStore((s) => s.roleOverrides);
  const updateProduct = useWorkspaceStore((s) => s.updateProduct);
  const deleteProduct = useWorkspaceStore((s) => s.deleteProduct);
  const addProduct = useWorkspaceStore((s) => s.addProduct);
  const setFabrics = useWorkspaceStore((s) => s.setFabrics);
  const addFabric = useWorkspaceStore((s) => s.addFabric);
  const updateFabric = useWorkspaceStore((s) => s.updateFabric);
  const deleteFabric = useWorkspaceStore((s) => s.deleteFabric);

  const showToast = useUiStore((s) => s.showToast);
  const hideToast = useUiStore((s) => s.hideToast);

  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc' | 'sales'>('newest');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState(false);

  // Categories backend state
  const [apiCategories, setApiCategories] = useState<BrandCategoryRecord[]>([]);
  const [catName, setCatName] = useState('');
  const [catSeoTitle, setCatSeoTitle] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  // Collections backend state
  const [apiCollections, setApiCollections] = useState<BrandCollectionRecord[]>([]);
  const [colTitle, setColTitle] = useState('');
  const [colDesc, setColDesc] = useState('');
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null);

  // Attributes & Fabrics state
  const [fabName, setFabName] = useState('');
  const [fabComp, setFabComp] = useState('');
  const [fabStretch, setFabStretch] = useState<Fabric['stretch']>('LOW');
  const [fabThickness, setFabThickness] = useState<Fabric['thickness']>('MEDIUM');
  const [fabCare, setFabCare] = useState('');
  const [editingFabricId, setEditingFabricId] = useState<string | null>(null);

  // Import CSV preview state
  const [csvRaw, setCsvRaw] = useState(
    'name,sku,category,price,stock\nStudio Draped Silk Top,AUR-TOP-901,Tops,145,25\nMilanese Cropped Coat,AUR-JAC-902,Jackets,340,12'
  );
  const [importLog, setImportLog] = useState<string | null>(null);

  const canPublish = canPerform(activeRole, 'products', 'publish', roleOverrides);
  const canDelete = canPerform(activeRole, 'products', 'delete', roleOverrides);
  const canEdit = canPerform(activeRole, 'products', 'edit', roleOverrides);

  const notify = useCallback(
    (msg: string) => {
      showToast(msg);
      setTimeout(hideToast, 3000);
    },
    [hideToast, showToast]
  );

  // Load Categories, Collections & Fabrics when opening relevant tabs
  useEffect(() => {
    let active = true;
    if (view === 'categories') {
      brandWorkspaceApi
        .getCategories()
        .then((list) => {
          if (active) setApiCategories(list);
        })
        .catch(() => {});
    } else if (view === 'collections') {
      brandWorkspaceApi
        .getCollections()
        .then((list) => {
          if (active) setApiCollections(list);
        })
        .catch(() => {});
    } else if (view === 'attributes') {
      brandWorkspaceApi
        .getFabrics()
        .then((list) => {
          if (active && list.length > 0) setFabrics(list);
        })
        .catch(() => {});
    }
    return () => {
      active = false;
    };
  }, [setFabrics, view]);

  const categories = useMemo(
    () => [
      'All',
      ...Array.from(
        new Set([
          ...products.map((p) => p.category),
          ...apiCategories.map((c) => c.name),
        ].filter(Boolean))
      ),
    ],
    [apiCategories, products]
  );

  const collectionsList = useMemo(
    () =>
      Array.from(
        new Set([
          ...products.flatMap((p) => p.collections || []),
          ...apiCollections.map((c) => c.title),
        ].filter(Boolean))
      ),
    [apiCollections, products]
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
    setErrorBanner(null);
    const prevVal = p[field];
    const nextVal = !prevVal;
    updateProduct(p.id, { [field]: nextVal });

    try {
      await brandWorkspaceApi.setPublication(p.id, field, nextVal);
      notify(`Updated ${p.name} visibility.`);
    } catch (err) {
      updateProduct(p.id, { [field]: prevVal });
      setErrorBanner(formatApiError(err, `Failed to update ${p.name} visibility.`));
    }
  };

  const runBulkAction = async (action: 'publish_mp' | 'unpublish_mp' | 'enable_tryon' | 'archive') => {
    if (selectedIds.length === 0) return;
    setErrorBanner(null);
    setBusyAction(true);

    const apiActionMap = {
      publish_mp: 'PUBLISH_MARKETPLACE',
      unpublish_mp: 'UNPUBLISH_MARKETPLACE',
      enable_tryon: 'ENABLE_TRYON',
      archive: 'ARCHIVE',
    } as const;

    try {
      const res = await brandWorkspaceApi.bulkProductAction(selectedIds, apiActionMap[action]);
      res.products.forEach((updated) => updateProduct(updated.id, updated));
      if (res.errors.length > 0) {
        setErrorBanner(res.errors.map((e) => `${e.productId}: ${e.message}`).join(' • '));
      }
      notify(res.message || `Applied bulk action to ${res.updatedCount} product(s).`);
      setSelectedIds([]);
    } catch (err) {
      setErrorBanner(formatApiError(err, 'Bulk catalog operation failed.'));
    } finally {
      setBusyAction(false);
    }
  };

  const handleExportCsv = async () => {
    setErrorBanner(null);
    setBusyAction(true);
    try {
      const csv = await brandWorkspaceApi.exportProductsCsv({
        category: catFilter,
        status: statusFilter,
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'brand-catalog-export.csv';
      a.click();
      URL.revokeObjectURL(url);
      notify('Exported tenant catalog cleanly to CSV.');
    } catch (err) {
      setErrorBanner(formatApiError(err, 'Failed to export catalog from backend.'));
    } finally {
      setBusyAction(false);
    }
  };

  const parsedCsvRows = useMemo(() => {
    const lines = csvRaw.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];
    const seenBatchSkus = new Set<string>();
    return lines.slice(1).map((line) => {
      const [name, sku, category, price, stock] = line.split(',').map((s) => s?.trim() || '');
      const skuLower = sku.toLowerCase();
      const duplicateInCatalog = products.some((p) => p.sku.toLowerCase() === skuLower);
      const duplicateInBatch = Boolean(skuLower && seenBatchSkus.has(skuLower));
      if (skuLower) seenBatchSkus.add(skuLower);
      return {
        name,
        sku,
        category: category || 'Apparel',
        price: Number(price) || 0,
        stock: Number(stock) || 0,
        duplicateSku: duplicateInCatalog || duplicateInBatch,
      };
    });
  }, [csvRaw, products]);

  const handleConfirmCsvImport = async () => {
    setErrorBanner(null);
    setImportLog(null);
    const validRows = parsedCsvRows.filter((r) => r.name && r.sku && !r.duplicateSku);
    if (validRows.length === 0) {
      setErrorBanner('No valid non-duplicate CSV rows ready for import.');
      return;
    }

    setBusyAction(true);
    try {
      const res = await brandWorkspaceApi.bulkImportProducts(
        validRows.map((r) => ({
          name: r.name,
          sku: r.sku,
          category: r.category,
          price: r.price,
          stock: r.stock,
        })),
        true
      );
      res.importedProducts.forEach((created) => addProduct(created));
      setImportLog(res.message);
      notify(`Imported ${res.importedCount} product(s) into tenant catalog.`);
    } catch (err) {
      setErrorBanner(formatApiError(err, 'Bulk CSV import failed.'));
    } finally {
      setBusyAction(false);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    setErrorBanner(null);
    setBusyAction(true);
    try {
      if (editingCategoryId) {
        const updated = await brandWorkspaceApi.updateCategory(editingCategoryId, {
          name: catName.trim(),
          seoTitle: catSeoTitle.trim() || undefined,
        });
        setApiCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        setEditingCategoryId(null);
        notify(`Category "${updated.name}" updated.`);
      } else {
        const created = await brandWorkspaceApi.createCategory({
          name: catName.trim(),
          seoTitle: catSeoTitle.trim() || undefined,
          sortOrder: apiCategories.length + 1,
        });
        setApiCategories((prev) => [...prev.filter((c) => c.id !== created.id), created]);
        notify(`Category "${created.name}" created.`);
      }
      setCatName('');
      setCatSeoTitle('');
    } catch (err) {
      setErrorBanner(formatApiError(err, 'Failed to save category.'));
    } finally {
      setBusyAction(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    setErrorBanner(null);
    setBusyAction(true);
    try {
      await brandWorkspaceApi.deleteCategory(id);
      setApiCategories((prev) => prev.filter((c) => c.id !== id));
      notify('Category removed.');
    } catch (err) {
      setErrorBanner(formatApiError(err, 'Failed to remove category.'));
    } finally {
      setBusyAction(false);
    }
  };

  const handleSaveCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!colTitle.trim()) return;
    setErrorBanner(null);
    setBusyAction(true);
    try {
      if (editingCollectionId) {
        const updated = await brandWorkspaceApi.updateCollection(editingCollectionId, {
          title: colTitle.trim(),
          description: colDesc.trim() || undefined,
        });
        setApiCollections((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        setEditingCollectionId(null);
        notify(`Collection "${updated.title}" updated.`);
      } else {
        const created = await brandWorkspaceApi.createCollection({
          title: colTitle.trim(),
          description: colDesc.trim() || undefined,
        });
        setApiCollections((prev) => [created, ...prev.filter((c) => c.id !== created.id)]);
        notify(`Collection "${created.title}" created.`);
      }
      setColTitle('');
      setColDesc('');
    } catch (err) {
      setErrorBanner(formatApiError(err, 'Failed to save collection.'));
    } finally {
      setBusyAction(false);
    }
  };

  const handleDeleteCollection = async (id: string) => {
    setErrorBanner(null);
    setBusyAction(true);
    try {
      await brandWorkspaceApi.deleteCollection(id);
      setApiCollections((prev) => prev.filter((c) => c.id !== id));
      notify('Collection deleted.');
    } catch (err) {
      setErrorBanner(formatApiError(err, 'Failed to delete collection.'));
    } finally {
      setBusyAction(false);
    }
  };

  const handleSaveFabric = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fabName.trim() || !fabComp.trim()) {
      setErrorBanner('Fabric name and composition are required.');
      return;
    }
    setErrorBanner(null);
    setBusyAction(true);
    try {
      if (editingFabricId) {
        const res = await brandWorkspaceApi.updateFabric(editingFabricId, {
          name: fabName.trim(),
          composition: fabComp.trim(),
          stretch: fabStretch,
          thickness: fabThickness,
          careInstructions: fabCare.trim() || 'Dry clean recommended.',
        } as any);
        updateFabric(editingFabricId, res.fabric);
        setEditingFabricId(null);
        notify(`Fabric "${res.fabric.name}" updated.`);
      } else {
        const res = await brandWorkspaceApi.createFabric({
          name: fabName.trim(),
          composition: fabComp.trim(),
          stretch: fabStretch,
          thickness: fabThickness,
          careInstructions: fabCare.trim() || 'Gentle wash',
        } as any);
        addFabric(res.fabric);
        notify(`Fabric "${res.fabric.name}" added to library.`);
      }
      setFabName('');
      setFabComp('');
      setFabCare('');
    } catch (err) {
      setErrorBanner(formatApiError(err, 'Failed to save fabric specification.'));
    } finally {
      setBusyAction(false);
    }
  };

  const handleDeleteFabric = async (id: string) => {
    setErrorBanner(null);
    setBusyAction(true);
    try {
      await brandWorkspaceApi.deleteFabric(id);
      deleteFabric(id);
      notify('Fabric deleted.');
    } catch (err) {
      setErrorBanner(formatApiError(err, 'Failed to delete fabric.'));
    } finally {
      setBusyAction(false);
    }
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
              <Button variant="outline" size="sm" disabled={busyAction} onClick={handleExportCsv} className="gap-1.5">
                <Download className="w-3.5 h-3.5" /> Export CSV
              </Button>
              <Link href="/dashboard/products/addproduct">
                <Button size="sm" className="gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Add Product
                </Button>
              </Link>
            </>
          }
        />

        <ProductsNavTabs activeTab={view} />

        {errorBanner && <ErrorBanner message={errorBanner} onDismiss={() => setErrorBanner(null)} />}

        {view === 'list' && (
          <SectionCard>
            {/* Filters & Bulk Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                <div className="relative w-full sm:flex-1 sm:max-w-xs">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    placeholder="Search title, SKU, category..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none"
                  />
                </div>
                <select value={catFilter} onChange={(e) => { setCatFilter(e.target.value); setPage(1); }} className="flex-1 sm:flex-none min-w-0 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white">
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="flex-1 sm:flex-none min-w-0 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white">
                  <option value="All">All Visibility</option>
                  <option value="MARKETPLACE">Published to Marketplace</option>
                  <option value="STOREFRONT_ONLY">Brand Storefront Only</option>
                  <option value="DRAFT">Draft / Hidden</option>
                  <option value="TRYON">Try-On Eligible</option>
                </select>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="w-full sm:w-auto px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white">
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
                      <button type="button" disabled={busyAction} onClick={() => runBulkAction('publish_mp')} className="px-2.5 py-1 rounded bg-white text-slate-950 font-bold disabled:opacity-60">
                        Publish to Marketplace
                      </button>
                      <button type="button" disabled={busyAction} onClick={() => runBulkAction('unpublish_mp')} className="px-2.5 py-1 rounded bg-slate-700 font-bold disabled:opacity-60">
                        Unpublish
                      </button>
                    </>
                  )}
                  <button type="button" disabled={busyAction} onClick={() => runBulkAction('enable_tryon')} className="px-2.5 py-1 rounded bg-amber-400 text-slate-950 font-bold disabled:opacity-60">
                    Enable Try-On
                  </button>
                  <button type="button" disabled={busyAction} onClick={() => runBulkAction('archive')} className="px-2.5 py-1 rounded bg-rose-600 font-bold disabled:opacity-60">
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
              <>
                {/* Mobile Card Stack */}
                <div className="sm:hidden space-y-2.5 text-xs">
                  {paged.map((p) => (
                    <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-3 space-y-2.5">
                      <div className="flex items-start gap-2.5">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(p.id)}
                          onChange={() => toggleSelect(p.id)}
                          className="mt-1 shrink-0"
                        />
                        <div className="relative w-12 h-14 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                          <SafeImage src={p.image} alt={p.name} fill className="object-cover" />
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <Link href={`/dashboard/products/${p.id}`} className="font-bold text-slate-900 hover:underline leading-snug line-clamp-2">
                              {p.name}
                            </Link>
                            <span className="font-extrabold text-slate-950 shrink-0 tabular-nums">৳{p.price}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                            <span className="font-mono">{p.sku}</span>
                            <span>•</span>
                            <span>{p.category}</span>
                            <span>•</span>
                            <span className={`font-bold ${p.stock < (p.lowStockThreshold || 5) ? 'text-amber-600' : 'text-slate-700'}`}>
                              {p.stock} left
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-1.5 pt-2 border-t border-slate-100">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => toggleVisibility(p, 'brandStorefrontPublished')}
                            className={`px-2 py-1 rounded-full text-[10px] font-bold border ${
                              p.brandStorefrontPublished
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}
                          >
                            Store: {p.brandStorefrontPublished ? 'On' : 'Off'}
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleVisibility(p, 'marketplacePublished')}
                            className={`px-2 py-1 rounded-full text-[10px] font-bold border ${
                              p.marketplacePublished
                                ? 'bg-slate-950 text-white border-slate-950'
                                : 'bg-white text-slate-600 border-slate-300'
                            }`}
                          >
                            Mkt: {p.marketplacePublished ? 'On' : 'Off'}
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleVisibility(p, 'isTryOnEligible')}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold border ${
                              p.isTryOnEligible
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}
                          >
                            <Sparkles className="w-2.5 h-2.5" />
                            AI
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5">
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
                      </div>
                    </div>
                  ))}
                </div>
                <div className="hidden sm:block overflow-x-auto">
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
                          <td className="py-3 px-3 font-bold text-slate-950">৳{p.price}</td>
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
              </>
            )}

            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs">
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
          <SectionCard title="Product Categories Breakdown" subtitle="Manage your brand taxonomy persisted with PostgreSQL & tenant catalog">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              {categories.filter((c) => c !== 'All').map((c) => {
                const count = products.filter((p) => p.category === c).length;
                const record = apiCategories.find((item) => item.name.toLowerCase() === c.toLowerCase());
                return (
                  <div key={c} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-bold text-slate-900">{c}</p>
                        {record && record.tenantId && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCategoryId(record.id);
                                setCatName(record.name);
                                setCatSeoTitle(record.seoTitle || '');
                              }}
                              className="p-1 text-slate-400 hover:text-slate-900"
                              aria-label={`Edit category ${c}`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(record.id)}
                              className="p-1 text-slate-400 hover:text-rose-600"
                              aria-label={`Delete category ${c}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="text-slate-500">{count} product(s)</p>
                      {record?.seoTitle && (
                        <p className="text-[11px] text-slate-400 mt-1 truncate">SEO: {record.seoTitle}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {canEdit && (
              <form onSubmit={handleSaveCategory} className="flex flex-col sm:flex-row flex-wrap gap-2 pt-4 mt-4 border-t border-slate-100 text-xs">
                <input
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="Category name (e.g. Evening Silk)"
                  className="w-full sm:flex-1 px-3 py-2 rounded-xl border border-slate-200"
                />
                <input
                  value={catSeoTitle}
                  onChange={(e) => setCatSeoTitle(e.target.value)}
                  placeholder="SEO Title (optional)"
                  className="w-full sm:flex-1 px-3 py-2 rounded-xl border border-slate-200"
                />
                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={busyAction || !catName.trim()}>
                    {editingCategoryId ? 'Update Category' : 'Add Category'}
                  </Button>
                  {editingCategoryId && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingCategoryId(null);
                        setCatName('');
                        setCatSeoTitle('');
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            )}
          </SectionCard>
        )}

        {view === 'collections' && (
          <SectionCard title="Brand Collections" subtitle="Group seasonal garments across storefront & marketplace">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              {collectionsList.map((col) => {
                const record = apiCollections.find((c) => c.title.toLowerCase() === col.toLowerCase());
                return (
                  <div key={col} className="p-5 rounded-2xl border border-slate-200 bg-white space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm text-slate-950 truncate">{col}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        {record && record.tenantId && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCollectionId(record.id);
                                setColTitle(record.title);
                                setColDesc(record.description || '');
                              }}
                              className="p-1 text-slate-400 hover:text-slate-900"
                              aria-label={`Edit collection ${col}`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCollection(record.id)}
                              className="p-1 text-slate-400 hover:text-rose-600"
                              aria-label={`Delete collection ${col}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        <Layers className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                    <p className="text-slate-500">
                      {products.filter((p) => (p.collections || []).includes(col)).length} assigned garment(s)
                    </p>
                    {record?.description && (
                      <p className="text-[11px] text-slate-400 line-clamp-2">{record.description}</p>
                    )}
                  </div>
                );
              })}
            </div>
            {canEdit && (
              <form onSubmit={handleSaveCollection} className="flex flex-col sm:flex-row flex-wrap gap-2 pt-4 mt-4 border-t border-slate-100 text-xs">
                <input
                  value={colTitle}
                  onChange={(e) => setColTitle(e.target.value)}
                  placeholder="Collection title (e.g. Atelier Autumn 2026)"
                  className="w-full sm:flex-1 px-3 py-2 rounded-xl border border-slate-200"
                />
                <input
                  value={colDesc}
                  onChange={(e) => setColDesc(e.target.value)}
                  placeholder="Short description (optional)"
                  className="w-full sm:flex-1 px-3 py-2 rounded-xl border border-slate-200"
                />
                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={busyAction || !colTitle.trim()}>
                    {editingCollectionId ? 'Update Collection' : 'Create Collection'}
                  </Button>
                  {editingCollectionId && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingCollectionId(null);
                        setColTitle('');
                        setColDesc('');
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            )}
          </SectionCard>
        )}

        {view === 'attributes' && (
          <SectionCard title="Fabrics & Material Specifications" subtitle="Reusable textile records attached to apparel garments">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {fabrics.map((f) => (
                <div key={f.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-slate-900">{f.name}</p>
                    {canEdit && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingFabricId(f.id);
                            setFabName(f.name);
                            setFabComp(f.composition);
                            setFabStretch(f.stretch || 'LOW');
                            setFabThickness(f.thickness || 'MEDIUM');
                            setFabCare(f.careInstructions || f.care || '');
                          }}
                          className="p-1 text-slate-400 hover:text-slate-900"
                          aria-label={`Edit fabric ${f.name}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteFabric(f.id)}
                          className="p-1 text-slate-400 hover:text-rose-600"
                          aria-label={`Delete fabric ${f.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-slate-600">{f.composition} • {f.thickness || 'MEDIUM'} • Stretch: {f.stretch || 'NONE'}</p>
                  <p className="text-[11px] text-slate-500">{f.careInstructions || f.care || 'Standard care'}</p>
                </div>
              ))}
            </div>
            {canEdit && (
              <form onSubmit={handleSaveFabric} className="flex flex-col sm:flex-row flex-wrap gap-2 pt-4 mt-4 border-t border-slate-100 text-xs">
                <input value={fabName} onChange={(e) => setFabName(e.target.value)} placeholder="Fabric name (e.g. Organic Poplin)" className="w-full sm:w-auto sm:flex-1 px-3 py-2 rounded-xl border border-slate-200" />
                <input value={fabComp} onChange={(e) => setFabComp(e.target.value)} placeholder="Composition (e.g. 100% Cotton)" className="w-full sm:w-auto sm:flex-1 px-3 py-2 rounded-xl border border-slate-200" />
                <select value={fabStretch} onChange={(e) => setFabStretch(e.target.value as Fabric['stretch'])} className="px-3 py-2 rounded-xl border border-slate-200 bg-white">
                  <option value="NONE">Stretch: None</option>
                  <option value="LOW">Stretch: Low</option>
                  <option value="MEDIUM">Stretch: Medium</option>
                  <option value="HIGH">Stretch: High</option>
                </select>
                <select value={fabThickness} onChange={(e) => setFabThickness(e.target.value as Fabric['thickness'])} className="px-3 py-2 rounded-xl border border-slate-200 bg-white">
                  <option value="LIGHT">Weight: Light</option>
                  <option value="MEDIUM">Weight: Medium</option>
                  <option value="HEAVY">Weight: Heavy</option>
                </select>
                <input value={fabCare} onChange={(e) => setFabCare(e.target.value)} placeholder="Care instructions" className="w-full sm:w-44 px-3 py-2 rounded-xl border border-slate-200" />
                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={busyAction || !fabName.trim()}>
                    {editingFabricId ? 'Update Fabric' : 'Add Fabric'}
                  </Button>
                  {editingFabricId && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingFabricId(null);
                        setFabName('');
                        setFabComp('');
                        setFabCare('');
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            )}
          </SectionCard>
        )}

        {view === 'import' && (
          <SectionCard title="Bulk CSV Product Import" subtitle="Preview parsed columns and duplicate SKU checks before persisting to tenant catalog">
            <div className="space-y-4 text-xs">
              <textarea rows={4} value={csvRaw} onChange={(e) => setCsvRaw(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 font-mono text-[11px]" />
              <div className="sm:hidden space-y-2 text-xs">
                {parsedCsvRows.map((r, idx) => (
                  <div key={idx} className="rounded-xl border border-slate-200 bg-white p-3 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-slate-900">{r.name}</p>
                      {r.duplicateSku ? (
                        <span className="text-rose-600 font-bold text-[11px] shrink-0">Duplicate SKU</span>
                      ) : (
                        <span className="text-emerald-600 font-bold text-[11px] shrink-0">Ready</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                      <span className="font-mono break-all">{r.sku} • {r.category}</span>
                      <span className="font-bold text-slate-900">৳{r.price} • Stock {r.stock}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="hidden sm:block overflow-x-auto border border-slate-200 rounded-xl">
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
                        <td className="p-2.5">৳{r.price}</td>
                        <td className="p-2.5">{r.stock}</td>
                        <td className="p-2.5">{r.duplicateSku ? <span className="text-rose-600 font-bold">Duplicate SKU</span> : <span className="text-emerald-600 font-bold">Ready</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm" disabled={busyAction} onClick={handleConfirmCsvImport} className="gap-1.5">
                  <Upload className="w-3.5 h-3.5" /> {busyAction ? 'Importing...' : 'Import Valid Rows'}
                </Button>
                {importLog && <span className="font-semibold text-emerald-700">{importLog}</span>}
              </div>
            </div>
          </SectionCard>
        )}

        {view === 'export' && (
          <SectionCard title="Export Catalog Dataset" subtitle="Download your tenant's live product catalog directly from the backend API">
            <Button size="sm" disabled={busyAction} onClick={handleExportCsv} className="gap-1.5">
              <Download className="w-4 h-4" /> {busyAction ? 'Exporting...' : `Download Full CSV (${products.length} SKUs)`}
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
          if (!confirmDeleteId) return;
          setErrorBanner(null);
          const targetId = confirmDeleteId;
          setConfirmDeleteId(null);
          try {
            await brandWorkspaceApi.deleteProduct(targetId);
            deleteProduct(targetId);
            notify('Product deleted.');
          } catch (err) {
            setErrorBanner(formatApiError(err, 'Failed to delete product from backend catalog.'));
          }
        }}
      />
    </PermissionGate>
  );
}
