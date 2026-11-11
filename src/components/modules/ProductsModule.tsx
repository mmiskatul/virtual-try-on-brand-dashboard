'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Search, Plus, Trash2, Sparkles, ShieldCheck } from 'lucide-react';
import { Product } from '../../types';

interface ProductsProps {
  products: Product[];
  onTogglePublication: (id: string, field: 'brandStorefrontPublished' | 'marketplacePublished') => void;
  onDeleteProduct: (id: string) => void;
  onOpenAddModal: () => void;
}

export function ProductsModule({
  products,
  onTogglePublication,
  onDeleteProduct,
  onOpenAddModal
}: ProductsProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
          <input
            type="text"
            placeholder="Search products by title, SKU, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black"
          />
        </div>

        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black hover:bg-gray-800 text-white font-bold text-xs transition-colors shadow-lg shadow-black/10"
        >
          <Plus className="w-4 h-4" /> Add New Apparel
        </button>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/80 text-gray-500 border-b border-gray-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Garment</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Stock</th>
                <th className="py-3 px-4 text-center">Storefront Visible</th>
                <th className="py-3 px-4 text-center">Marketplace Visible</th>
                <th className="py-3 px-4 text-center">AI Try-On</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 font-medium">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-100/20 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <Image
                        src={p.image}
                        alt={p.name}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-lg object-cover ring-1 ring-gray-200"
                      />
                      <div>
                        <p className="font-semibold text-gray-900">{p.name}</p>
                        <p className="text-[10px] text-gray-500 font-mono">{p.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[10px]">
                      {p.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-gray-500">{p.sku}</td>
                  <td className="py-3 px-4 font-bold text-gray-900">${p.price}</td>
                  <td className="py-3 px-4">
                    <span className={`font-semibold ${p.stock < 5 ? 'text-amber-600' : 'text-gray-700'}`}>
                      {p.stock} units
                    </span>
                  </td>

                  {/* Storefront Publication Switch */}
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => onTogglePublication(p.id, 'brandStorefrontPublished')}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
                        p.brandStorefrontPublished
                          ? 'bg-gray-100 text-black border border-gray-300'
                          : 'bg-gray-100 text-gray-500 border border-gray-300'
                      }`}
                    >
                      {p.brandStorefrontPublished ? 'Published' : 'Draft'}
                    </button>
                  </td>

                  {/* Marketplace Publication Switch */}
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => onTogglePublication(p.id, 'marketplacePublished')}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
                        p.marketplacePublished
                          ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30'
                          : 'bg-gray-100 text-gray-500 border border-gray-300'
                      }`}
                    >
                      {p.marketplacePublished ? 'Synced' : 'Hidden'}
                    </button>
                  </td>

                  {/* Try-On Badge */}
                  <td className="py-3 px-4 text-center">
                    {p.isTryOnEligible ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-gray-100 text-black border border-gray-300 text-[10px] font-semibold">
                        <Sparkles className="w-3 h-3" /> Enabled
                      </span>
                    ) : (
                      <span className="text-gray-600 text-[10px]">Disabled</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onDeleteProduct(p.id)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                      title="Delete Garment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white/50 border border-gray-200 p-4 rounded-xl flex items-start gap-3 text-xs text-gray-500">
        <ShieldCheck className="w-5 h-5 text-black shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-gray-800">Clean Architectural Channel Separation:</p>
          <p className="mt-1">
            Brand owners have independent control over their standalone boutique storefront and the central customer marketplace.
            Unpublishing from the marketplace immediately removes the item from the central discovery feed without affecting your private brand storefront.
          </p>
        </div>
      </div>
    </div>
  );
}
