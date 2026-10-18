'use client';

import { useEffect } from 'react';
import { Button } from '../components/ui/button';

export default function BrandDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Brand Portal operational error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-6 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-widest text-sky-400 font-semibold px-2.5 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20">
            Brand Workspace Error
          </span>
          <h2 className="text-2xl font-bold text-white tracking-tight pt-1">
            Portal Service Disruption
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            The merchant dashboard encountered an error syncing apparel catalog or pipeline state. Your inventory records remain secure.
          </p>
        </div>

        {error.digest && (
          <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 text-left">
            <p className="text-[10px] font-mono text-slate-500">Incident Digest:</p>
            <p className="text-xs font-mono text-slate-300 truncate">{error.digest}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            onClick={() => reset()}
            className="flex-1 bg-sky-600 hover:bg-sky-500 text-white font-medium shadow-lg shadow-sky-600/20"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reload Module
          </Button>

          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="flex-1 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            Hard Refresh
          </Button>
        </div>
      </div>
    </div>
  );
}
