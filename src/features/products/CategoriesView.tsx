'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { canPerform } from '../../config/permissions';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { BrandCategoryRecord, brandWorkspaceApi } from '../../services';
import {
  ConfirmDialog,
  ErrorBanner,
  PageHeader,
  PermissionGate,
  SectionCard,
} from '../../components/shared/UiPrimitives';
import { ProductsNavTabs } from '../../components/shared/ProductsNavTabs';
import { Button } from '../../components/ui/button';
import { Drawer, Switch, formatApiError, slugify, useNotify } from './shared';

type TryOnType = 'tops' | 'bottoms' | 'dresses' | 'outerwear' | 'all' | 'none';

const TRY_ON_OPTIONS: Array<{ value: TryOnType; label: string }> = [
  { value: 'tops', label: 'Tops & Shirts' },
  { value: 'bottoms', label: 'Bottoms & Pants' },
  { value: 'dresses', label: 'Full Body & Dresses' },
  { value: 'outerwear', label: 'Outerwear & Coats' },
  { value: 'all', label: 'Universal / All types' },
  { value: 'none', label: 'No try-on (accessories, bags)' },
];

const STARTER_CATEGORIES: Array<{ name: string; tryOn: TryOnType }> = [
  { name: 'Dresses', tryOn: 'dresses' },
  { name: 'Tops & Shirts', tryOn: 'tops' },
  { name: 'T-Shirts & Polos', tryOn: 'tops' },
  { name: 'Pants & Trousers', tryOn: 'bottoms' },
  { name: 'Jeans & Denim', tryOn: 'bottoms' },
  { name: 'Outerwear & Jackets', tryOn: 'outerwear' },
  { name: 'Traditional Wear', tryOn: 'all' },
  { name: 'Accessories', tryOn: 'none' },
];

const tryOnLabel = (value?: string) => TRY_ON_OPTIONS.find((o) => o.value === value)?.label;

