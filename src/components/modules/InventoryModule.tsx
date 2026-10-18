'use client';

import React from 'react';
import Image from 'next/image';
import { Product } from '../../types';

interface InventoryProps {
  products: Product[];
  onAddStock: (id: string, delta: number) => void;
  onDeductStock: (id: string, delta: number) => void;
}

export function InventoryModule({ products, onAddStock, onDeductStock }: InventoryProps) {
  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <h3 className="font-bold text-base text-white">Concurrency-Safe Stock Adjustment</h3>
        <p className="text-xs text-slate-400">Simulate incoming warehouse shipments or inventory reconciliations.</p>

        <div className="grid grid-cols-3 gap-4">
          {products.map((p) => (
            <div key={p.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center gap-3">
                <Image
                  src={p.image}
                  alt={p.name}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-lg object-cover"
                />
                <div>
                  <p className="font-semibold text-xs text-white line-clamp-1">{p.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">Stock: <span className="text-white font-bold">{p.stock}</span></p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => onAddStock(p.id, 5)}
                  className="flex-1 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg"
                >
                  +5 Stock
                </button>
                <button
                  onClick={() => onDeductStock(p.id, 1)}
                  className="flex-1 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg"
                >
                  -1 Sale
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
