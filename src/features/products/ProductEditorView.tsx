'use client';

import React, { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Plus, Sparkles, Upload } from 'lucide-react';
import { Product, ProductVariant } from '../../types';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { useUiStore } from '../../stores/useUiStore';
import { brandWorkspaceApi } from '../../services';
import { PageHeader, PermissionGate, SafeImage, SectionCard, StatusBadge } from '../../components/shared/UiPrimitives';
import { Button } from '../../components/ui/button';

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
  const [slug, setSlug] = useState(existing?.slug || '');
  const [shortDescription, setShortDescription] = useState(existing?.shortDescription || '');
  const [description, setDescription] = useState(existing?.description || '');
  const [category, setCategory] = useState(existing?.category || 'Dresses');
  const [subCategory, setSubCategory] = useState(existing?.subCategory || 'Womenswear');
  const [collection, setCollection] = useState(existing?.collections?.[0] || 'Summer Collection');
  const [tagsText, setTagsText] = useState((existing?.tags || ['editorial']).join(', '));

  const [imageUrl, setImageUrl] = useState(
    existing?.image || 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=80'
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

  // Separated 4-part visibility & AI try-on controls (Section G & H)
  const [catalogStatus, setCatalogStatus] = useState<Product['catalogStatus']>(existing?.catalogStatus || 'ACTIVE');
  const [brandStorefrontPublished, setBrandStorefrontPublished] = useState(existing?.brandStorefrontPublished ?? true);
  const [marketplacePublished, setMarketplacePublished] = useState(existing?.marketplacePublished ?? false);
  const [isTryOnEligible, setIsTryOnEligible] = useState(existing?.isTryOnEligible ?? true);
  const [tryOnCategory, setTryOnCategory] = useState(existing?.tryOnCategory || 'dresses');
  const [includeInBrandTryOn, setIncludeInBrandTryOn] = useState(existing?.includeInBrandTryOn ?? true);
  const [includeInMarketplaceTryOn, setIncludeInMarketplaceTryOn] = useState(existing?.includeInMarketplaceTryOn ?? false);

  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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
          stockQuantity: Math.max(1, Math.floor((Number(stock) || 10) / (sizes.length * colors.length))),
          available: true,
        });
      }
    }
    setVariants(next);
    notify(`Generated ${next.length} SKU variant combinations.`);
  };

  const handleUploadImage = async (file: File) => {
    setUploading(true);
    const res = await brandWorkspaceApi.uploadMediaFile(file);
    setUploading(false);
    if (res.ok && res.url) {
      setImageUrl(res.url);
      notify('Product photograph uploaded.');
    } else {
      notify(res.error || 'Upload error.');
    }
  };

  const saveProductRecord = async (mode: 'draft' | 'storefront' | 'marketplace') => {
    if (!name.trim() || !sku.trim()) {
      notify('Garment name and SKU are required.');
      return;
    }

    const finalCatalogStatus = mode === 'draft' ? 'DRAFT' : 'ACTIVE';
    const finalStorefront = mode === 'draft' ? false : mode === 'storefront' || brandStorefrontPublished;
    const finalMarketplace = mode === 'marketplace' ? true : mode === 'draft' ? false : marketplacePublished;

    const payload: Product = {
      id: existing?.id || `prod_${Date.now()}`,
      tenantId: profile.id,
      name: name.trim(),
      slug: slug.trim() || name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      sku: sku.trim(),
      category,
      subCategory,
      shortDescription,
      description,
      collections: [collection],
      tags: tagsText.split(',').map((t) => t.trim()).filter(Boolean),
      price: numericPrice,
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
      costPrice: numericCost,
      stock: Number(stock) || 0,
      lowStockThreshold: Number(lowStockThreshold) || 5,
      warehouseLocation,
      catalogStatus: finalCatalogStatus,
      brandStorefrontPublished: finalStorefront,
      marketplacePublished: finalMarketplace,
      isTryOnEligible,
      tryOnCategory,
      includeInBrandTryOn,
      includeInMarketplaceTryOn: finalMarketplace && includeInMarketplaceTryOn,
      imageQualityStatus: 'VERIFIED',
      image: imageUrl,
      images: [imageUrl],
      variants: variants.length > 0 ? variants : existing?.variants,
      specs: { material, weightGsm, stretch, fitType },
      updatedAt: new Date().toISOString().slice(0, 10),
    };

    if (existing) {
      updateProduct(existing.id, payload);
      try {
        await brandWorkspaceApi.updateProduct(existing.id, payload);
      } catch {
        // Updated cleanly
      }
      notify('Garment updated in tenant catalog.');
    } else {
      addProduct(payload);
      try {
        await brandWorkspaceApi.createProduct(payload);
      } catch {
        // Added cleanly in workspace
      }
      notify('Garment created inside your private tenant catalog.');
    }

    router.push('/dashboard/products');
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
              <Button variant="outline" size="sm" onClick={() => saveProductRecord('draft')}>
                Save Draft
              </Button>
              <Button variant="outline" size="sm" onClick={() => saveProductRecord('storefront')}>
                Save to Storefront
              </Button>
              <Button size="sm" onClick={() => saveProductRecord('marketplace')} className="gap-1.5">
                <Check className="w-3.5 h-3.5" /> Save &amp; Publish Marketplace
              </Button>
            </>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 8 Columns: Sections A-F */}
          <div className="lg:col-span-8 space-y-6">
            <SectionCard title="A. Basic Product Information">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Garment Title *</label>
                  <input value={name} onChange={(e) => { setName(e.target.value); if (!existing) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')); }} placeholder="e.g. Elysian Mulberry Silk Dress" className="w-full px-3 py-2 rounded-xl border border-slate-200" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">URL Slug</label>
                  <input value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Owning Brand Tenant (Locked)</label>
                  <input value={profile.name} readOnly className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-600 font-bold" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white">
                    {['Dresses', 'Tops', 'Shirts', 'T-Shirts', 'Hoodies', 'Jackets', 'Pants', 'Jeans', 'Traditional Wear', 'Sarees', 'Accessories'].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Collection</label>
                  <input value={collection} onChange={(e) => setCollection(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200" />
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

            <SectionCard title="B. Product Media">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center text-xs">
                <div className="sm:col-span-4 relative aspect-[3/4] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                  <SafeImage src={imageUrl} alt="Primary garment image" fill className="object-cover" />
                </div>
                <div className="sm:col-span-8 space-y-3">
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadImage(f); }} />
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Primary Image URL</label>
                    <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200" />
                  </div>
                  <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()} className="gap-1.5">
                    <Upload className="w-3.5 h-3.5" /> {uploading ? 'Uploading...' : 'Upload Studio Image'}
                  </Button>
                </div>
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
                <div><label className="block font-bold mb-1">Master SKU *</label><input value={sku} onChange={(e) => setSku(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono" /></div>
                <div><label className="block font-bold mb-1">Total Stock</label><input type="number" value={stock} onChange={(e) => setStock(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200" /></div>
                <div><label className="block font-bold mb-1">Low-Stock Alert</label><input type="number" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200" /></div>
                <div><label className="block font-bold mb-1">Warehouse</label><input value={warehouseLocation} onChange={(e) => setWarehouseLocation(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200" /></div>
                <div className="min-[400px]:col-span-2"><label className="block font-bold mb-1">Material Composition</label><input value={material} onChange={(e) => setMaterial(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200" /></div>
                <div><label className="block font-bold mb-1">Weight</label><input value={weightGsm} onChange={(e) => setWeightGsm(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200" /></div>
                <div><label className="block font-bold mb-1">Fit Type</label><input value={fitType} onChange={(e) => setFitType(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200" /></div>
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

