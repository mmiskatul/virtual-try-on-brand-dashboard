'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layers, Loader2, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { canPerform } from '../../config/permissions';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { BrandCollectionRecord, brandWorkspaceApi } from '../../services';
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
import { Drawer, formatApiError, useNotify } from './shared';

const STARTER_COLLECTIONS: Array<{ title: string; description: string }> = [
  { title: 'New Arrivals', description: 'The latest pieces added to the shop.' },
  { title: 'Best Sellers', description: 'Customer favourites that sell fastest.' },
  { title: 'Summer Collection', description: 'Light, breathable styles for warm days.' },
  { title: 'Winter Collection', description: 'Layers and warm fabrics for the cold season.' },
  { title: 'Eid Collection', description: 'Festive and occasion wear.' },
  { title: 'Party Wear', description: 'Standout outfits for evenings and events.' },
  { title: 'Casual Everyday', description: 'Easy, comfortable styles for daily wear.' },
  { title: 'Sale', description: 'Discounted pieces for a limited time.' },
];

export function CollectionsView({ mode = 'list', editId }: { mode?: 'list' | 'new' | 'edit'; editId?: string }) {
  const router = useRouter();
  const notify = useNotify();
  const products = useWorkspaceStore((s) => s.products);
  const updateProductInStore = useWorkspaceStore((s) => s.updateProduct);
  const activeRole = useWorkspaceStore((s) => s.activeRole);
  const roleOverrides = useWorkspaceStore((s) => s.roleOverrides);
  const canEdit = canPerform(activeRole, 'products', 'edit', roleOverrides);

  const [collections, setCollections] = useState<BrandCollectionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Drawer form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState('');

  const loadCollections = useCallback(async () => {
    try {
      setCollections(await brandWorkspaceApi.getCollections());
    } catch (err) {
      setError(formatApiError(err, 'Could not load collections.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCollections();
  }, [loadCollections]);

  const editing = useMemo(
    () => (mode === 'edit' ? collections.find((c) => c.id === editId) : undefined),
    [mode, editId, collections]
  );

  const membersOf = useCallback(
    (collectionTitle: string) =>
      products.filter((p) => (p.collections || []).some((c) => c.toLowerCase() === collectionTitle.toLowerCase())),
    [products]
  );

  useEffect(() => {
    if (mode === 'new') {
      setTitle('');
      setDescription('');
      setSelectedProductIds([]);
      setProductSearch('');
    } else if (editing) {
      setTitle(editing.title);
      setDescription(editing.description || '');
      setSelectedProductIds(membersOf(editing.title).map((p) => p.id));
      setProductSearch('');
    }
    // membersOf is intentionally left out: the selection is only reset when the drawer target changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, editing?.id]);

  const goList = () => router.push('/dashboard/products/collections');
  const drawerOpen = mode === 'new' || (mode === 'edit' && Boolean(editing));
  const editNotFound = mode === 'edit' && !loading && !editing;

  const visibleProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    return products.filter((p) => !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  }, [products, productSearch]);

  const toggleProduct = (id: string) =>
    setSelectedProductIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  /** Products store their collection name, so assigning means updating each product. */
  const syncMembers = async (collectionTitle: string, previousTitle?: string) => {
    const wanted = new Set(selectedProductIds);
    const previous = new Set(membersOf(previousTitle || collectionTitle).map((p) => p.id));
    const failed: string[] = [];

    const jobs: Array<Promise<void>> = [];
    for (const p of products) {
      const inCollection = wanted.has(p.id);
      const wasIn = previous.has(p.id);
      const currentName = (p.collections || [])[0] || '';
      let next: string | null = null;
      if (inCollection && currentName !== collectionTitle) next = collectionTitle;
      else if (!inCollection && wasIn) next = '';
      if (next === null) continue;
      const nextValue = next;
      jobs.push(
        brandWorkspaceApi
          .updateProduct(p.id, { collection: nextValue })
          .then((updated) => updateProductInStore(p.id, updated))
          .catch(() => {
            failed.push(p.name);
          })
      );
    }
    await Promise.all(jobs);
    return failed;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (cleanTitle.length < 2) {
      setError('Collection name must be at least 2 characters.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      let savedTitle = cleanTitle;
      if (mode === 'edit' && editing) {
        const updated = await brandWorkspaceApi.updateCollection(editing.id, {
          title: cleanTitle,
          description: description.trim() || undefined,
        });
        setCollections((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        savedTitle = updated.title;
      } else {
        const created = await brandWorkspaceApi.createCollection({
          title: cleanTitle,
          description: description.trim() || undefined,
        });
        setCollections((prev) => [created, ...prev.filter((c) => c.id !== created.id)]);
        savedTitle = created.title;
      }
      const failed = await syncMembers(savedTitle, editing?.title);
      if (failed.length > 0) {
        setError(`Saved, but these products could not be updated: ${failed.join(', ')}.`);
        notify(`Collection "${savedTitle}" saved.`);
        return;
      }
      notify(`Collection "${savedTitle}" saved.`);
      goList();
    } catch (err) {
      setError(formatApiError(err, 'Could not save the collection.'));
    } finally {
      setBusy(false);
    }
  };

  const addStarter = async (starter: { title: string; description: string }) => {
    setError(null);
    setBusy(true);
    try {
      const created = await brandWorkspaceApi.createCollection(starter);
      setCollections((prev) => [created, ...prev.filter((c) => c.id !== created.id)]);
      notify(`Collection "${created.title}" added.`);
    } catch (err) {
      setError(formatApiError(err, 'Could not add the collection.'));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    setConfirmDeleteId(null);
    setError(null);
    try {
      await brandWorkspaceApi.deleteCollection(id);
      setCollections((prev) => prev.filter((c) => c.id !== id));
      notify('Collection deleted.');
    } catch (err) {
      setError(formatApiError(err, 'Could not delete the collection.'));
    }
  };

  const ownCollections = collections.filter((c) => c.tenantId);
  const existingTitles = new Set(collections.map((c) => c.title.toLowerCase()));
  const suggestions = STARTER_COLLECTIONS.filter((s) => !existingTitles.has(s.title.toLowerCase()));

  return (
    <PermissionGate module="products" action="view">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Product Management"
          title="Collections"
          subtitle="Group garments into seasonal or themed collections."
          actions={
            canEdit && (
              <Button size="sm" className="gap-1.5" onClick={() => router.push('/dashboard/products/collections/new')}>
                <Plus className="h-3.5 w-3.5" /> Add Collection
              </Button>
            )
          }
        />

        <ProductsNavTabs />

        {error && !drawerOpen && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
        {editNotFound && (
          <ErrorBanner message="That collection could not be found. It may have been deleted." onDismiss={goList} />
        )}

        <SectionCard>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading collections…
            </div>
          ) : (
            <div className="space-y-5">
              {ownCollections.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-10 text-center">
                  <p className="text-sm font-bold text-slate-950">No collections yet</p>
                  <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
                    Collections help shoppers find seasonal or themed pieces. Add your own, or tap a ready-made one below.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {ownCollections.map((c) => {
                    const members = membersOf(c.title);
                    return (
                      <div key={c.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                        <div className="flex h-20 items-center gap-1 bg-slate-100 px-3">
                          {members.slice(0, 4).map((p) => (
                            <div key={p.id} className="relative h-14 w-11 overflow-hidden rounded-md border border-white bg-slate-200">
                              <SafeImage src={p.image} alt={p.name} fill className="object-cover" />
                            </div>
                          ))}
                          {members.length === 0 && <Layers className="mx-auto h-6 w-6 text-slate-400" />}
                        </div>
                        <div className="space-y-1 p-4">
                          <div className="flex items-start justify-between gap-2">
                            <p className="truncate text-sm font-bold text-slate-950">{c.title}</p>
                            {canEdit && (
                              <div className="flex shrink-0 items-center">
                                <button
                                  type="button"
                                  aria-label={`Edit ${c.title}`}
                                  onClick={() => router.push(`/dashboard/products/collections/${c.id}`)}
                                  className="p-1 text-slate-400 hover:text-slate-900"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  aria-label={`Delete ${c.title}`}
                                  onClick={() => setConfirmDeleteId(c.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">{members.length} product(s)</p>
                          {c.description && <p className="line-clamp-2 text-[11px] text-slate-400">{c.description}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {canEdit && suggestions.length > 0 && (
                <div className="space-y-2 border-t border-slate-100 pt-4">
                  <p className="text-xs font-bold text-slate-700">Quick start: tap to add a ready-made collection</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((s) => (
                      <button
                        key={s.title}
                        type="button"
                        disabled={busy}
                        title={s.description}
                        onClick={() => void addStarter(s)}
                        className="inline-flex items-center rounded-full border border-dashed border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-900 hover:text-slate-950 disabled:opacity-60"
                      >
                        + {s.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </SectionCard>
      </div>

      <Drawer
        open={drawerOpen}
        title={mode === 'edit' ? 'Edit collection' : 'Add collection'}
        subtitle="Name it, then pick the products that belong in it."
        onClose={goList}
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={goList}>
              Cancel
            </Button>
            <Button type="submit" form="collection-form" size="sm" disabled={busy || title.trim().length < 2}>
              {busy ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Add collection'}
            </Button>
          </div>
        }
      >
        <form id="collection-form" onSubmit={handleSave} className="space-y-4 text-xs">
          {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
          <div>
            <label className="mb-1 block font-bold text-slate-700" htmlFor="col-title">
              Collection name *
            </label>
            <input
              id="col-title"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Eid Collection 2026"
              className="w-full rounded-xl border border-slate-200 px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block font-bold text-slate-700" htmlFor="col-desc">
              Description
            </label>
            <textarea
              id="col-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional short description"
              className="w-full rounded-xl border border-slate-200 px-3 py-2"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-bold text-slate-700">Products in this collection</p>
              <span className="text-[11px] text-slate-500">{selectedProductIds.length} selected</span>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search products"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3"
              />
            </div>
            {products.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300 px-3 py-4 text-center text-slate-500">
                You have no products yet. Add products first, then group them here.
              </p>
            ) : (
              <ul className="max-h-72 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200">
                {visibleProducts.map((p) => {
                  const otherCollection = (p.collections || [])[0];
                  const inOther = otherCollection && otherCollection.toLowerCase() !== title.trim().toLowerCase();
                  return (
                    <li key={p.id}>
                      <label className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={selectedProductIds.includes(p.id)}
                          onChange={() => toggleProduct(p.id)}
                        />
                        <div className="relative h-10 w-8 shrink-0 overflow-hidden rounded bg-slate-100">
                          <SafeImage src={p.image} alt={p.name} fill className="object-cover" />
                        </div>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold text-slate-900">{p.name}</span>
                          {inOther && (
                            <span className="block truncate text-[10px] text-amber-600">
                              Currently in &quot;{otherCollection}&quot;. Picking it moves it here.
                            </span>
                          )}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </form>
      </Drawer>

      <ConfirmDialog
        open={Boolean(confirmDeleteId)}
        title="Delete this collection?"
        description="The products stay in your catalog. They just won't be grouped under this collection any more."
        confirmLabel="Delete"
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={handleDelete}
      />
    </PermissionGate>
  );
}
