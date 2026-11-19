'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, ImagePlus, Loader2, Plus, Sparkles, Trash2, Upload } from 'lucide-react';
import { Product, ProductVariant } from '../../types';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { useUiStore } from '../../stores/useUiStore';
import { brandWorkspaceApi, ServiceError } from '../../services';
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

  return (
    <PermissionGate module="products" action={existing ? 'edit' : 'create'}>
      <div className="space-y-6">
        <PageHeader
          eyebrow={`Tenant Owned by ${profile.name}`}
          title={existing ? `Edit Garment: ${existing.name}` : 'Create New Apparel Product'}
          subtitle="Products save to your brand catalog first. Visibility across Brand Storefront, Global Marketplace, and Try-On remains cleanly separated."
          actions={
            <>
              <Link href="/dashboard/products">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Products
                </Button>
              </Link>
              <Button variant="outline" size="sm" disabled={saving} onClick={() => saveProductRecord('draft')}>
                Save Draft
              </Button>
              <Button variant="outline" size="sm" disabled={saving} onClick={() => saveProductRecord('storefront')}>
                Save to Storefront
              </Button>
              <Button size="sm" disabled={saving} onClick={() => saveProductRecord('marketplace')} className="gap-1.5">
                <Check className="w-3.5 h-3.5" /> {saving ? 'Saving...' : 'Save & Publish Marketplace'}
              </Button>
            </>
          }
        />

        {quotaInfo && !existing && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
            <span>
              Catalog Plan Quota (<strong className="text-slate-900">{quotaInfo.plan}</strong>):{' '}
              <strong className="text-slate-900">{quotaInfo.used}</strong> / {quotaInfo.limit} SKUs used
            </span>
            <span className="font-semibold text-emerald-700">{quotaInfo.remaining} slots remaining</span>
          </div>
        )}

        {errorMessage && (
          <ErrorBanner message={errorMessage} onDismiss={() => setErrorMessage(null)} />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 8 Columns: Sections A-F */}
          <div className="lg:col-span-8 space-y-6">
            <SectionCard title="A. Basic Product Information">
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
                    <Link href="/dashboard/products/categories/addcategory" className="font-semibold text-slate-900 underline">
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
                    <Link href="/dashboard/products/collections" className="font-semibold text-slate-900 underline">
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

            <SectionCard
              title="B. Product Images"
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

            <SectionCard title="C. Pricing & Margin (Staff Only Cost)">
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

            <SectionCard title="D. Size & Color Variants Matrix" right={<Button type="button" size="sm" variant="outline" onClick={generateVariantsMatrix} className="gap-1"><Plus className="w-3.5 h-3.5" /> Generate Variants</Button>}>
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

            <SectionCard title="E & F. Specifications & Inventory">
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
          </div>

          {/* Right 4 Columns: Sections G & H (Try-On & Separate Visibility Controls) */}
          <div className="lg:col-span-4 space-y-6">
            <SectionCard title="G. Virtual Try-On Config" subtitle="Garment pipeline settings">
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

            <SectionCard title="H. Separate Visibility Channels" subtitle="Independent customer exposure rules">
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
          </div>
        </div>
      </div>
    </PermissionGate>
  );
}
