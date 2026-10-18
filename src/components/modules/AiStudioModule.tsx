import React from 'react';
import { Sparkles } from 'lucide-react';
import { BrandProfile } from '../../types';

interface AiStudioProps {
  brand: BrandProfile;
}

export function AiStudioModule({ brand }: AiStudioProps) {
  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-sky-400" /> Virtual Try-On Engine Status
            </h3>
            <p className="text-xs text-slate-400">Connected to Python FastAPI microservice (port 8000)</p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Active Adapter: VITON-HD-Composite (v2.4.0)
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <p className="text-xs text-slate-400">Total Try-On Invocations</p>
            <p className="text-xl font-black text-white mt-1">{brand.quotaUsed}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <p className="text-xs text-slate-400">Average Processing Latency</p>
            <p className="text-xl font-black text-white mt-1">26.5 ms</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <p className="text-xs text-slate-400">Try-On Success Rate</p>
            <p className="text-xl font-black text-emerald-400 mt-1">100.0%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
