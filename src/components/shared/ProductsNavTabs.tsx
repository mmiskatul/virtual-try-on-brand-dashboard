'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';

export interface ProductNavTab {
  key: 'list' | 'categories' | 'collections' | 'attributes' | 'import' | 'export';
  label: string;
  href: string;
  badge?: number;
}

export function ProductsNavTabs({
  activeTab,
  editingProductName,
}: {
  activeTab?: ProductNavTab['key'] | 'addproduct' | 'edit';
  editingProductName?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const prefetchedRef = useRef<Set<string>>(new Set());

  const products = useWorkspaceStore((s) => s.products);
  const fabrics = useWorkspaceStore((s) => s.fabrics);

  const tabs: ProductNavTab[] = [
    { key: 'list', label: 'All Products', href: '/dashboard/products', badge: products.length },
    { key: 'categories', label: 'Categories', href: '/dashboard/products/categories' },
    { key: 'collections', label: 'Collections', href: '/dashboard/products/collections' },
    { key: 'attributes', label: 'Attributes & Fabrics', href: '/dashboard/products/attributes', badge: fabrics.length },
    { key: 'import', label: 'Bulk CSV Import', href: '/dashboard/products/import' },
    { key: 'export', label: 'Export Catalog', href: '/dashboard/products/export' },
  ];

  const prefetchTab = (href: string) => {
    if (prefetchedRef.current.has(href)) return;
    prefetchedRef.current.add(href);
    try {
      router.prefetch(href);
    } catch {
      // Non-blocking
    }
  };

  const isEditingExisting = activeTab === 'edit';

  return (
    <nav
      aria-label="Product Management Navigation"
      className="flex gap-2 overflow-x-auto no-scrollbar pb-1 text-xs font-bold"
    >
      {tabs.map((tab) => {
        const isActive = activeTab ? activeTab === tab.key : pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            onMouseEnter={() => prefetchTab(tab.href)}
            onFocus={() => prefetchTab(tab.href)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border whitespace-nowrap transition-colors ${
              isActive
                ? 'bg-slate-950 text-white border-slate-950 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:text-slate-950 hover:border-slate-300'
            }`}
          >
            <span>{tab.label}</span>
            {typeof tab.badge === 'number' && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </Link>
        );
      })}
      {isEditingExisting && (
        <span className="inline-flex items-center px-3.5 py-2 rounded-xl border whitespace-nowrap bg-amber-50 text-amber-900 border-amber-200">
          Editing: {editingProductName ? editingProductName.slice(0, 28) : 'Garment'}
        </span>
      )}
    </nav>
  );
}
