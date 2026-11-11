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
        <h3 className="font-bold text-base text-gray-900">Concurrency-Safe Stock Adjustment</h3>
        <p className="text-xs text-gray-500">Simulate incoming warehouse shipments or inventory reconciliations.</p>

        <div className="grid grid-cols-3 gap-4">
          {products.map((p) => (
            <div key={p.id} className="p-4 rounded-xl bg-white border border-gray-200 space-y-3">
              <div className="flex items-center gap-3">
                <Image
                  src={p.image}
                  alt={p.name}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-lg object-cover"
                />
                <div>
                  <p className="font-semibold text-xs text-gray-900 line-clamp-1">{p.name}</p>
                  <p className="text-[10px] text-gray-500 font-mono">Stock: <span className="text-gray-900 font-bold">{p.stock}</span></p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                <button
                  onClick={() => onAddStock(p.id, 5)}
                  className="flex-1 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-lg"
                >
                  +5 Stock
                </button>
                <button
                  onClick={() => onDeductStock(p.id, 1)}
                  className="flex-1 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-lg"
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
