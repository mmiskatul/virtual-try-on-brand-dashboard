'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, ImagePlus, Loader2, Lock, Sparkles, Trash2, Upload } from 'lucide-react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
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
import {
  CATALOG_STATUSES,
  PRODUCT_LIMITS,
  PRODUCT_STEP_FIELDS,
  ProductFieldName,
  ProductFormValues,
  ProductPayload,
  TRY_ON_CATEGORIES,
  collectFieldErrors,
  productFormSchema,
} from '../../lib/productContract';
import { formatApiError, slugify, useNotify } from './shared';
import {
  DRAFT_VERSION,
  deleteDraft,
  deleteStagedImage,
  getStagedFile,
  isLocalRef,
  loadDraft,
  newDraftId,
  pruneOldDrafts,
  resolveImageSrc,
  restorePreviews,
  saveDraft,
  stageImage,
} from '../../lib/draftStore';
import { collectLocalRefs, replaceRefs, stripRefs, uploadStagedPhotos } from './draftRefs';
import { PhotoKind, VariantPlanner } from './VariantPlanner';
import { VariantPlan, planProblem, planToVariants, variantsToPlan } from './variantPlan';

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

const DEFAULT_COLLECTIONS = [
  'New Arrivals',
  'Best Sellers',
  'Summer Collection',
  'Winter Collection',
  'Eid Collection',
  'Party Wear',
  'Casual Everyday',
  'Sale',
];

const CATEGORY_TRY_ON = ['tops', 'bottoms', 'dresses', 'outerwear', 'all', 'none'] as const;

// Make sure the category and collection a product uses also exist in the brand's own lists,
// so a default one picked on a product shows up under Categories / Collections afterwards.
async function ensureCatalogEntries(category: string, collection: string, tryOnCategory?: string) {
  const cleanCategory = category.trim();
  const cleanCollection = collection.trim();
  if (cleanCategory) {
    try {
      const cats = await brandWorkspaceApi.getCategories();
      const has = cats.some((c) => c.tenantId && c.name.trim().toLowerCase() === cleanCategory.toLowerCase());
      if (!has) {
        let slug = slugify(cleanCategory);
        try {
          const check = await brandWorkspaceApi.checkCategorySlug(slug, cleanCategory);
          if (!check.available && check.suggestedSlug) slug = check.suggestedSlug;
        } catch {
          // the server validates the slug again on save
        }
        const tryOn = (CATEGORY_TRY_ON as readonly string[]).includes(tryOnCategory || '')
          ? (tryOnCategory as (typeof CATEGORY_TRY_ON)[number])
          : 'none';
        await brandWorkspaceApi.addCategory({
          name: cleanCategory,
          slug,
          tryOnCategory: tryOn,
          sortOrder: cats.filter((c) => c.tenantId).length + 1,
          active: true,
        });
      }
    } catch {
      // best effort: the product itself is already saved
    }
  }
  if (cleanCollection) {
    try {
      const cols = await brandWorkspaceApi.getCollections();
      const has = cols.some((c) => c.tenantId && c.title.trim().toLowerCase() === cleanCollection.toLowerCase());
      if (!has) await brandWorkspaceApi.createCollection({ title: cleanCollection });
    } catch {
      // best effort: the product itself is already saved
    }
  }
}

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

// ─── Small building blocks ───────────────────────────────────────────────────

const inputClass = (invalid: boolean, extra = '') =>
  `w-full px-3 py-2 rounded-xl border bg-white ${invalid ? 'border-rose-400 focus:outline-rose-500' : 'border-slate-200'} ${extra}`;

