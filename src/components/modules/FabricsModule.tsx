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
          <h3 className="font-bold text-base text-white">Fabric & Texture Library</h3>
          <p className="text-xs text-slate-400">Define physical composition and care specs for your apparel line.</p>
        </div>
        <button
          onClick={onAddFabric}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-sky-500 text-slate-950 font-bold text-xs"
        >
          <Plus className="w-4 h-4" /> Add Material Spec
        </button>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {fabrics.map(f => (
          <div key={f.id} className="glass-panel p-5 rounded-2xl border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-white">{f.name}</h4>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-500/10 text-sky-400 border border-sky-500/20">
                {f.stretch} STRETCH
              </span>
            </div>
            <div className="text-xs space-y-1.5 text-slate-300">
              <p><span className="text-slate-400">Composition:</span> {f.composition}</p>
              <p><span className="text-slate-400">Weight & Thickness:</span> {f.thickness}</p>
              <p><span className="text-slate-400">Care Instructions:</span> {f.care}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
