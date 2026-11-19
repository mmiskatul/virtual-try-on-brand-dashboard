'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, ImagePlus, Loader2, Lock, Plus, Sparkles, Trash2, Upload } from 'lucide-react';
import { Product, ProductVariant } from '../../types';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { useUiStore } from '../../stores/useUiStore';
import { brandWorkspaceApi } from '../../services';
import { formatApiError } from './shared';
import {
  ErrorBanner,
  PageHeader,
  PermissionGate,
  SafeImage,
  SectionCard,
  StatusBadge,
} from '../../components/shared/UiPrimitives';
import { Button } from '../../components/ui/button';

const DEFAULT_CATEGORIES = [
  'Dresses',
  'Tops',
  'Shirts',
  'T-Shirts',
  'Hoodies',
  'Jackets',
  'Pants',
  'Jeans',
  'Traditional Wear',
  'Sarees',
  'Accessories',
];

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return 'Please upload a PNG, JPG or WEBP image.';
  if (file.size === 0) return 'This file is empty. Please choose a different image.';
  if (file.size > MAX_IMAGE_BYTES) {
    return `Image is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). The maximum size is 10MB.`;
  }
  return null;
}

/** Upload-only image card: no URL typing. The image URL is created automatically by the upload. */
function ImageUploadSlot({
  title,
  description,
  imageUrl,
  busy,
  onFile,
  onRemove,
}: {
  title: string;
  description: string;
  imageUrl: string;
  busy: boolean;
  onFile: (file: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div className="space-y-2">
      <div>
        <p className="text-xs font-bold text-slate-800">{title}</p>
        <p className="text-[11px] text-slate-500 leading-snug">{description}</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.currentTarget.value = '';
        }}
      />
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files?.[0];
          if (f && !busy) onFile(f);
        }}
        className={`group relative h-72 w-full overflow-hidden rounded-2xl border transition-colors ${
          dragging
            ? 'border-slate-900 bg-slate-50 ring-2 ring-slate-900/10'
            : imageUrl
              ? 'border-slate-200 bg-slate-100'
              : 'border-dashed border-slate-300 bg-slate-50/60 hover:border-slate-500'
        }`}
      >
        {imageUrl ? (
          <>
            <SafeImage src={imageUrl} alt={title} fill className="object-cover" />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-slate-950/50 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
              <button
                type="button"
                disabled={busy}
                onClick={() => inputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-slate-900 shadow hover:bg-slate-100 disabled:opacity-60"
              >
                <Upload className="h-3.5 w-3.5" /> Replace
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={onRemove}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-rose-600 shadow hover:bg-rose-50 disabled:opacity-60"
              >
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="flex h-full w-full flex-col items-center justify-center gap-2 px-4 text-center"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200">
              <ImagePlus className="h-5 w-5 text-slate-500" />
            </span>
            <span className="text-xs font-semibold text-slate-800">Click or drag &amp; drop to upload</span>
            <span className="text-[11px] text-slate-400">PNG, JPG or WEBP · up to 10MB</span>
          </button>
        )}
        {busy && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/85">
            <Loader2 className="h-6 w-6 animate-spin text-slate-900" />
            <span className="text-xs font-semibold text-slate-700">Uploading…</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function ProductEditorView({ existingProductId }: { existingProductId?: string }) {
  const router = useRouter();
  const profile = useWorkspaceStore((s) => s.profile);
  const products = useWorkspaceStore((s) => s.products);
  const addProduct = useWorkspaceStore((s) => s.addProduct);
  const updateProduct = useWorkspaceStore((s) => s.updateProduct);
  const showToast = useUiStore((s) => s.showToast);
  const hideToast = useUiStore((s) => s.hideToast);

  const existing = useMemo(
    () => (existingProductId ? products.find((p) => p.id === existingProductId) : undefined),
    [products, existingProductId]
  );

  const [name, setName] = useState(existing?.name || '');
  const [shortDescription, setShortDescription] = useState(existing?.shortDescription || '');
  const [description, setDescription] = useState(existing?.description || '');
  const [category, setCategory] = useState(existing?.category || '');
  const [subCategory, setSubCategory] = useState(existing?.subCategory || 'Womenswear');
  const [collection, setCollection] = useState(existing?.collections?.[0] || '');
  const [tagsText, setTagsText] = useState((existing?.tags || ['editorial']).join(', '));
  const [customCategories, setCustomCategories] = useState<string[]>([]);

  // Display photo shown to customers, and a separate clear garment photo used only by the AI try-on model.
  const [imageUrl, setImageUrl] = useState(existing?.image || '');
  const [aiReferenceUrl, setAiReferenceUrl] = useState(
    ((existing?.specs as Record<string, string> | undefined)?._aiReferenceImage as string) || ''
  );
  const [price, setPrice] = useState(String(existing?.price ?? 185));
  const [compareAtPrice, setCompareAtPrice] = useState(String(existing?.compareAtPrice ?? ''));
  const [costPrice, setCostPrice] = useState(String(existing?.costPrice ?? 72));
  const [sku, setSku] = useState(existing?.sku || `AUR-${Math.floor(100 + Math.random() * 899)}`);
  const [stock, setStock] = useState(String(existing?.stock ?? 30));
  const [lowStockThreshold, setLowStockThreshold] = useState(String(existing?.lowStockThreshold ?? 5));
  const [warehouseLocation, setWarehouseLocation] = useState(existing?.warehouseLocation || 'Dhaka Main Studio');

  // Specs
  const [material, setMaterial] = useState(existing?.specs?.material || '100% Organic Cotton');
  const [weightGsm, setWeightGsm] = useState(existing?.specs?.weightGsm || '190 gsm');
  const [stretch, setStretch] = useState(existing?.specs?.stretch || 'LOW');
  const [fitType, setFitType] = useState(existing?.specs?.fitType || 'Tailored');

  // Variants Matrix Generator
  const [variantSizes, setVariantSizes] = useState('S, M, L');
  const [variantColors, setVariantColors] = useState('Obsidian, Ivory');
  const [variants, setVariants] = useState<ProductVariant[]>(existing?.variants || []);

  // Separated visibility & AI try-on controls
  const [catalogStatus, setCatalogStatus] = useState<Product['catalogStatus']>(existing?.catalogStatus || 'ACTIVE');
  const [brandStorefrontPublished, setBrandStorefrontPublished] = useState(existing?.brandStorefrontPublished ?? true);
  const [marketplacePublished, setMarketplacePublished] = useState(existing?.marketplacePublished ?? false);
  const [isTryOnEligible, setIsTryOnEligible] = useState(existing?.isTryOnEligible ?? true);
  const [tryOnCategory, setTryOnCategory] = useState(existing?.tryOnCategory || 'dresses');
  const [includeInBrandTryOn, setIncludeInBrandTryOn] = useState(existing?.includeInBrandTryOn ?? true);
  const [includeInMarketplaceTryOn, setIncludeInMarketplaceTryOn] = useState(existing?.includeInMarketplaceTryOn ?? false);

  const [step, setStep] = useState(0);
  const [maxReached, setMaxReached] = useState(0);
  const [uploadingSlot, setUploadingSlot] = useState<'display' | 'ai' | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [skuStatus, setSkuStatus] = useState<{ checked: boolean; available: boolean; message: string } | null>(null);
  const [quotaInfo, setQuotaInfo] = useState<{ plan: string; used: number; limit: number; remaining: number } | null>(null);
  const [collectionOptions, setCollectionOptions] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    brandWorkspaceApi
      .getProductFormOptions()
      .then((opts) => {
        if (!active || !opts) return;
        if (Array.isArray(opts.categories) && opts.categories.length > 0) {
          setCustomCategories(opts.categories);
        }
        if (Array.isArray(opts.collections)) {
          setCollectionOptions(opts.collections);
        }
        if (opts.quota) {
          setQuotaInfo(opts.quota);
        }
      })
      .catch(() => {
        brandWorkspaceApi
          .getCategories()
          .then((cats) => {
            if (active && Array.isArray(cats)) {
              setCustomCategories(cats.map((c) => c.name).filter(Boolean));
            }
          })
          .catch(() => {});
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const cleanSku = sku.trim();
    if (!cleanSku) {
      setSkuStatus(null);
      return;
    }
    let active = true;
    const timer = setTimeout(() => {
      brandWorkspaceApi
        .checkProductSku(cleanSku, existing?.id)
        .then((res) => {
          if (active) {
            setSkuStatus({ checked: true, available: res.available, message: res.message });
          }
        })
        .catch(() => {});
    }, 350);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [existing?.id, sku]);

  // Use the brand's own categories. Only when none have been added yet, offer the standard list.
  const categoryOptions = useMemo(
    () =>
      Array.from(
        new Set(
          [...(customCategories.length > 0 ? customCategories : DEFAULT_CATEGORIES), existing?.category || '']
            .filter(Boolean)
        )
      ),
    [customCategories, existing?.category]
  );
  const collectionChoices = useMemo(
    () => Array.from(new Set([...collectionOptions, existing?.collections?.[0] || ''].filter(Boolean))),
    [collectionOptions, existing?.collections]
  );

  const numericPrice = Number(price) || 0;
  const numericCost = Number(costPrice) || 0;
  const profitMarginPct =
    numericPrice > 0 ? Math.round(((numericPrice - numericCost) / numericPrice) * 100) : 0;

  const notify = (msg: string) => {
    showToast(msg);
    setTimeout(hideToast, 3000);
  };

  const generateVariantsMatrix = () => {
    const sizes = variantSizes.split(',').map((s) => s.trim()).filter(Boolean);
    const colors = variantColors.split(',').map((c) => c.trim()).filter(Boolean);
    const next: ProductVariant[] = [];
    for (const c of colors) {
      for (const s of sizes) {
        const varSku = `${sku}-${c.slice(0, 3).toUpperCase()}-${s.toUpperCase()}`;
        next.push({
          id: `${varSku}_${Date.now()}`,
          sku: varSku,
          size: s,
          color: c,
          stockQuantity: Math.max(1, Math.floor((Number(stock) || 10) / Math.max(1, sizes.length * colors.length))),
          available: true,
        });
      }
    }
    setVariants(next);
    notify(`Generated ${next.length} SKU variant combinations.`);
  };

  const handleUploadImage = async (slot: 'display' | 'ai', file: File) => {
    const invalid = validateImageFile(file);
    if (invalid) {
      setErrorMessage(invalid);
      notify(invalid);
      return;
    }
    setUploadingSlot(slot);
    setErrorMessage(null);
    try {
      const res = await brandWorkspaceApi.uploadMediaFile(file);
      if (res.ok && res.url) {
        if (slot === 'display') setImageUrl(res.url);
        else setAiReferenceUrl(res.url);
        notify(slot === 'display' ? 'Product photo uploaded.' : 'AI reference image uploaded.');
      } else {
        setErrorMessage(res.error || 'Image upload failed. Please try again.');
      }
    } catch (err) {
      setErrorMessage(formatApiError(err, 'Image upload failed. Please try again.'));
    } finally {
      setUploadingSlot(null);
    }
  };

  const saveProductRecord = async (mode: 'draft' | 'storefront' | 'marketplace') => {
    setErrorMessage(null);
    if (!name.trim() || !sku.trim()) {
      setErrorMessage('Garment title and SKU are required.');
      return;
    }
    if (!category.trim()) {
      setErrorMessage('Please select a category.');
      return;
    }

    const finalStorefront = mode === 'draft' ? false : mode === 'storefront' || brandStorefrontPublished;
    const finalMarketplace = mode === 'marketplace' ? true : mode === 'draft' ? false : marketplacePublished;

    const apiPayload = {
      name: name.trim(),
      sku: sku.trim(),
      category: category.trim(),
      subCategory: subCategory.trim(),
      collection: collection.trim(),
      description: description.trim() || shortDescription.trim(),
      price: numericPrice,
      ...(compareAtPrice !== '' ? { compareAtPrice: Number(compareAtPrice) } : {}),
      stock: Math.max(0, Math.floor(Number(stock) || 0)),
      images: imageUrl ? [imageUrl] : [],
      tags: tagsText.split(',').map((t) => t.trim()).filter(Boolean),
      brandStorefrontPublished: finalStorefront,
      marketplacePublished: finalMarketplace,
      isTryOnEligible,
      tryOnCategory,
      // `_aiReferenceImage` is a reserved key: the clear garment photo given to the AI try-on model (hidden from shoppers).
      specs: { material, weightGsm, stretch, fitType, ...(aiReferenceUrl ? { _aiReferenceImage: aiReferenceUrl } : {}) },
      ...(variants.length > 0 ? { variants } : {}),
    };

    setSaving(true);
    try {
      if (existing) {
        const updated = await brandWorkspaceApi.updateProduct(existing.id, apiPayload);
        updateProduct(existing.id, {
          ...updated,
          shortDescription,
          costPrice: numericCost,
          lowStockThreshold: Number(lowStockThreshold) || 5,
          warehouseLocation,
          includeInBrandTryOn,
          includeInMarketplaceTryOn: finalMarketplace && includeInMarketplaceTryOn,
        });
        notify('Garment updated in tenant catalog.');
      } else {
        const created = await brandWorkspaceApi.addProduct(apiPayload);
        addProduct({
          ...created,
          shortDescription,
          costPrice: numericCost,
          lowStockThreshold: Number(lowStockThreshold) || 5,
          warehouseLocation,
          includeInBrandTryOn,
          includeInMarketplaceTryOn: finalMarketplace && includeInMarketplaceTryOn,
        });
        notify('Garment created inside your private tenant catalog.');
      }
      router.push('/dashboard/products');
    } catch (err) {
      setErrorMessage(formatApiError(err, 'Failed to save product to backend catalog.'));
    } finally {
      setSaving(false);
    }
  };

  const STEPS = [
    { key: 'basics', label: 'Basics', hint: 'Title & category' },
    { key: 'images', label: 'Images', hint: 'Photos' },
    { key: 'pricing', label: 'Price & stock', hint: 'Price & SKU' },
    { key: 'variants', label: 'Sizes & colours', hint: 'Optional' },
    { key: 'publish', label: 'Try-On & publish', hint: 'Go live' },
  ] as const;
  const lastStep = STEPS.length - 1;

  // A step is complete once its required fields are filled in. "Sizes & colours" is optional.
  const skuTaken = skuStatus?.checked === true && skuStatus.available === false;
  const stepDone = [
    name.trim().length > 0 && category.trim().length > 0,
    Boolean(imageUrl),
    numericPrice > 0 && sku.trim().length > 0 && !skuTaken,
    true,
    false,
  ];
  // Each step unlocks only after every earlier step is complete.
  const isUnlocked = (i: number) => stepDone.slice(0, i).every(Boolean);
  const stepMissing = [
    [
      ...(name.trim() ? [] : ['a product title']),
      ...(category.trim() ? [] : ['a category']),
    ],
    imageUrl ? [] : ['a store photo'],
    [
      ...(numericPrice > 0 ? [] : ['a selling price']),
      ...(sku.trim() ? [] : ['a SKU']),
      ...(skuTaken ? ['a SKU that is not already used'] : []),
    ],
    [],
    [],
  ];
  const canContinue = stepDone[step];
  const allRequiredDone = stepDone.slice(0, 3).every(Boolean);
  const continueHint = canContinue ? '' : `Add ${stepMissing[step].join(' and ')} to continue.`;

  const checklist = [
    { label: 'Product title', done: name.trim().length > 0, required: true, step: 0 },
    { label: 'Category', done: category.trim().length > 0, required: true, step: 0 },
    { label: 'Store photo', done: Boolean(imageUrl), required: true, step: 1 },
    { label: 'AI reference image', done: Boolean(aiReferenceUrl), required: false, step: 1 },
    { label: 'Selling price', done: numericPrice > 0, required: true, step: 2 },
    { label: 'SKU', done: sku.trim().length > 0 && !skuTaken, required: true, step: 2 },
  ];
  const requiredLeft = checklist.filter((c) => c.required && !c.done).length;

  const goToStep = (i: number) => {
    if (i >= 0 && i <= lastStep && isUnlocked(i)) setStep(i);
  };

  // Remember the furthest step reached, and never stay on a step that has become locked
  // (for example after clearing the title on an earlier step).
  useEffect(() => {
    setMaxReached((m) => Math.max(m, step));
    if (!isUnlocked(step)) {
      const firstIncomplete = stepDone.findIndex((d, i) => i < lastStep && !d);
      setStep(firstIncomplete === -1 ? 0 : firstIncomplete);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, name, category, imageUrl, price, sku, skuStatus]);

  // Publishing follows the switches in the last step: marketplace if enabled, otherwise the storefront.
  const publishMode: 'storefront' | 'marketplace' = marketplacePublished ? 'marketplace' : 'storefront';

  return (
    <PermissionGate module="products" action={existing ? 'edit' : 'create'}>
      <div className="space-y-6 pb-24">
        <PageHeader
          eyebrow={`Tenant Owned by ${profile.name}`}
          title={existing ? `Edit: ${existing.name}` : 'Add a product'}
          subtitle="Work through the steps. You can save a draft at any time."
          actions={
            <Link href="/dashboard/products">
              <Button variant="outline" size="sm" className="gap-1.5">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Products
              </Button>
            </Link>
          }
        />

        {/* Milestone tracker: each step unlocks after the one before it is complete */}
        <nav aria-label="Product steps" className="rounded-2xl border border-slate-200 bg-white px-4 py-5 sm:px-6">
          <ol className="flex items-start">
            {STEPS.map((st, i) => {
              const unlocked = isUnlocked(i);
              const current = i === step;
              const passed = i !== step && i < maxReached && stepDone[i];
              const lineFilled = i + 1 <= maxReached && stepDone[i];
              return (
                <li key={st.key} className="relative flex flex-1 flex-col items-center">
                  {i < lastStep && (
                    <span
                      aria-hidden="true"
                      className={`absolute left-1/2 top-4 h-0.5 w-full ${lineFilled ? 'bg-emerald-500' : 'bg-slate-200'}`}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => goToStep(i)}
                    disabled={!unlocked}
                    aria-current={current ? 'step' : undefined}
                    aria-label={`${st.label}${unlocked ? '' : ' (locked)'}`}
                    title={unlocked ? st.label : `Complete "${STEPS[i - 1]?.label}" first`}
                    className="relative z-10 flex flex-col items-center gap-2 disabled:cursor-not-allowed"
                  >
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors ${
                        passed
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : current
                            ? 'border-slate-950 bg-slate-950 text-white ring-4 ring-slate-950/10'
                            : unlocked
                              ? 'border-slate-300 bg-white text-slate-700 hover:border-slate-500'
                              : 'border-slate-200 bg-slate-50 text-slate-300'
                      }`}
                    >
                      {passed ? <Check className="h-4 w-4" /> : unlocked ? i + 1 : <Lock className="h-3.5 w-3.5" />}
                    </span>
                    <span className="text-center">
                      <span
                        className={`block text-[11px] font-bold leading-tight sm:text-xs ${
                          current ? 'text-slate-950' : unlocked ? 'text-slate-700' : 'text-slate-400'
                        }`}
                      >
                        {st.label}
                      </span>
                      <span className="hidden text-[10px] text-slate-400 sm:block">{st.hint}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        {quotaInfo && !existing && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
            <span>
              Catalog Plan Quota (<strong className="text-slate-900">{quotaInfo.plan}</strong>):{' '}
              <strong className="text-slate-900">{quotaInfo.used}</strong> / {quotaInfo.limit} SKUs used
            </span>
            <span className="font-semibold text-emerald-700">{quotaInfo.remaining} slots remaining</span>
          </div>
        )}

        {errorMessage && <ErrorBanner message={errorMessage} onDismiss={() => setErrorMessage(null)} />}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-6">
            {step === 0 && (
              <>
            <SectionCard title="Basic information">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Garment Title *</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Elysian Mulberry Silk Dress" className="w-full px-3 py-2 rounded-xl border border-slate-200" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Owning Brand Tenant (Locked)</label>
                  <input value={profile.name} readOnly className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-600 font-bold" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category *</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white">
                    <option value="">Select a category</option>
                    {categoryOptions.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {customCategories.length > 0 ? 'Your categories. ' : 'No categories added yet, showing standard ones. '}
                    <Link href="/dashboard/products/categories/new" className="font-semibold text-slate-900 underline">
                      + Add category
                    </Link>
                  </p>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Collection</label>
                  <select value={collection} onChange={(e) => setCollection(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white">
                    <option value="">No collection</option>
                    {collectionChoices.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-[11px] text-slate-500">
                    <Link href="/dashboard/products/collections/new" className="font-semibold text-slate-900 underline">
                      + Add collection
                    </Link>
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Short Summary</label>
                  <input value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} placeholder="Brief editorial hook for catalog cards" className="w-full px-3 py-2 rounded-xl border border-slate-200" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Description</label>
                  <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Tags (comma separated)</label>
                  <input value={tagsText} onChange={(e) => setTagsText(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200" />
                </div>
              </div>
            </SectionCard>

              </>
            )}
            {step === 1 && (
              <>
            <SectionCard
              title="Images"
              subtitle="Upload only. The image links are created automatically."
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <ImageUploadSlot
                  title="Store Photo (shown to customers)"
                  description="Your styled or model photo for the storefront and marketplace."
                  imageUrl={imageUrl}
                  busy={uploadingSlot === 'display'}
                  onFile={(f) => void handleUploadImage('display', f)}
                  onRemove={() => setImageUrl('')}
                />
                <ImageUploadSlot
                  title="AI Reference Image (not shown to customers)"
                  description="A clear, flat photo of the garment (front view, plain background, nothing covering it). The Virtual Try-On AI uses this so it understands the real product."
                  imageUrl={aiReferenceUrl}
                  busy={uploadingSlot === 'ai'}
                  onFile={(f) => void handleUploadImage('ai', f)}
                  onRemove={() => setAiReferenceUrl('')}
                />
              </div>
            </SectionCard>

              </>
            )}
            {step === 2 && (
              <>
            <SectionCard title="Pricing" subtitle="The private cost is only visible to your team.">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Selling Price (৳) *</label>
                  <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Compare-At (৳)</label>
                  <input type="number" value={compareAtPrice} onChange={(e) => setCompareAtPrice(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Private Cost (৳)</label>
                  <input type="number" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200" />
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] font-bold uppercase text-emerald-700">Est. Margin</span>
                  <p className="text-lg font-extrabold text-emerald-800">{profitMarginPct}%</p>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Stock & details">
              <div className="grid grid-cols-1 min-[400px]:grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block font-bold mb-1">Master SKU *</label>
                  <input value={sku} onChange={(e) => setSku(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono" />
                  {skuStatus?.checked && (
                    <p className={`mt-1 text-[10px] font-semibold ${skuStatus.available ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {skuStatus.message}
                    </p>
                  )}
                </div>
                <div><label className="block font-bold mb-1">Total Stock</label><input type="number" value={stock} onChange={(e) => setStock(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200" /></div>
                <div><label className="block font-bold mb-1">Low-Stock Alert</label><input type="number" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200" /></div>
                <div><label className="block font-bold mb-1">Warehouse</label><input value={warehouseLocation} onChange={(e) => setWarehouseLocation(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200" /></div>
                <div className="min-[400px]:col-span-2"><label className="block font-bold mb-1">Material Composition</label><input value={material} onChange={(e) => setMaterial(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200" /></div>
                <div><label className="block font-bold mb-1">Weight</label><input value={weightGsm} onChange={(e) => setWeightGsm(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200" /></div>
                <div><label className="block font-bold mb-1">Fit Type</label><input value={fitType} onChange={(e) => setFitType(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200" /></div>
                <div><label className="block font-bold mb-1">Sub-Category</label><input value={subCategory} onChange={(e) => setSubCategory(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200" /></div>
                <div><label className="block font-bold mb-1">Stretch</label><input value={stretch} onChange={(e) => setStretch(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200" /></div>
              </div>
            </SectionCard>
              </>
            )}
            {step === 3 && (
              <>
            <SectionCard title="Sizes & colours (optional)" right={<Button type="button" size="sm" variant="outline" onClick={generateVariantsMatrix} className="gap-1"><Plus className="w-3.5 h-3.5" /> Generate Variants</Button>}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <input value={variantSizes} onChange={(e) => setVariantSizes(e.target.value)} placeholder="Sizes (XS, S, M, L, XL)" className="px-3 py-2 rounded-xl border border-slate-200" />
                <input value={variantColors} onChange={(e) => setVariantColors(e.target.value)} placeholder="Colors (Obsidian, Ivory)" className="px-3 py-2 rounded-xl border border-slate-200" />
              </div>
              {variants.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-xs">
                  {variants.map((v) => (
                    <div key={v.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold">{v.size} / {v.color}</span>
                      <span className="font-mono text-slate-500">{v.sku} ({v.stockQuantity}u)</span>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

              </>
            )}
            {step === 4 && (
              <>
            <SectionCard title="Virtual Try-On" subtitle="Let shoppers see this garment on themselves">
              <div className="space-y-3 text-xs">
                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer font-bold">
                  <span className="flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-amber-600" /> Enable Virtual Try-On</span>
                  <input type="checkbox" checked={isTryOnEligible} onChange={(e) => setIsTryOnEligible(e.target.checked)} className="rounded accent-slate-950" />
                </label>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Garment AI Category</label>
                  <select value={tryOnCategory} onChange={(e) => setTryOnCategory(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white">
                    <option value="tops">Tops / Shirts / Hoodies</option>
                    <option value="bottoms">Bottoms / Pants / Jeans</option>
                    <option value="dresses">Dresses / Sarees / Full</option>
                    <option value="outerwear">Outerwear / Jackets</option>
                  </select>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={includeInBrandTryOn} onChange={(e) => setIncludeInBrandTryOn(e.target.checked)} className="rounded accent-slate-950" />
                  <span>Include in Brand Try-On Page (<code>/try/{profile.slug}</code>)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={includeInMarketplaceTryOn} onChange={(e) => setIncludeInMarketplaceTryOn(e.target.checked)} className="rounded accent-slate-950" />
                  <span>Include in Marketplace Try-On when published</span>
                </label>
              </div>
            </SectionCard>

            <SectionCard title="Where to show this product" subtitle="Choose who can see it">
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">1. Catalog Status</label>
                  <select value={catalogStatus} onChange={(e) => setCatalogStatus(e.target.value as any)} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white">
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>

                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 cursor-pointer">
                  <div>
                    <p className="font-bold text-slate-900">2. Brand Storefront Visible</p>
                    <p className="text-[11px] text-slate-500">Show on /brands/{profile.slug}</p>
                  </div>
                  <input type="checkbox" checked={brandStorefrontPublished} onChange={(e) => setBrandStorefrontPublished(e.target.checked)} className="rounded accent-slate-950" />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 cursor-pointer">
                  <div>
                    <p className="font-bold text-slate-900">3. Global Marketplace Post</p>
                    <p className="text-[11px] text-slate-500">Explicitly publish globally</p>
                  </div>
                  <input type="checkbox" checked={marketplacePublished} onChange={(e) => setMarketplacePublished(e.target.checked)} className="rounded accent-slate-950" />
                </label>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="font-semibold text-slate-600">Preview State:</span>
                  <StatusBadge status={marketplacePublished ? 'PUBLISHED' : brandStorefrontPublished ? 'STOREFRONT_ONLY' : 'DRAFT'} />
                </div>
              </div>
            </SectionCard>
              </>
            )}
          </div>

          {/* Checklist */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24">
            <SectionCard title="Checklist" subtitle={requiredLeft === 0 ? 'Everything required is filled in.' : `${requiredLeft} required item(s) left`}>
              <ul className="space-y-2 text-xs">
                {checklist.map((c) => (
                  <li key={c.label}>
                    <button
                      type="button"
                      onClick={() => goToStep(c.step)}
                      disabled={!isUnlocked(c.step)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left hover:bg-slate-50"
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                          c.done ? 'bg-emerald-500 text-white' : 'border border-slate-300 text-transparent'
                        }`}
                      >
                        <Check className="h-3 w-3" />
                      </span>
                      <span className={`flex-1 font-semibold ${c.done ? 'text-slate-500' : 'text-slate-900'}`}>{c.label}</span>
                      {!c.required && !c.done && <span className="text-[10px] font-bold text-slate-400">Recommended</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </SectionCard>
          </aside>
        </div>

        {/* Sticky action bar */}
        <div className="sticky bottom-0 z-30 -mx-1 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Button variant="outline" size="sm" disabled={step === 0} onClick={() => goToStep(step - 1)}>
              Back
            </Button>
            {step < lastStep && (
              <Button size="sm" disabled={!canContinue} onClick={() => goToStep(step + 1)}>
                Next
              </Button>
            )}
            {continueHint && <span className="hidden truncate text-xs font-medium text-amber-700 sm:block">{continueHint}</span>}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={saving} onClick={() => saveProductRecord('draft')}>
              Save Draft
            </Button>
            <Button
              size="sm"
              disabled={saving || !allRequiredDone}
              title={allRequiredDone ? undefined : 'Finish Basics, Images and Price & stock to publish'}
              onClick={() => saveProductRecord(publishMode)}
              className="gap-1.5"
            >
              <Check className="w-3.5 h-3.5" /> {saving ? 'Saving...' : marketplacePublished ? 'Save & Publish to Marketplace' : 'Save & Publish'}
            </Button>
          </div>
        </div>
      </div>
    </PermissionGate>
  );
}