function Field({
  label,
  required,
  error,
  hint,
  counter,
  children,
  className = '',
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: React.ReactNode;
  counter?: { value: number; max: number };
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <label className="block font-bold text-slate-700">
          {label}
          {required && <span className="text-rose-600"> *</span>}
        </label>
        {counter && (
          <span className={`text-[11px] tabular-nums ${counter.value > counter.max ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
            {counter.value}/{counter.max}
          </span>
        )}
      </div>
      {children}
      {error ? (
        <p role="alert" className="mt-1 text-[11px] font-medium text-rose-600">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1 text-[11px] text-slate-500">{hint}</p>
      )}
    </div>
  );
}

/** Upload-only image card: no URL typing. The image URL is created automatically by the upload. */
function ImageUploadSlot({
  title,
  description,
  imageUrl,
  busy,
  error,
  onFile,
  onRemove,
}: {
  title: string;
  description: string;
  imageUrl: string;
  busy: boolean;
  error?: string;
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
        className={`group relative h-96 w-full overflow-hidden rounded-2xl border transition-colors ${
          dragging
            ? 'border-slate-900 bg-slate-50 ring-2 ring-slate-900/10'
            : error
              ? 'border-rose-400 bg-rose-50/40'
              : imageUrl
                ? 'border-slate-200 bg-slate-50'
                : 'border-dashed border-slate-300 bg-slate-50/60 hover:border-slate-500'
        }`}
      >
        {imageUrl ? (
          <>
            <SafeImage src={resolveImageSrc(imageUrl)} alt={title} fill className="object-contain p-2" />
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
      {error && (
        <p role="alert" className="text-[11px] font-medium text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Form state ──────────────────────────────────────────────────────────────

/** Everything the form edits, as the user typed it (numbers are still text here). */
interface FormState {
  name: string;
  category: string;
  subCategory: string;
  collection: string;
  shortDescription: string;
  description: string;
  tagsText: string;
  imageUrl: string;
  aiReferenceUrl: string;
  price: string;
  compareAtPrice: string;
  costPrice: string;
  sku: string;
  stock: string;
  lowStockThreshold: string;
  warehouseLocation: string;
  material: string;
  weightGsm: string;
  stretch: string;
  fitType: string;
  /** Chosen sizes, colours and how many pieces of each combination. */
  plan: VariantPlan;
  brandStorefrontPublished: boolean;
  marketplacePublished: boolean;
  isTryOnEligible: boolean;
  includeInBrandTryOn: boolean;
  includeInMarketplaceTryOn: boolean;
  tryOnCategory: string;
  catalogStatus: string;
  /** WOMEN, MEN or UNISEX. Empty until the brand chooses. */
  audience: string;
}

const STRETCH_OPTIONS = ['', 'NONE', 'LOW', 'MEDIUM', 'HIGH'];

/** Number from text: empty means "not entered" (undefined), anything else is parsed as typed. */
function parseNumber(text: string): number | undefined {
  const trimmed = text.trim();
  if (trimmed === '') return undefined;
  const value = Number(trimmed);
  return Number.isNaN(value) ? Number.NaN : value;
}

/** Turns what the user typed into the exact shape the contract (and the backend) validates. */
function toContractValues(form: FormState): Record<string, unknown> {
  const tags: string[] = [];
  for (const raw of form.tagsText.split(',')) {
    const tag = raw.trim();
    if (tag && !tags.some((t) => t.toLowerCase() === tag.toLowerCase())) tags.push(tag);
  }

  const specs: Record<string, string> = {};
  for (const [key, value] of [
    ['material', form.material],
    ['weightGsm', form.weightGsm],
    ['stretch', form.stretch],
    ['fitType', form.fitType],
  ] as const) {
    if (value.trim()) specs[key] = value.trim();
  }

  const compare = parseNumber(form.compareAtPrice);
  const cost = parseNumber(form.costPrice);

  return {
    name: form.name,
    category: form.category,
    subCategory: form.subCategory,
    collection: form.collection,
    shortDescription: form.shortDescription,
    description: form.description,
    tags,
    images: form.imageUrl ? [form.imageUrl] : [],
    aiReferenceImage: form.aiReferenceUrl || null,
    price: parseNumber(form.price),
    compareAtPrice: compare === undefined ? null : compare,
    costPrice: cost === undefined ? null : cost,
    sku: form.sku,
    // With sizes & colours, the total is the sum of the variants.
    // Left blank, stock counts as 0 and the low-stock alert as 5. With sizes & colours, they share this total.
    stock: parseNumber(form.stock) ?? 0,
    lowStockThreshold: parseNumber(form.lowStockThreshold) ?? 5,
    warehouseLocation: form.warehouseLocation,
    variants: planToVariants(form.plan, form.sku),
    specs,
    brandStorefrontPublished: form.brandStorefrontPublished,
    marketplacePublished: form.marketplacePublished,
    isTryOnEligible: form.isTryOnEligible,
    includeInBrandTryOn: form.includeInBrandTryOn,
    includeInMarketplaceTryOn: form.includeInMarketplaceTryOn,
    // When try-on is off the garment type does not matter; otherwise the brand must choose one.
    tryOnCategory: form.tryOnCategory || (form.isTryOnEligible ? '' : 'all'),
    catalogStatus: form.catalogStatus,
    audience: form.audience,
  };
}

/** Same rule the server applies, so what you see here is what gets saved. */
function applyConsistency(values: ProductFormValues): ProductFormValues {
  const next = { ...values };
  if (next.catalogStatus === 'DRAFT' || next.catalogStatus === 'ARCHIVED') {
    next.brandStorefrontPublished = false;
    next.marketplacePublished = false;
  }
  if (!next.isTryOnEligible) {
    next.includeInBrandTryOn = false;
    next.includeInMarketplaceTryOn = false;
  } else if (!next.marketplacePublished) {
    next.includeInMarketplaceTryOn = false;
  }
  return next;
}

export function ProductEditorView({ existingProductId }: { existingProductId?: string }) {
  const router = useRouter();
  const notify = useNotify();
  const profile = useWorkspaceStore((s) => s.profile);
  const products = useWorkspaceStore((s) => s.products);
  const addProduct = useWorkspaceStore((s) => s.addProduct);
  const updateProduct = useWorkspaceStore((s) => s.updateProduct);

  const existing = useMemo(
    () => (existingProductId ? products.find((p) => p.id === existingProductId) : undefined),
    [products, existingProductId]
  );

  const [form, setForm] = useState<FormState>(() => ({
    name: existing?.name || '',
    category: existing?.category || '',
    subCategory: existing?.subCategory || '',
    collection: existing?.collections?.[0] || '',
    shortDescription: existing?.shortDescription || '',
    description: existing?.description || '',
    tagsText: (existing?.tags || []).join(', '),
    imageUrl: existing?.images?.[0] || '',
    aiReferenceUrl:
      existing?.aiReferenceImage || ((existing?.specs as Record<string, string> | undefined)?._aiReferenceImage ?? ''),
    price: existing ? String(existing.price) : '',
    compareAtPrice: existing?.compareAtPrice != null ? String(existing.compareAtPrice) : '',
    costPrice: existing?.costPrice != null ? String(existing.costPrice) : '',
    sku: existing?.sku || '',
    stock: existing ? String(existing.stock ?? 0) : '',
    lowStockThreshold: existing?.lowStockThreshold != null ? String(existing.lowStockThreshold) : '',
    warehouseLocation: existing?.warehouseLocation || '',
    material: existing?.specs?.material || '',
    weightGsm: existing?.specs?.weightGsm || '',
    stretch: existing?.specs?.stretch || '',
    fitType: existing?.specs?.fitType || '',
    plan: variantsToPlan(existing?.variants),
    brandStorefrontPublished: existing?.brandStorefrontPublished ?? true,
    marketplacePublished: existing?.marketplacePublished ?? false,
    isTryOnEligible: existing?.isTryOnEligible ?? true,
    includeInBrandTryOn: existing?.includeInBrandTryOn ?? true,
    includeInMarketplaceTryOn: existing?.includeInMarketplaceTryOn ?? false,
    tryOnCategory: existing?.tryOnCategory || '',
    catalogStatus: existing?.catalogStatus || 'ACTIVE',
    // A new product must be set to women, men or both. Older products without a value already count as both.
    audience: existing ? existing.audience || 'UNISEX' : '',
  }));
  const set = (patch: Partial<FormState>) => setForm((prev) => ({ ...prev, ...patch }));

  const [step, setStep] = useState(0);
  const [maxReached, setMaxReached] = useState(0);
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [attemptedSteps, setAttemptedSteps] = useState<Set<number>>(new Set());
  const [serverErrors, setServerErrors] = useState<Partial<Record<ProductFieldName, string>>>({});
  const [uploadingSlot, setUploadingSlot] = useState<'display' | 'ai' | null>(null);
  const [uploadingColor, setUploadingColor] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [skuStatus, setSkuStatus] = useState<{ checked: boolean; available: boolean; message: string } | null>(null);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [collectionOptions, setCollectionOptions] = useState<string[]>([]);

  // ─── Drafts ───
  // An unfinished new product is kept in this browser as you type, so a refresh loses nothing. Photos picked in the
  // form stay in the browser too and are only uploaded when the product is saved.
  const isNewProduct = !existingProductId;
  const tenantKey = profile.slug || profile.id || 'brand';
  const [draftId, setDraftId] = useState('');
  const [restoring, setRestoring] = useState(isNewProduct);
  const [restoredNotice, setRestoredNotice] = useState<string | null>(null);
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const blankForm = useRef(JSON.stringify(form));
  const latest = useRef({ form, step, maxReached });
  useEffect(() => {
    latest.current = { form, step, maxReached };
  });
  // Staged photos belong to the draft (or, when editing, to that product).
  const scopeId = existing ? `edit-${existing.id}` : draftId;

  const persistDraft = useCallback(async () => {
    if (!isNewProduct || !draftId) return;
    const { form: current, step: currentStep, maxReached: reached } = latest.current;
    if (JSON.stringify(current) === blankForm.current) {
      await deleteDraft(draftId);
      return;
    }
    const saved = await saveDraft({
      id: draftId,
      version: DRAFT_VERSION,
      tenantKey,
      form: current,
      step: currentStep,
      maxReached: reached,
      title: current.name.trim(),
      updatedAt: Date.now(),
    });
    if (saved) setDraftSavedAt(Date.now());
  }, [draftId, isNewProduct, tenantKey]);

  // Open the draft named in the address (or start a new one).
  useEffect(() => {
    if (!isNewProduct) return;
    let cancelled = false;
    (async () => {
      let id = new URLSearchParams(window.location.search).get('draft') || '';
      if (id) {
        const draft = await loadDraft(id);
        if (draft && draft.tenantKey !== tenantKey) {
          id = '';
        } else if (draft && !cancelled) {
          const saved = draft.form as FormState;
          const missing = await restorePreviews(collectLocalRefs(saved));
          setForm(missing.length > 0 ? stripRefs(saved, missing) : saved);
          setStep(draft.step);
          setMaxReached(draft.maxReached);
          setRestoredNotice(
            missing.length > 0
              ? 'We restored your unfinished product. Some photos could not be recovered, please add them again.'
              : 'We restored your unfinished product.'
          );
        }
      }
      if (!id) {
        id = newDraftId();
        router.replace(`/dashboard/products/new?draft=${id}`, { scroll: false });
      }
      if (!cancelled) {
        setDraftId(id);
        setRestoring(false);
      }
    })();
    void pruneOldDrafts();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save shortly after every change, and straight away when you move between steps.
  useEffect(() => {
    if (!isNewProduct || restoring || !draftId) return;
    const timer = setTimeout(() => void persistDraft(), 600);
    return () => clearTimeout(timer);
  }, [form, isNewProduct, restoring, draftId, persistDraft]);
  useEffect(() => {
    if (!isNewProduct || restoring || !draftId) return;
    void persistDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, maxReached]);
  useEffect(() => {
    if (!isNewProduct) return;
    const flush = () => {
      if (document.visibilityState === 'hidden') void persistDraft();
    };
    document.addEventListener('visibilitychange', flush);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', flush);
      window.removeEventListener('pagehide', flush);
    };
  }, [isNewProduct, persistDraft]);

  const startOver = async () => {
    await deleteDraft(draftId);
    const fresh = newDraftId();
    setForm(JSON.parse(blankForm.current) as FormState);
    setStep(0);
    setMaxReached(0);
    setTouched(new Set());
    setAttemptedSteps(new Set());
    setRestoredNotice(null);
    setDraftSavedAt(null);
    setDraftId(fresh);
    router.replace(`/dashboard/products/new?draft=${fresh}`, { scroll: false });
  };

  // Load the brand's own categories and collections.
  useEffect(() => {
    let active = true;
    brandWorkspaceApi
      .getProductFormOptions()
      .then((opts) => {
        if (!active || !opts) return;
        if (Array.isArray(opts.categories) && opts.categories.length > 0) setCustomCategories(opts.categories);
        if (Array.isArray(opts.collections)) setCollectionOptions(opts.collections);
      })
      .catch(() => {
        brandWorkspaceApi
          .getCategories()
          .then((cats) => {
            if (active && Array.isArray(cats)) setCustomCategories(cats.map((c) => c.name).filter(Boolean));
          })
          .catch(() => {});
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live check that the SKU is not already used by another product.
  useEffect(() => {
    const cleanSku = form.sku.trim();
    if (!cleanSku) {
      setSkuStatus(null);
      return;
    }
    let active = true;
    const timer = setTimeout(() => {
      brandWorkspaceApi
        .checkProductSku(cleanSku, existing?.id)
        .then((res) => {
          if (active) setSkuStatus({ checked: true, available: res.available, message: res.message });
        })
        .catch(() => {});
    }, 350);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [existing?.id, form.sku]);

  const categoryOptions = useMemo(
    () =>
      Array.from(
        new Set(
          [...(customCategories.length > 0 ? customCategories : DEFAULT_CATEGORIES), existing?.category || ''].filter(Boolean)
        )
      ),
    [customCategories, existing?.category]
  );
  const collectionChoices = useMemo(
    () =>
      Array.from(
        new Set(
          [...(collectionOptions.length > 0 ? collectionOptions : DEFAULT_COLLECTIONS), existing?.collections?.[0] || ''].filter(Boolean)
        )
      ),
    [collectionOptions, existing?.collections]
  );

  // ─── Validation: the same rules the server enforces ───
  const parsed = useMemo(() => productFormSchema.safeParse(toContractValues(form)), [form]);
  const errors = useMemo(() => (parsed.success ? {} : collectFieldErrors(parsed.error)), [parsed]);
  const skuTaken = skuStatus?.checked === true && skuStatus.available === false;
  // Sizes add up to the total stock, and each size's colours add up to that size.
  const planIssue = planProblem(form.plan, Math.max(0, Math.floor(parseNumber(form.stock) || 0)));
  const fieldErrors: Partial<Record<ProductFieldName, string>> = {
    ...errors,
    ...(planIssue ? { variants: planIssue } : {}),
    ...(skuTaken && !errors.sku ? { sku: skuStatus?.message || 'This SKU is already in use.' } : {}),
    ...serverErrors,
  };

  const stepOf = (field: ProductFieldName) => PRODUCT_STEP_FIELDS.findIndex((fields) => fields.includes(field));
  /** Show an error once the field was touched, or its step was attempted, or the server rejected it. */
  const showError = (field: ProductFieldName): string | undefined => {
    const message = fieldErrors[field];
    if (!message) return undefined;
    if (serverErrors[field] || touched.has(field) || attemptedSteps.has(stepOf(field))) return message;
    return undefined;
  };
  const touch = (field: ProductFieldName) =>
    setTouched((prev) => (prev.has(field) ? prev : new Set(prev).add(field)));

  const STEPS = [
    { key: 'basics', label: 'Basics', hint: 'Title & category' },
    { key: 'images', label: 'Images', hint: 'Photos' },
    { key: 'pricing', label: 'Price & stock', hint: 'Price & SKU' },
    { key: 'variants', label: 'Colours & sizes', hint: 'Optional' },
    { key: 'publish', label: 'Try-On & publish', hint: 'Go live' },
  ] as const;
  const lastStep = STEPS.length - 1;

  // A step is complete when none of its fields has an error. The store photo is also needed to go live.
  const stepDone = STEPS.map((_, i) => {
    const clean = PRODUCT_STEP_FIELDS[i].every((field) => !fieldErrors[field]);
    if (i === 1) return clean && Boolean(form.imageUrl);
    return clean;
  });
  stepDone[lastStep] = false;
  // Each step unlocks only after every earlier step is complete.
  const isUnlocked = (i: number) => stepDone.slice(0, i).every(Boolean);

  const stepMissing = (i: number): string[] => {
    const messages = PRODUCT_STEP_FIELDS[i].map((field) => fieldErrors[field]).filter(Boolean) as string[];
    if (i === 1 && !form.imageUrl) messages.unshift('Upload a store photo.');
    return messages;
  };
  const canContinue = stepDone[step];
  const allRequiredDone = stepDone.slice(0, 3).every(Boolean);
  const continueHint = canContinue ? '' : stepMissing(step)[0] || '';

  const goToStep = (i: number) => {
    if (i >= 0 && i <= lastStep && isUnlocked(i)) setStep(i);
  };
  const tryNext = () => {
    if (!canContinue) {
      setAttemptedSteps((prev) => new Set(prev).add(step));
      return;
    }
    goToStep(step + 1);
  };

  // Remember the furthest step reached, and never stay on a step that has become locked.
  useEffect(() => {
    setMaxReached((m) => Math.max(m, step));
    if (!isUnlocked(step)) {
      const firstIncomplete = stepDone.findIndex((d, i) => i < lastStep && !d);
      setStep(firstIncomplete === -1 ? 0 : firstIncomplete);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, parsed, form.imageUrl, skuStatus]);

  const checklist = [
    { label: 'Product title', done: !fieldErrors.name, required: true, step: 0 },
    { label: 'Category', done: !fieldErrors.category, required: true, step: 0 },
    { label: 'Store photo', done: Boolean(form.imageUrl), required: true, step: 1 },
    { label: 'AI reference image', done: Boolean(form.aiReferenceUrl), required: false, step: 1 },
    { label: 'Selling price', done: !fieldErrors.price, required: true, step: 2 },
    { label: 'SKU', done: !fieldErrors.sku, required: true, step: 2 },
  ];
  const requiredLeft = checklist.filter((c) => c.required && !c.done).length;

  const numericPrice = parseNumber(form.price) || 0;
  const numericCost = parseNumber(form.costPrice);
  const marginPct =
    numericPrice > 0 && typeof numericCost === 'number' && !Number.isNaN(numericCost)
      ? Math.round(((numericPrice - numericCost) / numericPrice) * 100)
      : null;

  // ─── Images: kept in the browser until the product is saved ───
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
      const previous = slot === 'display' ? form.imageUrl : form.aiReferenceUrl;
      const ref = await stageImage(scopeId, file);
      if (isLocalRef(previous)) void deleteStagedImage(previous);
      set(slot === 'display' ? { imageUrl: ref } : { aiReferenceUrl: ref });
      notify('Photo added. It uploads when you save the product.');
    } catch (err) {
      setErrorMessage(formatApiError(err, 'Could not add the photo. Please try again.'));
    } finally {
      setUploadingSlot(null);
    }
  };

  const removeImage = (slot: 'display' | 'ai') => {
    const previous = slot === 'display' ? form.imageUrl : form.aiReferenceUrl;
    if (isLocalRef(previous)) void deleteStagedImage(previous);
    set(slot === 'display' ? { imageUrl: '' } : { aiReferenceUrl: '' });
  };

  /** A colour's own store photo or AI photo: kept in the browser, and linked to that colour. */
  const handleColorPhoto = async (color: string, kind: PhotoKind, file: File) => {
    const invalid = validateImageFile(file);
    if (invalid) {
      setErrorMessage(invalid);
      notify(invalid);
      return;
    }
    setUploadingColor(`${color}|${kind}`);
    setErrorMessage(null);
    try {
      const section = form.plan.colors.find((c) => c.color === color);
      const previous = kind === 'store' ? section?.photo : section?.aiPhoto;
      const ref = await stageImage(scopeId, file);
      if (previous && isLocalRef(previous)) void deleteStagedImage(previous);
      setForm((prev) => ({
        ...prev,
        plan: {
          ...prev.plan,
          colors: prev.plan.colors.map((c) => (c.color === color ? { ...c, ...(kind === 'store' ? { photo: ref } : { aiPhoto: ref }) } : c)),
        },
      }));
      notify(`${color} ${kind === 'store' ? 'store' : 'AI'} photo added. It uploads when you save the product.`);
    } catch (err) {
      setErrorMessage(formatApiError(err, 'Could not add the photo. Please try again.'));
    } finally {
      setUploadingColor(null);
    }
  };

  // ─── Save ───
  const saveProduct = async () => {
    setErrorMessage(null);
    setServerErrors({});

    if (!parsed.success || skuTaken) {
      const firstBad = PRODUCT_STEP_FIELDS.findIndex((fields) => fields.some((f) => fieldErrors[f]));
      setAttemptedSteps(new Set(PRODUCT_STEP_FIELDS.map((_, i) => i)));
      setErrorMessage('Some fields need attention before this can be saved. They are marked in red.');
      if (firstBad >= 0) setStep(firstBad);
      return;
    }

    setSaving(true);
    try {
      // 1. Upload the photos that are still only in this browser. Each finished upload is remembered,
      //    so pressing Save again after a failure only uploads what is left.
      let finalForm = form;
      try {
        finalForm = await uploadStagedPhotos(
          form,
          async (ref) => {
            const file = await getStagedFile(ref);
            if (!file) throw new Error('One of your photos is no longer available. Please add it again.');
            const res = await brandWorkspaceApi.uploadMediaFile(file);
            if (!res.ok || !res.url) throw new Error(res.error || 'A photo could not be uploaded.');
            return res.url;
          },
          {
            onProgress: (done, total) => setUploadProgress({ done, total }),
            onUploaded: (ref, url) => {
              setForm((prev) => replaceRefs(prev, { [ref]: url }));
              void deleteStagedImage(ref);
            },
          }
        );
      } catch (err) {
        setErrorMessage(
          `${err instanceof Error ? err.message : 'A photo could not be uploaded.'} Nothing was saved yet. Press Save again to retry. Photos that already uploaded are kept.`
        );
        return;
      } finally {
        setUploadProgress(null);
      }

      // 2. Check the final values (now with real photo links) and send them to the backend.
      const checked = productFormSchema.safeParse(toContractValues(finalForm));
      if (!checked.success) {
        setErrorMessage('Some fields need attention before this can be saved. They are marked in red.');
        return;
      }
      // Exactly what the contract validated, with the same consistency rules the server applies.
      const payload: ProductPayload = applyConsistency(checked.data);

      if (existing) {
        const updated = await brandWorkspaceApi.updateProduct(existing.id, payload);
        updateProduct(existing.id, updated);
        notify('Product updated.');
      } else {
        const created = await brandWorkspaceApi.addProduct(payload);
        addProduct(created);
        notify('Product created.');
      }
      // Add the category / collection used here to the brand's own lists if they are not there yet.
      await ensureCatalogEntries(finalForm.category, finalForm.collection, payload.tryOnCategory);
      // Saved for real: the draft and any photos left in the browser are no longer needed.
      await deleteDraft(scopeId);
      router.push(existing ? `/dashboard/products/${existing.id}` : '/dashboard/products');
    } catch (err) {
      // Show the server's field-level messages next to the fields they belong to.
      if (err instanceof ServiceError && err.issues && err.issues.length > 0) {
        const mapped: Partial<Record<ProductFieldName, string>> = {};
        for (const issue of err.issues) {
          const field = String(issue.path).split(/[.[\]]/)[0] as ProductFieldName;
          if (field && !(field in mapped)) mapped[field] = issue.message;
        }
        setServerErrors(mapped);
        const firstBad = PRODUCT_STEP_FIELDS.findIndex((fields) => fields.some((f) => mapped[f]));
        if (firstBad >= 0) setStep(firstBad);
      }
      setErrorMessage(formatApiError(err, 'Failed to save the product.'));
    } finally {
      setSaving(false);
    }
  };

  const draftOrArchived = form.catalogStatus === 'DRAFT' || form.catalogStatus === 'ARCHIVED';
  const textInput = (
    field: ProductFieldName,
    key: keyof FormState,
    props: React.InputHTMLAttributes<HTMLInputElement> = {},
    extraClass = ''
  ) => (
    <input
      value={String(form[key] ?? '')}
      onChange={(e) => {
        set({ [key]: e.target.value } as Partial<FormState>);
        if (serverErrors[field]) setServerErrors((prev) => ({ ...prev, [field]: undefined }));
      }}
      onBlur={() => touch(field)}
      aria-invalid={Boolean(showError(field))}
      className={inputClass(Boolean(showError(field)), extraClass)}
      {...props}
    />
  );

  if (restoring) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" /> Opening your product…
      </div>
    );
  }

  return (
    <PermissionGate module="products" action={existing ? 'edit' : 'create'}>
      <div className="space-y-6 pb-24">
        <PageHeader
          eyebrow={profile.name}
          title={existing ? `Edit: ${existing.name}` : 'Add a product'}
          subtitle="Work through the steps. You can come back to any finished step."
          backHref={existing ? `/dashboard/products/${existing.id}` : '/dashboard/products'}
          backLabel={existing ? 'Product preview' : 'Products'}
        />

        {isNewProduct && restoredNotice && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-2.5 text-xs text-sky-900">
            <span className="font-semibold">{restoredNotice}</span>
            <button type="button" onClick={() => void startOver()} className="font-bold underline">
              Start over
            </button>
          </div>
        )}
        {isNewProduct && (
          <p className="-mt-3 text-[11px] text-slate-500">
            {draftSavedAt
              ? 'Draft saved in this browser. It is not published and not in your store yet. You can leave and come back from the Products page.'
              : 'Your progress is saved in this browser as you go, until you press Save.'}
          </p>
        )}

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
                      <span className="hidden text-[11px] text-slate-400 sm:block">{st.hint}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        {errorMessage && <ErrorBanner message={errorMessage} onDismiss={() => setErrorMessage(null)} />}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-6">
            {/* 1. BASICS */}
            {step === 0 && (
              <SectionCard title="Basic information">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <Field label="Garment title" required className="sm:col-span-2" error={showError('name')} counter={{ value: form.name.trim().length, max: PRODUCT_LIMITS.nameMax }}>
                    {textInput('name', 'name', { placeholder: 'e.g. Elysian Mulberry Silk Dress', maxLength: PRODUCT_LIMITS.nameMax + 20 })}
                  </Field>

                  <Field
                    label="Category"
                    required
                    error={showError('category')}
                    hint={
                      <>
                        {customCategories.length > 0 ? 'Your categories. ' : 'No categories added yet, showing standard ones. '}
                        <Link href="/dashboard/categories/new" className="font-semibold text-slate-900 underline">
                          + Add category
                        </Link>
                      </>
                    }
                  >
                    <select
                      value={form.category}
                      onChange={(e) => set({ category: e.target.value })}
                      onBlur={() => touch('category')}
                      className={inputClass(Boolean(showError('category')))}
                    >
                      <option value="">Select a category</option>
                      {categoryOptions.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field
                    label="Who is it for?"
                    error={showError('audience')}
                    hint="Women: shown to women only. Men: shown to men only. Both: shown to everyone."
                  >
                    <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Who is it for?">
                      {([['WOMEN', 'Women'], ['MEN', 'Men'], ['UNISEX', 'Both']] as const).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          role="radio"
                          aria-checked={form.audience === value}
                          onClick={() => {
                            set({ audience: value });
                            touch('audience');
                          }}
                          className={`rounded-xl border px-3 py-2.5 text-sm font-bold ${
                            form.audience === value ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <Field
                    label="Collection"
                    error={showError('collection')}
                    hint={
                      <Link href="/dashboard/collections/new" className="font-semibold text-slate-900 underline">
                        + Add collection
                      </Link>
                    }
                  >
                    <select
                      value={form.collection}
                      onChange={(e) => set({ collection: e.target.value })}
                      className={inputClass(Boolean(showError('collection')))}
                    >
                      <option value="">No collection</option>
                      {collectionChoices.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field
                    label="Short summary"
                    className="sm:col-span-2"
                    error={showError('shortDescription')}
                    counter={{ value: form.shortDescription.trim().length, max: PRODUCT_LIMITS.shortDescriptionMax }}
                  >
                    {textInput('shortDescription', 'shortDescription', { placeholder: 'One line shown on product cards', maxLength: PRODUCT_LIMITS.shortDescriptionMax + 20 })}
                  </Field>

                  <Field
                    label="Description"
                    className="sm:col-span-2"
                    error={showError('description')}
                    counter={{ value: form.description.trim().length, max: PRODUCT_LIMITS.descriptionMax }}
                  >
                    <textarea
                      rows={4}
                      placeholder="Describe the fabric, fit, and how it feels to wear"
                      value={form.description}
                      onChange={(e) => set({ description: e.target.value })}
                      onBlur={() => touch('description')}
                      className={inputClass(Boolean(showError('description')))}
                    />
                  </Field>

                  <Field
                    label="Tags"
                    className="sm:col-span-2"
                    error={showError('tags')}
                    hint={`Separate with commas. Up to ${PRODUCT_LIMITS.tagsMax} tags, ${PRODUCT_LIMITS.tagMax} characters each. Letters, numbers, spaces, - and _ only.`}
                  >
                    {textInput('tags', 'tagsText', { placeholder: 'silk, evening wear, eid' })}
                  </Field>
                </div>
              </SectionCard>
            )}

            {/* 2. IMAGES */}
            {step === 1 && (
              <SectionCard title="Main images" subtitle="The product's main photos. A colour can have its own photos later, in the Colours & sizes step.">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <ImageUploadSlot
                    title="Store Photo (shown to customers)"
                    description="Your styled or model photo for the storefront and marketplace."
                    imageUrl={form.imageUrl}
                    busy={uploadingSlot === 'display'}
                    error={showError('images') || (attemptedSteps.has(1) && !form.imageUrl ? 'Upload a store photo to continue.' : undefined)}
                    onFile={(f) => void handleUploadImage('display', f)}
                    onRemove={() => removeImage('display')}
                  />
                  <ImageUploadSlot
                    title="AI Reference Image (not shown to customers)"
                    description="A clear, flat photo of the garment (front view, plain background, nothing covering it). The Virtual Try-On AI uses this so it understands the real product."
                    imageUrl={form.aiReferenceUrl}
                    busy={uploadingSlot === 'ai'}
                    error={showError('aiReferenceImage')}
                    onFile={(f) => void handleUploadImage('ai', f)}
                    onRemove={() => removeImage('ai')}
                  />
                </div>
              </SectionCard>
            )}

            {/* 3. PRICE & STOCK */}
            {step === 2 && (
              <>
                <SectionCard title="Pricing" subtitle="The private cost is only visible to your team.">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <Field label="Selling price (৳)" required error={showError('price')}>
                      {textInput('price', 'price', { type: 'number', inputMode: 'decimal', min: 0.01, max: PRODUCT_LIMITS.priceMax, step: '0.01', placeholder: '0.00' }, 'font-bold')}
                    </Field>
                    <Field label="Compare-at (৳)" error={showError('compareAtPrice')} hint="Optional. The crossed-out price.">
                      {textInput('compareAtPrice', 'compareAtPrice', { type: 'number', inputMode: 'decimal', min: 0, step: '0.01', placeholder: '0.00' })}
                    </Field>
                    <Field label="Private cost (৳)" error={showError('costPrice')} hint="Optional. Never shown to shoppers.">
                      {textInput('costPrice', 'costPrice', { type: 'number', inputMode: 'decimal', min: 0, step: '0.01', placeholder: '0.00' })}
                    </Field>
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-2.5">
                      <span className="text-[11px] font-bold uppercase text-emerald-700">Est. margin</span>
                      <p className="text-lg font-extrabold text-emerald-800">{marginPct === null ? '—' : `${marginPct}%`}</p>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard title="Stock & details">
                  <div className="grid grid-cols-1 min-[400px]:grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <Field
                      label="Master SKU"
                      required
                      error={showError('sku')}
                      hint={skuStatus?.checked && !skuTaken && !fieldErrors.sku ? <span className="font-semibold text-emerald-700">{skuStatus.message}</span> : undefined}
                    >
                      {textInput('sku', 'sku', { maxLength: PRODUCT_LIMITS.skuMax + 10, autoCapitalize: 'characters', placeholder: 'e.g. AUR-1001' }, 'font-mono')}
                    </Field>
                    <Field
                      label="Total stock"
                      error={showError('stock')}
                      hint={form.plan.colors.length > 0 ? 'You share this across colours and sizes on the next step.' : undefined}
                    >
                      {textInput('stock', 'stock', { type: 'number', inputMode: 'numeric', min: 0, max: PRODUCT_LIMITS.stockMax, step: '1', placeholder: '0' })}
                    </Field>
                    <Field label="Low-stock alert" error={showError('lowStockThreshold')} hint="Whole product. You can set one per size too.">
                      {textInput('lowStockThreshold', 'lowStockThreshold', { type: 'number', inputMode: 'numeric', min: 0, step: '1', placeholder: '5' })}
                    </Field>
                    <Field label="Warehouse" error={showError('warehouseLocation')}>
                      {textInput('warehouseLocation', 'warehouseLocation', { placeholder: 'e.g. Dhaka Main Studio', maxLength: PRODUCT_LIMITS.warehouseMax + 10 })}
                    </Field>
                    <Field label="Material" className="min-[400px]:col-span-2" error={showError('specs')}>
                      {textInput('specs', 'material', { placeholder: 'e.g. 100% Mulberry Silk', maxLength: PRODUCT_LIMITS.specValueMax + 10 })}
                    </Field>
                    <Field label="Weight">
                      {textInput('specs', 'weightGsm', { placeholder: 'e.g. 190 gsm', maxLength: PRODUCT_LIMITS.specValueMax + 10 })}
                    </Field>
                    <Field label="Fit type">
                      {textInput('specs', 'fitType', { placeholder: 'e.g. Tailored', maxLength: PRODUCT_LIMITS.specValueMax + 10 })}
                    </Field>
                    <Field label="Sub-category" error={showError('subCategory')}>
                      {textInput('subCategory', 'subCategory', { placeholder: 'e.g. Womenswear', maxLength: PRODUCT_LIMITS.subCategoryMax + 10 })}
                    </Field>
                    <Field label="Stretch">
                      <select value={form.stretch} onChange={(e) => set({ stretch: e.target.value })} className={inputClass(false)}>
                        {STRETCH_OPTIONS.map((o) => (
                          <option key={o} value={o}>
                            {o === '' ? 'Not set' : o.charAt(0) + o.slice(1).toLowerCase()}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                </SectionCard>
              </>
            )}

            {/* 4. SIZES & COLOURS */}
            {step === 3 && (
              <SectionCard
                title="Colours & sizes (optional)"
                subtitle="Pick the colours, then give each colour its own sizes, counts and photos."
              >
                <VariantPlanner
                  plan={form.plan}
                  onChange={(plan) => set({ plan })}
                  totalStock={Math.max(0, Math.floor(parseNumber(form.stock) || 0))}
                  basePrice={parseNumber(form.price) || 0}
                  error={showError('variants')}
                  onGoToStock={() => goToStep(2)}
                  onUploadPhoto={(color, kind, file) => void handleColorPhoto(color, kind, file)}
                  uploading={uploadingColor}
                />
              </SectionCard>
            )}

            {/* 5. TRY-ON & PUBLISH */}
            {step === 4 && (
              <>
                <SectionCard title="Virtual Try-On" subtitle="Let shoppers see this garment on themselves">
                  <div className="space-y-3 text-xs">
                    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-600" /> Enable Virtual Try-On
                      </span>
                      <input type="checkbox" checked={form.isTryOnEligible} onChange={(e) => set({ isTryOnEligible: e.target.checked })} className="rounded accent-slate-950" />
                    </label>

                    <Field label="Garment type for the AI" error={showError('tryOnCategory')}>
                      <select
                        value={form.tryOnCategory}
                        onChange={(e) => set({ tryOnCategory: e.target.value })}
                        disabled={!form.isTryOnEligible}
                        className={inputClass(Boolean(showError('tryOnCategory')), 'disabled:bg-slate-100 disabled:text-slate-400')}
                      >
                        <option value="">Select garment type</option>
                        {TRY_ON_CATEGORIES.map((value) => (
                          <option key={value} value={value}>
                            {{ tops: 'Tops / Shirts / Hoodies', bottoms: 'Bottoms / Pants / Jeans', dresses: 'Dresses / Sarees / Full body', outerwear: 'Outerwear / Jackets', all: 'Any garment type' }[value]}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <label className={`flex items-center gap-2 ${form.isTryOnEligible ? 'cursor-pointer' : 'opacity-50'}`}>
                      <input
                        type="checkbox"
                        disabled={!form.isTryOnEligible}
                        checked={form.isTryOnEligible && form.includeInBrandTryOn}
                        onChange={(e) => set({ includeInBrandTryOn: e.target.checked })}
                        className="rounded accent-slate-950"
                      />
                      <span>
                        Include in Brand Try-On Page (<code>/try/{profile.slug}</code>)
                      </span>
                    </label>
                    <label className={`flex items-center gap-2 ${form.isTryOnEligible && form.marketplacePublished && !draftOrArchived ? 'cursor-pointer' : 'opacity-50'}`}>
                      <input
                        type="checkbox"
                        disabled={!form.isTryOnEligible || !form.marketplacePublished || draftOrArchived}
                        checked={form.isTryOnEligible && form.marketplacePublished && !draftOrArchived && form.includeInMarketplaceTryOn}
                        onChange={(e) => set({ includeInMarketplaceTryOn: e.target.checked })}
                        className="rounded accent-slate-950"
                      />
                      <span>Include in Marketplace Try-On (needs a marketplace listing)</span>
                    </label>
                  </div>
                </SectionCard>

                <SectionCard title="Where to show this product" subtitle="Choose who can see it">
                  <div className="space-y-3 text-xs">
                    <Field label="Catalog status" error={showError('catalogStatus')} hint={draftOrArchived ? 'Draft and archived products are hidden from shoppers.' : undefined}>
                      <select value={form.catalogStatus} onChange={(e) => set({ catalogStatus: e.target.value })} className={inputClass(Boolean(showError('catalogStatus')))}>
                        {CATALOG_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s.charAt(0) + s.slice(1).toLowerCase()}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <label className={`flex items-center justify-between rounded-xl border border-slate-200 p-3 ${draftOrArchived ? 'opacity-50' : 'cursor-pointer'}`}>
                      <div>
                        <p className="font-bold text-slate-900">Brand storefront</p>
                        <p className="text-[11px] text-slate-500">Show on /brands/{profile.slug}</p>
                      </div>
                      <input
                        type="checkbox"
                        disabled={draftOrArchived}
                        checked={form.brandStorefrontPublished && !draftOrArchived}
                        onChange={(e) => set({ brandStorefrontPublished: e.target.checked })}
                        className="rounded accent-slate-950"
                      />
                    </label>

                    <label className={`flex items-center justify-between rounded-xl border border-slate-200 p-3 ${draftOrArchived ? 'opacity-50' : 'cursor-pointer'}`}>
                      <div>
                        <p className="font-bold text-slate-900">Global marketplace</p>
                        <p className="text-[11px] text-slate-500">Also list this product for all shoppers</p>
                      </div>
                      <input
                        type="checkbox"
                        disabled={draftOrArchived}
                        checked={form.marketplacePublished && !draftOrArchived}
                        onChange={(e) => set({ marketplacePublished: e.target.checked })}
                        className="rounded accent-slate-950"
                      />
                    </label>

                    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <span className="font-semibold text-slate-600">Will be saved as:</span>
                      <StatusBadge
                        status={
                          draftOrArchived ? 'DRAFT' : form.marketplacePublished ? 'PUBLISHED' : form.brandStorefrontPublished ? 'STOREFRONT_ONLY' : 'DRAFT'
                        }
                      />
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
                      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left hover:bg-slate-50 disabled:cursor-not-allowed"
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                          c.done ? 'bg-emerald-500 text-white' : 'border border-slate-300 text-transparent'
                        }`}
                      >
                        <Check className="h-3 w-3" />
                      </span>
                      <span className={`flex-1 font-semibold ${c.done ? 'text-slate-500' : 'text-slate-900'}`}>{c.label}</span>
                      {!c.required && !c.done && <span className="text-[11px] font-bold text-slate-400">Recommended</span>}
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
              <Button size="sm" onClick={tryNext} aria-disabled={!canContinue} className={canContinue ? '' : 'opacity-60'}>
                Next
              </Button>
            )}
            {continueHint && <span className="hidden truncate text-xs font-medium text-amber-700 sm:block">{continueHint}</span>}
          </div>
          {step === lastStep && (
            <Button
              size="sm"
              disabled={saving || !allRequiredDone}
              title={allRequiredDone ? undefined : 'Finish Basics, Images and Price & stock to save'}
              onClick={() => void saveProduct()}
              className="gap-1.5"
            >
              <Check className="w-3.5 h-3.5" /> {uploadProgress ? `Uploading photos ${uploadProgress.done}/${uploadProgress.total}…` : saving ? 'Saving...' : existing ? 'Save changes' : 'Save product'}
            </Button>
          )}
        </div>
      </div>
    </PermissionGate>
  );
}
