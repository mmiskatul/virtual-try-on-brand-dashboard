'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';

/** The three tabs of the product section: Products, Categories, Collections. */
export function ProductsNavTabs() {
  const pathname = usePathname() || '';
  const productCount = useWorkspaceStore((s) => s.products.length);

  const onCategories = pathname.startsWith('/dashboard/categories');
  const onCollections = pathname.startsWith('/dashboard/collections');

  const tabs = [
    { label: 'Products', href: '/dashboard/products', active: !onCategories && !onCollections, badge: productCount },
    { label: 'Categories', href: '/dashboard/categories', active: onCategories },
    { label: 'Collections', href: '/dashboard/collections', active: onCollections },
  ];

  return (
    <nav aria-label="Product section" className="flex gap-2 overflow-x-auto no-scrollbar pb-1 text-xs font-bold">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={tab.active ? 'page' : undefined}
          className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border px-3.5 py-2 transition-colors ${
            tab.active
              ? 'border-slate-950 bg-slate-950 text-white shadow-sm'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-950'
          }`}
        >
          <span>{tab.label}</span>
          {typeof tab.badge === 'number' && tab.badge > 0 && (
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                tab.active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {tab.badge}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}
