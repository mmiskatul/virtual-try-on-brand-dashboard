'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { Fabric } from '../../types';

interface FabricsProps {
  fabrics: Fabric[];
  onAddFabric: () => void;
}

export function FabricsModule({ fabrics, onAddFabric }: FabricsProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-base text-gray-900">Fabric & Texture Library</h3>
          <p className="text-xs text-gray-500">Define physical composition and care specs for your apparel line.</p>
        </div>
        <button
          onClick={onAddFabric}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black text-white font-bold text-xs"
        >
          <Plus className="w-4 h-4" /> Add Material Spec
        </button>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {fabrics.map(f => (
          <div key={f.id} className="glass-panel p-5 rounded-2xl border border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-gray-900">{f.name}</h4>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-gray-100 text-black border border-gray-300">
                {f.stretch} STRETCH
              </span>
            </div>
            <div className="text-xs space-y-1.5 text-gray-700">
              <p><span className="text-gray-500">Composition:</span> {f.composition}</p>
              <p><span className="text-gray-500">Weight & Thickness:</span> {f.thickness}</p>
              <p><span className="text-gray-500">Care Instructions:</span> {f.care}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