export function CategoriesView({ mode = 'list', editId }: { mode?: 'list' | 'new' | 'edit'; editId?: string }) {
  const router = useRouter();
  const notify = useNotify();
  const products = useWorkspaceStore((s) => s.products);
  const activeRole = useWorkspaceStore((s) => s.activeRole);
  const roleOverrides = useWorkspaceStore((s) => s.roleOverrides);
  const canEdit = canPerform(activeRole, 'products', 'edit', roleOverrides);
  const canCreate = canPerform(activeRole, 'products', 'create', roleOverrides);

  const [categories, setCategories] = useState<BrandCategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Drawer form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tryOn, setTryOn] = useState<TryOnType>('none');
  const [active, setActive] = useState(true);

  const loadCategories = useCallback(async () => {
    try {
      setCategories(await brandWorkspaceApi.getCategories());
    } catch (err) {
      setError(formatApiError(err, 'Could not load categories.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const editing = useMemo(
    () => (mode === 'edit' ? categories.find((c) => c.id === editId) : undefined),
    [mode, editId, categories]
  );

  // Fill the form whenever the drawer opens for a different record.
  useEffect(() => {
    if (mode === 'new') {
      setName('');
      setDescription('');
      setTryOn('none');
      setActive(true);
    } else if (editing) {
      setName(editing.name);
      setDescription(editing.description || '');
      setTryOn(editing.tryOnCategory || 'none');
      setActive(editing.active !== false);
    }
  }, [mode, editing]);

  const goList = () => router.push('/dashboard/categories');
  const drawerOpen = mode === 'new' || (mode === 'edit' && Boolean(editing));
  const editNotFound = mode === 'edit' && !loading && !editing;

  const productCount = (c: BrandCategoryRecord) =>
    c.productCount ?? products.filter((p) => p.category.toLowerCase() === c.name.toLowerCase()).length;

  const createCategory = async (input: { name: string; tryOn: TryOnType; description?: string; active?: boolean }) => {
    let slug = slugify(input.name);
    try {
      const check = await brandWorkspaceApi.checkCategorySlug(slug, input.name);
      if (!check.available && check.suggestedSlug) slug = check.suggestedSlug;
    } catch {
      // the server validates the slug again on save
    }
    return brandWorkspaceApi.addCategory({
      name: input.name,
      slug,
      description: input.description,
      tryOnCategory: input.tryOn,
      sortOrder: categories.length + 1,
      active: input.active ?? true,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (cleanName.length < 2) {
      setError('Category name must be at least 2 characters.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      if (mode === 'edit' && editing) {
        const updated = await brandWorkspaceApi.updateCategory(editing.id, {
          name: cleanName,
          description: description.trim(),
          tryOnCategory: tryOn,
          active,
        });
        setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        notify(`Category "${updated.name}" updated.`);
      } else {
        const created = await createCategory({ name: cleanName, tryOn, description: description.trim() || undefined, active });
        setCategories((prev) => [...prev.filter((c) => c.id !== created.id), created]);
        notify(`Category "${created.name}" added.`);
      }
      goList();
    } catch (err) {
      setError(formatApiError(err, 'Could not save the category.'));
    } finally {
      setBusy(false);
    }
  };

  const addStarter = async (starter: { name: string; tryOn: TryOnType }) => {
    setError(null);
    setBusy(true);
    try {
      const created = await createCategory({ name: starter.name, tryOn: starter.tryOn });
      setCategories((prev) => [...prev.filter((c) => c.id !== created.id), created]);
      notify(`Category "${created.name}" added.`);
    } catch (err) {
      setError(formatApiError(err, 'Could not add the category.'));
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
      await brandWorkspaceApi.deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      notify('Category removed.');
    } catch (err) {
      setError(formatApiError(err, 'Could not remove the category.'));
    }
  };

  const ownCategories = categories.filter((c) => c.tenantId);
  const existingNames = new Set(categories.map((c) => c.name.toLowerCase()));
  const suggestions = STARTER_CATEGORIES.filter((s) => !existingNames.has(s.name.toLowerCase()));

  return (
    <PermissionGate module="products" action="view">
      <div className="space-y-6">
        <PageHeader
          backHref={mode !== 'list' ? '/dashboard/categories' : undefined}
          backLabel="All categories"
          eyebrow="Product Management"
          title="Categories"
          subtitle="Organise your garments into categories shoppers can browse."
          actions={
            canCreate && (
              <Button size="sm" className="gap-1.5" onClick={() => router.push('/dashboard/categories/new')}>
                <Plus className="h-3.5 w-3.5" /> Add Category
              </Button>
            )
          }
        />

        <ProductsNavTabs />

        {error && !drawerOpen && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
        {editNotFound && (
          <ErrorBanner message="That category could not be found. It may have been deleted." onDismiss={goList} />
        )}

        <SectionCard>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading categories…
            </div>
          ) : (
            <div className="space-y-5">
              {ownCategories.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-10 text-center">
                  <p className="text-sm font-bold text-slate-950">No categories yet</p>
                  <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
                    Add your own, or tap a ready-made one below to get started in seconds.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {ownCategories.map((c) => (
                    <div key={c.id} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 to-slate-600 text-lg font-bold text-white">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate text-sm font-bold text-slate-950">{c.name}</p>
                          {canEdit && (
                            <div className="flex shrink-0 items-center">
                              <button
                                type="button"
                                aria-label={`Edit ${c.name}`}
                                onClick={() => router.push(`/dashboard/categories/${c.id}`)}
                                className="p-1 text-slate-400 hover:text-slate-900"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                aria-label={`Delete ${c.name}`}
                                onClick={() => setConfirmDeleteId(c.id)}
                                className="p-1 text-slate-400 hover:text-rose-600"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">{productCount(c)} product(s)</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {c.tryOnCategory && c.tryOnCategory !== 'none' && (
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                              Try-On: {tryOnLabel(c.tryOnCategory)}
                            </span>
                          )}
                          {c.active === false && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">
                              Hidden
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {canCreate && suggestions.length > 0 && (
                <div className="space-y-2 border-t border-slate-100 pt-4">
                  <p className="text-xs font-bold text-slate-700">Quick start: tap to add a ready-made category</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((s) => (
                      <button
                        key={s.name}
                        type="button"
                        disabled={busy}
                        onClick={() => void addStarter(s)}
                        className="inline-flex items-center rounded-full border border-dashed border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-900 hover:text-slate-950 disabled:opacity-60"
                      >
                        + {s.name}
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
        title={mode === 'edit' ? 'Edit category' : 'Add category'}
        subtitle="The web address is created automatically."
        onClose={goList}
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={goList}>
              Cancel
            </Button>
            <Button type="submit" form="category-form" size="sm" disabled={busy || name.trim().length < 2}>
              {busy ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Add category'}
            </Button>
          </div>
        }
      >
        <form id="category-form" onSubmit={handleSave} className="space-y-4 text-xs">
          {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
          <div>
            <label className="mb-1 block font-bold text-slate-700" htmlFor="cat-name">
              Category name *
            </label>
            <input
              id="cat-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Evening Dresses"
              className="w-full rounded-xl border border-slate-200 px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block font-bold text-slate-700" htmlFor="cat-desc">
              Description
            </label>
            <textarea
              id="cat-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional. Shown on your storefront category page."
              className="w-full rounded-xl border border-slate-200 px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block font-bold text-slate-700" htmlFor="cat-tryon">
              Virtual Try-On type
            </label>
            <select
              id="cat-tryon"
              value={tryOn}
              onChange={(e) => setTryOn(e.target.value as TryOnType)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
            >
              {TRY_ON_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-slate-500">Tells the AI how garments in this category are worn.</p>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5">
            <div>
              <p className="font-bold text-slate-900">Visible on storefront</p>
              <p className="text-[11px] text-slate-500">Turn off to hide this category from shoppers.</p>
            </div>
            <Switch label="Category visible" checked={active} onChange={() => setActive((v) => !v)} />
          </div>
        </form>
      </Drawer>

      <ConfirmDialog
        open={Boolean(confirmDeleteId)}
        title="Remove this category?"
        description="Products in this category keep their label, but the category will no longer appear in your list."
        confirmLabel="Remove"
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={handleDelete}
      />
    </PermissionGate>
  );
}
