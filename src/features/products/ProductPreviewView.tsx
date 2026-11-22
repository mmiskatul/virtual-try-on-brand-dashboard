'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Pencil } from 'lucide-react';
import { canPerform } from '../../config/permissions';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import {
  EmptyState,
  PageHeader,
  PermissionGate,
  SafeImage,
  SectionCard,
  StatusBadge,
} from '../../components/shared/UiPrimitives';
import { Button } from '../../components/ui/button';

const money = (n?: number) =>
  typeof n === 'number' ? n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-';

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-2 text-xs last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-semibold text-slate-900">{value}</span>
    </div>
  );
}

/** Read-only view of one product. Editing happens on /dashboard/products/[id]/edit. */
export function ProductPreviewView({ productId }: { productId: string }) {
  const products = useWorkspaceStore((s) => s.products);
  const activeRole = useWorkspaceStore((s) => s.activeRole);
  const roleOverrides = useWorkspaceStore((s) => s.roleOverrides);
  const canEdit = canPerform(activeRole, 'products', 'edit', roleOverrides);
  const product = useMemo(() => products.find((p) => p.id === productId), [products, productId]);

  const gallery = useMemo(() => {
    if (!product) return [] as string[];
    return Array.from(new Set([product.image, ...(product.images || [])].filter(Boolean)));
  }, [product]);
  const [selected, setSelected] = useState(0);

  const backLink = (
    <Link href="/dashboard/products">
      <Button variant="outline" size="sm" className="gap-1.5">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Products
      </Button>
    </Link>
  );

  if (!product) {
    return (
      <PermissionGate module="products" action="view">
        <div className="space-y-6">
          <PageHeader eyebrow="Product Management" title="Product not found" actions={backLink} />
          <EmptyState
            title="This product could not be found"
            description="It may have been deleted, or the list is still loading."
          />
        </div>
      </PermissionGate>
    );
  }

  const variants = product.variants || [];
  const totalStock = variants.length > 0 ? variants.reduce((sum, v) => sum + (v.stockQuantity || 0), 0) : product.stock;
  const specs = Object.entries(product.specs || {}).filter(([, v]) => Boolean(v));

  return (
    <PermissionGate module="products" action="view">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Product Preview"
          title={product.name}
          subtitle={`${product.sku} · ${product.category}${product.subCategory ? ` / ${product.subCategory}` : ''}`}
          actions={
            <>
              {backLink}
              {canEdit && (
                <Link href={`/dashboard/products/${product.id}/edit`}>
                  <Button size="sm" className="gap-1.5">
                    <Pencil className="h-3.5 w-3.5" /> Edit product
                  </Button>
                </Link>
              )}
            </>
          }
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="space-y-3 lg:col-span-2">
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
              <SafeImage src={gallery[selected] || product.image} alt={product.name} fill className="object-cover" />
            </div>
            {gallery.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {gallery.map((src, i) => (
                  <button
                    key={`${src}-${i}`}
                    type="button"
                    onClick={() => setSelected(i)}
                    aria-label={`Show photo ${i + 1}`}
                    className={`relative h-16 w-14 shrink-0 overflow-hidden rounded-lg border ${
                      i === selected ? 'border-slate-950' : 'border-slate-200'
                    }`}
                  >
                    <SafeImage src={src} alt="" fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4 lg:col-span-3">
            <SectionCard title="Overview">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <StatusBadge status={product.catalogStatus || 'ACTIVE'} />
                {product.brandStorefrontPublished && (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">On storefront</span>
                )}
                {product.marketplacePublished && (
                  <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700">On marketplace</span>
                )}
                {product.isTryOnEligible && (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">Try-On ready</span>
                )}
              </div>
              {(product.shortDescription || product.description) && (
                <p className="mb-3 text-xs leading-relaxed text-slate-600">{product.shortDescription || product.description}</p>
              )}
              <Row label="Price" value={money(product.price)} />
              <Row label="Compare-at price" value={product.compareAtPrice ? money(product.compareAtPrice) : undefined} />
              <Row label="Total stock" value={totalStock} />
              <Row label="Collections" value={product.collections?.join(', ')} />
              <Row label="Tags" value={product.tags?.join(', ')} />
              <Row label="Try-On garment type" value={product.isTryOnEligible ? product.tryOnCategory : undefined} />
            </SectionCard>

            {variants.length > 0 && (
              <SectionCard title={`Colours & sizes (${variants.length})`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="text-[10px] uppercase tracking-wide text-slate-400">
                      <tr>
                        <th className="py-2 pr-3">Colour</th>
                        <th className="py-2 pr-3">Size</th>
                        <th className="py-2 pr-3">SKU</th>
                        <th className="py-2 pr-3">Price</th>
                        <th className="py-2 text-right">Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {variants.map((v) => (
                        <tr key={v.id} className="border-t border-slate-100">
                          <td className="py-2 pr-3">
                            <span className="inline-flex items-center gap-2">
                              {v.colorHex && (
                                <span className="h-3 w-3 rounded-full border border-slate-200" style={{ backgroundColor: v.colorHex }} />
                              )}
                              {v.color}
                            </span>
                          </td>
                          <td className="py-2 pr-3">{v.size}</td>
                          <td className="py-2 pr-3 font-mono">{v.sku}</td>
                          <td className="py-2 pr-3">{money(v.price ?? product.price)}</td>
                          <td className="py-2 text-right font-semibold">{v.stockQuantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            )}

            {specs.length > 0 && (
              <SectionCard title="Specifications">
                {specs.map(([k, v]) => (
                  <Row
                    key={k}
                    label={k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())}
                    value={String(v)}
                  />
                ))}
              </SectionCard>
            )}

            {product.description && product.shortDescription && (
              <SectionCard title="Description">
                <p className="whitespace-pre-line text-xs leading-relaxed text-slate-600">{product.description}</p>
              </SectionCard>
            )}
          </div>
        </div>
      </div>
    </PermissionGate>
  );
}
