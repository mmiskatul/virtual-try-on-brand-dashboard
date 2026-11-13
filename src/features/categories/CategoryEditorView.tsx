'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  FolderTree,
  Globe,
  HelpCircle,
  Layers,
  Loader2,
  Plus,
  RefreshCw,
  Shirt,
  Sparkles,
  Tag,
  XCircle,
} from 'lucide-react';
import {
  BrandCategoryRecord,
  CategoryFormOptions,
  CheckCategorySlugResult,
  brandWorkspaceApi,
  ServiceError,
} from '../../services/brandService';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { useUiStore } from '../../stores/useUiStore';
import {
  ErrorBanner,
  PageHeader,
  PermissionGate,
  SectionCard,
  StatusBadge,
} from '../../components/shared/UiPrimitives';
import { ProductsNavTabs } from '../../components/shared/ProductsNavTabs';
import { Button } from '../../components/ui/button';

function slugify(val: string): string {
  return (
    val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'category'
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

const DEFAULT_PRESETS = [
  'Dresses',
  'Tops & Shirts',
  'T-Shirts & Polos',
  'Pants & Trousers',
  'Jeans & Denim',
  'Outerwear & Jackets',
  'Coats & Parkas',
  'Knitwear & Sweaters',
  'Skirts',
  'Blazers & Tailoring',
  'Activewear',
  'Loungewear & Sleepwear',
  'Suits & Eveningwear',
  'Accessories',
];

const TRY_ON_OPTIONS: Array<{
  value: 'tops' | 'bottoms' | 'dresses' | 'outerwear' | 'all' | 'none';
  label: string;
  desc: string;
}> = [
  { value: 'tops', label: 'Tops & Shirts', desc: 'Shirts, tees, blouses, upper-body wear' },
  { value: 'bottoms', label: 'Bottoms & Pants', desc: 'Trousers, jeans, shorts, skirts' },
  { value: 'dresses', label: 'Full Body & Dresses', desc: 'One-piece garments, gowns, jumpsuits' },
  { value: 'outerwear', label: 'Outerwear & Coats', desc: 'Jackets, blazers, coats, trench coats' },
  { value: 'all', label: 'Universal / All Types', desc: 'Multi-category or versatile garments' },
  { value: 'none', label: 'Non-Try-On', desc: 'Accessories, scarves, bags, gift cards' },
];

export function CategoryEditorView() {
  const router = useRouter();
  const profile = useWorkspaceStore((s) => s.profile);
  const showToast = useUiStore((s) => s.showToast);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [parentCategory, setParentCategory] = useState('');
  const [tryOnCategory, setTryOnCategory] = useState<
    'tops' | 'bottoms' | 'dresses' | 'outerwear' | 'all' | 'none'
  >('none');
  const [sortOrder, setSortOrder] = useState(10);
  const [active, setActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [options, setOptions] = useState<CategoryFormOptions | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [slugMessage, setSlugMessage] = useState('');
  const [suggestedSlug, setSuggestedSlug] = useState<string | null>(null);

  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load category options & presets
  useEffect(() => {
    let isMounted = true;
    brandWorkspaceApi
      .getCategoryFormOptions()
      .then((data) => {
        if (!isMounted) return;
        setOptions(data);
        if (typeof data.defaultSortOrder === 'number') {
          setSortOrder(data.defaultSortOrder);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoadingOptions(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Debounced slug check
  const checkSlugAvailability = useCallback((slugToCheck: string, nameToCheck: string) => {
    if (!slugToCheck.trim()) {
      setSlugStatus('idle');
      setSlugMessage('');
      setSuggestedSlug(null);
      return;
    }
    setSlugStatus('checking');

    if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);
    checkTimeoutRef.current = setTimeout(() => {
      brandWorkspaceApi
        .checkCategorySlug(slugToCheck, nameToCheck)
        .then((res: CheckCategorySlugResult) => {
          if (res.available) {
            setSlugStatus('available');
            setSlugMessage(res.message || 'Slug available for your brand.');
            setSuggestedSlug(null);
          } else {
            setSlugStatus('taken');
            setSlugMessage(res.message || 'Slug already taken.');
            setSuggestedSlug(res.suggestedSlug || null);
          }
        })
        .catch(() => {
          setSlugStatus('idle');
        });
    }, 380);
  }, []);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!slugTouched) {
      const generated = slugify(val);
      setSlug(generated);
      checkSlugAvailability(generated, val);
    }
  };

  const handleSlugChange = (val: string) => {
    setSlugTouched(true);
    const cleaned = slugify(val);
    setSlug(cleaned);
    checkSlugAvailability(cleaned, name);
  };

  const handlePresetClick = (preset: string) => {
    setName(preset);
    const derivedSlug = slugify(preset);
    setSlug(derivedSlug);
    setSlugTouched(false);

    // Auto-select smart try-on mapping
    const lower = preset.toLowerCase();
    if (lower.includes('dress') || lower.includes('gown')) {
      setTryOnCategory('dresses');
    } else if (lower.includes('pant') || lower.includes('jean') || lower.includes('skirt') || lower.includes('short')) {
      setTryOnCategory('bottoms');
    } else if (lower.includes('jacket') || lower.includes('coat') || lower.includes('blazer') || lower.includes('outerwear')) {
      setTryOnCategory('outerwear');
    } else if (lower.includes('top') || lower.includes('shirt') || lower.includes('polo') || lower.includes('knit') || lower.includes('sweater')) {
      setTryOnCategory('tops');
    } else if (lower.includes('accessor')) {
      setTryOnCategory('none');
    }

    checkSlugAvailability(derivedSlug, preset);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanName = name.trim();
    if (cleanName.length < 2) {
      setErrorMessage('Category name must be at least 2 characters.');
      return;
    }

    const cleanSlug = slugify(slug || cleanName);
    if (slugStatus === 'taken') {
      setErrorMessage(`The slug "${cleanSlug}" is already in use. Please choose another slug or use "${suggestedSlug}".`);
      return;
    }

    setSaving(true);
    try {
      const created = await brandWorkspaceApi.addCategory({
        name: cleanName,
        slug: cleanSlug,
        description: description.trim() || undefined,
        seoTitle: seoTitle.trim() || undefined,
        parentCategory: parentCategory.trim() || undefined,
        tryOnCategory,
        sortOrder: Number(sortOrder) || 0,
        active,
      });

      showToast(`Category "${created.name}" created successfully.`);
      router.push('/dashboard/products/categories');
    } catch (err) {
      setErrorMessage(formatApiError(err, 'Failed to save product category to brand catalog.'));
    } finally {
      setSaving(false);
    }
  };

  const presets = options?.presets && options.presets.length > 0 ? options.presets : DEFAULT_PRESETS;
  const existingCategories = options?.existingCategories || [];

  return (
    <PermissionGate module="products" action="create">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Product Management / Categories"
          title="Add New Product Category"
          subtitle="Define brand taxonomy and virtual try-on classification for storefront discovery."
          actions={
            <div className="flex items-center gap-2">
              <Link href="/dashboard/products/categories">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Categories
                </Button>
              </Link>
              <Button
                size="sm"
                disabled={saving || name.trim().length < 2}
                onClick={handleSave}
                className="gap-1.5"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                {saving ? 'Saving...' : 'Save Category'}
              </Button>
            </div>
          }
        />

        <ProductsNavTabs activeTab="categories" />

        {errorMessage && (
          <ErrorBanner message={errorMessage} onDismiss={() => setErrorMessage(null)} />
        )}

        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Form Fields (8 Columns) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Card 1: Category Identification */}
            <SectionCard
              title="1. Category Identification"
              subtitle="Brand-scoped taxonomy node used across product creation, navigation tabs, and filters"
            >
              <div className="space-y-4 text-xs">
                {/* Popular Presets */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-slate-700">Quick Fashion Presets</label>
                    <span className="text-[11px] text-slate-400">Click to prefill</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {presets.slice(0, 10).map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handlePresetClick(preset)}
                        className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-colors ${
                          name.toLowerCase() === preset.toLowerCase()
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">
                      Category Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="e.g. Silk Evening Dresses, Casual Blazers, Linen Pants"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10 text-xs font-semibold text-slate-900"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-700">URL Slug</label>
                      {slugStatus === 'checking' && (
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Loader2 className="w-2.5 h-2.5 animate-spin" /> Checking...
                        </span>
                      )}
                      {slugStatus === 'available' && (
                        <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Available
                        </span>
                      )}
                      {slugStatus === 'taken' && (
                        <span className="text-[10px] text-rose-600 font-bold flex items-center gap-0.5">
                          <XCircle className="w-2.5 h-2.5" /> Taken
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-[11px]">
                        /
                      </span>
                      <input
                        type="text"
                        value={slug}
                        onChange={(e) => handleSlugChange(e.target.value)}
                        placeholder="silk-evening-dresses"
                        className={`w-full pl-6 pr-3 py-2 rounded-xl border text-xs font-mono ${
                          slugStatus === 'taken'
                            ? 'border-rose-300 bg-rose-50/50 text-rose-900'
                            : slugStatus === 'available'
                            ? 'border-emerald-300 bg-emerald-50/30 text-emerald-900'
                            : 'border-slate-200 bg-white text-slate-800'
                        }`}
                      />
                    </div>
                    {slugStatus === 'taken' && suggestedSlug && (
                      <p className="mt-1 text-[11px] text-slate-500">
                        Suggested available:{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setSlug(suggestedSlug);
                            setSlugStatus('available');
                            setSuggestedSlug(null);
                          }}
                          className="font-bold text-slate-900 underline hover:text-indigo-600"
                        >
                          {suggestedSlug}
                        </button>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Parent / Group Category (Optional)
                    </label>
                    <select
                      value={parentCategory}
                      onChange={(e) => setParentCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800"
                    >
                      <option value="">None (Top-Level Category)</option>
                      {existingCategories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Card 2: Virtual Try-On & Taxonomy Classification */}
            <SectionCard
              title="2. Virtual Try-On Classification & Ordering"
              subtitle="Maps garments in this category to AI VTON neural body segmentation models"
            >
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Default Try-On Garment Class
                  </label>
                  <p className="text-[11px] text-slate-500 mb-3">
                    When apparel items are added to this category, this class is preselected for AI neural fitting.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {TRY_ON_OPTIONS.map((opt) => (
                      <div
                        key={opt.value}
                        onClick={() => setTryOnCategory(opt.value)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          tryOnCategory === opt.value
                            ? 'border-slate-950 bg-slate-950 text-white shadow-sm'
                            : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold mb-1">
                          <span>{opt.label}</span>
                          {tryOnCategory === opt.value && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <p
                          className={`text-[10px] leading-relaxed ${
                            tryOnCategory === opt.value ? 'text-slate-300' : 'text-slate-500'
                          }`}
                        >
                          {opt.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Display Sort Order
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={9999}
                      value={sortOrder}
                      onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Lower numbers appear first in catalog filters (e.g. 10, 20, 30).
                    </p>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Storefront Catalog Visibility
                    </label>
                    <div className="flex items-center gap-3 pt-2">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={(e) => setActive(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900"></div>
                      </label>
                      <span className="font-bold text-slate-800 text-xs">
                        {active ? 'Published & Active' : 'Hidden / Draft'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Inactive categories remain hidden from storefront customers.
                    </p>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Card 3: SEO & Discoverability */}
            <SectionCard
              title="3. Storefront SEO & Description"
              subtitle="Enhance category discovery on search engines and tenant storefront pages"
            >
              <div className="space-y-4 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">SEO Meta Title</label>
                    <span className="text-[10px] text-slate-400">{seoTitle.length}/60 chars</span>
                  </div>
                  <input
                    type="text"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder={`e.g. ${name || 'Category'} | ${profile.name} Official Catalog`}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">Category Description</label>
                    <span className="text-[10px] text-slate-400">{description.length}/1000 chars</span>
                  </div>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe this category collection for shoppers and search crawlers..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800"
                  />
                </div>
              </div>
            </SectionCard>
          </div>

          {/* Sidebar / Live Preview (4 Columns) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Live Storefront Preview Card */}
            <SectionCard title="Storefront Category Preview">
              <div className="space-y-3 text-xs">
                <div className="p-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {parentCategory ? `${parentCategory} > ` : ''}Category
                      </span>
                      <h4 className="text-sm font-extrabold text-slate-900 mt-0.5">
                        {name || 'New Category Name'}
                      </h4>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {active ? 'Published' : 'Hidden'}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">
                    {description || 'Category description will appear here on your storefront catalog landing page.'}
                  </p>

                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[10px]">
                    <span className="font-mono text-slate-400 truncate max-w-[150px]">
                      /{slug || 'slug'}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold uppercase">
                      VTON: {tryOnCategory}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-blue-100 bg-blue-50/60 text-blue-900 text-[11px] space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>Automatic Product Sync</span>
                  </p>
                  <p className="leading-relaxed text-blue-800">
                    Once created, <strong>{name || 'this category'}</strong> will immediately be available in your{' '}
                    <strong>Add Product</strong> forms and catalog filters.
                  </p>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={saving || name.trim().length < 2}
                    className="w-full gap-1.5"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    {saving ? 'Creating Category...' : 'Confirm & Add Category'}
                  </Button>
                </div>
              </div>
            </SectionCard>

            {/* Quick Tips */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-2.5 text-xs text-slate-600">
              <p className="font-bold text-slate-900 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                <span>Taxonomy Tips</span>
              </p>
              <ul className="space-y-1.5 list-disc pl-4 text-[11px] text-slate-600 leading-relaxed">
                <li>Keep category names clear and descriptive for customer navigation.</li>
                <li>Choosing the correct <strong>Try-On Class</strong> ensures AI models apply clothes to the right body regions.</li>
                <li>Categories are private to <strong>{profile.name}</strong> and never conflict across tenants.</li>
              </ul>
            </div>
          </div>
        </form>
      </div>
    </PermissionGate>
  );
}
